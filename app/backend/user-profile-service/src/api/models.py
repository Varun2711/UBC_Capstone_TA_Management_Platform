# These are just references to the existing database tables

from django.db import models

# User profile related models from your existing database
# We're not creating new tables, just defining the structure to match the existing ones

class Faculty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        
        managed = True
        db_table = 'myapp_faculty'

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')

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

    class Meta:
        managed = True
        db_table = 'myapp_student'

class Instructor(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    email = models.EmailField()

    class Meta:
        managed = True
        db_table = 'myapp_instructor'

class TAScheduler(models.Model):
    employee_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='ta_schedulers')

    class Meta:
        managed = True
        db_table = 'myapp_tascheduler'