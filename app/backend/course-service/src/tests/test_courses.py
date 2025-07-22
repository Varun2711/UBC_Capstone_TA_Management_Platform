"""
Tests for Course API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from api.models import Course, Department


@pytest.mark.django_db
class TestCourseViewSet:
    """Test cases for Course ViewSet endpoints."""
    
    def test_list_courses(self, api_client, sample_course):
        """Test GET /courses/ - List all courses."""
        url = reverse('course-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['course_number'] == sample_course.course_number
    
    def test_retrieve_course(self, api_client, sample_course):
        """Test GET /courses/{id}/ - Retrieve a specific course."""
        url = reverse('course-detail', args=[sample_course.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['course_number'] == sample_course.course_number
        assert response.data['course_name'] == sample_course.course_name
    
    def test_create_course(self, api_client, sample_department):
        """Test POST /courses/ - Create a new course."""
        url = reverse('course-list')
        data = {
            'course_number': 'COSC 121',
            'course_name': 'Computer Programming II',
            'department': sample_department.id,
            'course_description': 'Object-oriented programming concepts',
            'course_level': '100',
            'is_active': True
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['course_number'] == 'COSC 121'
        assert Course.objects.filter(course_number='COSC 121').exists()
    
    def test_update_course(self, api_client, sample_course):
        """Test PUT /courses/{id}/ - Update a course."""
        url = reverse('course-detail', args=[sample_course.id])
        data = {
            'course_number': sample_course.course_number,
            'course_name': 'Updated Course Name',
            'department': sample_course.department.id,
            'course_description': 'Updated description',
            'course_level': sample_course.course_level,
            'is_active': False
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['course_name'] == 'Updated Course Name'
        assert response.data['is_active'] == False
    
    def test_partial_update_course(self, api_client, sample_course):
        """Test PATCH /courses/{id}/ - Partially update a course."""
        url = reverse('course-detail', args=[sample_course.id])
        data = {'is_active': False}
        response = api_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_active'] == False
        assert response.data['course_number'] == sample_course.course_number
    
    def test_delete_course(self, api_client, sample_course):
        """Test DELETE /courses/{id}/ - Delete a course."""
        url = reverse('course-detail', args=[sample_course.id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Course.objects.filter(id=sample_course.id).exists()
    
    def test_filter_courses_by_department(self, api_client, sample_course, sample_department):
        """Test filtering courses by department."""
        # Create another department and course
        other_dept = Department.objects.create(name="Mathematics")
        Course.objects.create(
            course_number="MATH 100",
            course_name="Calculus I",
            department=other_dept,
            course_description="Differential calculus",
            course_level="100",
            is_active=True
        )
        
        url = reverse('course-list')
        response = api_client.get(url, {'department': sample_department.id})
        
        assert response.status_code == status.HTTP_200_OK
        for course in response.data['results']:
            assert course['department_id'] == sample_department.id
    
    def test_filter_courses_by_level(self, api_client, sample_course):
        """Test filtering courses by course level."""
        # Create a course with different level
        Course.objects.create(
            course_number="COSC 400",
            course_name="Advanced Topic",
            department=sample_course.department,
            course_description="Advanced course",
            course_level="400",
            is_active=True
        )
        
        url = reverse('course-list')
        response = api_client.get(url, {'course_level': '100'})
        
        assert response.status_code == status.HTTP_200_OK
        for course in response.data['results']:
            assert course['course_level'] == '100'
    
    def test_search_courses(self, api_client, sample_course):
        """Test searching courses by course number or name."""
        url = reverse('course-list')
        response = api_client.get(url, {'search': 'Programming'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert any('Programming' in course['course_name'] for course in response.data['results'])
    
    def test_order_courses(self, api_client, sample_course):
        """Test ordering courses."""
        # Create another course
        Course.objects.create(
            course_number="COSC 099",
            course_name="Pre Programming",
            department=sample_course.department,
            course_description="Basic concepts",
            course_level="000",
            is_active=True
        )
        
        url = reverse('course-list')
        response = api_client.get(url, {'ordering': 'course_number'})
        
        assert response.status_code == status.HTTP_200_OK
        course_numbers = [course['course_number'] for course in response.data['results']]
        assert course_numbers == sorted(course_numbers)
    
    def test_invalid_course_creation(self, api_client, sample_department):
        """Test creating course with invalid data."""
        url = reverse('course-list')
        data = {
            'course_number': '',  # Invalid: empty course number
            'course_name': 'Test Course',
            'department': 999999,  # Invalid: non-existent department
            'course_level': '100'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_course_not_found(self, api_client):
        """Test retrieving non-existent course."""
        url = reverse('course-detail', args=[999999])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_duplicate_course_number(self, api_client, sample_course, sample_department):
        """Test creating course with duplicate course number."""
        url = reverse('course-list')
        data = {
            'course_number': sample_course.course_number,  # Duplicate
            'course_name': 'Another Course',
            'department': sample_department.id,
            'course_level': '200'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestCourseModel:
    """Test cases for Course model methods."""
    
    def test_course_str_representation(self, sample_course):
        """Test string representation of Course."""
        expected = f"{sample_course.course_number} {sample_course.course_name}"
        assert str(sample_course) == expected
    
    def test_course_creation_with_defaults(self, sample_department):
        """Test course creation with default values."""
        course = Course.objects.create(
            course_number="TEST 101",
            course_name="Test Course",
            department=sample_department,
            course_level="100"
        )
        
        assert course.is_active == True  # Default value
        assert course.course_description is None  # Default None value
