from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'terms', views.TermViewSet)

urlpatterns = [
    # API Root
    path('', views.api_root, name='api-root'),
    
    # Include all router URLs
    path('', include(router.urls)),
]