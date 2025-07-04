from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import BasePermission
from django.http import JsonResponse
import jwt
from django.conf import settings
from .response_utils import error_response

from rest_framework_simplejwt.authentication import JWTAuthentication

def admin_required(view_func):
    """
    Decorator to ensure only admin users can access certain views
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        print("DEBUG: admin_required decorator called")
        
        # Try to authenticate the user if not already authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User not authenticated, trying JWT authentication")
            # Manually authenticate the request
            jwt_auth = JWTAuthentication()
            try:
                auth_result = jwt_auth.authenticate(request)
                if auth_result is None:
                    print("DEBUG: JWT authentication failed: No valid token found")
                    return JsonResponse(
                        error_response("Authentication required"),
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                user, token = auth_result
                request.user = user
                request.auth = token
                print(f"DEBUG: JWT authentication successful, user: {user}")
            except Exception as e:
                print(f"DEBUG: JWT authentication failed: {str(e)}")
                return JsonResponse(
                    error_response("Authentication required"),
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User still not authenticated")
            return JsonResponse(
                error_response("Authentication required"),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is admin
        token_string = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
        decoded = jwt.decode(token_string, settings.SECRET_KEY, algorithms=["HS256"])
        user_type = decoded.get('user_type')
        
        if user_type != 'admin':
            print(f"DEBUG: User type '{user_type}' is not admin")
            return JsonResponse(
                error_response("Admin access required"),
                status=status.HTTP_403_FORBIDDEN
            )
        
        print("DEBUG: Admin access granted")
        # If all checks pass, execute the original view
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

class IsAdminUser(BasePermission):
    """
    Custom permission class for DRF views - checks JWT token user_type
    """
    def has_permission(self, request, view):
        print(f"DEBUG: IsAdminUser - User: {request.user}")
        print(f"DEBUG: IsAdminUser - Is authenticated: {getattr(request.user, 'is_authenticated', False)}")
        print(f"DEBUG: IsAdminUser - Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"DEBUG: IsAdminUser - request.auth: {getattr(request, 'auth', 'No auth attribute')}")
        
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            print("DEBUG: IsAdminUser - User not authenticated")
            return False
        
        # Check JWT token for user_type (SimpleJWT puts decoded token in request.auth)
        if hasattr(request, 'auth') and request.auth:
            user_type = request.auth.get('user_type')
            print(f"DEBUG: IsAdminUser - user_type from token: {user_type}")
            result = user_type == 'admin'
            print(f"DEBUG: IsAdminUser - Permission result: {result}")
            return result
        
        print("DEBUG: IsAdminUser - No auth token found")
        return False

class IsSchedulerUser(BasePermission):
    """
    Custom permission class for DRF views - checks JWT token user_type for scheduler
    """
    def has_permission(self, request, view):
        print(f"DEBUG: IsSchedulerUser - User: {request.user}")
        print(f"DEBUG: IsSchedulerUser - Is authenticated: {getattr(request.user, 'is_authenticated', False)}")
        print(f"DEBUG: IsSchedulerUser - Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"DEBUG: IsSchedulerUser - request.auth: {getattr(request, 'auth', 'No auth attribute')}")
        
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            print("DEBUG: IsSchedulerUser - User not authenticated")
            return False
        
        # Check JWT token for user_type (SimpleJWT puts decoded token in request.auth)
        if hasattr(request, 'auth') and request.auth:
            user_type = request.auth.get('user_type')
            print(f"DEBUG: IsSchedulerUser - user_type from token: {user_type}")
            result = user_type == 'scheduler'
            print(f"DEBUG: IsSchedulerUser - Permission result: {result}")
            return result
        
        print("DEBUG: IsSchedulerUser - No auth token found")
        return False

class IsAdminOrSchedulerUser(BasePermission):
    """
    Permission class that allows access to admin or scheduler users
    """
    def has_permission(self, request, view):
        print(f"DEBUG: IsAdminOrSchedulerUser - User: {request.user}")
        print(f"DEBUG: IsAdminOrSchedulerUser - Is authenticated: {getattr(request.user, 'is_authenticated', False)}")
        
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            print("DEBUG: IsAdminOrSchedulerUser - User not authenticated")
            return False
        
        # Check JWT token for user_type
        if hasattr(request, 'auth') and request.auth:
            user_type = request.auth.get('user_type')
            print(f"DEBUG: IsAdminOrSchedulerUser - user_type from token: {user_type}")
            result = user_type in ['admin', 'scheduler']
            print(f"DEBUG: IsAdminOrSchedulerUser - Permission result: {result}")
            return result
        
        print("DEBUG: IsAdminOrSchedulerUser - No auth token found")
        return False

def scheduler_required(view_func):
    """
    Decorator to ensure only scheduler users can access certain views
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        print("DEBUG: scheduler_required decorator called")
        
        # Try to authenticate the user if not already authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User not authenticated, trying JWT authentication")
            # Manually authenticate the request
            jwt_auth = JWTAuthentication()
            try:
                auth_result = jwt_auth.authenticate(request)
                if auth_result is None:
                    print("DEBUG: JWT authentication failed: No valid token found")
                    return JsonResponse(
                        error_response("Authentication required"),
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                user, token = auth_result
                request.user = user
                request.auth = token
                print(f"DEBUG: JWT authentication successful, user: {user}")
            except Exception as e:
                print(f"DEBUG: JWT authentication failed: {str(e)}")
                return JsonResponse(
                    error_response("Authentication required"),
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User still not authenticated")
            return JsonResponse(
                error_response("Authentication required"),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is scheduler
        token_string = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
        decoded = jwt.decode(token_string, settings.SECRET_KEY, algorithms=["HS256"])
        user_type = decoded.get('user_type')
        
        if user_type != 'scheduler':
            print(f"DEBUG: User type '{user_type}' is not scheduler")
            return JsonResponse(
                error_response("Scheduler access required"),
                status=status.HTTP_403_FORBIDDEN
            )
        
        print("DEBUG: Scheduler access granted")
        # If all checks pass, execute the original view
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def admin_or_scheduler_required(view_func):
    """
    Decorator to ensure only admin or scheduler users can access certain views
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        print("DEBUG: admin_or_scheduler_required decorator called")
        
        # Try to authenticate the user if not already authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User not authenticated, trying JWT authentication")
            # Manually authenticate the request
            jwt_auth = JWTAuthentication()
            try:
                auth_result = jwt_auth.authenticate(request)
                if auth_result is None:
                    print("DEBUG: JWT authentication failed: No valid token found")
                    return JsonResponse(
                        error_response("Authentication required"),
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                user, token = auth_result
                request.user = user
                request.auth = token
                print(f"DEBUG: JWT authentication successful, user: {user}")
            except Exception as e:
                print(f"DEBUG: JWT authentication failed: {str(e)}")
                return JsonResponse(
                    error_response("Authentication required"),
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            print("DEBUG: User still not authenticated")
            return JsonResponse(
                error_response("Authentication required"),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is admin or scheduler
        token_string = request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]
        decoded = jwt.decode(token_string, settings.SECRET_KEY, algorithms=["HS256"])
        user_type = decoded.get('user_type')
        
        if user_type not in ['admin', 'scheduler']:
            print(f"DEBUG: User type '{user_type}' is neither admin nor scheduler")
            return JsonResponse(
                error_response("Admin or Scheduler access required"),
                status=status.HTTP_403_FORBIDDEN
            )
        
        print(f"DEBUG: {user_type.capitalize()} access granted")
        # If all checks pass, execute the original view
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view