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
    is_active = models.BooleanField(default=True)

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
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),], default='draft')
    
    # Timestamps
    applied_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
        
    # Selections (from Selections.jsx)
    positionType = models.CharField(max_length=100, choices=[
        ('UTA', 'Undergraduate Teaching Assistant'),
        ('GTA2', 'Graduate Teaching Assistant 2 (Master\'s Student)'),
        ('GTA1', 'Graduate Teaching Assistant 1 (Ph.D student)'),
    ], blank=True, null=True)

    #Term Selection
    termSelection = models.ForeignKey('Term', on_delete = models.SET_NULL, null=True)      
   
    workload = models.CharField(max_length=20, choices=[
        ('6', '6 hours'),
        ('12', '12 hours'),
    ], blank=True, null=True)
    
    # Discipline Rankings 
    disciplineRankings = models.JSONField() 
    
    citizenshipStatus = models.CharField(max_length=50, choices=[
        ('citizen', 'Canadian Citizen'),
        ('pr', 'Permanent Resident'),
        ('international', 'International Student'),
    ], blank=True, null=True)
    
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

