import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from api.models import (
    Department, TAScheduler, Student, Term, 
    JobPosting, Application  # Remove Faculty, it doesn't exist
)

class ApplicationModelTest(TestCase):
    """Test Application model functionality"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Jane Student",
            email="student@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open'
        )

    def test_application_creation(self):
        """Test basic application creation"""
        application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            positionType='UTA',
            termSelection=self.term,
            workload='12',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'},
            citizenshipStatus='citizen',
            residingInKelowna='yes',
            fullTimeEnrollment='yes',
            hasOtherPositions='no'
        )
        
        self.assertEqual(application.student, self.student)
        self.assertEqual(application.posting, self.job_posting)
        self.assertEqual(application.status, 'submitted')
        self.assertTrue(application.can_withdraw())

    def test_application_string_representation(self):
        """Test application __str__ method"""
        application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        # Fix: Match the actual format from your model's __str__ method
        expected = f"Application {application.application_id} - {self.student.name}  for {self.job_posting}"
        self.assertEqual(str(application), expected)

    def test_can_withdraw_method(self):
        """Test withdrawal eligibility logic"""
        # Can withdraw when submitted or under review
        app_submitted = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        self.assertTrue(app_submitted.can_withdraw())
        
        app_under_review = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='under_review',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        self.assertTrue(app_under_review.can_withdraw())
        
        # Cannot withdraw when accepted
        app_accepted = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='accepted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        self.assertFalse(app_accepted.can_withdraw())


class ApplicationAPITest(APITestCase):
    """Test Application API endpoints"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Jane Student",
            email="student@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open'
        )

        # Create Django user for authentication
        self.django_user = User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='testpass'
        )
        
        # Setup API client with authentication
        self.client = APIClient()
        self.client.force_authenticate(user=self.django_user)

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    @patch('api.views.ApplicationViewSet.get_student_model_id')
    def test_create_application(self, mock_get_student_model_id, mock_get_user_info, mock_get_permissions):
        """Test creating an application via API"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('student', 2)  # User model ID
        mock_get_student_model_id.return_value = self.student.pk  # Student model ID
        
        url = reverse('application-list')
        data = {
            'student_id': self.student.pk,
            'posting_id': self.job_posting.pk,
            'termSelection_id': self.term.pk,
            'status': 'draft',
            'positionType': 'UTA',
            'workload': '12',
            'disciplineRankings': {
                'rank1': 'COSC',
                'rank2': 'MATH', 
                'rank3': 'STAT'
            },
            'citizenshipStatus': 'citizen',
            'residingInKelowna': 'yes',
            'fullTimeEnrollment': 'yes',
            'hasOtherPositions': 'no'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 1)
        
        application = Application.objects.first()
        self.assertEqual(application.student, self.student)
        self.assertEqual(application.posting, self.job_posting)
        self.assertEqual(application.positionType, 'UTA')

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    def test_list_applications(self, mock_get_user_info, mock_get_permissions):
        """Test retrieving applications list"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('student', 2)
        
        # Create test applications
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        url = reverse('application-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    def test_filter_by_status(self, mock_get_user_info, mock_get_permissions):
        """Test filtering applications by status"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('student', 2)
        
        # Create applications with different statuses
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='draft',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'PHYS', 'rank2': 'CHEM', 'rank3': 'BIOL'}
        )
        
        url = reverse('application-list')
        response = self.client.get(url, {'status': 'submitted'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'submitted')

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    def test_search_applications(self, mock_get_user_info, mock_get_permissions):
        """Test searching applications by student name"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('student', 2)
        
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        url = reverse('application-list')
        response = self.client.get(url, {'search': 'Jane'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    @patch('api.views.ApplicationViewSet.get_student_model_id')
    def test_applications_by_student(self, mock_get_student_model_id, mock_get_user_info, mock_get_permissions):
        """Test custom endpoint to get applications by student"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('student', 2)
        mock_get_student_model_id.return_value = self.student.pk
        
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        url = reverse('application-by-student', kwargs={'student_id': self.student.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student']['student_number'], '12345678')

    @patch('api.views.ApplicationViewSet.get_permissions')
    @patch('api.views.ApplicationViewSet.get_user_info')
    def test_applications_by_posting(self, mock_get_user_info, mock_get_permissions):
        """Test custom endpoint to get applications by job posting"""
        # Mock permissions to allow access
        from rest_framework.permissions import AllowAny
        mock_get_permissions.return_value = [AllowAny()]
        
        mock_get_user_info.return_value = ('scheduler', 1)  # Use scheduler for posting access
        
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        url = reverse('application-by-posting', kwargs={'posting_id': self.job_posting.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['posting']['title'], 'TA Position')