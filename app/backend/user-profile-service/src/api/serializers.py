from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Student, Instructor, TAScheduler, StudentProfile, StudentExperience, StudentAvailability, StudentCoursePreference, StudentSkill

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }

class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }


class TASchedulerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TAScheduler
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['gpa', 'year_degree_start', 'minor', 'ubc_employee_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class StudentExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentExperience
        fields = [
            'id', 'course_code', 'course_name', 'term', 'instructor_name',
            'start_date', 'end_date', 'is_current', 'description', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Custom validation for TA experience"""
        # Ensure end_date is after start_date if provided
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError("End date cannot be before start date.")
        
        # If is_current is True, end_date should be None
        if data.get('is_current') and data.get('end_date'):
            raise serializers.ValidationError("Current positions should not have an end date.")
        
        return data

class StudentSkillsSerializer( serializers.ModelSerializer):
    class Meta:
        model = StudentSkill
        fields = ['id', 'skill_type', 'name', 'created_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StudentAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAvailability
        fields = ['id', 'availability_grid', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_availability_grid(self, value):
        # Validate that the grid follows the expected format
        # Expected format: {"monday": ["9:00-10:00", "14:00-15:00"], ...}
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("Availability grid must be a dictionary")
        
        for day, times in value.items():
            if day not in valid_days:
                raise serializers.ValidationError(f"Invalid day in grid: {day}")
            if not isinstance(times, list):
                raise serializers.ValidationError(f"Times for {day} must be a list")
        return value

class StudentCoursePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCoursePreference
        fields = ['id', 'student', 'course_code', 'preference_rank', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ComprehensiveStudentProfileSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    experiences = StudentExperienceSerializer(many=True, read_only=True)
    skills = StudentSkillsSerializer(many=True, read_only=True)
    availability = StudentAvailabilitySerializer(read_only=True)
    course_preferences = StudentCoursePreferenceSerializer(many=True, read_only=True)
    student_record = StudentSerializer(source='student_profile.student_record', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'student_profile', 'student_record', 'experiences', 'skills', 
            'availability', 'course_preferences'
        ]

class CreateInstructorSerializer(serializers.Serializer):
    FACULTY_CHOICES = [
        ('astr', 'Astronomy'),
        ('math', 'Mathematics'),
        ('phy', 'Physics'),
        ('data', 'Data Science'),
        ('stat', 'Statistics'), 
        ('cosc', 'Computer Science'),
        # based on current ta application form
    ]
    faculty = serializers.ChoiceField(choices=FACULTY_CHOICES)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    employee_number = serializers.CharField(max_length=20)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        if Instructor.objects.filter(email=value).exists():
            raise serializers.ValidationError("Instructor with this email already exists.")
        return value
    
    def validate_employee_number(self, value):
        if Instructor.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("Instructor with this employee number already exists.")
        return value
    
class CreateSchedulerSerializer(serializers.Serializer):
    DEPARTMENT_CHOICES = [
        ('astr', 'Astronomy'),
        ('math', 'Mathematics'),
        ('phy', 'Physics'),
        ('data', 'Data Science'),
        ('stat', 'Statistics'), 
        ('cosc', 'Computer Science'),
        # based on current ta application form
    ]
    department = serializers.ChoiceField(choices=DEPARTMENT_CHOICES)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    employee_number = serializers.CharField(max_length=20)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        if TAScheduler.objects.filter(email=value).exists():
            raise serializers.ValidationError("TA Scheduler with this email already exists.")
        return value
    
    def validate_employee_number(self, value):
        if TAScheduler.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("TA Scheduler with this employee number already exists.")
        return value
    
