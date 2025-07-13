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
            'code', 'description'
        ] 


# Adding the Dynamic Form Serializers to match changes in models.py
class FormQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormQuestion
        fields = [
            'question_id', 'question_text', 'question_type', 'field_name',
            'order', 'is_required', 'help_text', 'validation_rules', 'options'
        ]
        read_only_fields = ['question_id']



class FormSectionSerializer(serializers.ModelSerializer):
    questions = FormQuestionSerializer(many=True, required=False)
    
    class Meta:
        model = FormSection
        fields = [
            'section_id', 'name', 'section_type', 'order', 
            'is_required', 'description', 'questions'
        ]
        read_only_fields = ['section_id']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        section = FormSection.objects.create(**validated_data)
        
        for question_data in questions_data:
            FormQuestion.objects.create(section=section, **question_data)
        
        return section
    
    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        
        # Update section fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Only update questions if they were provided
        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                FormQuestion.objects.create(section=instance, **question_data)
        
        return instance

class FormTemplateSerializer(serializers.ModelSerializer):
    sections = FormSectionSerializer(many=True, required=False)
    created_by = TAschedulerSerializer(read_only=True)
    
    # Add write-only field for creating templates
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=TAScheduler.objects.all(),
        source='created_by',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = FormTemplate
        fields = [
            'template_id', 'name', 'description', 'created_by', 'created_by_id',
            'created_at', 'is_active', 'sections'
        ]
        read_only_fields = ['template_id', 'created_at'] #do not accept these as input because the db auto-generates themm

#when creating a template
    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        template = FormTemplate.objects.create(**validated_data)
        
        # Create sections and their questions
        for section_data in sections_data:
            questions_data = section_data.pop('questions', [])
            section = FormSection.objects.create(template=template, **section_data)
            
            # Create questions for this section
            for question_data in questions_data:
                FormQuestion.objects.create(section=section, **question_data)
        
        return template
    
    def update(self, instance, validated_data):
        sections_data = validated_data.pop('sections', None)
        
        # Update template fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Only update sections if they were provided in the request
        if sections_data is not None:
            # Clear existing sections (cascades to questions)
            instance.sections.all().delete()
            
            # Create new sections and questions
            for section_data in sections_data:
                questions_data = section_data.pop('questions', [])
                section = FormSection.objects.create(template=instance, **section_data)
                
                for question_data in questions_data:
                    FormQuestion.objects.create(section=section, **question_data)
        
        return instance

class ApplicationResponseSerializer(serializers.ModelSerializer):
    question = FormQuestionSerializer(read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=FormQuestion.objects.all(),
        source='question',
        write_only=True
    )
    
    class Meta:
        model = ApplicationResponse
        fields = ['response_id', 'question_id', 'question', 'response_data']

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

     # Form template associated with the job post
    form_template_id = serializers.PrimaryKeyRelatedField(
        queryset=FormTemplate.objects.all(),
        source='form_template',
        write_only=True,
        required=False,
        allow_null=True
    )


    #read only fields  
    department = DepartmentSerializer(read_only=True)  
    term = TermSerializer(read_only = True)   
    created_by = TAschedulerSerializer(read_only=True)    
    form_template = FormTemplateSerializer(read_only=True)
    
    class Meta:
        model = JobPosting
        fields = ['posting_id', 'title', 'status', 'description', 'term_id', 'term',
                  'post_date' ,'department_id', 'department', 'deadline_date',  
                  'created_by', 'created_by_id', 'requirements',
                  'form_template_id', 'form_template'] #fields to include in the serializer
   
    
    def create(self, validated_data):
        #questions_data = validated_data.pop('posting_questions', [])
        job_posting = JobPosting.objects.create(**validated_data)
        
        #create the JobPostingQuestion instances
        # Note: We pop 'job_posting' from each question data to avoid circular reference
        # and use the job_posting instance created above
        # for question in questions_data:
        #     question.pop('job_posting', None) 
        #     JobPostingQuestion.objects.create(posting=job_posting, **question)
        
        return job_posting
    
    def update(self, instance, validated_data):
      #questions_data = validated_data.pop('posting_questions', [])

        # Update JobPosting fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle nested posting questions
        # Simple version: delete all old, create new ones
        # instance.posting_questions.all().delete()
        # for question in questions_data:
        #     question.pop('job_posting', None) 
        #     JobPostingQuestion.objects.create(posting=instance, **question)

        return instance
    

class StudentSerializer(serializers.ModelSerializer):
   # department = DepartmentSerializer(read_only=True)
   # faculty = FacultySerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'name', 'student_number'            
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

    responses = ApplicationResponseSerializer(many=True, read_only=True)
    
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
            'hasOtherPositions', 'otherPositionHours',
            'responses'
        ]

class ApplicationWithResponsesSerializer(serializers.Serializer):
    """Serializer for the submit_with_responses custom action"""
    application = ApplicationSerializer()
    responses = serializers.DictField(
        child=serializers.JSONField(),
        required=False,
        help_text="Dictionary of field_name: response_value pairs"
    )
    template_id = serializers.IntegerField(
        required=False,
        help_text="ID of the form template (required if responses provided)"
    )
    
    def validate(self, data):
        """Validate that template_id is provided if responses are given"""
        if data.get('responses') and not data.get('template_id'):
            raise serializers.ValidationError(
                "template_id is required when responses are provided"
            )
        return data
    


