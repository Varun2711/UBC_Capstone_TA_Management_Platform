import uuid
from django.db import models
from django.contrib.auth.models import User
# all models related to user profiles, including students, instructors, and TA schedulers

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = True
        db_table = 'myapp_department'

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
        managed = True
        db_table = 'myapp_student'

class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='instructors')
    email = models.EmailField()
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'myapp_instructor'

class TAScheduler(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers')
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'myapp_tascheduler'

#added admin based on new requirements.
class Admin(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        db_table = 'myapp_admin'

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
        managed = True
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
        managed = True
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
        managed = True
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
        managed = True
        db_table = 'profiles_studentavailability'

class StudentCoursePreference(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_preferences')
    course_code = models.CharField(max_length=20)
    preference_rank = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        unique_together = ['user', 'course_code']
        ordering = ['preference_rank']
        db_table = 'profiles_studentcoursepreference'