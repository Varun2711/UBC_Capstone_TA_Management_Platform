import uuid
from django.db import models

# Create your models here.

#### MODELS ALREADY CREATED IN OTHER APIs
#### REFERENCED HERE BUT managed = False

# faculty model
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

# Academic terms model
class AcademicTerm(models.Model):
    """
    An academic term is identified by an academic term id.
    An academic term has the term number (1, 2), year, and term (winter, summer)
    """
    TERM_CHOICES = [
        ('winter', 'Winter'),
        ('summer', 'Summer'),
    ]
    
    TERM_NUMBER_CHOICES = [
        ('1', 'Term 1'),
        ('2', 'Term 2'),
    ]

    term_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    year = models.CharField(max_length=4, help_text="Academic year (e.g., 2024)")
    term_number = models.CharField(
        max_length=1, 
        choices=TERM_NUMBER_CHOICES,
        help_text="Term number within the academic year"
    )
    term = models.CharField(
        max_length=7, 
        choices=TERM_CHOICES,
        help_text="Term season"
    )
    start_date = models.DateField(help_text="Term start date")
    end_date = models.DateField(help_text="Term end date")

    class Meta:
        managed = True
        db_table = 'academic_terms'
        ordering = ['-year', 'term_number']
        unique_together = ['year', 'term_number', 'term']

    def __str__(self):
        return f"{self.get_term_display()} {self.year} - Term {self.term_number}"

    def clean(self):
        """Validate that end_date is after start_date."""
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date.")


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
    department = models.CharField(max_length=20)
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
        AcademicTerm,
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
        help_text="Time slots when this course meets"
    )

    class Meta:
        managed = True
        db_table = 'course_offerings'
        ordering = ['-academic_term__year', 'course__course_number', 'section_number']
        unique_together = ['course', 'section_number', 'academic_term']

    def __str__(self):
        return f'{self.course.course_number} {self.section_number} ({self.academic_term})'

# lab sections model
class LabSection(models.Model):
    """
    A Lab section has a course number
    A Lab section has a section and term numbers along with year offered and timeblock
    """
    