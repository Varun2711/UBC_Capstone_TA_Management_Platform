from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student, Faculty, Department, StudentProfile, StudentExperience, StudentSkill, StudentCoursePreference, Instructor, TAScheduler, Admin

class UserProfileAPITest(APITestCase):
    def setUp(self):
        # Create basic test data
        self.faculty, _ = Faculty.objects.get_or_create(name="Computer Science")
        self.department, _ = Department.objects.get_or_create(name="Computer Science", faculty=self.faculty)
        
        self.user = User.objects.create_user(
            username='testuser',
            email='test@student.ubc.ca',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.student = Student.objects.create(
            student_number='12345678',
            name='Test User',
            email='test@student.ubc.ca',
            program='Computer Science',
            year_standing=3,
            study_level='Undergraduate',
            department=self.department,
            password='hashed_password',
            is_active=True
        )

    def _get_student_token(self):
        """Helper method to create student JWT token with proper claims"""
        refresh = RefreshToken.for_user(self.user)
        refresh['user_type'] = 'student'
        #refresh['user_id'] = str(self.user.id)  # Use Django User ID, not student number
        refresh['student_id'] = '12345678'      # Add student number as separate field
        refresh['email'] = 'test@student.ubc.ca'
        refresh['name'] = 'Test User'
        
        access_token = refresh.access_token
        access_token['user_type'] = 'student'
        #access_token['user_id'] = str(self.user.id)  # Use Django User ID
        access_token['student_id'] = '12345678'      # Add student number as separate field
        access_token['email'] = 'test@student.ubc.ca'
        access_token['name'] = 'Test User'
        
        return str(access_token)

    def test_api_root_accessible(self):
        """Test that API root endpoint is accessible"""
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_find_user_by_email(self):
        """Test finding user by email"""
        response = self.client.get('/api/find-user/', {'email': 'test@student.ubc.ca'})  # Changed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthorized_access_to_protected_endpoint(self):
        """Test accessing protected endpoints without authentication"""
        response = self.client.get('/api/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_profile_with_auth(self):
        """Test retrieving student profile with authentication"""
        token = self._get_student_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get('/api/me/')  # Changed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_student_experience(self):
        """Test creating student experience"""
        token = self._get_student_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'experience_type': 'teaching',
            'position_title': 'Teaching Assistant',
            'organization': 'UBC Computer Science',
            'start_date': '2024-01-01',
            'end_date': '2024-04-30',
            'description': 'Assisted in COSC 110 course'
        }
        response = self.client.post('/api/me/experiences/', data, format='json')  # Changed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_student_skill(self):
        """Test creating student skill"""
        token = self._get_student_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'skill_type': 'technical',
            'name': 'Python'
        }
        response = self.client.post('/api/me/skills/', data, format='json')  # Changed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_course_preference_limit(self):
        """Test 10-item limit for course preferences"""
        token = self._get_student_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create 10 preferences (should work)
        for i in range(10):
            data = {
                'course_code': f'COSC {100 + i}',
                'preference_rank': i + 1
            }
            response = self.client.post('/api/me/preferences/', data, format='json')  # Changed
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Try to create 11th preference (should fail)
        data = {
            'course_code': 'COSC 111',
            'preference_rank': 11
        }
        response = self.client.post('/api/me/preferences/', data, format='json')  # Changed
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminAPITest(APITestCase):
    def setUp(self):
        # Create test faculty and department
        self.faculty, _ = Faculty.objects.get_or_create(name="Computer Science")
        self.department, _ = Department.objects.get_or_create(name="Computer Science", faculty=self.faculty)
        
        # Create Admin model in database
        self.admin_model = Admin.objects.create(
            employee_number='ADM001',
            name='Admin User',
            email='admin@ubc.ca',
            password='hashed_password',
            is_active=True
        )
        
        # Create Django User for JWT token generation
        self.admin_user = User.objects.create_user(
            username='admin@ubc.ca',
            email='admin@ubc.ca',
            password='adminpass123'
        )

    def _get_admin_token(self):
        """Helper method to create admin JWT token with user_type claim"""
        refresh = RefreshToken.for_user(self.admin_user)
        refresh['user_type'] = 'admin'
        refresh['user_id'] = str(self.admin_user.id)  # Use Django User ID, not employee number
        refresh['admin_id'] = 'ADM001'                # Add employee number as separate field
        refresh['email'] = 'admin@ubc.ca'
        refresh['name'] = 'Admin User'
        
        access_token = refresh.access_token
        access_token['user_type'] = 'admin'
        access_token['user_id'] = str(self.admin_user.id)  # Use Django User ID
        access_token['admin_id'] = 'ADM001'                # Add employee number as separate field
        access_token['email'] = 'admin@ubc.ca'
        access_token['name'] = 'Admin User'
        
        return str(access_token)

    def _get_regular_user_token(self):
        """Helper method to create regular user JWT token"""
        regular_user = User.objects.create_user(
            username='regular@ubc.ca',
            email='regular@ubc.ca',
            password='regularpass123'
        )
        
        refresh = RefreshToken.for_user(regular_user)
        refresh['user_type'] = 'student'
        #refresh['user_id'] = str(regular_user.id)  # Use Django User ID
        refresh['student_id'] = '12345678'         # Add student number as separate field
        refresh['email'] = 'regular@ubc.ca'
        refresh['name'] = 'Regular User'
        
        access_token = refresh.access_token
        access_token['user_type'] = 'student'
        #access_token['user_id'] = str(regular_user.id)  # Use Django User ID
        access_token['student_id'] = '12345678'         # Add student number as separate field
        access_token['email'] = 'regular@ubc.ca'
        access_token['name'] = 'Regular User'
        
        return str(access_token)

    # def test_admin_create_instructor(self):
    #     """Test admin creating instructor"""
    #     print("DEBUG: Starting admin_create_instructor test")
    #     token = self._get_admin_token()
    #     print(f"DEBUG: Admin token generated: {token[:20]}...") # Show first 20 chars of token
    #     self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    #     print(f"DEBUG: Set Authorization header: Bearer {token[:20]}...")

    #     data = {
    #         'employee_number': 'EMP001',
    #         'first_name': 'John',
    #         'last_name': 'Professor',
    #         'email': 'prof@ubc.ca',
    #         'faculty': 'cosc'  # Use faculty name directly  
    #     }
    #     print(f"DEBUG: Request data: {data}")

    #     response = self.client.post('/api/admin/create-instructor/', data, format='json')  # Changed
    #     print("DEBUG: Sending POST request to /api/admin/create-instructor/")

    #     print(f"DEBUG: Response status code: {response.status_code}")
    #     print(f"DEBUG: Response content: {response.content}")
    #     print(f"DEBUG: Response headers: {response.headers}")
    #     self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    #     print("DEBUG: Test completed")

    def test_non_admin_cannot_create_instructor(self):
        """Test that non-admin users cannot create instructors"""
        token = self._get_regular_user_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        data = {
            'employee_number': 'EMP002',
            'first_name': 'Jane',
            'last_name': 'Teacher',
            'email': 'teacher@ubc.ca',
            'faculty': 'Computer Science'
        }
        response = self.client.post('/api/admin/create-instructor/', data, format='json')  # Changed
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_user_deactivation(self):
        """Test admin can deactivate users"""
        token = self._get_admin_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Create test student
        student = Student.objects.create(
            student_number='87654321',
            name='Test Student',
            email='deactivate@test.com',
            department=self.department,
            study_level='Undergraduate',
            password='hashed_password',
            is_active=True
        )
        
        data = {
            'action': 'deactivate',
            'user_type': 'student',
            'user_id': '87654321'
        }
        response = self.client.patch('/api/admin/user-management/', data, format='json')  # Changed
        self.assertEqual(response.status_code, status.HTTP_200_OK)