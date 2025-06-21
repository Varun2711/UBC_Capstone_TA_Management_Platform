from rest_framework import serializers
from .models import Student, Instructor, TAScheduler
from django.contrib.auth.hashers import make_password

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
        fields = ['student_number', 'name', 'email', 'password', 'study_level']
        extra_kwargs = {
            'password': {'write_only': True},
            'study_level': {'required': True}
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