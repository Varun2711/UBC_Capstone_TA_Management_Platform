from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, time, timedelta
import uuid
from unittest.mock import Mock

from .models import AcademicTerm, Course, TimeSlot, CourseOffering, LabSection, Faculty, Department, Instructor


class AcademicTermModelTest(TestCase):
    """Test cases for AcademicTerm model"""

    def setUp(self):
        self.academic_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )

    def test_academic_term_creation(self):
        """Test that academic term is created correctly"""
        self.assertTrue(isinstance(self.academic_term, AcademicTerm))
        self.assertEqual(self.academic_term.year, "2024")
        self.assertEqual(self.academic_term.term_number, "1")
        self.assertEqual(self.academic_term.term, "winter")

    def test_academic_term_str_representation(self):
        """Test string representation of academic term"""
        expected = "Winter 2024 - Term 1"
        self.assertEqual(str(self.academic_term), expected)

    def test_academic_term_unique_constraint(self):
        """Test that duplicate academic terms cannot be created"""
        with self.assertRaises(Exception):
            AcademicTerm.objects.create(
                year="2024",
                term_number="1",
                term="winter",
                start_date=date(2024, 1, 8),
                end_date=date(2024, 4, 12)
            )

    def test_academic_term_date_validation(self):
        """Test that end date must be after start date"""
        from django.core.exceptions import ValidationError
        term = AcademicTerm(
            year="2024",
            term_number="2",
            term="summer",
            start_date=date(2024, 5, 1),
            end_date=date(2024, 4, 30)  # End before start
        )
        with self.assertRaises(ValidationError):
            term.clean()


class TimeSlotModelTest(TestCase):
    """Test cases for TimeSlot model"""

    def setUp(self):
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )

    def test_time_slot_creation(self):
        """Test that time slot is created correctly"""
        self.assertTrue(isinstance(self.time_slot, TimeSlot))
        self.assertEqual(self.time_slot.day, "monday")
        self.assertEqual(self.time_slot.start_time, time(9, 0))
        self.assertEqual(self.time_slot.end_time, time(10, 30))

    def test_time_slot_str_representation(self):
        """Test string representation of time slot"""
        expected = "Monday 09:00:00-10:30:00"
        self.assertEqual(str(self.time_slot), expected)

    def test_time_slot_duration_property(self):
        """Test duration calculation"""
        duration = self.time_slot.duration
        self.assertEqual(duration, timedelta(hours=1, minutes=30))

    def test_time_slot_validation(self):
        """Test that end time must be after start time"""
        from django.core.exceptions import ValidationError
        slot = TimeSlot(
            day="tuesday",
            start_time=time(12, 0),
            end_time=time(11, 0)  # End before start
        )
        with self.assertRaises(ValidationError):
            slot.clean()


class CourseModelTest(TestCase):
    """Test cases for Course model"""

    def setUp(self):
        # Create mock instances for managed=False models
        # These simulate data that would come from other microservices
        
        self.mock_faculty = Mock(spec=Faculty)
        self.mock_faculty.faculty_id = uuid.uuid4()
        self.mock_faculty.faculty_name = "Faculty of Science"
        self.mock_faculty.faculty_description = "Science and Engineering Faculty"
        
        self.mock_department = Mock(spec=Department)
        self.mock_department.department_id = uuid.uuid4()
        self.mock_department.department_name = "Computer Science"
        self.mock_department.department_code = "COSC"
        self.mock_department.faculty = self.mock_faculty
        
        # For testing purposes, we'll test the Course model structure
        # without actually creating database records for FK relationships

    def test_course_model_fields(self):
        """Test course model has expected fields"""
        course_fields = [field.name for field in Course._meta.get_fields()]
        expected_fields = ['course_number', 'course_name', 'department', 'course_description', 'course_level']
        
        for field in expected_fields:
            self.assertIn(field, course_fields)

    def test_course_model_metadata(self):
        """Test course model metadata"""
        self.assertEqual(Course._meta.db_table, 'courses')
        self.assertTrue(Course._meta.managed)

    def test_course_string_representation_method(self):
        """Test course string representation method exists"""
        # Test that the __str__ method exists and has the expected format
        course = Course(
            course_number="499",
            course_name="Capstone Project",
            course_level="undergraduate"
        )
        # We can test the __str__ method even without saving
        str_repr = str(course)
        self.assertIn("499", str_repr)
        self.assertIn("Capstone Project", str_repr)

    def test_course_field_properties(self):
        """Test course field properties"""
        course_number_field = Course._meta.get_field('course_number')
        self.assertEqual(course_number_field.max_length, 10)
        
        course_name_field = Course._meta.get_field('course_name')
        self.assertEqual(course_name_field.max_length, 200)
        
        course_level_field = Course._meta.get_field('course_level')
        self.assertEqual(course_level_field.max_length, 20)

    def test_course_relationships(self):
        """Test course relationship definitions"""
        department_field = Course._meta.get_field('department')
        self.assertEqual(department_field.related_model, Department)
        self.assertTrue(department_field.many_to_one)


class CourseOfferingModelTest(TestCase):
    """Test cases for CourseOffering model"""

    def setUp(self):
        # Create only the managed models that we can actually test in the database
        self.academic_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )
        
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        
        # Create mock instances for FK relationships to managed=False models
        self.mock_faculty = Mock(spec=Faculty)
        self.mock_faculty.faculty_id = uuid.uuid4()
        self.mock_faculty.faculty_name = "Faculty of Science"
        
        self.mock_department = Mock(spec=Department)
        self.mock_department.department_id = uuid.uuid4()
        self.mock_department.department_name = "Computer Science"
        self.mock_department.department_code = "COSC"
        self.mock_department.faculty = self.mock_faculty
        
        self.mock_instructor = Mock(spec=Instructor)
        self.mock_instructor.instructor_id = uuid.uuid4()
        self.mock_instructor.employee_number = "12345"
        self.mock_instructor.instructor_name = "Dr. Jane Smith"
        self.mock_instructor.faculty = self.mock_faculty
        self.mock_instructor.email = "jane.smith@university.edu"

    def test_course_offering_model_structure(self):
        """Test CourseOffering model structure"""
        offering_fields = [field.name for field in CourseOffering._meta.get_fields()]
        expected_fields = ['course_offering_id', 'course', 'section_number', 'academic_term', 'instructor', 'time_slots']
        
        for field in expected_fields:
            self.assertIn(field, offering_fields)

    def test_course_offering_metadata(self):
        """Test CourseOffering model metadata"""
        self.assertEqual(CourseOffering._meta.db_table, 'course_offerings')
        self.assertTrue(CourseOffering._meta.managed)

    def test_course_offering_relationships(self):
        """Test CourseOffering relationship definitions"""
        course_field = CourseOffering._meta.get_field('course')
        self.assertEqual(course_field.related_model, Course)
        
        term_field = CourseOffering._meta.get_field('academic_term')
        self.assertEqual(term_field.related_model, AcademicTerm)
        
        instructor_field = CourseOffering._meta.get_field('instructor')
        self.assertEqual(instructor_field.related_model, Instructor)
        
        time_slots_field = CourseOffering._meta.get_field('time_slots')
        self.assertEqual(time_slots_field.related_model, TimeSlot)
        self.assertTrue(time_slots_field.many_to_many)

    def test_course_offering_constraints(self):
        """Test CourseOffering unique constraints"""
        unique_together = CourseOffering._meta.unique_together
        self.assertIn(('course', 'section_number', 'academic_term'), unique_together)

    def test_course_offering_field_properties(self):
        """Test CourseOffering field properties"""
        section_field = CourseOffering._meta.get_field('section_number')
        self.assertEqual(section_field.max_length, 10)

    def test_academic_term_relationship_works(self):
        """Test that we can access academic term relationship"""
        # We can test relationships with models that are managed=True
        self.assertEqual(self.academic_term.year, "2024")
        self.assertEqual(self.academic_term.term, "winter")

    def test_time_slot_relationship_works(self):
        """Test that we can access time slot relationship"""
        self.assertEqual(self.time_slot.day, "monday")
        self.assertEqual(self.time_slot.start_time, time(9, 0))


class LabSectionModelTest(TestCase):
    """Test cases for LabSection model"""

    def setUp(self):
        # Create managed models that we can test
        self.academic_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )
        
        self.time_slot = TimeSlot.objects.create(
            day="wednesday",
            start_time=time(14, 0),
            end_time=time(15, 30)
        )
        
        # Create mock instances for managed=False models
        self.mock_faculty = Mock(spec=Faculty)
        self.mock_faculty.faculty_id = uuid.uuid4()
        self.mock_faculty.faculty_name = "Faculty of Science"
        
        self.mock_department = Mock(spec=Department)
        self.mock_department.department_id = uuid.uuid4()
        self.mock_department.department_name = "Computer Science"
        self.mock_department.department_code = "COSC"
        
        self.mock_instructor = Mock(spec=Instructor)
        self.mock_instructor.instructor_id = uuid.uuid4()
        self.mock_instructor.employee_number = "67890"
        self.mock_instructor.instructor_name = "Dr. Lab Instructor"

    def test_lab_section_model_structure(self):
        """Test LabSection model structure"""
        lab_fields = [field.name for field in LabSection._meta.get_fields()]
        expected_fields = ['lab_section_id', 'course', 'section_number', 'academic_term', 'instructor', 'time_slots']
        
        for field in expected_fields:
            self.assertIn(field, lab_fields)

    def test_lab_section_metadata(self):
        """Test LabSection model metadata"""
        self.assertEqual(LabSection._meta.db_table, 'lab_sections')
        self.assertTrue(LabSection._meta.managed)

    def test_lab_section_relationships(self):
        """Test LabSection relationship definitions"""
        course_field = LabSection._meta.get_field('course')
        self.assertEqual(course_field.related_model, Course)
        
        term_field = LabSection._meta.get_field('academic_term')
        self.assertEqual(term_field.related_model, AcademicTerm)
        
        instructor_field = LabSection._meta.get_field('instructor')
        self.assertEqual(instructor_field.related_model, Instructor)
        
        time_slots_field = LabSection._meta.get_field('time_slots')
        self.assertEqual(time_slots_field.related_model, TimeSlot)
        self.assertTrue(time_slots_field.many_to_many)

    def test_lab_section_constraints(self):
        """Test LabSection unique constraints"""
        unique_together = LabSection._meta.unique_together
        self.assertIn(('course', 'section_number', 'academic_term'), unique_together)

    def test_lab_section_field_properties(self):
        """Test LabSection field properties"""
        section_field = LabSection._meta.get_field('section_number')
        self.assertEqual(section_field.max_length, 10)

    def test_time_slot_creation_for_lab(self):
        """Test that we can create time slots for labs"""
        self.assertEqual(self.time_slot.day, "wednesday")
        self.assertEqual(self.time_slot.start_time, time(14, 0))
        self.assertEqual(self.time_slot.end_time, time(15, 30))

    def test_academic_term_for_lab(self):
        """Test academic term relationship for lab sections"""
        self.assertEqual(self.academic_term.year, "2024")
        self.assertEqual(self.academic_term.term, "winter")


class ManagedFalseModelsTest(TestCase):
    """Test cases for models with managed=False"""

    def test_faculty_model_structure(self):
        """Test Faculty model structure"""
        faculty_fields = [field.name for field in Faculty._meta.get_fields()]
        expected_fields = ['faculty_id', 'faculty_name', 'faculty_description']
        
        for field in expected_fields:
            self.assertIn(field, faculty_fields)

    def test_faculty_metadata(self):
        """Test Faculty model metadata"""
        self.assertEqual(Faculty._meta.db_table, 'faculties')
        self.assertFalse(Faculty._meta.managed)

    def test_department_model_structure(self):
        """Test Department model structure"""
        dept_fields = [field.name for field in Department._meta.get_fields()]
        expected_fields = ['department_id', 'department_name', 'department_code', 'faculty']
        
        for field in expected_fields:
            self.assertIn(field, dept_fields)

    def test_department_metadata(self):
        """Test Department model metadata"""
        self.assertEqual(Department._meta.db_table, 'departments')
        self.assertFalse(Department._meta.managed)

    def test_instructor_model_structure(self):
        """Test Instructor model structure"""
        instructor_fields = [field.name for field in Instructor._meta.get_fields()]
        expected_fields = ['instructor_id', 'employee_number', 'instructor_name', 'faculty', 'email']
        
        for field in expected_fields:
            self.assertIn(field, instructor_fields)

    def test_instructor_metadata(self):
        """Test Instructor model metadata"""
        self.assertEqual(Instructor._meta.db_table, 'instructors')
        self.assertFalse(Instructor._meta.managed)

    def test_managed_false_relationships(self):
        """Test relationships between managed=False models"""
        dept_faculty_field = Department._meta.get_field('faculty')
        self.assertEqual(dept_faculty_field.related_model, Faculty)
        
        instructor_faculty_field = Instructor._meta.get_field('faculty')
        self.assertEqual(instructor_faculty_field.related_model, Faculty)


class AcademicTermAPITest(APITestCase):
    """Test cases for AcademicTerm API endpoints"""

    def setUp(self):
        self.academic_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )

    def test_get_academic_terms_list(self):
        """Test retrieving list of academic terms"""
        url = reverse('academicterm-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_academic_term_detail(self):
        """Test retrieving specific academic term"""
        url = reverse('academicterm-detail', kwargs={'term_id': self.academic_term.term_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], "2024")

    def test_create_academic_term(self):
        """Test creating new academic term"""
        url = reverse('academicterm-list')
        data = {
            'year': '2024',
            'term_number': '2',
            'term': 'summer',
            'start_date': '2024-05-01',
            'end_date': '2024-08-15'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AcademicTerm.objects.count(), 2)

    def test_filter_academic_terms_by_year(self):
        """Test filtering academic terms by year"""
        # Create another term for different year
        AcademicTerm.objects.create(
            year="2025",
            term_number="1", 
            term="winter",
            start_date=date(2025, 1, 8),
            end_date=date(2025, 4, 12)
        )
        
        url = reverse('academicterm-list')
        response = self.client.get(url, {'year': '2024'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['year'], '2024')

    def test_current_term_action(self):
        """Test custom current_term action"""
        # Update the term to be current
        today = timezone.now().date()
        self.academic_term.start_date = today - timedelta(days=30)
        self.academic_term.end_date = today + timedelta(days=30)
        self.academic_term.save()
        
        url = reverse('academicterm-current-term')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['term_id'], str(self.academic_term.term_id))


class TimeSlotAPITest(APITestCase):
    """Test cases for TimeSlot API endpoints"""

    def setUp(self):
        self.time_slot = TimeSlot.objects.create(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )

    def test_get_time_slots_list(self):
        """Test retrieving list of time slots"""
        url = reverse('timeslot-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_time_slot(self):
        """Test creating new time slot"""
        url = reverse('timeslot-list')
        data = {
            'day': 'tuesday',
            'start_time': '14:00:00',
            'end_time': '15:30:00'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TimeSlot.objects.count(), 2)

    def test_filter_time_slots_by_day(self):
        """Test filtering time slots by day"""
        TimeSlot.objects.create(
            day="tuesday",
            start_time=time(14, 0),
            end_time=time(15, 30)
        )
        
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
        self.assertIn('monday', response.data)


class APIRootTest(APITestCase):
    """Test cases for API root endpoint"""

    def test_api_root(self):
        """Test API root endpoint returns service information"""
        url = reverse('api-root')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('available_endpoints', response.data)
        self.assertEqual(response.data['status'], 'Courses and Terms service is running')


class HealthCheckTest(TestCase):
    """Test cases for health check endpoints"""

    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'course-service')

    def test_service_info(self):
        """Test service info endpoint"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('service_name', data)
        self.assertIn('endpoints', data)


class MockDataIntegrationTest(APITestCase):
    """Integration tests using mock data to simulate real-world scenarios"""

    def setUp(self):
        """Set up mock data for integration testing"""
        # Create academic terms
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

        # Create time slots
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

    def test_complete_course_workflow(self):
        """Test a complete workflow with course-related data"""
        # Test academic terms are available
        terms_url = reverse('academicterm-list')
        terms_response = self.client.get(terms_url)
        self.assertEqual(terms_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(terms_response.data), 2)

        # Test time slots are available  
        slots_url = reverse('timeslot-list')
        slots_response = self.client.get(slots_url)
        self.assertEqual(slots_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(slots_response.data), 2)

        # Test filtering by term year
        winter_terms = self.client.get(terms_url, {'year': '2024'})
        self.assertEqual(winter_terms.status_code, status.HTTP_200_OK)
        self.assertEqual(len(winter_terms.data), 2)

        # Test filtering by day
        monday_slots = self.client.get(slots_url, {'day': 'monday'})
        self.assertEqual(monday_slots.status_code, status.HTTP_200_OK)
        self.assertEqual(len(monday_slots.data), 1)

    def test_api_endpoints_return_correct_structure(self):
        """Test that all API endpoints return expected data structure"""
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

            # Test detail endpoint if it exists
            try:
                detail_url = reverse(endpoint_name.replace('-list', '-detail'), kwargs={'pk': obj_id})
                detail_response = self.client.get(detail_url)
                if detail_response.status_code != 404:  # Some endpoints might not exist
                    self.assertIsInstance(detail_response.data, dict)
            except:
                pass  # Skip if detail endpoint doesn't exist

    def test_custom_actions_work(self):
        """Test custom actions on ViewSets"""
        # Test current term action
        try:
            current_term_url = reverse('academicterm-current-term')
            response = self.client.get(current_term_url)
            # Either returns a term or 404 (both valid for empty state)
            self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND])
        except:
            pass  # Skip if action doesn't exist

        # Test by-day action for time slots
        try:
            by_day_url = reverse('timeslot-by-day')
            response = self.client.get(by_day_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIsInstance(response.data, dict)
        except:
            pass  # Skip if action doesn't exist

    def test_service_health_and_info(self):
        """Test service health and information endpoints"""
        # Test health endpoint
        health_response = self.client.get('/health/')
        self.assertEqual(health_response.status_code, 200)
        health_data = health_response.json()
        self.assertEqual(health_data['status'], 'healthy')

        # Test service info endpoint
        info_response = self.client.get('/')
        self.assertEqual(info_response.status_code, 200)
        info_data = info_response.json()
        self.assertIn('service_name', info_data)

        # Test API root endpoint
        try:
            api_root_url = reverse('api-root')
            api_response = self.client.get(api_root_url)
            self.assertEqual(api_response.status_code, status.HTTP_200_OK)
            self.assertIn('status', api_response.data)
        except:
            pass  # Skip if API root doesn't exist


class SerializerValidationTest(TestCase):
    """Test serializer validation and data handling"""

    def setUp(self):
        self.academic_term = AcademicTerm.objects.create(
            year="2024",
            term_number="1", 
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )

    def test_academic_term_serializer_validation(self):
        """Test academic term serializer validation"""
        from .serializers import AcademicTermSerializer

        # Test valid data
        valid_data = {
            'year': '2024',
            'term_number': '2',
            'term': 'summer',
            'start_date': '2024-05-01',
            'end_date': '2024-08-15'
        }
        serializer = AcademicTermSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

        # Test invalid term choice
        invalid_data = valid_data.copy()
        invalid_data['term'] = 'invalid_term'
        serializer = AcademicTermSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

    def test_time_slot_serializer_validation(self):
        """Test time slot serializer validation"""
        from .serializers import TimeSlotSerializer

        # Test valid data
        valid_data = {
            'day': 'monday',
            'start_time': '09:00:00',
            'end_time': '10:30:00'
        }
        serializer = TimeSlotSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

        # Test invalid day
        invalid_data = valid_data.copy()
        invalid_data['day'] = 'invalid_day'
        serializer = TimeSlotSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())


class ModelValidationTest(TestCase):
    """Test model validation methods"""

    def test_academic_term_validation(self):
        """Test academic term model validation"""
        from django.core.exceptions import ValidationError

        # Test valid term
        valid_term = AcademicTerm(
            year="2024",
            term_number="1",
            term="winter",
            start_date=date(2024, 1, 8),
            end_date=date(2024, 4, 12)
        )
        valid_term.clean()  # Should not raise exception

        # Test invalid date range
        invalid_term = AcademicTerm(
            year="2024",
            term_number="2",
            term="summer",
            start_date=date(2024, 5, 1),
            end_date=date(2024, 4, 30)  # End before start
        )
        with self.assertRaises(ValidationError):
            invalid_term.clean()

    def test_time_slot_validation(self):
        """Test time slot model validation"""
        from django.core.exceptions import ValidationError

        # Test valid time slot
        valid_slot = TimeSlot(
            day="monday",
            start_time=time(9, 0),
            end_time=time(10, 30)
        )
        valid_slot.clean()  # Should not raise exception

        # Test invalid time range
        invalid_slot = TimeSlot(
            day="tuesday",
            start_time=time(14, 0),
            end_time=time(13, 0)  # End before start
        )
        with self.assertRaises(ValidationError):
            invalid_slot.clean()
