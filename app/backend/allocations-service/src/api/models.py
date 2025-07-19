from django.db import models
from django.utils import timezone
import uuid
from rest_framework.decorators import api_view
from rest_framework.reverse import reverse
from django.core.exceptions import ValidationError

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
    


# Time slot model
class TimeSlot(models.Model):
    """
    A time slot has a day, start time and end time.
    It is identified by a time slot id.
    """
    DAYS_OF_WEEK = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]

    slot_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    day = models.CharField(
        max_length=10, 
        choices=DAYS_OF_WEEK,
        help_text="Day of the week for this time slot"
    )
    start_time = models.TimeField(help_text="Start time of the slot")
    end_time = models.TimeField(help_text="End time of the slot")

    class Meta:
        managed = False
        db_table = 'myapp_timeslots'
        ordering = ['day', 'start_time']
        unique_together = ['day', 'start_time', 'end_time']

    def __str__(self):
        return f"{self.get_day_display()} {self.start_time}-{self.end_time}"

    def clean(self):
        """Validate that end_time is after start_time."""
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")

    @property
    def duration(self):
        """Calculate the duration of the time slot."""
        from datetime import datetime, timedelta
        if self.start_time and self.end_time:
            start = datetime.combine(datetime.today(), self.start_time)
            end = datetime.combine(datetime.today(), self.end_time)
            return end - start
        return None

    @property
    def time_increments(self):
        """
        Generate array of times in 30-minute increments from start to end time.
        For example: 8:00 AM to 9:30 AM would return ['8:00', '8:30', '9:00']
        """
        from datetime import datetime, timedelta
        if not self.start_time or not self.end_time:
            return []
        
        increments = []
        current_time = datetime.combine(datetime.today(), self.start_time)
        end_time = datetime.combine(datetime.today(), self.end_time)
        
        # Generate 30-minute increments (excluding the end time)
        while current_time < end_time:
            increments.append(current_time.strftime('%H:%M'))
            current_time += timedelta(minutes=30)
            
        return increments

class CourseOffering(models.Model):
    """Reference to course offerings from course-service"""
    course_offering_id = models.UUIDField(primary_key=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='offerings', db_constraint=False)
    section_number = models.CharField(max_length=3, help_text="Section number (e.g., '001', 'L01')")
    academic_term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='course_offerings', db_constraint=False)
    instructor = models.ForeignKey('Instructor', on_delete=models.SET_NULL, null=True, blank=True, related_name='course_offerings', db_constraint=False)

    time_slots = models.ManyToManyField(
        TimeSlot,
        blank=True,
        related_name='course_offerings_allocations',  # ← Different related_name to avoid conflicts
        db_constraint=False,  # ← No foreign key constraints across services
        help_text="Time slots when this course offering meets"
    )

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

    time_slots = models.ManyToManyField(
        TimeSlot,
        blank=True,
        related_name='lab_sections_allocations',  # ← Different related_name to avoid conflicts
        db_constraint=False,  # ← No foreign key constraints across services
        help_text="Time slots when this lab section meets"
    )

    class Meta:
        managed = False
        db_table = 'myapp_sharedsessions'

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term}) - {self.session_type}'

# NEW MODELS FOR ALLOCATIONS SERVICE

class OfferItem(models.Model):
    """Individual items that can be part of an offer"""
    ITEM_TYPE_CHOICES = [
        ('course_offering', 'Course Offering'),
        ('shared_session', 'Lab/Tutorial'),
    ]

    offer_item_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    
    # Foreign keys to different item types
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    
    class Meta:
        managed = True
        db_table = 'myapp_offer_item'
    
    def clean(self):
        # Ensure exactly one item type is selected
        if not ((self.course_offering and not self.shared_session) or 
                (self.shared_session and not self.course_offering)):
            raise ValidationError("Each offer item must be either a course offering or shared session, not both")
    
    @property
    def course(self):
        """Get the course associated with this item"""
        if self.course_offering:
            return self.course_offering.course
        elif self.shared_session:
            return self.shared_session.course
        return None
    
    @property
    def term(self):
        """Get the term associated with this item"""
        if self.course_offering:
            return self.course_offering.academic_term
        elif self.shared_session:
            return self.shared_session.academic_term
        return None
    
    @property
    def course_number(self):
        """Get the course number for display"""
        course = self.course
        return course.course_number if course else None
    
    @property
    def section_number(self):
        """Get the section number"""
        if self.course_offering:
            return self.course_offering.section_number
        elif self.shared_session:
            return self.shared_session.section_number
        return None
    
    @property
    def time_slots(self):
        """Get time slots from the course offering or shared session"""
        try:
            if self.course_offering:
                return self.course_offering.time_slots.all()
            elif self.shared_session:
                return self.shared_session.time_slots.all()
        except AttributeError as e:
            # Fallback if time_slots relationship doesn't exist
            print(f"Warning: time_slots not available for {self}: {e}")
            return []
        return []
    
    @property
    def weekly_hours(self):
        """Calculate weekly hours from time slots"""
        total_hours = 0
        time_slots = self.time_slots  # Use the property
        
        for slot in time_slots:
            try:
                if hasattr(slot, 'duration') and slot.duration:
                    # Convert timedelta to hours
                    hours = slot.duration.total_seconds() / 3600
                    total_hours += hours
            except AttributeError:
                # Fallback: assume 1 hour if duration not available
                total_hours += 1.0
                
        return round(total_hours, 1) if total_hours > 0 else 0.0
    
    @property
    def required_hours_category(self):
        """Get the appropriate hours category based on actual time"""
        weekly_hours = self.weekly_hours
        if weekly_hours <= 3.5:
            return '3'
        elif weekly_hours <= 6.5:
            return '6'
        elif weekly_hours <= 9.5:
            return '9'
        else:
            return '12'
    
    @property
    def time_slot_details(self):
        """Get detailed time slot information"""
        slots = []
        for slot in self.time_slots:
            slots.append({
                'slot_id': str(slot.slot_id),
                'day': slot.get_day_display(),
                'day_code': slot.day,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'duration_hours': slot.duration.total_seconds() / 3600 if slot.duration else 0,
                'time_increments': slot.time_increments if hasattr(slot, 'time_increments') else []
            })
        return slots
    
    def get_time_slot_details(self):
        """Legacy method name for backward compatibility"""
        return self.time_slot_details
    
    def __str__(self):
        weekly_hours = self.weekly_hours
        if self.course_offering:
            return f"Course Offering: {self.course_offering.course.course_number} {self.course_offering.section_number} ({weekly_hours}h/week)"
        elif self.shared_session:
            return f"Shared Session: {self.shared_session.course.course_number} {self.shared_session.section_number} ({weekly_hours}h/week)"
        return f"Offer Item {self.offer_item_id}"

class Offer(models.Model):
    """Enhanced offer model supporting multiple items"""
    STATUS_CHOICES = [
        ('pending', 'Pending Response'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    offer_id = models.AutoField(primary_key=True)
    application = models.ForeignKey('Application', on_delete=models.CASCADE, db_constraint=False)
    
    # Many-to-many relationship for multiple items
    offer_items = models.ManyToManyField(OfferItem, related_name='offers', blank=False)
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    role = models.CharField(max_length=3, choices=[('ta', 'Teaching Assistant')], default='ta')
    
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

    def clean(self):
        """Validation for multiple items"""
        super().clean()
        
        # Must have at least one offer item
        if self.pk and self.offer_items.count() == 0:
            raise ValidationError("Offer must contain at least one item")
    
    @property
    def courses(self):
        """Get all courses associated with this offer"""
        return list(set([item.course for item in self.offer_items.all() if item.course]))
    
    @property
    def terms(self):
        """Get all terms associated with this offer"""
        return list(set([item.term for item in self.offer_items.all() if item.term]))
    
    @property
    def primary_course(self):
        """Get the primary course (first course for display purposes)"""
        courses = self.courses
        return courses[0] if courses else None
    
    @property
    def primary_term(self):
        """Get the primary term (first term for display purposes)"""
        terms = self.terms
        return terms[0] if terms else None
    
    @property
    def total_weekly_hours(self):
        """Calculate total weekly hours from all offer items"""
        total = 0
        for item in self.offer_items.all():
            total += item.weekly_hours
        return round(total, 1)
    
    @property
    def total_required_hours_category(self):
        """Get the appropriate total hours category"""
        total_hours = self.total_weekly_hours
        if total_hours <= 3.5:
            return '3'
        elif total_hours <= 6.5:
            return '6'
        elif total_hours <= 9.5:
            return '9'
        else:
            return '12'
    
    def is_expired(self):
        """Check if offer has expired"""
        expired = self.response_deadline < timezone.now() and self.status == 'pending'
        if expired and self.status == 'pending':
            # Auto-update status when checked
            self.status = 'expired'
            self.save(update_fields=['status', 'updated_at'])
        return expired
    
    def can_respond(self):
        """Check if student can still respond to offer"""
        # This will auto-update expired status
        return self.status == 'pending' and not self.is_expired()
    
    def __str__(self):
        items = self.offer_items.all()
        total_hours = self.total_weekly_hours
        if items:
            item_descriptions = [f"{item.course_number} {item.section_number}" for item in items if item.course_number]
            return f"Offer {self.offer_id} - {self.student.name} for {', '.join(item_descriptions)} ({total_hours}h/week)"
        return f"Offer {self.offer_id} - {self.student.name}"
    

class Assignment(models.Model):
    """Final assignment after offer acceptance"""
    assignment_id = models.AutoField(primary_key=True)
    offer = models.OneToOneField('Offer', on_delete=models.CASCADE, related_name='assignment', null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    
    role = models.CharField(max_length=3, choices=[('ta', 'Teaching Assistant')], default='ta')
    
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
    
    @property
    def time_slots(self):
        """Get time slots from the assigned course offering or shared session"""
        if self.course_offering:
            return self.course_offering.time_slots.all()
        elif self.shared_session:
            return self.shared_session.time_slots.all()
        return []
    
    @property
    def weekly_hours(self):
        """Calculate weekly hours from the time slots of the assigned course/session"""
        total_hours = 0
        for slot in self.time_slots:
            if hasattr(slot, 'duration') and slot.duration:
                hours = slot.duration.total_seconds() / 3600
                total_hours += hours
        return round(total_hours, 1)
    
    @property
    def required_hours_category(self):
        """Get the appropriate hours category based on actual time"""
        weekly_hours = self.weekly_hours
        if weekly_hours <= 3.5:
            return '3'
        elif weekly_hours <= 6.5:
            return '6'
        elif weekly_hours <= 9.5:
            return '9'
        else:
            return '12'
    
    def __str__(self):
        weekly_hours = self.weekly_hours
        return f"Assignment {self.assignment_id} - {self.student.name if self.student else 'Unknown'} ({weekly_hours}h/week)"
