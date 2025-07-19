import pytest
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem, SharedSession, TimeSlot, Course
)
import uuid
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
            department=self.department
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Test Student",
            email="student@test.com",
            study_level="undergraduate"
        )
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start="2025-01-01",
            end="2025-04-30",
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2025/26"
        )
        self.job_posting = JobPosting.objects.create(posting_id=1)
        
        # ✅ FIX: Add all required fields for Application
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
            department=self.department
        )
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time="09:00:00",
            end_time="12:00:00"  # 3 hour slot
        )
        
        # ✅ FIX: Add required shared_session_id
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),  # ← Add required UUID
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
            department=self.department
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Test Student",
            email="student@test.com",
            study_level="undergraduate"
        )
        self.job_posting = JobPosting.objects.create(posting_id=1)
        
        # ✅ FIX: Add all required fields for Application
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
        self.shortlist = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler
        )
        
        # ✅ FIX: Mock only the existing authentication functions
        self.client = APIClient()
        
        # Mock the extract_user_from_token function to return scheduler
        self.token_patcher = patch('auth_utils.permissions.extract_user_from_token')
        self.mock_extract_token = self.token_patcher.start()
        self.mock_extract_token.return_value = ('TA001', 'scheduler')  # Return (user_id, user_type)
        
        # Mock the permission classes to always return True
        self.scheduler_patcher = patch('auth_utils.permissions.IsSchedulerUser.has_permission')
        self.mock_scheduler = self.scheduler_patcher.start()
        self.mock_scheduler.return_value = True
        
        # ✅ REMOVED: The non-existent verify_jwt_token mock
    
    def tearDown(self):
        """Clean up mocks"""
        self.token_patcher.stop()
        self.scheduler_patcher.stop()
        # Removed jwt_patcher.stop()
    
    def test_list_shortlisted_applicants(self):
        """Test retrieving shortlisted applicants list"""
        response = self.client.get('/api/allocations/shortlisted-applicants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_available_for_allocation_endpoint(self):
        """Test available for allocation endpoint"""
        response = self.client.get('/api/allocations/shortlisted-applicants/available_for_allocation/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check allocation status is included
        if len(response.data) > 0:
            applicant_data = response.data[0]
            self.assertIn('allocation_status', applicant_data)
            self.assertIn('pending_offers_hours', applicant_data['allocation_status'])
            self.assertIn('active_assignments_hours', applicant_data['allocation_status'])