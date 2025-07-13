from django.db import models
from django.utils import timezone
import uuid


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
        db_table = 'time_slots'
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

    class Meta:
        managed = False
        db_table = 'myapp_course_offerings'
        ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term})'

class InstructorRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.SET_NULL, null=True, blank=True)
    request_date = models.DateField()
    request_description = models.TextField()
    
    class Meta:
        managed = False
        db_table = 'myapp_instructor_requests'



class TAScheduler(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers')
    password = models.CharField(max_length=255)

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
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, db_constraint=False)
    sin = models.CharField(max_length=11, null=True, blank=True)
    password = models.CharField(max_length=255)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'myapp_student'
    
    def __str__(self):
        return f"{self.name}"

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
        return f"{self.name}"

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
    termSelection = models.ForeignKey('Term', on_delete = models.SET_NULL, null=True, db_constraint=False)      
   
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
        managed = False
        db_table = 'myapp_application'        
        
    def __str__(self):
        return f"Application {self.application_id} - {self.student}  for {self.posting}"
       
    def can_withdraw(self):
        """Check if application can be withdrawn"""
        return self.status in ['submitted', 'under_review']     
    

class Offer(models.Model):
    requiredhours_choices ={
        ('1', '6 hours'),
        ('2', '12 hours') 
    }

    role_choices= {
        ('rta', 'Regular TA'),
        ('tac', 'TA Captain'),
    }

    offer_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, db_constraint=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True)
    required_hours = models.CharField(max_length=2, choices=requiredhours_choices, default='1')
    role = models.CharField(max_length=3, choices=role_choices, default='rta')
    offer_date = models.DateField()
    status = models.CharField(max_length=50)
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='offers_created',db_constraint=False)

class Assignment(models.Model):
    role_choices= {
        ('rta', 'Regular TA'),
        ('tac', 'TA Captain'),
    }
    requiredhours_choices ={
        ('1', '6 hours'),
        ('2', '12 hours'),
    }
    
    assignment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, db_constraint=False)
    offer = models.ForeignKey(Offer, on_delete=models.SET_NULL, null=True, blank=True)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    shared_session = models.ForeignKey(SharedSession, on_delete=models.SET_NULL, null=True, blank=True)
    required_hours = models.CharField(max_length=2, choices=requiredhours_choices, default='1')
    role = models.CharField(max_length=3, choices=role_choices, default='rta')
    assigned_date = models.DateField()
    assigned_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='assignments_made', db_constraint=False )
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(TAScheduler, on_delete=models.CASCADE, related_name='assignments_created', db_constraint=False)

class Shift(models.Model):
    shift_id = models.AutoField(primary_key=True)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    notes = models.TextField(null=True, blank=True)



class Document(models.Model):
    document_id = models.AutoField(primary_key=True)
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_constraint=False)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    file_link = models.TextField()
    uploaded_at = models.DateField()

    class Meta:
        managed = False
        db_table = 'myapp_document'


