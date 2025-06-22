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
        fields = ['gpa', 'expected_graduation', 'minor', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class StudentExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentExperience
        fields = [
            'id', 'experience_type', 'position_title', 'organization',
            'start_date', 'end_date', 'is_current', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

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
