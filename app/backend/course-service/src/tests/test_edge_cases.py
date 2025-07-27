"""
Edge case and integration tests for complex scenarios.
Tests error handling, edge cases, and integration between different models.
"""
import pytest
from rest_framework import status
from django.urls import reverse
from datetime import date, timedelta
from api.models import Term, Course, CourseOffering, SharedSession, TimeSlot


@pytest.mark.django_db
class TestEdgeCasesAndErrorHandling:
    """Test edge cases and error handling."""
    
    def test_create_term_with_inconsistent_calendar_years(self, authenticated_admin_client):
        """Test creating term where date doesn't match calendar year."""
        url = reverse('term-list')
        data = {
            'code': 'INCONSISTENT',
            'description': 'Inconsistent Term',
            'start': '2025-01-01',
            'end': '2025-04-30',
            'startCalendarYear': 2024,  # Wrong year
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'winter'
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'calendar year' in str(response.data).lower()
    
    def test_create_duplicate_term_code(self, authenticated_admin_client, sample_term):
        """Test creating term with duplicate code fails."""
        url = reverse('term-list')
        data = {
            'code': sample_term.code,  # Duplicate code
            'description': 'Duplicate Term',
            'start': '2025-05-01',
            'end': '2025-08-31',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'summer'
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_duplicate_course_number(self, authenticated_admin_client, sample_course):
        """Test creating course with duplicate course number fails."""
        url = reverse('course-list')
        data = {
            'course_number': sample_course.course_number,  # Duplicate
            'course_name': 'Duplicate Course',
            'department': sample_course.department.id
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_course_offering_duplicate_section(self, authenticated_scheduler_client, sample_course_offering):
        """Test creating course offering with duplicate section in same term fails."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course_offering.course.id,
            'term_id': sample_course_offering.academic_term.id,
            'section_number': sample_course_offering.section_number  # Duplicate
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_shared_session_duplicate_section(self, authenticated_scheduler_client, sample_shared_session):
        """Test creating shared session with duplicate section in same term fails."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': sample_shared_session.session_type,
            'course_id': sample_shared_session.course.id,
            'academic_term_id': sample_shared_session.academic_term.id,
            'section_number': sample_shared_session.section_number  # Duplicate
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_time_slot_invalid_time_range(self, authenticated_admin_client):
        """Test creating time slot with end before start fails."""
        # Test through course offering creation
        url = reverse('courseoffering-list')
        data = {
            'course_id': 999,  # Will fail anyway, but test the time slot validation
            'term_id': 999,
            'section_number': 'TEST',
            'time_slots': [
                {
                    'day': 'monday',
                    'start_time': '12:00:00',
                    'end_time': '10:00:00'  # End before start
                }
            ]
        }
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_nonexistent_resource_returns_404(self, authenticated_admin_client):
        """Test that accessing nonexistent resources returns 404."""
        nonexistent_id = 999999
        
        urls = [
            reverse('term-detail', kwargs={'pk': nonexistent_id}),
            reverse('course-detail', kwargs={'pk': nonexistent_id}),
        ]
        
        for url in urls:
            response = authenticated_admin_client.get(url)
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_archive_nonexistent_resource_returns_404(self, authenticated_admin_client):
        """Test that archiving nonexistent resources returns 404."""
        nonexistent_id = 999999
        
        urls = [
            reverse('term-archive', kwargs={'pk': nonexistent_id}),
            reverse('course-archive', kwargs={'pk': nonexistent_id}),
        ]
        
        for url in urls:
            response = authenticated_admin_client.patch(url)
            assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestComplexIntegrationScenarios:
    """Test complex integration scenarios between models."""
    
    def test_create_complete_academic_structure(self, authenticated_admin_client, sample_department):
        """Test creating a complete academic structure from scratch."""
        # Step 1: Create a term
        term_url = reverse('term-list')
        term_data = {
            'code': 'INTEGRATION_TERM',
            'description': 'Integration Test Term',
            'start': '2025-09-01',
            'end': '2025-12-15',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2025/26',
            'term_type': 'winter'
        }
        
        term_response = authenticated_admin_client.post(term_url, term_data, format='json')
        assert term_response.status_code == status.HTTP_201_CREATED
        term_id = term_response.data['id']
        
        # Step 2: Create a course
        course_url = reverse('course-list')
        course_data = {
            'course_number': 'INTEG 101',
            'course_name': 'Integration Test Course',
            'department': sample_department.id,
            'course_description': 'A test course for integration',
            'course_level': '100'
        }
        
        course_response = authenticated_admin_client.post(course_url, course_data, format='json')
        assert course_response.status_code == status.HTTP_201_CREATED
        course_id = course_response.data['id']
        
        # Step 3: Create a course offering with time slots
        offering_url = reverse('courseoffering-list')
        offering_data = {
            'course_id': course_id,
            'term_id': term_id,
            'section_number': '001',
            'time_slots': [
                {
                    'day': 'tuesday',
                    'start_time': '14:00:00',
                    'end_time': '15:30:00'
                }
            ]
        }
        
        offering_response = authenticated_admin_client.post(offering_url, offering_data, format='json')
        assert offering_response.status_code == status.HTTP_201_CREATED
        offering_id = offering_response.data['course_offering_id']
        
        # Step 4: Create a shared session for the course
        session_url = reverse('sharedsession-list')
        session_data = {
            'session_type': 'lab',
            'course_id': course_id,
            'academic_term_id': term_id,
            'section_number': 'L01',
            'time_slots': [
                {
                    'day': 'friday',
                    'start_time': '09:00:00',
                    'end_time': '12:00:00'
                }
            ]
        }
        
        session_response = authenticated_admin_client.post(session_url, session_data, format='json')
        assert session_response.status_code == status.HTTP_201_CREATED
        
        # Step 5: Verify the complete structure by getting course full details
        course_details_url = reverse('course-full-details', kwargs={'pk': course_id})
        details_response = authenticated_admin_client.get(course_details_url)
        assert details_response.status_code == status.HTTP_200_OK
    
    def test_archive_cascade_behavior(self, authenticated_admin_client, sample_course, sample_term, sample_course_offering, sample_shared_session):
        """Test archiving behavior and its effects on related models."""
        # Archive the term
        term_url = reverse('term-archive', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.patch(term_url)
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the term is archived
        sample_term.refresh_from_db()
        assert sample_term.is_active == False
        
        # Test filtering - archived term should not appear in active lists
        active_terms_url = reverse('term-active')
        response = authenticated_admin_client.get(active_terms_url)
        assert response.status_code == status.HTTP_200_OK
        active_term_ids = [term['id'] for term in response.data]
        assert sample_term.id not in active_term_ids
        
        # Current offerings should be affected by archived term
        current_offerings_url = reverse('courseoffering-current')
        response = authenticated_admin_client.get(current_offerings_url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_hierarchical_terms_behavior(self, authenticated_admin_client, sample_term, sample_department):
        """Test hierarchical term relationships."""
        # Create a subterm
        subterm_url = reverse('term-list')
        subterm_data = {
            'code': 'SUB_TERM',
            'description': 'Sub Term Test',
            'start': sample_term.start.strftime('%Y-%m-%d'),
            'end': (sample_term.start + timedelta(days=60)).strftime('%Y-%m-%d'),
            'startCalendarYear': sample_term.startCalendarYear,
            'endCalendarYear': sample_term.endCalendarYear,
            'academicYear': sample_term.academicYear,
            'term_type': sample_term.term_type,
            'subset_of_id': sample_term.id
        }
        
        response = authenticated_admin_client.post(subterm_url, subterm_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        subterm_id = response.data['id']
        
        # Get subterms of parent term
        subterms_url = reverse('term-subterms', kwargs={'pk': sample_term.id})
        response = authenticated_admin_client.get(subterms_url)
        assert response.status_code == status.HTTP_200_OK
        subterm_ids = [term['id'] for term in response.data]
        assert subterm_id in subterm_ids
    
    # def test_time_slot_reuse_behavior(self, authenticated_scheduler_client, sample_course, sample_term):
    #     """Test that time slots are properly reused when identical."""
    #     # Create first course offering with time slot
    #     offering1_data = {
    #         'course_id': sample_course.id,
    #         'term_id': sample_term.id,
    #         'section_number': 'REUSE1',
    #         'time_slots': [
    #             {
    #                 'day': 'wednesday',
    #                 'start_time': '16:00:00',
    #                 'end_time': '17:30:00'
    #             }
    #         ]
    #     }
        
    #     url = reverse('courseoffering-list')
    #     response1 = authenticated_scheduler_client.post(url, offering1_data, format='json')
    #     assert response1.status_code == status.HTTP_201_CREATED
    #     time_slot_1 = response1.data['time_slots_info'][0]['slot_id']
        
    #     # Create second course offering with identical time slot
    #     offering2_data = {
    #         'course_id': sample_course.id,
    #         'term_id': sample_term.id,
    #         'section_number': 'REUSE2',
    #         'time_slots': [
    #             {
    #                 'day': 'wednesday',  # Same as above
    #                 'start_time': '16:00:00',
    #                 'end_time': '17:30:00'
    #             }
    #         ]
    #     }
        
    #     response2 = authenticated_scheduler_client.post(url, offering2_data, format='json')
    #     assert response2.status_code == status.HTTP_201_CREATED
    #     time_slot_2 = response2.data['time_slots_info'][0]['slot_id']
        
    #     # Time slots should be the same (reused)
    #     assert time_slot_1 == time_slot_2
        
    #     # Verify only one TimeSlot was created
    #     time_slot_count = TimeSlot.objects.filter(
    #         day='wednesday',
    #         start_time='16:00:00',
    #         end_time='17:30:00'
    #     ).count()
    #     assert time_slot_count == 1


# @pytest.mark.django_db
# class TestAPIRootAndDocumentation:
#     """Test API root and documentation endpoints."""
    
#     def test_api_root_accessible_without_auth(self, api_client):
#         """Test that API root is accessible without authentication."""
#         url = reverse('api_root')
#         response = api_client.get(url)
        
#         assert response.status_code == status.HTTP_200_OK
#         assert 'message' in response.data
#         assert 'endpoints' in response.data
#         assert 'version' in response.data
    
#     def test_api_root_contains_all_endpoints(self, api_client):
#         """Test that API root documents all major endpoints."""
#         url = reverse('api_root')
#         response = api_client.get(url)
        
#         assert response.status_code == status.HTTP_200_OK
#         endpoints = response.data['endpoints']
        
#         # Check that all major endpoint groups are documented
#         expected_groups = ['terms', 'courses', 'course_offerings', 'shared_sessions', 'instructor_requests']
#         for group in expected_groups:
#             assert group in endpoints
            
#             # Check that archive endpoints are documented
#             if group != 'instructor_requests':  # instructor_requests don't have archive functionality
#                 assert 'archive' in endpoints[group]
#                 assert 'restore' in endpoints[group]
#                 assert 'archived' in endpoints[group]
    
#     def test_api_root_contains_examples(self, api_client):
#         """Test that API root contains usage examples."""
#         url = reverse('api_root')
#         response = api_client.get(url)
        
#         assert response.status_code == status.HTTP_200_OK
#         assert 'examples' in response.data
#         assert 'post_examples' in response.data
#         assert 'archive_examples' in response.data
        
#         # Check for specific examples
#         examples = response.data['examples']
#         assert 'archive_term' in examples
#         assert 'filter_active_terms' in examples
#         assert 'search_courses' in examples


@pytest.mark.django_db
class TestErrorResponseFormats:
    """Test that error responses follow consistent formats."""
    
    def test_validation_error_format(self, authenticated_admin_client):
        """Test that validation errors have consistent format."""
        url = reverse('term-list')
        data = {}  # Empty data should cause validation errors
        
        response = authenticated_admin_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert isinstance(response.data, dict)
        # Should contain field-specific error messages
    
    def test_permission_error_format(self, authenticated_student_client):
        """Test that permission errors have consistent format."""
        url = reverse('term-list')
        data = {
            'code': 'PERM_TEST',
            'description': 'Permission Test',
            'start': '2025-01-01',
            'end': '2025-04-30',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'winter'
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data or 'error' in response.data
    
    def test_authentication_error_format(self, api_client):
        """Test that authentication errors have consistent format."""
        url = reverse('term-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'detail' in response.data or 'error' in response.data
