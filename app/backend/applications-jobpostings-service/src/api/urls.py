from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import JobPostingViewSet, ApplicationViewSet, FormTemplateViewSet, FormSectionViewSet, FormQuestionViewSet, ApplicationResponseViewSet

router = DefaultRouter()
router.register(r'jobpostings', JobPostingViewSet, basename='jobposting')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'form-templates', FormTemplateViewSet, basename='formtemplate')
router.register(r'form-sections', FormSectionViewSet, basename='formsection')
router.register(r'form-questions', FormQuestionViewSet, basename='formquestion')
router.register(r'application-responses', ApplicationResponseViewSet, basename='applicationresponse')
urlpatterns = router.urls
