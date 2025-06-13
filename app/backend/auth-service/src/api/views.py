from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.hashers import check_password

from .models import Student, Instructor, TAScheduler
from .serializers import LoginSerializer, TokenSerializer, StudentRegistrationSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user_type = serializer.validated_data['user_type']
        
        user = None
        user_id = None
        
        # Try to authenticate based on user_type
        if user_type == 'student':
            try:
                user = Student.objects.get(email=email)
                if not check_password(password, user.password):
                    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
                user_id = user.student_number
            except Student.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
                
        elif user_type == 'instructor':
            try:
                user = Instructor.objects.get(email=email)
                # Note: In a real app, instructors would also have passwords
                # This is simplified for the example
                user_id = user.employee_number
            except Instructor.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
                
        elif user_type == 'scheduler':
            try:
                user = TAScheduler.objects.get(email=email)
                user_id = user.employee_number
            except TAScheduler.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate token with user info embedded
        refresh = RefreshToken()
        refresh['user_id'] = user_id
        refresh['user_type'] = user_type
        refresh['email'] = email
        refresh['name'] = user.name
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user_id,
            'user_type': user_type,
            'name': user.name
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
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user_id,
            'user_type': user_type,
            'name': name
        }
        
        return Response(response_data)
    except TokenError:
        return Response({"error": "Invalid or expired refresh token"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token_view(request):
    """Validate the current token - if request reaches here, token is valid"""
    # Get the token payload
    token = request.auth
    
    try:
        # Extract user info from token claims
        user_id = token.payload.get('user_id', '')
        user_type = token.payload.get('user_type', '')
        email = token.payload.get('email', '')
        name = token.payload.get('name', '')
        
        return Response({
            "valid": True,
            "user_id": user_id,
            "user_type": user_type,
            "email": email,
            "name": name
        })
    except (AttributeError, KeyError):
        # Print debugging info
        print(f"Token validation failed. Token: {token}")
        print(f"Token type: {type(token)}")
        if hasattr(token, 'payload'):
            print(f"Token payload: {token.payload}")
        
        # Try accessing token directly
        return Response({
            "valid": True,
            "message": "Token is valid but user data could not be extracted",
            "token_data": str(token)
        })
    
