from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, Case, When, IntegerField
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

    # Add this import at the top
from .models import (
    Offer, Assignment, Student, TAScheduler, Application, ApplicationShortList,
    CourseOffering, SharedSession, Course, OfferItem  # ← Add OfferItem
)
from .serializers import OfferSerializer, AssignmentSerializer, ShortlistedApplicantSerializer

# Import shared auth utilities
from auth_utils.decorators import admin_required, scheduler_required, authenticated_required, student_required
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsAuthenticatedUser, IsStudentUser

# Combined permissions
IsSchedulerOrAdmin = IsSchedulerUser | IsAdminUser

class ShortlistedApplicantViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for accessing shortlisted applicants available for allocation"""
    serializer_class = ShortlistedApplicantSerializer
    permission_classes = [IsSchedulerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['application__positionType', 'application__workload', 'application__termSelection__code']
    search_fields = ['application__student__name', 'application__student__student_number', 'application__student__email']
    ordering_fields = ['created_at', 'application__applied_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get shortlisted applicants with their allocation status"""
        # Get all shortlisted applications
        shortlisted = ApplicationShortList.objects.select_related(
            'application__student',
            'application__posting',
            'application__termSelection'
        ).filter(
            application__status='submitted'  # Only submitted applications
        )
        
        return shortlisted
    
    @action(detail=False, methods=['get'])
    def available_for_allocation(self, request):
        """Get shortlisted applicants with allocation status"""
        queryset = self.get_queryset()
        
        # Additional filters
        position_type = request.query_params.get('positionType', None)
        workload = request.query_params.get('workload', None)
        term_code = request.query_params.get('term_code', None)
        allocation_status = request.query_params.get('allocation_status', None)
        
        if position_type:
            queryset = queryset.filter(application__positionType=position_type)
        if workload:
            queryset = queryset.filter(application__workload=workload)
        if term_code:
            queryset = queryset.filter(application__termSelection__code__icontains=term_code)
        
        # Enhanced serializer data with allocation status
        serializer_data = []
        for shortlisted_app in queryset:
            student = shortlisted_app.application.student
            
            # Calculate current allocation
            current_allocation = self.calculate_student_allocation(student)
            max_hours = int(shortlisted_app.application.workload) if shortlisted_app.application.workload else 0
            
            # Determine allocation status
            if current_allocation['total_hours'] == 0:
                status_label = "Not Allocated"
            elif current_allocation['total_hours'] >= max_hours:
                status_label = "Fully Allocated"
            else:
                status_label = "Partially Allocated"
            
            # Apply allocation status filter if provided
            if allocation_status and allocation_status.lower() != status_label.lower().replace(' ', '_'):
                continue
            
            # Serialize the data
            serializer = self.get_serializer(shortlisted_app)
            data = serializer.data
            
            # Add allocation information
            data['allocation_status'] = {
                'status': status_label,
                'current_hours': current_allocation['total_hours'],
                'max_hours': max_hours,
                'available_hours': max_hours - current_allocation['total_hours'],
                'pending_offers_hours': current_allocation['pending_offers_hours'],
                'active_assignments_hours': current_allocation['active_assignments_hours']
            }
            
            serializer_data.append(data)
        
        return Response(serializer_data)
    
    def calculate_student_allocation(self, student):
        """Calculate student's current allocation status using the new multi-item structure"""
        # Get pending offers HOURS (calculated from offer items)
        pending_offers_hours = 0
        for offer in Offer.objects.filter(student=student, status='pending'):
            pending_offers_hours += offer.total_weekly_hours  # ← Use the property method
        
        # Get active assignments HOURS (calculated from time slots)
        active_assignments_hours = 0
        for assignment in Assignment.objects.filter(student=student, is_active=True):
            active_assignments_hours += assignment.weekly_hours  # ← Use the property method
        
        return {
            'pending_offers_hours': pending_offers_hours,
            'active_assignments_hours': active_assignments_hours,
            'total_hours': pending_offers_hours + active_assignments_hours
        }

class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # *** FIXED: Remove total_required_hours from filterset_fields ***
    filterset_fields = ['status', 'role']  # ← Removed 'total_required_hours'
    search_fields = ['student__name', 'student__student_number']
    ordering_fields = ['offer_date', 'response_deadline', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        - Students can view/respond to their own offers
        - Schedulers/Admins can manage all offers
        """
        if self.action in ['respond_to_offer']:
            return [IsStudentUser()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'create_offer']:
            return [IsSchedulerOrAdmin()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter offers based on user role"""
        self.expire_old_offers()
        queryset = Offer.objects.select_related('student', 'application', 'created_by').all()
        
        # Check if JWT token exists
        if not hasattr(self.request, 'auth') or not self.request.auth:
            return queryset.none()
        
        user_type = self.request.auth.payload.get('user_type', None)
        user_id = self.request.auth.payload.get('sub', None)
        
        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                return queryset.filter(student_id=student_model_id)
            return queryset.none()
        
        if user_type in ['scheduler', 'admin']:
            return queryset
        
        return queryset.none()
    
    def expire_old_offers(self):
        """Automatically expire offers that have passed deadline"""
        expired_offers = Offer.objects.filter(
            status='pending',
            response_deadline__lt=timezone.now()
        )
        expired_offers.update(
            status='expired',
            updated_at=timezone.now()
        )

    @action(detail=False, methods=['get'])
    def expired_offers(self, request):
        """Get all expired offers"""
        # Make sure expired offers are updated first
        self.expire_old_offers()
        
        expired_offers = self.get_queryset().filter(status='expired')
        serializer = self.get_serializer(expired_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def respond_to_offer(self, request, pk=None):
        """Allow student to respond to a multi-item offer"""
        offer = self.get_object()
        
        # Auto-check expiration before allowing response
        if offer.check_and_update_expiration():
            return Response(
                {'error': 'This offer has expired and can no longer be responded to'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_student_model_id(self, user_id):
        """Map JWT user_id to Student model ID - FIXED to match auth-service pattern"""
        try:
            # user_id from JWT 'sub' claim is actually the student_number, not database ID
            student = Student.objects.get(student_number=user_id)
            return student.id
        except Student.DoesNotExist:
            # Fallback: try by email if student_number doesn't work
            try:
                from django.contrib.auth.models import User
                user = User.objects.get(username=user_id)  # username might be email
                student = Student.objects.get(email=user.email)
                return student.id
            except (User.DoesNotExist, Student.DoesNotExist):
                return None
        
    # Update the create_offer method in OfferViewSet
    @action(detail=False, methods=['post'])
    def create_offer(self, request):
        """Create a new multi-item offer for a shortlisted student"""
        from datetime import datetime
        from django.utils import timezone
        
        application_id = request.data.get('application_id')
        offer_items = request.data.get('offer_items', [])
        response_deadline_str = request.data.get('response_deadline')
        notes = request.data.get('notes', '')
        
        # Backward compatibility: single item offer
        course_offering_id = request.data.get('course_offering_id')
        shared_session_id = request.data.get('shared_session_id')
        
        # If no offer_items provided, create from single item (backward compatibility)
        if not offer_items and (course_offering_id or shared_session_id):
            if course_offering_id and shared_session_id:
                return Response(
                    {'error': 'Provide either course_offering_id OR shared_session_id, not both'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if course_offering_id:
                offer_items = [{
                    'item_type': 'course_offering',
                    'course_offering_id': course_offering_id
                }]
            elif shared_session_id:
                offer_items = [{
                    'item_type': 'shared_session',
                    'shared_session_id': shared_session_id
                }]
        
        # Validate offer_items
        if not offer_items or not isinstance(offer_items, list):
            return Response(
                {'error': 'offer_items must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse response_deadline
        response_deadline = None
        if response_deadline_str:
            try:
                if response_deadline_str.endswith('Z'):
                    response_deadline_str = response_deadline_str[:-1] + '+00:00'
                response_deadline = datetime.fromisoformat(response_deadline_str)
                if response_deadline.tzinfo is None:
                    response_deadline = timezone.make_aware(response_deadline)
            except ValueError as e:
                return Response(
                    {'error': f'Invalid response_deadline format: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check authentication
        if not hasattr(request, 'auth') or not request.auth:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_type = request.auth.payload.get('user_type', None)
        user_id = request.auth.payload.get('sub', None)
        
        if user_type not in ['scheduler', 'admin']:
            return Response(
                {'error': 'Only schedulers and admins can create offers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Verify the application is shortlisted
            shortlisted_app = ApplicationShortList.objects.select_related(
                'application__student'
            ).get(application_id=application_id)
            
            application = shortlisted_app.application
            student = application.student
            
            # Validate and process offer items
            total_hours = 0
            validated_items = []
            offer_courses = set()
            offer_terms = set()
            
            for item_data in offer_items:
                item_type = item_data.get('item_type')
                
                if item_type == 'course_offering':
                    course_offering_id = item_data.get('course_offering_id')
                    try:
                        course_offering = CourseOffering.objects.select_related('course', 'academic_term').prefetch_related('time_slots').get(
                            course_offering_id=course_offering_id
                        )
                        
                        # Calculate hours automatically from time slots
                        temp_offer_item = OfferItem(
                            item_type='course_offering',
                            course_offering=course_offering
                        )
                        calculated_hours = temp_offer_item.weekly_hours
                        
                        validated_items.append({
                            'type': 'course_offering',
                            'object': course_offering,
                            'hours': calculated_hours,
                            'course': course_offering.course,
                            'term': course_offering.academic_term
                        })
                        
                        offer_courses.add(course_offering.course)
                        offer_terms.add(course_offering.academic_term)
                        total_hours += calculated_hours
                        
                    except CourseOffering.DoesNotExist:
                        return Response(
                            {'error': f'Course offering {course_offering_id} not found'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                
                elif item_type == 'shared_session':
                    shared_session_id = item_data.get('shared_session_id')
                    try:
                        shared_session = SharedSession.objects.select_related('course', 'academic_term').prefetch_related('time_slots').get(
                            shared_session_id=shared_session_id
                        )
                        
                        # Calculate hours automatically from time slots
                        temp_offer_item = OfferItem(
                            item_type='shared_session',
                            shared_session=shared_session
                        )
                        calculated_hours = temp_offer_item.weekly_hours
                        
                        validated_items.append({
                            'type': 'shared_session',
                            'object': shared_session,
                            'hours': calculated_hours,  # ← Now calculated from time slots
                            'course': shared_session.course,
                            'term': shared_session.academic_term
                        })
                        
                        offer_courses.add(shared_session.course)
                        offer_terms.add(shared_session.academic_term)
                        total_hours += calculated_hours
                        
                    except SharedSession.DoesNotExist:
                        return Response(
                            {'error': f'Shared session {shared_session_id} not found'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                
                else:
                    return Response(
                        {'error': f'Invalid item_type: {item_type}. Must be "course_offering" or "shared_session"'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if student would exceed their maximum hours
            current_allocation = self.calculate_student_allocation(student)
            try:
                max_hours = int(application.workload) if application.workload else 12
                max_hours = min(max_hours, 12)
            except (ValueError, TypeError):
                max_hours = 12

            if current_allocation['total_hours'] + total_hours > max_hours:
                return Response(
                    {
                        'error': f'This offer would exceed student\'s maximum hours. '
                                f'Current: {current_allocation["total_hours"]}, '
                                f'Max: {max_hours}, '
                                f'Requested: {total_hours}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get scheduler
            scheduler = self.get_scheduler_from_jwt(user_type, user_id)
            if not scheduler:
                return Response(
                    {'error': f'Scheduler not found for user_id: {user_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create multi-item offer
            with transaction.atomic():
                # Create the main offer first
                offer = Offer.objects.create(
                    application=application,
                    student=student,
                    response_deadline=response_deadline,
                    created_by=scheduler,
                    notes=notes
                )
                
                # Create and add offer items
                created_offer_items = []
                for item_data in validated_items:
                    if item_data['type'] == 'course_offering':
                        offer_item = OfferItem.objects.create(
                            item_type='course_offering',
                            course_offering=item_data['object']
                        )
                    else:  # shared_session
                        offer_item = OfferItem.objects.create(
                            item_type='shared_session',
                            shared_session=item_data['object']
                        )
                    
                    offer.offer_items.add(offer_item)
                    created_offer_items.append(offer_item)
            
            # Return response with all data
            serializer = self.get_serializer(offer)
            # In your create_offer method, update the return statement:
            return Response({
                'success': True,
                'message': 'Multi-item offer created successfully',
                'offer': serializer.data,  # ← Simplified: just 'offer' instead of 'offer_data'
                'summary': {
                    'offer_id': offer.offer_id,
                    'student_id': student.id,
                    'student_number': student.student_number,
                    'application_id': application.application_id,  # ← Keep reference for fetching details separately
                    'total_weekly_hours': round(total_hours, 1),
                    'item_count': len(validated_items),
                    'courses': [course.course_number for course in offer_courses],
                    'terms': [term.code for term in offer_terms]
                    # *** REMOVED: detailed items array
                }
            }, status=status.HTTP_201_CREATED)
            
        except ApplicationShortList.DoesNotExist:
            return Response(
                {'error': 'Application not found in shortlist'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_scheduler_from_jwt(self, user_type, user_id):
        """Map JWT token to TAScheduler model (following user-profile-service pattern)"""
        if user_type == 'scheduler':
            try:
                # For scheduler, user_id should map to employee_number
                return TAScheduler.objects.get(employee_number=user_id)
            except TAScheduler.DoesNotExist:
                # If not found by employee_number, try by ID
                try:
                    return TAScheduler.objects.get(id=user_id)
                except TAScheduler.DoesNotExist:
                    return None
        
        elif user_type == 'admin':
            # For admin creating offers, we need to get a default scheduler
            # or handle admin creation differently
            try:
                # Get the first active scheduler as fallback for admin actions
                return TAScheduler.objects.filter(is_active=True).first()
            except TAScheduler.DoesNotExist:
                return None
        
        return None
    
    def calculate_student_allocation(self, student):
        """Calculate student's current allocation status using actual hours from time slots"""
        # Get pending offers HOURS (calculated from time slots)
        pending_offers_hours = 0
        for offer in Offer.objects.filter(student=student, status='pending'):
            pending_offers_hours += offer.total_weekly_hours
        
        # Get active assignments HOURS (calculated from time slots)
        active_assignments_hours = 0
        for assignment in Assignment.objects.filter(student=student, is_active=True):
            active_assignments_hours += assignment.weekly_hours
        
        return {
            'pending_offers_hours': pending_offers_hours,
            'active_assignments_hours': active_assignments_hours,
            'total_hours': pending_offers_hours + active_assignments_hours
        }

    @action(detail=False, methods=['get'])
    def pending_offers(self, request):
        """Get all pending offers (not responded yet)"""
        pending_offers = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(pending_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def accepted_offers(self, request):
        """Get all accepted offers"""
        accepted_offers = self.get_queryset().filter(status='accepted')
        serializer = self.get_serializer(accepted_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def rejected_offers(self, request):
        """Get all rejected offers"""
        rejected_offers = self.get_queryset().filter(status='rejected')
        serializer = self.get_serializer(rejected_offers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def respond_to_offer(self, request, pk=None):
        """Allow student to respond to a multi-item offer"""
        offer = self.get_object()
        
        # Check if student can respond
        if not offer.can_respond():
            return Response(
                {'error': 'This offer has expired or already been responded to'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authentication and permission checks
        if not hasattr(request, 'auth') or not request.auth:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user_id = request.auth.payload.get('sub', None)
        student_model_id = self.get_student_model_id(user_id)
        
        if offer.student_id != student_model_id:
            return Response(
                {'error': 'You can only respond to your own offers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        response_status = request.data.get('status')
        student_response = request.data.get('response', '')
        
        if response_status not in ['accepted', 'rejected']:
            return Response(
                {'error': 'Status must be either "accepted" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Update offer
            offer.status = response_status
            offer.responded_at = timezone.now()
            offer.student_response = student_response
            offer.save()
            
            # Create assignments for each offer item if accepted
            if response_status == 'accepted':
                for offer_item in offer.offer_items.all():
                    Assignment.objects.create(
                        offer=offer,
                        student=offer.student,
                        course=offer_item.course,
                        course_offering=offer_item.course_offering,
                        shared_session=offer_item.shared_session,
                        role='ta',
                        assigned_by=offer.created_by,
                        notes=f"Auto-assigned from accepted offer {offer.offer_id} - {offer_item.item_type} ({offer_item.weekly_hours}h/week)"
                    )
    
        serializer = self.get_serializer(offer)
        return Response(serializer.data)

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsSchedulerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # *** REMOVE: 'required_hours' from filterset_fields ***
    filterset_fields = ['is_active', 'course_offering', 'role']  # ← Removed 'required_hours'
    search_fields = ['student__name', 'course_offering__course__course_number']
    ordering_fields = ['assigned_date']
    ordering = ['-assigned_date']
    
    def get_queryset(self):
        return Assignment.objects.select_related('student', 'offer', 'assigned_by').all()
    
    @action(detail=False, methods=['get'])
    def active_assignments(self, request):
        """Get all active assignments"""
        active_assignments = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_assignments, many=True)
        return Response(serializer.data)

# Root API View
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'TA Allocations Service is running',
        'service_scope': 'TA allocation management, offers, and assignments',
        'available_endpoints': {
            # Shortlisted Applicants
            'shortlisted_applicants': '/api/allocations/shortlisted-applicants/',
            'available_for_allocation': '/api/allocations/shortlisted-applicants/available_for_allocation/',
            
             # Offers Management
            'offers': '/api/allocations/offers/',
            'create_offer': '/api/allocations/offers/create_offer/',
            'pending_offers': '/api/allocations/offers/pending_offers/',
            'accepted_offers': '/api/allocations/offers/accepted_offers/',
            'rejected_offers': '/api/allocations/offers/rejected_offers/', 
            'expired_offers': '/api/allocations/offers/expired_offers/',  
            'respond_to_offer': '/api/allocations/offers/{offer_id}/respond_to_offer/',
                
             # Assignments Management
             'assignments': '/api/allocations/assignments/',
             'active_assignments': '/api/allocations/assignments/active_assignments/',
                
             # Service Info
            'service_info': '/api/allocations/',
         },
        'authentication': 'Required for all endpoints except root',
        'permissions': {
            'schedulers': 'Can create offers, view all offers, manage assignments',
            'students': 'Can view own offers, respond to offers',
            'admins': 'Full access to all endpoints'
        },
        'offer_lifecycle': {
            'pending': 'Offer created, awaiting student response',
            'accepted': 'Student accepted offer, assignments created',
            'rejected': 'Student rejected offer',
            'expired': 'Offer deadline passed without response (auto-updated)'
        }
    })