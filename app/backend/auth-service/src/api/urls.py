from django.urls import path
from .views import (
    login_view, register_view, logout_view, 
    token_refresh_view, validate_token_view, 
)

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/token/refresh/', token_refresh_view, name='token_refresh'),
    path('auth/validate/', validate_token_view, name='validate_token'),
]