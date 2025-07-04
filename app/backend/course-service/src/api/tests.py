"""
Django REST Framework Test Suite for Course Service API

This test suite focuses on testing API endpoints, serializers, and DRF functionality
rather than direct model testing. Tests use APITestCase for proper REST API testing.
"""

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from django.db import connection
from datetime import date, time, timedelta
import json

from .models import AcademicTerm, TimeSlot
from .serializers import AcademicTermSerializer, TimeSlotSerializer
import os
import sys

from .models import Faculty, Department, Instructor


def table_exists(table_name):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables WHERE table_name = %s
            )
        """, [table_name])
        return cursor.fetchone()[0]

def create_unmanaged_tables(*models):
    from django.db import connection
    with connection.schema_editor() as schema_editor:
        for model in models:
            if not table_exists(model._meta.db_table):
                schema_editor.create_model(model)

# Override managed=False for testing
if 'test' in sys.argv:
    Faculty._meta.managed = True
    Department._meta.managed = True  
    Instructor._meta.managed = True
    create_unmanaged_tables(Faculty, Department, Instructor)

class AcademicTermAPITests(APITestCase):
    """Test suite for AcademicTerm API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.winter_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )
        
        self.summer_term = AcademicTerm.objects.create(
            year="2024",
            term_number="2",
            term="summer",
            start_date=date(2024, 5, 1),
            end_date=date(2024, 8, 15)
        )

    def test_get_academic_terms_list(self):
        """Test retrieving list of academic terms"""
        url = reverse('academicterm-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check response structure
        term_data = response.data[0]
        expected_fields = ['term_id', 'year', 'term_number', 'term', 'start_date', 'end_date']
        for field in expected_fields:
            self.assertIn(field, term_data)

    def test_get_academic_term_detail(self):
        """Test retrieving specific academic term"""
        url = reverse('academicterm-detail', kwargs={'pk': self.winter_term.term_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], "2024")
        self.assertEqual(response.data['term'], "winter")

    def test_create_academic_term_valid_data(self):
        """Test creating academic term with valid data"""
        url = reverse('academicterm-list')
        data = {
            'year': '2025',
            'term_number': '1',
            'term': 'winter',
            'start_date': '2025-01-08',
            'end_date': '2025-04-12'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AcademicTerm.objects.count(), 3)
        self.assertEqual(response.data['year'], '2025')

    def test_create_academic_term_invalid_data(self):
        """Test creating academic term with invalid data"""
        url = reverse('academicterm-list')
        
        # Test invalid term choice
        data = {
            'year': '2025',
            'term_number': '1',
            'term': 'invalid_term',
            'start_date': '2025-01-08',
            'end_date': '2025-04-12'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_academic_term(self):
        """Test updating academic term"""
        url = reverse('academicterm-detail', kwargs={'pk': self.winter_term.term_id})
        data = {
            'year': '2024',
            'term_number': '1',
            'term': 'winter',
            'start_date': '2024-01-15',  # Changed date
            'end_date': '2024-04-19'     # Changed date
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.winter_term.refresh_from_db()
        self.assertEqual(self.winter_term.start_date, date(2024, 1, 15))

    def test_delete_academic_term(self):
        """Test deleting academic term"""
        url = reverse('academicterm-detail', kwargs={'pk': self.winter_term.term_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AcademicTerm.objects.count(), 1)

    def test_filter_academic_terms_by_year(self):
        """Test filtering academic terms by year"""
        url = reverse('academicterm-list')
        response = self.client.get(url, {'year': '2024'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        for term in response.data:
            self.assertEqual(term['year'], '2024')

    def test_filter_academic_terms_by_term(self):
        """Test filtering academic terms by term type"""
        url = reverse('academicterm-list')
        response = self.client.get(url, {'term': 'winter'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['term'], 'winter')

    def test_current_term_action(self):
        """Test custom current_term action"""
        # Update term to be current
        today = timezone.now().date()
        self.winter_term.start_date = today - timedelta(days=30)
        self.winter_term.end_date = today + timedelta(days=30)
        self.winter_term.save()
        
        url = reverse('academicterm-current-term')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['term_id'], str(self.winter_term.term_id))


class TimeSlotAPITests(APITestCase):
    """Test suite for TimeSlot API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.morning_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        
        self.afternoon_slot = TimeSlot.objects.create(
            day="wednesday",
            start_time=time(14, 0),
            end_time=time(15, 30)
        )

    def test_get_time_slots_list(self):
        """Test retrieving list of time slots"""
        url = reverse('timeslot-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check response structure
        slot_data = response.data[0]
        expected_fields = ['time_slot_id', 'day', 'start_time', 'end_time']
        for field in expected_fields:
            self.assertIn(field, slot_data)

    def test_get_time_slot_detail(self):
        """Test retrieving specific time slot"""
        url = reverse('timeslot-detail', kwargs={'pk': self.morning_slot.time_slot_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['day'], 'monday')
        self.assertEqual(response.data['start_time'], '09:00:00')

    def test_create_time_slot_valid_data(self):
        """Test creating time slot with valid data"""
        url = reverse('timeslot-list')
        data = {
            'day': 'tuesday',
            'start_time': '11:00:00',
            'end_time': '12:30:00'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TimeSlot.objects.count(), 3)
        self.assertEqual(response.data['day'], 'tuesday')

    def test_create_time_slot_invalid_day(self):
        """Test creating time slot with invalid day"""
        url = reverse('timeslot-list')
        data = {
            'day': 'invalid_day',
            'start_time': '11:00:00',
            'end_time': '12:30:00'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_time_slot_invalid_time_range(self):
        """Test creating time slot with end time before start time"""
        url = reverse('timeslot-list')
        data = {
            'day': 'friday',
            'start_time': '15:00:00',
            'end_time': '14:00:00'  # End before start
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_time_slot(self):
        """Test updating time slot"""
        url = reverse('timeslot-detail', kwargs={'pk': self.morning_slot.time_slot_id})
        data = {
            'day': 'monday',
            'start_time': '10:00:00',  # Changed time
            'end_time': '11:30:00'    # Changed time
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.morning_slot.refresh_from_db()
        self.assertEqual(self.morning_slot.start_time, time(10, 0))

    def test_delete_time_slot(self):
        """Test deleting time slot"""
        url = reverse('timeslot-detail', kwargs={'pk': self.morning_slot.time_slot_id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(TimeSlot.objects.count(), 1)

    def test_filter_time_slots_by_day(self):
        """Test filtering time slots by day"""
        url = reverse('timeslot-list')
        response = self.client.get(url, {'day': 'monday'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['day'], 'monday')

    def test_by_day_action(self):
        """Test custom by_day action"""
        url = reverse('timeslot-by-day')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('monday', response.data)
        self.assertIn('wednesday', response.data)


class SerializerTests(APITestCase):
    """Test suite for serializers"""

    def test_academic_term_serializer_valid_data(self):
        """Test AcademicTerm serializer with valid data"""
        valid_data = {
            'year': '2024',
            'term_number': '2',
            'term': 'summer',
            'start_date': '2024-05-01',
            'end_date': '2024-08-15'
        }
        
        serializer = AcademicTermSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        term = serializer.save()
        self.assertEqual(term.year, '2024')
        self.assertEqual(term.term, 'summer')

    def test_academic_term_serializer_invalid_term(self):
        """Test AcademicTerm serializer with invalid term choice"""
        invalid_data = {
            'year': '2024',
            'term_number': '2',
            'term': 'invalid_term',
            'start_date': '2024-05-01',
            'end_date': '2024-08-15'
        }
        
        serializer = AcademicTermSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('term', serializer.errors)

    def test_academic_term_serializer_date_validation(self):
        """Test AcademicTerm serializer date validation"""
        invalid_data = {
            'year': '2024',
            'term_number': '2',
            'term': 'summer',
            'start_date': '2024-08-15',
            'end_date': '2024-05-01'  # End before start
        }
        
        serializer = AcademicTermSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

    def test_time_slot_serializer_valid_data(self):
        """Test TimeSlot serializer with valid data"""
        valid_data = {
            'day': 'friday',
            'start_time': '13:00:00',
            'end_time': '14:30:00'
        }
        
        serializer = TimeSlotSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        time_slot = serializer.save()
        self.assertEqual(time_slot.day, 'friday')
        self.assertEqual(time_slot.start_time, time(13, 0))

    def test_time_slot_serializer_invalid_day(self):
        """Test TimeSlot serializer with invalid day"""
        invalid_data = {
            'day': 'invalid_day',
            'start_time': '13:00:00',
            'end_time': '14:30:00'
        }
        
        serializer = TimeSlotSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('day', serializer.errors)

    def test_time_slot_serializer_time_validation(self):
        """Test TimeSlot serializer time validation"""
        invalid_data = {
            'day': 'friday',
            'start_time': '15:00:00',
            'end_time': '14:00:00'  # End before start
        }
        
        serializer = TimeSlotSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())


class HealthCheckTests(APITestCase):
    """Test suite for health check endpoints"""

    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get('/health/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'course-service')

    def test_service_info_endpoint(self):
        """Test service info endpoint"""
        response = self.client.get('/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('service_name', data)
        self.assertIn('endpoints', data)


class APIRootTests(APITestCase):
    """Test suite for API root endpoint"""

    def test_api_root_endpoint(self):
        """Test API root endpoint returns service information"""
        url = reverse('api-root')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('available_endpoints', response.data)
        self.assertEqual(response.data['status'], 'Courses and Terms service is running')


class ModelMetadataTests(APITestCase):
    """Test suite for model metadata and structure (lightweight model tests)"""

    def test_academic_term_model_metadata(self):
        """Test AcademicTerm model metadata"""
        self.assertEqual(AcademicTerm._meta.db_table, 'academic_terms')
        self.assertTrue(AcademicTerm._meta.managed)

    def test_time_slot_model_metadata(self):
        """Test TimeSlot model metadata"""
        self.assertEqual(TimeSlot._meta.db_table, 'time_slots')
        self.assertTrue(TimeSlot._meta.managed)

    def test_academic_term_string_representation(self):
        """Test AcademicTerm string representation"""
        term = AcademicTerm(
            year="2024",
            term_number="1",
            term="winter"
        )
        expected = "Winter 2024 - Term 1"
        self.assertEqual(str(term), expected)

    def test_time_slot_string_representation(self):
        """Test TimeSlot string representation"""
        slot = TimeSlot(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        expected = "Monday 09:00:00-10:30:00"
        self.assertEqual(str(slot), expected)

    def test_time_slot_duration_property(self):
        """Test TimeSlot duration calculation"""
        slot = TimeSlot(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        expected_duration = timedelta(hours=1, minutes=30)
        self.assertEqual(slot.duration, expected_duration)


class IntegrationTests(APITestCase):
    """Integration tests for complete workflows"""

    def setUp(self):
        """Set up test data for integration testing"""
        self.winter_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )
        
        self.morning_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )

    def test_complete_academic_workflow(self):
        """Test a complete academic workflow"""
        # 1. Create a new term
        terms_url = reverse('academicterm-list')
        term_data = {
            'year': '2024',
            'term_number': '3',
            'term': 'summer',
            'start_date': '2024-05-01',
            'end_date': '2024-08-15'
        }
        
        create_response = self.client.post(terms_url, term_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        
        # 2. List all terms
        list_response = self.client.get(terms_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 2)
        
        # 3. Create time slots
        slots_url = reverse('timeslot-list')
        slot_data = {
            'day': 'tuesday',
            'start_time': '14:00:00',
            'end_time': '15:30:00'
        }
        
        slot_response = self.client.post(slots_url, slot_data, format='json')
        self.assertEqual(slot_response.status_code, status.HTTP_201_CREATED)
        
        # 4. Verify filtering works
        filtered_response = self.client.get(terms_url, {'year': '2024'})
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered_response.data), 2)

    def test_api_endpoint_consistency(self):
        """Test that all API endpoints return consistent response structure"""
        endpoints = [
            ('academicterm-list', self.winter_term.term_id),
            ('timeslot-list', self.morning_slot.time_slot_id),
        ]

        for endpoint_name, obj_id in endpoints:
            # Test list endpoint
            list_url = reverse(endpoint_name)
            list_response = self.client.get(list_url)
            self.assertEqual(list_response.status_code, status.HTTP_200_OK)
            self.assertIsInstance(list_response.data, list)

            # Test detail endpoint
            detail_endpoint = endpoint_name.replace('-list', '-detail')
            try:
                detail_url = reverse(detail_endpoint, kwargs={'pk': obj_id})
                detail_response = self.client.get(detail_url)
                if detail_response.status_code == status.HTTP_200_OK:
                    self.assertIsInstance(detail_response.data, dict)
            except:
                pass  # Skip if detail endpoint doesn't exist

    def test_error_handling(self):
        """Test API error handling"""
        # Test 404 for non-existent resources
        url = reverse('academicterm-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Test 400 for invalid data
        url = reverse('academicterm-list')
        invalid_data = {'invalid': 'data'}
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
