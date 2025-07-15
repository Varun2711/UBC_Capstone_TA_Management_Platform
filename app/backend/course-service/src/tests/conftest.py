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
