import pytest
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth.hashers import make_password
import jwt
from django.conf import settings

from api.models import Student, Instructor, TAScheduler, Admin

@pytest.mark.django_db
class AuthViewsTests(APITestCase):

    def setUp(self):
        """
        Create one of each user type for testing.
        This method runs before each test.
        """
        self.student = Student.objects.create(
            student_number="11112222",
            name="Test Student",
            email="student@test.com",
            password=make_password("password123"),
            study_level="undergraduate",
            is_active=True
        )
        
        self.admin = Admin.objects.create(
            employee_number="A001",
            name="Test Admin",
            email="admin@test.com",
            password=make_password("password123"),
            is_active=True
        )

    def test_student_registration_success(self):
        """
        Ensure a new student can be registered successfully.
        """
        url = reverse('register')
        data = {
            "student_number": "87654321",
            "name": "New Student",
            "email": "new.student@test.com",
            "password": "newpassword123",
            "study_level": "graduate"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], "User registered successfully")
        self.assertTrue(Student.objects.filter(email="new.student@test.com").exists())

    def test_student_registration_failure_missing_data(self):
        """
        Ensure registration fails if required data is missing.
        """
        url = reverse('register')
        data = {
            "name": "Incomplete Student",
            "email": "incomplete.student@test.com",
            "password": "password"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_number', response.data)
        self.assertIn('study_level', response.data)

    def test_login_success(self):
        """
        Ensure a user can log in and receive JWT tokens.
        """
        url = reverse('login')
        data = {
            "email": "student@test.com",
            "password": "password123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user_type'], 'student')
        self.assertEqual(response.data['user_id'], self.student.student_number)

    def test_login_failure_wrong_password(self):
        """
        Ensure login fails with an incorrect password.
        """
        url = reverse('login')
        data = {
            "email": "student@test.com",
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid email or password')

    def test_login_failure_nonexistent_user(self):
        """
        Ensure login fails for a user that does not exist.
        """
        url = reverse('login')
        data = {
            "email": "ghost@test.com",
            "password": "password"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_validation_success(self):
        """
        Ensure the validate endpoint correctly validates a good token.
        """
        # First, log in to get a token
        login_url = reverse('login')
        login_data = {"email": "admin@test.com", "password": "password123"}
        login_response = self.client.post(login_url, login_data, format='json')
        access_token = login_response.data['access']

        # Now, validate the token
        validate_url = reverse('validate_token')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(validate_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['user_id'], self.admin.employee_number)
        self.assertEqual(response.data['user_type'], 'admin')

    def test_token_validation_failure_no_token(self):
        """
        Ensure token validation fails when no token is provided.
        """
        validate_url = reverse('validate_token')
        self.client.credentials() # Clear credentials
        response = self.client.get(validate_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['valid'])

    def test_token_validation_failure_bad_token(self):
        """
        Ensure token validation fails with a malformed token.
        """
        validate_url = reverse('validate_token')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer notarealtoken')
        response = self.client.get(validate_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['valid'])
        self.assertIn('Invalid token', response.data['error'])