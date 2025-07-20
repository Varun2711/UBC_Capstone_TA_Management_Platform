import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from django.contrib.auth.models import User
from unittest.mock import patch
from datetime import date, timedelta
from api.models import (
    Department, TAScheduler, FormTemplate, FormSection, 
    FormQuestion, Term, JobPosting
)


class FormTemplateModelTest(TestCase):
    """Test FormTemplate model functionality"""
    
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )

    def test_form_template_creation(self):
        """Test basic form template creation"""
        template = FormTemplate.objects.create(
            name="Standard TA Application",
            description="Default template for TA applications",
            created_by=self.ta_scheduler
        )
        
        self.assertEqual(template.name, "Standard TA Application")
        self.assertEqual(template.created_by, self.ta_scheduler)
        self.assertTrue(template.is_active)
        self.assertTrue(template.is_editable)
        self.assertIsNotNone(template.created_at)

    def test_form_template_string_representation(self):
        """Test form template __str__ method"""
        template = FormTemplate.objects.create(
            name="Test Template",
            created_by=self.ta_scheduler
        )
        
        self.assertEqual(str(template), "Test Template")

    def test_form_template_with_sections_and_questions(self):
        """Test creating template with sections and questions"""
        template = FormTemplate.objects.create(
            name="Complete Template",
            created_by=self.ta_scheduler
        )
        
        # Create a section
        section = FormSection.objects.create(
            template=template,
            name="Eligibility",
            section_type="eligibility",
            order=1,
            is_required=True
        )
        
        # Create questions for the section
        question1 = FormQuestion.objects.create(
            section=section,
            question_text="Are you a Canadian citizen?",
            question_type="radio",
            field_name="citizenship_status",
            order=1,
            is_required=True,
            options={"choices": ["Yes", "No", "Permanent Resident"]}
        )
        
        question2 = FormQuestion.objects.create(
            section=section,
            question_text="Upload your transcript",
            question_type="file",
            field_name="transcript_upload",
            order=2,
            is_required=True
        )
        
        self.assertEqual(template.sections.count(), 1)
        self.assertEqual(section.questions.count(), 2)
        self.assertEqual(question1.section, section)
        self.assertEqual(question2.section, section)


class FormSectionModelTest(TestCase):
    """Test FormSection model functionality"""
    
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )
        self.template = FormTemplate.objects.create(
            name="Test Template",
            created_by=self.ta_scheduler
        )

    def test_form_section_creation(self):
        """Test basic form section creation"""
        section = FormSection.objects.create(
            template=self.template,
            name="Personal Details",
            section_type="personal_details",
            order=1,
            is_required=True,
            description="Enter your personal information"
        )
        
        self.assertEqual(section.template, self.template)
        self.assertEqual(section.name, "Personal Details")
        self.assertEqual(section.section_type, "personal_details")
        self.assertEqual(section.order, 1)
        self.assertTrue(section.is_required)

    def test_form_section_string_representation(self):
        """Test form section __str__ method"""
        section = FormSection.objects.create(
            template=self.template,
            name="Test Section",
            section_type="custom",
            order=1
        )
        
        expected = f"{self.template.name} - Test Section"
        self.assertEqual(str(section), expected)

    def test_form_section_ordering(self):
        """Test that sections are ordered correctly"""
        section1 = FormSection.objects.create(
            template=self.template,
            name="First Section",
            section_type="eligibility",
            order=2
        )
        section2 = FormSection.objects.create(
            template=self.template,
            name="Second Section",
            section_type="selections",
            order=1
        )
        
        sections = FormSection.objects.all()
        self.assertEqual(sections[0], section2)  # Lower order first
        self.assertEqual(sections[1], section1)


class FormQuestionModelTest(TestCase):
    """Test FormQuestion model functionality"""
    
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )
        self.template = FormTemplate.objects.create(
            name="Test Template",
            created_by=self.ta_scheduler
        )
        self.section = FormSection.objects.create(
            template=self.template,
            name="Test Section",
            section_type="custom",
            order=1
        )

    def test_form_question_creation(self):
        """Test basic form question creation"""
        question = FormQuestion.objects.create(
            section=self.section,
            question_text="What is your GPA?",
            question_type="number",
            field_name="gpa",
            order=1,
            is_required=True,
            help_text="Enter your current GPA out of 4.0",
            validation_rules={"min": 0, "max": 4.0},
            options=None
        )
        
        self.assertEqual(question.section, self.section)
        self.assertEqual(question.question_text, "What is your GPA?")
        self.assertEqual(question.question_type, "number")
        self.assertEqual(question.field_name, "gpa")
        self.assertTrue(question.is_required)

    def test_form_question_string_representation(self):
        """Test form question __str__ method"""
        question = FormQuestion.objects.create(
            section=self.section,
            question_text="This is a very long question text that should be truncated in the string representation",
            question_type="text",
            field_name="long_question",
            order=1
        )
        
        expected = f"{self.section.name} - This is a very long question text that should be t"
        self.assertEqual(str(question), expected)

    def test_form_question_with_options(self):
        """Test form question with multiple choice options"""
        question = FormQuestion.objects.create(
            section=self.section,
            question_text="Select your preferred work schedule",
            question_type="select",
            field_name="work_schedule",
            order=1,
            options={
                "choices": [
                    {"value": "morning", "label": "Morning (8AM-12PM)"},
                    {"value": "afternoon", "label": "Afternoon (12PM-5PM)"},
                    {"value": "evening", "label": "Evening (5PM-9PM)"}
                ]
            }
        )
        
        self.assertIsNotNone(question.options)
        self.assertEqual(len(question.options["choices"]), 3)
        self.assertEqual(question.options["choices"][0]["value"], "morning")


class FormTemplateAPITest(APITestCase):
    """Test FormTemplate API endpoints"""
    
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.ta_scheduler = TAScheduler.objects.create(
            employee_number="TA001",
            name="John Scheduler",
            email="scheduler@test.com",
            department=self.department,
            password="testpass"
        )
        
        # Create Django user for authentication
        self.django_user = User.objects.create_user(
            username='scheduler@test.com',
            email='scheduler@test.com',
            password='testpass'
        )
        
        # Setup API client with authentication
        self.client = APIClient()
        self.client.force_authenticate(user=self.django_user)

    def test_create_form_template_basic(self):
        """Test creating a basic form template via API"""
        url = reverse('formtemplate-list')
        data = {
            'name': 'Basic TA Application',
            'description': 'Simple application form',
            'created_by_id': self.ta_scheduler.pk,
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FormTemplate.objects.count(), 1)
        
        template = FormTemplate.objects.first()
        self.assertEqual(template.name, 'Basic TA Application')
        self.assertEqual(template.created_by, self.ta_scheduler)

    def test_create_form_template_with_sections_and_questions(self):
        """Test creating a complete form template with sections and questions"""
        url = reverse('formtemplate-list')
        data = {
            'name': 'Complete TA Application',
            'description': 'Full application form with all sections',
            'created_by_id': self.ta_scheduler.pk,
            'sections': [
                {
                    'name': 'Eligibility',
                    'section_type': 'eligibility',
                    'order': 1,
                    'is_required': True,
                    'description': 'Eligibility requirements',
                    'questions': [
                        {
                            'question_text': 'Are you enrolled full-time?',
                            'question_type': 'radio',
                            'field_name': 'full_time_enrollment',
                            'order': 1,
                            'is_required': True,
                            'options': {
                                'choices': [
                                    {'value': 'yes', 'label': 'Yes'},
                                    {'value': 'no', 'label': 'No'}
                                ]
                            }
                        },
                        {
                            'question_text': 'Upload your transcript',
                            'question_type': 'file',
                            'field_name': 'transcript',
                            'order': 2,
                            'is_required': True,
                            'help_text': 'Please upload an unofficial transcript'
                        }
                    ]
                },
                {
                    'name': 'Course Selections',
                    'section_type': 'selections',
                    'order': 2,
                    'is_required': True,
                    'questions': [
                        {
                            'question_text': 'Rank your course preferences',
                            'question_type': 'ranking',
                            'field_name': 'course_rankings',
                            'order': 1,
                            'is_required': True,
                            'options': {
                                'items': ['COSC 101', 'COSC 121', 'COSC 211', 'COSC 221']
                            }
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        template = FormTemplate.objects.first()
        self.assertEqual(template.sections.count(), 2)
        
        eligibility_section = template.sections.get(section_type='eligibility')
        self.assertEqual(eligibility_section.questions.count(), 2)
        
        selections_section = template.sections.get(section_type='selections')
        self.assertEqual(selections_section.questions.count(), 1)

    def test_list_form_templates(self):
        """Test retrieving form templates list"""
        FormTemplate.objects.create(
            name="Template 1",
            created_by=self.ta_scheduler
        )
        FormTemplate.objects.create(
            name="Template 2",
            created_by=self.ta_scheduler,
            is_active=False  # This should be excluded
        )
        
        url = reverse('formtemplate-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only active templates
        self.assertEqual(response.data[0]['name'], 'Template 1')

    def test_filter_form_templates(self):
        """Test filtering form templates"""
        FormTemplate.objects.create(
            name="Scheduler 1 Template",
            created_by=self.ta_scheduler
        )
        
        other_scheduler = TAScheduler.objects.create(
            employee_number="TA002",
            name="Other Scheduler",
            email="other@test.com",
            department=self.department,
            password="testpass"
        )
        FormTemplate.objects.create(
            name="Scheduler 2 Template",
            created_by=other_scheduler
        )
        
        url = reverse('formtemplate-list')
        response = self.client.get(url, {'created_by': self.ta_scheduler.pk})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Scheduler 1 Template')

    # def test_search_form_templates(self):
    #     """Test searching form templates by name and description"""
    #     FormTemplate.objects.create(
    #         name="TA Application Form",
    #         description="Standard application",
    #         created_by=self.ta_scheduler
    #     )
    #     FormTemplate.objects.create(
    #         name="Research Assistant Form",
    #         description="For research positions",
    #         created_by=self.ta_scheduler
    #     )
        
    #     url = reverse('formtemplate-list')
    #     response = self.client.get(url, {'search': 'TA'})
        
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(len(response.data), 1)
    #     self.assertIn('TA', response.data[0]['name'])

    def test_update_form_template(self):
        """Test updating a form template"""
        template = FormTemplate.objects.create(
            name="Original Name",
            description="Original description",
            created_by=self.ta_scheduler
        )
        
        url = reverse('formtemplate-detail', kwargs={'pk': template.pk})
        data = {
            'name': 'Updated Name',
            'description': 'Updated description',
            'created_by_id': self.ta_scheduler.pk
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        template.refresh_from_db()
        self.assertEqual(template.name, 'Updated Name')
        self.assertEqual(template.description, 'Updated description')

 

    def test_duplicate_form_template(self):
        """Test duplicating an existing form template"""
        original_template = FormTemplate.objects.create(
            name="Original Template",
            description="Original description",
            created_by=self.ta_scheduler
        )
        
        # Add a section with questions to test complete duplication
        section = FormSection.objects.create(
            template=original_template,
            name="Test Section",
            section_type="custom",
            order=1
        )
        FormQuestion.objects.create(
            section=section,
            question_text="Test Question",
            question_type="text",
            field_name="test_field",
            order=1
        )
        
        url = reverse('formtemplate-duplicate', kwargs={'pk': original_template.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FormTemplate.objects.count(), 2)
        
        duplicated_template = FormTemplate.objects.exclude(pk=original_template.pk).first()
        self.assertEqual(duplicated_template.name, "Original Template (Copy)")
        self.assertEqual(duplicated_template.sections.count(), 1)
        self.assertEqual(duplicated_template.sections.first().questions.count(), 1)

    def test_form_template_with_job_posting(self):
        """Test that form templates can be associated with job postings"""
        template = FormTemplate.objects.create(
            name="Job Application Template",
            created_by=self.ta_scheduler
        )
        
        term = Term.objects.create(
            code="W2025",
            description="Winter 2025",
            start=date.today(),
            end=date.today() + timedelta(days=120),
            startCalendarYear=2025,
            endCalendarYear=2025,
            academicYear="2024/25",
            term_type="winter"
        )
        
        job_posting = JobPosting.objects.create(
            title="TA Position",
            description="Test position",
            post_date=date.today(),
            deadline_date=date.today() + timedelta(days=30),
            department=self.department,
            created_by=self.ta_scheduler,
            term=term,
            form_template=template
        )
        
        self.assertEqual(job_posting.form_template, template)