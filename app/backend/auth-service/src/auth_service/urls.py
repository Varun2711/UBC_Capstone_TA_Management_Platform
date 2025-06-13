from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Simple root view to show service is running
def api_root(request):
    return JsonResponse({
        'status': 'Auth Service is running',
        'available_endpoints': {
            'login': '/api/auth/login/',
            'register': '/api/auth/register/',
            'validate': '/api/auth/validate/',
            'token_refresh': '/api/auth/token/refresh/',
            'logout': '/api/auth/logout/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('api.urls')),
]