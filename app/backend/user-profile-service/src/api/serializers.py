from rest_framework import serializers
from .models import Student, Instructor, TAScheduler

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

class TASchedulerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TAScheduler
        fields = '__all__'