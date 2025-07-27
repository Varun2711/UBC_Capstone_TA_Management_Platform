from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(EmailNotification)
admin.site.register(NotificationLog)
admin.site.register(PasswordResetToken)