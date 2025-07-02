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

from .models import Student, Instructor, TAScheduler, Admin
from .serializers import LoginSerializer, TokenSerializer, StudentRegistrationSerializer

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

    # NEW - Check Admin
    try:
        admin = Admin.objects.get(email=email)
        if check_password(password, admin.password):
            return admin, "admin", admin.employee_number
        else:
            return None, None, None
    except Admin.DoesNotExist:
        pass


    return None, None, None # if not found in student, instructor, or ta scheduler, user does not exist
        

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
        
        # Create django user
        django_user, created = User.objects.get_or_create(username = email, defaults={"email":email, "first_name": user.name, "is_active": True})
        
        # Generate refresh token
        refresh = RefreshToken.for_user(django_user)

        #refresh["user_id"] = user_id
        refresh["user_type"] = user_type
        refresh["email"] = email
        refresh["name"] = user.name

        # Add custom ID as separate field based on user type, this logic is required.
        if user_type == 'admin':
            refresh["admin_id"] = user_id
        elif user_type == 'student':
            refresh["student_id"] = user_id
        elif user_type == 'instructor':
            refresh["instructor_id"] = user_id
        elif user_type == 'scheduler':
            refresh["scheduler_id"] = user_id

        # Generate access token
        access = refresh.access_token

        #access["user_id"] = user_id
        access["user_type"] = user_type
        access["email"] = email
        access["name"] = user.name

        # Add custom ID as separate field, this logic is required.
        if user_type == 'admin':
            access["admin_id"] = user_id
        elif user_type == 'student':
            access["student_id"] = user_id
        elif user_type == 'instructor':
            access["instructor_id"] = user_id
        elif user_type == 'scheduler':
            access["scheduler_id"] = user_id

        response_data = {"access": str(access),
                         "refresh": str(refresh),
                         "user_id": user_id,
                         "user_type": user_type,
                         "name": user.name}
        
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

        # Extract user info from token claims
        user_id = decoded.get('user_id')
        user_type = decoded.get('user_type')
        email = decoded.get('email')
        name = decoded.get('name')
        
        # Check if we have the required user data
        if not user_id or not user_type:
            return Response({
                "error": "Token is missing required user information",
                "valid": False
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
        }
    })