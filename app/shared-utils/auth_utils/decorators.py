from functools import wraps
from django.http import JsonResponse
from rest_framework import status
from .permissions import extract_user_from_token

def admin_required(view_func):
    """Decorator to ensure only admin users can access certain views"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id or user_type != 'admin':
            return JsonResponse(
                {"success": False, "message": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Add user info to request for use in view
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def student_required(view_func):
    """Decorator to ensure only students can access certain views"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id or user_type != 'student':
            return JsonResponse(
                {"success": False, "message": "Student access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def instructor_required(view_func):
    """Decorator to ensure only instructors can access certain views"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id or user_type != 'instructor':
            return JsonResponse(
                {"success": False, "message": "Instructor access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def scheduler_required(view_func):
    """Decorator to ensure only schedulers or admins can access certain views"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id or user_type not in ['scheduler', 'admin']:
            return JsonResponse(
                {"success": False, "message": "Scheduler access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def authenticated_required(view_func):
    """Decorator to ensure user is authenticated"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id:
            return JsonResponse(
                {"success": False, "message": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def scheduler_or_admin_required(view_func):
    """Decorator to ensure only schedulers or admins can access certain views"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id or user_type not in ['admin', 'scheduler']:
            return JsonResponse(
                {"success": False, "message": "Admin or Scheduler access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view

def student_or_owner_required(view_func):
    """Decorator to ensure students can only access their own data"""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user_id, user_type = extract_user_from_token(request)
        
        if not user_id:
            return JsonResponse(
                {"success": False, "message": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Admin and schedulers can access any data
        if user_type in ['admin', 'scheduler']:
            request.user_id = user_id
            request.user_type = user_type
            return view_func(request, *args, **kwargs)
        
        # Students can only access their own data
        if user_type == 'student':
            student_id = kwargs.get('student_id') or kwargs.get('pk')
            if student_id and str(student_id) != str(user_id):
                return JsonResponse(
                    {"success": False, "message": "Access denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        request.user_id = user_id
        request.user_type = user_type
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view