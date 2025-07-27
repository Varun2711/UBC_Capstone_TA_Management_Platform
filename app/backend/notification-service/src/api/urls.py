from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.EmailNotificationViewSet)
router.register(r'logs', views.NotificationLogViewSet)

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('stats/', views.notification_stats, name='notification-stats'),
] + router.urls