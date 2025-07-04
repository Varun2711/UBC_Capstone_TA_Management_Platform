"""
URL configuration for course_service project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint for the course service"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'course-service',
        'version': '1.0.0',
        'message': 'Course and Academic Term Management Service is running'
    })

@require_http_methods(["GET"])
def service_info(request):
    """Service information and available endpoints"""
    return JsonResponse({
        'service_name': 'Course and Academic Term Management Service',
        'version': '1.0.0',
        'description': 'Manages courses, academic terms, time slots, and course offerings',
        'endpoints': {
            'health': '/health/',
            'admin': '/admin/',
            'api': '/api/course-term-service/',
            'api_docs': '/api/course-term-service/ (GET for endpoint documentation)'
        },
        'features': [
            'Academic term management',
            'Course catalog management', 
            'Time slot scheduling',
            'Course offering management',
            'RESTful API with ViewSets',
            'Query parameter filtering',
            'Custom actions for specialized queries'
        ]
    })

urlpatterns = [
    # Health check endpoint
    path('health/', health_check, name='health-check'),
    
    # Service info endpoint
    path('', service_info, name='service-info'),
    
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Main API endpoints
    path('api/course-term-service/', include('api.urls')),
]
