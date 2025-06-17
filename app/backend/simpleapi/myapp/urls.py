from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet

router = DefaultRouter()
router.register(r'jobpostings', JobPostingViewSet, basename='jobposting')
#router.register(r'courses', CourseViewSet, basename='course')
urlpatterns = router.urls
