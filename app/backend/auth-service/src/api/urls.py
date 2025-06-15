from django.urls import path

from .views import (
    login_view, register_view, logout_view, 
    token_refresh_view, validate_token_view, api_root
)

urlpatterns = [
    path('login/', login_view, name='login'),                   
    path('register/', register_view, name='register'),           
    path('logout/', logout_view, name='logout'),                 
    path('token/refresh/', token_refresh_view, name='token_refresh'),
    path('validate/', validate_token_view, name='validate_token'),
]