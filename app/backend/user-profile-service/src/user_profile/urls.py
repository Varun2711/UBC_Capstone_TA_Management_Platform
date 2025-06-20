from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from api.views import api_root

urlpatterns = [
    path('', api_root, name='api-root'),  # Root URL handler
    path('api/', include('api.urls')),
]