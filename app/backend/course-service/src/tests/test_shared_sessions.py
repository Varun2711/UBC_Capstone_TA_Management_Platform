"""
Tests for SharedSession API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from api.models import SharedSession, Course, Term, Student, TimeSlot


@pytest.mark.django_db
class TestSharedSessionViewSet:
    """Test cases for SharedSession ViewSet endpoints."""
    
    def test_list_shared_sessions(self, api_client, sample_shared_session):
        """Test GET /shared-sessions/ - List all shared sessions."""
        url = reverse('sharedsession-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['session_type'] == sample_shared_session.session_type
    
    def test_retrieve_shared_session(self, api_client, sample_shared_session):
        """Test GET /shared-sessions/{id}/ - Retrieve a specific shared session."""
        url = reverse('sharedsession-detail', args=[sample_shared_session.shared_session_id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['session_type'] == sample_shared_session.session_type
        assert response.data['section_number'] == sample_shared_session.section_number
    
    def test_create_shared_session(self, api_client, sample_course, sample_term, sample_student, sample_time_slot):
        """Test POST /shared-sessions/ - Create a new shared session."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'tutorial',
            'course': sample_course.id,
            'section_number': 'T01',
            'academic_term': sample_term.id,
            'student': sample_student.id,
            'time_slots': [str(sample_time_slot.slot_id)]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['session_type'] == 'tutorial'
        assert SharedSession.objects.filter(section_number='T01').exists()
    
    def test_update_shared_session(self, api_client, sample_shared_session, sample_student):
        """Test PUT /shared-sessions/{id}/ - Update a shared session."""
        url = reverse('sharedsession-detail', args=[sample_shared_session.shared_session_id])
        data = {
            'session_type': 'tutorial',  # Changed from lab
            'course': sample_shared_session.course.id,
            'section_number': sample_shared_session.section_number,
            'academic_term': sample_shared_session.academic_term.id,
            'student': sample_student.id,
            'time_slots': [str(slot.slot_id) for slot in sample_shared_session.time_slots.all()]
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['session_type'] == 'tutorial'
    
    def test_partial_update_shared_session(self, api_client, sample_shared_session):
        """Test PATCH /shared-sessions/{id}/ - Partially update a shared session."""
        url = reverse('sharedsession-detail', args=[sample_shared_session.shared_session_id])
        data = {'session_type': 'tutorial'}
        response = api_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['session_type'] == 'tutorial'
        assert response.data['section_number'] == sample_shared_session.section_number
    
    def test_delete_shared_session(self, api_client, sample_shared_session):
        """Test DELETE /shared-sessions/{id}/ - Delete a shared session."""
        session_id = sample_shared_session.shared_session_id
        url = reverse('sharedsession-detail', args=[session_id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not SharedSession.objects.filter(shared_session_id=session_id).exists()
    
    def test_filter_by_course(self, api_client, sample_shared_session, sample_term, sample_student):
        """Test filtering shared sessions by course."""
        # Create another course and session
        other_course = Course.objects.create(
            course_number="COSC 121",
            course_name="Programming II",
            department=sample_shared_session.course.department,
            course_level="100",
            is_active=True
        )
        SharedSession.objects.create(
            session_type="lab",
            course=other_course,
            section_number="L01",
            academic_term=sample_term,
            student=sample_student
        )
        
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'course': sample_shared_session.course.id})
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data['results']:
            assert session['course'] == sample_shared_session.course.id
    
    def test_filter_by_session_type(self, api_client, sample_shared_session, sample_course, sample_term, sample_student):
        """Test filtering shared sessions by session type."""
        # Create a tutorial session
        SharedSession.objects.create(
            session_type="tutorial",
            course=sample_course,
            section_number="T01",
            academic_term=sample_term,
            student=sample_student
        )
        
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'session_type': 'lab'})
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data['results']:
            assert session['session_type'] == 'lab'
    
    def test_filter_by_term(self, api_client, sample_shared_session, sample_course, sample_student):
        """Test filtering shared sessions by academic term."""
        # Create another term and session
        other_term = Term.objects.create(
            code="S2025",
            description="Summer 2025",
            start="2025-05-01",
            end="2025-08-31",
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            is_active=True,
            term_type="summer"
        )
        SharedSession.objects.create(
            session_type="lab",
            course=sample_course,
            section_number="L01",
            academic_term=other_term,
            student=sample_student
        )
        
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'academic_term': sample_shared_session.academic_term.id})
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data['results']:
            assert session['academic_term'] == sample_shared_session.academic_term.id
    
    def test_filter_by_student(self, api_client, sample_shared_session, sample_course, sample_term, sample_department):
        """Test filtering shared sessions by student."""
        # Create another student and session
        other_student = Student.objects.create(
            student_number="87654321",
            name="Other Student",
            department=sample_department,
            email="other@test.com",
            password="testpass123",
            study_level="BSc",
            is_active=True
        )
        SharedSession.objects.create(
            session_type="lab",
            course=sample_course,
            section_number="L02",
            academic_term=sample_term,
            student=other_student
        )
        
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'student': sample_shared_session.student.id})
        
        assert response.status_code == status.HTTP_200_OK
        for session in response.data['results']:
            assert session['student'] == sample_shared_session.student.id
    
    def test_search_shared_sessions(self, api_client, sample_shared_session):
        """Test searching shared sessions."""
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'search': sample_shared_session.course.course_number.split()[0]})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_order_shared_sessions(self, api_client, sample_shared_session, sample_course, sample_term, sample_student):
        """Test ordering shared sessions."""
        # Create another session with different section number
        SharedSession.objects.create(
            session_type="tutorial",
            course=sample_course,
            section_number="T99",
            academic_term=sample_term,
            student=sample_student
        )
        
        url = reverse('sharedsession-list')
        response = api_client.get(url, {'ordering': 'section_number'})
        
        assert response.status_code == status.HTTP_200_OK
        sections = [session['section_number'] for session in response.data['results']]
        assert sections == sorted(sections)
    
    def test_invalid_shared_session_creation(self, api_client):
        """Test creating shared session with invalid data."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'invalid_type',  # Invalid session type
            'course': 999999,  # Invalid course
            'section_number': '',  # Empty section
            'academic_term': 999999,  # Invalid term
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_shared_session_not_found(self, api_client):
        """Test retrieving non-existent shared session."""
        url = reverse('sharedsession-detail', args=['00000000-0000-0000-0000-000000000000'])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_duplicate_shared_session(self, api_client, sample_shared_session):
        """Test creating duplicate shared session (same course, section, term)."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': sample_shared_session.session_type,
            'course': sample_shared_session.course.id,
            'section_number': sample_shared_session.section_number,
            'academic_term': sample_shared_session.academic_term.id,
            'student': sample_shared_session.student.id
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestSharedSessionModel:
    """Test cases for SharedSession model methods."""
    
    def test_shared_session_str_representation(self, sample_shared_session):
        """Test string representation of SharedSession."""
        expected = f"{sample_shared_session.course.course_number} {sample_shared_session.section_number} ({sample_shared_session.academic_term}) - {sample_shared_session.session_type}"
        assert str(sample_shared_session) == expected
    
    def test_shared_session_uuid_generation(self, sample_course, sample_term, sample_student):
        """Test that UUID is generated for shared session."""
        session = SharedSession.objects.create(
            session_type="lab",
            course=sample_course,
            section_number="L01",
            academic_term=sample_term,
            student=sample_student
        )
        
        assert session.shared_session_id is not None
        assert len(str(session.shared_session_id)) == 36  # UUID length
    
    def test_shared_session_time_slots_relationship(self, sample_shared_session, sample_time_slot):
        """Test many-to-many relationship with time slots."""
        # Add time slot
        sample_shared_session.time_slots.add(sample_time_slot)
        
        assert sample_time_slot in sample_shared_session.time_slots.all()
        assert sample_shared_session in sample_time_slot.lab_sections.all()
