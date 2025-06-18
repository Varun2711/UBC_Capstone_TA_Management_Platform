from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, InstructorViewSet, TASchedulerViewSet, find_user, api_root

router = DefaultRouter()
router.include_root_view = False
router.register(r'students', StudentViewSet)
router.register(r'instructors', InstructorViewSet)  
router.register(r'schedulers', TASchedulerViewSet)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('', include(router.urls)),
    path('find-user/', find_user, name='find-user'),
]