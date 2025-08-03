import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil
import os
from api.models import (
    Department, TAScheduler, Student, Term, JobPosting, 
    Application, Document
)

class DocumentModelTest(TestCase):
    """Test Document model functionality"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Jane Student",
            email="student@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open'
        )
        self.application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )

    def test_document_creation(self):
        """Test basic document creation"""
        # Create a mock file
        test_file = SimpleUploadedFile(
            "test_resume.pdf", 
            b"file_content", 
            content_type="application/pdf"
        )
        
        document = Document.objects.create(
            application=self.application,
            student=self.student,
            file_name="test_resume.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        self.assertEqual(document.application, self.application)
        self.assertEqual(document.student, self.student)
        self.assertEqual(document.file_name, "test_resume.pdf")
        self.assertEqual(document.file_type, "application/pdf")
        self.assertEqual(document.file_size, 1024)
        self.assertIsNotNone(document.uploaded_at)

    def test_document_without_application(self):
        """Test document creation without application (standalone document)"""
        test_file = SimpleUploadedFile(
            "transcript.pdf", 
            b"transcript_content", 
            content_type="application/pdf"
        )
        
        document = Document.objects.create(
            student=self.student,
            file_name="transcript.pdf",
            file_type="application/pdf",
            file_size=2048,
            file=test_file
        )
        
        self.assertIsNone(document.application)
        self.assertEqual(document.student, self.student)
        self.assertEqual(document.file_name, "transcript.pdf")


class DocumentAPITest(APITestCase):
    """Test Document API endpoints"""
    
    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )
        self.student = Student.objects.create(
            student_number="12345678",
            name="Jane Student",
            email="student@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        self.term = Term.objects.create(
            code="W2025T1",
            description="Winter 2025 Term 1",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        self.job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test TA position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open'
        )
        self.application = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'COSC', 'rank2': 'MATH', 'rank3': 'STAT'}
        )

        # Create Django users for authentication
        self.student_user = User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='testpass'
        )
        
        self.scheduler_user = User.objects.create_user(
            username='scheduler@test.com',
            email='scheduler@test.com',
            password='testpass'
        )
        
        # Setup API client
        self.client = APIClient()
    
    def tearDown(self):
        """Clean up any files created during individual tests"""
        super().tearDown()
        # Delete all document instances and their files
        for document in Document.objects.all():
            if document.file and os.path.exists(document.file.path):
                os.remove(document.file.path)
        Document.objects.all().delete()

    def test_student_upload_document(self):
        """Test student uploading a document"""
        self.client.force_authenticate(user=self.student_user)
        
        test_file = SimpleUploadedFile(
            "resume.pdf", 
            b"resume_content", 
            content_type="application/pdf"
        )
        
        url = reverse('documents-list')
        data = {
            'application_id': self.application.pk,
            'file_name': 'resume.pdf',
            'file_type': 'application/pdf',
            'file_size': 1024,
            'file': test_file
        }
        
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                mock_get_user_info.return_value = ('student', self.student_user.id)
                
                response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        
        document = Document.objects.first()
        self.assertEqual(document.student, self.student)
        self.assertEqual(document.file_name, 'resume.pdf')

    def test_student_list_own_documents(self):
        """Test student can only see their own documents"""
        # Create documents for the test student
        test_file = SimpleUploadedFile("test.pdf", b"content", content_type="application/pdf")
        Document.objects.create(
            student=self.student,
            file_name="student_doc.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        # Create another student and document
        other_student = Student.objects.create(
            student_number="87654321",
            name="Other Student",
            email="other@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        other_file = SimpleUploadedFile("other.pdf", b"other_content", content_type="application/pdf")
        Document.objects.create(
            student=other_student,
            file_name="other_doc.pdf",
            file_type="application/pdf",
            file_size=2048,
            file=other_file
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-list')
        
        # Patch the individual permission classes that make up IsStudentOrSchedulerOrAdmin
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('auth_utils.permissions.IsSchedulerUser.has_permission', return_value=False):
                with patch('auth_utils.permissions.IsAdminUser.has_permission', return_value=False):
                    with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                        mock_get_user_info.return_value = ('student', self.student_user.id)
                        
                        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['file_name'], 'student_doc.pdf')

    def test_scheduler_view_all_documents(self):
        """Test scheduler can view all documents"""
        # Create documents for different students
        test_file1 = SimpleUploadedFile("doc1.pdf", b"content1", content_type="application/pdf")
        Document.objects.create(
            student=self.student,
            file_name="doc1.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file1
        )
        
        other_student = Student.objects.create(
            student_number="87654321",
            name="Other Student",
            email="other@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        test_file2 = SimpleUploadedFile("doc2.pdf", b"content2", content_type="application/pdf")
        Document.objects.create(
            student=other_student,
            file_name="doc2.pdf",
            file_type="application/pdf",
            file_size=2048,
            file=test_file2
        )
        
        self.client.force_authenticate(user=self.scheduler_user)
        url = reverse('documents-list')
        
        # Patch individual permission classes - scheduler should pass
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=False):
            with patch('auth_utils.permissions.IsSchedulerUser.has_permission', return_value=True):
                with patch('auth_utils.permissions.IsAdminUser.has_permission', return_value=False):
                    with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                        mock_get_user_info.return_value = ('scheduler', self.scheduler_user.id)
                        
                        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_student_delete_own_document(self):
        """Test student can delete their own document"""
        test_file = SimpleUploadedFile("delete_me.pdf", b"content", content_type="application/pdf")
        document = Document.objects.create(
            student=self.student,
            file_name="delete_me.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-detail', kwargs={'pk': document.pk})
        
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                mock_get_user_info.return_value = ('student', self.student_user.id)
                
                response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Document.objects.count(), 0)

    def test_student_cannot_delete_other_student_document(self):
        """Test student cannot delete another student's document"""
        other_student = Student.objects.create(
            student_number="87654321",
            name="Other Student",
            email="other@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        
        test_file = SimpleUploadedFile("protected.pdf", b"content", content_type="application/pdf")
        document = Document.objects.create(
            student=other_student,  # Document belongs to other student
            file_name="protected.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-detail', kwargs={'pk': document.pk})
        
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                mock_get_user_info.return_value = ('student', self.student_user.id)
                
                response = self.client.delete(url)
        
        # Expect 404 because get_queryset() filters out other students' documents
        # This is actually better security - don't reveal that other documents exist
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Document.objects.count(), 1)  # Document should still exist

    def test_documents_by_application(self):
        """Test getting documents by application ID"""
        # Create documents for the application
        test_file1 = SimpleUploadedFile("app_doc1.pdf", b"content1", content_type="application/pdf")
        Document.objects.create(
            application=self.application,
            student=self.student,
            file_name="app_doc1.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file1
        )
        
        test_file2 = SimpleUploadedFile("app_doc2.pdf", b"content2", content_type="application/pdf")
        Document.objects.create(
            application=self.application,
            student=self.student,
            file_name="app_doc2.pdf",
            file_type="application/pdf",
            file_size=2048,
            file=test_file2
        )
        
        # Create a document for a different application
        other_app = Application.objects.create(
            student=self.student,
            posting=self.job_posting,
            status='draft',
            disciplineRankings={'rank1': 'MATH', 'rank2': 'STAT', 'rank3': 'PHYS'}
        )
        test_file3 = SimpleUploadedFile("other_doc.pdf", b"content3", content_type="application/pdf")
        Document.objects.create(
            application=other_app,
            student=self.student,
            file_name="other_doc.pdf",
            file_type="application/pdf",
            file_size=512,
            file=test_file3
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-by-application', kwargs={'application_id': self.application.pk})
        
        # Patch individual permission classes for student access
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('auth_utils.permissions.IsSchedulerUser.has_permission', return_value=False):
                with patch('auth_utils.permissions.IsAdminUser.has_permission', return_value=False):
                    with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                        mock_get_user_info.return_value = ('student', self.student_user.id)
                        
                        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        file_names = [doc['file_name'] for doc in response.data]
        self.assertIn('app_doc1.pdf', file_names)
        self.assertIn('app_doc2.pdf', file_names)
        self.assertNotIn('other_doc.pdf', file_names)

    def test_student_access_own_application_documents_only(self):
        """Test student can only access documents from their own applications"""
        # Create another student and application
        other_student = Student.objects.create(
            student_number="87654321",
            name="Other Student",
            email="other@test.com",
            study_level="undergraduate",
            department=self.department,
            password="testpass"
        )
        
        other_app = Application.objects.create(
            student=other_student,
            posting=self.job_posting,
            status='submitted',
            disciplineRankings={'rank1': 'MATH', 'rank2': 'STAT', 'rank3': 'PHYS'}
        )
        
        test_file = SimpleUploadedFile("restricted.pdf", b"content", content_type="application/pdf")
        Document.objects.create(
            application=other_app,
            student=other_student,
            file_name="restricted.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-by-application', kwargs={'application_id': other_app.pk})
        
        # Patch individual permission classes for student access
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('auth_utils.permissions.IsSchedulerUser.has_permission', return_value=False):
                with patch('auth_utils.permissions.IsAdminUser.has_permission', return_value=False):
                    with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                        mock_get_user_info.return_value = ('student', self.student_user.id)
                        
                        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_signed_download_url_generation(self):
        """Test generating signed download URL for document"""
        test_file = SimpleUploadedFile("download_test.pdf", b"content", content_type="application/pdf")
        document = Document.objects.create(
            student=self.student,
            file_name="download_test.pdf",
            file_type="application/pdf",
            file_size=1024,
            file=test_file
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('documents-signed-download-url', kwargs={'pk': document.pk})
        
        # Patch individual permission classes for student access
        with patch('auth_utils.permissions.IsStudentUser.has_permission', return_value=True):
            with patch('auth_utils.permissions.IsSchedulerUser.has_permission', return_value=False):
                with patch('auth_utils.permissions.IsAdminUser.has_permission', return_value=False):
                    with patch('api.views.DocumentViewSet.get_user_info') as mock_get_user_info:
                        mock_get_user_info.return_value = ('student', self.student_user.id)
                        
                        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('url', response.data)
        # Check that the URL contains expected components of a signed URL
        signed_url = response.data['url']
        self.assertIn('/api/ajp/download', signed_url)
        self.assertIn('path=', signed_url)
        self.assertIn('exp=', signed_url)  # expiration timestamp
        self.assertIn('sig=', signed_url)  # signature
        self.assertIn('download_test', signed_url)  # filename should be in path

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access documents"""
        url = reverse('documents-list')
        response = self.client.get(url)
        
        # Should return 403 for unauthenticated users
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)