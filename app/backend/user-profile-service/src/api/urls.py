from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, InstructorViewSet, TASchedulerViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'instructors', InstructorViewSet)  
router.register(r'schedulers', TASchedulerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]