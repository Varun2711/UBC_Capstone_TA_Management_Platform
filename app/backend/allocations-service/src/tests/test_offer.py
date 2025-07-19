import pytest
from django.test import TestCase
from django.utils import timezone
import uuid
from datetime import timedelta
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem,
    CourseOffering, SharedSession, TimeSlot, Course
)

class OfferModelTest(TestCase):
    """Core Offer model functionality tests"""
    
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
        
        # Create course and time slots
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department
        )
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time="09:00:00",
            end_time="10:00:00"
        )
        
        # Create course offering and shared session
        # ✅ FIX: Create course offering and shared session with required UUIDs
        self.course_offering = CourseOffering.objects.create(
            course_offering_id=uuid.uuid4(),  # ← Add this line
            course=self.course,
            section_number="001",
            academic_term=self.term
        )
        self.shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),  # ← Add this line
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
    
    def test_multi_item_offer_creation(self):
        """Test creating offer with multiple items"""
        # Create offer
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler
        )
        
        # Add course offering item
        course_item = OfferItem.objects.create(
            item_type='course_offering',
            course_offering=self.course_offering
        )
        offer.offer_items.add(course_item)
        
        # Add shared session item  
        session_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        offer.offer_items.add(session_item)
        
        # Assertions
        self.assertEqual(offer.offer_items.count(), 2)
        self.assertEqual(offer.status, 'pending')
        self.assertEqual(len(offer.courses), 1)  # Same course for both items
        self.assertEqual(offer.primary_course, self.course)
    
    def test_offer_hours_calculation(self):
        """Test automatic hours calculation from time slots"""
        # Add time slot to shared session
        self.shared_session.time_slots.add(self.time_slot)
        
        # Create offer item
        item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        
        # Test hours calculation
        self.assertEqual(item.weekly_hours, 1.0)  # 1 hour slot
        self.assertEqual(item.required_hours_category, '3')
    
    def test_offer_expiration(self):
        """Test offer expiration logic"""
        # Create expired offer
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() - timedelta(days=1),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        # Check expiration
        self.assertTrue(offer.is_expired())
        self.assertFalse(offer.can_respond())
        
        # Status should auto-update to expired
        offer.refresh_from_db()
        self.assertEqual(offer.status, 'expired')
    
    def test_offer_response(self):
        """Test offer response functionality"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler
        )
        
        # Test can respond
        self.assertTrue(offer.can_respond())
        
        # Accept offer
        offer.status = 'accepted'
        offer.responded_at = timezone.now()
        offer.save()
        
        self.assertEqual(offer.status, 'accepted')
        self.assertFalse(offer.can_respond())