from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User

from .models import Student, Instructor, TAScheduler, StudentProfile, StudentExperience, StudentSkill, StudentAvailability, StudentCoursePreference, Faculty, Department
from .serializers import StudentSerializer, InstructorSerializer, TASchedulerSerializer, StudentProfileSerializer, StudentExperienceSerializer, StudentSkillsSerializer,StudentAvailabilitySerializer, StudentCoursePreferenceSerializer,ComprehensiveStudentProfileSerializer, CreateInstructorSerializer,CreateSchedulerSerializer

# Import utilities - make sure you've created these files first
from utils.profile_utils import get_user_by_id, get_user_by_email
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_user_activity

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    @action(detail=False, methods=['get'])
    def find(self, request):
        """Find a user by email or student_number"""
        email = request.query_params.get('email')
        student_number = request.query_params.get('student_number')
        
        # Search by student number
        if student_number:
            try:
                user = Student.objects.get(student_number=student_number)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except Student.DoesNotExist:
                return Response(
                    error_response("No student found with this student number"),
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Search by email
        if email:
            try:
                user = Student.objects.get(email=email)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except Student.DoesNotExist:
                return Response(
                    error_response("No student found with this email"),
                    status=status.HTTP_404_NOT_FOUND
                )
                
        return Response(
            error_response("Email or student_number parameter required"),
            status=status.HTTP_400_BAD_REQUEST
        )


class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    
    @action(detail=False, methods=['get'])
    def find(self, request):
        """Find an instructor by email or employee_number"""
        email = request.query_params.get('email')
        employee_number = request.query_params.get('employee_number')
        
        # Search by employee number
        if employee_number:
            try:
                user = Instructor.objects.get(employee_number=employee_number)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except Instructor.DoesNotExist:
                return Response(
                    error_response("No instructor found with this employee number"),
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Search by email
        if email:
            try:
                user = Instructor.objects.get(email=email)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except Instructor.DoesNotExist:
                return Response(
                    error_response("No instructor found with this email"),
                    status=status.HTTP_404_NOT_FOUND
                )
                
        return Response(
            error_response("Email or employee_number parameter required"),
            status=status.HTTP_400_BAD_REQUEST
        )


class TASchedulerViewSet(viewsets.ModelViewSet):
    queryset = TAScheduler.objects.all()
    serializer_class = TASchedulerSerializer
    
    @action(detail=False, methods=['get'])
    def find(self, request):
        """Find a TA scheduler by email or employee_number"""
        email = request.query_params.get('email')
        employee_number = request.query_params.get('employee_number')
        
        # Search by employee number
        if employee_number:
            try:
                user = TAScheduler.objects.get(employee_number=employee_number)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except TAScheduler.DoesNotExist:
                return Response(
                    error_response("No TA scheduler found with this employee number"),
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Search by email
        if email:
            try:
                user = TAScheduler.objects.get(email=email)
                serializer = self.get_serializer(user)
                return Response(success_response(serializer.data))
            except TAScheduler.DoesNotExist:
                return Response(
                    error_response("No TA scheduler found with this email"),
                    status=status.HTTP_404_NOT_FOUND
                )
                
        return Response(
            error_response("Email or employee_number parameter required"),
            status=status.HTTP_400_BAD_REQUEST
        )

# Student Profile Views  
class StudentProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ComprehensiveStudentProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            return get_object_or_404(User, id=student_id)
        return self.request.user
    
class StudentProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            user = get_object_or_404(User, id=student_id)
        else:
            user = self.request.user
        
        profile, created = StudentProfile.objects.get_or_create(user=user)
        return profile
    
#student experience views
class StudentTAExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentExperience.objects.filter(student=student)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        serializer.save(student=student)
    
class StudentExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentExperience.objects.filter(student=student)

# Student Skills Views
class StudentSkillListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSkillsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentSkill.objects.filter(student=student)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        serializer.save(student=student)

class StudentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSkillsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentSkill.objects.filter(student=student)

# Student Availability Views
class StudentAvailabilityView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentAvailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        
        availability, created = StudentAvailability.objects.get_or_create(student=student)
        return availability

# Student Course Preferences Views
class StudentCoursePreferenceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentCoursePreference.objects.filter(student=student)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        
        # Check if student already has 10 preferences
        existing_count = StudentCoursePreference.objects.filter(student=student).count()
        if existing_count >= 10:
            return Response(
                {'error': 'Maximum 10 course preferences allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(student=student)

class StudentCoursePreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(User, id=student_id)
        else:
            student = self.request.user
        return StudentCoursePreference.objects.filter(student=student)
    
#shared endpoint to find users across all types
@api_view(['GET'])
@permission_classes([AllowAny])  # Add this decorator
def find_user(request):
    """Find a user across all user types by email, student_number, or employee_number"""
    email = request.query_params.get('email')
    student_number = request.query_params.get('student_number')
    employee_number = request.query_params.get('employee_number')
    user_type = request.query_params.get('type')  # Optional filter
    
    # Search by email (most common case)
    if email:
        user, found_type = get_user_by_email(email)
        if user:
            # Filter by type if specified
            if user_type and found_type != user_type:
                return Response(
                    error_response(f"User found but is {found_type}, not {user_type}"),
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize based on user type
            if found_type == 'student':
                serializer = StudentSerializer(user)
            elif found_type == 'instructor':
                serializer = InstructorSerializer(user)
            elif found_type == 'scheduler':
                serializer = TASchedulerSerializer(user)
            
            log_user_activity(found_type, getattr(user, 'student_number', getattr(user, 'employee_number', 'unknown')), 'profile_searched')
            
            return Response(success_response({
                "user": serializer.data,
                "type": found_type
            }))
    
    # Search by student number
    if student_number:
        user = get_user_by_id(student_number, 'student')
        if user:
            if user_type and user_type != 'student':
                return Response(
                    error_response(f"User found but is student, not {user_type}"),
                    status=status.HTTP_404_NOT_FOUND
                )
            
            log_user_activity('student', student_number, 'profile_searched')
            return Response(success_response({
                "user": StudentSerializer(user).data,
                "type": "student"
            }))
    
    # Search by employee number
    if employee_number:
        # Try instructor first
        if user_type == 'instructor' or user_type is None:
            user = get_user_by_id(employee_number, 'instructor')
            if user:
                log_user_activity('instructor', employee_number, 'profile_searched')
                return Response(success_response({
                    "user": InstructorSerializer(user).data,
                    "type": "instructor"
                }))
        
        # Try scheduler
        if user_type == 'scheduler' or user_type is None:
            user = get_user_by_id(employee_number, 'scheduler')
            if user:
                log_user_activity('scheduler', employee_number, 'profile_searched')
                return Response(success_response({
                    "user": TASchedulerSerializer(user).data,  
                    "type": "scheduler"
                }))
    
    # No parameters provided
    if not email and not student_number and not employee_number:
        return Response(
            error_response("Please provide email, student_number, or employee_number parameter"),
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # User not found
    return Response(
        error_response("User not found"),
        status=status.HTTP_404_NOT_FOUND
    )

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'User Profile Service is running',
        'available_endpoints': {
            'students': '/api/profile/students/',
            'instructors': '/api/profile/instructors/',
            'schedulers': '/api/profile/schedulers/',
            'find_user': '/api/profile/find-user/'
        }
    })
