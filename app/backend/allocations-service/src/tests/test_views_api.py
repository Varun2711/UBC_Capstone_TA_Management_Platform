import pytest
import uuid
from datetime import date, timedelta, time
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from unittest.mock import patch, Mock
from django.urls import reverse
from django.utils import timezone

from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem,
    CourseOffering, SharedSession, TimeSlot, Course, Assignment
)
from api.serializers import (
    ShortlistedApplicantSerializer, OfferSerializer, AssignmentSerializer
)


class ShortlistedApplicantViewSetTest(APITestCase):
    """Test ShortlistedApplicantViewSet endpoints"""
    
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
            notes="Test shortlisted candidate"
        )

class OfferViewSetTest(APITestCase):
    """Test OfferViewSet endpoints"""
    
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
        
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department,
            course_level="200",
            is_active=True
        )
        
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)
        )
        
        self.shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        self.shared_session.time_slots.add(self.time_slot)
        
        self.offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        self.offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        self.offer.offer_items.add(self.offer_item)


class AssignmentViewSetTest(APITestCase):
    """Test AssignmentViewSet endpoints"""
    
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
        
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department,
            course_level="200",
            is_active=True
        )
        
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)
        )
        
        self.shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        self.shared_session.time_slots.add(self.time_slot)
        
        self.course_offering = CourseOffering.objects.create(
            course_offering_id=uuid.uuid4(),
            course=self.course,
            section_number="001",
            academic_term=self.term
        )
        
        self.offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='accepted'
        )
        
        self.assignment = Assignment.objects.create(
            offer=self.offer,
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler,
            time_slot=self.time_slot,
            is_active=True
        )


class GlobalAllocationActionsViewSetTest(APITestCase):
    """Test GlobalAllocationActionsViewSet endpoints"""
    
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

class ModelPropertyTest(TestCase):
    """Test model properties and methods that need coverage"""
    
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
        
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department,
            course_level="200",
            is_active=True
        )
        
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)
        )
        
        self.shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        self.shared_session.time_slots.add(self.time_slot)

    def test_offer_total_weekly_hours_property(self):
        """Test Offer total_weekly_hours property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        offer.offer_items.add(offer_item)
        
        # Should calculate hours from time slots
        self.assertEqual(offer.total_weekly_hours, 2.0)

    def test_offer_is_expired_property(self):
        """Test Offer is_expired property"""
        # Create expired offer
        expired_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() - timedelta(days=1),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        self.assertTrue(expired_offer.is_expired())
        
        # Create non-expired offer
        active_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        self.assertFalse(active_offer.is_expired())

    def test_offer_can_respond_property(self):
        """Test Offer can_respond property"""
        # Create offer that can be responded to
        active_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        self.assertTrue(active_offer.can_respond())
        
        # Test accepted offer can't be responded to
        active_offer.status = 'accepted'
        active_offer.save()
        self.assertFalse(active_offer.can_respond())

    def test_offer_item_weekly_hours_property(self):
        """Test OfferItem weekly_hours property"""
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        
        # Should calculate 2 hours from the time slot (9-11)
        self.assertEqual(offer_item.weekly_hours, 2.0)

    def test_assignment_weekly_hours_property(self):
        """Test Assignment weekly_hours property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='accepted'
        )
        
        assignment = Assignment.objects.create(
            offer=offer,
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler,
            time_slot=self.time_slot
        )
        
        self.assertEqual(assignment.weekly_hours, 2.0)

    def test_assignment_required_hours_category(self):
        """Test Assignment required_hours_category property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='accepted'
        )
        
        assignment = Assignment.objects.create(
            offer=offer,
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler,
            time_slot=self.time_slot
        )
        
        # 2 hours should be category '3' 
        self.assertEqual(assignment.required_hours_category, '3')
