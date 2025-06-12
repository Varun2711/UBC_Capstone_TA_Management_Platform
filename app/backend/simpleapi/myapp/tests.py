from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import JobPosting, Department, Faculty, TAScheduler

class JobPostingViewSetTest(APITestCase):
    def setUp(self):
        # Create dependencies
        self.faculty = Faculty.objects.create(name="Science")
        self.department = Department.objects.create(name="Computer Science", faculty=self.faculty)
        self.scheduler = TAScheduler.objects.create(
            employee_number="EMP123",
            name="Jane Doe",
            email="jane@example.com",
            department=self.department
        )

        # URL for list and create
        self.list_url = reverse('jobposting-list')

        # Create a JobPosting instance to test retrieve/update
        self.job_posting = JobPosting.objects.create(
            title="TA for CMPS 101",
            status="open",
            description="Marking quizzes",
            post_date="2025-06-14",
            deadline_date="2025-07-01",
            department=self.department,
            created_by=self.scheduler
        )
        self.detail_url = reverse('jobposting-detail', args=[self.job_posting.pk])

    def test_cannot_delete_job_posting(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_create_job_posting(self):
        data = {
            "title": "TA for MATH 200",
            "status": "open",
            "description": "Help with tutorials",
            "post_date": "2025-06-14",
            "deadline_date": "2025-07-14",
            "department_id": self.department.pk,
            "created_by_id": self.scheduler.pk,
            "requirements": "Must have taken MATH 200",
            "posting_questions": [
                {"question_text": "What courses have you TA’d before?"},
                {"question_text": "Are you available for evening labs?"}
            ]
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobPosting.objects.count(), 2)
        self.assertEqual(len(response.data['posting_questions']), 2)

    def test_retrieve_job_posting(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.job_posting.title)

    def test_update_job_posting(self):
        data = {
            "title": "Updated TA for CMPS 101",
            "description": "Assist with labs",
            "status": "open",
            "post_date": "2025-06-14",
            "deadline_date": "2025-07-01",
            "department_id": self.department.pk,
            "created_by_id": self.scheduler.pk,
            "requirements": "Updated requirement",
            "posting_questions": [
                {"question_text": "Can you work weekends?"}
            ]
        }
        response = self.client.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Updated TA for CMPS 101")
        self.assertEqual(len(response.data['posting_questions']), 1)

   