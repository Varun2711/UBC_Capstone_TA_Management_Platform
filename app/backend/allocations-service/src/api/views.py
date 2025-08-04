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
import requests
import logging
logger = logging.getLogger(__name__)

    # Add this import at the top
from .models import (
    Offer, Assignment, Student, TAScheduler, Instructor, Application, ApplicationShortList,
    CourseOffering, SharedSession, Course, OfferItem, AssignmentModification, TimeSlot
)
from .serializers import OfferSerializer, AssignmentSerializer, ShortlistedApplicantSerializer, AssignmentModificationSerializer

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


    def _get_coordinator_email_for_offer(self, offer):
        """Get coordinator email for an offer"""
        try:
            # Option 1: Use the scheduler who created the offer
            if offer.created_by and hasattr(offer.created_by, 'email') and offer.created_by.email:
                return offer.created_by.email
            
            # Option 2: Try to get instructor from first course offering
            first_offer_item = offer.offer_items.first()
            if first_offer_item and first_offer_item.item_type == 'course_offering':
                course_offering = first_offer_item.course_offering
                if course_offering and hasattr(course_offering, 'instructor') and course_offering.instructor and hasattr(course_offering.instructor, 'email'):
                    return course_offering.instructor.email
            
            # Option 3: Use scheduler's email as fallback
            if offer.created_by and hasattr(offer.created_by, 'name'):
                scheduler_name = offer.created_by.name.lower().replace(' ', '.')
                return f"{scheduler_name}@ubc.ca"
            
            # Final fallback
            return 'ta-coordinator@ubc.ca'
            
        except Exception as e:
            logger.error(f"Error getting coordinator email for offer {offer.offer_id}: {str(e)}")
            return 'ta-coordinator@ubc.ca'    

    # Add this temporary method to OfferViewSet in views.py
    @action(detail=False, methods=['post'])
    def debug_create_offer(self, request):
        """Temporary debug method to see what's being received"""
        import json
        
        print(f"Request data type: {type(request.data)}")
        print(f"Request data: {request.data}")
        print(f"Request body: {request.body}")
        
        try:
            if hasattr(request, 'data'):
                print(f"request.data content: {json.dumps(request.data, default=str, indent=2)}")
        except Exception as e:
            print(f"Error serializing request.data: {e}")
        
        return Response({
            'data_type': str(type(request.data)),
            'data_content': str(request.data),
            'body_content': request.body.decode('utf-8') if request.body else None
        })    
        
    # Update the create_offer method in OfferViewSet
    @action(detail=False, methods=['post'])
    def create_offer(self, request):
        """
        Create a new DRAFT multi-item offer or update an existing one for a shortlisted student.
        This endpoint handles both creation of a new draft and appending items to an existing draft.
        """
        from django.utils import timezone
        
        application_id = request.data.get('application_id')
        offer_items = request.data.get('offer_items', [])
        notes = request.data.get('notes', '')
        
        if not application_id:
            return Response({'error': 'application_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not offer_items or not isinstance(offer_items, list):
            return Response(
                {'error': 'offer_items must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check authentication
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_type = request.auth.payload.get('user_type', None)
        user_id = request.auth.payload.get('sub', None)
        
        if user_type not in ['scheduler', 'admin']:
            return Response({'error': 'Only schedulers and admins can create offers'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            shortlisted_app = ApplicationShortList.objects.select_related('application__student').get(application_id=application_id)
            application = shortlisted_app.application
            student = application.student
            
            # --- MODIFIED LOGIC: Find or Create the Draft Offer ---
            scheduler = self.get_scheduler_from_jwt(user_type, user_id)
            if not scheduler:
                return Response({'error': 'Scheduler not found'}, status=status.HTTP_404_NOT_FOUND)

            offer, created = Offer.objects.get_or_create(
                student=student,
                status='draft',
                defaults={
                    'application': application,
                    'role': 'ta',
                    'created_by': scheduler,
                    'notes': notes,
                }
            )

            # --- VALIDATE NEW ITEMS AND WORKLOAD ---
            total_new_hours = 0
            validated_new_items = []
            
            # Group items to handle shared sessions correctly
            grouped_items = {}
            for item_data in offer_items:
                item_type = item_data.get('item_type')
                if item_type == 'course_offering':
                    section_id = f"course_{item_data.get('course_offering_id')}_{item_data.get('time_slot')['day']}_{item_data.get('time_slot')['start_time']}"
                elif item_type == 'shared_session':
                    section_id = f"session_{item_data.get('shared_session_id')}"
                else:
                    continue
                if section_id not in grouped_items:
                    grouped_items[section_id] = item_data

            for item_data in grouped_items.values():
                # (This re-uses the validation logic from your original function)
                item_type = item_data.get('item_type')
                time_slot_details = item_data.get('time_slot')

                if not time_slot_details: continue # Skip if no time slot

                time_slot, _ = TimeSlot.objects.get_or_create(
                    day=time_slot_details['day'].lower(),
                    start_time=time_slot_details['start_time'],
                    end_time=time_slot_details['end_time']
                )
                
                if item_type == 'course_offering':
                    course_offering = CourseOffering.objects.get(course_offering_id=item_data.get('course_offering_id'))
                    temp_item = OfferItem(item_type='course_offering', course_offering=course_offering, time_slot=time_slot)
                    validated_new_items.append({'type': 'course_offering', 'object': course_offering, 'time_slot': time_slot})
                    total_new_hours += temp_item.weekly_hours
                
                elif item_type == 'shared_session':
                    shared_session = SharedSession.objects.get(shared_session_id=item_data.get('shared_session_id'))
                    temp_item = OfferItem(item_type='shared_session', shared_session=shared_session)
                    validated_new_items.append({'type': 'shared_session', 'object': shared_session, 'time_slot': None})
                    total_new_hours += temp_item.weekly_hours

            # Check student workload
            current_allocation = self.calculate_student_allocation(student)
            max_hours = int(application.workload) if application.workload and str(application.workload).isdigit() else 12
            
            # If offer existed, its hours are already in current_allocation. We only check the additional hours.
            hours_to_check = total_new_hours
            if not created:
                # To avoid double counting, we need a more careful check.
                # Let's calculate the hours of items we are about to add that are not already in the offer.
                hours_being_added = 0
                for item_data in validated_new_items:
                    if item_data['type'] == 'course_offering':
                        if not offer.offer_items.filter(course_offering=item_data['object'], time_slot=item_data['time_slot']).exists():
                            hours_being_added += OfferItem(item_type='course_offering', course_offering=item_data['object'], time_slot=item_data['time_slot']).weekly_hours
                    elif item_data['type'] == 'shared_session':
                        if not offer.offer_items.filter(shared_session=item_data['object']).exists():
                            hours_being_added += OfferItem(item_type='shared_session', shared_session=item_data['object']).weekly_hours
                hours_to_check = hours_being_added

            if current_allocation['total_hours'] + hours_to_check > max_hours:
                return Response({
                    'error': f'Adding {hours_to_check} hours would exceed student maximum of {max_hours} hours. Current: {current_allocation["total_hours"]} hours.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # --- ATOMICALLY ADD NEW ITEMS ---
            with transaction.atomic():
                for item_data in validated_new_items:
                    if item_data['type'] == 'course_offering':
                        # Add item only if it doesn't already exist
                        if not offer.offer_items.filter(course_offering=item_data['object'], time_slot=item_data['time_slot']).exists():
                            offer_item = OfferItem.objects.create(
                                item_type='course_offering',
                                course_offering=item_data['object'],
                                time_slot=item_data['time_slot']
                            )
                            offer.offer_items.add(offer_item)
                    elif item_data['type'] == 'shared_session':
                        # Add item only if it doesn't already exist
                        if not offer.offer_items.filter(shared_session=item_data['object']).exists():
                            offer_item = OfferItem.objects.create(
                                item_type='shared_session',
                                shared_session=item_data['object'],
                                time_slot=None
                            )
                            offer.offer_items.add(offer_item)
            
            serializer = self.get_serializer(offer)
            message = 'Draft offer updated successfully' if not created else 'Draft offer created successfully'
            http_status = status.HTTP_200_OK if not created else status.HTTP_201_CREATED

            return Response({
                'success': True,
                'message': message,
                'offer': serializer.data
            }, status=http_status)
            
        except ApplicationShortList.DoesNotExist:
            return Response({'error': 'Application not found in shortlist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in create_offer: {str(e)}")
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['post'])
    def create_modification(self, request):
        """Create an assignment modification (for schedulers)"""
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is scheduler/admin
        user_type = request.auth.payload.get('user_type', '')
        if user_type not in ['scheduler', 'admin']:
            return Response({'error': 'Only schedulers can create modifications'}, status=status.HTTP_403_FORBIDDEN)
        
        assignment_id = request.data.get('assignment_id')
        reason = request.data.get('reason', '')
        modification_type = request.data.get('modification_type', 'other')
        requires_response = request.data.get('requires_response', True)
        new_offer_items = request.data.get('offer_items', [])
        
        try:
            # Get original assignment
            original_assignment = Assignment.objects.get(
                assignment_id=assignment_id,
                is_active=True
            )
            
            with transaction.atomic():
                # Create new offer with modified items
                new_offer = Offer.objects.create(
                    application=original_assignment.offer.application,
                    student=original_assignment.student,
                    response_deadline=timezone.now() + timezone.timedelta(days=3),
                    status='pending',  # Always pending for modifications
                    created_by=self.get_scheduler_from_jwt(
                        request.auth.payload.get('user_type'),
                        request.auth.payload.get('sub')
                    ),
                    notes=f"Modification of Assignment {original_assignment.assignment_id}. Reason: {reason}"
                )
                
                # Add new offer items (same logic as create_offer)
                for item_data in new_offer_items:
                    if item_data['item_type'] == 'course_offering':
                        course_offering = CourseOffering.objects.get(
                            course_offering_id=item_data['course_offering_id']
                        )
                        offer_item = OfferItem.objects.create(
                            item_type='course_offering',
                            course_offering=course_offering
                        )
                    else:  # shared_session
                        shared_session = SharedSession.objects.get(
                            shared_session_id=item_data['shared_session_id']
                        )
                        offer_item = OfferItem.objects.create(
                            item_type='shared_session',
                            shared_session=shared_session
                        )
                    new_offer.offer_items.add(offer_item)
                
                # Create modification record
                modification = AssignmentModification.objects.create(
                    original_assignment=original_assignment,
                    new_offer=new_offer,
                    reason=reason,
                    modification_type=modification_type,
                    requires_response=requires_response,
                    created_by=self.get_scheduler_from_jwt(
                        request.auth.payload.get('user_type'),
                        request.auth.payload.get('sub')
                    )
                )
                
                # Temporarily deactivate original assignment
                original_assignment.is_active = False
                original_assignment.notes = f"Under modification - See modification {modification.modification_id}"
                original_assignment.save()
                
                # If no response required, auto-accept
                if not requires_response:
                    new_offer.status = 'accepted'
                    new_offer.save()
                    modification.status = 'auto_applied'
                    modification.save()
                    
                    # Create new assignment immediately
                    self._create_assignments_from_offer(new_offer, modification.created_by)
            
            return Response({
                'success': True,
                'message': 'Assignment modification created successfully',
                'modification_id': modification.modification_id,
                'new_offer_id': new_offer.offer_id,
                'requires_student_response': requires_response
            })
            
        except Assignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['get'])
    def pending_modifications(self, request):
        """Get pending assignment modifications for the current student"""
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_id = request.auth.payload.get('sub', None)
        student_model_id = self.get_student_model_id(user_id)
        
        # Get pending modifications for this student
        modifications = AssignmentModification.objects.filter(
            original_assignment__student_id=student_model_id,
            status='pending',
            requires_response=True
        ).select_related('original_assignment', 'new_offer', 'created_by')
        
        serializer = AssignmentModificationSerializer(modifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def respond_to_modification(self, request, pk=None):
        """Student responds to an assignment modification"""
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_id = request.auth.payload.get('sub', None)
        student_model_id = self.get_student_model_id(user_id)
        
        # Get the offer (which should be part of a modification)
        offer = self.get_object()
        
        # Find the modification
        try:
            modification = AssignmentModification.objects.get(
                new_offer=offer,
                original_assignment__student_id=student_model_id,
                status='pending'
            )
        except AssignmentModification.DoesNotExist:
            return Response({'error': 'Modification not found or already responded'}, status=status.HTTP_404_NOT_FOUND)
        
        response_status = request.data.get('status')  # 'accepted' or 'rejected'
        student_response = request.data.get('response', '')
        
        if response_status not in ['accepted', 'rejected']:
            return Response(
                {'error': 'Status must be either "accepted" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Update modification
            modification.status = response_status
            modification.student_responded_at = timezone.now()
            modification.student_response = student_response
            modification.save()
            
            # Update offer
            offer.status = response_status
            offer.responded_at = timezone.now()
            offer.student_response = student_response
            offer.save()
            
            if response_status == 'accepted':
                # Create new assignments from the accepted offer
                self._create_assignments_from_offer(offer, modification.created_by)
            else:
                # Student rejected - reactivate original assignment
                modification.original_assignment.is_active = True
                modification.original_assignment.notes = f"Modification {modification.modification_id} rejected by student on {timezone.now().strftime('%Y-%m-%d')}"
                modification.original_assignment.save()
        
        return Response({
            'message': f'Modification {response_status} successfully',
            'modification_id': modification.modification_id
        })

    def _create_assignments_from_offer(self, offer, assigned_by):
        """Helper method to create assignments from offer items"""
        for offer_item in offer.offer_items.all():
            Assignment.objects.create(
                offer=offer,
                student=offer.student,
                course=offer_item.course,
                course_offering=offer_item.course_offering,
                shared_session=offer_item.shared_session,
                role='ta',
                assigned_by=assigned_by,
                notes=f"Created from offer {offer.offer_id}"
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
    

    @action(detail=True, methods=['put', 'patch'])
    def edit_offer(self, request, pk=None):
        """Edit a draft or pending offer (only schedulers/admins)"""
        offer = self.get_object()
        
        # Check if offer can be edited (drafts or pending offers)
        if offer.status not in ['draft', 'pending']:
            return Response(
                {'error': f'Cannot edit offer with status "{offer.status}". Only draft or pending offers can be edited.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if offer has expired (only relevant for pending offers)
        if offer.status == 'pending' and offer.is_expired():
            return Response(
                {'error': 'Cannot edit expired offer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check authentication
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_type = request.auth.payload.get('user_type', None)
        if user_type not in ['scheduler', 'admin']:
            return Response(
                {'error': 'Only schedulers and admins can edit offers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get updated data
        offer_items = request.data.get('offer_items', [])
        response_deadline_str = request.data.get('response_deadline')
        notes = request.data.get('notes', offer.notes)
        
        if offer_items is None or not isinstance(offer_items, list):
            return Response(
                {'error': 'offer_items must be a list (can be empty)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse response_deadline if provided
        response_deadline = offer.response_deadline
        if response_deadline_str:
            try:
                from datetime import datetime
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
        
        try:
            # Validate and process new offer items (same logic as create_offer)
            total_hours = 0
            validated_items = []
            offer_courses = set()
            offer_terms = set()
            
            for item_data in offer_items:
                item_type = item_data.get('item_type')
            
                if item_type == 'course_offering':
                    course_offering_id = item_data.get('course_offering_id')
                    time_slot_details = item_data.get('time_slot')
                    
                    if not course_offering_id:
                        return Response({'error': 'course_offering_id required for course_offering items'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # ✅ FOR COURSE OFFERINGS: Handle specific time slot
                    if not time_slot_details or not isinstance(time_slot_details, dict):
                        return Response({'error': 'time_slot is required for course_offering items'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Validate time slot format
                    required_time_fields = ['day', 'start_time', 'end_time']
                    for field in required_time_fields:
                        if field not in time_slot_details:
                            return Response({'error': f'time_slot must include {field}'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Get or create time slot
                    try:
                        time_slot, created = TimeSlot.objects.get_or_create(
                            day=time_slot_details['day'],
                            start_time=time_slot_details['start_time'],
                            end_time=time_slot_details['end_time']
                        )
                    except Exception as e:
                        return Response({'error': f'Invalid time slot data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    try:
                        course_offering = CourseOffering.objects.get(course_offering_id=course_offering_id)
                        course = course_offering.course
                        term = course_offering.academic_term
                        
                        # Calculate hours for THIS specific time slot only
                        duration = time_slot.duration
                        item_hours = duration.total_seconds() / 3600 if duration else 3.0
                        total_hours += item_hours
                        
                        validated_items.append({
                            'item_type': 'course_offering',
                            'course_offering': course_offering,
                            'time_slot': time_slot,
                            'course': course,
                            'hours': item_hours
                        })
                        
                        offer_courses.add(course)
                        offer_terms.add(term)
                        
                    except CourseOffering.DoesNotExist:
                        return Response({'error': f'Course offering {course_offering_id} not found'}, status=status.HTTP_400_BAD_REQUEST)
                
                elif item_type == 'shared_session':
                    shared_session_id = item_data.get('shared_session_id')
                    
                    if not shared_session_id:
                        return Response({'error': 'shared_session_id required for shared_session items'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    try:
                        shared_session = SharedSession.objects.get(shared_session_id=shared_session_id)
                        course = shared_session.course
                        term = shared_session.academic_term
                        
                        # ✅ FOR SHARED SESSIONS: Use ALL time slots (no specific time slot selection)
                        # Calculate total hours from all time slots of the shared session
                        session_time_slots = shared_session.time_slots.all()
                        session_hours = 0
                        for slot in session_time_slots:
                            if slot.duration:
                                session_hours += slot.duration.total_seconds() / 3600
                            else:
                                session_hours += 1.5  # fallback
                        
                        total_hours += session_hours
                        
                        validated_items.append({
                            'item_type': 'shared_session',
                            'shared_session': shared_session,
                            'time_slot': None,  # ✅ No specific time slot for shared sessions
                            'course': course,
                            'hours': session_hours
                        })
                        
                        offer_courses.add(course)
                        offer_terms.add(term)
                        
                    except SharedSession.DoesNotExist:
                        return Response({'error': f'Shared session {shared_session_id} not found'}, status=status.HTTP_400_BAD_REQUEST)
                
                else:
                    return Response({'error': f'Invalid item_type: {item_type}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if student would exceed their maximum hours (excluding current offer)
            student = offer.student
            current_allocation = self.calculate_student_allocation(student)
            # Subtract current offer hours from calculation
            current_offer_hours = offer.total_weekly_hours
            adjusted_current_hours = current_allocation['total_hours'] - current_offer_hours
            
            try:
                max_hours = int(offer.application.workload) if offer.application.workload else 12
                max_hours = min(max_hours, 12)
            except (ValueError, TypeError):
                max_hours = 12

            if adjusted_current_hours + total_hours > max_hours:
                return Response(
                    {
                        'error': f'This edit would exceed student\'s maximum hours. '
                                f'Current (excluding this offer): {adjusted_current_hours}, '
                                f'Max: {max_hours}, '
                                f'New total: {total_hours}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update offer
            with transaction.atomic():
                # Remove old offer items
                old_items = list(offer.offer_items.all())
                offer.offer_items.clear()
                
                # Delete old offer items (they're no longer needed)
                for old_item in old_items:
                    old_item.delete()
                
                # Create and add new offer items
                for item_data in validated_items:
                    if item_data['item_type'] == 'course_offering':
                        offer_item = OfferItem.objects.create(
                            item_type='course_offering',
                            course_offering=item_data['course_offering'],
                            time_slot=item_data['time_slot']  # ✅ Add the specific time slot
                        )
                    else:  # shared_session
                        offer_item = OfferItem.objects.create(
                            item_type='shared_session',
                            shared_session=item_data['shared_session'],
                            time_slot=None  # ✅ No specific time slot for shared sessions
                        )
                    
                    offer.offer_items.add(offer_item)
                
                # Update offer fields
                offer.response_deadline = response_deadline
                offer.notes = notes
                offer.updated_at = timezone.now()
                offer.save()
            
            # Return response
            serializer = self.get_serializer(offer)
            return Response({
                'success': True,
                'message': 'Offer updated successfully',
                'offer': serializer.data,
                'summary': {
                    'offer_id': offer.offer_id,
                    'student_id': student.id,
                    'student_number': student.student_number,
                    'total_weekly_hours': round(total_hours, 1),
                    'item_count': len(validated_items),
                    'courses': [course.course_number for course in offer_courses],
                    'terms': [term.code for term in offer_terms]
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='send-offer')
    def send_offer(self, request, pk=None):
        """
        Finalizes a draft offer, sets its deadline, changes status to 'pending',
        and sends the notification to the student.
        """
        offer = self.get_object()

        # 1. Validate the offer can be sent
        if offer.status != 'draft':
            return Response(
                {'error': f'Only draft offers can be sent. This offer has status "{offer.status}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Get the response deadline from the request body
        response_deadline_str = request.data.get('response_deadline')
        if not response_deadline_str:
            return Response(
                {'error': 'response_deadline is required to send an offer.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from datetime import datetime
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

        # 3. Update the offer
        with transaction.atomic():
            offer.status = 'pending'
            offer.offer_date = timezone.now()
            offer.response_deadline = response_deadline
            offer.save()

        # 4. Send the notification
        self._send_offer_notification(offer)

        serializer = self.get_serializer(offer)
        return Response({
            'success': True,
            'message': 'Offer has been sent to the student successfully.',
            'offer': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def cancel_offer(self, request, pk=None):
        """Cancel a draft or pending offer (only schedulers/admins)"""
        offer = self.get_object()
        
        # Check if offer can be cancelled using the model method
        if not offer.can_be_cancelled():
            return Response(
                {'error': f'Cannot cancel offer with status "{offer.status}". Only draft or pending offers can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check authentication
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_type = request.auth.payload.get('user_type', None)
        if user_type not in ['scheduler', 'admin']:
            return Response(
                {'error': 'Only schedulers and admins can cancel offers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update offer status to cancelled (or delete it)
        reason = request.data.get('reason', 'Cancelled by scheduler')
        
        with transaction.atomic():
            # Mark as cancelled (keep for history)
            offer.status = 'cancelled'
            offer.notes = f"{offer.notes}\n\nCANCELLED: {reason}" if offer.notes else f"CANCELLED: {reason}"
            offer.updated_at = timezone.now()
            offer.save()
        
        return Response({
            'success': True,
            'message': 'Offer cancelled successfully',
            'offer_id': offer.offer_id,
            'reason': reason
        })
    
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
                        time_slot=offer_item.time_slot, # Add this line
                        role='ta',
                        assigned_by=offer.created_by,
                        notes=f"Auto-assigned from accepted offer {offer.offer_id} - {offer_item.item_type} ({offer_item.weekly_hours}h/week)"
                    )
            if response_status == 'accepted':
                self._send_offer_accepted_notification(offer)
            elif response_status == 'rejected':
                self._send_offer_rejected_notification(offer)
    
    
        serializer = self.get_serializer(offer)
        return Response(serializer.data)
    
    def _send_offer_notification(self, offer):
        """Send offer notification via notification service"""
        
        try:
            # Get the first offer item to determine primary course
            first_offer_item = offer.offer_items.first()
            
            if not first_offer_item:
                logger.error(f"No offer items found for offer {offer.offer_id}")
                return
            
            # Determine course info based on offer items
            if offer.offer_items.count() == 1:
                # Single item offer
                course_code = first_offer_item.course.course_number
                course_name = first_offer_item.course.course_name
            else:
                # Multi-item offer
                course_code = "Multiple Courses"
                course_name = f"Multi-course offer ({offer.offer_items.count()} courses)"
            
            # Prepare notification data
            notification_data = {
                'student_email': offer.student.email,
                'student_name': offer.student.name,
                'course_code': course_code,
                'course_name': course_name,
                'deadline': offer.response_deadline.strftime('%Y-%m-%d %H:%M:%S'),
                'offer_id': str(offer.offer_id),
                'total_hours': offer.total_weekly_hours  # This uses the property that sums all offer items
            }
            
            # Call notification service
            response = requests.post(
                'http://notification-service:8006/api/notifications/send_offer_notification/',
                json=notification_data,
                timeout=10
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to send offer notification: {response.text}")
            else:
                logger.info(f"Offer notification sent successfully for offer {offer.offer_id}")
                
        except Exception as e:
            logger.error(f"Error sending offer notification: {str(e)}")
            # Don't fail the offer creation if notification fails

    def _send_offer_accepted_notification(self, offer):
        """Send offer accepted notification to coordinator"""
        import requests
        
        try:
            # Get coordinator email
            coordinator_email = self._get_coordinator_email_for_offer(offer)
            
            # Get course info from offer items
            first_offer_item = offer.offer_items.first()
            if offer.offer_items.count() == 1:
                course_code = first_offer_item.course.course_number
                course_name = first_offer_item.course.course_name
            else:
                course_code = "Multiple Courses"
                course_name = f"Multi-course offer ({offer.offer_items.count()} courses)"
            
            notification_data = {
                'student_email': offer.student.email,
                'student_name': offer.student.name,
                'course_code': course_code,
                'course_name': course_name,
                'coordinator_email': coordinator_email,
                'total_hours': offer.total_weekly_hours
            }
            
            requests.post(
                'http://notification-service:8006/api/notifications/send_offer_accepted/',
                json=notification_data,
                timeout=10
            )
            
        except Exception as e:
            logger.error(f"Error sending accepted notification: {str(e)}")

    def _send_offer_rejected_notification(self, offer):
        """Send offer rejected notification to coordinator"""
        import requests
        
        try:
            coordinator_email = self._get_coordinator_email_for_offer(offer)
            
            # Get course info from offer items
            first_offer_item = offer.offer_items.first()
            if offer.offer_items.count() == 1:
                course_code = first_offer_item.course.course_number
            else:
                course_code = f"Multiple Courses ({offer.offer_items.count()})"
            
            notification_data = {
                'student_email': offer.student.email,
                'student_name': offer.student.name,
                'course_code': course_code,
                'coordinator_email': coordinator_email
            }
            
            requests.post(
                'http://notification-service:8006/api/notifications/send_offer_rejected/',
                json=notification_data,
                timeout=10
            )
            
        except Exception as e:
            logger.error(f"Error sending rejected notification: {str(e)}")

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsSchedulerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'course_offering', 'role']
    search_fields = ['student__name', 'course_offering__course__course_number']
    ordering_fields = ['assigned_date']
    ordering = ['-assigned_date']
    
    def get_permissions(self):
        """
        - Students can view their own assignments
        - Instructors can view assignments for their courses  
        - Schedulers/Admins can manage all assignments
        """
        if self.action in ['list', 'retrieve', 'my_assignments', 'by_instructor', 'tas_by_offering']:
            return [IsAuthenticatedUser()]  # All authenticated users can view (filtered by get_queryset)
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'active_assignments']:
            return [IsSchedulerOrAdmin()]  # Only schedulers/admins can modify
        return [IsAuthenticatedUser()]
    
    def get_queryset(self):
        """Filter assignments based on user role using your existing auth pattern"""
        queryset = Assignment.objects.select_related('student', 'offer', 'assigned_by').all()
        
        # Use your existing auth pattern from other ViewSets
        if not hasattr(self.request, 'auth') or not self.request.auth:
            return queryset.none()
        
        user_type = self.request.auth.payload.get('user_type', None)
        user_id = self.request.auth.payload.get('sub', None)
        
        if user_type == 'student' and user_id:
            # Students see only their own assignments
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                return queryset.filter(student_id=student_model_id)
            return queryset.none()
            
        elif user_type == 'instructor' and user_id:
            # Instructors see assignments for courses they teach
            from .models import Instructor
            try:
                instructor = Instructor.objects.get(employee_number=user_id)
                return queryset.filter(
                    course_offering__instructor_id=instructor.id,
                    is_active=True
                )
            except Instructor.DoesNotExist:
                return queryset.none()
        
        elif user_type in ['scheduler', 'admin']:
            # Schedulers and admins see all assignments
            return queryset
        
        return queryset.none()
    
    def get_student_model_id(self, user_id):
        """Use the same pattern as OfferViewSet"""
        try:
            student = Student.objects.get(student_number=user_id)
            return student.id
        except Student.DoesNotExist:
            return None
    
    @action(detail=False, methods=['get'])
    def active_assignments(self, request):
        """Get all active assignments"""
        active_assignments = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        """Get current student's assignments with detailed information"""
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_type = request.auth.payload.get('user_type', None)
        user_id = request.auth.payload.get('sub', None)
        
        if user_type != 'student':
            return Response({'error': 'Only students can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
        
        student_model_id = self.get_student_model_id(user_id)
        if not student_model_id:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get student's active assignments
        assignments = Assignment.objects.filter(
            student_id=student_model_id,
            is_active=True
        ).select_related('course', 'course_offering', 'shared_session')
        
        # Calculate total hours using the property method
        total_hours = sum(assignment.weekly_hours for assignment in assignments)
        
        serializer = self.get_serializer(assignments, many=True)
        
        return Response({
            'assignments': serializer.data,
            'summary': {
                'total_assignments': assignments.count(),
                'total_weekly_hours': round(total_hours, 1),
                'courses': list(set([assignment.course.course_number for assignment in assignments if assignment.course]))
            }
        })
    
    @action(detail=False, methods=['get'])
    def by_instructor(self, request):
        """Get assignments for courses taught by the current instructor"""
        if not hasattr(request, 'auth') or not request.auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_type = request.auth.payload.get('user_type', None)
        user_id = request.auth.payload.get('sub', None)
        
        if user_type != 'instructor':
            return Response({'error': 'Only instructors can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get instructor using same pattern as other services
        from .models import Instructor
        try:
            instructor = Instructor.objects.get(employee_number=user_id)
        except Instructor.DoesNotExist:
            return Response({'error': 'Instructor profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get assignments for instructor's courses
        assignments = Assignment.objects.filter(
            course_offering__instructor_id=instructor.id,
            is_active=True
        ).select_related('student', 'course', 'course_offering')
        
        # Group by course offering
        course_assignments = {}
        for assignment in assignments:
            course_key = f"{assignment.course.course_number} {assignment.course_offering.section_number}"
            if course_key not in course_assignments:
                course_assignments[course_key] = {
                    'course_offering_id': str(assignment.course_offering.course_offering_id),
                    'course_number': assignment.course.course_number,
                    'course_name': assignment.course.course_name,
                    'section_number': assignment.course_offering.section_number,
                    'tas': []
                }
            
            course_assignments[course_key]['tas'].append({
                'assignment_id': assignment.assignment_id,
                'student_name': assignment.student.name,
                'student_number': assignment.student.student_number,
                'weekly_hours': assignment.weekly_hours,
                'assigned_date': assignment.assigned_date
            })
        
        return Response({
            'course_assignments': list(course_assignments.values()),
            'total_courses': len(course_assignments),
            'total_tas': assignments.count()
        })

    @action(detail=False, methods=['get'])
    def tas_by_offering(self, request):
        """Get TAs assigned to a specific course offering or shared session"""
        course_offering_id = request.query_params.get('course_offering_id')
        shared_session_id = request.query_params.get('shared_session_id')
        
        if not course_offering_id and not shared_session_id:
            return Response(
                {'error': 'Must provide either course_offering_id or shared_session_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if course_offering_id and shared_session_id:
            return Response(
                {'error': 'Provide either course_offering_id OR shared_session_id, not both'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Query assignments based on the offering type
        if course_offering_id:
            assignments = Assignment.objects.filter(
                course_offering_id=course_offering_id,
                is_active=True
            ).select_related('student', 'time_slot')
        else:
            assignments = Assignment.objects.filter(
                shared_session_id=shared_session_id,
                is_active=True
            ).select_related('student', 'time_slot')
        
        # Format the response with TA details
        ta_list = []
        for assignment in assignments:
            time_slot_details = None
            if assignment.time_slot:
                time_slot_details = {
                    'day': assignment.time_slot.get_day_display(),
                    'start_time': assignment.time_slot.start_time.strftime('%H:%M'),
                    'end_time': assignment.time_slot.end_time.strftime('%H:%M'),
                }

            ta_list.append({
                'assignment_id': assignment.assignment_id,
                'student_name': assignment.student.name,
                'student_number': assignment.student.student_number,
                'role': assignment.role,
                'assigned_date': assignment.assigned_date,
                'weekly_hours': assignment.weekly_hours,
                'time_slot': time_slot_details
            })
        
        return Response({
            'offering_type': 'course_offering' if course_offering_id else 'shared_session',
            'offering_id': course_offering_id or shared_session_id,
            'assigned_tas': ta_list,
            'total_tas': len(ta_list)
        })

class CourseAllocationActionsViewSet(viewsets.ViewSet):
    """
    Actions related to finalizing allocations for a course.
    """
    @action(detail=True, methods=['post'], url_path='finalize-allocations', permission_classes=[IsSchedulerOrAdmin])
    def finalize_allocations(self, request, pk=None):
        """
        Finalizes all allocations for a course offering and sends a 
        consolidated notification to the instructor.
        """
        try:
            course_offering = CourseOffering.objects.get(pk=pk)
        except CourseOffering.DoesNotExist:
            return Response({'error': 'Course offering not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Gather all active assignments for this course offering
        active_assignments = Assignment.objects.filter(
            course_offering=course_offering, 
            is_active=True
        ).select_related('student', 'course', 'course_offering__academic_term')

        if not active_assignments.exists():
            return Response({'message': 'No active assignments to notify for.'}, status=status.HTTP_200_OK)

        # 2. Prepare the allocation details for the notification
        allocation_details = []
        for assignment in active_assignments:
            allocation_details.append({
                'ta_name': assignment.student.name,
                'student_number': assignment.student.student_number,
                'hours': assignment.weekly_hours
            })
            
        # 3. Get instructor and course details
        instructor = course_offering.instructor
        if not instructor or not instructor.email:
            return Response({'error': 'Instructor email not found for this course.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Construct the payload for the notification service
        notification_payload = {
            'instructor_email': instructor.email,
            'instructor_name': instructor.name,
            'course_code': course_offering.course.course_number,
            'course_name': course_offering.course.course_name,
            'term': course_offering.academic_term.term_type, 
            'allocations': allocation_details
        }

        # 5. Call the existing notification service endpoint
        try:
            notification_url = 'http://nginx/api/notifications/send_final_allocation_notice/'
            response = requests.post(notification_url, json=notification_payload, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Failed to send final allocation notice. Status: {response.status_code}, Body: {response.text}")
                return Response({'error': 'Failed to trigger notification service.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling notification service for final allocation: {e}")
            return Response({'error': 'Could not connect to notification service.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Final allocation notice has been sent to the instructor.',
            'instructor': instructor.name,
            'assignments_count': len(active_assignments)
        })

class SharedSessionAllocationActionsViewSet(viewsets.ViewSet):
    """
    Actions related to finalizing allocations for a shared session.
    """
    @action(detail=True, methods=['post'], url_path='finalize-allocations', permission_classes=[IsSchedulerOrAdmin])
    def finalize_allocations(self, request, pk=None):
        """
        Finalizes all allocations for a shared session and sends a 
        consolidated notification to the instructor.
        """
        try:
            shared_session = SharedSession.objects.get(pk=pk)
        except SharedSession.DoesNotExist:
            return Response({'error': 'Shared session not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Gather all active assignments for this shared session
        active_assignments = Assignment.objects.filter(
            shared_session=shared_session, 
            is_active=True
        ).select_related('student', 'course', 'shared_session__academic_term')

        if not active_assignments.exists():
            return Response({'message': 'No active assignments to notify for.'}, status=status.HTTP_200_OK)

        # 2. Prepare the allocation details for the notification
        allocation_details = []
        for assignment in active_assignments:
            allocation_details.append({
                'ta_name': assignment.student.name,
                'student_number': assignment.student.student_number,
                'hours': assignment.weekly_hours
            })
            
        # 3. Get instructor and course details
        instructor = shared_session.instructor
        if not instructor or not instructor.email:
            return Response({'error': 'Instructor email not found for this shared session.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Construct the payload for the notification service
        notification_payload = {
            'instructor_email': instructor.email,
            'instructor_name': instructor.name,
            'course_code': f"{shared_session.course.course_number} ({shared_session.session_type})",
            'course_name': shared_session.course.course_name,
            'term': shared_session.academic_term.term_type, 
            'allocations': allocation_details
        }

        # 5. Call the existing notification service endpoint
        try:
            notification_url = 'http://nginx/api/notifications/send_final_allocation_notice/'
            response = requests.post(notification_url, json=notification_payload, timeout=15)
            
            if response.status_code != 200:
                logger.error(f"Failed to send final allocation notice. Status: {response.status_code}, Body: {response.text}")
                return Response({'error': 'Failed to trigger notification service.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling notification service for final allocation: {e}")
            return Response({'error': 'Could not connect to notification service.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Final allocation notice has been sent to the instructor.',
            'instructor': instructor.name,
            'assignments_count': len(active_assignments)
        })
    
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
            'edit_offer': '/api/allocations/offers/{offer_id}/edit_offer/',
            'send_offer': '/api/allocations/offers/{offer_id}/send-offer/',
            'cancel_offer': '/api/allocations/offers/{offer_id}/cancel_offer/',
            'pending_offers': '/api/allocations/offers/pending_offers/',
            'accepted_offers': '/api/allocations/offers/accepted_offers/',
            'rejected_offers': '/api/allocations/offers/rejected_offers/', 
            'expired_offers': '/api/allocations/offers/expired_offers/',  
            'respond_to_offer': '/api/allocations/offers/{offer_id}/respond_to_offer/',
                
            # Assignments Management
            'assignments': '/api/allocations/assignments/',
            'active_assignments': '/api/allocations/assignments/active_assignments/',
            'my_assignments': '/api/allocations/assignments/my_assignments/',  #  For students
            'by_instructor': '/api/allocations/assignments/by_instructor/',  # ← For instructors
            'tas_by_offering': '/api/allocations/assignments/tas_by_offering/',

            # Assignment Modifications
            'create_modification': '/api/allocations/offers/create_modification/', 
            'pending_modifications': '/api/allocations/offers/pending_modifications/', 
            'respond_to_modification': '/api/allocations/offers/{offer_id}/respond_to_modification/',

            # Allocation Finalization
            'finalize_course_allocations': '/api/allocations/course-offerings/{course_offering_id}/finalize-allocations/', # this is the button scheduler or admin can click to send notif to instructor
            'finalize_session_allocations': '/api/allocations/shared-sessions/{shared_session_id}/finalize-allocations/',
                
            # Service Info
            'service_info': '/api/allocations/',
        },
        'authentication': 'Required for all endpoints except root',
        'permissions': {
            'schedulers': 'Can create offers, view all offers, manage assignments',
            'students': 'Can view own offers, respond to offers, view own assignments',  # ← Updated
            'instructors': 'Can view assignments for their courses',  # ← instructors can view assignments
            'admins': 'Full access to all endpoints'
        },
        'offer_lifecycle': {
            'draft': 'Offer created, not yet sent to student',
            'pending': 'Offer sent, awaiting student response',
            'accepted': 'Student accepted offer, assignments created',
            'rejected': 'Student rejected offer',
            'expired': 'Offer deadline passed without response',
            'cancelled': 'Offer withdrawn by scheduler before response'
        }
    })