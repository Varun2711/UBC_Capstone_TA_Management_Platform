import uuid
from django.db import models
from django.utils import timezone

# Create your models here.

#### MODELS ALREADY CREATED IN OTHER APIs
#### REFERENCED HERE BUT managed = False

# faculty model

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
        managed = True
        db_table = 'academic_terms'  
      

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


class Faculty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        
        managed = False
        db_table = 'myapp_faculty'

# instructor model
class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    email = models.EmailField()

    class Meta:
        managed = False
        db_table = 'myapp_instructor'

# department model
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')

    class Meta:
        managed = False
        db_table = 'myapp_department'

#### MODELS CREATED HERE

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
        managed = True
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

    def __str__(self) -> str:
        return f'{self.course_number} {self.course_name}'


    class Meta:
        managed = True
        db_table = 'courses'


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
        managed = True
        db_table = 'course_offerings'
        ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term})'

# lab sections model
class SharedSession(models.Model):
    """
    A Lab section is similar to a course offering but specifically for lab/tutorial sessions.
    Lab sections are associated with a course and academic term, similar to course offerings.
    """
    shared_session_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    session_type = models.CharField(max_length=10, blank=False, null=False)
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
    instructor = models.ForeignKey(
        Instructor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lab_sections',
        help_text="Instructor or TA teaching this lab section"
    )
    time_slots = models.ManyToManyField(
        TimeSlot,
        blank=True,
        related_name='lab_sections',
        help_text="Time slots when this lab section meets"
    )

    class Meta:
        managed = True
        db_table = 'lab_sections'
        ordering = ['-academic_term__startCalendarYear', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term}) - Lab'
    

## placed after due to referencing errors:
class InstructorRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True, db_constraint=False)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.SET_NULL, null=True, blank=True)
    request_date = models.DateField()
    request_description = models.TextField()

    class Meta:
        managed = True
        db_table = 'instructor_requests'