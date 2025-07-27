"""
Test cases for validating that archived terms and courses cannot be used for new creation.
Tests that course offerings, shared sessions, and instructor requests properly validate
that they cannot be created with archived terms or courses.
"""
import pytest
from rest_framework import status
from django.urls import reverse
from api.models import Term, Course, CourseOffering, SharedSession, InstructorRequest


@pytest.mark.django_db
class TestArchivedTermValidation:
    """Test validation when attempting to create records using archived terms."""
    
    def test_cannot_create_course_offering_with_archived_term(self, authenticated_admin_client, sample_course, sample_instructor):
        """Test that creating a course offering with archived term fails."""
        # Create an archived term
        archived_term = Term.objects.create(
            code='ARCHIVED2025',
            description='Archived Term',
            start='2025-01-01',
            end='2025-04-30',
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear='2024/25',
            term_type='winter',
            is_active=False  # Archived
        )
        
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'section_number': '001',
            'term_id': archived_term.id,
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived term' in response.data['term_id'][0].lower()
        assert archived_term.code in response.data['term_id'][0]
    
    def test_cannot_create_shared_session_with_archived_term(self, authenticated_admin_client, sample_course, sample_student):
        """Test that creating a shared session with archived term fails."""
        # Create an archived term
        archived_term = Term.objects.create(
            code='ARCHIVED2025',
            description='Archived Term',
            start='2025-01-01',
            end='2025-04-30',
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear='2024/25',
            term_type='winter',
            is_active=False  # Archived
        )
        
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': sample_course.id,
            'section_number': 'L01',
            'academic_term_id': archived_term.id,
            'student_id': sample_student.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived term' in response.data['academic_term_id'][0].lower()
        assert archived_term.code in response.data['academic_term_id'][0]
    
    def test_can_create_course_offering_with_active_term(self, authenticated_admin_client, sample_course, sample_instructor, sample_term):
        """Test that creating a course offering with active term succeeds."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'section_number': '001',
            'term_id': sample_term.id,
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['term_info'] == str(sample_term)
    
    def test_can_create_shared_session_with_active_term(self, authenticated_admin_client, sample_course, sample_student, sample_term):
        """Test that creating a shared session with active term succeeds."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': sample_course.id,
            'section_number': 'L01',
            'academic_term_id': sample_term.id,
            'student_id': sample_student.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['academic_term_info'] == str(sample_term)


@pytest.mark.django_db
class TestArchivedCourseValidation:
    """Test validation when attempting to create records using archived courses."""
    
    def test_cannot_create_course_offering_with_archived_course(self, authenticated_admin_client, sample_term, sample_instructor, sample_department):
        """Test that creating a course offering with archived course fails."""
        # Create an archived course
        archived_course = Course.objects.create(
            course_number='ARCH101',
            course_name='Archived Course',
            department=sample_department,
            course_description='This course is archived',
            course_level='100',
            is_active=False  # Archived
        )
        
        url = reverse('courseoffering-list')
        data = {
            'course_id': archived_course.id,
            'section_number': '001',
            'term_id': sample_term.id,
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived course' in response.data['course_id'][0].lower()
        assert archived_course.course_number in response.data['course_id'][0]
    
    def test_cannot_create_shared_session_with_archived_course(self, authenticated_admin_client, sample_term, sample_student, sample_department):
        """Test that creating a shared session with archived course fails."""
        # Create an archived course
        archived_course = Course.objects.create(
            course_number='ARCH101',
            course_name='Archived Course',
            department=sample_department,
            course_description='This course is archived',
            course_level='100',
            is_active=False  # Archived
        )
        
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': archived_course.id,
            'section_number': 'L01',
            'academic_term_id': sample_term.id,
            'student_id': sample_student.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived course' in response.data['course_id'][0].lower()
        assert archived_course.course_number in response.data['course_id'][0]
    
    def test_can_create_course_offering_with_active_course(self, authenticated_admin_client, sample_course, sample_instructor, sample_term):
        """Test that creating a course offering with active course succeeds."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'section_number': '001',
            'term_id': sample_term.id,
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['course_info'] == str(sample_course)
    
    def test_can_create_shared_session_with_active_course(self, authenticated_admin_client, sample_course, sample_student, sample_term):
        """Test that creating a shared session with active course succeeds."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': sample_course.id,
            'section_number': 'L01',
            'academic_term_id': sample_term.id,
            'student_id': sample_student.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['course_info'] == str(sample_course)


@pytest.mark.django_db
class TestArchivedCourseOfferingValidation:
    """Test validation for instructor requests using archived course offerings."""
    
    def test_cannot_create_instructor_request_with_archived_course_offering(self, authenticated_instructor_client, sample_instructor, sample_course, sample_term):
        """Test that creating an instructor request with archived course offering fails."""
        # Create a course offering and then archive it
        course_offering = CourseOffering.objects.create(
            course=sample_course,
            section_number='001',
            academic_term=sample_term,
            instructor=sample_instructor,
            is_active=False  # Archived
        )
        
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': course_offering.course_offering_id,
            'request_date': '2025-08-15',
            'request_description': ['Request to teach this course']
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived course offering' in response.data['course_offering_id'][0].lower()
        
        # Clean up - delete the created course offering
        course_offering.delete()
    
    def test_cannot_create_instructor_request_with_course_offering_in_archived_term(self, authenticated_instructor_client, sample_instructor, sample_course):
        """Test that creating an instructor request with course offering in archived term fails."""
        # Create an archived term
        archived_term = Term.objects.create(
            code='ARCHIVED2025',
            description='Archived Term',
            start='2025-01-01',
            end='2025-04-30',
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear='2024/25',
            term_type='winter',
            is_active=False  # Archived
        )
        
        # Create a course offering in the archived term
        course_offering = CourseOffering.objects.create(
            course=sample_course,
            section_number='001',
            academic_term=archived_term,
            instructor=sample_instructor,
            is_active=True
        )
        
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': course_offering.course_offering_id,
            'request_date': '2025-08-15',
            'request_description': ['Request to teach this course']
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived term' in response.data['course_offering_id'][0].lower()
        assert archived_term.code in response.data['course_offering_id'][0]
        
        # Clean up - delete the created objects
        course_offering.delete()
        archived_term.delete()
    
    def test_cannot_create_instructor_request_with_course_offering_for_archived_course(self, authenticated_instructor_client, sample_instructor, sample_term, sample_department):
        """Test that creating an instructor request with course offering for archived course fails."""
        # Create an archived course
        archived_course = Course.objects.create(
            course_number='ARCH101',
            course_name='Archived Course',
            department=sample_department,
            course_description='This course is archived',
            course_level='100',
            is_active=False  # Archived
        )
        
        # Create a course offering for the archived course
        course_offering = CourseOffering.objects.create(
            course=archived_course,
            section_number='001',
            academic_term=sample_term,
            instructor=sample_instructor,
            is_active=True
        )
        
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': course_offering.course_offering_id,
            'request_date': '2025-08-15',
            'request_description': ['Request to teach this course']
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived course' in response.data['course_offering_id'][0].lower()
        assert archived_course.course_number in response.data['course_offering_id'][0]
        
        # Clean up - delete the created objects
        course_offering.delete()
        archived_course.delete()
    
    def test_can_create_instructor_request_with_active_course_offering(self, authenticated_instructor_client, sample_instructor, sample_course, sample_term):
        """Test that creating an instructor request with active course offering succeeds."""
        # Create an active course offering
        course_offering = CourseOffering.objects.create(
            course=sample_course,
            section_number='001',
            academic_term=sample_term,
            instructor=sample_instructor,
            is_active=True
        )
        
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': course_offering.course_offering_id,
            'request_date': '2025-08-15',
            'request_description': ['Request to teach this course']
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['course_offering_info'] == str(course_offering)
        
        # Clean up - delete the created instructor request
        if response.status_code == status.HTTP_201_CREATED:
            request_id = response.data['request_id']
            InstructorRequest.objects.filter(request_id=request_id).delete()
        
        # Clean up - delete the created course offering
        course_offering.delete()


@pytest.mark.django_db
class TestUpdateValidationWithArchivedRecords:
    """Test validation when updating records with archived relationships."""
    
    def test_cannot_update_course_offering_to_archived_term(self, authenticated_admin_client, sample_course, sample_instructor, sample_term):
        """Test that updating a course offering to use an archived term fails."""
        # Create a course offering
        course_offering = CourseOffering.objects.create(
            course=sample_course,
            section_number='001',
            academic_term=sample_term,
            instructor=sample_instructor
        )
        
        # Create an archived term
        archived_term = Term.objects.create(
            code='ARCHIVED2025',
            description='Archived Term',
            start='2025-01-01',
            end='2025-04-30',
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear='2024/25',
            term_type='winter',
            is_active=False  # Archived
        )
        
        url = reverse('courseoffering-detail', kwargs={'pk': course_offering.course_offering_id})
        data = {
            'course_id': sample_course.id,
            'section_number': '001',
            'term_id': archived_term.id,
            'instructor_id': sample_instructor.id
        }
        
        response = authenticated_admin_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived term' in response.data['term_id'][0].lower()
    
    def test_cannot_update_shared_session_to_archived_course(self, authenticated_admin_client, sample_course, sample_student, sample_term, sample_department):
        """Test that updating a shared session to use an archived course fails."""
        # Create a shared session
        shared_session = SharedSession.objects.create(
            session_type='lab',
            course=sample_course,
            section_number='L01',
            academic_term=sample_term,
            student=sample_student
        )
        
        # Create an archived course
        archived_course = Course.objects.create(
            course_number='ARCH101',
            course_name='Archived Course',
            department=sample_department,
            course_description='This course is archived',
            course_level='100',
            is_active=False  # Archived
        )
        
        url = reverse('sharedsession-detail', kwargs={'pk': shared_session.shared_session_id})
        data = {
            'session_type': 'lab',
            'course_id': archived_course.id,
            'section_number': 'L01',
            'academic_term_id': sample_term.id,
            'student_id': sample_student.id
        }
        
        response = authenticated_admin_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'archived course' in response.data['course_id'][0].lower()
