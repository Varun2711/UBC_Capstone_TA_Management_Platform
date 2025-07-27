from django.contrib import admin
from .models import * 

# Register your models here.
admin.site.register(TAScheduler)
admin.site.register(Student)
admin.site.register(Application)
admin.site.register(ApplicationShortList)
admin.site.register(JobPosting)
admin.site.register(Department)
admin.site.register(Term)
admin.site.register(Course)
admin.site.register(CourseOffering)
admin.site.register(SharedSession)
admin.site.register(Offer)
admin.site.register(Assignment)
admin.site.register(OfferItem)
admin.site.register(AssignmentModification)