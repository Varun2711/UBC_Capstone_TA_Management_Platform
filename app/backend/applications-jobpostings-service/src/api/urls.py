from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import  ( JobPostingViewSet, ApplicationViewSet, FormTemplateViewSet, FormSectionViewSet, 
FormQuestionViewSet, ApplicationResponseViewSet, ApplicationShortListViewSet, DocumentViewSet, secure_document_download, debug_host_view)

router = DefaultRouter()
router.register(r'jobpostings', JobPostingViewSet, basename='jobposting')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'form-templates', FormTemplateViewSet, basename='formtemplate')
router.register(r'form-sections', FormSectionViewSet, basename='formsection')
router.register(r'form-questions', FormQuestionViewSet, basename='formquestion')
router.register(r'application-responses', ApplicationResponseViewSet, basename='applicationresponse')
router.register(r'application-shortlists', ApplicationShortListViewSet, basename='applicationshortlist')  
router.register(r'documents', DocumentViewSet, basename='documents')


urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('', include(router.urls)),
    path("download", secure_document_download, name="secure_document_download"),
    path("debug/host", debug_host_view)
]