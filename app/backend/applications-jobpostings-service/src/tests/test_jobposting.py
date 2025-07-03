import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from api.models import Faculty, Department, TAScheduler, JobPosting, JobPostingQuestion, Term


class JobPostingModelTest(TestCase):
    """Test JobPosting model functionality"""
    
    def setUp(self):
        self.faculty = Faculty.objects.create(name="Science")
        self.department = Department.objects.create(name="Computer Science", faculty=self.faculty)
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department
        )
        self.term = Term.objects.create(
            code="W2025",
            description="Winter 2025",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )

    def test_job_posting_creation_with_term(self):
        """Test basic job posting creation with term"""
        job_posting = JobPosting.objects.create(
            title="TA Position - COSC 101",
            description="Teaching assistant for intro programming",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term,
            status='open',
            requirements="Must be enrolled in Computer Science"
        )
        
        self.assertEqual(job_posting.title, "TA Position - COSC 101")
        self.assertEqual(job_posting.department, self.department)
        self.assertEqual(job_posting.term, self.term)
        self.assertEqual(job_posting.status, 'open')
        self.assertFalse(job_posting.is_expired())

    def test_is_expired_method(self):
        """Test expiration logic"""
        # Not expired
        future_posting = JobPosting.objects.create(
            title="Future Posting",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=7),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term
        )
        self.assertFalse(future_posting.is_expired())
        
        # Expired
        expired_posting = JobPosting.objects.create(
            title="Expired Posting",
            post_date=date.today() - timedelta(days=30),
            deadline_date=date.today() - timedelta(days=1),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.term
        )
        self.assertTrue(expired_posting.is_expired())


class JobPostingAPITest(APITestCase):
    """Test JobPosting API endpoints"""
    
    def setUp(self):
        self.faculty = Faculty.objects.create(name="Science")
        self.department = Department.objects.create(name="Computer Science", faculty=self.faculty)
        self.math_dept = Department.objects.create(name="Mathematics", faculty=self.faculty)
        
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department
        )
        
        self.winter_term = Term.objects.create(
            code="W2025",
            description="Winter 2025",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        
        self.summer_term = Term.objects.create(
            code="S2025",
            description="Summer 2025",
            start=date.today() + timedelta(days=150),
            end=date.today() + timedelta(days=270),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="summer"
        )

    def test_create_job_posting_with_term_and_questions(self):
        """Test creating a job posting with term and questions via API"""
        url = reverse('jobposting-list')
        data = {
            'title': 'TA Position - COSC 101',
            'description': 'Teaching assistant for intro programming',
            'post_date': date.today().isoformat(),
            'deadline_date': (date.today() + timedelta(days=14)).isoformat(),
            'department_id': self.department.pk,
            'term_id': self.winter_term.pk,
            'created_by_id': self.ta_scheduler.pk,
            'status': 'open',
            'requirements': 'Must be enrolled in CS',
            'posting_questions': [
                {'question_text': 'What is your GPA?'},
                {'question_text': 'Do you have previous TA experience?'}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobPosting.objects.count(), 1)
        
        job_posting = JobPosting.objects.first()
        self.assertEqual(job_posting.title, 'TA Position - COSC 101')
        self.assertEqual(job_posting.term, self.winter_term)
        self.assertEqual(job_posting.posting_questions.count(), 2)

    def test_filter_by_term(self):
        """Test filtering job postings by term"""
        JobPosting.objects.create(
            title="Winter Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Summer Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.summer_term,
            status='open'
        )
        
        url = reverse('jobposting-list')
        response = self.client.get(url, {'term': self.winter_term.pk})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['term']['code'], 'W2025')

    def test_filter_by_department(self):
        """Test filtering job postings by department"""
        JobPosting.objects.create(
            title="CS Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Math Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.math_dept,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        
        url = reverse('jobposting-list')
        response = self.client.get(url, {'department_name': self.department.name})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['department']['name'], 'Computer Science')

    def test_by_term_custom_action(self):
        """Test the custom by_term action endpoint"""
        JobPosting.objects.create(
            title="Winter Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Summer Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.summer_term,
            status='open'
        )
        
        url = reverse('jobposting-by-term', kwargs={'term_id': self.winter_term.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['term']['code'], 'W2025')

    def test_open_postings_custom_action(self):
        """Test the custom 'open' action endpoint"""
        JobPosting.objects.create(
            title="Open Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Closed Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='closed'
        )
        
        url = reverse('jobposting-open')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'open')

    def test_combined_filters(self):
        """Test combining multiple filters (term + department + status)"""
        JobPosting.objects.create(
            title="Winter CS Open",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Winter Math Open",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.math_dept,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="Winter CS Closed",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='closed'
        )
        
        url = reverse('jobposting-list') #this is such as clever django feature
        response = self.client.get(url, {
            'term': self.winter_term.pk,
            'department_name': self.department.name,
            'status': 'open'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Winter CS Open')

    def test_search_job_postings(self):
        """Test searching job postings by title and description"""
        JobPosting.objects.create(
            title="TA Position - COSC 101",
            description="Programming fundamentals",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        JobPosting.objects.create(
            title="TA Position - MATH 200",
            description="Calculus course",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.math_dept,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        
        url = reverse('jobposting-list')
        response = self.client.get(url, {'search': 'COSC'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('COSC', response.data[0]['title'])

    def test_delete_job_posting_not_allowed(self):
        """Test that job posting deletion is not allowed"""
        job_posting = JobPosting.objects.create(
            title="Test Position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=14),
            department=self.department,
            created_by=self.ta_scheduler,
            term=self.winter_term,
            status='open'
        )
        
        url = reverse('jobposting-detail', kwargs={'pk': job_posting.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(JobPosting.objects.filter(pk=job_posting.pk).exists())