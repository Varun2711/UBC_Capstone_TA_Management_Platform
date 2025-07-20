import pytest
import uuid
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from datetime import date, timedelta
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem, SharedSession, TimeSlot, Course
)
from unittest.mock import patch

class ShortlistedApplicantTest(TestCase):
    """Core ShortlistedApplicant functionality tests"""
    
    def setUp(self):
        # Create minimal test data
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
            start=date.today(),
            end=date.today() + timedelta(days=120),
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
        self.shortlist = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler,
            notes="Test shortlist"
        )
    
    def test_shortlist_creation(self):
        """Test basic shortlist creation"""
        self.assertEqual(self.shortlist.application, self.application)
        self.assertEqual(self.shortlist.created_by, self.ta_scheduler)
        self.assertEqual(self.shortlist.notes, "Test shortlist")
    
    def test_allocation_status_calculation(self):
        """Test allocation status calculation with new hours system"""
        # Create course and time slots for testing
        course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department,
            course_level="200",
            is_active=True
        )
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time="09:00:00",
            end_time="12:00:00"
        )
        
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        shared_session.time_slots.add(time_slot)
        
        # Create offer with calculated hours
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline="2025-12-31T23:59:59Z",
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session
        )
        offer.offer_items.add(offer_item)
        
        # Test hours calculation
        self.assertEqual(offer.total_weekly_hours, 3.0)
        
        # Test allocation status (student has 12h max, 3h pending)
        from api.views import ShortlistedApplicantViewSet
        viewset = ShortlistedApplicantViewSet()
        allocation = viewset.calculate_student_allocation(self.student)
        
        self.assertEqual(allocation['pending_offers_hours'], 3.0)
        self.assertEqual(allocation['active_assignments_hours'], 0)
        self.assertEqual(allocation['total_hours'], 3.0)

class ShortlistedApplicantAPITest(APITestCase):
    """Core API tests for shortlisted applicants"""
    
    def setUp(self):
        # Create test data
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
            hasOtherPositions='no'
        )
    
    def tearDown(self):
        pass
    
    def test_list_shortlisted_applicants(self):
        """Test basic listing functionality"""
        # This test can be expanded based on your API needs
        pass
    
    def test_available_for_allocation_endpoint(self):
        """Test available for allocation endpoint"""
        # This test can be expanded based on your API needs
        pass