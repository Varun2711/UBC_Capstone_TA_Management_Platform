from django.db import models
from django.utils import timezone
import uuid
from rest_framework.decorators import api_view
from rest_framework.reverse import reverse

# Import shared models (these should be consistent across services)
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        managed = False
        db_table = 'myapp_department'

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

    def __str__(self):
        return f"{self.name} ({self.employee_number})"

class Student(models.Model):
    student_number = models.CharField(max_length=8, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    study_level = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_student'

    def __str__(self):
        return f"{self.name} ({self.student_number})"

# Add these reference models for foreign keys
class JobPosting(models.Model):
    """Reference to job postings from applications service"""
    posting_id = models.AutoField(primary_key=True)
    # Add other fields as needed for reference
    
    class Meta:
        managed = False
        db_table = 'myapp_jobposting'

    def __str__(self):
        return f"Job Posting {self.posting_id}"

class Term(models.Model):
    """Reference to terms from applications service"""
    term_id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    # Add other fields as needed for reference
    
    class Meta:
        managed = False
        db_table = 'myapp_term'

    def __str__(self):
        return f"{self.code} - {self.name}"

class Application(models.Model):        
    application_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True)
    posting = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, null=True)
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
    termSelection = models.ForeignKey(Term, on_delete = models.SET_NULL, null=True)      
   
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
        managed = False
        db_table = 'myapp_application'        
        
    def __str__(self):
        return f"Application {self.application_id} - {self.student}  for {self.posting}"
       
    def can_withdraw(self):
        """Check if application can be withdrawn"""
        return self.status in ['submitted', 'under_review'] 

# Add reference to shortlist from applications service
class ApplicationShortList(models.Model):
    """Reference to shortlisted applications from applications-jobpostings service"""
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='shortlists', db_constraint=False)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.SET_NULL, null=True, db_constraint=False)
    created_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(null=True, blank=True)
    
    class Meta:
        managed = False
        db_table = 'myapp_applicationshortlist'

    def __str__(self):
        return f"Shortlisted: {self.application}"

class CourseOffering(models.Model):
    """Reference to course offerings"""
    course_offering_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    class Meta:
        managed = False
        db_table = 'myapp_course_offerings'

class SharedSession(models.Model):
    """Reference to shared sessions"""
    shared_session_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    class Meta:
        managed = False
        db_table = 'myapp_sharedsessions'

# NEW MODELS FOR ALLOCATIONS SERVICE
class Offer(models.Model):
    """Enhanced offer model for the allocations service"""
    REQUIRED_HOURS_CHOICES = [
        ('6', '6 hours'),
        ('12', '12 hours'),
    ]
    
    ROLE_CHOICES = [
        ('ta', 'Teaching Assistant'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Response'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    offer_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    
    required_hours = models.CharField(max_length=2, choices=REQUIRED_HOURS_CHOICES, default='6')
    role = models.CharField(max_length=3, choices=ROLE_CHOICES, default='ta')
    
    # Offer lifecycle
    offer_date = models.DateTimeField(default=timezone.now)
    response_deadline = models.DateTimeField(help_text="Deadline for student to respond")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Response tracking
    responded_at = models.DateTimeField(null=True, blank=True)
    student_response = models.TextField(null=True, blank=True, help_text="Student's response message")
    
    # Administrative
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='offers_created', db_constraint=False)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'myapp_offer'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Offer {self.offer_id} - {self.student.name if self.student else 'Unknown'} for {self.course_offering}"
    
    def is_expired(self):
        """Check if offer has expired"""
        return self.response_deadline < timezone.now() and self.status == 'pending'
    
    def can_respond(self):
        """Check if student can still respond to offer"""
        return self.status == 'pending' and not self.is_expired()

class Assignment(models.Model):
    """Final assignment after offer acceptance"""
    ROLE_CHOICES = [
        ('ta', 'Teaching Assistant'),
    ]
    
    REQUIRED_HOURS_CHOICES = [
        ('6', '6 hours'),
        ('12', '12 hours'),
    ]
    
    assignment_id = models.AutoField(primary_key=True)
    offer = models.OneToOneField(Offer, on_delete=models.CASCADE, related_name='assignment', null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    
    required_hours = models.CharField(max_length=2, choices=REQUIRED_HOURS_CHOICES, default='6')
    role = models.CharField(max_length=3, choices=ROLE_CHOICES, default='ta')
    
    # Assignment tracking
    assigned_date = models.DateTimeField(default=timezone.now)
    assigned_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='assignments_made', db_constraint=False)
    
    # Status tracking
    is_active = models.BooleanField(default=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'myapp_assignment'
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.student.name if self.student else 'Unknown'} to {self.course_offering}"