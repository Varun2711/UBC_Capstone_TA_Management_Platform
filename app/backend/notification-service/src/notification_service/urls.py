# filepath: app/backend/notification-service/src/notification_service/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/notifications/', include('api.urls')),
]