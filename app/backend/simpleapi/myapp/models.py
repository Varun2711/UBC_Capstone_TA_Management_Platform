from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
import uuid
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import User


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

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = False
        db_table = 'myapp_department'
    
    def __str__(self):
        return f"{self.name}"

    def __str__(self):
        return self.name

class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, db_constraint=False)
    email = models.EmailField()
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_instructor'
    
    def __str__(self):
        return f"{self.name}"

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

# Courses model
class Course(models.Model):
    """
    A course is identified by a course number
    A course has a department and a course description
    """
    course_number = models.CharField(max_length=9, unique=True)
    course_name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    course_description = models.TextField(max_length=500, blank=True, null=True)
    course_level = models.CharField(max_length=4, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f'{self.course_number} {self.course_name}'


    class Meta:
        managed = False
        db_table = 'myapp_courses'


# Course offerings model
# A Course may have multiple course offerings
class CourseOffering(models.Model):
    """
    A Course offering is related to a course.
    A course offering has a course offering id, section number, and is linked to an academic term.
    A course offering is taught by an instructor and has time slots.
    """
    course_offering_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE,
        related_name='offerings',
        help_text="The course this offering is for"
    ) 
    section_number = models.CharField(
        max_length=3, 
        help_text="Section number (e.g., '001', 'L01')"
    )
    academic_term = models.ForeignKey(
        Term,
        on_delete=models.CASCADE,
        related_name='course_offerings',
        help_text="Academic term when this course is offered"
    )
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_offerings',
        help_text="Instructor teaching this course offering"
    )

    time_slots = models.ManyToManyField(
        TimeSlot,
        blank=True,
        related_name='course_offerings',
        help_text="Time slots when this course offering meets"
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_course_offerings'
        ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term})'

## placed after due to referencing errors:
class InstructorRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.SET_NULL, null=True, blank=True)
    request_date = models.DateField()
    request_description = ArrayField(models.CharField(max_length=200), default=list)

    class Meta:
        managed = False
        db_table = 'myapp_instructor_requests'



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
    
    def __str__(self):
        return f"{self.name}"

class StudentProfile(models.Model):
    """ Extended profile for students """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    year_degree_start = models.IntegerField(null=True, blank=True)
    minor = models.CharField(max_length=100, null=True, blank=True)
    ubc_employee_id = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'profiles_studentprofile'
        
class StudentExperience(models.Model):
    EXPERIENCE_TYPES = [
        ('teaching', 'Teaching Assistant'),
        ('work', 'Work Experience'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    experience_type = models.CharField(max_length=20, choices=EXPERIENCE_TYPES)
    position_title = models.CharField(max_length=100)
    organization = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = False
        ordering = ['-start_date']
        db_table = 'profiles_studentexperience'
        
class StudentSkill(models.Model):
    SKILL_TYPES = [
        ('technical', 'Technical'),
        ('soft', 'Soft Skills'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill_type = models.CharField(max_length=20, choices=SKILL_TYPES)
    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        unique_together = ['user', 'name']
        ordering = ['skill_type', 'name']
        db_table = 'profiles_studentskill'
        
class StudentAvailability(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='availability')
    availability_grid = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'profiles_studentavailability'
        
class StudentCoursePreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_preferences')
    course_code = models.CharField(max_length=20)
    preference_rank = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = False
        unique_together = ['user', 'course_code']
        ordering = ['preference_rank']
        db_table = 'profiles_studentcoursepreference'

#added admin based on new requirements.
class Admin(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_admin'

    def __str__(self):
        return f"{self.name}"

# lab sections model
class SharedSession(models.Model):
    """
    A Lab section is similar to a course offering but specifically for lab/tutorial sessions.
    Lab sections are associated with a course and academic term, similar to course offerings.
    """

    SESSION_TYPE_CHOICES = [
        ('lab', 'Lab'),
        ('tutorial', 'Tutorial'),
        ('seminar', 'Seminar'),
        ('workshop', 'Workshop'),
    ]

    shared_session_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    session_type = models.CharField(
        max_length=10, 
        choices=SESSION_TYPE_CHOICES,
        help_text="Type of shared session"
    )
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE,
        related_name='lab_sections',
        help_text="The course this lab section is for"
    ) 
    section_number = models.CharField(
        max_length=3, 
        help_text="Lab section number (e.g., 'L01', 'T01')"
    )
    academic_term = models.ForeignKey(
        Term,
        on_delete=models.CASCADE,
        related_name='lab_sections',
        help_text="Academic term when this lab section is offered"
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shared_sessions',
        help_text="Student assigned as TA for this shared session"
    )
    time_slots = models.ManyToManyField(
        TimeSlot,
        blank=True,
        related_name='lab_sections',
        help_text="Time slots when this lab section meets"
    )

    is_active = models.BooleanField(default=True)
    
    class Meta:
        managed = False
        db_table = 'myapp_sharedsessions'
        ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term}) - {self.session_type}'

class Availability(models.Model):
    availability_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    day_of_week = models.CharField(max_length=10)
    start_time = models.TimeField()
    end_time = models.TimeField()
    term_number = models.CharField(max_length=20)

    class Meta: 
        managed = False
        db_table = 'myapp_availability'        


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
        managed = False
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
    is_editable = models.BooleanField(default=True)
    
    class Meta:
        managed = False
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
    help_text = models.TextField(null=True, blank=True)
    validation_rules = models.JSONField(null=True, blank=True)  # Store validation rules
    options = models.JSONField(null=True, blank=True)  # For select/radio options
    is_editable = models.BooleanField(default=True)
    
    class Meta:
        managed = False
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
        managed = False
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
        managed = False
        db_table = 'myapp_jobpostingquestion'

    def __str__(self):
        return f"Question for {self.posting.title}: {self.question_text}"


class Application(models.Model):        
    application_id = models.AutoField(primary_key=True)
    student = models.ForeignKey('Student', on_delete=models.SET_NULL, null=True, db_constraint=False)
    posting = models.ForeignKey('JobPosting', on_delete=models.SET_NULL, null=True, db_constraint=False)
    status = models.CharField(max_length=20, choices=[ 
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),        
        ('accepted', 'Accepted'),
        ('rejected', 'No Longer In Consideration'),
        ('withdrawn', 'Withdrawn'),
        ('archived', 'Archived'), ], default='draft')
    
    # Timestamps
    applied_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
        
    # Selections (from Selections.jsx)
    positionType = models.CharField(max_length=100, blank=True, null=True)

    #Term Selection
    termSelection = models.ForeignKey('Term', on_delete = models.SET_NULL, null=True, db_constraint=False)      
   
    workload = models.CharField(max_length=20,
     blank=True, null=True)
    
    # Discipline Rankings 
    disciplineRankings = models.JSONField() 
    
    citizenshipStatus = models.CharField(max_length=50,
     blank=True, null=True)
    
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
    

 # Here we're storing dynamic application responses
class ApplicationResponse(models.Model):
    """Store responses to dynamic form questions"""
    response_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(FormQuestion, on_delete=models.CASCADE)
    response_data = models.JSONField()  # Store the actual response
    
    class Meta:
        managed = False
        db_table = 'myapp_applicationresponse'
        unique_together = ('application', 'question')
    
    def __str__(self):
        return f"Response to {self.question.question_text[:30]} for {self.application}"   

class ApplicationShortList(models.Model):    
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='shortlists')    
    created_by = models.ForeignKey(TAScheduler, on_delete=models.SET_NULL, null=True, db_constraint=False)
    created_at = models.DateTimeField(default=timezone.now)  # Track when shortlisted
    notes = models.TextField(null=True, blank=True)  # Optional notes about why shortlisted
    
    class Meta:
        managed = False
        db_table = 'myapp_applicationshortlist'
        # Prevent duplicate shortlists by same scheduler for same application
        unique_together = ('application', 'created_by')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Shortlisted: {self.application} by {self.created_by}"


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
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False, help_text="Specific time slot for this offer item")
    
    class Meta:
        managed = False
        db_table = 'myapp_offer_item'

class Offer(models.Model):
    """Enhanced offer model supporting multiple items"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Response'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'), 
    ]
    
    offer_id = models.AutoField(primary_key=True)
    application = models.ForeignKey('Application', on_delete=models.CASCADE, db_constraint=False)
    
    # Many-to-many relationship for multiple items
    offer_items = models.ManyToManyField(OfferItem, related_name='offers', blank=False)
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    role = models.CharField(max_length=3, choices=[('ta', 'Teaching Assistant')], default='ta')
    
    # Offer lifecycle
    offer_date = models.DateTimeField(null=True, blank=True) # <-- Make nullable, set when sent
    response_deadline = models.DateTimeField(null=True, blank=True, help_text="Deadline for student to respond") # <-- Make nullable
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft') # <-- CHANGE DEFAULT
    
    # Response tracking
    responded_at = models.DateTimeField(null=True, blank=True)
    student_response = models.TextField(null=True, blank=True, help_text="Student's response message")

    reminder_sent = models.BooleanField(default=False)
    
    # Administrative
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='offers_created', db_constraint=False)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = False
        db_table = 'myapp_offer'
        ordering = ['-created_at']

class Assignment(models.Model):
    """Final assignment after offer acceptance"""
    assignment_id = models.AutoField(primary_key=True)
    offer = models.OneToOneField('Offer', on_delete=models.CASCADE, related_name='assignment', null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, null=True, blank=True, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False, help_text="Specific time slot assigned within the course offering or shared session")
    
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
        managed = False
        db_table = 'myapp_assignment'
        ordering = ['-assigned_date']

class AssignmentModification(models.Model):
    """Track assignment modifications that need student response"""
    MODIFICATION_STATUS = [
        ('pending', 'Pending Student Response'),
        ('accepted', 'Student Accepted'),
        ('rejected', 'Student Rejected')
    ]
    
    modification_id = models.AutoField(primary_key=True)
    original_assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='modifications')
    new_offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='assignment_modifications')
    
    # Modification details
    reason = models.TextField(help_text="Scheduler's reason for the change")
    modification_type = models.CharField(max_length=20, choices=[
        ('time_change', 'Time/Schedule Change'),
        ('section_change', 'Section Change'), 
        ('course_change', 'Course Change'),
        ('hours_change', 'Hours Change'),
        ('other', 'Other')
    ], default='other')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=MODIFICATION_STATUS, default='pending')
    requires_response = models.BooleanField(default=True)
    
    # Timestamps
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    student_responded_at = models.DateTimeField(null=True, blank=True)
    student_response = models.TextField(null=True, blank=True)
    
    class Meta:
        managed = False
        db_table = 'myapp_assignment_modification'
        ordering = ['-created_at']

class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE,null=True, blank=True, db_constraint=False)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    file = models.FileField(upload_to='applications/%Y/%m/') 
    uploaded_at = models.DateField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'myapp_document'


