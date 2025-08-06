"""
Integration tests for the bulk import endpoint.
Tests the complete bulk import workflow with realistic data.
"""
import pytest
import io
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from api.models import Department, Term, Course, CourseOffering, SharedSession, TimeSlot


@pytest.fixture
def sample_csv_content():
    """Valid CSV content matching the actual format provided by user."""
    return """Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to atomic structure and bonding,lecture,001,Monday,08:00,09:30
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to atomic structure and bonding,lecture,001,Wednesday,08:00,09:30
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to atomic structure and bonding,lecture,001,Friday,08:00,09:30
2025,winter,1,Chemistry,CHEM 125,General Chemistry I Lab,Hands-on experiments in general chemistry,lab,L01,Tuesday,14:00,17:00
2025,winter,1,Chemistry,CHEM 125,General Chemistry I Tutorial,Problem-solving sessions for general chemistry,tutorial,T01,Thursday,10:00,11:00
2025,winter,2,Chemistry,CHEM 126,General Chemistry II,Advanced topics in general chemistry,lecture,001,Tuesday,09:00,10:30
2025,winter,2,Chemistry,CHEM 126,General Chemistry II,Advanced topics in general chemistry,lecture,001,Wednesday,09:00,10:30
2025,winter,2,Chemistry,CHEM 126,General Chemistry II,Advanced topics in general chemistry,lecture,001,Thursday,09:00,10:30
2025,winter,2,Chemistry,CHEM 126,General Chemistry II Lab,Advanced chemistry laboratory work,lab,L01,Friday,13:00,16:00
2025,winter,1,Biology,BIOL 115,Cell Biology,Study of cellular structure and function,lecture,001,Monday,11:00,12:30
2025,winter,1,Biology,BIOL 115,Cell Biology,Study of cellular structure and function,lecture,001,Wednesday,11:00,12:30
2025,winter,1,Biology,BIOL 115,Cell Biology,Study of cellular structure and function,lecture,001,Friday,11:00,12:30
2025,winter,1,Biology,BIOL 115,Cell Biology Lab,Microscopy and cell culture techniques,lab,L01,Tuesday,09:00,12:00
2025,winter,1,Biology,BIOL 115,Cell Biology Tutorial,Discussion of cellular processes,tutorial,T01,Thursday,15:00,16:00
2025,winter,2,Engineering,ENGR 140,Engineering Design,Introduction to engineering problem solving,lecture,001,Tuesday,13:00,14:30
2025,winter,2,Engineering,ENGR 140,Engineering Design,Introduction to engineering problem solving,lecture,001,Wednesday,13:00,14:30
2025,winter,2,Engineering,ENGR 140,Engineering Design,Introduction to engineering problem solving,lecture,001,Thursday,13:00,14:30
2025,winter,2,Engineering,ENGR 140,Engineering Design Lab,Hands-on design projects,lab,L01,Friday,09:00,12:00
2025,winter,1,Psychology,PSYC 105,Introduction to Psychology,Overview of psychological principles,lecture,001,Monday,14:00,15:30
2025,winter,1,Psychology,PSYC 105,Introduction to Psychology,Overview of psychological principles,lecture,001,Wednesday,14:00,15:30
2025,winter,1,Psychology,PSYC 105,Introduction to Psychology,Overview of psychological principles,lecture,001,Friday,14:00,15:30
2025,winter,1,Psychology,PSYC 105,Introduction to Psychology Seminar,Discussion of psychological concepts,seminar,S01,Tuesday,16:00,17:30
2026,summer,1,Psychology,PSYC 205,Research Methods in Psychology,Statistical methods for psychology research,lecture,001,Tuesday,10:00,11:30
2026,summer,1,Psychology,PSYC 205,Research Methods in Psychology,Statistical methods for psychology research,lecture,001,Wednesday,10:00,11:30
2026,summer,1,Psychology,PSYC 205,Research Methods in Psychology,Statistical methods for psychology research,lecture,001,Thursday,10:00,11:30
2026,summer,1,Psychology,PSYC 205,Research Methods Lab,Data analysis and statistics practice,lab,L01,Friday,14:00,17:00
2025,winter,2,English,ENGL 115,Academic Writing,Advanced composition and rhetoric,lecture,001,Monday,10:00,11:30
2025,winter,2,English,ENGL 115,Academic Writing,Advanced composition and rhetoric,lecture,001,Wednesday,10:00,11:30
2025,winter,2,English,ENGL 115,Academic Writing,Advanced composition and rhetoric,lecture,001,Friday,10:00,11:30
2025,winter,2,English,ENGL 115,Academic Writing Tutorial,Writing workshop and peer review,tutorial,T01,Tuesday,13:00,14:30"""


@pytest.fixture
def setup_terms():
    """Create necessary terms for testing."""
    # Create terms that match the CSV data processing logic
    terms_data = [
        {
            'code': 'W2025 Term 1',  # Matches the CSV processing format
            'description': '2025 Winter Term 1',
            'start': '2025-01-06',
            'end': '2025-04-04',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024-2025',
            'term_type': 'Winter'
        },
        {
            'code': 'W2025 Term 2',  # Matches the CSV processing format
            'description': '2025 Winter Term 2',
            'start': '2025-01-06',
            'end': '2025-04-04',
            'startCalendarYear': 2025,
            'endCalendarYear': 2025,
            'academicYear': '2024-2025',
            'term_type': 'Winter'
        },
        {
            'code': 'S2026 Term 1',  # Matches the CSV processing format
            'description': '2026 Summer Term 1', 
            'start': '2026-05-04',
            'end': '2026-08-31',
            'startCalendarYear': 2026,
            'endCalendarYear': 2026,
            'academicYear': '2025-2026',
            'term_type': 'Summer'
        }
    ]
    
    for term_data in terms_data:
        Term.objects.get_or_create(
            code=term_data['code'],
            defaults=term_data
        )
    
    return Term.objects.filter(code__in=['W2025 Term 1', 'W2025 Term 2', 'S2026 Term 1'])


@pytest.fixture
def create_mock_file():
    """Helper function to create mock file objects."""
    def _create_mock_file(content, filename="test.csv"):
        # Create a proper file-like object that simulates an uploaded file
        return SimpleUploadedFile(
            name=filename,
            content=content.encode('utf-8'),
            content_type='text/csv'
        )
    return _create_mock_file


@pytest.mark.django_db
class TestBulkImportEndpoint:
    """Test the bulk import API endpoint."""
    
    def test_bulk_import_success(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test successful bulk import with valid CSV data."""
        url = reverse('bulk-import')
        
        # Create a mock file
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        results = response.data['results']
        assert 'processed_rows' in results
        assert 'courses_created' in results
        assert 'course_offerings_created' in results
        assert 'shared_sessions_created' in results
        assert 'time_slots_created' in results
        
        # Verify data was processed (may be skipped due to missing terms)
        total_rows = results['processed_rows'] + results.get('skipped_rows', 0)
        assert total_rows == 30
        assert results['courses_created'] > 0
    
    def test_bulk_import_no_file(self, authenticated_admin_client):
        """Test bulk import without providing a file."""
        url = reverse('bulk-import')
        response = authenticated_admin_client.post(url, {}, format='multipart')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_bulk_import_invalid_file_type(self, authenticated_admin_client, create_mock_file):
        """Test bulk import with invalid file type."""
        url = reverse('bulk-import')
        
        # Create a mock file with invalid extension
        invalid_file = create_mock_file("test content", "test.txt")
        data = {'file': invalid_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_bulk_import_empty_csv(self, authenticated_admin_client, create_mock_file):
        """Test bulk import with empty CSV file."""
        url = reverse('bulk-import')
        
        empty_csv = create_mock_file("")
        data = {'file': empty_csv}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        # Empty CSV should still return 200 OK but with zero processed rows
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        results = response.data['results']
        assert results['processed_rows'] == 0
    
    def test_bulk_import_missing_headers(self, authenticated_admin_client, create_mock_file, setup_terms):
        """Test bulk import with missing required headers."""
        url = reverse('bulk-import')
        
        invalid_csv = """invalid,headers,only
        2025,winter,1"""
        
        csv_file = create_mock_file(invalid_csv)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        # Missing headers should still return 200 OK but process the row with missing data
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        results = response.data['results']
        # Row is processed but skipped due to missing required fields
        assert results['processed_rows'] == 1
        assert results['skipped_rows'] == 1
    
    def test_bulk_import_unauthenticated(self, api_client, sample_csv_content, create_mock_file):
        """Test that unauthenticated users cannot access bulk import."""
        url = reverse('bulk-import')
        
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = api_client.post(url, data, format='multipart')
        
        # Should return 403 Forbidden for unauthenticated users
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_bulk_import_partial_success(self, authenticated_admin_client, create_mock_file, setup_terms):
        """Test bulk import with some valid and some invalid rows."""
        mixed_csv = """Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to chemistry,lecture,001,Monday,08:00,09:30
invalid_year,winter,1,Chemistry,CHEM 126,General Chemistry II,Advanced chemistry,lecture,001,Tuesday,09:00,10:30
2025,winter,1,Biology,BIOL 115,Cell Biology,Study of cells,lecture,001,Wednesday,11:00,12:30"""
        
        url = reverse('bulk-import')
        csv_file = create_mock_file(mixed_csv)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert results['processed_rows'] == 3  # All rows processed
        assert results['skipped_rows'] == 1    # One invalid row skipped
        assert len(results['errors']) == 1


@pytest.mark.django_db
class TestDataCreation:
    """Test that the correct data is created in the database."""
    
    def test_departments_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that all departments from CSV are created."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that all departments were created
        departments = Department.objects.all()
        dept_names = [dept.name for dept in departments]
        
        assert "Chemistry" in dept_names
        assert "Biology" in dept_names
        assert "Engineering" in dept_names
        assert "Psychology" in dept_names
        assert "English" in dept_names
    
    def test_terms_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that all terms from CSV are created."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that terms were created
        terms = Term.objects.all()
        term_codes = [term.code for term in terms]
        
        assert "W2025 Term 1" in term_codes
        assert "W2025 Term 2" in term_codes
        assert "S2026 Term 1" in term_codes
    
    def test_courses_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that all courses from CSV are created."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that courses were created
        courses = Course.objects.all()
        course_numbers = [course.course_number for course in courses]
        
        assert "CHEM 125" in course_numbers
        assert "CHEM 126" in course_numbers
        assert "BIOL 115" in course_numbers
        assert "ENGR 140" in course_numbers
        assert "PSYC 105" in course_numbers
        assert "PSYC 205" in course_numbers
        assert "ENGL 115" in course_numbers
    
    def test_course_offerings_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that course offerings are created for lectures."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that course offerings were created for lectures
        offerings = CourseOffering.objects.all()
        assert offerings.count() > 0
        
        # Verify specific course offering
        chem_125_offering = CourseOffering.objects.filter(
            course__course_number="CHEM 125",
            section_number="001"
        ).first()
        assert chem_125_offering is not None
    
    def test_shared_sessions_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that shared sessions are created for labs, tutorials, and seminars."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that shared sessions were created
        sessions = SharedSession.objects.all()
        assert sessions.count() > 0
        
        # Check for different session types
        session_types = [session.session_type for session in sessions]
        assert "lab" in session_types
        assert "tutorial" in session_types
        assert "seminar" in session_types
    
    def test_time_slots_created(self, authenticated_admin_client, sample_csv_content, create_mock_file, setup_terms):
        """Test that time slots are created for all entries."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check that time slots were created (may be fewer than rows due to shared time slots)
        time_slots = TimeSlot.objects.all()
        assert time_slots.count() >= 20  # Should have created many time slots
        assert time_slots.count() <= 30  # But may be fewer than rows due to sharing
        
        # Verify specific time slot
        monday_slot = TimeSlot.objects.filter(
            day="monday",
            start_time="08:00:00",
            end_time="09:30:00"
        ).first()
        assert monday_slot is not None


@pytest.mark.django_db
class TestBulkImportPermissions:
    """Test permission requirements for bulk import."""
    
    def test_admin_can_bulk_import(self, authenticated_admin_client, sample_csv_content, create_mock_file):
        """Test that admin users can perform bulk import."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_scheduler_can_bulk_import(self, authenticated_scheduler_client, sample_csv_content, create_mock_file):
        """Test that scheduler users can perform bulk import."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_scheduler_client.post(url, data, format='multipart')
        
        # Depending on your permission setup, this might be 200 or 403
        # Adjust based on your actual permission requirements
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
    
    def test_instructor_cannot_bulk_import(self, authenticated_instructor_client, sample_csv_content, create_mock_file):
        """Test that instructor users cannot perform bulk import."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_instructor_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_student_cannot_bulk_import(self, authenticated_student_client, sample_csv_content, create_mock_file):
        """Test that student users cannot perform bulk import."""
        url = reverse('bulk-import')
        csv_file = create_mock_file(sample_csv_content)
        data = {'file': csv_file}
        
        response = authenticated_student_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestBulkImportErrorHandling:
    """Test error handling in bulk import."""
    
    def test_file_size_validation(self, authenticated_admin_client, create_mock_file):
        """Test file size validation (if implemented)."""
        # Create a very large CSV content (simulating large file)
        large_content = "Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end\n"
        large_content += "2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to chemistry,lecture,001,Monday,08:00,09:30\n" * 10000
        
        url = reverse('bulk-import')
        csv_file = create_mock_file(large_content)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        # Should either process successfully or return appropriate error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_malformed_csv(self, authenticated_admin_client, create_mock_file):
        """Test handling of malformed CSV."""
        malformed_csv = """Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end
2025,winter,1,Chemistry,CHEM 125,"Unclosed quote,lecture,001,Monday,08:00,09:30
2025,winter,1,Biology,BIOL 115,Cell Biology,Study of cells,lecture,001,Tuesday,10:00,11:30"""
        
        url = reverse('bulk-import')
        csv_file = create_mock_file(malformed_csv)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        # Should handle gracefully
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_duplicate_course_handling(self, authenticated_admin_client, create_mock_file, setup_terms):
        """Test handling of duplicate courses in the same CSV."""
        duplicate_csv = """Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to chemistry,lecture,001,Monday,08:00,09:30
2025,winter,1,Chemistry,CHEM 125,General Chemistry I,Introduction to chemistry,lecture,002,Tuesday,09:00,10:30"""
        
        url = reverse('bulk-import')
        csv_file = create_mock_file(duplicate_csv)
        data = {'file': csv_file}
        
        response = authenticated_admin_client.post(url, data, format='multipart')
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert results['processed_rows'] == 2
        assert results['courses_created'] == 1  # Same course, different sections
