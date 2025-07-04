from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicTermViewSet,
    CourseViewSet,
    TimeSlotViewSet,
    CourseOfferingViewSet,
    api_root
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'academic-terms', AcademicTermViewSet, basename='academicterm')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'time-slots', TimeSlotViewSet, basename='timeslot')
router.register(r'course-offerings', CourseOfferingViewSet, basename='courseoffering')

urlpatterns = [
    # API root endpoint
    path('', api_root, name='api-root'),
    
    # Include all ViewSet URLs from the router
    path('', include(router.urls)),
]