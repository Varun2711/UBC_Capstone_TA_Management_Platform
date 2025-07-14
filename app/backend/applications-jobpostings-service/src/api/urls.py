from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, ApplicationViewSet

router = DefaultRouter()
router.register(r'jobpostings', JobPostingViewSet, basename='jobposting')
router.register(r'applications', ApplicationViewSet, basename='application')


urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('', include(router.urls)),
]