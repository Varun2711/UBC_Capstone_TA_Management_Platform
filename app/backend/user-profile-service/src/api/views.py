from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from utils.permissions import admin_required, IsAdminUser, IsSchedulerUser, IsAdminOrSchedulerUser, admin_or_scheduler_required
from django.utils.decorators import method_decorator
from utils.password_utils import generate_secure_password
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.exceptions import PermissionDenied
from .models import Student, Instructor, TAScheduler, Admin, StudentProfile, StudentExperience, StudentSkill, StudentAvailability, StudentCoursePreference, Faculty, Department
from .serializers import (StudentSerializer, InstructorSerializer, InstructorProfileSerializer, TASchedulerSerializer,TASchedulerProfileSerializer, AdminSerializer, AdminProfileSerializer, UpdateStudentProfileSerializer, UpdateInstructorSerializer, UpdateTASchedulerSerializer, UpdateAdminSerializer, StudentExperienceSerializer, StudentSkillsSerializer,
                          StudentAvailabilitySerializer, StudentCoursePreferenceSerializer,ComprehensiveStudentProfileSerializer, CreateInstructorSerializer,CreateSchedulerSerializer, FacultySerializer)

from utils.profile_utils import get_user_by_id, get_user_by_email
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_user_activity


class FacultyListView(generics.ListAPIView):
    """
    Endpoint to list all available faculties - no authentication required
    """
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        faculties = Faculty.objects.all()
        serializer = FacultySerializer(faculties, many=True)
        return Response(serializer.data)
    
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

# Rename from StudentProfileDetailView to ProfileDetailView
class ProfileDetailView(generics.RetrieveAPIView):
    """
    Get the profile of a user:
    - Currently logged in user when accessed via /me/
    - Specific student when accessed via /student/<student_id>/
    """
    permission_classes = [IsAuthenticated]  # This should check user type in get_object
    
    def get_object(self):
        # Check if accessing specific student (admin or scheduler view)
        student_id = self.kwargs.get('student_id')
        if student_id:
            # Only allow admin or scheduler to access other student profiles
            user_type = self.request.auth.payload.get('user_type')
            if user_type not in ['admin', 'scheduler']:
                raise PermissionDenied("Only administrators and schedulers can access student profiles")
                
            # Find the Student first, then get the corresponding User
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
            return user
    
    def get_serializer_class(self):
        # Check if accessing specific student (admin view)
        student_id = self.kwargs.get('student_id')
        if student_id:
            return ComprehensiveStudentProfileSerializer
            
        # Otherwise use serializer based on token user type
        user_type = self.request.auth.payload.get('user_type', None)
        
        if user_type == 'student':
            return ComprehensiveStudentProfileSerializer
        elif user_type == 'instructor':
            return InstructorProfileSerializer
        elif user_type == 'scheduler':
            return TASchedulerProfileSerializer
        elif user_type == 'admin':
            return AdminProfileSerializer
        else:
            # Default fallback
            return ComprehensiveStudentProfileSerializer
    
    def get_object(self):
        # Check if accessing specific student (admin view)
        student_id = self.kwargs.get('student_id')
        if student_id:
            # Find the Student first, then get the corresponding User
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
            return user
            
        # Otherwise, get current user based on token
        user_type = self.request.auth.payload.get('user_type', None)
        user_id = self.request.auth.payload.get('sub', None)
        
        if user_type == 'student':
            # For students, we use the Django User model
            return self.request.user
        elif user_type == 'instructor':
            # For instructors, find by employee_number
            return get_object_or_404(Instructor, employee_number=user_id)
        elif user_type == 'scheduler':
            # For schedulers, find by employee_number
            return get_object_or_404(TAScheduler, employee_number=user_id)
        elif user_type == 'admin':
            # For admins, find by employee_number
            return get_object_or_404(Admin, employee_number=user_id)
        else:
            # Default fallback to the Django user
            return self.request.user
  

    
class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        user_type = self.request.auth.payload.get('user_type', None)
        
        if user_type == 'student':
            return UpdateStudentProfileSerializer
        elif user_type == 'instructor':
            return UpdateInstructorSerializer
        elif user_type == 'scheduler':
            return UpdateTASchedulerSerializer
        elif user_type == 'admin':
            return UpdateAdminSerializer
        else:
            return UpdateStudentProfileSerializer
    
    def get_object(self):
        user_type = self.request.auth.payload.get('user_type', None)
        user_id = self.request.auth.payload.get('sub', None)
        
        if user_type == 'student':
            # Student using Django User model
            user = self.request.user
            StudentProfile.objects.get_or_create(user=user)
            return user
        elif user_type == 'instructor':
            return get_object_or_404(Instructor, employee_number=user_id)
        elif user_type == 'scheduler':
            return get_object_or_404(TAScheduler, employee_number=user_id)
        elif user_type == 'admin':
            return get_object_or_404(Admin, employee_number=user_id)
        else:
            return self.request.user
    
   
    
# Student Experience Views - FIXED to use User model consistently
class StudentTAExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            # Admin accessing specific student
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            # Student accessing their own data
            user = self.request.user
        return StudentExperience.objects.filter(user=user)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        serializer.save(user=user)
    
class StudentExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentExperience.objects.filter(user=user)

# Student Skills Views - FIXED to use User model consistently
class StudentSkillListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSkillsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentSkill.objects.filter(user=user)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        serializer.save(user=user)

class StudentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSkillsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentSkill.objects.filter(user=user)

# Student Availability Views - FIXED logic flow
class StudentAvailabilityView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentAvailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        
        # Create or get the student availability - FIXED logic flow
        availability, created = StudentAvailability.objects.get_or_create(user=user)
        return availability

# Student Course Preferences Views - FIXED error handling
class StudentCoursePreferenceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentCoursePreference.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        """Override create to check preference limit before creating"""
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = request.user
        
        # Check if student already has 10 preferences
        existing_count = StudentCoursePreference.objects.filter(user=user).count()
        if existing_count >= 10:
            return Response(
                error_response('Maximum 10 course preferences allowed.'),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        serializer.save(user=user)

class StudentCoursePreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentCoursePreference.objects.filter(user=user)

# Shared endpoint to find users across all types
@api_view(['GET'])
@permission_classes([AllowAny])
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
            elif found_type == 'admin':
                serializer = AdminSerializer(user)
            
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
            
        # Try admin
        if user_type == 'admin' or user_type is None:
            user = get_user_by_id(employee_number, 'admin')
            if user:
                log_user_activity('admin', employee_number, 'profile_searched')
                return Response(success_response({
                    "user": AdminSerializer(user).data,  
                    "type": "admin"
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

# Admin and scheduler Management Views
@method_decorator(admin_or_scheduler_required, name='dispatch')
class CreateInstructorView(generics.CreateAPIView):
    serializer_class = CreateInstructorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSchedulerUser]
    authentication_classes = [JWTAuthentication]  # Add this line

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Check if instructor with this employee number already exists
                if Instructor.objects.filter(employee_number=serializer.validated_data['employee_number']).exists():
                    return Response(
                        error_response("Instructor with this employee number already exists"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if email is already in use
                if Instructor.objects.filter(email=serializer.validated_data['email']).exists():
                    return Response(
                        error_response("Email already in use"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get faculty object
                print(f"DEBUG: Looking for faculty: {serializer.validated_data['faculty']}")
                faculty_code = serializer.validated_data['faculty']
                faculty_name_map = {
                    'astr': 'Astronomy',
                    'math': 'Mathematics',
                    'phy': 'Physics',
                    'data': 'Data Science',
                    'stat': 'Statistics',
                    'cosc': 'Computer Science'
                }
                faculty_name = faculty_name_map.get(faculty_code)
                if not faculty_name:
                    return Response(
                        error_response("Invalid faculty code"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                faculty = Faculty.objects.get(name__iexact=faculty_name)
                
                # Generate secure temporary password
                temp_password = generate_secure_password()
                
                # Create instructor
                instructor = Instructor.objects.create(
                    employee_number=serializer.validated_data['employee_number'],
                    name=f"{serializer.validated_data['first_name']} {serializer.validated_data['last_name']}",
                    email=serializer.validated_data['email'],
                    faculty=faculty,
                    password=temp_password
                )
                
                # Return response with temporary password for admin to share
                response_data = InstructorSerializer(instructor).data
                response_data['temporary_password'] = temp_password
                
                user_type = request.auth.payload.get('user_type', 'unknown')
                log_user_activity(user_type, request.user.email, f'created_instructor_{instructor.employee_number}')
                
                return Response(
                    success_response(
                        response_data, 
                        "Instructor created successfully. Please share the temporary password with the instructor."
                    ),
                    status=status.HTTP_201_CREATED
                )
                
            except Faculty.DoesNotExist:
                return Response(
                    error_response("Faculty not found"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    error_response(f"Error creating instructor: {str(e)}"),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            error_response("Invalid data", serializer.errors),
            status=status.HTTP_400_BAD_REQUEST
        )

@method_decorator(admin_required, name='dispatch')
class CreateSchedulerView(generics.CreateAPIView):
    serializer_class = CreateSchedulerSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]  # Add this line
    
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Check if scheduler with this employee number already exists
                if TAScheduler.objects.filter(employee_number=serializer.validated_data['employee_number']).exists():
                    return Response(
                        error_response("TA Scheduler with this employee number already exists"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if email is already in use
                if TAScheduler.objects.filter(email=serializer.validated_data['email']).exists():
                    return Response(
                        error_response("Email already in use"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get department object
                department_code = serializer.validated_data['department']
                department_name_map = {
                    'astr': 'Astronomy',
                    'math': 'Mathematics',
                    'phy': 'Physics',
                    'data': 'Data Science',
                    'stat': 'Statistics',
                    'cosc': 'Computer Science'
                }
                department_name = department_name_map.get(department_code)
                if not department_name:
                    return Response(
                        error_response("Invalid department code"),
                        status=status.HTTP_400_BAD_REQUEST
                    )
                department = Department.objects.get(name__iexact=department_name)
                
                # Generate secure temporary password
                temp_password = generate_secure_password()
                
                # Create TA scheduler
                scheduler = TAScheduler.objects.create(
                    employee_number=serializer.validated_data['employee_number'],
                    name=f"{serializer.validated_data['first_name']} {serializer.validated_data['last_name']}",
                    email=serializer.validated_data['email'],
                    department=department,
                    password=temp_password
                )
                
                # Return response with temporary password for admin to share
                response_data = TASchedulerSerializer(scheduler).data
                response_data['temporary_password'] = temp_password
                
                log_user_activity('admin', request.user.email, f'created_scheduler_{scheduler.employee_number}')
                
                return Response(
                    success_response(
                        response_data,
                        "TA Scheduler created successfully. Please share the temporary password with the scheduler."
                    ),
                    status=status.HTTP_201_CREATED
                )
                
            except Department.DoesNotExist:
                return Response(
                    error_response("Department not found"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    error_response(f"Error creating TA scheduler: {str(e)}"),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            error_response("Invalid data", serializer.errors),
            status=status.HTTP_400_BAD_REQUEST
        )

@method_decorator(admin_required, name='dispatch')
class UserManagementView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]  # Add this line
    
    def patch(self, request):
        action = request.data.get('action')
        
        if action == 'deactivate':
            return self.deactivate_user(request)
        elif action == 'modify':
            return self.modify_user(request)
        else:
            return Response(
                error_response("Invalid action. Use 'deactivate' or 'modify'"),
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def deactivate_user(self, request):
        """Deactivate a user account - Admin only"""
        user_type = request.data.get('user_type')
        user_id = request.data.get('user_id')
        
        if not user_type or not user_id:
            return Response(
                error_response("user_type and user_id are required"),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if user_type == 'student':
                user = Student.objects.get(student_number=user_id)
                user.is_active = False
                user.save()
            elif user_type == 'instructor':
                user = Instructor.objects.get(employee_number=user_id)
                user.is_active = False
                user.save()
            elif user_type == 'scheduler':
                user = TAScheduler.objects.get(employee_number=user_id)
                user.is_active = False
                user.save()
            else:
                return Response(
                    error_response("Invalid user_type"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            log_user_activity('admin', request.user.email, f'deactivated_{user_type}_{user_id}')
            
            return Response(
                success_response(message=f"{user_type.title()} account deactivated successfully")
            )
            
        except (Student.DoesNotExist, Instructor.DoesNotExist, TAScheduler.DoesNotExist):
            return Response(
                error_response(f"{user_type.title()} not found"),
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                error_response(f"Error deactivating user: {str(e)}"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def modify_user(self, request):
        """Modify a user account - Admin only"""
        user_type = request.data.get('user_type')
        user_id = request.data.get('user_id')
        update_data = request.data.get('update_data', {})
        
        if not user_type or not user_id:
            return Response(
                error_response("user_type and user_id are required"),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if user_type == 'student':
                user = Student.objects.get(student_number=user_id)
                serializer = StudentSerializer(user, data=update_data, partial=True)
            elif user_type == 'instructor':
                user = Instructor.objects.get(employee_number=user_id)
                serializer = InstructorSerializer(user, data=update_data, partial=True)
            elif user_type == 'scheduler':
                user = TAScheduler.objects.get(employee_number=user_id)
                serializer = TASchedulerSerializer(user, data=update_data, partial=True)
            else:
                return Response(
                    error_response("Invalid user_type"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if serializer.is_valid():
                serializer.save()
                log_user_activity('admin', request.user.email, f'modified_{user_type}_{user_id}')
                
                return Response(
                    success_response(
                        serializer.data,
                        f"{user_type.title()} account modified successfully"
                    )
                )
            else:
                return Response(
                    error_response("Invalid data", serializer.errors),
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (Student.DoesNotExist, Instructor.DoesNotExist, TAScheduler.DoesNotExist):
            return Response(
                error_response(f"{user_type.title()} not found"),
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                error_response(f"Error modifying user: {str(e)}"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'User Profile Service is running',
        'available_endpoints': {
            # Basic user endpoints
            'students': '/api/profile/students/',
            'instructors': '/api/profile/instructors/',
            'schedulers': '/api/profile/schedulers/',
            'find_user': '/api/profile/find-user/',
            
            # Admin endpoints
            'admin_create_instructor': '/api/profile/admin/create-instructor/',
            'admin_create_scheduler': '/api/profile/admin/create-scheduler/',
            'admin_user_management': '/api/profile/admin/user-management/',

            # Scheduler endpoints
            'scheduler_create_instructor': '/api/profile/scheduler/create-instructor/',
            
            # Student profile endpoints
            'my_profile': '/api/profile/me/',
            'my_experiences': '/api/profile/me/experiences/',
            'my_skills': '/api/profile/me/skills/',
            'my_availability': '/api/profile/me/availability/',
            'my_preferences': '/api/profile/me/preferences/',
            
            # Admin student access
            'student_profile': '/api/profile/student/{student_id}/',
        }
    })