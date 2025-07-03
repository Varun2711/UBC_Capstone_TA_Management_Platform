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

    # Optional: custom action to list only "open" postings
    @action(detail=False, methods=['get'])
    def open(self, request):
        jobs = JobPosting.objects.filter(status='open')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    #Prevent deletion of job postings. They can be marked as archived or closed.
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Deletion of job postings is not allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
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
            'termSelection', 'workload', 'hasOtherPositions'
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