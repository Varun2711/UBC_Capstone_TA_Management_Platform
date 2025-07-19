import pytest
from django.test import TestCase
from django.utils import timezone
import uuid
from datetime import timedelta
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting,
    Application, Assignment,
    CourseOffering, SharedSession, TimeSlot, Course
)

class AssignmentModelTest(TestCase):
    """Core Assignment model functionality tests"""
    
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
        
        # ✅ ADD: JobPosting and Application (required for offers)
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
        
        self.course = Course.objects.create(
            course_number="COSC 121",
            course_name="Computer Programming II",
            department=self.department
        )
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time="09:00:00",
            end_time="11:00:00"  # 2 hour slot
        )
        
        # ✅ FIX: Add required shared_session_id
        self.shared_session = SharedSession.objects.create(
            shared_session_id=uuid.uuid4(),  # ← Add required UUID
            course=self.course,
            section_number="L01",
            academic_term=self.term,
            session_type="lab"
        )
        # Add time slot to session
        self.shared_session.time_slots.add(self.time_slot)
        
        # ✅ ADD: CourseOffering with required course_offering_id
        self.course_offering = CourseOffering.objects.create(
            course_offering_id=uuid.uuid4(),  # ← Add required UUID
            course=self.course,
            section_number="001",
            academic_term=self.term
        )
    
    def test_assignment_creation(self):
        """Test basic assignment creation"""
        assignment = Assignment.objects.create(
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler,
            notes="Test assignment"
        )
        
        self.assertEqual(assignment.student, self.student)
        self.assertEqual(assignment.course, self.course)
        self.assertEqual(assignment.shared_session, self.shared_session)
        self.assertTrue(assignment.is_active)
        self.assertEqual(assignment.role, 'ta')
    
    def test_assignment_hours_calculation(self):
        """Test hours calculation from time slots"""
        assignment = Assignment.objects.create(
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler
        )
        
        # Should calculate 2 hours from the time slot
        self.assertEqual(assignment.weekly_hours, 2.0)
        self.assertEqual(assignment.required_hours_category, '3')
    
    def test_assignment_string_representation(self):
        """Test assignment __str__ method"""
        assignment = Assignment.objects.create(
            student=self.student,
            course=self.course,
            shared_session=self.shared_session,
            assigned_by=self.ta_scheduler
        )
        
        expected = f"Assignment {assignment.assignment_id} - {self.student.name} (2.0h/week)"
        self.assertEqual(str(assignment), expected)