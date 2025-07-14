from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import *
from .serializers import *
import django_filters
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User

# Import shared auth utilities
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsStudentUser

# Define a combined permission for schedulers or admins
IsSchedulerOrAdmin = IsSchedulerUser | IsAdminUser

class JobPostingFilter(django_filters.FilterSet):
    term = django_filters.NumberFilter()
    term_code = django_filters.CharFilter(
        field_name='term__code',
        lookup_expr='iexact',
        help_text='Filter by term code (e.g., W2025)'
    )
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
    search_fields = ['title', 'description', 'department__name'] 
    ordering_fields = ['post_date', 'title']

    def get_permissions(self):
        """
        Define permissions for different actions.
        - Schedulers/Admins can create, update, and destroy.
        - Anyone can view postings.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return [IsSchedulerOrAdmin()]
        elif self.action == 'destroy':
            # Prevent deletion, but still require auth
            return [IsSchedulerOrAdmin()]
        return [AllowAny()]

    def get_queryset(self):
        """
        Filter queryset to only show open job postings to unauthenticated users.
        """
        queryset = super().get_queryset()
        user_type, _ = self.get_user_info(self.request)
        
        # If user is not authenticated, only show open postings
        if not user_type:
            queryset = queryset.filter(status='open')
        
        return queryset

    def get_user_info(self, request):
        user_type = getattr(request, 'user_type', None)
        user_id = getattr(request, 'user_id', None)
        return user_type, user_id

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def open(self, request):
        """Get all open job postings."""
        jobs = JobPosting.objects.filter(status='open')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of job postings."""
        return Response(
            {"detail": "Deletion of job postings is not allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """Get all active job postings (open and not past deadline)."""
        jobs = JobPosting.objects.filter(
            status='open',
            deadline_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-term/(?P<term_id>\d+)', permission_classes=[AllowAny])
    def by_term(self, request, term_id=None):
        """Get job postings by term ID."""
        queryset = self.get_queryset().filter(term_id=term_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ApplicationFilter(django_filters.FilterSet):  
    status = django_filters.CharFilter()
    positionType = django_filters.CharFilter()
    fullTimeEnrollment = django_filters.CharFilter()
    termSelection = django_filters.NumberFilter()
    workload = django_filters.CharFilter()
    hasOtherPositions = django_filters.CharFilter()
    term_code = django_filters.CharFilter(
        field_name='termSelection__code',
        lookup_expr='iexact'
    )
    discipline = django_filters.CharFilter(
        method='filter_by_discipline'
    )
    
    def filter_by_discipline(self, queryset, name, value):
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
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ApplicationFilter
    search_fields = ['student__name', 'posting__title']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']

    def get_permissions(self):
        """
        Define permissions for different actions.
        - Students can create/view/update their own applications.
        - Schedulers/Admins can view any application.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'by_student']:
            return [IsStudentUser()]
        elif self.action in ['list', 'retrieve', 'by_posting', 'by_id']:
            return [IsSchedulerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Filter applications based on user role.
        - Students see only their own applications.
        - Schedulers/Admins see all applications.
        """
        user_type, user_id = self.get_user_info(self.request)
        queryset = Application.objects.all()

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
            user = User.objects.get(id=user_id)
            student = Student.objects.get(email=user.email)
            return student.id
        except (User.DoesNotExist, Student.DoesNotExist):
            return None

    def perform_create(self, serializer):
        """Set the correct student ID when creating an application."""
        user_type, user_id = self.get_user_info(self.request)
        
        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                serializer.save(student_id=student_model_id)
            else:
                raise serializers.ValidationError("Could not find a matching student record for this user.")
        else:
            raise serializers.ValidationError("Only students can create applications.")

    @action(detail=False, methods=['get'], url_path=r'by-student/(?P<student_id>\d+)') 
    def by_student(self, request, student_id=None):
        """Get all applications for a specific student. Enforces student can only see their own."""
        user_type, user_id = self.get_user_info(request)
        
        if user_type == 'student':
            student_model_id = self.get_student_model_id(user_id)
            if not student_model_id or str(student_model_id) != str(student_id):
                return Response(
                    {"detail": "You can only view your own applications."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        applications = Application.objects.filter(student_id=student_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-posting/(?P<posting_id>\d+)')
    def by_posting(self, request, posting_id=None):
        """Get all applications for a specific job posting."""
        applications = self.get_queryset().filter(posting_id=posting_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-id/(?P<application_id>\d+)')    
    def by_id(self, request, application_id=None):
        """Get a specific application by ID, respecting user permissions."""
        try:
            application = self.get_queryset().get(application_id=application_id)
            serializer = self.get_serializer(application)
            return Response(serializer.data)
        except Application.DoesNotExist:
            return Response(
                {"detail": "Application not found or you do not have permission to view it."}, 
                status=status.HTTP_404_NOT_FOUND
            )

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Applications & Job Postings Service is running',
        'service_scope': 'Job postings and application management',
        'public_endpoints': {
            'job_postings': '/api/ajp/jobpostings/',
            'open_jobs': '/api/ajp/jobpostings/open/',
            'active_jobs': '/api/ajp/jobpostings/active/',
            'jobs_by_term': '/api/ajp/jobpostings/by-term/{term_id}/',
        },
        'authenticated_endpoints': {
            'applications': '/api/ajp/applications/',
            'apps_by_student': '/api/ajp/applications/by-student/{student_id}/',
            'apps_by_posting': '/api/ajp/applications/by-posting/{posting_id}/',
            'app_by_id': '/api/ajp/applications/by-id/{application_id}/',
        }
    })