from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Simple root view to show service is running
def api_root(request):
    return JsonResponse({
        'status': 'Auth Service is running',
        'available_endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'login': '/api/auth/login/',
            'register': '/api/auth/register/',
            'token_refresh': '/api/auth/token/refresh/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]