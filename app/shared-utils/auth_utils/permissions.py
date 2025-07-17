import jwt
from django.conf import settings
from rest_framework.permissions import BasePermission

def extract_user_from_token(request):
    """Extract user information from JWT token"""
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None, None
        
        token = auth_header.split(' ')[1]
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        
        return decoded.get('sub'), decoded.get('user_type')
    except Exception:
        return None, None

class IsAdminUser(BasePermission):
    """Custom permission class for DRF views - checks JWT token user_type"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id and user_type == 'admin'

class IsSchedulerUser(BasePermission):
    """Custom permission class for TA schedulers"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id and user_type in ['admin', 'scheduler']

class IsStudentUser(BasePermission):
    """Custom permission class for students"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id and user_type == 'student'

class IsAuthenticatedUser(BasePermission):
    """Custom permission class for authenticated users"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id is not None

class IsInstructorUser(BasePermission):
    """Custom permission class for instructors"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id and user_type == 'instructor'

class IsSchedulerOrAdmin(BasePermission):
    """Custom permission class for schedulers and admins"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id and user_type in ['admin', 'scheduler']

class IsStudentOrOwner(BasePermission):
    """Custom permission class for students accessing their own data"""
    def has_permission(self, request, view):
        user_id, user_type = extract_user_from_token(request)
        return user_id is not None
    
    def has_object_permission(self, request, view, obj):
        user_id, user_type = extract_user_from_token(request)
        
        if user_type in ['admin', 'scheduler']:
            return True
        
        if user_type == 'student':
            # Check if student is accessing their own data
            if hasattr(obj, 'student_number'):
                return obj.student_number == user_id
            elif hasattr(obj, 'student') and hasattr(obj.student, 'student_number'):
                return obj.student.student_number == user_id
        
        return False