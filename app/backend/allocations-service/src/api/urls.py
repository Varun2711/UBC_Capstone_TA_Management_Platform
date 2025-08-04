from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    api_root,
    ShortlistedApplicantViewSet,
    OfferViewSet,
    AssignmentViewSet,
    CourseAllocationActionsViewSet,
    SharedSessionAllocationActionsViewSet,
    GlobalAllocationActionsViewSet
)

router = DefaultRouter()
router.register(r'offers', OfferViewSet, basename='offer')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'shortlisted-applicants', ShortlistedApplicantViewSet, basename='shortlisted-applicant')
router.register(r'course-offerings', CourseAllocationActionsViewSet, basename='course-offering-actions')
router.register(r'shared-sessions', SharedSessionAllocationActionsViewSet, basename='shared-session-actions')
router.register(r'allocations-actions', GlobalAllocationActionsViewSet, basename='global-allocation-actions')

urlpatterns = [
    # Root API endpoint
    path('', api_root, name='api-root'),
    
    # Include router URLs
    path('', include(router.urls)),
]