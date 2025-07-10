from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

# Import all models
from .models import (
    Term,
    Faculty,
    Instructor,
    Department,
    TimeSlot,
    Course,
    CourseOffering,
    SharedSession,
    InstructorRequest
)

# Import all serializers
from .serializers import (
    TermSerializer,
    FacultySerializer,
    InstructorSerializer,
    DepartmentSerializer,
    TimeSlotSerializer,
    CourseSerializer,
    CourseOfferingSerializer,
    SharedSessionSerializer,
    InstructorRequestSerializer
)

# Term ViewSet
class TermViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Term model with full CRUD operations.
    Provides filtering, searching, and ordering capabilities.
    """
    queryset = Term.objects.all()
    serializer_class = TermSerializer
    permission_classes = [AllowAny]  # Adjust based on your auth requirements
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'is_active': ['exact'],
        'term_type': ['exact', 'in'],
        'startCalendarYear': ['exact', 'gte', 'lte'],
        'endCalendarYear': ['exact', 'gte', 'lte'],
        'start': ['exact', 'gte', 'lte'],
        'end': ['exact', 'gte', 'lte'],
        'academicYear': ['exact', 'icontains'],
    }
    
    # Define searchable fields
    search_fields = ['code', 'description', 'academicYear']
    
    # Define ordering fields
    ordering_fields = ['code', 'start', 'end', 'startCalendarYear', 'createdAt']
    ordering = ['-startCalendarYear', 'start']  # Default ordering
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get all active terms.
        """
        active_terms = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_terms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get currently active terms (based on date range).
        """
        from django.utils import timezone
        today = timezone.now().date()
        current_terms = self.queryset.filter(
            start__lte=today,
            end__gte=today,
            is_active=True
        )
        serializer = self.get_serializer(current_terms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_year(self, request):
        """
        Get terms by calendar year.
        Usage: /terms/by_year/?year=2025
        """
        year = request.query_params.get('year')
        if not year:
            return Response(
                {'error': 'Year parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            terms = self.queryset.filter(startCalendarYear=year)
            serializer = self.get_serializer(terms, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def subterms(self, request, pk=None):
        """
        Get all subterms of a specific term.
        """
        term = self.get_object()
        subterms = term.get_subterms()
        serializer = self.get_serializer(subterms, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def course_offerings(self, request, pk=None):
        """
        Get all course offerings for a specific term.
        """
        term = self.get_object()
        from .serializers import CourseOfferingSerializer
        course_offerings = term.course_offerings.all()
        serializer = CourseOfferingSerializer(course_offerings, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """
        Custom create logic if needed.
        """
        serializer.save()
    
    def perform_update(self, serializer):
        """
        Custom update logic if needed.
        """
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Custom delete logic - check for dependencies before deletion.
        """
        # Check if term has associated course offerings
        if instance.course_offerings.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Cannot delete term with associated course offerings. "
                "Please remove course offerings first."
            )
        
        # Check if term has associated lab sections
        if instance.lab_sections.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Cannot delete term with associated lab sections. "
                "Please remove lab sections first."
            )
        
        instance.delete()

# API Root View
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    """
    API Root - Shows all available endpoints for the Course Service API.
    """
    return Response({
        'message': 'Welcome to the Course Service API',
        'version': '1.0',
        'endpoints': {
            'terms': {
                'list': {
                    'url': '/api/course-term-service/terms/',
                    'methods': ['GET', 'POST'],
                    'description': 'List all terms or create a new term'
                },
                'detail': {
                    'url': '/api/course-term-service/terms/{id}/',
                    'methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
                    'description': 'Retrieve, update, or delete a specific term'
                },
                'active': {
                    'url': '/api/course-term-service/terms/active/',
                    'methods': ['GET'],
                    'description': 'Get all active terms'
                },
                'current': {
                    'url': '/api/course-term-service/terms/current/',
                    'methods': ['GET'],
                    'description': 'Get currently active terms (based on date range)'
                },
                'by_year': {
                    'url': '/api/course-term-service/terms/by_year/?year=2025',
                    'methods': ['GET'],
                    'description': 'Get terms by calendar year (year parameter required)'
                },
                'subterms': {
                    'url': '/api/course-term-service/terms/{id}/subterms/',
                    'methods': ['GET'],
                    'description': 'Get all subterms of a specific term'
                },
                'course_offerings': {
                    'url': '/api/course-term-service/terms/{id}/course_offerings/',
                    'methods': ['GET'],
                    'description': 'Get all course offerings for a specific term'
                }
            }
        },
        'features': {
            'filtering': 'Endpoints support filtering with query parameters',
            'searching': 'Use ?search=query to search across relevant fields',
            'ordering': 'Use ?ordering=field_name or ?ordering=-field_name for sorting',
            'pagination': 'Results are paginated by default'
        },
        'examples': {
            'filter_active_terms': '/api/course-term-service/terms/?is_active=true',
            'search_terms': '/api/course-term-service/terms/?search=winter',
            'order_by_year': '/api/course-term-service/terms/?ordering=-startCalendarYear',
            'filter_winter_terms': '/api/course-term-service/terms/?term_type=winter&startCalendarYear=2025'
        },
        'note': 'More endpoints will be added as additional ViewSets are implemented'
    })
