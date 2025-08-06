from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'terms', views.TermViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'course-offerings', views.CourseOfferingViewSet)
router.register(r'shared-sessions', views.SharedSessionViewSet)
router.register(r'instructor-requests', views.InstructorRequestViewSet)

urlpatterns = [
    # API Root
    path('', views.api_root, name='api-root'),
    
    # Debug endpoint
    path('debug-auth/', views.debug_auth, name='debug-auth'),
    
    # Bulk import endpoint
    path('bulk-import/', views.bulk_import, name='bulk-import'),
    
    # Sample CSV download endpoint
    path('sample-csv/', views.download_sample_csv, name='sample-csv'),
    
    # Include all router URLs
    path('', include(router.urls)),
]