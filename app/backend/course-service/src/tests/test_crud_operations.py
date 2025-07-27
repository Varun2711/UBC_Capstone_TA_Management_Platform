"""
Test cases for CRUD operations and validation on all models.
Tests creation, reading, updating, and deletion with proper permissions.
"""
import pytest
from rest_framework import status
from django.urls import reverse
from api.models import Term, Course, CourseOffering, SharedSession, TimeSlot, InstructorRequest


@pytest.mark.django_db
class TestTermCRUD:
    """Test CRUD operations for Terms."""
    
    def test_authenticated_user_can_list_terms(self, authenticated_admin_client, sample_term):
        """Test that authenticated users can list terms."""
        url = reverse('term-list')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results'] if 'results' in response.data else response.data) >= 1
    
    def test_admin_can_create_term(self, authenticated_admin_client):
        """Test that admin users can create terms."""
        url = reverse('term-list')
        data = {
            'code': 'S2025T1',
            'description': 'Summer 2025 Term 1',
            'start': '2025-05-01',
            'end': '2025-08-31',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'summer',
            'is_active': True
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == data['code']
        assert response.data['term_type'] == data['term_type']
    
    def test_create_term_missing_required_fields(self, authenticated_admin_client):
        """Test that creating a term without required fields fails."""
        url = reverse('term-list')
        data = {
            'code': 'INCOMPLETE'
            # Missing required fields: description, start, end, etc.
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_term_invalid_dates(self, authenticated_admin_client):
        """Test that creating a term with start date after end date fails."""
        url = reverse('term-list')
        data = {
            'code': 'INVALID',
            'description': 'Invalid Term',
            'start': '2025-08-31',  # Start after end
            'end': '2025-05-01',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'summer'
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_admin_can_update_term(self, authenticated_admin_client, sample_term):
        """Test that admin users can update terms."""
        url = reverse('term-detail', kwargs={'pk': sample_term.id})
        data = {
            'description': 'Updated Winter 2025 Term 1'
        }
        
        response = authenticated_admin_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['description'] == data['description']
    
    def test_admin_can_delete_term(self, authenticated_admin_client, sample_department):
        """Test that admin users can delete terms."""
        # Create a term specifically for deletion
        term_to_delete = Term.objects.create(
            code="DELETE_ME",
            description="Term to be deleted",
            start="2025-01-01",
            end="2025-04-30",
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        
        url = reverse('term-detail', kwargs={'pk': term_to_delete.id})
        response = authenticated_admin_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify the term is deleted
        assert not Term.objects.filter(id=term_to_delete.id).exists()


@pytest.mark.django_db
class TestCourseCRUD:
    """Test CRUD operations for Courses."""
    
    def test_authenticated_user_can_list_courses(self, authenticated_admin_client, sample_course):
        """Test that authenticated users can list courses."""
        url = reverse('course-list')
        response = authenticated_admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_scheduler_can_create_course(self, authenticated_scheduler_client, sample_department):
        """Test that scheduler users can create courses."""
        url = reverse('course-list')
        data = {
            'course_number': 'COSC 499',
            'course_name': 'Capstone Software Engineering Project',
            'department': sample_department.id,
            'course_description': 'Senior capstone project',
            'course_level': '400'
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['course_number'] == data['course_number']
        assert response.data['course_name'] == data['course_name']
    
    def test_create_course_missing_required_fields(self, authenticated_scheduler_client):
        """Test that creating a course without required fields fails."""
        url = reverse('course-list')
        data = {
            'course_number': 'COSC 999'
            # Missing required fields: course_name, department
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_course_empty_course_number(self, authenticated_scheduler_client, sample_department):
        """Test that creating a course with empty course number fails."""
        url = reverse('course-list')
        data = {
            'course_number': '',  # Empty course number
            'course_name': 'Test Course',
            'department': sample_department.id
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_student_cannot_create_course(self, authenticated_student_client, sample_department):
        """Test that student users cannot create courses."""
        url = reverse('course-list')
        data = {
            'course_number': 'COSC 999',
            'course_name': 'Test Course',
            'department': sample_department.id
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCourseOfferingCRUD:
    """Test CRUD operations for Course Offerings."""
    
    def test_scheduler_can_create_course_offering(self, authenticated_scheduler_client, sample_course, sample_term, sample_instructor):
        """Test that scheduler users can create course offerings."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'term_id': sample_term.id,
            'section_number': '002',
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['section_number'] == data['section_number']
    
    def test_create_course_offering_with_time_slots(self, authenticated_scheduler_client, sample_course, sample_term, sample_instructor):
        """Test creating course offering with time slots."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'term_id': sample_term.id,
            'section_number': '003',
            'instructor_id': sample_instructor.id,
            'time_slots': [
                {
                    'day': 'monday',
                    'start_time': '10:00:00',
                    'end_time': '11:30:00'
                },
                {
                    'day': 'wednesday',
                    'start_time': '10:00:00',
                    'end_time': '11:30:00'
                }
            ]
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['time_slots_info']) == 2
    
    def test_create_course_offering_missing_required_fields(self, authenticated_scheduler_client):
        """Test that creating course offering without required fields fails."""
        url = reverse('courseoffering-list')
        data = {
            'section_number': '004'
            # Missing required fields: course_id, term_id
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_course_offering_empty_section_number(self, authenticated_scheduler_client, sample_course, sample_term):
        """Test that creating course offering with empty section number fails."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'term_id': sample_term.id,
            'section_number': ''  # Empty section number
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_student_cannot_create_course_offering(self, authenticated_student_client, sample_course, sample_term):
        """Test that student users cannot create course offerings."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'term_id': sample_term.id,
            'section_number': '005'
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSharedSessionCRUD:
    """Test CRUD operations for Shared Sessions."""
    
    def test_scheduler_can_create_shared_session(self, authenticated_scheduler_client, sample_course, sample_term, sample_student):
        """Test that scheduler users can create shared sessions."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'tutorial',
            'course_id': sample_course.id,
            'academic_term_id': sample_term.id,
            'section_number': 'T01',
            'student_id': sample_student.id
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['session_type'] == data['session_type']
        assert response.data['section_number'] == data['section_number']
    
    def test_create_shared_session_invalid_session_type(self, authenticated_scheduler_client, sample_course, sample_term):
        """Test that creating shared session with invalid session type fails."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'invalid_type',  # Invalid session type
            'course_id': sample_course.id,
            'academic_term_id': sample_term.id,
            'section_number': 'T02'
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_shared_session_empty_section_number(self, authenticated_scheduler_client, sample_course, sample_term):
        """Test that creating shared session with empty section number fails."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': sample_course.id,
            'academic_term_id': sample_term.id,
            'section_number': ''  # Empty section number
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_student_cannot_create_shared_session(self, authenticated_student_client, sample_course, sample_term):
        """Test that student users cannot create shared sessions."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'seminar',
            'course_id': sample_course.id,
            'academic_term_id': sample_term.id,
            'section_number': 'S01'
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestTimeSlotValidation:
    """Test TimeSlot validation."""
    
    def test_create_timeslot_invalid_time_order(self, authenticated_admin_client):
        """Test that creating time slot with end time before start time fails."""
        # This would be tested when creating course offerings or shared sessions with time slots
        data = {
            'day': 'monday',
            'start_time': '11:00:00',
            'end_time': '10:00:00'  # End before start
        }
        
        # We test this through course offering creation
        from api.serializers import TimeSlotInputSerializer
        serializer = TimeSlotInputSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'non_field_errors' in serializer.errors


@pytest.mark.django_db
class TestInstructorRequestCRUD:
    """Test CRUD operations for Instructor Requests."""
    
    def test_instructor_can_create_request(self, authenticated_instructor_client, sample_instructor, sample_course_offering):
        """Test that instructor users can create requests."""
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_description': ['Need additional TA support', 'Lab equipment required'],
            'request_date': '2025-08-15'  # Use future date to avoid date validation issues
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['request_description']) == 2
        
        # Clean up - delete the created instructor request
        if response.status_code == status.HTTP_201_CREATED:
            request_id = response.data['request_id']
            InstructorRequest.objects.filter(request_id=request_id).delete()
    
    def test_create_request_empty_description(self, authenticated_instructor_client, sample_instructor, sample_course_offering):
        """Test that creating request with empty description fails."""
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_description': [],  # Empty description array
            'request_date': '2025-08-15'  # Use future date to avoid date validation issues
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_student_cannot_create_instructor_request(self, authenticated_student_client, sample_instructor, sample_course_offering):
        """Test that student users cannot create instructor requests."""
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_description': ['Test request'],
            'request_date': '2025-08-15'  # Use future date to avoid date validation issues
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
