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
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers', db_constraint=False)
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_tascheduler'

    def __str__(self):
        return f"{self.name} ({self.employee_number})"
    
class Instructor(models.Model):
    """Reference to instructors from simpleapi"""
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='instructors', db_constraint=False)
    email = models.EmailField()
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_instructor'
    
    def __str__(self):
        return self.name

class Student(models.Model):
    student_number = models.CharField(max_length=8, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, db_constraint=False)  # Added db_constraint=False
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
    """Reference to terms from course-service - must match exact structure"""
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)
    
    # Self-referential FK for hierarchical terms (e.g., "W2025 Term 1" is subset of "W2025 Both Terms")
    subsetOf = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subterms', db_constraint=False)
    
    # Use DateField for proper date handling
    start = models.DateField(help_text="Term start date")
    end = models.DateField(help_text="Term end date")
    
    startCalendarYear = models.IntegerField()
    endCalendarYear = models.IntegerField()
    academicYear = models.CharField(max_length=10, help_text="e.g., '2025/26'")
    
    # Auto-set created timestamp
    createdAt = models.DateTimeField(default=timezone.now)
    
    # Add useful fields
    is_active = models.BooleanField(default=True)
    term_type = models.CharField(max_length=20, choices=[
        ('winter', 'Winter'),
        ('summer', 'Summer'),       
        ('full_year', 'Full Year'),
    ], null=True, blank=True)

    class Meta:
        managed = False  # ← This is managed by course-service
        db_table = 'myapp_term'

    def __str__(self):
        return f"{self.code}"

class Application(models.Model):        
    application_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, db_constraint=False)  # Added db_constraint=False
    posting = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, null=True, db_constraint=False)  # Added db_constraint=False
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
    termSelection = models.ForeignKey(Term, on_delete = models.SET_NULL, null=True, db_constraint=False)  # Added db_constraint=False
   
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
    
class Course(models.Model):
    """Reference to courses from course-service"""
    course_number = models.CharField(max_length=9, unique=True)
    course_name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_constraint=False)
    course_description = models.TextField(max_length=500, blank=True, null=True)
    course_level = models.CharField(max_length=4, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_courses'

    def __str__(self):
        return f'{self.course_number} {self.course_name}'

class CourseOffering(models.Model):
    """Reference to course offerings from course-service"""
    course_offering_id = models.UUIDField(primary_key=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='offerings', db_constraint=False)
    section_number = models.CharField(max_length=3, help_text="Section number (e.g., '001', 'L01')")
    academic_term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='course_offerings', db_constraint=False)
    instructor = models.ForeignKey('Instructor', on_delete=models.SET_NULL, null=True, blank=True, related_name='course_offerings', db_constraint=False)

    class Meta:
        managed = False
        db_table = 'myapp_course_offerings'

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term})'

class SharedSession(models.Model):
    """Reference to shared sessions from course-service"""
    SESSION_TYPE_CHOICES = [
        ('lab', 'Lab'),
        ('tutorial', 'Tutorial'),
        ('seminar', 'Seminar')
    ]

    shared_session_id = models.UUIDField(primary_key=True)
    session_type = models.CharField(max_length=10, choices=SESSION_TYPE_CHOICES, help_text="Type of shared session")
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='lab_sections', db_constraint=False)
    section_number = models.CharField(max_length=3, help_text="Lab section number (e.g., 'L01', 'T01')")
    academic_term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='lab_sections', db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='shared_sessions', db_constraint=False)

    class Meta:
        managed = False
        db_table = 'myapp_sharedsessions'

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term}) - {self.session_type}'

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