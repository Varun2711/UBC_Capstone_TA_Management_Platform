from django.contrib import admin
from .models import * 


# Register your models here.
admin.site.register(Faculty)
admin.site.register(Department) 
admin.site.register(TAScheduler)
admin.site.register(Instructor)
admin.site.register(Student)
admin.site.register(Course) 
admin.site.register(LabSection)
admin.site.register(CourseOffering)
admin.site.register(JobPosting)

