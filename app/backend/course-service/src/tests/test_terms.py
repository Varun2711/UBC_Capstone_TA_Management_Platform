"""
Tests for Term API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Term
from datetime import date


@pytest.mark.django_db
class TestTermViewSet:
    """Test cases for Term ViewSet endpoints."""
    
    def test_list_terms(self, api_client, sample_term):
        """Test GET /terms/ - List all terms."""
        url = reverse('term-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['code'] == sample_term.code
    
    def test_retrieve_term(self, api_client, sample_term):
        """Test GET /terms/{id}/ - Retrieve a specific term."""
        url = reverse('term-detail', args=[sample_term.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['code'] == sample_term.code
        assert response.data['description'] == sample_term.description
    
    def test_create_term(self, api_client):
        """Test POST /terms/ - Create a new term."""
        url = reverse('term-list')
        data = {
            'code': 'S2025',
            'description': 'Summer 2025',
            'start': '2025-05-01',
            'end': '2025-08-31',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'is_active': True,
            'term_type': 'summer'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['code'] == 'S2025'
        assert Term.objects.filter(code='S2025').exists()
    
    def test_update_term(self, api_client, sample_term):
        """Test PUT /terms/{id}/ - Update a term."""
        url = reverse('term-detail', args=[sample_term.id])
        data = {
            'code': sample_term.code,
            'description': 'Updated Description',
            'start': sample_term.start,
            'end': sample_term.end,
            'startCalendarYear': sample_term.startCalendarYear,
            'endCalendarYear': sample_term.endCalendarYear,
            'academicYear': sample_term.academicYear,
            'is_active': False,
            'term_type': sample_term.term_type
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['description'] == 'Updated Description'
        assert response.data['is_active'] == False
    
    def test_partial_update_term(self, api_client, sample_term):
        """Test PATCH /terms/{id}/ - Partially update a term."""
        url = reverse('term-detail', args=[sample_term.id])
        data = {'is_active': False}
        response = api_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_active'] == False
        assert response.data['code'] == sample_term.code  # Other fields unchanged
    
    def test_delete_term(self, api_client, sample_term):
        """Test DELETE /terms/{id}/ - Delete a term."""
        url = reverse('term-detail', args=[sample_term.id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Term.objects.filter(id=sample_term.id).exists()
    
    def test_filter_terms_by_active(self, api_client, sample_term):
        """Test filtering terms by is_active status."""
        # Create an inactive term
        Term.objects.create(
            code="INACTIVE",
            description="Inactive Term",
            start=date(2024, 1, 1),
            end=date(2024, 4, 30),
            startCalendarYear=2024,
            endCalendarYear=2024,
            academicYear="2023/24",
            is_active=False,
            term_type="winter"
        )
        
        url = reverse('term-list')
        response = api_client.get(url, {'is_active': 'true'})
        
        assert response.status_code == status.HTTP_200_OK
        assert all(term['is_active'] for term in response.data['results'])
    
    def test_search_terms(self, api_client, sample_term):
        """Test searching terms by code or description."""
        url = reverse('term-list')
        response = api_client.get(url, {'search': 'Winter'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert any('Winter' in term['description'] for term in response.data['results'])
    
    def test_order_terms(self, api_client, sample_term):
        """Test ordering terms."""
        url = reverse('term-list')
        response = api_client.get(url, {'ordering': '-startCalendarYear'})
        
        assert response.status_code == status.HTTP_200_OK
        years = [term['startCalendarYear'] for term in response.data['results']]
        assert years == sorted(years, reverse=True)
    
    def test_invalid_term_creation(self, api_client):
        """Test creating term with invalid data."""
        url = reverse('term-list')
        data = {
            'code': '',  # Invalid: empty code
            'description': 'Test Term',
            'start': '2025-01-01',
            'end': '2024-12-31',  # Invalid: end before start
            'startCalendarYear': 2025,
            'endCalendarYear': 2024,
            'academicYear': '2024/25'
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_term_not_found(self, api_client):
        """Test retrieving non-existent term."""
        url = reverse('term-detail', args=[999999])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestTermModel:
    """Test cases for Term model methods and properties."""
    
    def test_term_str_representation(self, sample_term):
        """Test string representation of Term."""
        assert str(sample_term) == sample_term.code
    
    def test_is_current_property(self, sample_term):
        """Test is_current property."""
        # This will depend on the current date vs sample_term dates
        # For a more robust test, you might want to mock datetime.now()
        result = sample_term.is_current
        assert isinstance(result, bool)
    
    def test_get_subterms(self, sample_term):
        """Test get_subterms method."""
        # Create a subterm
        subterm = Term.objects.create(
            code="W2025T1-SUB",
            description="Subterm",
            start=date(2025, 1, 6),
            end=date(2025, 2, 28),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            subsetOf=sample_term,
            is_active=True,
            term_type="winter"
        )
        
        subterms = sample_term.get_subterms()
        assert subterm in subterms
    
    def test_is_subset_of(self, sample_term):
        """Test is_subset_of method."""
        parent_term = Term.objects.create(
            code="W2025BOTH",
            description="Both Terms",
            start=date(2025, 1, 6),
            end=date(2025, 8, 31),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            is_active=True,
            term_type="full_year"
        )
        
        sample_term.subsetOf = parent_term
        sample_term.save()
        
        assert sample_term.is_subset_of(parent_term)
        assert not sample_term.is_subset_of(sample_term)
