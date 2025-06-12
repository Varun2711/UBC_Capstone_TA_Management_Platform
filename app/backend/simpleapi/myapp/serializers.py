from rest_framework import serializers
from .models import *


# Creating seralizers for the models 

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['name']  # Include all fields from the Department model      

class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)  # Nested serializer for departments    
    department_id = serializers.PrimaryKeyRelatedField(  # For POST/PUT requests
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )

    class Meta:
        model = Course
        fields = ['course_number', 'title', 'description', 'department', 'department_id', 'is_active', 'created_at', 'updated_at']  # Include all fields from the Course model


#TAScheduler Serializer is used below in the JobPosting Serializer
class TAschedulerSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)  # Nested serializer for departments
    class Meta:
        model = TAScheduler
        fields = ['employee_number', 'name', 'email', 'department'] #return these fields in the response

class JobPostingQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPostingQuestion
        fields = ['question_id', 'question_text']


# Serializers for JobPosting which nests Department and TAScheduler serializers, as job posting questions
class JobPostingSerializer(serializers.ModelSerializer):
   
    department_id = serializers.PrimaryKeyRelatedField(  #department_id field for write/updates only
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )    
    department = DepartmentSerializer(read_only=True)  # Nested serializer for department fields. This is for read only. Reutrns department name.    
   
    created_by = TAschedulerSerializer(read_only=True)  # Same idea for created_by (if needed)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=TAScheduler.objects.all(),
        source='created_by',
        write_only=True
    ) 
    posting_questions = JobPostingQuestionSerializer(many=True)
    
    class Meta:
        model = JobPosting
        fields = ['posting_id', 'title', 'status', 'description', 
                  'post_date' ,'department_id', 'department', 'deadline_date', 
                  'created_by', 'created_by_id', 'requirements', 'posting_questions'] #fields to include in the serializer
    # Note: 'posting_questions' is read-only here, as it will be handled separately in the create method
    
    def create(self, validated_data):
        questions_data = validated_data.pop('posting_questions', [])
        job_posting = JobPosting.objects.create(**validated_data)
        
        #create the JobPostingQuestion instances
        # Note: We pop 'job_posting' from each question data to avoid circular reference
        # and use the job_posting instance created above
        for question in questions_data:
            question.pop('job_posting', None) 
            JobPostingQuestion.objects.create(posting=job_posting, **question)
        
        return job_posting
    
    def update(self, instance, validated_data):
        questions_data = validated_data.pop('posting_questions', [])

        # Update JobPosting fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle nested posting questions
        # Simple version: delete all old, create new ones
        instance.posting_questions.all().delete()
        for question in questions_data:
            question.pop('job_posting', None) 
            JobPostingQuestion.objects.create(posting=instance, **question)

        return instance
    


#the below serializers were built out in the user-profiler-service

# Uncomment if you want to use the StudentSerializer in this application for testing purposes
# from django.contrib.auth.hashers import make_password

    # class StudentSerializer(serializers.ModelSerializer):
    # department = DepartmentSerializer(read_only=True)  # Nested serializer for departments, which wil lreturn departnament name
    # password = serializers.CharField(write_only=True)  #set this field to write only. Will not be returned in responses   
    # sin = serializers.CharField(write_only=True, required=False) # SIN is sensitive information, so we set it to write_only and will not be reutnred in responses

    # class Meta:
    #     model = Student 
    #     fields = ['id', 'student_number', 'name', 'email', 'phone', 'program', 'year_standing', 'study_level', 'department', 'password', 'sin']
    #     #exclude sensitive fields like password and sin
    
    # def create(self, validated_data):
    #     validated_data['password'] = make_password(validated_data['password'])
    #     return super().create(validated_data)


# Uncomment if you want to use the InstructorSerializer in this application for testing purposes
# from django.contrib.auth.hashers import make_password

    # InstructorSerializer is commented out as it is not used in this simpleapi, but you can uncomment and use it if needed
# 
    # class InstructorSerializer(serializers.ModelSerializer):
    # faculty = serializers.StringRelatedField()  # Use String representation of Faculty

    # class Meta:
    #     model = Instructor
    #     fields = ['id', 'employee_number', 'name', 'faculty', 'email']
           