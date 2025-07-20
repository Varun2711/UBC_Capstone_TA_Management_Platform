import pytest
from django.apps import apps


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
def sample_test_data():
    """
    Fixture to create commonly used test data.
    """
    from api.models import Department, TAScheduler, Student, Term, JobPosting
    from datetime import date, timedelta
    
    # Create test data - Remove Faculty since it doesn't exist
    department = Department.objects.create(name="Test Department")
    ta_scheduler = TAScheduler.objects.create(
        employee_number="TEST001",
        name="Test Scheduler",
        email="scheduler@test.com",
        department=department
    )
    student = Student.objects.create(
        student_number="87654321",
        name="Test Student",
        email="student@test.com",
        study_level="undergraduate",
        department=department,
        password="testpass"
    )
    term = Term.objects.create(
        code="TEST2025",
        description="Test Term 2025",
        start=date.today(),
        end=date.today() + timedelta(days=120),
        startCalendarYear=2025,
        endCalendarYear=2025,
        academicYear="2024/25",
        term_type="winter"
    )
    job_posting = JobPosting.objects.create(
        title="Test TA Position",
        description="Test description",
        post_date=date.today(),
        deadline_date=date.today() + timedelta(days=30),
        department=department,
        created_by=ta_scheduler,
        term=term,
        status='open'
    )
    
    return {
        'department': department,
        'ta_scheduler': ta_scheduler,
        'student': student,
        'term': term,
        'job_posting': job_posting
    }