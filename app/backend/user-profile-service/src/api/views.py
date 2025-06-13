from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .models import Student, Instructor, TAScheduler
from .serializers import StudentSerializer, InstructorSerializer, TASchedulerSerializer

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
    
#shared endpoint to find users across all types

@api_view(['GET'])
def find_user(request):
    """Find a user across all user types by email, student_number, or employee_number"""
    email = request.query_params.get('email')
    student_number = request.query_params.get('student_number')
    employee_number = request.query_params.get('employee_number')
    user_type = request.query_params.get('type')  # Optional filter
    
    # First check for utility modules
    try:
        # These functions should be in your utils module
        from utils.profile_utils import get_user_by_id, get_user_by_email
        from utils.response_utils import success_response, error_response
        from utils.logging_utils import log_user_activity
        
        has_utils = True
    except ImportError:
        has_utils = False
    
    # If utils are available, use the more advanced search
    if has_utils:
        # [... your original function implementation ...]
        pass
    
    # Simpler implementation without utilities
    else:
        response_data = {"user": None, "type": None}
        
        # Check by student number
        if student_number and (user_type == 'student' or user_type is None):
            try:
                student = Student.objects.get(student_number=student_number)
                return Response({
                    "user": StudentSerializer(student).data,
                    "type": "student"
                })
            except Student.DoesNotExist:
                pass
                
        # Check by employee number - instructor
        if employee_number and (user_type == 'instructor' or user_type is None):
            try:
                instructor = Instructor.objects.get(employee_number=employee_number)
                return Response({
                    "user": InstructorSerializer(instructor).data,
                    "type": "instructor"
                })
            except Instructor.DoesNotExist:
                pass
                
        # Check by employee number - scheduler
        if employee_number and (user_type == 'scheduler' or user_type is None):
            try:
                scheduler = TAScheduler.objects.get(employee_number=employee_number)
                return Response({
                    "user": TASchedulerSerializer(scheduler).data,
                    "type": "scheduler"
                })
            except TAScheduler.DoesNotExist:
                pass
                
        # Check by email
        if email:
            # Try student first
            if user_type == 'student' or user_type is None:
                try:
                    student = Student.objects.get(email=email)
                    return Response({
                        "user": StudentSerializer(student).data,
                        "type": "student"
                    })
                except Student.DoesNotExist:
                    pass
            
            # Try instructor
            if user_type == 'instructor' or user_type is None:
                try:
                    instructor = Instructor.objects.get(email=email)
                    return Response({
                        "user": InstructorSerializer(instructor).data,
                        "type": "instructor"
                    })
                except Instructor.DoesNotExist:
                    pass
            
            # Try scheduler
            if user_type == 'scheduler' or user_type is None:
                try:
                    scheduler = TAScheduler.objects.get(email=email)
                    return Response({
                        "user": TASchedulerSerializer(scheduler).data,
                        "type": "scheduler"
                    })
                except TAScheduler.DoesNotExist:
                    pass
        
        # If we get here, no user was found
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)