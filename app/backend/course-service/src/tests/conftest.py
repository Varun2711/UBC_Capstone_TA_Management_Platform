"""
Pytest configuration and fixtures for the course-service API tests.
"""
import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
import json
from datetime import date, datetime
from api.models import (
    Term, Department, Instructor, Course, TimeSlot, 
    CourseOffering, SharedSession, InstructorRequest, Student
)


def pytest_configure():
    """
    Configure Django settings for testing.
    Make all unmanaged models managed for testing.
    """
    # Import models after Django is configured
    from api.models import (
        Term, Department, Instructor, Course, TimeSlot, 
        CourseOffering, SharedSession, InstructorRequest, Student
    )
    
    # Make all unmanaged models managed for testing
    models_to_manage = [
        Term, Department, Instructor, Course, TimeSlot,
        CourseOffering, SharedSession, InstructorRequest, Student
    ]
    
    for model in models_to_manage:
        model._meta.managed = True


@pytest.fixture
def api_client():
    """Fixture to provide DRF API client."""
    return APIClient()


@pytest.fixture
def sample_department():
    """Fixture to create a sample department."""
    return Department.objects.create(name="Computer Science")


@pytest.fixture
def sample_term():
    """Fixture to create a sample term."""
    return Term.objects.create(
        code="W2025T1",
        description="Winter 2025 Term 1",
        start=date(2025, 1, 6),
        end=date(2025, 4, 4),
        startCalendarYear=2025,
        endCalendarYear=2025,
        academicYear="2024/25",
        is_active=True,
        term_type="winter"
    )


@pytest.fixture
def sample_instructor(sample_department):
    """Fixture to create a sample instructor."""
    return Instructor.objects.create(
        employee_number="EMP001",
        name="Dr. Test Instructor",
        department=sample_department,
        email="instructor@test.com",
        password="testpass123",
        is_active=True
    )


@pytest.fixture
def sample_student(sample_department):
    """Fixture to create a sample student."""
    return Student.objects.create(
        student_number="12345678",
        name="Test Student",
        phone="+1-250-555-0123",
        program="Computer Science",
        year_standing=3,
        study_level="BSc",
        department=sample_department,
        sin="123456789",
        password="testpass123",
        email="student@test.com",
        is_active=True
    )


@pytest.fixture
def sample_course(sample_department):
    """Fixture to create a sample course."""
    return Course.objects.create(
        course_number="COSC 111",
        course_name="Introduction to Programming",
        department=sample_department,
        course_description="Basic programming concepts",
        course_level="100",
        is_active=True
    )


@pytest.fixture
def sample_time_slot():
    """Fixture to create a sample time slot."""
    return TimeSlot.objects.create(
        day="monday",
        start_time="09:00:00",
        end_time="10:00:00"
    )


@pytest.fixture
def sample_course_offering(sample_course, sample_term, sample_instructor):
    """Fixture to create a sample course offering."""
    return CourseOffering.objects.create(
        course=sample_course,
        section_number="001",
        academic_term=sample_term,
        instructor=sample_instructor
    )


@pytest.fixture
def sample_shared_session(sample_course, sample_term, sample_student, sample_time_slot):
    """Fixture to create a sample shared session."""
    shared_session = SharedSession.objects.create(
        session_type="lab",
        course=sample_course,
        section_number="L01",
        academic_term=sample_term,
        student=sample_student
    )
    shared_session.time_slots.add(sample_time_slot)
    return shared_session


@pytest.fixture
def sample_instructor_request(sample_instructor, sample_course_offering):
    """Fixture to create a sample instructor request."""
    return InstructorRequest.objects.create(
        instructor=sample_instructor,
        course_offering=sample_course_offering,
        request_date=date.today(),
        request_description="Need TAs for this course"
    )


# Authentication Helper Functions
# Test Credentials - Update these with actual values from your sample data
TEST_CREDENTIALS = {
    'admin': {
        'email': 'admin@gmail.com',
        'password': 'test'
    },
    'scheduler': {
        'email': 'chad.davis@gmail.com',
        'password': 'test'
    },
    'instructor': {
        'email': 'naman.arora@gmail.com',
        'password': 'test'
    },
    'student': {
        'email': 'sarah.johnson@student.ubc.ca',
        'password': 'test'
    }
}


def authenticate_user(email, password, auth_service_url="http://localhost:8080"):
    """
    Helper function to authenticate a user and return the access token.
    
    Args:
        email (str): User's email
        password (str): User's password
        auth_service_url (str): Base URL of the auth service
    
    Returns:
        str: Access token if authentication successful, None otherwise
    """
    try:
        import urllib.request
        import urllib.parse
        
        # Prepare the authentication request
        auth_url = f"{auth_service_url}/api/auth/login"
        
        # Create the payload
        payload = {
            "email": email,
            "password": password
        }
        
        # Convert payload to JSON bytes
        data = json.dumps(payload).encode('utf-8')
        
        # Create the request
        req = urllib.request.Request(
            auth_url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        
        # Make the request
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            
            # Extract the access token from response
            # Update the key name based on your actual response structure
            return response_data.get('access_token') or response_data.get('token')
            
    except urllib.error.HTTPError as e:
        print(f"HTTP Error during authentication for {email}: {e.code} - {e.reason}")
        return None
    except Exception as e:
        print(f"Authentication error for {email}: {str(e)}")
        return None


@pytest.fixture
def admin_token():
    """Fixture to get admin authentication token."""
    creds = TEST_CREDENTIALS['admin']
    return authenticate_user(creds['email'], creds['password'])


@pytest.fixture
def scheduler_token():
    """Fixture to get scheduler authentication token."""
    creds = TEST_CREDENTIALS['scheduler']
    return authenticate_user(creds['email'], creds['password'])


@pytest.fixture
def instructor_token():
    """Fixture to get instructor authentication token."""
    creds = TEST_CREDENTIALS['instructor']
    return authenticate_user(creds['email'], creds['password'])


@pytest.fixture
def student_token():
    """Fixture to get student authentication token."""
    creds = TEST_CREDENTIALS['student']
    return authenticate_user(creds['email'], creds['password'])


@pytest.fixture
def authenticated_admin_client(admin_token):
    """Fixture to provide API client authenticated as admin."""
    client = APIClient()
    if admin_token:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    return client


@pytest.fixture
def authenticated_scheduler_client(scheduler_token):
    """Fixture to provide API client authenticated as scheduler."""
    client = APIClient()
    if scheduler_token:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {scheduler_token}')
    return client


@pytest.fixture
def authenticated_instructor_client(instructor_token):
    """Fixture to provide API client authenticated as instructor."""
    client = APIClient()
    if instructor_token:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {instructor_token}')
    return client


@pytest.fixture
def authenticated_student_client(student_token):
    """Fixture to provide API client authenticated as student."""
    client = APIClient()
    if student_token:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')
    return client


def authenticate_client_as(client, role, auth_service_url="http://localhost:8080"):
    """
    Helper function to authenticate an existing API client with a specific role.
    
    Args:
        client (APIClient): The API client to authenticate
        role (str): Role type - 'admin', 'scheduler', 'instructor', or 'student'
        auth_service_url (str): Base URL of the auth service
    
    Returns:
        bool: True if authentication successful, False otherwise
    """
    if role not in TEST_CREDENTIALS:
        print(f"Invalid role: {role}")
        return False
    
    creds = TEST_CREDENTIALS[role]
    token = authenticate_user(creds['email'], creds['password'], auth_service_url)
    
    if token:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return True
    else:
        return False


class BaseAPITestCase(APITestCase):
    """Base test case class for API tests."""
    
    def setUp(self):
        """Set up test dependencies."""
        self.client = APIClient()
        # Add any common setup here
    
    def assertResponseSuccess(self, response, expected_status=status.HTTP_200_OK):
        """Helper to assert successful response."""
        self.assertEqual(response.status_code, expected_status)
        self.assertIn('application/json', response['Content-Type'])
    
    def assertResponseError(self, response, expected_status=status.HTTP_400_BAD_REQUEST):
        """Helper to assert error response."""
        self.assertEqual(response.status_code, expected_status)
    
    def get_url(self, viewname, *args, **kwargs):
        """Helper to get URL for a view."""
        return reverse(viewname, args=args, kwargs=kwargs)
