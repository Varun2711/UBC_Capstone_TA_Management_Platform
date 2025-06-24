from rest_framework import serializers
from .models import *


# Creating seralizers for the models 

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['name']  # Include all fields from the Department model      


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

#Serializer used for the Term
class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term 
        fields = [
            'code'
        ] 

# Serializers for JobPosting which nests Department and TAScheduler serializers, as job posting questions
class JobPostingSerializer(serializers.ModelSerializer):   
    #fields for writes and updates
    department_id = serializers.PrimaryKeyRelatedField(  #department_id field for write/updates only
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    ) 

    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.all(),
        source='term',
        write_only=True
    )

    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=TAScheduler.objects.all(),
        source='created_by',
        write_only=True
    ) 

    #read only fields  
    department = DepartmentSerializer(read_only=True)  
    term = TermSerializer(read_only = True)   
    created_by = TAschedulerSerializer(read_only=True)      
    posting_questions = JobPostingQuestionSerializer(many=True)
    
    class Meta:
        model = JobPosting
        fields = ['posting_id', 'title', 'status', 'description', 'term_id', 'term',
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
    
class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['name']


class StudentSerializer(serializers.ModelSerializer):
   # department = DepartmentSerializer(read_only=True)
   # faculty = FacultySerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'student_number', 'name'            
        ]



class ApplicationSerializer(serializers.ModelSerializer):
    # For write operations - use IDs
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )
    posting_id = serializers.PrimaryKeyRelatedField(
        queryset=JobPosting.objects.all(),
        source='posting',
        write_only=True
    )

    termSelection_id = serializers.PrimaryKeyRelatedField(
        queryset = Term.objects.all(),
        source = 'termSelection',
        write_only = True
    )
    
    # For read operations - use nested serializers
    student = StudentSerializer(read_only=True)
    posting = JobPostingSerializer(read_only=True)
    termSelection = TermSerializer(read_only=True)
    
    # Related documents
    #documents = DocumentSerializer(many=True, read_only=True, source='document_set')
    
    class Meta:
        model = Application
        fields = [
            'application_id', 'status', 'applied_at', 'updated_at',
            # Write-only ID fields
            'student_id', 'posting_id', 'termSelection_id',
            # Read-only nested objects
            'student', 'posting', 'termSelection',
            # Application selections (matching your React component names)
            'positionType', 'workload', 'disciplineRankings',
            # Eligibility fields
            'citizenshipStatus', 'residingInKelowna', 'fullTimeEnrollment',
            'hasOtherPositions', 'otherPositionHours'
        ]
    
    