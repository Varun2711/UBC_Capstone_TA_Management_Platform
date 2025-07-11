from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'terms', views.TermViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'course-offerings', views.CourseOfferingViewSet)
router.register(r'shared-sessions', views.SharedSessionViewSet)

urlpatterns = [
    # API Root
    path('', views.api_root, name='api-root'),
    
    # Include all router URLs
    path('', include(router.urls)),
]