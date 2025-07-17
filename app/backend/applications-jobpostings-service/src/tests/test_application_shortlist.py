import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth.models import User
from unittest.mock import patch
from datetime import date, timedelta
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting, 
    Application, ApplicationShortList
)


class ApplicationShortListModelTest(TestCase):
    """Test ApplicationShortList model functionality"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
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
        self.application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )

    def test_application_shortlist_creation(self):
        """Test basic application shortlist creation"""
        shortlist = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler,
            notes="Strong candidate with excellent GPA"
        )
        
        self.assertEqual(shortlist.application, self.application)
        self.assertEqual(shortlist.created_by, self.ta_scheduler)
        self.assertEqual(shortlist.notes, "Strong candidate with excellent GPA")
        self.assertIsNotNone(shortlist.created_at)

  
        # Try to create duplicate - should raise IntegrityError
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            ApplicationShortList.objects.create(
                application=self.application,
                created_by=self.ta_scheduler
            )

    

class ApplicationShortListAPITest(APITestCase):
    """Test ApplicationShortList API endpoints"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
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
        self.application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )

        # Create Django user for authentication
        self.django_user = User.objects.create_user(
            username='scheduler@test.com',
            email='scheduler@test.com',
            password='testpass'
        )
        
        # Setup API client with authentication
        self.client = APIClient()
        self.client.force_authenticate(user=self.django_user)

    def test_create_application_shortlist(self):
        """Test creating an application shortlist via API"""
        url = reverse('applicationshortlist-list')
        data = {
            'application_id': self.application.pk,
            'created_by_id': self.ta_scheduler.pk,
            'notes': 'Excellent candidate with strong programming skills'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ApplicationShortList.objects.count(), 1)
        
        shortlist = ApplicationShortList.objects.first()
        self.assertEqual(shortlist.application, self.application)
        self.assertEqual(shortlist.created_by, self.ta_scheduler)
        self.assertEqual(shortlist.notes, 'Excellent candidate with strong programming skills')

    def test_list_application_shortlists(self):
        """Test retrieving application shortlists list"""
        ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler,
            notes="Great candidate"
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['notes'], 'Great candidate')

    def test_filter_shortlists_by_scheduler(self):
        """Test filtering shortlists by TA scheduler"""
        # Create another scheduler and shortlist
        other_scheduler = TAScheduler.objects.create(
            employee_number="TA002",
            name="Other Scheduler",
            email="other@test.com",
            department=self.department,
            password="testpass"
        )
        
        ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler
        )
        ApplicationShortList.objects.create(
            application=self.application,
            created_by=other_scheduler
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url, {'created_by': self.ta_scheduler.pk})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['created_by']['employee_number'], 'TA001')

    def test_filter_shortlists_by_application_status(self):
        """Test filtering shortlists by application status"""
        # Create applications with different statuses
        app_under_review = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='under_review',
            disciplineRankings={'rank1': 'PHYS', 'rank2': 'CHEM', 'rank3': 'BIOL'}
        )
        
        ApplicationShortList.objects.create(
            application=self.application,  # status: submitted
            created_by=self.ta_scheduler
        )
        ApplicationShortList.objects.create(
            application=app_under_review,  # status: under_review
            created_by=self.ta_scheduler
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url, {'application_status': 'under_review'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['application']['status'], 'under_review')

    def test_filter_shortlists_by_posting(self):
        """Test filtering shortlists by job posting"""
        # Create another job posting and application
        other_posting = JobPosting.objects.create(
            title="Other TA Position",
            description="Another test position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open'
        )
        other_application = Application.objects.create(
            student=self.student,
            posting=other_posting,
            status='submitted',
            disciplineRankings={'rank1': 'MATH', 'rank2': 'STAT', 'rank3': 'PHYS'}
        )
        
        ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler
        )
        ApplicationShortList.objects.create(
            application=other_application,
            created_by=self.ta_scheduler
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url, {'posting_id': self.job_posting.posting_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['application']['posting']['title'], 'TA Position')

    def test_filter_shortlists_by_term(self):
        """Test filtering shortlists by term"""
        # Create another term and application
        other_term = Term.objects.create(
            code="S2025",
            description="Summer 2025",
            start=date.today() + timedelta(days=150),
            end=date.today() + timedelta(days=270),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="summer"
        )
        
        summer_application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            termSelection=other_term,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )
        
        ApplicationShortList.objects.create(
            application=self.application,  # Winter term
            created_by=self.ta_scheduler
        )
        ApplicationShortList.objects.create(
            application=summer_application,  # Summer term
            created_by=self.ta_scheduler
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url, {'term_id': other_term.pk})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['application']['termSelection']['code'], 'S2025')

    def test_search_shortlists(self):
        """Test searching shortlists by student name and posting title"""
        ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url, {'search': 'Jane'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('Jane', response.data[0]['application']['student']['name'])
   

    def test_delete_shortlist(self):
        """Test deleting a shortlist"""
        shortlist = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler
        )
        
        url = reverse('applicationshortlist-detail', kwargs={'pk': shortlist.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ApplicationShortList.objects.count(), 0)

    def test_shortlist_ordering(self):
        """Test that shortlists are returned in correct order (most recent first)"""
        # Create multiple applications and shortlists
        app2 = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'MATH', 'rank2': 'STAT', 'rank3': 'PHYS'}
        )
        
        shortlist1 = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler,
            notes="First shortlist"
        )
        shortlist2 = ApplicationShortList.objects.create(
            application=app2,
            created_by=self.ta_scheduler,
            notes="Second shortlist"
        )
        
        url = reverse('applicationshortlist-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Most recent (shortlist2) should be first
        self.assertEqual(response.data[0]['notes'], 'Second shortlist')
        self.assertEqual(response.data[1]['notes'], 'First shortlist')

    
