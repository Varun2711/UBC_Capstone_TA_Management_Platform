from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import make_password
from django.db import transaction
from utils.password_utils import generate_secure_password
from django.http import Http404
import requests
import os

# Import shared auth utilities
from auth_utils.decorators import admin_required, scheduler_required, authenticated_required, student_required
from auth_utils.permissions import IsAdminUser, IsSchedulerUser, IsAuthenticatedUser, IsStudentUser, IsSchedulerOrAdmin

from .models import Student, Instructor, TAScheduler, Admin, StudentProfile, StudentExperience, StudentSkill, StudentAvailability, StudentCoursePreference, Department
from .serializers import (StudentSerializer, InstructorSerializer, InstructorProfileSerializer, TASchedulerSerializer,TASchedulerProfileSerializer, AdminSerializer, AdminProfileSerializer, UpdateStudentProfileSerializer, UpdateInstructorSerializer, UpdateTASchedulerSerializer, UpdateAdminSerializer, StudentExperienceSerializer, StudentSkillsSerializer,
                          StudentAvailabilitySerializer, StudentCoursePreferenceSerializer,ComprehensiveStudentProfileSerializer, CreateInstructorSerializer,CreateSchedulerSerializer, DepartmentSerializer, CreateAdminSerializer, SchedulerInstructorSerializer,SchedulerInstructorUpdateSerializer)

from utils.profile_utils import get_user_by_id, get_user_by_email
from utils.response_utils import success_response, error_response
from utils.logging_utils import log_user_activity
    
class DepartmentListView(generics.ListAPIView):
    """
    Endpoint to list all available departments - no authentication required
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)
    
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    lookup_field = 'student_number'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsSchedulerUser]  # Schedulers can view students
        
        return [permission() for permission in permission_classes]

class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    lookup_field = 'employee_number'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsSchedulerUser]
        
        return [permission() for permission in permission_classes]

class TASchedulerViewSet(viewsets.ModelViewSet):
    queryset = TAScheduler.objects.all()
    serializer_class = TASchedulerSerializer
    lookup_field = 'employee_number'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsSchedulerUser]
        
        return [permission() for permission in permission_classes]

# Profile Management Views
class ProfileDetailView(generics.RetrieveAPIView):
    """
    Get the profile of a user:
    - Currently logged in user when accessed via /me/
    - Specific student when accessed via /student/<student_id>/
    """

    
    def get_permissions(self):
        """Use shared auth permissions"""
        # Check if accessing specific student (admin/scheduler view)
        student_id = self.kwargs.get('student_id')
        if student_id:
            # For specific student access, require admin OR scheduler permissions
            return [IsSchedulerOrAdmin()]
        else:
            # For /me/ access, any authenticated user
            return [IsAuthenticatedUser()]
    
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
        student_id = self.kwargs.get('student_id')
        if student_id:
            # Find the Student first
            student = get_object_or_404(Student, student_number=student_id)
            
            # Create Django User if it doesn't exist
            user, created = User.objects.get_or_create(
                email=student.email,
                defaults={
                    'username': student.email,
                    'first_name': student.name.split()[0] if student.name else '',
                    'last_name': ' '.join(student.name.split()[1:]) if len(student.name.split()) > 1 else '',
                    'is_active': True
                }
            )
            
            if created:
                print(f"✅ Created missing Django User for {student.email}")
            
            return user
        
        # Handle /me/ access
        user_type = self.request.auth.payload.get('user_type', None)
        user_id = self.request.auth.payload.get('sub', None)
        
        if user_type == 'student':
            # Ensure Django User exists for student
            try:
                student = Student.objects.get(student_number=user_id)
                user, created = User.objects.get_or_create(
                    email=student.email,
                    defaults={
                        'username': student.email,
                        'first_name': student.name.split()[0] if student.name else '',
                        'last_name': ' '.join(student.name.split()[1:]) if len(student.name.split()) > 1 else '',
                        'is_active': True
                    }
                )
                return user
            except Student.DoesNotExist:
                raise Http404("Student not found")
        
        elif user_type == 'instructor':
            return get_object_or_404(Instructor, employee_number=user_id)
        elif user_type == 'scheduler':
            return get_object_or_404(TAScheduler, employee_number=user_id)
        elif user_type == 'admin':
            return get_object_or_404(Admin, employee_number=user_id)
        else:
            raise Http404("Invalid user type")

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
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

# Student Experience Views - Keep your existing logic
class StudentTAExperienceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentExperienceSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
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

    def delete(self, request, *args, **kwargs):
        """Delete all experiences for the user"""
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        
        deleted_count = StudentExperience.objects.filter(user=user).delete()[0]
        return Response({
            'message': f'Deleted {deleted_count} experiences successfully'
        }, status=status.HTTP_200_OK)
    
class StudentExperienceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentExperienceSerializer

    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentExperience.objects.filter(user=user)

# Student Skills Views - Keep your existing logic
class StudentSkillListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentSkillsSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
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

    def delete(self, request, *args, **kwargs):
        """Delete all skills for the user"""
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        
        deleted_count = StudentSkill.objects.filter(user=user).delete()[0]
        return Response({
            'message': f'Deleted {deleted_count} skills successfully'
        }, status=status.HTTP_200_OK)

class StudentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSkillsSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentSkill.objects.filter(user=user)

# Student Availability Views - Keep your existing logic
class StudentAvailabilityView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentAvailabilitySerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
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

# Student Course Preferences Views - Keep your existing logic
class StudentCoursePreferenceListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
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

    def delete(self, request, *args, **kwargs):
        """Delete all course preferences for the user"""
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        
        deleted_count = StudentCoursePreference.objects.filter(user=user).delete()[0]
        return Response({
            'message': f'Deleted {deleted_count} course preferences successfully'
        }, status=status.HTTP_200_OK)

class StudentCoursePreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentCoursePreferenceSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAuthenticatedUser()]
    
    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        if student_id:
            student = get_object_or_404(Student, student_number=student_id)
            user = get_object_or_404(User, email=student.email)
        else:
            user = self.request.user
        return StudentCoursePreference.objects.filter(user=user)

# Find user endpoint - Keep your existing logic
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
        else:
            # If searching by email and not found, exit immediately
            return Response(error_response("User not found"), status=status.HTTP_404_NOT_FOUND)
    
    # Search by student number
    if student_number:
        try:
            user = Student.objects.get(student_number=student_number)
            # ... (rest of the success logic is fine)
            log_user_activity('student', student_number, 'profile_searched')
            return Response(success_response({
                "user": StudentSerializer(user).data,
                "type": "student"
            }))
        except Student.DoesNotExist:
            # If searching by student_number and not found, exit immediately
            return Response(error_response("User not found"), status=status.HTTP_404_NOT_FOUND)
    
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
    
    # If we reach here, it means a specific search was attempted and failed, or no valid param was given.
    # No parameters provided
    if not email and not student_number and not employee_number:
        return Response(
            error_response("Please provide email, student_number, or employee_number parameter"),
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # User not found (this is now a fallback)
    return Response(
        error_response("User not found"),
        status=status.HTTP_404_NOT_FOUND
    )

# Admin Management Views - Update with shared auth utilities
@method_decorator(admin_required, name='dispatch')
class CreateInstructorView(generics.CreateAPIView):
    serializer_class = CreateInstructorSerializer

    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAdminUser()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    department_code = serializer.validated_data['department']
                    
                    # Map department codes to full names
                    department_mapping = {
                        'astr': 'Astronomy',
                        'math': 'Mathematics',
                        'phy': 'Physics',
                        'data': 'Data Science',
                        'stat': 'Statistics',
                        'cosc': 'Computer Science',
                    }
                    
                    department_name = department_mapping.get(department_code)
                    if not department_name:
                        return Response(
                            error_response(f"Invalid department code: {department_code}"),
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    department = Department.objects.get(name__iexact=department_name)
                    
                    password = generate_secure_password()
                    hashed_password = make_password(password)
                    
                    instructor = Instructor.objects.create(
                        name=f"{serializer.validated_data['first_name']} {serializer.validated_data['last_name']}",
                        email=serializer.validated_data['email'],
                        employee_number=serializer.validated_data['employee_number'],
                        department=department,
                        password=hashed_password,
                        is_active=True
                    )
                    
                    log_user_activity(request.user_id, 'ADMIN_CREATE_INSTRUCTOR', instructor.employee_number)
                    
                    # Send notification email
                    send_account_creation_email(
                        email=instructor.email,
                        name=instructor.name,
                        temporary_password=password,
                        user_type='instructor'
                    )
                    
                    response_data = {
                        "id": instructor.employee_number,
                        "name": instructor.name,
                        "department": instructor.department.name,
                        "email": instructor.email,
                        "created_by": request.user_id,
                        "temporary_password": password
                    }
                    
                    return Response(
                        success_response(response_data, "Instructor created successfully. A notification has been sent to their email."),
                        status=status.HTTP_201_CREATED
                    )
            except Department.DoesNotExist:
                return Response(
                    error_response("Department not found"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    error_response(f"Failed to create instructor: {str(e)}"),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            error_response("Invalid data", serializer.errors),
            status=status.HTTP_400_BAD_REQUEST
        )

@method_decorator(admin_required, name='dispatch')
class CreateSchedulerView(generics.CreateAPIView):
    serializer_class = CreateSchedulerSerializer
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAdminUser()]
    
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
                hashed_password = make_password(temp_password)
                
                # Create TA scheduler
                scheduler = TAScheduler.objects.create(
                    employee_number=serializer.validated_data['employee_number'],
                    name=f"{serializer.validated_data['first_name']} {serializer.validated_data['last_name']}",
                    email=serializer.validated_data['email'],
                    department=department,
                    password=hashed_password
                )
                
                # Return response with temporary password for admin to share
                response_data = {
                    "id": scheduler.employee_number,
                    "name": scheduler.name,
                    "department": scheduler.department.name,
                    "email": scheduler.email,
                    "created_by": request.user_id,
                    "temporary_password": temp_password
                }
                
                log_user_activity(request.user_id, 'ADMIN_CREATE_SCHEDULER', scheduler.employee_number)
                
                # Send notification email
                send_account_creation_email(
                    email=scheduler.email,
                    name=scheduler.name,
                    temporary_password=temp_password,
                    user_type='scheduler'
                )
                
                return Response(
                    success_response(
                        response_data,
                        "TA Scheduler created successfully. A notification has been sent to their email."
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
    
    def get_permissions(self):
        """Use shared auth permissions"""
        return [IsAdminUser()]
    
    def get(self, request):
        """Provide instructions for the endpoint."""
        return Response(
            success_response(message="This endpoint is for modifying users. Use a PATCH request with an 'action' ('deactivate', 'reactivate', or 'modify').")
        )

    def patch(self, request):
        """Handle PATCH requests for user management actions"""
        action = request.data.get('action')
        
        if action == 'deactivate':
            return self.deactivate_user(request)
        elif action == 'reactivate':
            return self.reactivate_user(request)
        elif action == 'modify':
            return self.modify_user(request)
        else:
            return Response(
                error_response("Invalid action. Use 'deactivate', 'reactivate', or 'modify'"),
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
            
            log_user_activity('admin', request.user_id, f'deactivated_{user_type}_{user_id}')
            
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
    
    def reactivate_user(self, request):
        """Reactivate a user account - Admin only"""
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
                user.is_active = True
                user.save()
            elif user_type == 'instructor':
                user = Instructor.objects.get(employee_number=user_id)
                user.is_active = True
                user.save()
            elif user_type == 'scheduler':
                user = TAScheduler.objects.get(employee_number=user_id)
                user.is_active = True
                user.save()
            else:
                return Response(
                    error_response("Invalid user_type"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            log_user_activity('admin', request.user_id, f'reactivated_{user_type}_{user_id}')
            
            return Response(
                success_response(message=f"{user_type.title()} account reactivated successfully")
            )
            
        except (Student.DoesNotExist, Instructor.DoesNotExist, TAScheduler.DoesNotExist):
            return Response(
                error_response(f"{user_type.title()} not found"),
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                error_response(f"Error reactivating user: {str(e)}"),
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
                serializer = UpdateStudentProfileSerializer(user, data=update_data, partial=True)
            elif user_type == 'instructor':
                user = Instructor.objects.get(employee_number=user_id)
                serializer = UpdateInstructorSerializer(user, data=update_data, partial=True)
            elif user_type == 'scheduler':
                user = TAScheduler.objects.get(employee_number=user_id)
                serializer = UpdateTASchedulerSerializer(user, data=update_data, partial=True)
            elif user_type == 'admin':
                user = Admin.objects.get(employee_number=user_id)
                serializer = UpdateAdminSerializer(user, data=update_data, partial=True)
            else:
                return Response(
                    error_response("Invalid user_type"),
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if serializer.is_valid():
                serializer.save()
                log_user_activity(request.user_id, f'ADMIN_MODIFY_{user_type.upper()}', user_id)
                
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
                
        except (Student.DoesNotExist, Instructor.DoesNotExist, TAScheduler.DoesNotExist, Admin.DoesNotExist):
            return Response(
                error_response(f"{user_type.title()} not found"),
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                error_response(f"Error modifying user: {str(e)}"),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Add the shared auth user management functions
@api_view(['POST'])
@admin_required
def create_admin(request):
    """Admin-only admin creation"""
    try:
        with transaction.atomic():
            required_fields = ['name', 'email', 'employee_number']
            for field in required_fields:
                if field not in request.data:
                    return Response(error_response(f"{field} is required"), status=status.HTTP_400_BAD_REQUEST)
            
            if Admin.objects.filter(email=request.data.get('email')).exists():
                return Response(error_response("Admin with this email already exists"), status=status.HTTP_400_BAD_REQUEST)
            
            password = generate_secure_password()
            hashed_password = make_password(password)

            admin = Admin.objects.create(
                name=request.data.get('name'),
                email=request.data.get('email'),
                employee_number=request.data.get('employee_number'),
                password=hashed_password,
                is_active=True
            )
            
            log_user_activity(request.user_id, 'ADMIN_CREATE_ADMIN', admin.employee_number)

            # Send notification email
            send_account_creation_email(
                email=admin.email,
                name=admin.name,
                temporary_password=password,
                user_type='admin'
            )

            response_data = {
                "id": admin.employee_number,
                "name": admin.name,
                "email": admin.email,
                "created_by": request.user_id
            }
            
            return Response(
                success_response(response_data, "Admin created successfully. A notification has been sent to their email."),
                status=status.HTTP_201_CREATED
            )
            
    except Exception as e:
        return Response(
            error_response(f"Failed to create admin: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsSchedulerOrAdmin])
def get_users(request):
    """Get all users - Scheduler and Admin access"""
    try:
        user_type_filter = request.GET.get('user_type', 'all')
        users_data = []
        
        if user_type_filter in ['all', 'student']:
            students = Student.objects.all()
            for student in students:
                users_data.append({
                    'id': student.student_number,
                    'name': student.name,
                    'email': student.email,
                    'type': 'student',
                    'is_active': student.is_active,
                    'department': student.department.name if student.department else None
                })
        
        if user_type_filter in ['all', 'instructor']:
            instructors = Instructor.objects.all()
            for instructor in instructors:
                users_data.append({
                    'id': instructor.employee_number,
                    'name': instructor.name,
                    'email': instructor.email,
                    'type': 'instructor',
                    'is_active': instructor.is_active,
                    'department': instructor.department.name if instructor.department else None
                })
        
        if user_type_filter in ['all', 'scheduler']:
            schedulers = TAScheduler.objects.all()
            for scheduler in schedulers:
                users_data.append({
                    'id': scheduler.employee_number,
                    'name': scheduler.name,
                    'email': scheduler.email,
                    'type': 'scheduler',
                    'is_active': scheduler.is_active,
                    'department': scheduler.department.name if scheduler.department else None
                })
        
        if user_type_filter in ['all', 'admin']:
            admins = Admin.objects.all()
            for admin in admins:
                users_data.append({
                    'id': admin.employee_number,
                    'name': admin.name,
                    'email': admin.email,
                    'type': 'admin',
                    'is_active': admin.is_active,
                    'department': None
                })
        
        return Response(success_response({
            'users': users_data,
            'total_count': len(users_data),
            'requested_by': request.user_id
        }))
        
    except Exception as e:
        return Response(
            error_response(f"Failed to fetch users: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@admin_required
def admin_dashboard(request):
    """Admin-only dashboard data"""
    try:
        student_count = Student.objects.count()
        instructor_count = Instructor.objects.count()
        scheduler_count = TAScheduler.objects.count()
        admin_count = Admin.objects.count()
        
        return Response(success_response({
            "user_id": request.user_id,
            "user_type": request.user_type,
            "statistics": {
                "total_students": student_count,
                "total_instructors": instructor_count,
                "total_schedulers": scheduler_count,
                "total_admins": admin_count,
                "total_users": student_count + instructor_count + scheduler_count + admin_count
            }
        }, "Admin dashboard data"))
        
    except Exception as e:
        return Response(
            error_response(f"Failed to fetch dashboard data: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
# Add these views to your existing views.py file

@api_view(['POST'])
@scheduler_required
def scheduler_create_instructor(request):
    """TA Scheduler can create instructors in any department"""
    serializer = SchedulerInstructorSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                # Get the TA Scheduler who is making the request
                scheduler = get_object_or_404(TAScheduler, employee_number=request.user_id)
                
                # Extract validated data
                employee_number = serializer.validated_data['employee_number']
                email = serializer.validated_data['email']
                department_name = serializer.validated_data['department']

                # Check for uniqueness
                if Instructor.objects.filter(employee_number=employee_number).exists():
                    return Response(error_response("Instructor with this employee number already exists"), status=status.HTTP_400_BAD_REQUEST)
                if Instructor.objects.filter(email=email).exists():
                    return Response(error_response("Instructor with this email already exists"), status=status.HTTP_400_BAD_REQUEST)

                # Get department
                department = get_object_or_404(Department, name=department_name)
                
                # Generate password
                password = generate_secure_password()
                hashed_password = make_password(password)
                
                # Create instructor in the specified department
                instructor = Instructor.objects.create(
                    name=serializer.validated_data['name'],
                    email=email,
                    employee_number=employee_number,
                    department=department,
                    password=hashed_password,
                    is_active=True
                )
                
                # Log the activity
                log_user_activity(request.user_id, 'SCHEDULER_CREATE_INSTRUCTOR', instructor.employee_number)
                
                # Send notification email
                send_account_creation_email(
                    email=instructor.email,
                    name=instructor.name,
                    temporary_password=password,
                    user_type='instructor'
                )

                # Return response in the format you requested
                response_data = {
                    "id": instructor.employee_number,
                    "name": instructor.name,
                    "department": instructor.department.name,
                    "email": instructor.email,
                    "created_by": request.user_id
                }
                
                return Response(
                    success_response(response_data, "Instructor created successfully. A notification has been sent to their email."),
                    status=status.HTTP_201_CREATED
                )
                
        except TAScheduler.DoesNotExist:
            return Response(error_response("Scheduler profile not found."), status=status.HTTP_404_NOT_FOUND)
        except Department.DoesNotExist:
            return Response(error_response("Department not found."), status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(error_response(f"An unexpected error occurred: {str(e)}"), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    return Response(error_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@scheduler_required
def scheduler_update_instructor(request, instructor_id):
    """TA Scheduler can update instructors in any department"""
    try:
        with transaction.atomic():
            # Get the instructor
            instructor = get_object_or_404(Instructor, employee_number=instructor_id)

            serializer = SchedulerInstructorUpdateSerializer(instructor, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()

                # Log the activity
                log_user_activity(request.user_id, 'SCHEDULER_UPDATE_INSTRUCTOR', instructor.employee_number)

                # Return response
                response_data = {
                    "id": instructor.employee_number,
                    "name": instructor.name,
                    "department": instructor.department.name,
                    "email": instructor.email,
                    "updated_by": request.user_id
                }

                return Response(
                    success_response(response_data, "Instructor updated successfully"),
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    error_response("Invalid data", serializer.errors),
                    status=status.HTTP_400_BAD_REQUEST
                )

    except Instructor.DoesNotExist:
        return Response(
            error_response("Instructor not found"),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(f"Failed to update instructor: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@scheduler_required
def scheduler_delete_instructor(request, instructor_id):
    """TA Scheduler can delete instructors in any department"""
    try:
        with transaction.atomic():
            # Get the instructor
            instructor = get_object_or_404(Instructor, employee_number=instructor_id)

            # Store info for response
            instructor_info = {
                "id": instructor.employee_number,
                "name": instructor.name,
                "department": instructor.department.name,
                "email": instructor.email
            }

            # Log the activity before deletion
            log_user_activity(request.user_id, 'SCHEDULER_DELETE_INSTRUCTOR', instructor.employee_number)

            # Delete the instructor
            instructor.delete()

            return Response(
                success_response(
                    {
                        "deleted_instructor": instructor_info,
                        "deleted_by": request.user_id
                    },
                    "Instructor deleted successfully"
                ),
                status=status.HTTP_200_OK
            )

    except Instructor.DoesNotExist:
        return Response(
            error_response("Instructor not found"),
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            error_response(f"Failed to delete instructor: {str(e)}"),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
def send_account_creation_email(email, name, temporary_password, user_type):
    """Helper function to call the notification service via nginx"""
    # Route through nginx, which will forward to the notification service
    notification_url = "http://nginx/api/notifications/send_account_creation_email/"
    
    payload = {
        "email": email,
        "name": name,
        "temporary_password": temporary_password,
        "user_type": user_type
    }
    
    try:
        response = requests.post(notification_url, json=payload, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print(f"Successfully requested account creation email for {email}")
        return True
    except requests.exceptions.RequestException as e:
        # In a production environment, you would use a more robust logging solution
        print(f"Failed to send account creation email request to notification service for {email}: {e}")
        return False

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'User Profile Service is running',
        'service_scope': 'User management and profile operations',
        'available_endpoints': {
            # Basic user endpoints
            'students': '/api/profile/students/',
            'instructors': '/api/profile/instructors/',
            'schedulers': '/api/profile/schedulers/',
            'find_user': '/api/profile/find-user/',
            
            # Admin endpoints
            'admin_create_instructor': '/api/profile/admin/create-instructor/',
            'admin_create_scheduler': '/api/profile/admin/create-scheduler/',
            'admin_create_admin': '/api/profile/admin/create-admin/',
            'admin_user_management': "/api/profile/admin/user-management/ (PATCH with action: 'deactivate', 'reactivate', 'modify')",
            'admin_dashboard': '/api/profile/admin/dashboard/',
            'get_users': '/api/profile/users/',
            'departments': '/api/profile/departments/',

            # TA Scheduler endpoints
            'scheduler_create_instructor': '/api/profile/scheduler/create-instructor/',
            'scheduler_update_instructor': '/api/profile/scheduler/update-instructor/{instructor_id}/',
            'scheduler_delete_instructor': '/api/profile/scheduler/delete-instructor/{instructor_id}/',
            
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