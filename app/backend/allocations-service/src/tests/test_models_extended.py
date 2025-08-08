import pytest
import uuid
from datetime import date, timedelta, time
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from unittest.mock import patch, Mock

from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem,
    CourseOffering, SharedSession, TimeSlot, Course,
    Assignment, AssignmentModification, Instructor
)


class ModelMethodsTest(TestCase):
    """Test model methods and properties for complete coverage"""
    
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
        
        self.instructor = Instructor.objects.create(
            employee_number="INST001",
            name="Test Instructor",
            email="instructor@test.com",
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

    def test_ta_scheduler_str(self):
        """Test TAScheduler __str__ method"""
        expected = "Test Scheduler (TA001)"
        self.assertEqual(str(self.ta_scheduler), expected)


    def test_student_str(self):
        """Test Student __str__ method"""
        expected = "Test Student (12345678)"
        self.assertEqual(str(self.student), expected)

    def test_job_posting_str(self):
        """Test JobPosting __str__ method"""
        expected = f"Job Posting {self.job_posting.posting_id}"
        self.assertEqual(str(self.job_posting), expected)

    def test_application_str(self):
        """Test Application __str__ method"""
        expected = f"Application {self.application.application_id} - {self.student}  for {self.job_posting}"
        self.assertEqual(str(self.application), expected)

    def test_application_can_withdraw(self):
        """Test Application can_withdraw method"""
        # Test submitted application can be withdrawn
        self.application.status = 'submitted'
        self.application.save()
        self.assertTrue(self.application.can_withdraw())
        
        # Test under review application can be withdrawn
        self.application.status = 'under_review'
        self.application.save()
        self.assertTrue(self.application.can_withdraw())
        
        # Test accepted application cannot be withdrawn
        self.application.status = 'accepted'
        self.application.save()
        self.assertFalse(self.application.can_withdraw())
        
        # Test rejected application cannot be withdrawn
        self.application.status = 'rejected'
        self.application.save()
        self.assertFalse(self.application.can_withdraw())

    def test_time_slot_str(self):
        """Test TimeSlot __str__ method"""
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)
        )
        expected = "Monday 09:00:00-11:00:00"
        self.assertEqual(str(time_slot), expected)


    def test_offer_is_expired(self):
        """Test Offer is_expired property"""
        # Test expired offer
        expired_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() - timedelta(days=1),
            created_by=self.ta_scheduler,
            status='pending'
        )
        self.assertTrue(expired_offer.is_expired())
        
        # Test active offer
        active_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        self.assertFalse(active_offer.is_expired())

    def test_offer_can_respond(self):
        """Test Offer can_respond property"""
        # Test pending offer within deadline
        pending_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        self.assertTrue(pending_offer.can_respond())
        
        # Test accepted offer
        accepted_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='accepted'
        )
        self.assertFalse(accepted_offer.can_respond())
        
        # Test expired offer
        expired_offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() - timedelta(days=1),
            created_by=self.ta_scheduler,
            status='pending'
        )
        self.assertFalse(expired_offer.can_respond())

    def test_offer_total_weekly_hours(self):
        """Test Offer total_weekly_hours property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        # Create shared session with time slots
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)
        )
        shared_session.time_slots.add(time_slot)
        
        # Add offer item
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session
        )
        offer.offer_items.add(offer_item)
        
        self.assertEqual(offer.total_weekly_hours, 2.0)

    def test_offer_primary_course(self):
        """Test Offer primary_course property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        # Create shared session
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        # Add offer item
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session
        )
        offer.offer_items.add(offer_item)
        
        self.assertEqual(offer.primary_course, self.course)

    def test_offer_courses(self):
        """Test Offer courses property"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        # Create two different courses
        course2 = Course.objects.create(
            course_number="MATH 101",
            course_name="Calculus I",
            department=self.department,
            course_level="100",
            is_active=True
        )
        
        # Create shared sessions for both courses
        shared_session1 = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        shared_session2 = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=course2,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        # Add offer items
        offer_item1 = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session1
        )
        offer_item2 = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session2
        )
        
        offer.offer_items.add(offer_item1, offer_item2)
        
        courses = offer.courses
        self.assertEqual(len(courses), 2)
        self.assertIn(self.course, courses)
        self.assertIn(course2, courses)

    def test_offer_item_weekly_hours_with_course_offering(self):
        """Test OfferItem weekly_hours with course offering"""
        course_offering = CourseOffering.objects.create(
            course_offering_id=uuid.uuid4(),
            course=self.course,
            section_number="001",
            academic_term=self.term
        )
        
        offer_item = OfferItem.objects.create(
            item_type='course_offering',
            course_offering=course_offering
        )
        
        # Should return default hours for course offering
        self.assertIsInstance(offer_item.weekly_hours, (int, float))

    def test_offer_item_required_hours_category(self):
        """Test OfferItem required_hours_category property"""
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(11, 0)  # 2 hours
        )
        shared_session.time_slots.add(time_slot)
        
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=shared_session
        )
        
        # 2 hours should be category '3'
        self.assertEqual(offer_item.required_hours_category, '3')

    def test_assignment_weekly_hours_without_time_slot(self):
        """Test Assignment weekly_hours when no time slot is assigned"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='accepted'
        )
        
        shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        
        assignment = Assignment.objects.create(
            offer=offer,
            student=self.student,
            course=self.course,
            shared_session=shared_session,
            assigned_by=self.ta_scheduler
            # No time_slot assigned
        )
        
        # Should calculate from shared session
        time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        shared_session.time_slots.add(time_slot)
        
        self.assertEqual(assignment.weekly_hours, 1.5)


    def test_term_subset_relationship(self):
        """Test Term subset relationship"""
        parent_term = Term.objects.create(
            code="W2025",
            description="Winter 2025 Both Terms",
            start=date.today(),
            end=date.today() + timedelta(days=240),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2025/26",
            is_active=True,
            term_type="full_year"
        )
        
        # Create subset term
        subset_term = Term.objects.create(
            code="W2025T2",
            description="Winter 2025 Term 2",
            start=date.today() + timedelta(days=120),
            end=date.today() + timedelta(days=240),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2025/26",
            is_active=True,
            term_type="winter",
            subsetOf=parent_term
        )
        
        self.assertEqual(subset_term.subsetOf, parent_term)
        self.assertIn(subset_term, parent_term.subterms.all())
