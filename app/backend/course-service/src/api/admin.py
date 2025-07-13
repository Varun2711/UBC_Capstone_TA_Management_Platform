from django.contrib import admin
from .models import (
    Department, Term, Instructor, TimeSlot, Course, 
    CourseOffering, SharedSession, InstructorRequest
)

# Register your models here.
admin.site.register(Department)
admin.site.register(Term)
admin.site.register(Instructor)
admin.site.register(TimeSlot)
admin.site.register(Course)
admin.site.register(CourseOffering)
admin.site.register(SharedSession)
admin.site.register(InstructorRequest)