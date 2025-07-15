import jwt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to extract JWT token information and add to request
    This allows all views to access user_id and user_type from request
    """
    def process_request(self, request):
        # Extract JWT token information and add to request
        try:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                
                # DEBUG: Print what's in the token
                print(f"MIDDLEWARE DEBUG - Token payload: {decoded}")
                
                # Try different field names for user_id
                user_id = decoded.get('user_id') or decoded.get('sub') or decoded.get('id')
                user_type = decoded.get('user_type')
                
                print(f"MIDDLEWARE DEBUG - Extracted user_id: {user_id}, user_type: {user_type}")
                
                request.user_id = user_id
                request.user_type = user_type
                request.token_data = decoded
            else:
                request.user_id = None
                request.user_type = None
                request.token_data = None
        except Exception as e:
            print(f"MIDDLEWARE ERROR: {e}")
            request.user_id = None
            request.user_type = None
            request.token_data = None
        
        return None

class CorsMiddleware(MiddlewareMixin):
    """
    Middleware to handle CORS headers for microservices
    """
    def process_response(self, request, response):
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Max-Age'] = '86400'
        
        return response

class LoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log API requests for debugging
    """
    def process_request(self, request):
        print(f"API Request: {request.method} {request.path}")
        print(f"User ID: {getattr(request, 'user_id', 'None')}")
        print(f"User Type: {getattr(request, 'user_type', 'None')}")
        return None

class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers
    """
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response