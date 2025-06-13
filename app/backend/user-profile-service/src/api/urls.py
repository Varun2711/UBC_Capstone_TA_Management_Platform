from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, InstructorViewSet, TASchedulerViewSet, find_user

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'instructors', InstructorViewSet)  
router.register(r'schedulers', TASchedulerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('find-user/', find_user, name='find-user'),
]