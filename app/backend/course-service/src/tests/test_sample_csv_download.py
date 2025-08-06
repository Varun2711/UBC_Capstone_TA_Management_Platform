"""
Tests for the download_sample_csv endpoint.
Tests the sample CSV download functionality for bulk import.
"""
import pytest
import io
import csv
import os
from unittest.mock import patch, mock_open
from django.urls import reverse
from django.http import HttpResponse
from rest_framework import status


@pytest.mark.django_db
class TestSampleCSVDownload:
    """Test the sample CSV download API endpoint."""
    
    def test_download_sample_csv_success(self, api_client):
        """Test successful download of sample CSV file."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert response['Content-Disposition'] == 'attachment; filename="sample_bulk_import.csv"'
        
        # Verify the response contains CSV content
        content = response.content.decode('utf-8')
        assert 'Session year,Term type,term number,department,course number' in content
        assert 'course name,course description,item_type,section number,weekday,time start,time end' in content
        
        # Verify it's valid CSV by parsing it
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        assert len(rows) > 0
        
        # Check that all required headers are present
        expected_headers = [
            'Session year', 'Term type', 'term number', 'department', 
            'course number', 'course name', 'course description', 
            'item_type', 'section number', 'weekday', 'time start', 'time end'
        ]
        for header in expected_headers:
            assert header in csv_reader.fieldnames
    
    def test_download_sample_csv_contains_diverse_data(self, api_client):
        """Test that the sample CSV contains diverse and comprehensive example data."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Verify we have multiple rows
        assert len(rows) > 20  # Should have substantial example data
        
        # Check for diverse data
        session_years = set(row['Session year'] for row in rows)
        term_types = set(row['Term type'] for row in rows)
        departments = set(row['department'] for row in rows)
        item_types = set(row['item_type'] for row in rows)
        term_numbers = set(row['term number'] for row in rows)
        
        # Verify diversity in the sample data
        assert len(session_years) >= 3  # Multiple years (2024, 2025, 2026, 2027)
        assert len(term_types) >= 2  # Winter and Summer
        assert len(departments) >= 5  # Multiple departments (COSC, MATH, CHEM, BIOL, PHYS, etc.)
        assert len(item_types) >= 4  # All session types (lecture, lab, tutorial, seminar)
        assert '0' in term_numbers  # "Both terms" represented as 0
        assert '1' in term_numbers  # Term 1
        assert '2' in term_numbers  # Term 2
    
    def test_download_sample_csv_demonstrates_all_item_types(self, api_client):
        """Test that the sample CSV demonstrates all valid item types."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        item_types = set(row['item_type'] for row in rows)
        expected_item_types = {'lecture', 'lab', 'tutorial', 'seminar'}
        
        # Verify all item types are represented
        assert expected_item_types.issubset(item_types)
    
    def test_download_sample_csv_shows_multi_day_courses(self, api_client):
        """Test that the sample CSV demonstrates courses running multiple days."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Group rows by course offering (course + section + term)
        course_offerings = {}
        for row in rows:
            key = f"{row['department']} {row['course number']} {row['section number']} {row['Session year']} {row['Term type']} {row['term number']}"
            if key not in course_offerings:
                course_offerings[key] = []
            course_offerings[key].append(row)
        
        # Verify that some courses have multiple schedule entries (multi-day)
        multi_day_courses = [offering for offering in course_offerings.values() if len(offering) > 1]
        assert len(multi_day_courses) > 0, "Sample should include courses running multiple days"
        
        # Verify at least one course runs 3 days (MWF pattern)
        three_day_courses = [offering for offering in course_offerings.values() if len(offering) >= 3]
        assert len(three_day_courses) > 0, "Sample should include courses running 3+ days"
    
    def test_download_sample_csv_valid_time_formats(self, api_client):
        """Test that the sample CSV uses proper time formats."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Check time format consistency
        for row in rows:
            if row.get('time start'):
                time_start = row['time start']
                # Should be in HH:MM format
                assert ':' in time_start
                hour, minute = time_start.split(':')
                assert len(hour) == 2
                assert len(minute) == 2
                assert hour.isdigit()
                assert minute.isdigit()
            
            if row.get('time end'):
                time_end = row['time end']
                # Should be in HH:MM format
                assert ':' in time_end
                hour, minute = time_end.split(':')
                assert len(hour) == 2
                assert len(minute) == 2
                assert hour.isdigit()
                assert minute.isdigit()
    
    def test_download_sample_csv_valid_weekdays(self, api_client):
        """Test that the sample CSV uses valid weekday formats."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        valid_weekdays = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'}
        
        for row in rows:
            if row.get('weekday'):
                weekday = row['weekday'].lower().strip()
                assert weekday in valid_weekdays, f"Invalid weekday: {weekday}"
    
    @patch('api.views.os.path.exists')
    def test_download_sample_csv_file_not_found(self, mock_exists, api_client):
        """Test handling when sample CSV file doesn't exist."""
        mock_exists.return_value = False
        
        url = reverse('sample-csv')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert 'Sample CSV file not found' in response.data['error']
    
    @patch('builtins.open', side_effect=IOError("File read error"))
    @patch('api.views.os.path.exists')
    def test_download_sample_csv_file_read_error(self, mock_exists, mock_open_func, api_client):
        """Test handling when sample CSV file cannot be read."""
        mock_exists.return_value = True
        
        url = reverse('sample-csv')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert 'Failed to retrieve sample CSV' in response.data['error']
    
    def test_download_sample_csv_no_authentication_required(self, api_client):
        """Test that sample CSV download doesn't require authentication."""
        url = reverse('sample-csv')
        
        # Test with unauthenticated client
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
    
    def test_download_sample_csv_method_not_allowed(self, api_client):
        """Test that only GET method is allowed for sample CSV download."""
        url = reverse('sample-csv')
        
        # Test POST method
        response = api_client.post(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test PUT method
        response = api_client.put(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test DELETE method
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_download_sample_csv_demonstrates_both_terms(self, api_client):
        """Test that the sample CSV demonstrates 'both terms' functionality with term number 0."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Look for entries with term number 0 (both terms)
        both_terms_entries = [row for row in rows if row['term number'] == '0']
        assert len(both_terms_entries) > 0, "Sample should include 'both terms' examples with term number 0"
        
        # Verify these entries have valid course data
        for entry in both_terms_entries:
            assert entry['Session year']
            assert entry['Term type']
            assert entry['department']
            assert entry['course number']
            assert entry['course name']
            assert entry['item_type']
    
    def test_download_sample_csv_comprehensive_sections(self, api_client):
        """Test that the sample CSV demonstrates different section numbering patterns."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        section_numbers = set(row['section number'] for row in rows if row.get('section number'))
        
        # Should have lecture sections (001), lab sections (L01), tutorial sections (T01)
        lecture_sections = [s for s in section_numbers if s.startswith('00')]
        lab_sections = [s for s in section_numbers if s.startswith('L')]
        tutorial_sections = [s for s in section_numbers if s.startswith('T')]
        
        assert len(lecture_sections) > 0, "Should have lecture section examples"
        assert len(lab_sections) > 0, "Should have lab section examples"
        assert len(tutorial_sections) > 0, "Should have tutorial section examples"
    
    def test_download_sample_csv_realistic_course_data(self, api_client):
        """Test that the sample CSV contains realistic course data."""
        url = reverse('sample-csv')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Check for realistic course numbers
        course_numbers = set(row['course number'] for row in rows)
        
        # Should have variety of course levels (100, 200, 300, 400+)
        level_100 = [c for c in course_numbers if c.startswith('1')]
        level_200 = [c for c in course_numbers if c.startswith('2')]
        level_300 = [c for c in course_numbers if c.startswith('3')]
        level_400 = [c for c in course_numbers if c.startswith('4')]
        
        assert len(level_100) > 0, "Should have 100-level courses"
        assert len(level_200) > 0, "Should have 200-level courses"
        assert len(level_300) > 0, "Should have 300-level courses"
        assert len(level_400) > 0, "Should have 400-level courses"
        
        # Check for realistic course descriptions
        for row in rows:
            description = row.get('course description', '')
            assert len(description) > 10, f"Course description should be meaningful: {description}"
            # Should contain actual words, not just placeholder text
            assert not any(placeholder in description.lower() for placeholder in 
                          ['lorem', 'ipsum', 'placeholder', 'example', 'sample'])


@pytest.mark.django_db 
class TestSampleCSVIntegration:
    """Integration tests for sample CSV download with bulk import workflow."""
    
    def test_downloaded_sample_works_with_bulk_import(self, authenticated_admin_client):
        """Test that the downloaded sample CSV can be successfully used with bulk import."""
        # First, download the sample CSV
        sample_url = reverse('sample-csv')
        sample_response = authenticated_admin_client.get(sample_url)
        assert sample_response.status_code == status.HTTP_200_OK
        
        # Extract CSV content
        csv_content = sample_response.content.decode('utf-8')
        
        # Create a mock file from the downloaded content
        from django.core.files.uploadedfile import SimpleUploadedFile
        csv_file = SimpleUploadedFile(
            name="downloaded_sample.csv",
            content=csv_content.encode('utf-8'),
            content_type='text/csv'
        )
        
        # Try to upload it to bulk import
        bulk_import_url = reverse('bulk-import')
        data = {'file': csv_file}
        
        bulk_response = authenticated_admin_client.post(bulk_import_url, data, format='multipart')
        
        # Should not fail with validation errors (though it may create/skip entries)
        assert bulk_response.status_code == status.HTTP_200_OK
        assert 'results' in bulk_response.data
        
        # Should have processed the rows from the sample
        results = bulk_response.data['results']
        total_rows = results.get('processed_rows', 0) + results.get('skipped_rows', 0)
        assert total_rows > 0, "Should process rows from the sample CSV"
    
    def test_sample_csv_headers_match_bulk_import_expectations(self, api_client):
        """Test that sample CSV headers exactly match what bulk import expects."""
        url = reverse('sample-csv')
        response = api_client.get(url)
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        # These are the exact headers that bulk import expects
        expected_headers = [
            'Session year', 'Term type', 'term number', 'department', 
            'course number', 'course name', 'course description', 
            'item_type', 'section number', 'weekday', 'time start', 'time end'
        ]
        
        # Headers should match exactly (order and naming)
        assert list(csv_reader.fieldnames) == expected_headers
