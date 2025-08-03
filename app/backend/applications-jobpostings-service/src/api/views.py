from django.shortcuts import render
from django.http import JsonResponse, HttpRequest, HttpResponseForbidden, HttpResponse
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
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.crypto import salted_hmac, constant_time_compare
import os
from datetime import datetime

# Import shared auth utilities
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsStudentUser

#Import the download utility
from .utils.download_links import generate_signed_url


# Define a combined permission for schedulers or admins
IsSchedulerOrAdmin = IsSchedulerUser | IsAdminUser
IsSchedulerOrStudent = IsStudentUser | IsSchedulerUser
IsStudentOrSchedulerOrAdmin = IsStudentUser | IsSchedulerUser | IsAdminUser


#ensure secure document downloads
def secure_document_download(request):
    path = request.GET.get("path")
    exp = request.GET.get("exp")
    sig = request.GET.get("sig")

    if not (path and exp and sig):
        return HttpResponseForbidden("Missing parameters.")

    expected = salted_hmac("nginx-download", f"{path}:{exp}", secret=settings.SECRET_KEY).hexdigest()
    if not constant_time_compare(sig, expected):
        return HttpResponseForbidden("Invalid signature.")

    if int(exp) < int(datetime.utcnow().timestamp()):
        return HttpResponseForbidden("URL expired.")

    response = HttpResponse()
    response["Content-Type"] = "application/octet-stream"
    response["Content-Disposition"] = f'attachment; filename="{os.path.basename(path)}"'
    response["X-Accel-Redirect"] = f"/protected-documents/{path}"
    return response

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

     # Add default ordering - most recent posts first, then by ID for consistency
    ordering = ['-post_date', '-posting_id']
    
    #override global default to only return non-archived jobs
    #def get_queryset(self):    
       # return JobPosting.objects.exclude(status='archived')
    
    def perform_create(self, serializer):       
        if not serializer.validated_data.get('created_by'):
            # Try to get from authenticated user first
            if hasattr(self.request.user, 'tascheduler'):
                serializer.save(created_by=self.request.user.tascheduler)
            else:                
                serializer.save(created_by=None)
                
        else:
            serializer.save()

    def perform_update(self, serializer):       
        serializer.save()

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
        
        queryset = super().get_queryset()
        user_type, _ = self.get_user_info(self.request)

        if not user_type:
            return queryset.filter(status='open')

        if user_type == 'student':
            return queryset.exclude(status__in=['archived', 'draft'])

        return queryset.exclude(status='archived')


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
    
    #Prevent deletion of job postings. Instead jobs marked as archived
    def destroy(self, request, *args, **kwargs):    
        try:
            job_posting = self.get_object()
            job_posting.status = 'archived'
            job_posting.save()
            
        # Return the updated job posting data
            serializer = self.get_serializer(job_posting)
            return Response(
                {
                    "detail": "Job posting has been archived successfully.",
                    "job_posting": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except JobPosting.DoesNotExist:
            return Response(
                {"detail": "Job posting not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    
    #Is the job active?
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
    search_fields = ['student__name', 'student__student_number',  'posting__title']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']

    def get_permissions(self):
        """
        Define permissions for different actions.
        - Students can create/view/update their own applications.
        - Schedulers/Admins can view any application.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'by_student', 'submit_with_responses', 'myapplications', 'myapplications_short']:
            return [IsStudentUser()]
        elif self.action == 'by_id':
            return [IsSchedulerOrStudent()]
        elif self.action in ['list', 'retrieve', 'by_posting', 'count_by_posting']:
            return [IsSchedulerOrAdmin()]        
        return [IsAuthenticated() ]

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
                application = serializer.save(student_id=student_model_id)
                self._send_application_confirmation_email(application)
            else:
                raise serializers.ValidationError("Could not find a matching student record for this user.")
        else:
            raise serializers.ValidationError("Only students can create applications.")        

    def update(self, request, *args, **kwargs):   
            
        return Response(
            {"detail": "Updates to applications are not currently in scope. Try a Patch"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        allowed_fields = ['status']

        filtered_data = {
            key: value for key, value in request.data.items()
            if key in allowed_fields
        }

        if not filtered_data:
             return Response(
            {"detail": "Only the application 'status' can be updated."},
            status=status.HTTP_400_BAD_REQUEST
        )

        serializer = self.get_serializer(instance, data=filtered_data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
    
        return Response(serializer.data)

    @csrf_exempt
    @action(detail=False, methods=['post'], permission_classes=[IsStudentUser])
    def submit_with_responses(self, request):
        """Submit application with dynamic form responses in one call"""
        serializer = ApplicationWithResponsesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        #application_data = validated_data['application']
        #use raw application data instead to prevent bad request error
        raw_application = request.data.get('application', {})
        responses_data = validated_data.get('responses', {})
        template_id = validated_data.get('template_id')
        
        try:
            with transaction.atomic():  # Ensure atomicity
                  # Get user info for student validation
                user_type, user_id = self.get_user_info(request)
                print(f"User type: {user_type}, User ID: {user_id}")
            
                if user_type != 'student':
                    return Response(
                        {"error": "Only students can submit applications"}, 
                        status=status.HTTP_403_FORBIDDEN
                )            
         
                application_serializer = ApplicationSerializer(data=raw_application)

                if not application_serializer.is_valid():
                    return Response(
                        application_serializer.errors, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                application = application_serializer.save()
                
                # If template_id provided, handle dynamic responses
                if template_id and responses_data:
                    template = FormTemplate.objects.get(pk=template_id)
                    
                    # Create mapping of field_name to question_id
                    field_to_question = {}
                    for section in template.sections.all():
                        for question in section.questions.all():
                            field_to_question[question.field_name] = question.question_id
                    
                    # Create responses
                    response_objects = []
                    for field_name, response_value in responses_data.items():
                        if field_name in field_to_question:
                            question_id = field_to_question[field_name]
                            response_obj = ApplicationResponse.objects.create(
                                application=application,
                                question_id=question_id,
                                response_data=response_value
                            )
                            response_objects.append(response_obj)
                
                # Send confirmation email (linked to notification service)
                self._send_application_confirmation_email(application)

                # Return the complete application with responses
                complete_serializer = ApplicationSerializer(application)
                return Response(complete_serializer.data, status=status.HTTP_201_CREATED)
                
        except FormTemplate.DoesNotExist:
            return Response(
                {"error": "Form template not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # helper method to send confirmation email via notification service 
    def _send_application_confirmation_email(self, application):
        """Send confirmation email to student after application submission"""
        import requests
        from django.utils import timezone

        print(f"DEBUG: Starting email send for application {application.application_id}")
        print(f"DEBUG: Student email: {application.student.email}")
        
        try:
            # Prepare the email data
            email_data = {
                'student_email': application.student.email,
                'student_name': application.student.name,
                'course_code': application.posting.title if application.posting else 'N/A',
                'course_name': application.posting.description if application.posting else '',
                'application_date': application.applied_at.strftime('%B %d, %Y at %I:%M %p')
            }

            print(f"DEBUG: Email data prepared: {email_data}")
            
            # Make request to notification service
            notification_url = 'http://notification-service:8006/api/notifications/send_application_received/'
            
            response = requests.post(
                notification_url, 
                json=email_data, 
                timeout=10
            )

            print(f"DEBUG: Response status: {response.status_code}")
            print(f"DEBUG: Response text: {response.text}")
            
            if response.status_code == 200:
                print(f"Application confirmation email sent to {application.student.email}")
            else:
                print(f"Failed to send email: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Error sending confirmation email: {str(e)}")
        except Exception as e:
            print(f"Unexpected error sending email: {str(e)}")

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
    
    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def myapplications(self, request):
              
        user_type, user_id = self.get_user_info(request)

        if user_type != 'student':            
            return Response(
                {"detail": "Only students can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the student model ID from the authenticated user
        student_model_id = self.get_student_model_id(user_id)

        if not student_model_id:
            return Response(
                {"detail": "Could not find student record for authenticated user."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Filter applications for this student, ordered by most recent first
        applications = Application.objects.filter(
            student_id=student_model_id
        ).order_by('-applied_at', '-application_id')

        # Apply any query filters if provided
        filterset = self.filterset_class(request.GET, queryset=applications)
        if filterset.is_valid():
            applications = filterset.qs

        # Paginate if needed
        page = self.paginate_queryset(applications)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)


    
    @action(detail=False, methods=['get'], url_path=r'by-posting/(?P<posting_id>\d+)', permission_classes=[IsSchedulerOrAdmin])  
    def by_posting(self, request, posting_id=None):
        """Get all applications for a specific job posting. Only accessible by schedulers and admins."""
        applications = self.get_queryset().filter(posting_id=posting_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'count-by-posting/(?P<posting_id>\d+)', permission_classes=[IsSchedulerOrAdmin])  # New endpoint
    def count_by_posting(self, request, posting_id=None):
        """Get count of applications for a specific job posting. Only accessible by schedulers and admins."""
        count = self.get_queryset().filter(posting_id=posting_id).count()
        return Response({
            'posting_id': posting_id,
            'application_count': count
        })
        

       

    
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
        

    @action(detail=False, methods=['get'], url_path='myapplications-short', permission_classes=[IsStudentUser])
    def myapplications_short(self, request):      

        user_type, user_id = self.get_user_info(request)

        if user_type != 'student':            
            return Response(
                {"detail": "Only students can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the student model ID from the authenticated user
        student_model_id = self.get_student_model_id(user_id)

        if not student_model_id:
            return Response(
                {"detail": "Could not find student record for authenticated user."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Filter applications for this student, ordered by most recent first
        # Use select_related to optimize database queries
        applications = Application.objects.select_related(
            'posting', 'posting__department', 'posting__term'
        ).filter(
            student_id=student_model_id
        ).order_by('-applied_at', '-application_id') 

        # Use the short serializer instead of the full one
        serializer = ApplicationShortSerializer(applications, many=True)
        return Response(serializer.data)




class FormTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form templates"""
    queryset = FormTemplate.objects.all()
    serializer_class = FormTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['is_active', 'created_by']

#set globally, that inactive templates are not returned
    def get_queryset(self):    
        return FormTemplate.objects.exclude(is_active=False)
    
    def perform_create(self, serializer):
        # Set created_by to current user if authenticated and is a TA scheduler
        if hasattr(self.request.user, 'tascheduler'):
            serializer.save(created_by=self.request.user.tascheduler)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):    
        try:
            form_template = self.get_object()
            form_template.is_active= False
            form_template.save()
            
        # Return the updated job posting data
            serializer = self.get_serializer(form_template)
            return Response(
                {
                    "detail": "Template has been disbaled successfully.",
                    "job_posting": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except FormTemplate.DoesNotExist:
            return Response(
                {"detail": "Form template not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Create a copy of an existing template"""
        original = self.get_object()
        
        try:
            with transaction.atomic():
                # Create new template
                new_template = FormTemplate.objects.create(
                    name=f"{original.name} (Copy)",
                    description=original.description,
                    created_by=request.user.tascheduler if hasattr(request.user, 'tascheduler') else None
                )
                
                # Copy sections and questions
                for section in original.sections.all():
                    new_section = FormSection.objects.create(
                        template=new_template,
                        name=section.name,
                        section_type=section.section_type,
                        order=section.order,
                        is_required=section.is_required,
                        description=section.description
                    )
                    
                    for question in section.questions.all():
                        FormQuestion.objects.create(
                            section=new_section,
                            question_text=question.question_text,
                            question_type=question.question_type,
                            field_name=f"{question.field_name}",  # Ensure unique field names
                            order=question.order,
                            is_required=question.is_required,
                            help_text=question.help_text,
                            validation_rules=question.validation_rules,
                            options=question.options,
                            is_editable = question.is_editable
                        )
                
                serializer = self.get_serializer(new_template)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {"error": f"Failed to duplicate template: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
   

class FormSectionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form sections"""
    queryset = FormSection.objects.all()
    serializer_class = FormSectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template', 'section_type']

class FormQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual form questions"""
    queryset = FormQuestion.objects.all()
    serializer_class = FormQuestionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['section', 'question_type', 'is_required']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple questions at once"""
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'])
    def reorder(self, request):
        """Reorder questions within a section"""
        question_orders = request.data.get('questions', [])
        
        try:
            with transaction.atomic():
                for item in question_orders:
                    question = FormQuestion.objects.get(pk=item['question_id'])
                    question.order = item['order']
                    question.save()
                    
            return Response({"message": "Questions reordered successfully"})
        except FormQuestion.DoesNotExist:
            return Response(
                {"error": "One or more questions not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to reorder questions: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ApplicationResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing application responses"""
    queryset = ApplicationResponse.objects.all()
    serializer_class = ApplicationResponseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['application', 'question']


class ApplicationShortListFilter(django_filters.FilterSet):
    """Filter class for ApplicationShortList"""
    # Filter by TA scheduler
    created_by = django_filters.NumberFilter()
    
    # Filter by application status
    application_status = django_filters.CharFilter(
        field_name='application__status',
        help_text='Filter by application status'
    )
    
    # Filter by job posting
    posting_id = django_filters.NumberFilter(
        field_name='application__posting__posting_id',
        help_text='Filter by job posting ID'
    )
    
    # Filter by term
    term_id = django_filters.NumberFilter(
        field_name='application__termSelection__id',
        help_text='Filter by term ID'
    )
    
    # Filter by student
    student_id = django_filters.NumberFilter(
        field_name='application__student__id',
        help_text='Filter by student ID'
    )
    
    class Meta:
        model = ApplicationShortList
        fields = ['created_by', 'application_status', 'posting_id', 'term_id', 'student_id']


class ApplicationShortListViewSet(viewsets.ModelViewSet):
    """ViewSet for managing application shortlists"""
    queryset = ApplicationShortList.objects.all()
    serializer_class = ApplicationShortListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['application_id', 'created_by_id']
    
       
    # Ordering options
    ordering_fields = ['id']
    ordering = ['-id']  # Most recent shortlists first
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        Only TA Schedulers can access shortlist functionality.
        """
        # All actions require scheduler permissions
        return [IsSchedulerUser()]
    
    def get_queryset(self):
        """
        Filter shortlists based on user role and permissions.
        TA Schedulers can see all shortlists.
        """
        user_type, user_id = self.get_user_info(self.request)
        
        if user_type == 'scheduler':
            # TA Schedulers can see all shortlists
            return ApplicationShortList.objects.all()
        
        # If somehow a non-scheduler gets through, return empty queryset
        return ApplicationShortList.objects.none()
    
    def get_user_info(self, request):
        """Get user type and ID from request"""
        user_type = getattr(request, 'user_type', None)
        user_id = getattr(request, 'user_id', None)
        return user_type, user_id
    
    def get_scheduler_model_id(self, user_id):
        """Get the TAScheduler model ID from the authenticated user ID"""
        try:
            user = User.objects.get(id=user_id)
            scheduler = TAScheduler.objects.get(email=user.email)
            return scheduler.id
        except (User.DoesNotExist, TAScheduler.DoesNotExist):
            return None
    
    def perform_create(self, serializer):       
        user_type, user_id = self.get_user_info(self.request)
        
        if user_type == 'scheduler' and user_id:
            scheduler_model_id = self.get_scheduler_model_id(user_id)            
            if scheduler_model_id:
                serializer.save(created_by_id=scheduler_model_id)           
        elif user_type =='scheduler':
            # Just save it without the scheduler ID
            serializer.save()
    
    @action(detail=False, methods=['get'], url_path=r'by-scheduler/(?P<scheduler_id>\d+)', permission_classes=[IsSchedulerUser])
    def by_scheduler(self, request, scheduler_id=None):
        """Get all shortlisted applications by a specific TA scheduler"""
        # Ensure only schedulers can access this
        user_type, user_id = self.get_user_info(request)
        
        if user_type != 'scheduler':
            return Response(
                {"detail": "Only TA Schedulers can access shortlist data."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        shortlists = self.get_queryset().filter(created_by_id=scheduler_id)
        serializer = self.get_serializer(shortlists, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-application/(?P<application_id>\d+)', permission_classes=[IsSchedulerUser])
    def by_application(self, request, application_id=None):
        """Get shortlisted application data by application id"""
        user_type, user_id = self.get_user_info(request)
        
        if user_type != 'scheduler':
            return Response(
                {"detail": "Only TA Schedulers can access shortlist data."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        shortlists = self.get_queryset().filter(application_id=application_id)
        serializer = self.get_serializer(shortlists, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path=r'by-application/(?P<application_id>\d+)/exists', permission_classes=[IsSchedulerUser])
    def application_shortlisted(self, request, application_id=None):
        """Check if application is shortlisted"""
        user_type, user_id = self.get_user_info(request)
        
        if user_type != 'scheduler':
            return Response(
                {"detail": "Only TA Schedulers can access shortlist data."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        exists = self.get_queryset().filter(application_id=application_id).exists()
        return Response({'shortlisted': exists})


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer   

    def get_permissions(self):
        """Apply custom permission logic."""        
        print(f"DEBUG: get_permissions called for action: {self.action}")
        if self.action in ['list', 'retrieve', 'by_application']: 
            print("DEBUG: Returning AllowAny permission for testing")
            return [IsStudentOrSchedulerOrAdmin()] #get_queryset finetunes this further
        elif self.action in ['create','destroy', 'update', 'partial_update']:
            print("DEBUG: Returning IsStudentUser permission")
            return [IsStudentUser()]       #only student users can create application documents or remove them 
        print("DEBUG: Returning default permissions")
        return super().get_permissions()

    def get_queryset(self):
        """Restrict access based on user role."""
        user_type, user_id = self.get_user_info(self.request)

        if user_type in ['scheduler', 'admin']:
            return Document.objects.all()

        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            return Document.objects.filter(student_id=student_model_id)

        return Document.objects.none()

    def perform_create(self, serializer):
        """Auto-attach the student to the uploaded document if applicable."""
        user_type, user_id = self.get_user_info(self.request)

        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                serializer.save(student_id=student_model_id)
            else:
                raise serializers.ValidationError("No matching student record found.")
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Ensure students can only delete their own documents."""
        instance = self.get_object()
        user_type, user_id = self.get_user_info(request)

        if user_type == 'student':
            student_model_id = self.get_student_model_id(user_id)
            if instance.student_id != student_model_id:
                return Response(
                    {"detail": "You are not authorized to delete this document."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().destroy(request, *args, **kwargs)

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
        
    @action(detail=True, methods=['get'])
    def signed_download_url(self, request, pk=None):
        document = self.get_object()
        path = document.file.name
        signed_url = generate_signed_url(path)  # signed url to return to nginx
        return Response({'url': signed_url})
    
    @action(detail=False, methods=['get'], url_path=r'by-application/(?P<application_id>\d+)')
    def by_application(self, request, application_id=None):        
        user_type, user_id = self.get_user_info(request)

        # Get the base queryset (already filtered by permissions)
        queryset = self.get_queryset()

        # Filter by application ID
        documents = queryset.filter(application_id=application_id)

        # Additional security check for students - ensure they can only see documents from their own applications
        if user_type == 'student' and user_id:
            student_model_id = self.get_student_model_id(user_id)
            if student_model_id:
                # Verify the application belongs to this student
                print(f"Authenticated student_model_id: {student_model_id}")
                try:
                    from .models import Application
                    application = Application.objects.get(
                        application_id=application_id,
                        student_id=student_model_id
                    )
                    print("Application is owned by this student.")
                except Application.DoesNotExist:
                    print("Application does not belong to this student.")
                    return Response(
                        {"detail": "Application not found or you do not have permission to view its documents."},
                        status=status.HTTP_404_NOT_FOUND
                    )

        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)


        
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Applications & Job Postings Service is running',
        'service_scope': 'Job postings and application management',
        'version': '1.0',
        
        'public_endpoints': {
            'api_root': '/api/ajp/',
            
            # Job Postings - Public endpoints
            'job_postings': '/api/ajp/jobpostings/',
            'open_jobs': '/api/ajp/jobpostings/open/',
            'active_jobs': '/api/ajp/jobpostings/active/',
            'jobs_by_term': '/api/ajp/jobpostings/by-term/{term_id}/',
        },
        
        'student_endpoints': {
            'description': 'Endpoints available to authenticated students',
            
            # Application endpoints for students
            'my_applications': '/api/ajp/applications/myapplications/',
            'submit_application': '/api/ajp/applications/',
            'submit_with_responses': '/api/ajp/applications/submit_with_responses/',
            'update_application_status': '/api/ajp/applications/{id}/',  # PATCH only
            'my_applications_by_id': '/api/ajp/applications/by-student/{student_id}/',
            'my_applications_short': '/api/ajp/applications/myapplications-short/', 
            'application_documents': '/api/ajp/documents/by-application/{application_id}/' 
        },
        
        'scheduler_endpoints': {
            'description': 'Endpoints available to TA Schedulers',
            
            # Job Posting Management
            'create_job_posting': '/api/ajp/jobpostings/',
            'update_job_posting': '/api/ajp/jobpostings/{id}/',
            'archive_job_posting': '/api/ajp/jobpostings/{id}/',  # DELETE (archives)
            'count_by_posting': '/api/ajp/count-by-posting/{id}',
            
            # Application Management
            'all_applications': '/api/ajp/applications/',
            'applications_by_posting': '/api/ajp/applications/by-posting/{posting_id}/',
            'application_by_id': '/api/ajp/applications/by-id/{application_id}/',
            
            # Form Template Management
            'form_templates': '/api/ajp/form-templates/',
            'create_form_template': '/api/ajp/form-templates/',
            'duplicate_template': '/api/ajp/form-templates/{id}/duplicate/',
            'disable_template': '/api/ajp/form-templates/{id}/',  # DELETE (disables)
            
            # Form Section Management
            'form_sections': '/api/ajp/form-sections/',
            'create_form_section': '/api/ajp/form-sections/',
            
            # Form Question Management
            'form_questions': '/api/ajp/form-questions/',
            'bulk_create_questions': '/api/ajp/form-questions/bulk_create/',
            'reorder_questions': '/api/ajp/form-questions/reorder/',
            
            # Application Response Management
            'application_responses': '/api/ajp/application-responses/',
            
            # Shortlist Management - NEW SECTION
            'application_shortlists': '/api/ajp/application-shortlists/',
            'create_shortlist': '/api/ajp/application-shortlists/',
            'shortlists_by_scheduler': '/api/ajp/application-shortlists/by-scheduler/{scheduler_id}/',
            'shortlists_by_application': '/api/ajp/application-shortlists/by-application/{application_id}/',
            'check_if_shortlisted': '/api/ajp/application-shortlists/by-application/{application_id}/exists/',
        },        
       
        'authentication_notes': {
            'public': 'No authentication required',
            'student': 'Requires student authentication token',
            'scheduler': 'Requires TA Scheduler authentication token',
            'admin': 'Requires admin authentication token'
        }
    })

