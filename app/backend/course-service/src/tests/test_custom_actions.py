"""
Test cases for custom API actions and filtering functionality.
Tests custom actions like current terms, archived items, filtering, searching, and ordering.
"""
import pytest
from rest_framework import status
from django.urls import reverse
from datetime import date, timedelta
from api.models import Term, Course, CourseOffering, SharedSession


@pytest.mark.django_db
class TestTermCustomActions:
    """Test custom actions for Terms."""
    
    def test_get_active_terms(self, authenticated_admin_client, sample_term):
        """Test getting active terms."""
        url = reverse('term-active')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # All returned terms should be active
        for term in response.data:
            assert term['is_active'] == True
    
    def test_get_current_terms(self, authenticated_admin_client, sample_department):
        """Test getting current terms based on date range."""
        # Create a current term
        today = date.today()
        current_term = Term.objects.create(
            code="CURRENT",
            description="Current Term",
            start=today - timedelta(days=30),
            end=today + timedelta(days=30),
            startCalendarYear=today.year,
            endCalendarYear=today.year,
            academicYear=f"{today.year-1}/{str(today.year)[-2:]}",
            term_type="winter",
            is_active=True
        )
        
        url = reverse('term-current')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        current_codes = [term['code'] for term in response.data]
        assert current_term.code in current_codes
    
    def test_get_terms_by_year(self, authenticated_admin_client, sample_term):
        """Test getting terms by calendar year."""
        url = reverse('term-by-year') + '?year=2025'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for term in response.data:
            assert term['startCalendarYear'] == 2025
    
    def test_get_term_subterms(self, authenticated_admin_client, sample_term, sample_department):
        """Test getting subterms of a term."""
        # Create a subterm
        subterm = Term.objects.create(
            code="W2025T1_SUB",
            description="Winter 2025 Term 1 Subset",
            start=date(2025, 1, 6),
            end=date(2025, 2, 28),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter",
            subsetOf=sample_term
        )
        
        url = reverse('term-subterms', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        subterm_codes = [term['code'] for term in response.data]
        assert subterm.code in subterm_codes
    
    def test_get_term_course_offerings(self, authenticated_admin_client, sample_term, sample_course_offering):
        """Test getting course offerings for a specific term."""
        url = reverse('term-course-offerings', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        offering_ids = [str(offering['course_offering_id']) for offering in response.data]
        assert str(sample_course_offering.course_offering_id) in offering_ids


@pytest.mark.django_db
class TestCourseCustomActions:
    """Test custom actions for Courses."""
    
    def test_get_courses_by_department(self, authenticated_admin_client, sample_course):
        """Test getting courses by department."""
        url = reverse('course-by-department') + f'?department_id={sample_course.department.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for course in response.data:
            assert course['department_id'] == sample_course.department.id
    
    def test_get_courses_by_level(self, authenticated_admin_client, sample_course):
        """Test getting courses by level."""
        url = reverse('course-by-level') + f'?level={sample_course.course_level}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for course in response.data:
            assert course['course_level'] == sample_course.course_level
    
    def test_get_course_offerings(self, authenticated_admin_client, sample_course, sample_course_offering):
        """Test getting all offerings for a specific course."""
        url = reverse('course-offerings', kwargs={'pk': sample_course.id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        offering_ids = [str(offering['course_offering_id']) for offering in response.data]
        assert str(sample_course_offering.course_offering_id) in offering_ids
    
    def test_get_course_current_offerings(self, authenticated_admin_client, sample_course, sample_course_offering):
        """Test getting current offerings for a specific course."""
        url = reverse('course-current-offerings', kwargs={'pk': sample_course.id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_course_full_details(self, authenticated_admin_client, sample_course):
        """Test getting full course details."""
        url = reverse('course-full-details', kwargs={'pk': sample_course.id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_all_courses_full_details(self, authenticated_admin_client, sample_course):
        """Test getting full details for all courses."""
        url = reverse('course-all-full-details')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCourseOfferingCustomActions:
    """Test custom actions for Course Offerings."""
    
    def test_get_current_course_offerings(self, authenticated_admin_client, sample_course_offering):
        """Test getting current course offerings."""
        url = reverse('courseoffering-current')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_course_offerings_by_term(self, authenticated_admin_client, sample_course_offering):
        """Test getting course offerings by term."""
        url = reverse('courseoffering-by-term') + f'?term_id={sample_course_offering.academic_term.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for offering in response.data:
            # Note: The API might return term_info instead of direct term_id
            assert 'term_info' in offering or offering.get('academic_term') == sample_course_offering.academic_term.id
    
    def test_get_course_offerings_by_course(self, authenticated_admin_client, sample_course_offering):
        """Test getting course offerings by course."""
        url = reverse('courseoffering-by-course') + f'?course_id={sample_course_offering.course.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for offering in response.data:
            assert 'course_info' in offering or offering.get('course') == sample_course_offering.course.id
    
    def test_get_course_offerings_by_instructor(self, authenticated_instructor_client, sample_course_offering):
        """Test getting course offerings by instructor."""
        url = reverse('courseoffering-by-instructor') + f'?instructor_id={sample_course_offering.instructor.id}'
        response = authenticated_instructor_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_course_offerings_by_year(self, authenticated_admin_client, sample_course_offering):
        """Test getting course offerings by year."""
        year = sample_course_offering.academic_term.startCalendarYear
        url = reverse('courseoffering-by-year') + f'?year={year}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestSharedSessionCustomActions:
    """Test custom actions for Shared Sessions."""
    
    def test_get_current_shared_sessions(self, authenticated_admin_client, sample_shared_session):
        """Test getting current shared sessions."""
        url = reverse('sharedsession-current')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_shared_sessions_by_term(self, authenticated_admin_client, sample_shared_session):
        """Test getting shared sessions by term."""
        url = reverse('sharedsession-by-term') + f'?academic_term_id={sample_shared_session.academic_term.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_shared_sessions_by_course(self, authenticated_admin_client, sample_shared_session):
        """Test getting shared sessions by course."""
        url = reverse('sharedsession-by-course') + f'?course_id={sample_shared_session.course.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_shared_sessions_by_session_type(self, authenticated_admin_client, sample_shared_session):
        """Test getting shared sessions by session type."""
        url = reverse('sharedsession-by-session-type') + f'?session_type={sample_shared_session.session_type}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data:
            assert session['session_type'].lower() == sample_shared_session.session_type.lower()
    
    def test_get_shared_sessions_by_student(self, authenticated_student_client, sample_shared_session):
        """Test getting shared sessions by student."""
        url = reverse('sharedsession-by-student') + f'?student_id={sample_shared_session.student.id}'
        response = authenticated_student_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_shared_sessions_by_year(self, authenticated_admin_client, sample_shared_session):
        """Test getting shared sessions by year."""
        year = sample_shared_session.academic_term.startCalendarYear
        url = reverse('sharedsession-by-year') + f'?year={year}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_shared_session_time_slots(self, authenticated_admin_client, sample_shared_session):
        """Test getting time slots for a specific shared session."""
        url = reverse('sharedsession-time-slots', kwargs={'pk': sample_shared_session.shared_session_id})
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_get_session_types(self, authenticated_admin_client):
        """Test getting available session type choices."""
        url = reverse('sharedsession-session-types')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'session_types' in response.data
        assert len(response.data['session_types']) > 0
        
        # Verify expected session types
        session_type_values = [choice['value'] for choice in response.data['session_types']]
        expected_types = ['lab', 'tutorial', 'seminar']
        for expected_type in expected_types:
            assert expected_type in session_type_values


@pytest.mark.django_db
class TestInstructorRequestCustomActions:
    """Test custom actions for Instructor Requests."""
    
    def test_get_requests_by_instructor(self, authenticated_admin_client, sample_instructor_request):
        """Test getting requests by instructor."""
        url = reverse('instructorrequest-by-instructor') + f'?instructor_id={sample_instructor_request.instructor.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_requests_by_course_offering(self, authenticated_admin_client, sample_instructor_request):
        """Test getting requests by course offering."""
        url = reverse('instructorrequest-by-course-offering') + f'?course_offering_id={sample_instructor_request.course_offering.course_offering_id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_recent_requests(self, authenticated_admin_client, sample_instructor_request):
        """Test getting recent requests (last 30 days)."""
        url = reverse('instructorrequest-recent')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_requests_by_term(self, authenticated_admin_client, sample_instructor_request):
        """Test getting requests by term."""
        term_id = sample_instructor_request.course_offering.academic_term.id
        url = reverse('instructorrequest-by-term') + f'?term_id={term_id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestFilteringAndSearching:
    """Test filtering, searching, and ordering functionality."""
    
    def test_search_terms(self, authenticated_admin_client, sample_term):
        """Test searching terms."""
        url = reverse('term-list') + '?search=winter'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_search_courses(self, authenticated_admin_client, sample_course):
        """Test searching courses."""
        url = reverse('course-list') + '?search=programming'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_order_terms_by_year(self, authenticated_admin_client, sample_term):
        """Test ordering terms by year."""
        url = reverse('term-list') + '?ordering=-startCalendarYear'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_order_courses_by_number(self, authenticated_admin_client, sample_course):
        """Test ordering courses by course number."""
        url = reverse('course-list') + '?ordering=course_number'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_courses_by_department(self, authenticated_admin_client, sample_course):
        """Test filtering courses by department."""
        url = reverse('course-list') + f'?department={sample_course.department.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for course in response.data['results'] if 'results' in response.data else response.data:
            assert course['department_id'] == sample_course.department.id
    
    def test_filter_course_offerings_by_term(self, authenticated_admin_client, sample_course_offering):
        """Test filtering course offerings by term."""
        url = reverse('courseoffering-list') + f'?academic_term={sample_course_offering.academic_term.id}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_filter_shared_sessions_by_session_type(self, authenticated_admin_client, sample_shared_session):
        """Test filtering shared sessions by session type."""
        url = reverse('sharedsession-list') + f'?session_type={sample_shared_session.session_type}'
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data['results'] if 'results' in response.data else response.data:
            assert session['session_type'].lower() == sample_shared_session.session_type.lower()
