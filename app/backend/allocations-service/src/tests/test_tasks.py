import pytest
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, Mock
from unittest import mock

from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, Offer, OfferItem, SharedSession, Course
)
from api.tasks import check_offer_deadlines


class TasksTest(TestCase):
    """Test Celery tasks"""
    
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="Test Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="test_password",
            is_active=True
        )
        
        self.student = Student.objects.create(
            student_number="12345678",
            name="Test Student",
            email="student@test.com",
            study_level="undergraduate",
            department=self.department,
            is_active=True
        )
        
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start=timezone.now().date(),
            end=timezone.now().date() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2025/26",
            is_active=True,
            term_type="winter"
        )
        
        self.job_posting = JobPosting.objects.create(posting_id=1)
        
        self.application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            workload='12',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'},
            citizenshipStatus='citizen',
            residingInKelowna='yes',
            fullTimeEnrollment='yes',
            hasOtherPositions='no',
            termSelection=self.term
        )
        
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department,
            course_level="200",
            is_active=True
        )

    def test_check_offer_deadlines_no_expiring_offers(self):
        """Test check_offer_deadlines with no expiring offers"""
        result = check_offer_deadlines()
        self.assertEqual(result, "No expiring offers found.")

    def test_check_offer_deadlines_with_already_reminded_offers(self):
        """Test check_offer_deadlines ignores already reminded offers"""
        # Create offer that has already been reminded
        reminded_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(hours=24),
            created_by=self.ta_scheduler,
            status='pending',
            reminder_sent=True  # Already reminded
        )
        
        result = check_offer_deadlines()
        self.assertEqual(result, "No expiring offers found.")

    def test_check_offer_deadlines_no_offer_items(self):
        """Test check_offer_deadlines with offers that have no items"""
        # Create offer with no items
        offer_no_items = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(hours=24),
            created_by=self.ta_scheduler,
            status='pending',
            reminder_sent=False
        )
        
        # Mock successful notification call
        with patch('api.tasks.requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_post.return_value = mock_response
            
            result = check_offer_deadlines()
            
            # Should still send notification but with "Multiple Courses" as course code
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            
            self.assertEqual(call_args[1]['json']['course_code'], 'Multiple Courses')
            self.assertEqual(result, "Sent reminders for 1 offers.")

    def test_check_offer_deadlines_filtering_by_status(self):
        """Test that check_offer_deadlines only processes pending offers"""
        # Create accepted offer (should be ignored)
        accepted_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(hours=24),
            created_by=self.ta_scheduler,
            status='accepted',  # Not pending
            reminder_sent=False
        )
        
        result = check_offer_deadlines()
        self.assertEqual(result, "No expiring offers found.")

    def test_check_offer_deadlines_filtering_by_deadline_window(self):
        """Test that check_offer_deadlines filters by deadline window correctly"""
        # Create offer expiring too far in the future (beyond 48 hours)
        future_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(hours=72),  # 3 days
            created_by=self.ta_scheduler,
            status='pending',
            reminder_sent=False
        )
        
        # Create offer that already expired (before now)
        past_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() - timedelta(hours=12),  # Past
            created_by=self.ta_scheduler,
            status='pending',
            reminder_sent=False
        )
        
        result = check_offer_deadlines()
        self.assertEqual(result, "No expiring offers found.")
