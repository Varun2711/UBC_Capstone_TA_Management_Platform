"""
Test cases for archive functionality across all models (Terms, Courses, CourseOfferings, SharedSessions).
Tests admin-only permissions and proper archive/restore behavior.
"""
import pytest
from rest_framework import status
from django.urls import reverse
from api.models import Term, Course, CourseOffering, SharedSession


@pytest.mark.django_db
class TestTermArchiveFunctionality:
    """Test archive functionality for Terms."""
    
    @pytest.mark.django_db
    def test_admin_can_archive_term(self, authenticated_admin_client, sample_term):
        """Test that admin users can archive terms."""
        url = reverse('term-archive', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'term' in response.data
        assert response.data['term']['is_active'] == False
        
        # Verify in database
        sample_term.refresh_from_db()
        assert sample_term.is_active == False
    
    def test_admin_can_restore_term(self, authenticated_admin_client, sample_term):
        """Test that admin users can restore archived terms."""
        # First archive the term
        sample_term.is_active = False
        sample_term.save()
        
        url = reverse('term-restore', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['term']['is_active'] == True
        
        # Verify in database
        sample_term.refresh_from_db()
        assert sample_term.is_active == True
    
    def test_admin_can_list_archived_terms(self, authenticated_admin_client, sample_term, sample_department):
        """Test that admin users can list archived terms."""
        # Create and archive another term
        archived_term = Term.objects.create(
            code="S2025",
            description="Summer 2025",
            start="2025-05-01",
            end="2025-08-31",
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="summer",
            is_active=False
        )
        
        url = reverse('term-archived')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        archived_codes = [term['code'] for term in response.data]
        assert archived_term.code in archived_codes
    
    def test_non_admin_cannot_archive_term(self, authenticated_scheduler_client, sample_term):
        """Test that non-admin users cannot archive terms."""
        url = reverse('term-archive', kwargs={'pk': sample_term.id})
        response = authenticated_scheduler_client.patch(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_unauthenticated_cannot_archive_term(self, api_client, sample_term):
        """Test that unauthenticated users cannot archive terms."""
        url = reverse('term-archive', kwargs={'pk': sample_term.id})
        response = api_client.patch(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCourseArchiveFunctionality:
    """Test archive functionality for Courses."""
    
    def test_admin_can_archive_course(self, authenticated_admin_client, sample_course):
        """Test that admin users can archive courses."""
        url = reverse('course-archive', kwargs={'pk': sample_course.id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'course' in response.data
        assert response.data['course']['is_active'] == False
    
    def test_admin_can_restore_course(self, authenticated_admin_client, sample_course):
        """Test that admin users can restore archived courses."""
        # First archive the course
        sample_course.is_active = False
        sample_course.save()
        
        url = reverse('course-restore', kwargs={'pk': sample_course.id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['course']['is_active'] == True
    
    def test_admin_can_list_archived_courses(self, authenticated_admin_client, sample_department):
        """Test that admin users can list archived courses."""
        # Create and archive a course
        archived_course = Course.objects.create(
            course_number="COSC 499",
            course_name="Capstone Project",
            department=sample_department,
            course_description="Senior capstone",
            course_level="400",
            is_active=False
        )
        
        url = reverse('course-archived')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        archived_numbers = [course['course_number'] for course in response.data]
        assert archived_course.course_number in archived_numbers


@pytest.mark.django_db
class TestCourseOfferingArchiveFunctionality:
    """Test archive functionality for Course Offerings."""
    
    def test_admin_can_archive_course_offering(self, authenticated_admin_client, sample_course_offering):
        """Test that admin users can archive course offerings."""
        url = reverse('courseoffering-archive', kwargs={'pk': sample_course_offering.course_offering_id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'course_offering' in response.data
        assert response.data['course_offering']['is_active'] == False
    
    def test_admin_can_restore_course_offering(self, authenticated_admin_client, sample_course_offering):
        """Test that admin users can restore archived course offerings."""
        # First archive the offering
        sample_course_offering.is_active = False
        sample_course_offering.save()
        
        url = reverse('courseoffering-restore', kwargs={'pk': sample_course_offering.course_offering_id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['course_offering']['is_active'] == True
    
    def test_scheduler_cannot_archive_course_offering(self, authenticated_scheduler_client, sample_course_offering):
        """Test that scheduler users cannot archive course offerings."""
        url = reverse('courseoffering-archive', kwargs={'pk': sample_course_offering.course_offering_id})
        response = authenticated_scheduler_client.patch(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSharedSessionArchiveFunctionality:
    """Test archive functionality for Shared Sessions."""
    
    def test_admin_can_archive_shared_session(self, authenticated_admin_client, sample_shared_session):
        """Test that admin users can archive shared sessions."""
        url = reverse('sharedsession-archive', kwargs={'pk': sample_shared_session.shared_session_id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        assert 'shared_session' in response.data
        assert response.data['shared_session']['is_active'] == False
    
    def test_admin_can_restore_shared_session(self, authenticated_admin_client, sample_shared_session):
        """Test that admin users can restore archived shared sessions."""
        # First archive the session
        sample_shared_session.is_active = False
        sample_shared_session.save()
        
        url = reverse('sharedsession-restore', kwargs={'pk': sample_shared_session.shared_session_id})
        response = authenticated_admin_client.patch(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['shared_session']['is_active'] == True
    
    def test_admin_can_list_archived_shared_sessions(self, authenticated_admin_client, sample_course, sample_term, sample_student):
        """Test that admin users can list archived shared sessions."""
        # Create and archive a shared session
        archived_session = SharedSession.objects.create(
            session_type="tutorial",
            course=sample_course,
            section_number="T01",
            academic_term=sample_term,
            student=sample_student,
            is_active=False
        )
        
        url = reverse('sharedsession-archived')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        archived_sections = [session['section_number'] for session in response.data]
        assert archived_session.section_number in archived_sections
    
    def test_non_admin_cannot_archive_shared_session(self, authenticated_student_client, sample_shared_session):
        """Test that non-admin users cannot archive shared sessions."""
        url = reverse('sharedsession-archive', kwargs={'pk': sample_shared_session.shared_session_id})
        response = authenticated_student_client.patch(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestArchiveFilteringFunctionality:
    """Test filtering by is_active field."""
    
    def test_filter_active_terms(self, authenticated_admin_client, sample_term, sample_department):
        """Test filtering terms by is_active=true."""
        # Create an archived term
        Term.objects.create(
            code="ARCHIVED",
            description="Archived Term",
            start="2024-01-01",
            end="2024-04-30",
            startCalendarYear=2024,
            endCalendarYear=2024,
            academicYear="2023/24",
            term_type="winter",
            is_active=False
        )
        
        url = reverse('term-list') + '?is_active=true'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # All returned terms should be active
        for term in response.data['results'] if 'results' in response.data else response.data:
            assert term['is_active'] == True
    
    def test_filter_inactive_terms(self, authenticated_admin_client, sample_term, sample_department):
        """Test filtering terms by is_active=false."""
        # Create an archived term
        archived_term = Term.objects.create(
            code="ARCHIVED2",
            description="Another Archived Term",
            start="2024-01-01",
            end="2024-04-30",
            startCalendarYear=2024,
            endCalendarYear=2024,
            academicYear="2023/24",
            term_type="winter",
            is_active=False
        )
        
        url = reverse('term-list') + '?is_active=false'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # All returned terms should be inactive
        for term in response.data['results'] if 'results' in response.data else response.data:
            assert term['is_active'] == False
