import os
import django
import pytest
from django.apps import apps
from django.contrib.auth.hashers import make_password

# Set test-specific Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')

def pytest_configure():
    """
    Make unmanaged models managed before any tests run.
    """
    from django.conf import settings
    if settings.configured:
        # Make all unmanaged models managed for testing
        unmanaged_models = []
        for app_config in apps.get_app_configs():
            unmanaged_models.extend([m for m in app_config.get_models() if not m._meta.managed])
        
        for model in unmanaged_models:
            model._meta.managed = True

@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """
    Load test data fixtures.
    """
    with django_db_blocker.unblock():
        pass # No fixtures to load for now, but this is where they would go.

@pytest.fixture
def test_users(db):
    """
    Fixture to create one of each user type for testing.
    """
    from api.models import Student, Instructor, TAScheduler, Admin
    
    student = Student.objects.create(
        student_number="11112222",
        name="Test Student",
        email="student@test.com",
        password=make_password("password123"),
        study_level="undergraduate",
        is_active=True
    )
    
    instructor = Instructor.objects.create(
        employee_number="I001",
        name="Test Instructor",
        email="instructor@test.com",
        password=make_password("password123"),
        is_active=True
    )
    
    scheduler = TAScheduler.objects.create(
        employee_number="S001",
        name="Test Scheduler",
        email="scheduler@test.com",
        password=make_password("password123"),
        is_active=True
    )
    
    admin = Admin.objects.create(
        employee_number="A001",
        name="Test Admin",
        email="admin@test.com",
        password=make_password("password123"),
        is_active=True
    )
    
    return {
        'student': student,
        'instructor': instructor,
        'scheduler': scheduler,
        'admin': admin
    }