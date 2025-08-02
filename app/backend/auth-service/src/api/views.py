from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.hashers import check_password
from django.contrib.auth import get_user_model
import jwt
from django.conf import settings
from django.http import JsonResponse
import requests
from django.contrib.auth.hashers import make_password

from .models import Student, Instructor, TAScheduler, Admin
from .serializers import LoginSerializer, TokenSerializer, StudentRegistrationSerializer

# Import shared auth utilities
from auth_utils.decorators import authenticated_required

# Get Django's default User model
User = get_user_model()
 
# Helper function for login
def find_user_by_email(email, password):
    '''
    This function programmatically determines user_type by going through
    each User table in attempt to find the user by email 
    '''
    try:
        student = Student.objects.get(email = email)
        if check_password(password, student.password):
            return student, "student", student.student_number
        else:
            return None, None, None
    except Student.DoesNotExist:
        pass

    try:
        instructor = Instructor.objects.get(email = email)
        if check_password(password, instructor.password):
            return instructor, "instructor", instructor.employee_number
        else:
            return None, None, None
    except Instructor.DoesNotExist:
        pass

    try:
        ta_scheduler = TAScheduler.objects.get(email = email)
        if check_password(password, ta_scheduler.password):
            return ta_scheduler, "scheduler", ta_scheduler.employee_number
        else:
            return None, None, None
    except TAScheduler.DoesNotExist:
        pass

    try:
        admin = Admin.objects.get(email=email)
        if check_password(password, admin.password):
            return admin, "admin", admin.employee_number
        else:
            return None, None, None
    except Admin.DoesNotExist:
        pass

    return None, None, None

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user, user_type, user_id = find_user_by_email(email, password)

        if not user:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
        
        django_user, created = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": user.name, "is_active": True})
        
        refresh = RefreshToken.for_user(django_user)

        # --- FIX: Manually set the 'sub' claim to the correct ID ---
        # The access token will inherit this claim.
        refresh.payload['sub'] = user_id
        # --- END FIX ---

        # Add your other custom claims
        refresh["user_type"] = user_type
        refresh["email"] = email
        refresh["name"] = user.name

        access = refresh.access_token

        response_data = {
            "access": str(access),
            "refresh": str(refresh),
            "user_id": user_id,
            "user_type": user_type,
            "name": user.name
        }
        
        return Response(TokenSerializer(response_data).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = StudentRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """JWT tokens are stateless - client needs to discard the token"""
    return Response({"message": "Successfully logged out"})

@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Refresh an access token using a refresh token"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        refresh = RefreshToken(refresh_token)
        
        # Get user details from the refresh token
        user_id = refresh.get('user_id')
        user_type = refresh.get('user_type')
        email = refresh.get('email')
        name = refresh.get('name')
        
        # Create new access token and add custom claims
        new_access = refresh.access_token
        new_access['user_id'] = user_id
        new_access['user_type'] = user_type
        new_access['email'] = email
        new_access['name'] = name
        
        response_data = {
            'access': str(new_access),
            'refresh': str(refresh),
            'user_id': user_id,
            'user_type': user_type,
            'name': name
        }
        
        return Response(response_data)
    except TokenError:
        return Response({"error": "Invalid or expired refresh token"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_token_view(request):
    """Validate the current token"""
    # Get token from Authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Authorization header missing or invalid", "valid": False}, status=401)
    
    token = auth_header.split(' ')[1]
    
    try:
        # Decode the token manually using the same secret
        decoded = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"]
        )

        # DEBUG: Print what's in the token
        print(f"TOKEN DEBUG - Full payload: {decoded}")

        # Extract user info from token claims - FIX: Use 'sub' instead of 'user_id'
        user_id = decoded.get('sub') or decoded.get('user_id')  # Try 'sub' first, fallback to 'user_id'
        user_type = decoded.get('user_type')
        email = decoded.get('email')
        name = decoded.get('name')
        
        print(f"TOKEN DEBUG - Extracted: user_id={user_id}, user_type={user_type}")
        
        # Check if we have the required user data
        if not user_id or not user_type:
            return Response({
                "error": "Token is missing required user information",
                "valid": False,
                "debug": {
                    "user_id": user_id,
                    "user_type": user_type,
                    "available_claims": list(decoded.keys())
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "valid": True,
            "user_id": user_id,
            "user_type": user_type,
            "email": email,
            "name": name
        })
    except jwt.ExpiredSignatureError:
        return Response({"error": "Token has expired", "valid": False}, status=401)
    except jwt.InvalidTokenError as e:
        return Response({"error": f"Invalid token: {str(e)}", "valid": False}, status=401)
    except Exception as e:
        return Response({"error": f"Token validation failed: {str(e)}", "valid": False}, status=500)

# Reset Password Views
@api_view(['POST'])
@permission_classes([AllowAny])
def lookup_account_view(request):
    email = request.data.get('email')

    # No email address provided, return error
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    user_data = None

    # Look up email address in each table to determine if an account exists
    try:
        student = Student.objects.get(email=email)
        user_data = {
            'user_type': 'student',
            'id_number': student.student_number
        }
    except Student.DoesNotExist:
        pass

    try:
        instructor = Instructor.objects.get(email=email)
        user_data = {
            'user_type': 'instructor',
            'id_number': instructor.employee_number
        }
    except Instructor.DoesNotExist:
        pass

    try:
        scheduler = TAScheduler.objects.get(email=email)
        user_data = {
            'user_type': 'tascheduler',
            'id_number': scheduler.employee_number
        }
    except TAScheduler.DoesNotExist:
        pass

    try:
        admin = Admin.objects.get(email=email)
        user_data = {
            'user_type': 'admin',
            'id_number': admin.employee_number
        }
    except Admin.DoesNotExist:
        pass

    # Found a match: return success response and relevant user info
    if user_data:
        return Response(
            {
                'email': email,
                'user_type': user_data['user_type'],
                'id_number': user_data['id_number']
            }, 
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {
                'error': 'Account not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_complete(request):
    """Complete password reset using token"""
    try:
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        user_id = request.data.get('user_id')
        user_type = request.data.get('user_type')
        email = request.data.get('email')
        curr_password = request.data.get('curr_password') # optional
        
        if not new_password:
            return Response({
                'error': 'New password is required'
            }, status=400)
        
        # Case 1: reset via token (unauthenticated user was emailed a password reset link)
        if token:
            # Verify token with notification service
            notification_response = requests.get(
                f'http://notification-service:8006/api/notifications/verify_reset_token/',
                params={'token': token}
            )
            
            if notification_response.status_code != 200:
                return Response({
                    'error': 'Invalid or expired token'
                }, status=400)
            
            token_data = notification_response.json()
            email = token_data['email']
            user_type = token_data['user_type']
            user_id = token_data['user_id']
        
        # Case 2: reset via session (authenticated user wanting to change password)
        elif user_id and user_type and curr_password:
            # Check that inputted current password matches what's set in DB

            # Reuse the login_view code because it does what i need 
            serializer = LoginSerializer(data={
                "email": email,
                "password": curr_password
            })

            if serializer.is_valid():
                email = serializer.validated_data['email']
                password = serializer.validated_data['password']
                user, user_type, user_id = find_user_by_email(email, password)

                if not user:
                    return Response({'error': 'Incorrect password'}, status=status.HTTP_401_UNAUTHORIZED)

                # if no error, password was correct
        else:        
            return Response({'error': 'Must provide either a token or a user_id and user_type'}, status=400)

        # Hash the new password
        hashed_password = make_password(new_password)
        
        # Update password based on user type
        if user_type == 'student':
            try:
                student = Student.objects.get(student_number=user_id)
                student.password = hashed_password
                student.save()
                django_user = User.objects.get(username=email)
                django_user.set_password(new_password)  # Use set_password for proper hashing
                django_user.save()
            except Student.DoesNotExist:
                return Response({'error': 'Student not found'}, status=404)
                
        elif user_type == 'instructor':
            try:
                instructor = Instructor.objects.get(employee_number=user_id)
                instructor.password = hashed_password
                instructor.save()
            except Instructor.DoesNotExist:
                return Response({'error': 'Instructor not found'}, status=404)
                
        elif user_type == 'scheduler':
            try:
                scheduler = TAScheduler.objects.get(employee_number=user_id)
                scheduler.password = hashed_password
                scheduler.save()
            except TAScheduler.DoesNotExist:
                return Response({'error': 'Scheduler not found'}, status=404)
                
        elif user_type == 'admin':
            try:
                admin = Admin.objects.get(employee_number=user_id)
                admin.password = hashed_password
                admin.save()
            except Admin.DoesNotExist:
                return Response({'error': 'Admin not found'}, status=404)
        
        # if token-based reset, mark token as used
        if token:
            requests.post(
                f'http://notification-service:8006/api/notifications/mark_token_used/',
                json={'token': token}
            )
        
        return Response({
            'message': 'Password reset successfully',
            'user_type': user_type,
            'email': email
        })
        
    except Exception as e:
        return Response({
            'error': f'Password reset failed: {str(e)}'
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """Service status and available endpoints"""
    return JsonResponse({
        'status': 'Auth Service is running',
        'available_endpoints': {
            'login': '/api/auth/login/',
            'register': '/api/auth/register/',
            'validate': '/api/auth/validate/',
            'token_refresh': '/api/auth/token/refresh/',
            'logout': '/api/auth/logout/',
            'lookup_account': '/api/auth/reset-password/lookup/',
            'reset_password_complete': '/api/auth/reset-password-complete/',
        }
    })