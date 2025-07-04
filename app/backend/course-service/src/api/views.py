from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import JsonResponse
from django.db import models
from .models import AcademicTerm, Course, TimeSlot, CourseOffering
from .serializers import (
    AcademicTermSerializer, 
    AcademicTermCreateSerializer,
    CourseSerializer,
    CourseCreateSerializer,
    TimeSlotSerializer,
    TimeSlotCreateSerializer,
    CourseOfferingSerializer,
    CourseOfferingCreateSerializer
)

# Create your views here.

# Academic terms viewset
class AcademicTermViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Academic Terms.
    Provides CRUD operations: list, create, retrieve, update, destroy
    """
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer
    lookup_field = 'term_id'
    
    def get_serializer_class(self):
        """Use different serializer for create/update operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return AcademicTermCreateSerializer
        return AcademicTermSerializer
    
    def get_queryset(self):
        """Filter academic terms by query parameters"""
        queryset = AcademicTerm.objects.all()
        year = self.request.query_params.get('year', None)
        term = self.request.query_params.get('term', None)
        
        if year is not None:
            queryset = queryset.filter(year=year)
        if term is not None:
            queryset = queryset.filter(term=term)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def current_term(self, request):
        """Custom action to get the current academic term"""
        from django.utils import timezone
        current_date = timezone.now().date()
        
        # Find term where current date is between start_date and end_date
        current_term = AcademicTerm.objects.filter(
            start_date__lte=current_date,
            end_date__gte=current_date
        ).first()
        
        if current_term:
            serializer = self.get_serializer(current_term)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'No current academic term found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


# Course ViewSet
class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Courses.
    Provides CRUD operations: list, create, retrieve, update, destroy
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    lookup_field = 'course_number'
    
    def get_serializer_class(self):
        """Use different serializer for create/update operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateSerializer
        return CourseSerializer
    
    def get_queryset(self):
        """Filter courses by department if provided"""
        queryset = Course.objects.all()
        department = self.request.query_params.get('department', None)
        course_level = self.request.query_params.get('level', None)
        
        if department is not None:
            queryset = queryset.filter(department__icontains=department)
        if course_level is not None:
            queryset = queryset.filter(course_level=course_level)
            
        return queryset.order_by('course_number')
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Custom action to group courses by department"""
        departments = Course.objects.values_list('department', flat=True).distinct()
        result = {}
        
        for dept in departments:
            courses = Course.objects.filter(department=dept)
            result[dept] = CourseSerializer(courses, many=True).data
            
        return Response(result)

# TimeSlot ViewSet
class TimeSlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TimeSlots.
    Provides CRUD operations: list, create, retrieve, update, destroy
    """
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    lookup_field = 'slot_id'
    
    def get_serializer_class(self):
        """Use different serializer for create/update operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return TimeSlotCreateSerializer
        return TimeSlotSerializer
    
    def get_queryset(self):
        """Filter time slots by day or time range"""
        queryset = TimeSlot.objects.all()
        day = self.request.query_params.get('day', None)
        start_time = self.request.query_params.get('start_time', None)
        
        if day is not None:
            queryset = queryset.filter(day=day)
        if start_time is not None:
            queryset = queryset.filter(start_time__gte=start_time)
            
        return queryset.order_by('day', 'start_time')
    
    @action(detail=False, methods=['get'])
    def by_day(self, request):
        """Custom action to group time slots by day"""
        from collections import defaultdict
        
        slots_by_day = defaultdict(list)
        time_slots = TimeSlot.objects.all().order_by('day', 'start_time')
        
        for slot in time_slots:
            serialized_slot = TimeSlotSerializer(slot).data
            slots_by_day[slot.day].append(serialized_slot)
            
        return Response(dict(slots_by_day))
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Custom action to get available time slots (not assigned to any course offering)"""
        available_slots = TimeSlot.objects.filter(course_offerings__isnull=True)
        serializer = TimeSlotSerializer(available_slots, many=True)
        return Response(serializer.data)

# Course Offering ViewSet
class CourseOfferingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course Offerings.
    Provides CRUD operations: list, create, retrieve, update, destroy
    """
    queryset = CourseOffering.objects.all()
    serializer_class = CourseOfferingSerializer
    lookup_field = 'course_offering_id'
    
    def get_serializer_class(self):
        """Use different serializer for create/update operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return CourseOfferingCreateSerializer
        return CourseOfferingSerializer
    
    def get_queryset(self):
        """Filter course offerings by term, course, or instructor"""
        queryset = CourseOffering.objects.all()
        term_id = self.request.query_params.get('term_id', None)
        course_number = self.request.query_params.get('course_number', None)
        instructor_id = self.request.query_params.get('instructor_id', None)
        
        if term_id is not None:
            queryset = queryset.filter(academic_term__term_id=term_id)
        if course_number is not None:
            queryset = queryset.filter(course__course_number=course_number)
        if instructor_id is not None:
            queryset = queryset.filter(instructor__employee_number=instructor_id)
            
        return queryset.select_related('course', 'academic_term', 'instructor')
    
    @action(detail=False, methods=['get'])
    def current_term_offerings(self, request):
        """Get all course offerings for the current academic term"""
        from django.utils import timezone
        current_date = timezone.now().date()
        
        # Find current term
        current_term = AcademicTerm.objects.filter(
            start_date__lte=current_date,
            end_date__gte=current_date
        ).first()
        
        if current_term:
            offerings = CourseOffering.objects.filter(academic_term=current_term)
            serializer = CourseOfferingSerializer(offerings, many=True)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'No current academic term found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Courses and Terms service is running',
        'service': 'course-service',
        'version': '1.0.0',
        'architecture': 'ViewSet-based API with DRF Router',
        'available_endpoints': {
            'academic_terms': {
                'list_create': '/api/course-term-service/academic-terms/ [GET, POST]',
                'detail': '/api/course-term-service/academic-terms/{term_id}/ [GET, PUT, PATCH, DELETE]',
                'current_term': '/api/course-term-service/academic-terms/current_term/ [GET]',
            },
            'courses': {
                'list_create': '/api/course-term-service/courses/ [GET, POST]',
                'detail': '/api/course-term-service/courses/{course_number}/ [GET, PUT, PATCH, DELETE]',
                'by_department': '/api/course-term-service/courses/by_department/ [GET]',
            },
            'time_slots': {
                'list_create': '/api/course-term-service/time-slots/ [GET, POST]',
                'detail': '/api/course-term-service/time-slots/{slot_id}/ [GET, PUT, PATCH, DELETE]',
                'by_day': '/api/course-term-service/time-slots/by_day/ [GET]',
                'available_slots': '/api/course-term-service/time-slots/available_slots/ [GET]',
            },
            'course_offerings': {
                'list_create': '/api/course-term-service/course-offerings/ [GET, POST]',
                'detail': '/api/course-term-service/course-offerings/{course_offering_id}/ [GET, PUT, PATCH, DELETE]',
                'current_term_offerings': '/api/course-term-service/course-offerings/current_term_offerings/ [GET]',
            },
        },
        'query_parameters': {
            'academic_terms': {
                'year': 'Filter by year (e.g., ?year=2024)',
                'term': 'Filter by term (e.g., ?term=winter)'
            },
            'courses': {
                'department': 'Filter by department (e.g., ?department=CS)',
                'level': 'Filter by course level (e.g., ?level=400)'
            },
            'time_slots': {
                'day': 'Filter by day (e.g., ?day=monday)',
                'start_time': 'Filter by start time (e.g., ?start_time=09:00:00)'
            },
            'course_offerings': {
                'term_id': 'Filter by term ID (e.g., ?term_id=uuid)',
                'course_number': 'Filter by course number (e.g., ?course_number=COSC499)',
                'instructor_id': 'Filter by instructor ID (e.g., ?instructor_id=12345)'
            }
        },
        'custom_actions': {
            'description': 'ViewSets provide custom actions beyond standard CRUD operations',
            'examples': [
                'current_term - Get the current active academic term',
                'by_department - Group courses by department',
                'by_day - Group time slots by day of the week',
                'current_term_offerings - Get course offerings for current term'
            ]
        },
        'documentation': 'Visit /api/docs/ for detailed API documentation'
    })
