from django.db import models
from django.utils import timezone
import os


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = False
        db_table = 'myapp_department'

    def __str__(self):
        return self.name


class Student(models.Model):
    student_number = models.CharField(max_length=8, unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, null=True, blank=True)
    program = models.CharField(max_length=100, null=True, blank=True)
    year_standing = models.IntegerField(null=True, blank=True)
    study_level = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    sin = models.CharField(max_length=11, null=True, blank=True)
    password = models.CharField(max_length=255)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)
    expected_graduation = models.CharField(max_length=20, null=True, blank=True)  # Add this line

    class Meta:
        managed = False
        db_table = 'myapp_student'

class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='instructors')
    email = models.EmailField()
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_instructor'

class TAScheduler(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers')
    password = models.CharField(max_length=255)
  
    class Meta:
        managed = False
        db_table = 'myapp_tascheduler'


class Term(models.Model):
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)
    
    # Self-referential FK for hierarchical terms (e.g., "W2025 Term 1" is subset of "W2025 Both Terms")
    subsetOf = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subterms')
    
    # Use DateField instead of CharField for proper date handling
    start = models.DateField(help_text="Term start date")
    end = models.DateField(help_text="Term end date")
    
    startCalendarYear = models.IntegerField()
    endCalendarYear = models.IntegerField()
    academicYear = models.CharField(max_length=10, help_text="e.g., '2025/26'")
    
    # Auto-set created timestamp
    createdAt = models.DateTimeField(default=timezone.now)
    
    # Add some useful fields
    is_active = models.BooleanField(default=True)
    term_type = models.CharField(max_length=20, choices=[
        ('winter', 'Winter'),
        ('summer', 'Summer'),       
        ('full_year', 'Full Year'),
    ], null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'myapp_term'  
      

    def __str__(self):
        return f"{self.code}"
    
    @property
    def is_current(self):
        """Check if the term is currently active"""
        today = timezone.now().date()
        return self.start <= today <= self.end
    
    
    def get_subterms(self):
        """Get all subterms of this term"""
        return self.subterms.all()
    
    def is_subset_of(self, other_term):
        """Check if this term is a subset of another term"""
        return self.subsetOf == other_term
    

#adding new models to service    

class FormTemplate(models.Model):
    """Template for application forms that can be reused across job postings"""
    template_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_editable = models.BooleanField(default=True)
    
    class Meta:
        managed = True
        db_table = 'myapp_formtemplate'
    
    def __str__(self):
        return self.name

class FormSection(models.Model):
    """Sections within a form (e.g., Eligibility, Selections, etc.)"""
    SECTION_TYPES = [
        ('eligibility', 'Eligibility'),
        ('selections', 'Selections'), 
        ('personal_details', 'Personal Details'),
        ('documents', 'Supporting Documents'),
        ('custom', 'Custom Section'),
    ]
    
    section_id = models.AutoField(primary_key=True)
    template = models.ForeignKey(FormTemplate, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)
    section_type = models.CharField(max_length=20, choices=SECTION_TYPES)
    order = models.PositiveIntegerField()
    is_required = models.BooleanField(default=True)
    description = models.TextField(null=True, blank=True)
    is_editable =models.BooleanField(default=True)
    
    class Meta:
        managed = True
        db_table = 'myapp_formsection'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.template.name} - {self.name}"

class FormQuestion(models.Model):
    """Individual questions within form sections"""
    QUESTION_TYPES = [
        ('radio', 'Radio Button'),
        ('checkbox', 'Checkbox'),
        ('text', 'Text Input'),
        ('textarea', 'Text Area'),
        ('select', 'Dropdown Select'),
        ('number', 'Number Input'),
        ('email', 'Email Input'),
        ('file', 'File Upload'),
        ('ranking', 'Ranking/Ordering'),
    ]
    
    question_id = models.AutoField(primary_key=True)
    section = models.ForeignKey(FormSection, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    field_name = models.CharField(max_length=100)  # For mapping to response data
    order = models.PositiveIntegerField()
    is_required = models.BooleanField(default=False)
    help_text = models.TextField(null=True, blank=True) # Help text for the Student filling the application    
    validation_rules = models.JSONField(null=True, blank=True)  # Store validation rules
    options = models.JSONField(null=True, blank=True)  # For select/radio options
    is_editable = models.BooleanField(default=True)
    
    class Meta:
        managed = True
        db_table = 'myapp_formquestion'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.section.name} - {self.question_text[:50]}"


class JobPosting(models.Model):
    
    posting_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    post_date = models.DateField()
    deadline_date = models.DateField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, db_constraint=False)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.SET_NULL, null=True, db_constraint=False)

    #term that this position is advertising for
    term = models.ForeignKey('Term', on_delete = models.SET_NULL, null=True, db_constraint=False)     

    requirements = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('draft', 'Draft'),
        ('archived', 'Archived'),

    ], default='draft')
    
    # reference the template used for the job posting
    form_template = models.ForeignKey(
        FormTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Custom form template for this job posting",
        db_constraint =False
    )

    class Meta:
        managed = True
        db_table = 'myapp_jobposting'
     

    def __str__(self):
        return f"{self.title} - {self.department} ({self.post_date})"
    
    def is_expired(self):        
        return self.deadline_date < timezone.now().date()
    


class JobPostingQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='posting_questions')
    question_text = models.TextField()

    class Meta:
        unique_together = ('posting', 'question_text')
        managed = True
        db_table = 'myapp_jobpostingquestion'

    def __str__(self):
        return f"Question for {self.posting.title}: {self.question_text}"


class Application(models.Model):        
    application_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('Student', on_delete=models.SET_NULL, null=True)
    posting = models.ForeignKey('JobPosting', on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=[ 
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'No Longer In Consideration'),
        ('withdrawn', 'Withdrawn'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),], default='draft')     
    
    # Timestamps
    applied_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
        
    # Selections (from Selections.jsx)
    positionType = models.CharField(max_length=100, blank=True, null=True)

    #Term Selection
    termSelection = models.ForeignKey('Term', on_delete = models.SET_NULL, null=True)      
   
    workload = models.CharField(max_length=20, blank=True, null=True)
    
    # Discipline Rankings 
    disciplineRankings = models.JSONField() 
    
    citizenshipStatus = models.CharField(max_length=50, blank=True, null=True)
    
    residingInKelowna = models.CharField(max_length=10, choices=[
        ('yes', 'Yes'),
        ('no', 'No'),
    ], blank=True, null=True)
    
    fullTimeEnrollment = models.CharField(max_length=10, choices=[
        ('yes', 'Yes'),
        ('no', 'No'),
    ], blank=True, null=True)
    
    hasOtherPositions = models.CharField(max_length=10, choices=[
        ('yes', 'Yes'),
        ('no', 'No'),
    ], blank=True, null=True)
    
    otherPositionHours = models.PositiveIntegerField(blank=True, null=True, help_text="Hours per week for other positions")
    
    class Meta:
        managed = True
        db_table = 'myapp_application'        
        
    def __str__(self):
        return f"Application {self.application_id} - {self.student}  for {self.posting}"
       
    def can_withdraw(self):
        """Check if application can be withdrawn"""
        return self.status in ['submitted', 'under_review']     


 # Here we're storing dynamic application responses
class ApplicationResponse(models.Model):
    """Store responses to dynamic form questions"""
    response_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(FormQuestion, on_delete=models.CASCADE)
    response_data = models.JSONField()  # Store the actual response
    
    class Meta:
        managed = True
        db_table = 'myapp_applicationresponse'
        unique_together = ('application', 'question')
    
    def __str__(self):
        return f"Response to {self.question.question_text[:30]} for {self.application}"   
   

class ApplicationShortList(models.Model):    
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='shortlists')    
    created_by = models.ForeignKey(TAScheduler, on_delete=models.SET_NULL, null=True, db_constraint=False)
    created_at = models.DateTimeField(default=timezone.now)  # Track when shortlisted
    notes = models.TextField(null=True, blank=True)  # Some optional notes about why shortlisted??
    
    class Meta:
        managed = True
        db_table = 'myapp_applicationshortlist'
        # Prevent duplicate shortlists by same scheduler for same application
        unique_together = ('application', 'created_by')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Shortlisted: {self.application} by {self.created_by}"


class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    file_link = models.TextField()
    uploaded_at = models.DateField()

    class Meta:
        managed = True
        db_table = 'myapp_document'

