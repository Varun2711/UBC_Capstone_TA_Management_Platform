"""
Test cases for permission and authentication functionality.
Tests role-based access control and authentication requirements.
"""
import pytest
from rest_framework import status
from django.urls import reverse


@pytest.mark.django_db
class TestAuthenticationRequirements:
    """Test that endpoints require proper authentication."""
    
    def test_unauthenticated_cannot_access_terms(self, api_client):
        """Test that unauthenticated users cannot access terms."""
        url = reverse('term-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_unauthenticated_cannot_access_courses(self, api_client):
        """Test that unauthenticated users cannot access courses."""
        url = reverse('course-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_unauthenticated_cannot_access_course_offerings(self, api_client):
        """Test that unauthenticated users cannot access course offerings."""
        url = reverse('courseoffering-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_unauthenticated_cannot_access_shared_sessions(self, api_client):
        """Test that unauthenticated users cannot access shared sessions."""
        url = reverse('sharedsession-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_unauthenticated_cannot_access_instructor_requests(self, api_client):
        """Test that unauthenticated users cannot access instructor requests."""
        url = reverse('instructorrequest-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminOnlyPermissions:
    """Test admin-only permissions for archive functionality."""
    
    def test_only_admin_can_archive_term(self, authenticated_scheduler_client, authenticated_admin_client, sample_term):
        """Test that only admins can archive terms."""
        url = reverse('term-archive', kwargs={'pk': sample_term.id})
        
        # Scheduler should be forbidden
        response = authenticated_scheduler_client.patch(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.patch(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_only_admin_can_restore_term(self, authenticated_instructor_client, authenticated_admin_client, sample_term):
        """Test that only admins can restore terms."""
        # Archive the term first
        sample_term.is_active = False
        sample_term.save()
        
        url = reverse('term-restore', kwargs={'pk': sample_term.id})
        
        # Instructor should be forbidden
        response = authenticated_instructor_client.patch(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.patch(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_only_admin_can_list_archived_terms(self, authenticated_student_client, authenticated_admin_client):
        """Test that only admins can list archived terms."""
        url = reverse('term-archived')
        
        # Student should be forbidden
        response = authenticated_student_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_only_admin_can_archive_course(self, authenticated_scheduler_client, authenticated_admin_client, sample_course):
        """Test that only admins can archive courses."""
        url = reverse('course-archive', kwargs={'pk': sample_course.id})
        
        # Scheduler should be forbidden
        response = authenticated_scheduler_client.patch(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.patch(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_only_admin_can_archive_course_offering(self, authenticated_scheduler_client, authenticated_admin_client, sample_course_offering):
        """Test that only admins can archive course offerings."""
        url = reverse('courseoffering-archive', kwargs={'pk': sample_course_offering.course_offering_id})
        
        # Scheduler should be forbidden
        response = authenticated_scheduler_client.patch(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.patch(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_only_admin_can_archive_shared_session(self, authenticated_student_client, authenticated_admin_client, sample_shared_session):
        """Test that only admins can archive shared sessions."""
        url = reverse('sharedsession-archive', kwargs={'pk': sample_shared_session.shared_session_id})
        
        # Student should be forbidden
        response = authenticated_student_client.patch(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Admin should succeed
        response = authenticated_admin_client.patch(url)
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestSchedulerPermissions:
    """Test scheduler-level permissions."""
    
    def test_scheduler_can_create_terms(self, authenticated_scheduler_client):
        """Test that schedulers can create terms."""
        url = reverse('term-list')
        data = {
            'code': 'SCHED_TEST',
            'description': 'Scheduler Created Term',
            'start': '2025-09-01',
            'end': '2025-12-15',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2025/26',
            'term_type': 'winter'
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_scheduler_can_create_courses(self, authenticated_scheduler_client, sample_department):
        """Test that schedulers can create courses."""
        url = reverse('course-list')
        data = {
            'course_number': 'SCHED 123',
            'course_name': 'Scheduler Created Course',
            'department': sample_department.id
        }
        
        response = authenticated_scheduler_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    # def test_scheduler_can_create_course_offerings(self, authenticated_scheduler_client, sample_course, sample_term):
    #     """Test that schedulers can create course offerings."""
    #     url = reverse('courseoffering-list')
    #     data = {
    #         'course_id': sample_course.id,
    #         'term_id': sample_term.id,
    #         'section_number': 'SCHED001'
    #     }
        
    #     response = authenticated_scheduler_client.post(url, data, format='json')
    #     assert response.status_code == status.HTTP_201_CREATED
    
    # def test_scheduler_can_create_shared_sessions(self, authenticated_scheduler_client, sample_course, sample_term):
    #     """Test that schedulers can create shared sessions."""
    #     url = reverse('sharedsession-list')
    #     data = {
    #         'session_type': 'lab',
    #         'course_id': sample_course.id,
    #         'academic_term_id': sample_term.id,
    #         'section_number': 'SCHED_L01'
    #     }
        
    #     response = authenticated_scheduler_client.post(url, data, format='json')
    #     assert response.status_code == status.HTTP_201_CREATED
    
    def test_scheduler_can_delete_instructor_requests(self, authenticated_scheduler_client, sample_instructor_request):
        """Test that schedulers can delete instructor requests."""
        url = reverse('instructorrequest-detail', kwargs={'pk': sample_instructor_request.request_id})
        response = authenticated_scheduler_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestInstructorPermissions:
    """Test instructor-level permissions."""
    
    def test_instructor_can_view_their_course_offerings(self, authenticated_instructor_client, sample_instructor, sample_course_offering):
        """Test that instructors can view their own course offerings."""
        # Assuming the sample instructor is assigned to the sample course offering
        url = reverse('courseoffering-by-instructor') + f'?instructor_id={sample_instructor.id}'
        response = authenticated_instructor_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    # def test_instructor_can_create_requests(self, authenticated_instructor_client, sample_instructor, sample_course_offering):
    #     """Test that instructors can create requests."""
    #     url = reverse('instructorrequest-list')
    #     data = {
    #         'instructor_id': sample_instructor.id,
    #         'course_offering_id': sample_course_offering.course_offering_id,
    #         'request_description': ['Instructor created request']
    #     }
        
    #     response = authenticated_instructor_client.post(url, data, format='json')
    #     assert response.status_code == status.HTTP_201_CREATED
    
    def test_instructor_cannot_create_terms(self, authenticated_instructor_client):
        """Test that instructors cannot create terms."""
        url = reverse('term-list')
        data = {
            'code': 'INSTR_FAIL',
            'description': 'Instructor Attempt',
            'start': '2025-01-01',
            'end': '2025-04-30',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024/25',
            'term_type': 'winter'
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_instructor_cannot_create_courses(self, authenticated_instructor_client, sample_department):
        """Test that instructors cannot create courses."""
        url = reverse('course-list')
        data = {
            'course_number': 'INSTR 999',
            'course_name': 'Instructor Attempt',
            'department': sample_department.id
        }
        
        response = authenticated_instructor_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_instructor_cannot_delete_courses(self, authenticated_instructor_client, sample_course):
        """Test that instructors cannot delete courses."""
        url = reverse('course-detail', kwargs={'pk': sample_course.id})
        response = authenticated_instructor_client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestStudentPermissions:
    """Test student-level permissions."""
    
    def test_student_can_view_shared_sessions(self, authenticated_student_client, sample_shared_session):
        """Test that students can view shared sessions."""
        url = reverse('sharedsession-list')
        response = authenticated_student_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_student_can_view_their_shared_sessions(self, authenticated_student_client, sample_student, sample_shared_session):
        """Test that students can view their assigned shared sessions."""
        url = reverse('sharedsession-by-student') + f'?student_id={sample_student.id}'
        response = authenticated_student_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_student_cannot_create_courses(self, authenticated_student_client, sample_department):
        """Test that students cannot create courses."""
        url = reverse('course-list')
        data = {
            'course_number': 'STUD 999',
            'course_name': 'Student Attempt',
            'department': sample_department.id
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_create_course_offerings(self, authenticated_student_client, sample_course, sample_term):
        """Test that students cannot create course offerings."""
        url = reverse('courseoffering-list')
        data = {
            'course_id': sample_course.id,
            'term_id': sample_term.id,
            'section_number': 'STUD001'
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_create_shared_sessions(self, authenticated_student_client, sample_course, sample_term):
        """Test that students cannot create shared sessions."""
        url = reverse('sharedsession-list')
        data = {
            'session_type': 'lab',
            'course_id': sample_course.id,
            'academic_term_id': sample_term.id,
            'section_number': 'STUD_L01'
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_create_instructor_requests(self, authenticated_student_client, sample_instructor, sample_course_offering):
        """Test that students cannot create instructor requests."""
        url = reverse('instructorrequest-list')
        data = {
            'instructor_id': sample_instructor.id,
            'course_offering_id': sample_course_offering.course_offering_id,
            'request_description': ['Student attempt']
        }
        
        response = authenticated_student_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_delete_anything(self, authenticated_student_client, sample_course, sample_term, sample_course_offering, sample_shared_session):
        """Test that students cannot delete any resources."""
        # Test deleting course
        url = reverse('course-detail', kwargs={'pk': sample_course.id})
        response = authenticated_student_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test deleting term
        url = reverse('term-detail', kwargs={'pk': sample_term.id})
        response = authenticated_student_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test deleting course offering
        url = reverse('courseoffering-detail', kwargs={'pk': sample_course_offering.course_offering_id})
        response = authenticated_student_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Test deleting shared session
        url = reverse('sharedsession-detail', kwargs={'pk': sample_shared_session.shared_session_id})
        response = authenticated_student_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCrossRolePermissions:
    """Test cross-role permission scenarios."""
    
    def test_all_authenticated_users_can_view_lists(self, authenticated_admin_client, authenticated_scheduler_client, authenticated_instructor_client, authenticated_student_client):
        """Test that all authenticated users can view resource lists."""
        clients = [authenticated_admin_client, authenticated_scheduler_client, authenticated_instructor_client, authenticated_student_client]
        urls = [
            reverse('term-list'),
            reverse('course-list'),
            reverse('courseoffering-list'),
            reverse('sharedsession-list'),
            reverse('instructorrequest-list')
        ]
        
        for client in clients:
            for url in urls:
                response = client.get(url)
                assert response.status_code == status.HTTP_200_OK, f"Failed for {url} with client {client}"
    
    def test_modification_permissions_hierarchy(self, authenticated_admin_client, authenticated_scheduler_client, authenticated_instructor_client, authenticated_student_client, sample_course, sample_department):
        """Test the permission hierarchy for modifications."""
        # Admin should be able to do everything
        # Scheduler should be able to create/update most things
        # Instructor should have limited permissions
        # Student should have very limited permissions
        
        # Test course creation permissions
        url = reverse('course-list')
        data = {
            'course_number': 'PERM 123',
            'course_name': 'Permission Test Course',
            'department': sample_department.id
        }
        
        # Admin can create
        response = authenticated_admin_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Scheduler can create
        data['course_number'] = 'PERM 124'
        response = authenticated_scheduler_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Instructor cannot create
        data['course_number'] = 'PERM 125'
        response = authenticated_instructor_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Student cannot create
        data['course_number'] = 'PERM 126'
        response = authenticated_student_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
