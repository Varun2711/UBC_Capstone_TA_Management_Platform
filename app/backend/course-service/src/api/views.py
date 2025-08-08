from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse, HttpResponse
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
import os

import uuid

# Add this to the imports at the top of views.py
from auth_utils.permissions import (
    IsAdminUser,
    IsSchedulerUser,
    IsStudentUser,
    IsAuthenticatedUser,
    IsInstructorUser,
    IsSchedulerOrAdmin,
    IsStudentOrOwner
)

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
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        - Authenticated users can view terms
        - Schedulers/Admins can create, update, and delete terms
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchedulerOrAdmin()]
        if self.action in ['archive', 'restore', 'archived']:
            return [IsAdminUser()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticatedUser()]
        elif self.action in ['active', 'current', 'future', 'past', 'by_year', 'by_type']:
            return [IsAuthenticatedUser()]
        return [IsAuthenticatedUser()]
    
    # Custom action methods
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
    
    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        """
        Admin only
        Archive a specific term and all its related course offerings and shared sessions
        Usage: PATCH /terms/{id}/archive/
        """
        term = self.get_object()
        
        # Archive the term
        term.is_active = False
        term.save()
        
        # Archive all course offerings in this term
        archived_offerings_count = CourseOffering.objects.filter(
            academic_term=term, 
            is_active=True
        ).update(is_active=False)
        
        # Archive all shared sessions in this term
        archived_sessions_count = SharedSession.objects.filter(
            academic_term=term,
            is_active=True
        ).update(is_active=False)
        
        serializer = self.get_serializer(term)
        
        return Response({
            'message': f'Term {term.code} has been archived successfully.',
            'term': serializer.data,
            'archived_offerings': archived_offerings_count,
            'archived_sessions': archived_sessions_count,
            'details': f'Archived {archived_offerings_count} course offerings and {archived_sessions_count} shared sessions'
        })
    
    @action(detail=True, methods=['patch'])
    def restore(self, request, pk=None):
        """
        Admin only
        Restore an archived term and all its related course offerings and shared sessions
        Usage: PATCH /terms/{id}/restore/
        """
        term = self.get_object()
        
        # Restore the term
        term.is_active = True
        term.save()
        
        # Restore all course offerings in this term
        restored_offerings_count = CourseOffering.objects.filter(
            academic_term=term, 
            is_active=False
        ).update(is_active=True)
        
        # Restore all shared sessions in this term
        restored_sessions_count = SharedSession.objects.filter(
            academic_term=term,
            is_active=False
        ).update(is_active=True)
        
        serializer = self.get_serializer(term)
        
        return Response({
            'message': f'Term "{term.code}" has been restored successfully.',
            'term': serializer.data,
            'restored_offerings': restored_offerings_count,
            'restored_sessions': restored_sessions_count,
            'details': f'Restored {restored_offerings_count} course offerings and {restored_sessions_count} shared sessions'
        })
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """
        Get all archived terms
        Usage: GET /terms/archived/
        """

        archived_terms = self.queryset.filter(is_active=False)
        serializer = self.get_serializer(archived_terms, many=True)
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
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'course_number': ['exact', 'icontains'],
        'course_name': ['icontains'],
        'department': ['exact'],
        'course_level': ['exact', 'icontains'],
        'is_active': ['exact']
    }
    
    # Define searchable fields
    search_fields = ['course_number', 'course_name', 'course_description']
    
    # Define ordering fields
    ordering_fields = ['course_number', 'course_name', 'course_level']
    ordering = ['course_number']  # Default ordering
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        - Authenticated users can view courses
        - Schedulers/Admins can create, update, and delete courses
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchedulerOrAdmin()]
        elif self.action in ['archive', 'restore', 'archived']:
            return [IsAdminUser()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticatedUser()]
        elif self.action in ['by_department', 'by_level', 'offerings', 'current_offerings', 'full_details', 'all_full_details']:
            return [IsAuthenticatedUser()]
        return [IsAuthenticatedUser()]
    
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
        offerings = course.offerings.select_related('academic_term', 'instructor').prefetch_related('time_slots').all()
        
        # Get all shared sessions for this course
        shared_sessions = course.lab_sections.select_related(
            'academic_term', 'student'
        ).prefetch_related('time_slots').all()
        
        # Build the response data
        response_data = {
            'id': course.id,
            'code': course.course_number,
            'title': course.course_name,
            'department': course.department.name,
            'description': course.course_description or '',
            'is_active': course.is_active,  # Add course is_active field
            'offerings': [],
            'sharedSessions': {}
        }
        
        # Process course offerings
        for offering in offerings:
            # Get time slot information for this offering
            time_slots = offering.time_slots.all()
            time_info = []
            time_increments = []
            
            for slot in time_slots:
                time_info.append({
                    'day': slot.get_day_display(),
                    'time': f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}"
                })
                # Add time increments from this slot
                time_increments.extend(slot.time_increments)
            
            # Remove duplicates and sort time increments
            time_increments = sorted(list(set(time_increments)))
            
            offering_data = {
                'id': str(offering.course_offering_id),
                'year': str(offering.academic_term.startCalendarYear),
                'term': offering.academic_term.code,
                'instructor_id': offering.instructor.id if offering.instructor else None,
                'section': offering.section_number,
                'is_active': offering.is_active,  # Add offering is_active field
                'time_slots': time_info,
                'time_increments': time_increments,
                'requirements': {
                    'specialRequirements': []
                }
            }
            response_data['offerings'].append(offering_data)
        
        # Process shared sessions, grouped by term
        for session in shared_sessions:
            term_key = session.academic_term.code
            
            # Initialize term group if not exists
            if term_key not in response_data['sharedSessions']:
                response_data['sharedSessions'][term_key] = {
                    'labs': [],
                    'tutorials': [],
                    'seminars': []
                }
            
            # Get time slot information
            time_slots = session.time_slots.all()
            time_info = []
            time_increments = []
            location = "TBD"
            
            for slot in time_slots:
                time_info.append({
                    'day': slot.get_day_display(),
                    'time': f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}"
                })
                # Add time increments for this slot
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
                'student_id': session.student.id if session.student else None,
                'student_name': session.student.name if session.student else None,
                'is_active': session.is_active,  # Add shared session is_active field
                'forCourse': course.id
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
    
    @action(detail=False, methods=['get'])
    def all_full_details(self, request):
        """
        Get complete details for ALL courses with offerings and shared sessions organized by term.
        Returns data in the format: array of courses, each with course info + offerings + sharedSessions grouped by term.
        """
        # Get all courses with related data
        courses = self.queryset.select_related('department').all()
        
        response_data = []
        
        for course in courses:
            # Get all course offerings for this course
            offerings = course.offerings.select_related('academic_term', 'instructor').prefetch_related('time_slots').all()
            
            # Get all shared sessions for this course
            shared_sessions = course.lab_sections.select_related(
                'academic_term', 'student'
            ).prefetch_related('time_slots').all()
            
            # Build the response data
            course_data = {
                'id': course.id,
                'code': course.course_number,
                'title': course.course_name,
                'department': course.department.name,
                'description': course.course_description or '',
                'is_active': course.is_active,  # Add course is_active field
                'offerings': [],
                'sharedSessions': {}
            }
            
            # Process course offerings
            for offering in offerings:
                # Get time slot information for this offering
                time_slots = offering.time_slots.all()
                time_info = []
                time_increments = []
                
                for slot in time_slots:
                    time_info.append({
                        'day': slot.get_day_display(),
                        'time': f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}"
                    })
                    # Add time increments for this slot
                    time_increments.extend(slot.time_increments)
                
                # Remove duplicates and sort time increments
                time_increments = sorted(list(set(time_increments)))
                
                offering_data = {
                    'id': str(offering.course_offering_id),
                    'year': str(offering.academic_term.startCalendarYear),
                    'term': offering.academic_term.code,
                    'instructor_id': offering.instructor.id if offering.instructor else None,
                    'section': offering.section_number,
                    'is_active': offering.is_active,  # Add offering is_active field
                    'time_slots': time_info,
                    'time_increments': time_increments,
                    'requirements': {
                        'specialRequirements': []
                    }
                }
                course_data['offerings'].append(offering_data)
            
            # Process shared sessions, grouped by term
            for session in shared_sessions:
                term_key = session.academic_term.code
                
                # Initialize term group if not exists
                if term_key not in course_data['sharedSessions']:
                    course_data['sharedSessions'][term_key] = {
                        'labs': [],
                        'tutorials': [],
                        'seminars': [],
                        'workshops': []
                    }
                
                # Get time slot information
                time_slots = session.time_slots.all()
                time_info = []
                time_increments = []
                location = "TBD"
                
                for slot in time_slots:
                    time_info.append({
                        'day': slot.get_day_display(),
                        'time': f"{slot.start_time.strftime('%I:%M %p')} - {slot.end_time.strftime('%I:%M %p')}"
                    })
                    # Add time increments for this slot
                    time_increments.extend(slot.time_increments)
                
                # Remove duplicates and sort time increments
                time_increments = sorted(list(set(time_increments)))
                
                # Build session data
                session_data = {
                    'id': str(session.shared_session_id),
                    'section': session.section_number,
                    'day': time_info[0]['day'] if time_info else 'TBD',
                    'time': time_info[0]['time'] if time_info else 'TBD',
                    'time_increments': time_increments,
                    'location': location,
                    'student_id': session.student.id if session.student else None,
                    'student_name': session.student.name if session.student else None,
                    'is_active': session.is_active,  # Add shared session is_active field
                    'forCourse': course.id
                }
                
                # Add to appropriate session type list
                session_type = session.session_type.lower()
                if session_type == 'lab':
                    course_data['sharedSessions'][term_key]['labs'].append(session_data)
                elif session_type == 'tutorial':
                    course_data['sharedSessions'][term_key]['tutorials'].append(session_data)
                elif session_type == 'seminar':
                    course_data['sharedSessions'][term_key]['seminars'].append(session_data)
                elif session_type == 'workshop':
                    course_data['sharedSessions'][term_key]['workshops'].append(session_data)
            
            response_data.append(course_data)
        
        return Response(response_data)
    
    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        """
        Archive a course and all its related offerings and shared sessions
        Admin only
        Usage: PATCH /courses/{id}/archive/
        """
        course = self.get_object()
        
        # Archive the course
        course.is_active = False
        course.save()
        
        # Archive all related course offerings
        archived_offerings_count = CourseOffering.objects.filter(
            course=course, 
            is_active=True
        ).update(is_active=False)
        
        # Archive all related shared sessions through course offerings
        archived_sessions_count = SharedSession.objects.filter(
            course=course,
            is_active=True
        ).update(is_active=False)
        
        serializer = self.get_serializer(course)
        
        return Response({
            'message': f'Course {course.course_number} has been archived successfully.',
            'course': serializer.data,
            'archived_offerings': archived_offerings_count,
            'archived_sessions': archived_sessions_count,
            'details': f'Archived {archived_offerings_count} course offerings and {archived_sessions_count} shared sessions'
        })
    
    @action(detail=True, methods=['patch'])
    def restore(self, request, pk=None):
        """
        Restore a course and all its related offerings and shared sessions (set active)
        Admin only
        Usage: PATCH /courses/{id}/restore/
        """
        course = self.get_object()
        
        # Restore the course
        course.is_active = True
        course.save()
        
        # Restore all related course offerings
        restored_offerings_count = CourseOffering.objects.filter(
            course=course, 
            is_active=False
        ).update(is_active=True)
        
        # Restore all related shared sessions
        restored_sessions_count = SharedSession.objects.filter(
            course=course,
            is_active=False
        ).update(is_active=True)
        
        serializer = self.get_serializer(course)
        
        return Response({
            'message': f'Course {course.course_number} has been restored successfully.',
            'course': serializer.data,
            'restored_offerings': restored_offerings_count,
            'restored_sessions': restored_sessions_count,
            'details': f'Restored {restored_offerings_count} course offerings and {restored_sessions_count} shared sessions'
        })
    
    @action(detail=False, methods=['get'])
    def archived(self, request):
        """
        Admin only
        Retrieve all arhived courses
        Usage: GET /courses/archived/
        """

        archived_courses = self.queryset.filter(is_active=False)
        serializer= self.get_serializer(archived_courses, many=True)
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
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'course': ['exact'],
        'section_number': ['exact', 'icontains'],
        'academic_term': ['exact'],
        'instructor': ['exact'],
        'is_active': ['exact'],
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
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        - Authenticated users can view course offerings
        - Schedulers/Admins can create, update, and delete course offerings
        - Instructors can view course offerings assigned to them
        - Admins only can archive/restore course offerings
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchedulerOrAdmin()]
        elif self.action in ['archive', 'restore', 'archived']:
            return [IsAdminUser()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticatedUser()]
        elif self.action in ['current', 'by_term', 'by_course', 'by_year']:
            return [IsAuthenticatedUser()]
        elif self.action == 'by_instructor':
            return [IsInstructorUser()]
        return [IsAuthenticatedUser()]
    
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
            return Response({'error': 'course_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Start with the base queryset for this viewset
        queryset = self.get_queryset().filter(course_id=course_id)
        
        # Apply filters from the request, including 'is_active'
        filtered_queryset = self.filter_queryset(queryset)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_instructor(self, request):
        """
        Get course offerings by instructor.
        Usage: /course-offerings/by_instructor/?instructor_id=1&is_active=true
        Note: Instructors can only view their own offerings
        """
        instructor_id = request.query_params.get('instructor_id')
        is_active = request.query_params.get('is_active')
        
        if not instructor_id:
            return Response(
                {"error": "instructor_id parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instructor_id = int(instructor_id)
        except ValueError:
            return Response(
                {"error": "instructor_id must be a valid integer"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Base queryset
        course_offerings = self.queryset.filter(instructor_id=instructor_id)
        
        # Filter by active status if specified
        if is_active and is_active.lower() == 'true':
            course_offerings = course_offerings.filter(
                is_active=True,
                course__is_active=True  # Also filter by course active status
            )
        
        serializer = self.get_serializer(course_offerings, many=True)
        return Response(serializer.data)
    
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
    
    # Admin-only archiving actions
    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        """
        Archive a specific course offering (set is_active=False).
        Admin only action.
        Usage: PATCH /course-offerings/{id}/archive/
        """
        offering = self.get_object()
        offering.is_active = False
        offering.save()
        serializer = self.get_serializer(offering)
        return Response({
            'message': f'Course offering "{offering.course.course_number} {offering.section_number}" has been archived successfully.',
            'course_offering': serializer.data
        })

    @action(detail=True, methods=['patch'])
    def restore(self, request, pk=None):
        """
        Restore an archived course offering (set is_active=True).
        Admin only action.
        Usage: PATCH /course-offerings/{id}/restore/
        """
        offering = self.get_object()
        offering.is_active = True
        offering.save()
        serializer = self.get_serializer(offering)
        return Response({
            'message': f'Course offering "{offering.course.course_number} {offering.section_number}" has been restored successfully.',
            'course_offering': serializer.data
        })

    @action(detail=False, methods=['get'])
    def archived(self, request):
        """
        Get all archived course offerings (is_active=False).
        Admin only action.
        Usage: GET /course-offerings/archived/
        """
        archived_offerings = self.queryset.filter(is_active=False)
        serializer = self.get_serializer(archived_offerings, many=True)
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
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'session_type': ['exact', 'icontains'],
        'course': ['exact'],
        'section_number': ['exact', 'icontains'],
        'academic_term': ['exact'],
        'student': ['exact'],
        'is_active': ['exact'],
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
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        - Authenticated users can view shared sessions
        - Schedulers/Admins can create and delete shared sessions
        - Students can update their own sessions
        - Admins only can archive/restore shared sessions
        """
        if self.action in ['create', 'destroy']:
            return [IsSchedulerOrAdmin()]
        elif self.action in ['archive', 'restore', 'archived']:
            return [IsAdminUser()]
        elif self.action in ['update', 'partial_update']:
            return [IsStudentOrOwner()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticatedUser()]
        elif self.action in ['current', 'by_term', 'by_course', 'by_session_type', 'by_year', 'time_slots', 'session_types']:
            return [IsAuthenticatedUser()]
        elif self.action == 'by_student':
            return [IsStudentOrOwner()]
        return [IsAuthenticatedUser()]
    
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
            return Response({'error': 'course_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Start with the base queryset for this viewset
        queryset = self.get_queryset().filter(course_id=course_id)
        
        # Apply filters from the request, including 'is_active'
        filtered_queryset = self.filter_queryset(queryset)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    
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
        Note: Students can only view their own sessions unless admin/scheduler
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
    
    # Admin-only archiving actions
    @action(detail=True, methods=['patch'])
    def archive(self, request, pk=None):
        """
        Archive a specific shared session (set is_active=False).
        Admin only action.
        Usage: PATCH /shared-sessions/{id}/archive/
        """
        session = self.get_object()
        session.is_active = False
        session.save()
        serializer = self.get_serializer(session)
        return Response({
            'message': f'Shared session "{session.session_type} {session.section_number}" has been archived successfully.',
            'shared_session': serializer.data
        })

    @action(detail=True, methods=['patch'])
    def restore(self, request, pk=None):
        """
        Restore an archived shared session (set is_active=True).
        Admin only action.
        Usage: PATCH /shared-sessions/{id}/restore/
        """
        session = self.get_object()
        session.is_active = True
        session.save()
        serializer = self.get_serializer(session)
        return Response({
            'message': f'Shared session "{session.session_type} {session.section_number}" has been restored successfully.',
            'shared_session': serializer.data
        })

    @action(detail=False, methods=['get'])
    def archived(self, request):
        """
        Get all archived shared sessions (is_active=False).
        Admin only action.
        Usage: GET /shared-sessions/archived/
        """
        archived_sessions = self.queryset.filter(is_active=False)
        serializer = self.get_serializer(archived_sessions, many=True)
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
        Custom delete logic if needed.
        """
        instance.delete()


# InstructorRequest ViewSet
class InstructorRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for InstructorRequest model with full CRUD operations.
    Provides filtering, searching, and ordering capabilities.
    """
    queryset = InstructorRequest.objects.all()
    serializer_class = InstructorRequestSerializer
    
    # Enable filtering, searching, and ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filterable fields
    filterset_fields = {
        'instructor': ['exact'],
        'course_offering': ['exact'],
        'request_date': ['exact', 'gte', 'lte'],
        'instructor__department': ['exact'],
        'course_offering__course': ['exact'],
        'course_offering__academic_term': ['exact'],
        'course_offering__course__course_number': ['exact', 'icontains'],
        'course_offering__academic_term__startCalendarYear': ['exact', 'gte', 'lte'],
        'course_offering__academic_term__is_active': ['exact'],
    }
    
    # Define searchable fields
    # Note: ArrayField search requires special handling, so we search in individual array elements
    search_fields = ['instructor__name', 'course_offering__course__course_number', 'course_offering__course__course_name']
    
    # Define ordering fields
    ordering_fields = ['request_date', 'instructor__name', 'course_offering__course__course_number']
    ordering = ['-request_date']  # Default ordering: newest requests first
    
    def get_permissions(self):
        """
        Define permissions for different actions.
        - Authenticated users can view instructor requests
        - Instructors can create and update their own requests
        - Schedulers/Admins can delete requests
        """
        if self.action in ['create', 'update', 'partial_update']:
            return [IsInstructorUser()]
        elif self.action == 'destroy':
            return [IsSchedulerOrAdmin()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticatedUser()]
        elif self.action in ['by_instructor', 'by_course_offering', 'recent', 'by_term']:
            return [IsAuthenticatedUser()]
        return [IsAuthenticatedUser()]
    
    @action(detail=False, methods=['get'])
    def by_instructor(self, request):
        """
        Get instructor requests by instructor.
        Usage: /instructor-requests/by_instructor/?instructor_id=1
        Note: Instructors can only view their own requests unless admin/scheduler
        """
        instructor_id = request.query_params.get('instructor_id')
        if not instructor_id:
            return Response(
                {'error': 'instructor_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            instructor_id = int(instructor_id)
            requests = self.queryset.filter(instructor_id=instructor_id)
            serializer = self.get_serializer(requests, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid instructor_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_course_offering(self, request):
        """
        Get instructor requests by course offering.
        Usage: /instructor-requests/by_course_offering/?course_offering_id=1
        """
        course_offering_id = request.query_params.get('course_offering_id')
        if not course_offering_id:
            return Response(
                {'error': 'course_offering_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            course_offering_id = uuid.UUID(course_offering_id, version=4)
            requests = self.queryset.filter(course_offering_id=course_offering_id)
            serializer = self.get_serializer(requests, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid course_offering_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent instructor requests (last 30 days).
        Usage: /instructor-requests/recent/
        """
        from django.utils import timezone
        from datetime import timedelta
        
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_requests = self.queryset.filter(request_date__gte=thirty_days_ago)
        serializer = self.get_serializer(recent_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_term(self, request):
        """
        Get instructor requests by academic term.
        Usage: /instructor-requests/by_term/?term_id=1
        """
        term_id = request.query_params.get('term_id')
        if not term_id:
            return Response(
                {'error': 'term_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            term_id = int(term_id)
            requests = self.queryset.filter(course_offering__academic_term_id=term_id)
            serializer = self.get_serializer(requests, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid term_id format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def search_descriptions(self, request):
        """
        Search within request descriptions (ArrayField).
        Usage: /instructor-requests/search_descriptions/?q=search_term
        """
        search_term = request.query_params.get('q')
        if not search_term:
            return Response(
                {'error': 'q parameter is required for search'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use PostgreSQL array search to find descriptions containing the search term
        from django.db.models import Q
        requests = self.queryset.filter(
            Q(request_description__icontains=[search_term]) |
            Q(request_description__overlap=[search_term])
        )
        serializer = self.get_serializer(requests, many=True)
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
        Custom delete logic if needed.
        """
        instance.delete()


# Bulk Import View
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsSchedulerOrAdmin])
def bulk_import(request):
    """
    Bulk import endpoint for CSV and Excel files.
    Accepts .csv and .xlsx file formats for data import.
    Admin/Scheduler only.
    
    Expected CSV format:
    - Each row represents a single weekday schedule for a course session
    - Courses running multiple days should have separate rows for each day
    - Headers: Session year, Term type, term number, department, course number,
              course name, course description, item_type, section number,
              weekday, time start, time end
    
    Upload method: form-data with 'file' key
    """
    # Check request method
    if request.method != 'POST':
        return Response(
            {'error': 'Only POST method is allowed'}, 
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    # Debug: Print request details
    debug_info = {
        'content_type': request.content_type,
        'method': request.method,
        'files_keys': list(request.FILES.keys()),
        'data_keys': list(request.data.keys()) if hasattr(request, 'data') else [],
        'META_content_type': request.META.get('CONTENT_TYPE', 'Not set'),
        'parser_classes': ['MultiPartParser', 'FormParser']
    }
    
    # Check for uploaded file
    if 'file' not in request.FILES:
        return Response(
            {
                'error': 'No file provided. Use form-data upload with "file" key.',
                'debug_info': debug_info,
                'instructions': [
                    '1. In Postman, go to Body tab',
                    '2. Select "form-data" (NOT raw/JSON or binary)',
                    '3. Add key "file" and change type to "File"',
                    '4. Upload your CSV/Excel file'
                ]
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_file = request.FILES['file']
    debug_info['upload_method'] = 'form-data'
    
    # Validate file extension
    allowed_extensions = ['.csv', '.xlsx']
    file_extension = uploaded_file.name.lower().split('.')[-1] if '.' in uploaded_file.name else ''
    
    if f'.{file_extension}' not in allowed_extensions:
        return Response(
            {
                'error': f'Invalid file format. Only {", ".join(allowed_extensions)} files are supported.',
                'received_extension': f'.{file_extension}' if file_extension else 'no extension',
                'allowed_extensions': allowed_extensions
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (limit to 25MB)
    max_file_size = 25 * 1024 * 1024  # 25MB in bytes
    if uploaded_file.size > max_file_size:
        return Response(
            {
                'error': f'File too large. Maximum size allowed is {max_file_size // (1024*1024)}MB.',
                'file_size': f'{uploaded_file.size / (1024*1024):.2f}MB'
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate MIME type - be more lenient with CSV files
    allowed_mime_types = [
        'text/csv',
        'application/csv',
        'application/octet-stream',
        'text/plain',  # Some systems send CSV as text/plain
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    # For CSV files, also accept if the file extension is .csv even if MIME type is different
    if f'.{file_extension}' == '.csv':
        # Allow CSV files with various MIME types
        allowed_csv_mime_types = ['text/csv', 'application/csv', 'text/plain', 'application/octet-stream']
        if uploaded_file.content_type not in allowed_csv_mime_types:
            return Response(
                {
                    'error': 'Invalid file type for CSV file.',
                    'received_mime_type': uploaded_file.content_type,
                    'allowed_csv_mime_types': allowed_csv_mime_types,
                    'note': 'CSV files should have MIME type: text/csv, application/csv, text/plain, or application/octet-stream'
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
    elif uploaded_file.content_type not in allowed_mime_types:
        return Response(
            {
                'error': 'Invalid file type based on content.',
                'received_mime_type': uploaded_file.content_type,
                'allowed_mime_types': allowed_mime_types
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # File validation passed - process the file
    try:
        if f'.{file_extension}' == '.csv':
            # Process CSV file
            results = process_csv_file(uploaded_file)
        else:
            # TODO: Handle Excel files with pandas or openpyxl
            return Response({
                'error': 'Excel file processing not yet implemented',
                'message': 'Please use CSV files for now'
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
        return Response({
            'message': 'Bulk import completed successfully',
            'file_info': {
                'name': uploaded_file.name,
                'size': f'{uploaded_file.size / 1024:.2f}KB',
                'type': uploaded_file.content_type,
                'extension': f'.{file_extension}'
            },
            'results': results,
            'debug_info': debug_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'An error occurred during file processing',
            'details': str(e),
            'file_info': {
                'name': uploaded_file.name,
                'size': f'{uploaded_file.size / 1024:.2f}KB',
                'type': uploaded_file.content_type,
                'extension': f'.{file_extension}'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Helper functions for CSV processing
def parse_weekday(weekday_str):
    """Parse individual weekday string into standardized day name."""
    if not weekday_str:
        return None
    
    weekday_str = weekday_str.strip().lower()
    
    # Handle various weekday formats
    day_variations = {
        'monday': ['monday', 'mon', 'm'],
        'tuesday': ['tuesday', 'tue', 'tues', 't'],
        'wednesday': ['wednesday', 'wed', 'w'],
        'thursday': ['thursday', 'thu', 'thurs', 'th'],
        'friday': ['friday', 'fri', 'f'],
        'saturday': ['saturday', 'sat'],
        'sunday': ['sunday', 'sun']
    }
    
    for standard_day, variations in day_variations.items():
        if weekday_str in variations:
            return standard_day
    
    # If no match found, return None and let error handling deal with it
    return None


def parse_time(time_str):
    """Parse time string like '09:00' or '9:00 AM' into time object."""
    from datetime import datetime
    
    if not time_str:
        return None
    
    time_str = time_str.strip()
    
    # Handle different time formats
    if ':' in time_str:
        try:
            # Try HH:MM format first (24-hour)
            return datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            try:
                # Try HH:MM AM/PM format
                return datetime.strptime(time_str, '%I:%M %p').time()
            except ValueError:
                try:
                    # Try H:MM format (single digit hour)
                    return datetime.strptime(time_str, '%H:%M').time()
                except ValueError:
                    pass
    
    return None


def parse_term_number(term_number_str):
    """Parse and validate term number."""
    if not term_number_str:
        return '1'  # Default to term 1
    
    term_number_str = term_number_str.strip()
    if term_number_str in ['0', '1', '2']:
        return term_number_str
    
    return None


def parse_session_year(session_year_str):
    """Parse and validate session year."""
    if not session_year_str:
        return None
    
    session_year_str = session_year_str.strip()
    
    # Should be a 4-digit year
    if len(session_year_str) == 4 and session_year_str.isdigit():
        year = int(session_year_str)
        if 2020 <= year <= 2050:  # Reasonable range
            return session_year_str
    
    return None


def validate_required_fields(row_data):
    """Validate that required fields are present and not empty."""
    required_fields = [
        'Session year', 'Term type', 'department', 'course number', 
        'course name', 'item_type'
    ]
    
    missing_fields = []
    for field in required_fields:
        if not row_data.get(field, '').strip():
            missing_fields.append(field)
    
    return missing_fields


def process_csv_file(uploaded_file):
    """
    Process CSV data and create/update courses, course offerings, and shared sessions.
    
    Expected CSV headers:
    - Session year, Term type, term number, department, course number, 
    - course name, course description, item_type, section number, 
    - weekday, time start, time end
    
    Note: Each row represents a single weekday schedule. Courses running multiple
    days should have separate rows for each day.
    """
    import csv
    import io
    from datetime import datetime, time
    
    # Initialize results tracking
    results = {
        'courses_created': 0,
        'courses_updated': 0,
        'course_offerings_created': 0,
        'shared_sessions_created': 0,
        'time_slots_created': 0,
        'terms_created': 0,  # Add terms created counter
        'errors': [],
        'processed_rows': 0,
        'skipped_rows': 0,
        'debug_info': []  # Add debug information
    }
    
    # Define allowed departments and their abbreviations
    ALLOWED_DEPARTMENTS = {
        'COMPUTER SCIENCE': 'Computer Science',
        'COSC': 'Computer Science',
        'MATHEMATICS': 'Mathematics',
        'MATH': 'Mathematics',
        'PHYSICS': 'Physics',
        'PHYS': 'Physics',
        'DATA SCIENCE': 'Data Science',
        'DATA': 'Data Science',
        'STATISTICS': 'Statistics',
        'STAT': 'Statistics',
        'ASTRONOMY': 'Astronomy',
        'ASTR': 'Astronomy'
    }
    
    def get_or_create_term(session_year, term_type, term_number):
        """Get or create term based on session year, term type, and term number."""
        try:
            # Build term code based on the pattern in fixtures
            if term_type.lower() == 'winter':
                if term_number == '0':
                    code = f"W{session_year} Both Terms"
                else:
                    code = f"W{session_year} Term {term_number}"
            elif term_type.lower() == 'summer':
                if term_number == '0':
                    code = f"S{session_year} Both Terms"
                else:
                    code = f"S{session_year} Term {term_number}"
            else:
                code = f"{term_type.upper()}{session_year} Term {term_number}"
            
            # Try to get existing term
            try:
                return Term.objects.get(code=code)
            except Term.DoesNotExist:
                # Create the term if it doesn't exist
                from datetime import datetime
                
                # Calculate start and end dates based on term type and number
                year = int(session_year)
                
                if term_type.lower() == 'winter':
                    if term_number == '1':
                        start_date = f"{year}-09-01"
                        end_date = f"{year}-12-31"
                        start_cal_year = year
                        end_cal_year = year
                        description = f"Winter {session_year} Term 1"
                        academic_year = f"{year}/{str(year+1)[2:]}"
                    elif term_number == '2':
                        start_date = f"{year}-01-01"
                        end_date = f"{year}-04-30"
                        start_cal_year = year
                        end_cal_year = year
                        description = f"Winter {session_year} Term 2"
                        academic_year = f"{year-1}/{str(year)[2:]}"
                    else:  # term_number == '0' (Both Terms)
                        start_date = f"{year}-09-01"
                        end_date = f"{year+1}-04-30"
                        start_cal_year = year
                        end_cal_year = year + 1
                        description = f"Winter {session_year} Both Terms"
                        academic_year = f"{year}/{str(year+1)[2:]}"
                elif term_type.lower() == 'summer':
                    if term_number == '1':
                        start_date = f"{year}-05-01"
                        end_date = f"{year}-06-30"
                        start_cal_year = year
                        end_cal_year = year
                        description = f"Summer {session_year} Term 1"
                        academic_year = f"{year-1}/{str(year)[2:]}"
                    else:  # Both terms or term 2
                        start_date = f"{year}-05-01"
                        end_date = f"{year}-08-31"
                        start_cal_year = year
                        end_cal_year = year
                        description = f"Summer {session_year} Both Terms"
                        academic_year = f"{year-1}/{str(year)[2:]}"
                else:
                    # Default fallback
                    start_date = f"{year}-01-01"
                    end_date = f"{year}-12-31"
                    start_cal_year = year
                    end_cal_year = year
                    description = f"{term_type.title()} {session_year} Term {term_number}"
                    academic_year = f"{year}/{str(year+1)[2:]}"
                
                # Create the new term
                new_term = Term.objects.create(
                    code=code,
                    description=description,
                    start=start_date,
                    end=end_date,
                    startCalendarYear=start_cal_year,
                    endCalendarYear=end_cal_year,
                    academicYear=academic_year,
                    is_active=True,
                    term_type=term_type.lower()
                )
                
                results['terms_created'] += 1
                results['debug_info'].append(f"Created new term: {code}")
                return new_term
                
        except Exception as e:
            results['errors'].append(f"Error finding/creating term for {session_year} {term_type} {term_number}: {str(e)}")
            return None
    
    def get_department_from_csv(dept_name_from_csv):
        """
        Get department by name, but only if it's in the allowed list.
        Does not create new departments.
        """
        if not dept_name_from_csv:
            return None
        
        normalized_dept_name = dept_name_from_csv.strip().upper()
        
        # Check if the department is in our allowed list (including abbreviations)
        if normalized_dept_name not in ALLOWED_DEPARTMENTS:
            return None
            
        # Get the standardized full name
        standard_name = ALLOWED_DEPARTMENTS[normalized_dept_name]
        
        try:
            # Fetch the department from the database
            return Department.objects.get(name__iexact=standard_name)
        except Department.DoesNotExist:
            # This case should ideally not happen if fixtures are loaded correctly
            results['errors'].append(f"Allowed department '{standard_name}' not found in the database. Please ensure fixtures are loaded.")
            return None
    
    def get_or_create_timeslot(weekday, start_time, end_time):
        """Get or create a single timeslot for the given schedule."""
        if not weekday or not start_time or not end_time:
            return None
        
        timeslot, created = TimeSlot.objects.get_or_create(
            day=weekday,
            start_time=start_time,
            end_time=end_time
        )
        if created:
            results['time_slots_created'] += 1
        
        return timeslot
    
    # Read and decode the CSV file
    try:
        decoded_file = uploaded_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
    except UnicodeDecodeError:
        # Try with different encoding
        uploaded_file.seek(0)
        decoded_file = uploaded_file.read().decode('utf-8-sig')  # Handle BOM
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
    
    # Process each row in the CSV
    for row in reader:
        results['processed_rows'] += 1
        
        try:
            # Get all values from the row
            session_year_str = row.get('Session year', '').strip()
            term_type = row.get('Term type', '').strip()
            term_number = row.get('term number', '').strip()
            department_name = row.get('department', '').strip()
            course_number = row.get('course number', '').strip()
            course_name = row.get('course name', '').strip()
            course_description = row.get('course description', '').strip()
            item_type = row.get('item_type', '').strip().lower()
            section_number = row.get('section number', '').strip()
            weekday = row.get('weekday', '').strip()
            time_start = row.get('time start', '').strip()
            time_end = row.get('time end', '').strip()
            
            # Validate required fields using helper function
            missing_fields = validate_required_fields(row)
            if missing_fields:
                results['errors'].append(f"Row {results['processed_rows']}: Missing required fields: {missing_fields}")
                results['skipped_rows'] += 1
                continue
            
            # Validate item_type
            valid_item_types = ['lecture', 'lab', 'tutorial', 'seminar']
            if item_type not in valid_item_types:
                results['errors'].append(f"Row {results['processed_rows']}: Invalid item_type '{item_type}'. Must be one of: {valid_item_types}")
                results['skipped_rows'] += 1
                continue
            
            # Get department, but do not create it if it doesn't exist or is not allowed
            department = get_department_from_csv(department_name)
            if not department:
                results['errors'].append(f"Row {results['processed_rows']}: Department '{department_name}' is not supported or not found in the database.")
                results['skipped_rows'] += 1
                continue
            
            # Get/create course
            course, created = Course.objects.get_or_create(
                course_number=course_number,
                department=department,
                defaults={
                    'course_name': course_name,
                    'course_description': course_description,
                    'course_level': course_number[:1] + '00' if course_number and course_number[0].isdigit() else '100',
                    'is_active': True
                }
            )
            
            if created:
                results['courses_created'] += 1
                results['debug_info'].append(f"Created new Course: {course_number} - {course_name}")
            else:
                results['debug_info'].append(f"Found existing Course: {course_number} - {course_name}")
                # Update course if needed
                updated = False
                if course.course_name != course_name:
                    course.course_name = course_name
                    updated = True
                if course.course_description != course_description:
                    course.course_description = course_description
                    updated = True
                if updated:
                    course.save()
                    results['courses_updated'] += 1
                    results['debug_info'].append(f"Updated Course: {course_number}")
            
            # Get term
            term = get_or_create_term(session_year, term_type, term_number)
            if not term:
                results['debug_info'].append(f"Failed to find/create term: {session_year} {term_type} {term_number}")
                results['skipped_rows'] += 1
                continue
            else:
                results['debug_info'].append(f"Using term: {term.code}")
            
            # Parse time schedule using helper functions
            parsed_weekday = parse_weekday(weekday)
            start_time = parse_time(time_start)
            end_time = parse_time(time_end)
            
            # Validate weekday if provided
            if weekday and not parsed_weekday:
                results['errors'].append(f"Row {results['processed_rows']}: Invalid weekday '{weekday}'")
                results['skipped_rows'] += 1
                continue
            
            # Validate time format if time data is provided
            if time_start and not start_time:
                results['errors'].append(f"Row {results['processed_rows']}: Invalid start time format '{time_start}'")
                results['skipped_rows'] += 1
                continue
            
            if time_end and not end_time:
                results['errors'].append(f"Row {results['processed_rows']}: Invalid end time format '{time_end}'")
                results['skipped_rows'] += 1
                continue
            
            # Create timeslot if time info is provided
            timeslot = None
            if parsed_weekday and start_time and end_time:
                timeslot = get_or_create_timeslot(parsed_weekday, start_time, end_time)
            
            # Set default section number if not provided
            if not section_number:
                section_number = '001'
            
            # Create course offering or shared session based on item_type
            if item_type == 'lecture':
                # Create CourseOffering (get existing or create new)
                course_offering, created = CourseOffering.objects.get_or_create(
                    course=course,
                    section_number=section_number,
                    academic_term=term,
                    defaults={
                        'instructor': None  # Will be assigned later by administrators
                    }
                )
                
                # Track creation only once per unique offering
                if created:
                    results['course_offerings_created'] += 1
                    results['debug_info'].append(f"Created new CourseOffering: {course.course_number} {section_number} for {term.code}")
                else:
                    results['debug_info'].append(f"Found existing CourseOffering: {course.course_number} {section_number} for {term.code}")
                
                # Add timeslot to course offering (many-to-many relationship)
                if timeslot:
                    course_offering.time_slots.add(timeslot)
                    results['debug_info'].append(f"Added timeslot {parsed_weekday} {start_time}-{end_time} to CourseOffering {course.course_number}")
            
            elif item_type in ['lab', 'tutorial', 'seminar']:
                # Create SharedSession (get existing or create new)
                shared_session, created = SharedSession.objects.get_or_create(
                    session_type=item_type,
                    course=course,
                    section_number=section_number,
                    academic_term=term,
                    defaults={
                        'student': None  # Will be assigned later when TAs are allocated
                    }
                )
                
                # Track creation only once per unique session
                if created:
                    results['shared_sessions_created'] += 1
                    results['debug_info'].append(f"Created new SharedSession: {item_type} {course.course_number} {section_number} for {term.code}")
                else:
                    results['debug_info'].append(f"Found existing SharedSession: {item_type} {course.course_number} {section_number} for {term.code}")
                
                # Add timeslot to shared session (many-to-many relationship)
                if timeslot:
                    shared_session.time_slots.add(timeslot)
                    results['debug_info'].append(f"Added timeslot {parsed_weekday} {start_time}-{end_time} to SharedSession {item_type} {course.course_number}")
        
        except Exception as e:
            results['errors'].append(f"Row {results['processed_rows']}: {str(e)}")
            results['skipped_rows'] += 1
    
    return results


# Sample CSV Download View
@api_view(['GET'])
@permission_classes([AllowAny])
def download_sample_csv(request):
    """
    Download sample CSV file for bulk import.
    Shows the expected format and column headers for bulk importing courses.
    
    Returns a CSV file with sample data demonstrating:
    - Required column headers
    - Different item types (lecture, lab, tutorial, seminar)
    - Multiple scheduling entries for multi-day courses
    - Different term types and numbers
    - Proper date/time formatting
    """
    try:
        # Get the path to the sample CSV file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sample_csv_path = os.path.join(current_dir, 'sample_bulk_import.csv')
        
        # Check if the sample file exists
        if not os.path.exists(sample_csv_path):
            return Response(
                {'error': 'Sample CSV file not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Read the sample CSV file
        with open(sample_csv_path, 'r', encoding='utf-8') as file:
            csv_content = file.read()
        
        # Create HTTP response with CSV content
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sample_bulk_import.csv"'
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'Failed to retrieve sample CSV: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
                },
                'archive': {
                    'url': '/api/course-term-service/terms/{id}/archive/',
                    'methods': ['PATCH'],
                    'description': 'Archive a specific term (Admin only)',
                    'permissions': 'Admin only'
                },
                'restore': {
                    'url': '/api/course-term-service/terms/{id}/restore/',
                    'methods': ['PATCH'],
                    'description': 'Restore an archived term (Admin only)',
                    'permissions': 'Admin only'
                },
                'archived': {
                    'url': '/api/course-term-service/terms/archived/',
                    'methods': ['GET'],
                    'description': 'Get all archived terms (Admin only)',
                    'permissions': 'Admin only'
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
                },
                'all_full_details': {
                    'url': '/api/course-term-service/courses/all_full_details/',
                    'methods': ['GET'],
                    'description': 'Get complete details for ALL courses with offerings and shared sessions organized by term'
                },
                'archive': {
                    'url': '/api/course-term-service/courses/{id}/archive/',
                    'methods': ['PATCH'],
                    'description': 'Archive a specific course (Admin only)',
                    'permissions': 'Admin only'
                },
                'restore': {
                    'url': '/api/course-term-service/courses/{id}/restore/',
                    'methods': ['PATCH'],
                    'description': 'Restore an archived course (Admin only)',
                    'permissions': 'Admin only'
                },
                'archived': {
                    'url': '/api/course-term-service/courses/archived/',
                    'methods': ['GET'],
                    'description': 'Get all archived courses (Admin only)',
                    'permissions': 'Admin only'
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
                },
                'archive': {
                    'url': '/api/course-term-service/course-offerings/{id}/archive/',
                    'methods': ['PATCH'],
                    'description': 'Archive a specific course offering (Admin only)',
                    'permissions': 'Admin only'
                },
                'restore': {
                    'url': '/api/course-term-service/course-offerings/{id}/restore/',
                    'methods': ['PATCH'],
                    'description': 'Restore an archived course offering (Admin only)',
                    'permissions': 'Admin only'
                },
                'archived': {
                    'url': '/api/course-term-service/course-offerings/archived/',
                    'methods': ['GET'],
                    'description': 'Get all archived course offerings (Admin only)',
                    'permissions': 'Admin only'
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
                },
                'archive': {
                    'url': '/api/course-term-service/shared-sessions/{id}/archive/',
                    'methods': ['PATCH'],
                    'description': 'Archive a specific shared session (Admin only)',
                    'permissions': 'Admin only'
                },
                'restore': {
                    'url': '/api/course-term-service/shared-sessions/{id}/restore/',
                    'methods': ['PATCH'],
                    'description': 'Restore an archived shared session (Admin only)',
                    'permissions': 'Admin only'
                },
                'archived': {
                    'url': '/api/course-term-service/shared-sessions/archived/',
                    'methods': ['GET'],
                    'description': 'Get all archived shared sessions (Admin only)',
                    'permissions': 'Admin only'
                }
            },
            'instructor_requests': {
                'list': {
                    'url': '/api/course-term-service/instructor-requests/',
                    'methods': ['GET', 'POST'],
                    'description': 'List all instructor requests or create a new instructor request'
                },
                'detail': {
                    'url': '/api/course-term-service/instructor-requests/{id}/',
                    'methods': ['GET', 'PUT', 'PATCH', 'DELETE'],
                    'description': 'Retrieve, update, or delete a specific instructor request'
                },
                'by_instructor': {
                    'url': '/api/course-term-service/instructor-requests/by_instructor/?instructor_id={instructor_id}',
                    'methods': ['GET'],
                    'description': 'Get instructor requests by instructor (instructor_id parameter required)'
                },
                'by_course_offering': {
                    'url': '/api/course-term-service/instructor-requests/by_course_offering/?course_offering_id={course_offering_id}',
                    'methods': ['GET'],
                    'description': 'Get instructor requests by course offering (course_offering_id parameter required)'
                },
                'recent': {
                    'url': '/api/course-term-service/instructor-requests/recent/',
                    'methods': ['GET'],
                    'description': 'Get recent instructor requests (last 30 days)'
                },
                'by_term': {
                    'url': '/api/course-term-service/instructor-requests/by_term/?term_id={term_id}',
                    'methods': ['GET'],
                    'description': 'Get instructor requests by academic term (term_id parameter required)'
                }
            },
            'bulk_import': {
                'upload': {
                    'url': '/api/course-term-service/bulk-import/',
                    'methods': ['POST'],
                    'description': 'Bulk import data from CSV or Excel files (Admin/Scheduler only)',
                    'permissions': 'Admin/Scheduler only',
                    'content_type': 'multipart/form-data',
                    'parsers': ['MultiPartParser', 'FormParser'],
                    'supported_formats': ['.csv', '.xlsx'],
                    'max_file_size': '25MB',
                    'note': 'Upload file using form-data with key "file". DRF parsers handle multipart content.'
                },
                'sample': {
                    'url': '/api/course-term-service/sample-csv/',
                    'methods': ['GET'],
                    'description': 'Download sample CSV file showing expected format for bulk import',
                    'permissions': 'Public',
                    'content_type': 'text/csv',
                    'note': 'Returns a sample CSV file with proper column headers and example data'
                }
            }
        },
        'features': {
            'filtering': 'Endpoints support filtering with query parameters',
            'searching': 'Use ?search=query to search across relevant fields',
            'ordering': 'Use ?ordering=field_name or ?ordering=-field_name for sorting',
            'pagination': 'Results are paginated by default'
        },
        'accepted_fields': {
            'terms': {
                'create_fields': {
                    'required': ['code', 'description', 'term_type', 'start', 'end', 'startCalendarYear', 'endCalendarYear'],
                    'optional': ['academicYear', 'is_active', 'parent_term_id'],
                    'description': 'Fields for creating a new term'
                },
                'update_fields': {
                    'optional': ['code', 'description', 'term_type', 'start', 'end', 'startCalendarYear', 'endCalendarYear', 'academicYear', 'is_active', 'parent_term_id'],
                    'description': 'Fields for updating an existing term'
                }
            },
            'courses': {
                'create_fields': {
                    'required': ['course_number', 'course_name', 'department_id'],
                    'optional': ['course_description', 'course_level'],
                    'description': 'Fields for creating a new course'
                },
                'update_fields': {
                    'optional': ['course_number', 'course_name', 'department_id', 'course_description', 'course_level'],
                    'description': 'Fields for updating an existing course'
                }
            },
            'course_offerings': {
                'create_fields': {
                    'required': ['course_id', 'academic_term_id', 'section_number'],
                    'optional': ['instructor_id', 'time_slot_ids', 'time_slots'],
                    'description': 'Fields for creating a new course offering. Use time_slot_ids for existing time slots or time_slots for new ones.'
                },
                'update_fields': {
                    'optional': ['course_id', 'academic_term_id', 'section_number', 'instructor_id', 'time_slot_ids', 'time_slots'],
                    'description': 'Fields for updating an existing course offering'
                },
                'time_slots_format': {
                    'description': 'Time slots can be provided as array of objects with day, start_time, end_time',
                    'example': [
                        {
                            'day': 'MONDAY',
                            'start_time': '08:00:00',
                            'end_time': '09:30:00'
                        }
                    ]
                }
            },
            'shared_sessions': {
                'create_fields': {
                    'required': ['session_type', 'course_id', 'academic_term_id', 'section_number'],
                    'optional': ['student_id', 'time_slot_ids', 'time_slots'],
                    'description': 'Fields for creating a new shared session. Use time_slot_ids for existing time slots or time_slots for new ones.'
                },
                'update_fields': {
                    'optional': ['session_type', 'course_id', 'academic_term_id', 'section_number', 'student_id', 'time_slot_ids', 'time_slots'],
                    'description': 'Fields for updating an existing shared session'
                },
                'session_types': ['LAB', 'TUTORIAL', 'SEMINAR', 'WORKSHOP'],
                'time_slots_format': {
                    'description': 'Time slots can be provided as array of objects with day, start_time, end_time',
                    'example': [
                        {
                            'day': 'WEDNESDAY',
                            'start_time': '14:00:00',
                            'end_time': '17:00:00'
                        }
                    ]
                }
            },
            'instructor_requests': {
                'create_fields': {
                    'required': ['instructor_id', 'course_offering_id', 'request_description'],
                    'optional': ['request_date'],
                    'description': 'Fields for creating a new instructor request. request_date defaults to current date.'
                },
                'update_fields': {
                    'optional': ['instructor_id', 'course_offering_id', 'request_description', 'request_date'],
                    'description': 'Fields for updating an existing instructor request'
                }
            }
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
            'filter_sessions_by_student': '/api/course-term-service/shared-sessions/?student=123',
            'filter_recent_requests': '/api/course-term-service/instructor-requests/recent/',
            'search_requests': '/api/course-term-service/instructor-requests/?search=database',
            'filter_requests_by_instructor': '/api/course-term-service/instructor-requests/?instructor=1',
            'filter_requests_by_term': '/api/course-term-service/instructor-requests/?course_offering__academic_term=1',
            'archive_term': '/api/course-term-service/terms/1/archive/',
            'restore_term': '/api/course-term-service/terms/1/restore/',
            'list_archived_terms': '/api/course-term-service/terms/archived/',
            'archive_course': '/api/course-term-service/courses/1/archive/',
            'restore_course': '/api/course-term-service/courses/1/restore/',
            'list_archived_courses': '/api/course-term-service/courses/archived/',
            'archive_course_offering': '/api/course-term-service/course-offerings/1/archive/',
            'restore_course_offering': '/api/course-term-service/course-offerings/1/restore/',
            'list_archived_course_offerings': '/api/course-term-service/course-offerings/archived/',
            'archive_shared_session': '/api/course-term-service/shared-sessions/1/archive/',
            'restore_shared_session': '/api/course-term-service/shared-sessions/1/restore/',
            'list_archived_shared_sessions': '/api/course-term-service/shared-sessions/archived/',
            'filter_inactive_items': '/api/course-term-service/terms/?is_active=false'
        },
        'post_examples': {
            'create_term': {
                'url': 'POST /api/course-term-service/terms/',
                'body': {
                    'code': 'W1',
                    'description': 'Winter Term 1',
                    'term_type': 'winter',
                    'start': '2025-01-06',
                    'end': '2025-02-28',
                    'startCalendarYear': 2025,
                    'endCalendarYear': 2025,
                    'academicYear': '2024-2025',
                    'is_active': True
                }
            },
            'create_course': {
                'url': 'POST /api/course-term-service/courses/',
                'body': {
                    'course_number': 'COSC 499',
                    'course_name': 'Capstone Software Engineering Project',
                    'department_id': 1,
                    'course_description': 'A comprehensive software engineering project',
                    'course_level': '400'
                }
            },
            'create_course_offering': {
                'url': 'POST /api/course-term-service/course-offerings/',
                'body': {
                    'course_id': 1,
                    'academic_term_id': 1,
                    'section_number': '001',
                    'instructor_id': 1,
                    'time_slots': [
                        {
                            'day': 'MONDAY',
                            'start_time': '08:00:00',
                            'end_time': '09:30:00'
                        },
                        {
                            'day': 'WEDNESDAY',
                            'start_time': '08:00:00',
                            'end_time': '09:30:00'
                        }
                    ]
                }
            },
            'create_shared_session': {
                'url': 'POST /api/course-term-service/shared-sessions/',
                'body': {
                    'session_type': 'LAB',
                    'course_id': 1,
                    'academic_term_id': 1,
                    'section_number': 'L01',
                    'student_id': 123,
                    'time_slots': [
                        {
                            'day': 'FRIDAY',
                            'start_time': '14:00:00',
                            'end_time': '17:00:00'
                        }
                    ]
                }
            },
            'create_instructor_request': {
                'url': 'POST /api/course-term-service/instructor-requests/',
                'body': {
                    'instructor_id': 1,
                    'course_offering_id': 1,
                    'request_description': ['Need additional TA support', 'Require specific lab equipment']
                }
            },
            'bulk_import': {
                'url': 'POST /api/course-term-service/bulk-import/',
                'content_type': 'multipart/form-data',
                'parsers': ['MultiPartParser', 'FormParser'],
                'body': 'Upload file using form-data with key "file"',
                'supported_formats': ['.csv', '.xlsx'],
                'max_file_size': '25MB',
                'example_response': {
                    'message': 'File uploaded and validated successfully',
                    'file_info': {
                        'name': 'sample.csv',
                        'size': '2.45KB',
                        'type': 'text/csv',
                        'extension': '.csv'
                    },
                    'debug_info': {
                        'content_type': 'multipart/form-data',
                        'method': 'POST',
                        'files_keys': ['file']
                    },
                    'status': 'validated'
                }
            }
        },
        'archive_examples': {
            'archive_term': {
                'url': 'PATCH /api/course-term-service/terms/1/archive/',
                'description': 'Archive a term (Admin only)',
                'response': {
                    'message': 'Term W1 has been archived successfully.',
                    'term': {'id': 1, 'code': 'W1', 'is_active': False}
                }
            },
            'restore_course': {
                'url': 'PATCH /api/course-term-service/courses/1/restore/',
                'description': 'Restore an archived course (Admin only)',
                'response': {
                    'message': 'Course COSC 499 has been restored successfully.',
                    'course': {'id': 1, 'course_number': 'COSC 499', 'is_active': True}
                }
            },
            'list_archived_offerings': {
                'url': 'GET /api/course-term-service/course-offerings/archived/',
                'description': 'List all archived course offerings (Admin only)',
                'response': [
                    {'course_offering_id': 1, 'course': 'COSC 499', 'section_number': '001', 'is_active': False}
                ]
            },
            'archive_shared_session': {
                'url': 'PATCH /api/course-term-service/shared-sessions/1/archive/',
                'description': 'Archive a shared session (Admin only)',
                'response': {
                    'message': 'Shared session "LAB L01" has been archived successfully.',
                    'shared_session': {'shared_session_id': 1, 'session_type': 'LAB', 'is_active': False}
                }
            }
        },
        'notes': {
            'time_increments': 'Time slots include time_increments array with 30-minute intervals (e.g., 8:00 AM - 9:30 AM returns ["08:00", "08:30", "09:00"])',
            'student_assignments': 'Shared sessions now track student TA assignments instead of instructors',
            'smart_time_slots': 'Time slots are automatically created/linked based on day, start_time, and end_time matching'
        },
        'note': 'More endpoints will be added as additional ViewSets are implemented'
    })

# Test endpoint for debugging authentication
@api_view(['GET'])
@permission_classes([AllowAny])
def debug_auth(request):
    """
    Debug endpoint to test authentication flow
    """
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    
    if not auth_header:
        return Response({
            'error': 'No Authorization header found',
            'all_headers': {k: v for k, v in request.META.items() if k.startswith('HTTP_')},
            'status': 'missing_header'
        }, status=400)
    
    if not auth_header.startswith('Bearer '):
        return Response({
            'error': 'Invalid Authorization header format. Expected: Bearer <token>',
            'received': auth_header,
            'status': 'invalid_format'
        }, status=400)
    
    try:
        token = auth_header.split(' ')[1]
        
        # Test the actual function used by decorators
        from auth_utils.decorators import authenticated_required
        
        # Try to extract user info using the same method as decorators
        user_id, user_type = None, None
        try:
            from auth_utils.permissions import extract_user_from_token
            user_id, user_type = extract_user_from_token(request)
        except ImportError:
            return Response({
                'error': 'Cannot import auth_utils.permissions',
                'status': 'import_error'
            }, status=500)
        
        if not user_id:
            return Response({
                'error': 'Token could not be validated - user_id is None',
                'token_length': len(token),
                'token_preview': token[:20] + '...' if len(token) > 20 else token,
                'status': 'invalid_token'
            }, status=401)
        
        return Response({
            'message': 'Authentication successful',
            'user_id': user_id,
            'user_type': user_type,
            'status': 'success'
        })
        
    except Exception as e:
        return Response({
            'error': f'Unexpected error: {str(e)}',
            'error_type': type(e).__name__,
            'status': 'error'
        }, status=500)
