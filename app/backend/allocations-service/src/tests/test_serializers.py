import pytest
import uuid
from datetime import date, timedelta, time
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, Mock

from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, ApplicationShortList, Offer, OfferItem,
    CourseOffering, SharedSession, TimeSlot, Course, Assignment
)
from api.serializers import (
    ShortlistedApplicantSerializer, OfferSerializer, AssignmentSerializer,
    OfferItemSerializer, StudentSerializer, TermSerializer, CourseSerializer
)


class SerializerTest(TestCase):
    """Test serializer functionality"""
    
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

    def test_student_serializer(self):
        """Test StudentSerializer"""
        serializer = StudentSerializer(self.student)
        data = serializer.data
        
        self.assertEqual(data['student_number'], '12345678')
        self.assertEqual(data['name'], 'Test Student')
        self.assertEqual(data['email'], 'student@test.com')
        self.assertEqual(data['study_level'], 'undergraduate')

    def test_term_serializer(self):
        """Test TermSerializer"""
        serializer = TermSerializer(self.term)
        data = serializer.data
        
        self.assertEqual(data['code'], 'W2025T1')
        self.assertEqual(data['description'], 'Winter 2025 Term 1')
        self.assertEqual(data['academicYear'], '2025/26')
        self.assertEqual(data['term_type'], 'winter')

    def test_course_serializer(self):
        """Test CourseSerializer"""
        serializer = CourseSerializer(self.course)
        data = serializer.data
        
        self.assertEqual(data['course_number'], 'COSC 121')
        self.assertEqual(data['course_name'], 'Computer Programming II')
        self.assertEqual(data['course_level'], '200')

    def test_shortlisted_applicant_serializer(self):
        """Test ShortlistedApplicantSerializer"""
        shortlist = ApplicationShortList.objects.create(
            application=self.application,
            created_by=self.ta_scheduler,
            notes="Test shortlist"
        )
        
        serializer = ShortlistedApplicantSerializer(shortlist)
        data = serializer.data
        
        self.assertIn('application', data)
        self.assertIn('shortlisted_by', data)
        self.assertEqual(data['notes'], 'Test shortlist')
        self.assertEqual(data['application']['student']['name'], 'Test Student')


    def test_offer_serializer_basic(self):
        """Test basic OfferSerializer functionality"""
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
        
        serializer = OfferSerializer(offer)
        data = serializer.data
        
        self.assertEqual(data['status'], 'pending')
        self.assertEqual(data['student']['name'], 'Test Student')
        self.assertEqual(data['total_weekly_hours'], 2.0)
        self.assertIn('offer_items', data)
        self.assertEqual(len(data['offer_items']), 1)

    def test_offer_serializer_multiple_items(self):
        """Test OfferSerializer with multiple offer items"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        # Add shared session item
        shared_session_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        offer.offer_items.add(shared_session_item)
        
        # Add course offering item
        course_offering_item = OfferItem.objects.create(
            item_type='course_offering',
            course_offering=self.course_offering
        )
        offer.offer_items.add(course_offering_item)
        
        serializer = OfferSerializer(offer)
        data = serializer.data
        
        self.assertEqual(len(data['offer_items']), 2)
        # Total hours should include both items (2.0 from shared session + calculated from course offering)
        self.assertGreaterEqual(data['total_weekly_hours'], 2.0)

    def test_offer_serializer_position_summary(self):
        """Test OfferSerializer position_summary method"""
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
        
        serializer = OfferSerializer(offer)
        data = serializer.data
        
        self.assertIn('position_summary', data)
        # Position summary should include course information
        self.assertIn('COSC 121', data['position_summary'])

    def test_assignment_serializer(self):
        """Test AssignmentSerializer"""
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
            time_slot=self.time_slot,
            is_active=True
        )
        
        serializer = AssignmentSerializer(assignment)
        data = serializer.data
        
        self.assertEqual(data['student']['name'], 'Test Student')
        self.assertEqual(data['course']['course_number'], 'COSC 121')
        self.assertEqual(data['weekly_hours'], 2.0)
        self.assertEqual(data['required_hours_category'], '3')
        self.assertTrue(data['is_active'])

    def test_assignment_serializer_time_slots(self):
        """Test AssignmentSerializer time_slots field"""
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
            time_slot=self.time_slot,
            is_active=True
        )
        
        serializer = AssignmentSerializer(assignment)
        data = serializer.data
        
        self.assertIn('time_slots', data)
        # Should contain time slot information

    def test_assignment_serializer_assignment_term(self):
        """Test AssignmentSerializer assignment_term field"""
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
            time_slot=self.time_slot,
            is_active=True
        )
        
        serializer = AssignmentSerializer(assignment)
        data = serializer.data
        
        self.assertIn('assignment_term', data)
        # Should contain term information from shared session

    def test_offer_serializer_is_modification(self):
        """Test OfferSerializer is_modification field"""
        offer = Offer.objects.create(
            application=self.application,
            student=self.student,
            response_deadline=timezone.now() + timedelta(days=7),
            created_by=self.ta_scheduler,
            status='pending'
        )
        
        serializer = OfferSerializer(offer)
        data = serializer.data
        
        self.assertIn('is_modification', data)
        self.assertFalse(data['is_modification'])  # Should be False for new offers

    def test_offer_item_serializer_all_time_slots(self):
        """Test OfferItemSerializer all_time_slots method"""
        # Create additional time slot
        time_slot2 = TimeSlot.objects.create(
            day="wednesday",
            start_time=time(14, 0),
            end_time=time(16, 0)
        )
        self.shared_session.time_slots.add(time_slot2)
        
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        
        serializer = OfferItemSerializer(offer_item)
        data = serializer.data
        
        self.assertIn('all_time_slots', data)
        # Should contain both time slots
        self.assertIsInstance(data['all_time_slots'], list)

    def test_offer_item_serializer_time_slot_method(self):
        """Test OfferItemSerializer time_slot method"""
        offer_item = OfferItem.objects.create(
            item_type='shared_session',
            shared_session=self.shared_session
        )
        
        serializer = OfferItemSerializer(offer_item)
        data = serializer.data
        
        self.assertIn('time_slot', data)
        # Should contain time slot information for the first slot

    def test_offer_serializer_to_representation(self):
        """Test OfferSerializer to_representation method"""
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
        
        serializer = OfferSerializer(offer)
        data = serializer.to_representation(offer)
        
        # Should include all expected fields
        self.assertIn('offer_id', data)
        self.assertIn('student', data)
        self.assertIn('offer_items', data)
        self.assertIn('total_weekly_hours', data)
        self.assertIn('position_summary', data)
