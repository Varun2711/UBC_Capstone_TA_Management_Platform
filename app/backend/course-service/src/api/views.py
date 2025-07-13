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
    Instructor,
    Department,
    TimeSlot,
    Course,
    CourseOffering,
    SharedSession,
    InstructorRequest,
    Student
)

# Import all serializers
from .serializers import (
    TermSerializer,
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
        subterms = term.subterms.all()  # Use the related name from the model
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

# Course ViewSet
class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model with full CRUD operations.
    Provides filtering, searching, and ordering capabilities.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]  # Adjust based on your auth requirements
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'course_number': ['exact', 'icontains'],
        'course_name': ['icontains'],
        'department': ['exact'],
        'course_level': ['exact', 'icontains'],
    }
    
    # Define searchable fields
    search_fields = ['course_number', 'course_name', 'course_description']
    
    # Define ordering fields
    ordering_fields = ['course_number', 'course_name', 'course_level']
    ordering = ['course_number']  # Default ordering
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """
        Get courses by department.
        Usage: /courses/by_department/?department_id=1
        """
        department_id = request.query_params.get('department_id')
        if not department_id:
            return Response(
                {'error': 'department_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            department_id = int(department_id)
            courses = self.queryset.filter(department_id=department_id)
            serializer = self.get_serializer(courses, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid department_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """
        Get courses by level (e.g., "100", "200", "300", "400").
        Usage: /courses/by_level/?level=300
        """
        level = request.query_params.get('level')
        if not level:
            return Response(
                {'error': 'level parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        courses = self.queryset.filter(course_level__icontains=level)
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def offerings(self, request, pk=None):
        """
        Get all course offerings for a specific course.
        """
        course = self.get_object()
        course_offerings = course.offerings.all()
        serializer = CourseOfferingSerializer(course_offerings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def current_offerings(self, request, pk=None):
        """
        Get current course offerings for a specific course (active terms).
        """
        course = self.get_object()
        from django.utils import timezone
        today = timezone.now().date()
        current_offerings = course.offerings.filter(
            academic_term__start__lte=today,
            academic_term__end__gte=today,
            academic_term__is_active=True
        )
        serializer = CourseOfferingSerializer(current_offerings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def full_details(self, request, pk=None):
        """
        Get complete course details with offerings and shared sessions organized by term.
        Returns data in the format: course info + offerings + sharedSessions grouped by term-year.
        """
        course = self.get_object()
        
        # Get all course offerings for this course
        offerings = course.offerings.select_related('academic_term', 'instructor').all()
        
        # Get all shared sessions for this course
        shared_sessions = course.lab_sections.select_related(
            'academic_term', 'student'
        ).prefetch_related('time_slots').all()
        
        # Build the response data
        response_data = {
            'id': course.id,  # Bug fix: Use course.id instead of course_number
            'code': course.course_number,
            'title': course.course_name,
            'department': course.department.name,
            'description': course.course_description or '',
            'offerings': [],
            'sharedSessions': {}
        }
        
        # Process course offerings
        for offering in offerings:
            offering_data = {
                'id': str(offering.course_offering_id),
                'year': str(offering.academic_term.startCalendarYear),
                'term': offering.academic_term.code,
                'instructor_id': offering.instructor.id if offering.instructor else None,  # Give instructor id instead of name
                'section': offering.section_number,
                'requirements': {
                    'specialRequirements': []  # This would need to be added to model if needed
                }
            }
            response_data['offerings'].append(offering_data)
        
        # Process shared sessions, grouped by term (remove year from term parent)
        for session in shared_sessions:
            term_key = session.academic_term.code  # Remove year from term parent key
            
            # Initialize term group if not exists
            if term_key not in response_data['sharedSessions']:
                response_data['sharedSessions'][term_key] = {
                    'labs': [],
                    'tutorials': [],
                    'seminars': [],
                    'workshops': []
                }
            
            # Get time slot information
            time_slots = session.time_slots.all()
            time_info = []
            time_increments = []
            location = "TBD"  # Location would need to be added to model if needed
            
            for slot in time_slots:
                time_info.append({
                    'day': slot.get_day_display(),
                    'time': f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}"
                })
                # Add time increments from this slot
                time_increments.extend(slot.time_increments)
            
            # Remove duplicates and sort time increments
            time_increments = sorted(list(set(time_increments)))
            
            # Build session data
            session_data = {
                'id': str(session.shared_session_id),
                'section': session.section_number,
                'day': time_info[0]['day'] if time_info else 'TBD',
                'time': time_info[0]['time'] if time_info else 'TBD',
                'time_increments': time_increments,  # Add the 30-minute increments
                'location': location,
                'student_id': session.student.id if session.student else None,  # Changed from instructor to student
                'forCourse': course.id  # Change from forOfferings to forCourse with course id
            }
            
            # Add to appropriate session type list
            session_type = session.session_type.lower()
            if session_type == 'lab':
                response_data['sharedSessions'][term_key]['labs'].append(session_data)
            elif session_type == 'tutorial':
                response_data['sharedSessions'][term_key]['tutorials'].append(session_data)
            elif session_type == 'seminar':
                response_data['sharedSessions'][term_key]['seminars'].append(session_data)
            elif session_type == 'workshop':
                response_data['sharedSessions'][term_key]['workshops'].append(session_data)
        
        return Response(response_data)
    
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
        # Check if course has associated course offerings
        if instance.offerings.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Cannot delete course with associated course offerings. "
                "Please remove course offerings first."
            )
        
        instance.delete()

# CourseOffering ViewSet
class CourseOfferingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CourseOffering model with full CRUD operations.
    Provides filtering, searching, and ordering capabilities.
    """
    queryset = CourseOffering.objects.all()
    serializer_class = CourseOfferingSerializer
    permission_classes = [AllowAny]  # Adjust based on your auth requirements
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'course': ['exact'],
        'section_number': ['exact', 'icontains'],
        'academic_term': ['exact'],
        'instructor': ['exact'],
        'course__course_number': ['exact', 'icontains'],
        'course__course_name': ['icontains'],
        'course__department': ['exact'],
        'academic_term__startCalendarYear': ['exact', 'gte', 'lte'],
        'academic_term__is_active': ['exact'],
        'academic_term__term_type': ['exact', 'in'],
    }
    
    # Define searchable fields
    search_fields = ['course__course_number', 'course__course_name', 'section_number', 'instructor__name']
    
    # Define ordering fields
    ordering_fields = ['course__course_number', 'section_number', 'academic_term__startCalendarYear']
    ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']  # Default ordering
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get current course offerings (active terms).
        """
        from django.utils import timezone
        today = timezone.now().date()
        current_offerings = self.queryset.filter(
            academic_term__start__lte=today,
            academic_term__end__gte=today,
            academic_term__is_active=True
        )
        serializer = self.get_serializer(current_offerings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_term(self, request):
        """
        Get course offerings by academic term.
        Usage: /course-offerings/by_term/?term_id=1
        """
        term_id = request.query_params.get('term_id')
        if not term_id:
            return Response(
                {'error': 'term_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            term_id = int(term_id)
            offerings = self.queryset.filter(academic_term_id=term_id)
            serializer = self.get_serializer(offerings, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid term_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_course(self, request):
        """
        Get course offerings by course.
        Usage: /course-offerings/by_course/?course_id=1
        """
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course_id = int(course_id)
            offerings = self.queryset.filter(course_id=course_id)
            serializer = self.get_serializer(offerings, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid course_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_instructor(self, request):
        """
        Get course offerings by instructor.
        Usage: /course-offerings/by_instructor/?instructor_id=1
        """
        instructor_id = request.query_params.get('instructor_id')
        if not instructor_id:
            return Response(
                {'error': 'instructor_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instructor_id = int(instructor_id)
            offerings = self.queryset.filter(instructor_id=instructor_id)
            serializer = self.get_serializer(offerings, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid instructor_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_year(self, request):
        """
        Get course offerings by calendar year.
        Usage: /course-offerings/by_year/?year=2025
        """
        year = request.query_params.get('year')
        if not year:
            return Response(
                {'error': 'year parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            offerings = self.queryset.filter(academic_term__startCalendarYear=year)
            serializer = self.get_serializer(offerings, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
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
        Custom delete logic if needed.
        """
        instance.delete()

# SharedSession ViewSet
class SharedSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SharedSession model with full CRUD operations.
    Provides filtering, searching, and ordering capabilities.
    """
    queryset = SharedSession.objects.all()
    serializer_class = SharedSessionSerializer
    permission_classes = [AllowAny]  # Adjust based on your auth requirements
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'session_type': ['exact', 'icontains'],
        'course': ['exact'],
        'section_number': ['exact', 'icontains'],
        'academic_term': ['exact'],
        'student': ['exact'],
        'course__course_number': ['exact', 'icontains'],
        'course__course_name': ['icontains'],
        'course__department': ['exact'],
        'academic_term__startCalendarYear': ['exact', 'gte', 'lte'],
        'academic_term__is_active': ['exact'],
        'academic_term__term_type': ['exact', 'in'],
        'student__student_number': ['exact', 'icontains'],
        'student__name': ['icontains'],
        'student__program': ['icontains'],
        'student__study_level': ['exact', 'icontains'],
    }
    
    # Define searchable fields
    search_fields = ['session_type', 'course__course_number', 'course__course_name', 'section_number', 'student__name', 'student__student_number']
    
    # Define ordering fields
    ordering_fields = ['session_type', 'course__course_number', 'section_number', 'academic_term__startCalendarYear']
    ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'session_type', 'section_number']  # Default ordering
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get current shared sessions (active terms).
        """
        from django.utils import timezone
        today = timezone.now().date()
        current_sessions = self.queryset.filter(
            academic_term__start__lte=today,
            academic_term__end__gte=today,
            academic_term__is_active=True
        )
        serializer = self.get_serializer(current_sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_term(self, request):
        """
        Get shared sessions by academic term.
        Usage: /shared-sessions/by_term/?academic_term_id=1
        """
        academic_term_id = request.query_params.get('academic_term_id')
        if not academic_term_id:
            return Response(
                {'error': 'academic_term_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            academic_term_id = int(academic_term_id)
            sessions = self.queryset.filter(academic_term_id=academic_term_id)
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid academic_term_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_course(self, request):
        """
        Get shared sessions by course.
        Usage: /shared-sessions/by_course/?course_id=1
        """
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response(
                {'error': 'course_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course_id = int(course_id)
            sessions = self.queryset.filter(course_id=course_id)
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid course_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_session_type(self, request):
        """
        Get shared sessions by session type.
        Usage: /shared-sessions/by_session_type/?session_type=LAB
        """
        session_type = request.query_params.get('session_type')
        if not session_type:
            return Response(
                {'error': 'session_type parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sessions = self.queryset.filter(session_type__icontains=session_type)
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_year(self, request):
        """
        Get shared sessions by calendar year.
        Usage: /shared-sessions/by_year/?year=2025
        """
        year = request.query_params.get('year')
        if not year:
            return Response(
                {'error': 'year parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            sessions = self.queryset.filter(academic_term__startCalendarYear=year)
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid year format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def time_slots(self, request, pk=None):
        """
        Get all time slots for a specific shared session.
        """
        session = self.get_object()
        time_slots = session.time_slots.all()
        from .serializers import TimeSlotSerializer
        serializer = TimeSlotSerializer(time_slots, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def session_types(self, request):
        """
        Get available session type choices.
        """
        from .models import SharedSession
        choices = [{'value': choice[0], 'display': choice[1]} 
                  for choice in SharedSession.SESSION_TYPE_CHOICES]
        return Response({
            'session_types': choices,
            'description': 'Available session type choices for shared sessions'
        })
    
    @action(detail=False, methods=['get'])
    def by_student(self, request):
        """
        Get shared sessions by student (TA assignments).
        Usage: /shared-sessions/by_student/?student_id=1
        """
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response(
                {'error': 'student_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student_id = int(student_id)
            sessions = self.queryset.filter(student_id=student_id)
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid student_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
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
        Custom delete logic if needed.
        """
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
                    'url': '/api/course-term-service/terms/by_year/?year={year}',
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
            },
            'courses': {
                'list': {
                    'url': '/api/course-term-service/courses/',
                    'methods': ['GET', 'POST'],
                    'description': 'List all courses or create a new course'
                },
                'detail': {
                    'url': '/api/course-term-service/courses/{id}/',
                    'methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
                    'description': 'Retrieve, update, or delete a specific course'
                },
                'by_department': {
                    'url': '/api/course-term-service/courses/by_department/?department_id={department_id}',
                    'methods': ['GET'],
                    'description': 'Get courses by department (department_id parameter required)'
                },
                'by_level': {
                    'url': '/api/course-term-service/courses/by_level/?level={level}',
                    'methods': ['GET'],
                    'description': 'Get courses by level (level parameter required)'
                },
                'offerings': {
                    'url': '/api/course-term-service/courses/{id}/offerings/',
                    'methods': ['GET'],
                    'description': 'Get all course offerings for a specific course'
                },
                'current_offerings': {
                    'url': '/api/course-term-service/courses/{id}/current_offerings/',
                    'methods': ['GET'],
                    'description': 'Get current course offerings for a specific course (active terms)'
                },
                'full_details': {
                    'url': '/api/course-term-service/courses/{id}/full_details/',
                    'methods': ['GET'],
                    'description': 'Get complete course details with offerings and shared sessions organized by term-year'
                }
            },
            'course_offerings': {
                'list': {
                    'url': '/api/course-term-service/course-offerings/',
                    'methods': ['GET', 'POST'],
                    'description': 'List all course offerings or create a new course offering'
                },
                'detail': {
                    'url': '/api/course-term-service/course-offerings/{id}/',
                    'methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
                    'description': 'Retrieve, update, or delete a specific course offering'
                },
                'current': {
                    'url': '/api/course-term-service/course-offerings/current/',
                    'methods': ['GET'],
                    'description': 'Get current course offerings (active terms)'
                },
                'by_term': {
                    'url': '/api/course-term-service/course-offerings/by_term/?term_id={term_id}',
                    'methods': ['GET'],
                    'description': 'Get course offerings by academic term (term_id parameter required)'
                },
                'by_course': {
                    'url': '/api/course-term-service/course-offerings/by_course/?course_id={course_id}',
                    'methods': ['GET'],
                    'description': 'Get course offerings by course (course_id parameter required)'
                },
                'by_instructor': {
                    'url': '/api/course-term-service/course-offerings/by_instructor/?instructor_id={instructor_id}',
                    'methods': ['GET'],
                    'description': 'Get course offerings by instructor (instructor_id parameter required)'
                },
                'by_year': {
                    'url': '/api/course-term-service/course-offerings/by_year/?year={year}',
                    'methods': ['GET'],
                    'description': 'Get course offerings by calendar year (year parameter required)'
                }
            },
            'shared_sessions': {
                'list': {
                    'url': '/api/course-term-service/shared-sessions/',
                    'methods': ['GET', 'POST'],
                    'description': 'List all shared sessions or create a new shared session'
                },
                'detail': {
                    'url': '/api/course-term-service/shared-sessions/{id}/',
                    'methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
                    'description': 'Retrieve, update, or delete a specific shared session'
                },
                'current': {
                    'url': '/api/course-term-service/shared-sessions/current/',
                    'methods': ['GET'],
                    'description': 'Get current shared sessions (active terms)'
                },
                'by_term': {
                    'url': '/api/course-term-service/shared-sessions/by_term/?academic_term_id={academic_term_id}',
                    'methods': ['GET'],
                    'description': 'Get shared sessions by academic term (academic_term_id parameter required)'
                },
                'by_course': {
                    'url': '/api/course-term-service/shared-sessions/by_course/?course_id={course_id}',
                    'methods': ['GET'],
                    'description': 'Get shared sessions by course (course_id parameter required)'
                },
                'by_session_type': {
                    'url': '/api/course-term-service/shared-sessions/by_session_type/?session_type={session_type}',
                    'methods': ['GET'],
                    'description': 'Get shared sessions by session type (session_type parameter required)'
                },
                'by_student': {
                    'url': '/api/course-term-service/shared-sessions/by_student/?student_id={student_id}',
                    'methods': ['GET'],
                    'description': 'Get shared sessions by student TA assignment (student_id parameter required)'
                },
                'session_types': {
                    'url': '/api/course-term-service/shared-sessions/session_types/',
                    'methods': ['GET'],
                    'description': 'Get available session type choices'
                },
                'by_year': {
                    'url': '/api/course-term-service/shared-sessions/by_year/?year={year}',
                    'methods': ['GET'],
                    'description': 'Get shared sessions by calendar year (year parameter required)'
                },
                'time_slots': {
                    'url': '/api/course-term-service/shared-sessions/{id}/time_slots/',
                    'methods': ['GET'],
                    'description': 'Get all time slots for a specific shared session'
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
            'filter_winter_terms': '/api/course-term-service/terms/?term_type=winter&startCalendarYear=2025',
            'filter_active_courses': '/api/course-term-service/courses/?course_level=300',
            'search_courses': '/api/course-term-service/courses/?search=math',
            'order_by_course_number': '/api/course-term-service/courses/?ordering=course_number',
            'filter_cs_courses': '/api/course-term-service/courses/?department=1&course_level__icontains=200',
            'filter_current_offerings': '/api/course-term-service/course-offerings/?academic_term__is_active=true',
            'search_offerings': '/api/course-term-service/course-offerings/?search=COSC',
            'filter_by_instructor': '/api/course-term-service/course-offerings/?instructor=1',
            'filter_by_term_year': '/api/course-term-service/course-offerings/?academic_term__startCalendarYear=2025',
            'filter_current_sessions': '/api/course-term-service/shared-sessions/?academic_term__is_active=true',
            'search_sessions': '/api/course-term-service/shared-sessions/?search=lab',
            'filter_by_session_type': '/api/course-term-service/shared-sessions/?session_type=LAB',
            'filter_sessions_by_course': '/api/course-term-service/shared-sessions/?course=1',
            'filter_sessions_by_student': '/api/course-term-service/shared-sessions/?student=123'
        },
        'notes': {
            'time_increments': 'Time slots include time_increments array with 30-minute intervals (e.g., 8:00 AM - 9:30 AM returns ["08:00", "08:30", "09:00"])',
            'student_assignments': 'Shared sessions now track student TA assignments instead of instructors',
            'smart_time_slots': 'Time slots are automatically created/linked based on day, start_time, and end_time matching'
        },
        'note': 'More endpoints will be added as additional ViewSets are implemented'
    })
