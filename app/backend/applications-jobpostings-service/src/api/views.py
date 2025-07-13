from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import *
from .serializers import *
import django_filters
from django.utils import timezone
from django.utils.decorators import method_decorator

# Import shared auth utilities
from auth_utils.decorators import admin_required, scheduler_required, student_required, authenticated_required
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsStudentUser, IsAuthenticatedUser

class JobPostingFilter(django_filters.FilterSet):
    # Filter by term ID (default behavior)
    term = django_filters.NumberFilter()
    
    # Filter by term code
    term_code = django_filters.CharFilter(
        field_name='term__code',
        lookup_expr='iexact',
        help_text='Filter by term code (e.g., W2025)'
    )
    
    # Filter by department name
    department_name = django_filters.CharFilter(
        field_name='department__name',
        lookup_expr='icontains',
        help_text='Filter by department name'
    )
    
    class Meta:
        model = JobPosting
        fields = ['status', 'post_date', 'term', 'term_code', 'department_name']

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = JobPostingFilter
    
    # Enable search based on post title, description, and department name
    search_fields = ['title', 'description', 'department__name'] 
    ordering_fields = ['post_date', 'title']

    def get_permissions(self):
        """
        Define permissions for different actions
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only schedulers and admins can create/update/delete job postings
            return [IsSchedulerUser()]
        elif self.action in ['list', 'retrieve', 'open', 'active', 'by_term']:
            # ANYONE can view job postings - no authentication required
            return [AllowAny()]
        else:
            return [AllowAny()]

    def get_queryset(self):
        """
        Filter queryset to only show open job postings to unauthenticated users
        """
        queryset = super().get_queryset()
        
        # Get user info from the request (set by middleware)
        user_type = getattr(self.request, 'user_type', None)
        
        # If user is not authenticated (user_type is None), only show open postings
        if not user_type:
            queryset = queryset.filter(status='open')
        
        # Authenticated users (schedulers/admins) can see all postings
        return queryset

    @action(detail=False, methods=['get'])
    @permission_classes([AllowAny])
    def open(self, request):
        """Get all open job postings - public endpoint"""
        jobs = JobPosting.objects.filter(status='open')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of job postings. They can be marked as archived or closed."""
        return Response(
            {"detail": "Deletion of job postings is not allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=False, methods=['get'])
    @permission_classes([AllowAny])
    def active(self, request):
        """Get all active job postings (open and not past deadline) - public endpoint"""
        jobs = JobPosting.objects.filter(
            status='open',
            deadline_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-term/(?P<term_id>\d+)')
    @permission_classes([AllowAny])
    def by_term(self, request, term_id=None):
        """Get job postings by term ID - public endpoint"""
        # For unauthenticated users, only show open postings
        user_type = getattr(request, 'user_type', None)
        if not user_type:
            jobs = JobPosting.objects.filter(term_id=term_id, status='open')
        else:
            jobs = JobPosting.objects.filter(term_id=term_id)
        
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)

class ApplicationFilter(django_filters.FilterSet):  
    """ Application Filter Class used to create custom filters for Application requests"""
    status = django_filters.CharFilter()
    positionType = django_filters.CharFilter()
    fullTimeEnrollment = django_filters.CharFilter()
    termSelection = django_filters.NumberFilter()
    workload = django_filters.CharFilter()
    hasOtherPositions = django_filters.CharFilter()

    # Allow filtering on term code
    term_code = django_filters.CharFilter(
        field_name='termSelection__code',
        lookup_expr='iexact',
        help_text='Filter by term code (e.g., W2025)'
    )
    
    # Now, we specifically want to TA scheduler to be able to filter by discipline 
    discipline = django_filters.CharFilter(
        method='filter_by_discipline',
        help_text='Filter applications that include this discipline in any rank'
    )
    
    def filter_by_discipline(self, queryset, name, value):
        """
        Filter applications that have the specified discipline in rank1, rank2, or rank3
        Example: ?discipline=COSC returns all applications with COSC in any ranking
        """
        return queryset.filter(
            models.Q(disciplineRankings__rank1__iexact=value) |
            models.Q(disciplineRankings__rank2__iexact=value) |
            models.Q(disciplineRankings__rank3__iexact=value)
        )
    
    class Meta:
        model = Application
        fields = [
            'status', 'positionType', 'fullTimeEnrollment', 
            'termSelection', 'workload', 'hasOtherPositions', 'discipline', 'term_code'
        ]

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticatedUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'posting']
    search_fields = ['student__name', 'posting__title']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']

    def get_user_info(self, request):
        """Helper method to get user info from request"""
        try:
            # Try JWT payload first
            if hasattr(request, 'auth') and hasattr(request.auth, 'payload'):
                user_type = request.auth.payload.get('user_type', None)
                user_id = request.auth.payload.get('sub', None) or request.auth.payload.get('user_id', None)
            else:
                # Fallback to middleware attributes
                user_type = getattr(request, 'user_type', None)
                user_id = getattr(request, 'user_id', None)
            
            return user_type, user_id
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None, None

    def get_student_model_id(self, user_id):
        """
        Convert User model ID to Student model ID
        Similar to what you did in ComprehensiveStudentProfileSerializer
        """
        try:
            from django.contrib.auth.models import User
            
            # Get the User object
            user = User.objects.get(id=user_id)
            
            # Find the corresponding Student by email
            student = Student.objects.get(email=user.email)
            
            print(f"DEBUG: Converted User ID {user_id} to Student ID {student.id}")
            return student.id
            
        except User.DoesNotExist:
            print(f"ERROR: User with ID {user_id} not found")
            return None
        except Student.DoesNotExist:
            print(f"ERROR: Student with email {user.email} not found")
            return None
        except Exception as e:
            print(f"ERROR: Failed to convert User ID to Student ID: {e}")
            return None

    def perform_create(self, serializer):
        """Set the correct student ID when creating an application"""
        user_type, user_id = self.get_user_info(self.request)
        
        print(f"DEBUG perform_create: user_type={user_type}, user_id={user_id}")
        
        if user_type == 'student' and user_id:
            # Convert User model ID to Student model ID
            student_model_id = self.get_student_model_id(user_id)
            
            if student_model_id:
                serializer.save(student_id=student_model_id)
                print(f"Application created with student_id: {student_model_id}")
            else:
                print(f"ERROR: Could not find Student model ID for User ID {user_id}")
                # You might want to raise an exception here
                raise serializers.ValidationError("Could not find corresponding student record")
        else:
            print(f"ERROR: Cannot create application - user_type={user_type}, user_id={user_id}")
            raise serializers.ValidationError("Invalid user type or missing user ID")

    @action(detail=False, methods=['get'], url_path=r'by-student/(?P<student_id>\d+)') 
    def by_student(self, request, student_id=None):
        """Get all applications for a specific student"""
        user_type, user_id = self.get_user_info(request)
        
        print(f"DEBUG by_student: user_type={user_type}, user_id={user_id}, requested_student_id={student_id}")
        
        if user_type == 'student' and user_id:
            # Convert User model ID to Student model ID for comparison
            student_model_id = self.get_student_model_id(user_id)
            
            print(f"DEBUG: User ID {user_id} -> Student ID {student_model_id}")
            
            if student_model_id and str(student_model_id) != str(student_id):
                print(f"❌ PERMISSION DENIED: Student {student_model_id} tried to access student {student_id} applications")
                return Response(
                    {"detail": "You can only view your own applications."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        print(f"✅ PERMISSION GRANTED")
        
        # Filter applications by the requested student_id (Student model ID)
        applications = self.queryset.filter(student_id=student_id)
        print(f"Found {applications.count()} applications for student {student_id}")
        
        # Print each application
        for app in applications:
            print(f"  - Application {app.application_id}: status={app.status}, student_id={app.student_id}")
        
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-posting/(?P<posting_id>\d+)')
    def by_posting(self, request, posting_id=None):
        """Get all applications for a specific job posting"""
        applications = self.queryset.filter(posting_id=posting_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-id/(?P<application_id>\d+)')    
    def by_id(self, request, application_id=None):
        """Get a specific application by ID"""
        try:
            application = Application.objects.get(application_id=application_id)
            
            # Check if user has permission to view this application
            user_type, user_id = self.get_user_info(request)  # Use the helper method
            
            if user_type == 'student' and user_id:
                # Convert User model ID to Student model ID for comparison
                student_model_id = self.get_student_model_id(user_id)
                
                if student_model_id and str(application.student_id) != str(student_model_id):
                    return Response(
                        {"detail": "You can only view your own applications."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = self.get_serializer(application)
            return Response(serializer.data)
        except Application.DoesNotExist:
            return Response(
                {"detail": "Application not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

# Add an API root view for the service
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Applications & Job Postings Service is running',
        'service_scope': 'Job postings and application management',
        'public_endpoints': {
            'job_postings': '/api/applications/jobpostings/',
            'open_jobs': '/api/applications/jobpostings/open/',
            'active_jobs': '/api/applications/jobpostings/active/',
            'jobs_by_term': '/api/applications/jobpostings/by-term/{term_id}/',
        },
        'authenticated_endpoints': {
            'applications': '/api/applications/applications/',
            'apps_by_student': '/api/applications/applications/by-student/{student_id}/',
            'apps_by_posting': '/api/applications/applications/by-posting/{posting_id}/',
            'app_by_id': '/api/applications/applications/by-id/{application_id}/',
        }
    })