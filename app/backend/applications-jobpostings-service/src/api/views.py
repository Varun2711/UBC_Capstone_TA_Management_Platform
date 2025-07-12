from django.shortcuts import render
from django.http import JsonResponse, HttpRequest
from rest_framework.decorators import api_view, action
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import *
from .serializers import *
import django_filters
from django.utils import timezone
from django.db import transaction



#create a custom filter class to enable filtering on department and term
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

#refactored function based views to class based views and using viewsets to be consistent with new services
class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = JobPostingFilter # use the custom filter created above
    
    #enable searched based on post title, description, and department name
    search_fields = ['title', 'description', 'department__name'] 
    ordering_fields = ['post_date', 'title']
    
    #override global default to only return non-archived jobs
    def get_queryset(self):    
        return JobPosting.objects.exclude(status='archived')

    # Optional: custom action to list only "open" postings
    @action(detail=False, methods=['get'])
    def open(self, request):
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
    def active(self, request):    
       
        jobs = JobPosting.objects.filter(
            status='open',
            deadline_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-term/(?P<term_id>\d+)')
    def by_term(self, request, term_id=None):    
        jobs = JobPosting.objects.filter(term_id=term_id)
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)


#use a specific class to handle all our filtering for application

class ApplicationFilter(django_filters.FilterSet):  
    """ Application Filter Class used to create custom filters for Application requests"""
    status = django_filters.CharFilter()
    positionType = django_filters.CharFilter()
    fullTimeEnrollment = django_filters.CharFilter()
    termSelection = django_filters.NumberFilter()
    workload = django_filters.CharFilter()
    hasOtherPositions = django_filters.CharFilter()

    #allow filtering on term code
    term_code = django_filters.CharFilter(
        field_name='termSelection__code',
        lookup_expr='iexact',
        help_text='Filter by term code (e.g., W2025)'
    )
    
    # Now, we specifically want to TA scheduler to be able to filter by  discipline 
    discipline = django_filters.CharFilter(
        method='filter_by_discipline',
        help_text='Filter applications that include this discipline in any rank'
    )
    
    #enables TA Schedulers or Admins to filter applications by disciplines
    #queryset filter uses iexact which makes the filter case insensstive 
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
    """ ViewSet for Applications which manages GET, PUT, POST, DELETE ops"""
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ApplicationFilter # now we use the Application Filter created above    
  
    search_fields = [
        'student__name',           # Search by student name
        'student__student_number', # Search by student number
        'posting__title',          # Search by job posting title
       
    ]
    
    # More ordering options
    ordering_fields = [
        'applied_at',        
        'status',
        'positionType'
    ]
    
    # Default ordering is the newest application first)
    ordering = ['-applied_at']

    def perform_create(self, serializer):        
        serializer.save()
    
    
    def update(self, request, *args, **kwargs):
        """Disallow updates to applications"""
        return Response(
            {"detail": "Updates to applications are not currently in scope."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def partial_update(self, request, *args, **kwargs):
        """Disallow partial updates to applications"""
        return Response(
            {"detail": "Updates to applications are not currently in scope."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=False, methods=['post'])
    def submit_with_responses(self, request):
        """Submit application with dynamic form responses in one call"""
        serializer = ApplicationWithResponsesSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        application_data = validated_data['application']
        responses_data = validated_data.get('responses', {})
        template_id = validated_data.get('template_id')
        
        try:
            with transaction.atomic():  # Ensure atomicity
                # Create the application
                application_serializer = ApplicationSerializer(data=application_data)
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
        
    @action(detail=False, methods=['get'], url_path=r'by-student/(?P<student_id>\d+)') 
    #get method using the student_id
    def by_student(self, request, student_id=None):
        """Get all applications for a specific student"""
        applications = self.queryset.filter(student_id=student_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-posting/(?P<posting_id>\d+)')
    #get method using the posting_id
    def by_posting(self, request, posting_id=None):
        """Get all applications for a specific job posting"""
        applications = self.queryset.filter(posting_id=posting_id)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path=r'by-id/(?P<application_id>\d+)')    
    def by_id(self, request, application_id=None):
     #Get a specific application by ID
        try:
            application = Application.objects.get(application_id=application_id)
            serializer = self.get_serializer(application)
            return Response(serializer.data)
        except Application.DoesNotExist:
            return Response(
            {"detail": "Application not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )


# Add these ViewSets to your views.py

class FormTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing form templates"""
    queryset = FormTemplate.objects.all()
    serializer_class = FormTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['is_active', 'created_by']
    
    def perform_create(self, serializer):
        # Set created_by to current user if authenticated and is a TA scheduler
        if hasattr(self.request.user, 'tascheduler'):
            serializer.save(created_by=self.request.user.tascheduler)
        else:
            serializer.save()
    
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
                            field_name=f"{question.field_name}_copy",  # Ensure unique field names
                            order=question.order,
                            is_required=question.is_required,
                            help_text=question.help_text,
                            validation_rules=question.validation_rules,
                            options=question.options
                        )
                
                serializer = self.get_serializer(new_template)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {"error": f"Failed to duplicate template: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=True, methods=['put', 'patch'])
    def update_template(self, request, pk=None):
        """Custom update action for templates with sections and questions"""
        template = self.get_object()
        
        try:
            with transaction.atomic():
                # Update template basic info
                template.name = request.data.get('name', template.name)
                template.description = request.data.get('description', template.description)
                template.is_active = request.data.get('is_active', template.is_active)
                template.save()
                
                # Handle sections if provided
                sections_data = request.data.get('sections', [])
                if sections_data:
                    # Clear existing sections (this will cascade to questions)
                    template.sections.all().delete()
                    
                    # Create new sections and questions
                    for section_data in sections_data:
                        questions_data = section_data.pop('questions', [])
                        
                        section = FormSection.objects.create(
                            template=template,
                            name=section_data.get('name', 'Untitled Section'),
                            section_type=section_data.get('section_type', 'custom'),
                            order=section_data.get('order', 1),
                            is_required=section_data.get('is_required', True),
                            description=section_data.get('description', '')
                        )
                        
                        for question_data in questions_data:
                            FormQuestion.objects.create(
                                section=section,
                                question_text=question_data.get('question_text', ''),
                                question_type=question_data.get('question_type', 'text'),
                                field_name=question_data.get('field_name', ''),
                                order=question_data.get('order', 1),
                                is_required=question_data.get('is_required', False),
                                help_text=question_data.get('help_text', ''),
                                validation_rules=question_data.get('validation_rules', {}),
                                options=question_data.get('options', [])
                            )
                
                # Return updated template
                serializer = self.get_serializer(template)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {"error": f"Failed to update template: {str(e)}"}, 
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