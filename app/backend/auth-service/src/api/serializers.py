from rest_framework import serializers
from .models import Student, Instructor, TAScheduler
from django.contrib.auth.hashers import make_password
from .models import Admin  

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # user_type = serializers.CharField()  # student, instructor, scheduler

class TokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user_id = serializers.CharField()
    user_type = serializers.CharField()
    name = serializers.CharField()

class StudentRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['student_number', 'name', 'email', 'password', 'study_level', 'program', 'expected_graduation']  # ✅ Add expected_graduation
        extra_kwargs = {
            'password': {'write_only': True},
            'study_level': {'required': True},
            'program': {'required': False},
            'expected_graduation': {'required': False}  # ✅ Add this
        }
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = ['employee_number', 'name', 'faculty', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class TASchedulerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TAScheduler
        fields = ['employee_number', 'name', 'email', 'department', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['employee_number', 'name', 'email', 'password', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True}
        }