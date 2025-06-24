from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .response_utils import error_response

def admin_required(view_func):
    """
    Decorator to ensure only admin users can access certain views
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Check if user is authenticated
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse(
                error_response("Authentication required"),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is an admin
        try:
            from api.models import Admin
            # Check if the authenticated user is an admin
            admin = Admin.objects.get(email=request.user.email)
            if not admin.is_active:
                return JsonResponse(
                    error_response("Admin account is deactivated"),
                    status=status.HTTP_403_FORBIDDEN
                )
        except Admin.DoesNotExist:
            return JsonResponse(
                error_response("Admin access required. You do not have permission to perform this action."),
                status=status.HTTP_403_FORBIDDEN
            )
        
        # If all checks pass, execute the original view
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

class IsAdminUser:
    """
    Custom permission class for DRF views
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            from api.models import Admin
            admin = Admin.objects.get(email=request.user.email)
            return admin.is_active
        except Admin.DoesNotExist:
            return False