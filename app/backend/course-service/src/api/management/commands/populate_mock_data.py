from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta, time
from api.models import (
    Department, Instructor, Term, TimeSlot, Course, 
    CourseOffering, SharedSession
)


class Command(BaseCommand):
    help = 'Populate the database with mock data for testing the Course API'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before adding mock data',
        )
    
    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()
        
        self.stdout.write('Creating mock data...')
        
        # Create data in dependency order
        departments = self.create_departments()
        instructors = self.create_instructors(departments)
        terms = self.create_terms()
        time_slots = self.create_time_slots()
        courses = self.create_courses(departments)
        course_offerings = self.create_course_offerings(courses, terms, instructors)
        shared_sessions = self.create_shared_sessions(courses, terms, instructors, time_slots)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created mock data:\n'
                f'  - {len(departments)} departments\n'
                f'  - {len(instructors)} instructors\n'
                f'  - {len(terms)} terms\n'
                f'  - {len(time_slots)} time slots\n'
                f'  - {len(courses)} courses\n'
                f'  - {len(course_offerings)} course offerings\n'
                f'  - {len(shared_sessions)} shared sessions'
            )
        )
    
    def clear_data(self):
        """Clear all existing data"""
        SharedSession.objects.all().delete()
        CourseOffering.objects.all().delete()
        Course.objects.all().delete()
        TimeSlot.objects.all().delete()
        Term.objects.all().delete()
        Instructor.objects.all().delete()
        # Note: Not clearing Department as it's unmanaged
    
    def create_departments(self):
        """Create department data"""
        dept_data = [
            'Computer Science',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Engineering',
            'Psychology',
            'English'
        ]
        
        departments = []
        for name in dept_data:
            dept, created = Department.objects.get_or_create(name=name)
            departments.append(dept)
            if created:
                self.stdout.write(f'  Created department: {name}')
        
        return departments
    
    def create_instructors(self, departments):
        """Create instructor data"""
        instructor_data = [
            ('Dr. Sarah Johnson', 'Computer Science', 'sarah.johnson@university.edu'),
            ('Dr. Michael Chen', 'Computer Science', 'michael.chen@university.edu'),
            ('Prof. Emily Davis', 'Mathematics', 'emily.davis@university.edu'),
            ('Dr. Robert Wilson', 'Physics', 'robert.wilson@university.edu'),
            ('Dr. Lisa Anderson', 'Chemistry', 'lisa.anderson@university.edu'),
            ('Prof. David Brown', 'Computer Science', 'david.brown@university.edu'),
            ('Dr. Jennifer Lee', 'Biology', 'jennifer.lee@university.edu'),
            ('Dr. Mark Taylor', 'Engineering', 'mark.taylor@university.edu'),
            ('Dr. Anna Garcia', 'Psychology', 'anna.garcia@university.edu'),
            ('Prof. James Miller', 'English', 'james.miller@university.edu'),
        ]
        
        instructors = []
        for name, dept_name, email in instructor_data:
            department = Department.objects.get(name=dept_name)
            instructor, created = Instructor.objects.get_or_create(
                email=email,
                defaults={
                    'employee_number': f'EMP{len(instructors)+1001}',
                    'name': name,
                    'department': department,
                    'password': 'hashed_password_here',  # In real app, use proper hashing
                    'is_active': True
                }
            )
            instructors.append(instructor)
            if created:
                self.stdout.write(f'  Created instructor: {name}')
        
        return instructors
    
    def create_terms(self):
        """Create academic term data"""
        terms = []
        
        # Create terms for 2024-2025 and 2025-2026 academic years
        for year in [2024, 2025]:
            # Winter Terms (September - April)
            winter_term_1 = Term.objects.create(
                code=f'W{year} Term 1',
                description=f'Winter Term 1 {year}/{year+1}',
                start=date(year, 9, 1),
                end=date(year, 12, 31),
                startCalendarYear=year,
                endCalendarYear=year,
                academicYear=f'{year}/{str(year+1)[2:]}',
                is_active=year == 2025,  # Only 2025 terms are active
                term_type='winter'
            )
            terms.append(winter_term_1)
            
            winter_term_2 = Term.objects.create(
                code=f'W{year} Term 2',
                description=f'Winter Term 2 {year}/{year+1}',
                start=date(year+1, 1, 1),
                end=date(year+1, 4, 30),
                startCalendarYear=year+1,
                endCalendarYear=year+1,
                academicYear=f'{year}/{str(year+1)[2:]}',
                is_active=year == 2025,
                term_type='winter'
            )
            terms.append(winter_term_2)
            
            # Summer Term (May - August)
            summer_term = Term.objects.create(
                code=f'S{year+1}',
                description=f'Summer Term {year+1}',
                start=date(year+1, 5, 1),
                end=date(year+1, 8, 31),
                startCalendarYear=year+1,
                endCalendarYear=year+1,
                academicYear=f'{year}/{str(year+1)[2:]}',
                is_active=year == 2025,
                term_type='summer'
            )
            terms.append(summer_term)
            
            # Create parent "Both Terms" term for winter terms
            both_terms = Term.objects.create(
                code=f'W{year} Both Terms',
                description=f'Winter Both Terms {year}/{year+1}',
                start=date(year, 9, 1),
                end=date(year+1, 4, 30),
                startCalendarYear=year,
                endCalendarYear=year+1,
                academicYear=f'{year}/{str(year+1)[2:]}',
                is_active=year == 2025,
                term_type='full_year'
            )
            terms.append(both_terms)
            
            # Set subsetOf relationships
            winter_term_1.subsetOf = both_terms
            winter_term_1.save()
            winter_term_2.subsetOf = both_terms
            winter_term_2.save()
        
        self.stdout.write(f'  Created {len(terms)} academic terms')
        return terms
    
    def create_time_slots(self):
        """Create time slot data"""
        time_slots = []
        
        # Common university time slots
        slot_data = [
            ('monday', time(9, 0), time(10, 30)),
            ('monday', time(11, 0), time(12, 30)),
            ('monday', time(14, 0), time(15, 30)),
            ('monday', time(16, 0), time(17, 30)),
            ('tuesday', time(9, 0), time(10, 30)),
            ('tuesday', time(11, 0), time(12, 30)),
            ('tuesday', time(14, 0), time(15, 30)),
            ('wednesday', time(9, 0), time(10, 30)),
            ('wednesday', time(11, 0), time(12, 30)),
            ('wednesday', time(14, 0), time(15, 30)),
            ('wednesday', time(16, 0), time(17, 30)),
            ('thursday', time(9, 0), time(10, 30)),
            ('thursday', time(11, 0), time(12, 30)),
            ('thursday', time(14, 0), time(15, 30)),
            ('friday', time(9, 0), time(10, 30)),
            ('friday', time(11, 0), time(12, 30)),
            ('friday', time(14, 0), time(15, 30)),
        ]
        
        for day, start_time, end_time in slot_data:
            slot, created = TimeSlot.objects.get_or_create(
                day=day,
                start_time=start_time,
                end_time=end_time
            )
            time_slots.append(slot)
            if created:
                self.stdout.write(f'  Created time slot: {day} {start_time}-{end_time}')
        
        return time_slots
    
    def create_courses(self, departments):
        """Create course data"""
        cs_dept = Department.objects.get(name='Computer Science')
        math_dept = Department.objects.get(name='Mathematics')
        phys_dept = Department.objects.get(name='Physics')
        
        course_data = [
            # Computer Science courses
            ('COSC 111', 'Computer Programming I', cs_dept, 'Introduction to programming using Python', '100'),
            ('COSC 121', 'Computer Programming II', cs_dept, 'Object-oriented programming concepts', '100'),
            ('COSC 211', 'Machine Architecture', cs_dept, 'Computer systems and assembly language', '200'),
            ('COSC 221', 'Introduction to Discrete Structures', cs_dept, 'Logic, sets, functions, and proof techniques', '200'),
            ('COSC 310', 'Software Engineering', cs_dept, 'Software development methodologies', '300'),
            ('COSC 320', 'Data Structures and Algorithms', cs_dept, 'Advanced data structures and algorithmic analysis', '300'),
            ('COSC 404', 'Database Systems', cs_dept, 'Database design and implementation', '400'),
            ('COSC 499', 'Capstone Project', cs_dept, 'Final year capstone project', '400'),
            
            # Mathematics courses
            ('MATH 100', 'Differential Calculus', math_dept, 'Limits, derivatives, and applications', '100'),
            ('MATH 101', 'Integral Calculus', math_dept, 'Integration and its applications', '100'),
            ('MATH 200', 'Multivariable Calculus', math_dept, 'Calculus of several variables', '200'),
            ('MATH 221', 'Matrix Algebra', math_dept, 'Linear algebra and matrix operations', '200'),
            
            # Physics courses
            ('PHYS 111', 'General Physics I', phys_dept, 'Mechanics and thermodynamics', '100'),
            ('PHYS 112', 'General Physics II', phys_dept, 'Electricity and magnetism', '100'),
        ]
        
        courses = []
        for course_number, course_name, department, description, level in course_data:
            course, created = Course.objects.get_or_create(
                course_number=course_number,
                defaults={
                    'course_name': course_name,
                    'department': department,
                    'course_description': description,
                    'course_level': level
                }
            )
            courses.append(course)
            if created:
                self.stdout.write(f'  Created course: {course_number} - {course_name}')
        
        return courses
    
    def create_course_offerings(self, courses, terms, instructors):
        """Create course offering data"""
        offerings = []
        
        # Get some specific terms and instructors
        w2025_t1 = Term.objects.get(code='W2025 Term 1')
        w2025_t2 = Term.objects.get(code='W2025 Term 2')
        s2026 = Term.objects.get(code='S2026')
        
        cs_instructors = [i for i in instructors if i.department.name == 'Computer Science']
        math_instructors = [i for i in instructors if i.department.name == 'Mathematics']
        phys_instructors = [i for i in instructors if i.department.name == 'Physics']
        
        # Create offerings for popular CS courses
        offering_data = [
            # COSC 111 - multiple sections
            ('COSC 111', w2025_t1, '001', cs_instructors[0]),
            ('COSC 111', w2025_t1, '002', cs_instructors[1]),
            ('COSC 111', w2025_t2, '001', cs_instructors[0]),
            
            # COSC 121
            ('COSC 121', w2025_t2, '001', cs_instructors[1]),
            ('COSC 121', s2026, '001', cs_instructors[2]),
            
            # COSC 211
            ('COSC 211', w2025_t1, '001', cs_instructors[2]),
            
            # COSC 320
            ('COSC 320', w2025_t1, '001', cs_instructors[0]),
            ('COSC 320', w2025_t2, '001', cs_instructors[1]),
            
            # COSC 499
            ('COSC 499', w2025_t2, '001', cs_instructors[2]),
            
            # Math courses
            ('MATH 100', w2025_t1, '001', math_instructors[0]),
            ('MATH 100', w2025_t1, '002', math_instructors[0]),
            ('MATH 101', w2025_t2, '001', math_instructors[0]),
            
            # Physics courses
            ('PHYS 111', w2025_t1, '001', phys_instructors[0] if phys_instructors else cs_instructors[0]),
            ('PHYS 112', w2025_t2, '001', phys_instructors[0] if phys_instructors else cs_instructors[0]),
        ]
        
        for course_number, term, section, instructor in offering_data:
            try:
                course = Course.objects.get(course_number=course_number)
                offering = CourseOffering.objects.create(
                    course=course,
                    section_number=section,
                    academic_term=term,
                    instructor=instructor
                )
                offerings.append(offering)
                self.stdout.write(f'  Created offering: {course_number} {section} - {term.code}')
            except Course.DoesNotExist:
                self.stdout.write(f'  Warning: Course {course_number} not found')
        
        return offerings
    
    def create_shared_sessions(self, courses, terms, instructors, time_slots):
        """Create shared session (lab/tutorial) data"""
        sessions = []
        
        # Get some specific data
        w2025_t1 = Term.objects.get(code='W2025 Term 1')
        w2025_t2 = Term.objects.get(code='W2025 Term 2')
        cs_instructors = [i for i in instructors if i.department.name == 'Computer Science']
        
        # Create labs and tutorials for programming courses
        session_data = [
            # COSC 111 labs
            ('COSC 111', w2025_t1, 'lab', 'L01', cs_instructors[0]),
            ('COSC 111', w2025_t1, 'lab', 'L02', cs_instructors[1]),
            ('COSC 111', w2025_t1, 'lab', 'L03', None),  # Unassigned
            ('COSC 111', w2025_t2, 'lab', 'L01', cs_instructors[0]),
            
            # COSC 111 tutorials
            ('COSC 111', w2025_t1, 'tutorial', 'T01', cs_instructors[2]),
            ('COSC 111', w2025_t2, 'tutorial', 'T01', cs_instructors[1]),
            
            # COSC 121 labs
            ('COSC 121', w2025_t2, 'lab', 'L01', cs_instructors[1]),
            ('COSC 121', w2025_t2, 'lab', 'L02', None),
            
            # COSC 320 tutorials
            ('COSC 320', w2025_t1, 'tutorial', 'T01', cs_instructors[2]),
            ('COSC 320', w2025_t2, 'tutorial', 'T01', cs_instructors[0]),
            
            # COSC 499 seminars
            ('COSC 499', w2025_t2, 'seminar', 'S01', cs_instructors[2]),
        ]
        
        for course_number, term, session_type, section, instructor in session_data:
            try:
                course = Course.objects.get(course_number=course_number)
                session = SharedSession.objects.create(
                    session_type=session_type,
                    course=course,
                    section_number=section,
                    academic_term=term,
                    instructor=instructor
                )
                
                # Assign random time slots
                import random
                assigned_slots = random.sample(time_slots, k=random.randint(1, 2))
                session.time_slots.set(assigned_slots)
                
                sessions.append(session)
                self.stdout.write(f'  Created session: {course_number} {section} ({session_type}) - {term.code}')
            except Course.DoesNotExist:
                self.stdout.write(f'  Warning: Course {course_number} not found')
        
        return sessions
