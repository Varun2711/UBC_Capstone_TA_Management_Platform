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
from .models import Offer, Assignment, Student, TAScheduler, Application, ApplicationShortList
from .serializers import OfferSerializer, AssignmentSerializer, ShortlistedApplicantSerializer
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsStudentUser

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
        """Calculate student's current allocation status"""
        # Get pending offers HOURS (potential future workload)
        pending_offers_hours = Offer.objects.filter(
            student=student,
            status='pending'
        ).aggregate(
            total_hours=Sum(
                Case(
                    When(required_hours='6', then=6),
                    When(required_hours='12', then=12),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total_hours'] or 0
        
        # Get active assignments HOURS (confirmed workload)
        # This is the single source of truth for allocated hours.
        active_assignments_hours = Assignment.objects.filter(
            student=student,
            is_active=True
        ).aggregate(
            total_hours=Sum(
                Case(
                    When(required_hours='6', then=6),
                    When(required_hours='12', then=12),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total_hours'] or 0
        
        # The total allocated hours are the sum of confirmed work and potential work.
        # We no longer need to query for 'accepted' offers separately.
        return {
            'pending_offers_hours': pending_offers_hours,
            'active_assignments_hours': active_assignments_hours,
            'total_hours': pending_offers_hours + active_assignments_hours
        }

class OfferViewSet(viewsets.ModelViewSet):
    serializer_class = OfferSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'course_offering', 'required_hours', 'role']
    search_fields = ['student__name', 'course_offering__course__course_number']
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
        user_type, user_id = self.get_user_info(self.request)
        queryset = Offer.objects.select_related('student', 'application', 'created_by').all()
        
        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                return queryset.filter(student_id=student_model_id)
            return queryset.none()
        
        if user_type in ['scheduler', 'admin']:
            return queryset
        
        return queryset.none()
    
    def get_user_info(self, request):
        user_type = getattr(request, 'user_type', None)
        user_id = getattr(request, 'user_id', None)
        return user_type, user_id
    
    def get_student_model_id(self, user_id):
        try:
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
            student = Student.objects.get(email=user.email)
            return student.id
        except (User.DoesNotExist, Student.DoesNotExist):
            return None
    
    @action(detail=False, methods=['post'])
    def create_offer(self, request):
        """Create a new offer for a shortlisted student"""
        application_id = request.data.get('application_id')
        course_offering_id = request.data.get('course_offering_id')
        shared_session_id = request.data.get('shared_session_id')
        required_hours = request.data.get('required_hours', '6')
        response_deadline = request.data.get('response_deadline')
        notes = request.data.get('notes', '')
        
        # Get the scheduler who is creating the offer
        user_type, user_id = self.get_user_info(request)
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
            
            # Check if student would exceed their maximum hours
            current_allocation = self.calculate_student_allocation(student)
            max_hours = int(application.workload) if application.workload else 0
            new_hours = int(required_hours)
            
            if current_allocation['total_hours'] + new_hours > max_hours:
                return Response(
                    {
                        'error': f'This offer would exceed student\'s maximum hours. '
                                f'Current: {current_allocation["total_hours"]}, '
                                f'Max: {max_hours}, '
                                f'Requested: {new_hours}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get scheduler
            scheduler = TAScheduler.objects.get(id=user_id)
            
            # Create the offer
            offer = Offer.objects.create(
                application=application,
                course_offering_id=course_offering_id,
                student=student,
                shared_session_id=shared_session_id,
                required_hours=required_hours,
                response_deadline=response_deadline,
                created_by=scheduler,
                notes=notes
            )
            
            serializer = self.get_serializer(offer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ApplicationShortList.DoesNotExist:
            return Response(
                {'error': 'Application not found in shortlist'},
                status=status.HTTP_404_NOT_FOUND
            )
        except TAScheduler.DoesNotExist:
            return Response(
                {'error': 'Scheduler not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def calculate_student_allocation(self, student):
        """Calculate student's current allocation status"""
        # Get pending offers HOURS
        pending_offers_hours = Offer.objects.filter(
            student=student,
            status='pending'
        ).aggregate(
            total_hours=Sum(
                Case(
                    When(required_hours='6', then=6),
                    When(required_hours='12', then=12),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total_hours'] or 0
        
        # Get accepted offers HOURS
        accepted_offers_hours = Offer.objects.filter(
            student=student,
            status='accepted'
        ).aggregate(
            total_hours=Sum(
                Case(
                    When(required_hours='6', then=6),
                    When(required_hours='12', then=12),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total_hours'] or 0
        
        # Get active assignments HOURS
        active_assignments_hours = Assignment.objects.filter(
            student=student,
            is_active=True
        ).aggregate(
            total_hours=Sum(
                Case(
                    When(required_hours='6', then=6),
                    When(required_hours='12', then=12),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total_hours'] or 0
        
        return {
            'pending_offers_hours': pending_offers_hours,
            'accepted_offers_hours': accepted_offers_hours,
            'active_assignments_hours': active_assignments_hours,
            'total_hours': pending_offers_hours + accepted_offers_hours + active_assignments_hours
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
    
    @action(detail=True, methods=['post'])
    def respond_to_offer(self, request, pk=None):
        """Allow student to respond to an offer"""
        offer = self.get_object()
        
        # Check if student can respond
        if not offer.can_respond():
            return Response(
                {'error': 'This offer has expired or already been responded to'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if this is the student's offer
        user_type, user_id = self.get_user_info(request)
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
            
            # Create assignment if accepted
            if response_status == 'accepted':
                Assignment.objects.create(
                    offer=offer,
                    student=offer.student,
                    course_offering=offer.course_offering,
                    shared_session=offer.shared_session,
                    required_hours=offer.required_hours,
                    role=offer.role,
                    assigned_by=offer.created_by,
                    notes=f"Auto-assigned from accepted offer {offer.offer_id}"
                )
        
        serializer = self.get_serializer(offer)
        return Response(serializer.data)

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsSchedulerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'course_offering', 'required_hours', 'role']
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
        }
    })