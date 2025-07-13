"""
Tests for InstructorRequest API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from api.models import InstructorRequest, Instructor, CourseOffering


@pytest.mark.django_db
class TestInstructorRequestViewSet:
    """Test cases for InstructorRequest ViewSet endpoints."""
    
    def test_list_instructor_requests(self, api_client, sample_instructor_request):
        """Test GET /instructor-requests/ - List all instructor requests."""
        url = reverse('instructorrequest-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['request_description'] == sample_instructor_request.request_description
    
    def test_retrieve_instructor_request(self, api_client, sample_instructor_request):
        """Test GET /instructor-requests/{id}/ - Retrieve a specific instructor request."""
        url = reverse('instructorrequest-detail', args=[sample_instructor_request.request_id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['request_description'] == sample_instructor_request.request_description
        assert response.data['request_date'] == sample_instructor_request.request_date.isoformat()
    
    def test_create_instructor_request(self, api_client, sample_instructor, sample_course_offering):
        """Test POST /instructor-requests/ - Create a new instructor request."""
        from django.utils import timezone
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_date': timezone.now().date().isoformat(),
            'request_description': 'Need TAs for lab sections'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['request_description'] == 'Need TAs for lab sections'
        assert InstructorRequest.objects.filter(request_description='Need TAs for lab sections').exists()
    
    def test_update_instructor_request(self, api_client, sample_instructor_request):
        """Test PUT /instructor-requests/{id}/ - Update an instructor request."""
        from django.utils import timezone
        url = reverse('instructorrequest-detail', args=[sample_instructor_request.request_id])
        data = {
            'instructor_id': sample_instructor_request.instructor.id,
            'course_offering_id': sample_instructor_request.course_offering.course_offering_id,
            'request_date': timezone.now().date().isoformat(),
            'request_description': 'Updated request description'
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['request_description'] == 'Updated request description'
    
    def test_partial_update_instructor_request(self, api_client, sample_instructor_request):
        """Test PATCH /instructor-requests/{id}/ - Partially update an instructor request."""
        url = reverse('instructorrequest-detail', args=[sample_instructor_request.request_id])
        data = {'request_description': 'Partially updated description'}
        response = api_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['request_description'] == 'Partially updated description'
        assert response.data['request_date'] == sample_instructor_request.request_date.isoformat()
    
    def test_delete_instructor_request(self, api_client, sample_instructor_request):
        """Test DELETE /instructor-requests/{id}/ - Delete an instructor request."""
        request_id = sample_instructor_request.request_id
        url = reverse('instructorrequest-detail', args=[request_id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not InstructorRequest.objects.filter(request_id=request_id).exists()
    
    def test_filter_by_instructor(self, api_client, sample_instructor_request, sample_course_offering, sample_department):
        """Test filtering instructor requests by instructor."""
        from django.utils import timezone
        # Create another instructor and request
        other_instructor = Instructor.objects.create(
            instructor_number="98765432",
            name="Other Instructor",
            department=sample_department,
            email="other@instructor.com",
            password="testpass123",
            position="Assistant Professor",
            is_active=True
        )
        InstructorRequest.objects.create(
            instructor=other_instructor,
            course_offering=sample_course_offering,
            request_date=timezone.now().date(),
            request_description="Test request"
        )
        
        url = reverse('instructorrequest-list')
        response = api_client.get(url, {'instructor': sample_instructor_request.instructor.id})
        
        assert response.status_code == status.HTTP_200_OK
        for request in response.data['results']:
            assert request['instructor_id'] == sample_instructor_request.instructor.id
    
    def test_filter_by_course_offering(self, api_client, sample_instructor_request, sample_instructor, sample_course, sample_term):
        """Test filtering instructor requests by course offering."""
        from django.utils import timezone
        # Create another course offering and request
        other_offering = CourseOffering.objects.create(
            course=sample_course,
            academic_term=sample_term,
            section_number="002",
            enrollment_capacity=50,
            instructor=sample_instructor
        )
        InstructorRequest.objects.create(
            instructor=sample_instructor,
            course_offering=other_offering,
            request_date=timezone.now().date(),
            request_description="Test request"
        )
        
        url = reverse('instructorrequest-list')
        response = api_client.get(url, {'course_offering': sample_instructor_request.course_offering.course_offering_id})
        
        assert response.status_code == status.HTTP_200_OK
        for request in response.data['results']:
            assert request['course_offering_id'] == sample_instructor_request.course_offering.course_offering_id
    
    def test_search_instructor_requests(self, api_client, sample_instructor_request):
        """Test searching instructor requests."""
        url = reverse('instructorrequest-list')
        response = api_client.get(url, {'search': sample_instructor_request.instructor.name.split()[0]})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_order_instructor_requests(self, api_client, sample_instructor_request, sample_instructor, sample_course_offering):
        """Test ordering instructor requests by description."""
        from django.utils import timezone
        # Create request with different description for ordering
        InstructorRequest.objects.create(
            instructor=sample_instructor,
            course_offering=sample_course_offering,
            request_date=timezone.now().date(),
            request_description="AAA First request"
        )
        
        url = reverse('instructorrequest-list')
        response = api_client.get(url, {'ordering': 'request_description'})
        
        assert response.status_code == status.HTTP_200_OK
        descriptions = [request['request_description'] for request in response.data['results']]
        assert descriptions == sorted(descriptions)
    
    def test_order_by_date_created(self, api_client, sample_instructor_request):
        """Test ordering instructor requests by request date."""
        url = reverse('instructorrequest-list')
        response = api_client.get(url, {'ordering': '-request_date'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_invalid_instructor_request_creation(self, api_client):
        """Test creating instructor request with invalid data."""
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': 999999,  # Invalid instructor
            'course_offering_id': '00000000-0000-0000-0000-000000000000',  # Invalid course offering UUID
            'request_date': 'invalid-date',  # Invalid date format
            'request_description': '',  # Empty description
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_instructor_request_not_found(self, api_client):
        """Test retrieving non-existent instructor request."""
        url = reverse('instructorrequest-detail', args=[999999])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_request_description_validation(self, api_client, sample_instructor, sample_course_offering):
        """Test creating request with proper description."""
        from django.utils import timezone
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_date': timezone.now().date().isoformat(),
            'request_description': 'This is a valid request description'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['request_description'] == 'This is a valid request description'
    
    def test_request_date_validation(self, api_client, sample_instructor_request):
        """Test updating request with valid date."""
        from django.utils import timezone
        url = reverse('instructorrequest-detail', args=[sample_instructor_request.request_id])
        future_date = timezone.now().date() + timezone.timedelta(days=30)
        data = {'request_date': future_date.isoformat()}
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestInstructorRequestModel:
    """Test cases for InstructorRequest model methods."""
    
    def test_instructor_request_str_representation(self, sample_instructor_request):
        """Test string representation of InstructorRequest."""
        # InstructorRequest model doesn't have a custom __str__ method, so it uses default Django representation
        expected = f"InstructorRequest object ({sample_instructor_request.request_id})"
        assert str(sample_instructor_request) == expected
    
    def test_instructor_request_uuid_generation(self, sample_instructor, sample_course_offering):
        """Test that request_id is generated for instructor request."""
        from django.utils import timezone
        request = InstructorRequest.objects.create(
            instructor=sample_instructor,
            course_offering=sample_course_offering,
            request_date=timezone.now().date(),
            request_description="Test request description"
        )
        
        assert request.request_id is not None
        assert isinstance(request.request_id, int)  # AutoField generates integer
    
    def test_instructor_request_timestamps(self, sample_instructor, sample_course_offering):
        """Test that request_date is set."""
        from django.utils import timezone
        test_date = timezone.now().date()
        request = InstructorRequest.objects.create(
            instructor=sample_instructor,
            course_offering=sample_course_offering,
            request_date=test_date,
            request_description="Test request description"
        )
        
        assert request.request_date == test_date
        assert request.request_description == "Test request description"
    
    def test_instructor_request_relationships(self, sample_instructor_request):
        """Test relationships with other models."""
        assert sample_instructor_request.instructor is not None
        assert sample_instructor_request.course_offering is not None
        assert sample_instructor_request.instructor.name is not None
        assert sample_instructor_request.course_offering.course.course_name is not None
