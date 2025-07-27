from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OfferViewSet, AssignmentViewSet, ShortlistedApplicantViewSet, api_root, CourseAllocationActionsViewSet, SharedSessionAllocationActionsViewSet

router = DefaultRouter()
router.register(r'offers', OfferViewSet, basename='offer')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'shortlisted-applicants', ShortlistedApplicantViewSet, basename='shortlisted-applicant')
router.register(r'course-offerings', CourseAllocationActionsViewSet, basename='course-offering-actions')
router.register(r'shared-sessions', SharedSessionAllocationActionsViewSet, basename='shared-session-actions')

urlpatterns = [
    # Root API endpoint
    path('', api_root, name='api-root'),
    
    # Include router URLs
    path('', include(router.urls)),
]