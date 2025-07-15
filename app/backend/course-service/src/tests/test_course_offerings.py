"""
Tests for CourseOffering API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from api.models import CourseOffering, Course, Term, Instructor


@pytest.mark.django_db
class TestCourseOfferingViewSet:
    """Test cases for CourseOffering ViewSet endpoints."""
    
    def test_list_course_offerings(self, api_client, sample_course_offering):
        """Test GET /course-offerings/ - List all course offerings."""
        url = reverse('courseoffering-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['section_number'] == sample_course_offering.section_number
    
    def test_retrieve_course_offering(self, api_client, sample_course_offering):
        """Test GET /course-offerings/{id}/ - Retrieve a specific course offering."""
        url = reverse('courseoffering-detail', args=[sample_course_offering.course_offering_id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['section_number'] == sample_course_offering.section_number
        assert response.data['course'] == sample_course_offering.course.id
    
    def test_create_course_offering(self, api_client, sample_course, sample_term, sample_instructor):
        """Test POST /course-offerings/ - Create a new course offering."""
        url = reverse('courseoffering-list')
        data = {
            'course': sample_course.id,
            'section_number': '002',
            'academic_term': sample_term.id,
            'instructor': sample_instructor.id
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['section_number'] == '002'
        assert CourseOffering.objects.filter(section_number='002').exists()
    
    def test_update_course_offering(self, api_client, sample_course_offering, sample_instructor):
        """Test PUT /course-offerings/{id}/ - Update a course offering."""
        url = reverse('courseoffering-detail', args=[sample_course_offering.course_offering_id])
        data = {
            'course': sample_course_offering.course.id,
            'section_number': '003',  # Changed section number
            'academic_term': sample_course_offering.academic_term.id,
            'instructor': sample_instructor.id
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['section_number'] == '003'
    
    def test_partial_update_course_offering(self, api_client, sample_course_offering, sample_instructor):
        """Test PATCH /course-offerings/{id}/ - Partially update a course offering."""
        url = reverse('courseoffering-detail', args=[sample_course_offering.course_offering_id])
        data = {'instructor': sample_instructor.id}
        response = api_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['instructor'] == sample_instructor.id
    
    def test_delete_course_offering(self, api_client, sample_course_offering):
        """Test DELETE /course-offerings/{id}/ - Delete a course offering."""
        offering_id = sample_course_offering.course_offering_id
        url = reverse('courseoffering-detail', args=[offering_id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not CourseOffering.objects.filter(course_offering_id=offering_id).exists()
    
    def test_filter_by_course(self, api_client, sample_course_offering, sample_course, sample_term):
        """Test filtering course offerings by course."""
        # Create another course and offering
        other_course = Course.objects.create(
            course_number="COSC 121",
            course_name="Programming II",
            department=sample_course.department,
            course_level="100",
            is_active=True
        )
        CourseOffering.objects.create(
            course=other_course,
            section_number="001",
            academic_term=sample_term
        )
        
        url = reverse('courseoffering-list')
        response = api_client.get(url, {'course': sample_course.id})
        
        assert response.status_code == status.HTTP_200_OK
        for offering in response.data['results']:
            assert offering['course'] == sample_course.id
    
    def test_filter_by_term(self, api_client, sample_course_offering, sample_course):
        """Test filtering course offerings by academic term."""
        # Create another term and offering
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
        CourseOffering.objects.create(
            course=sample_course,
            section_number="001",
            academic_term=other_term
        )
        
        url = reverse('courseoffering-list')
        response = api_client.get(url, {'academic_term': sample_course_offering.academic_term.id})
        
        assert response.status_code == status.HTTP_200_OK
        for offering in response.data['results']:
            assert offering['academic_term'] == sample_course_offering.academic_term.id
    
    def test_filter_by_instructor(self, api_client, sample_course_offering, sample_course, sample_term):
        """Test filtering course offerings by instructor."""
        # Create another instructor and offering
        other_instructor = Instructor.objects.create(
            employee_number="EMP002",
            name="Dr. Other Instructor",
            department=sample_course.department,
            email="other@test.com",
            password="testpass123",
            is_active=True
        )
        CourseOffering.objects.create(
            course=sample_course,
            section_number="002",
            academic_term=sample_term,
            instructor=other_instructor
        )
        
        url = reverse('courseoffering-list')
        response = api_client.get(url, {'instructor': sample_course_offering.instructor.id})
        
        assert response.status_code == status.HTTP_200_OK
        for offering in response.data['results']:
            assert offering['instructor'] == sample_course_offering.instructor.id
    
    def test_search_course_offerings(self, api_client, sample_course_offering):
        """Test searching course offerings."""
        url = reverse('courseoffering-list')
        response = api_client.get(url, {'search': sample_course_offering.course.course_number.split()[0]})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_order_course_offerings(self, api_client, sample_course_offering, sample_course, sample_term):
        """Test ordering course offerings."""
        # Create another offering with different section number
        CourseOffering.objects.create(
            course=sample_course,
            section_number="999",
            academic_term=sample_term
        )
        
        url = reverse('courseoffering-list')
        response = api_client.get(url, {'ordering': 'section_number'})
        
        assert response.status_code == status.HTTP_200_OK
        sections = [offering['section_number'] for offering in response.data['results']]
        assert sections == sorted(sections)
    
    def test_invalid_course_offering_creation(self, api_client):
        """Test creating course offering with invalid data."""
        url = reverse('courseoffering-list')
        data = {
            'course': 999999,  # Invalid: non-existent course
            'section_number': '',  # Invalid: empty section
            'academic_term': 999999,  # Invalid: non-existent term
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_course_offering_not_found(self, api_client):
        """Test retrieving non-existent course offering."""
        url = reverse('courseoffering-detail', args=['00000000-0000-0000-0000-000000000000'])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_duplicate_course_offering(self, api_client, sample_course_offering):
        """Test creating duplicate course offering (same course, section, term)."""
        url = reverse('courseoffering-list')
        data = {
            'course': sample_course_offering.course.id,
            'section_number': sample_course_offering.section_number,
            'academic_term': sample_course_offering.academic_term.id
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestCourseOfferingModel:
    """Test cases for CourseOffering model methods."""
    
    def test_course_offering_str_representation(self, sample_course_offering):
        """Test string representation of CourseOffering."""
        expected = f"{sample_course_offering.course.course_number} {sample_course_offering.section_number} ({sample_course_offering.academic_term})"
        assert str(sample_course_offering) == expected
    
    def test_course_offering_uuid_generation(self, sample_course, sample_term):
        """Test that UUID is generated for course offering."""
        offering = CourseOffering.objects.create(
            course=sample_course,
            section_number="001",
            academic_term=sample_term
        )
        
        assert offering.course_offering_id is not None
        assert len(str(offering.course_offering_id)) == 36  # UUID length
