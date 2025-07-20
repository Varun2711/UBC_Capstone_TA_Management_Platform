import os
import sys
import django
import pytest
import uuid
from django.apps import apps

# Set test-specific Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tests.test_settings')

def pytest_configure():
    """
    Make unmanaged models managed before any tests run.
    This runs very early in the pytest lifecycle.
    """
    from django.conf import settings
    if settings.configured:
        # Make all unmanaged models managed for testing
        unmanaged_models = []
        for app in apps.get_app_configs():
            unmanaged_models.extend([m for m in app.get_models() if not m._meta.managed])
        
        for model in unmanaged_models:
            model._meta.managed = True

@pytest.fixture(autouse=True)
def enable_db_access(db):
    """
    Automatically enable database access for all tests.
    """
    pass

@pytest.fixture
def complete_test_data():
    """
    Fixture with all required models for testing
    """
    from api.models import (
        Department, TAScheduler, Student, Term, JobPosting, 
        Application, ApplicationShortList, Course, TimeSlot,
        CourseOffering, SharedSession
    )
    from datetime import date, timedelta
    
    # Create test data with all required fields
    department = Department.objects.create(name="Computer Science")
    
    ta_scheduler = TAScheduler.objects.create(
        employee_number="TA001",
        name="Test Scheduler",
        email="scheduler@test.com",
        department=department,
        password="test_password",
        is_active=True
    )
    
    student = Student.objects.create(
        student_number="12345678",
        name="Test Student",
        email="student@test.com",
        study_level="undergraduate",
        department=department,
        is_active=True
    )
    
    term = Term.objects.create(
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
    
    job_posting = JobPosting.objects.create(posting_id=1)
    
    application = Application.objects.create(
        student=student,
        posting=job_posting,
        status='submitted',
        workload='12',
        disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'},
        citizenshipStatus='citizen',
        residingInKelowna='yes',
        fullTimeEnrollment='yes',
        hasOtherPositions='no',
        termSelection=term
    )
    
    shortlist = ApplicationShortList.objects.create(
        application=application,
        created_by=ta_scheduler,
        notes="Test shortlisted candidate"
    )
    
    course = Course.objects.create(
        course_number="COSC 121",
        course_name="Computer Programming II",
        department=department,
        course_level="200",
        is_active=True
    )
    
    time_slot = TimeSlot.objects.create(
        day="monday",
        start_time="09:00:00",
        end_time="10:00:00"
    )
    
    course_offering = CourseOffering.objects.create(
        course_offering_id=uuid.uuid4(),
        course=course,
        section_number="001",
        academic_term=term
    )
    
    shared_session = SharedSession.objects.create(
        shared_session_id=uuid.uuid4(),
        course=course,
        section_number="L01",
        academic_term=term,
        session_type="lab"
    )
    shared_session.time_slots.add(time_slot)
    
    return {
        'department': department,
        'ta_scheduler': ta_scheduler,
        'student': student,
        'term': term,
        'job_posting': job_posting,
        'application': application,
        'shortlist': shortlist,
        'course': course,
        'time_slot': time_slot,
        'course_offering': course_offering,
        'shared_session': shared_session
    }