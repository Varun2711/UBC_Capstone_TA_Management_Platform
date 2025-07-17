from django.contrib import admin
from .models import * 


# Register your models here.
admin.site.register(Department) 
admin.site.register(TAScheduler)
admin.site.register(Instructor)
admin.site.register(Student)
admin.site.register(Course) 
admin.site.register(SharedSession)
admin.site.register(CourseOffering)
admin.site.register(TimeSlot)
admin.site.register(InstructorRequest)
admin.site.register(Availability)
admin.site.register(Document)
admin.site.register(JobPostingQuestion)
admin.site.register(JobPosting)
admin.site.register(Application)
admin.site.register(Offer)
admin.site.register(Assignment)
admin.site.register(Shift)
admin.site.register(Term)
admin.site.register(FormQuestion)
admin.site.register(FormTemplate)
admin.site.register(FormSection)
admin.site.register(ApplicationResponse)