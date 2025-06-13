from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Simple root view to show service is running
def api_root(request):
    return JsonResponse({
        'status': 'User Profile Service is running',
        'available_endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'students': '/api/students/',
            'instructors': '/api/instructors/',
            'schedulers': '/api/schedulers/'
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),  # Root URL handler
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]