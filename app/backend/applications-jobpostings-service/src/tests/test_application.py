import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import date, timedelta
from api.models import (
    Faculty, Department, TAScheduler, Student, Term, 
    JobPosting, Application
)


class ApplicationModelTest(TestCase):
    """Test Application model functionality"""
    
    def setUp(self):
        # Create test data
        self.faculty = Faculty.objects.create(name="Science")
        self.department = Department.objects.create(name="Computer Science", faculty=self.faculty)
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
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
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
        
        expected = f"Application {application.application_id} - Student {self.student}  for {self.job_posting}"
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
        # Create test data (same as above)
        self.faculty = Faculty.objects.create(name="Science")
        self.department = Department.objects.create(name="Computer Science", faculty=self.faculty)
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
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            status='open'
        )

    def test_create_application(self):
        """Test creating an application via API"""
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

    def test_list_applications(self):
        """Test retrieving applications list"""
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

    def test_filter_by_status(self):
        """Test filtering applications by status"""
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

    def test_filter_by_discipline(self):
        """Test filtering applications by discipline ranking"""
        # Create applications with different discipline rankings
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'PHYS', 'rank2': 'COSC', 'rank3': 'BIOL'}
        )
        
        url = reverse('application-list')
        response = self.client.get(url, {'discipline': 'COSC'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Both should match

    def test_search_applications(self):
        """Test searching applications by student name"""
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

    def test_applications_by_student(self):
        """Test custom endpoint to get applications by student"""
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

    def test_applications_by_posting(self):
        """Test custom endpoint to get applications by job posting"""
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

  