from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta, time
from api.models import (
    Department, Instructor, Term, TimeSlot, Course, 
    CourseOffering, SharedSession, Student, InstructorRequest
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
        students = self.create_students()
        courses = self.create_courses(departments)
        course_offerings = self.create_course_offerings(courses, terms, instructors)
        shared_sessions = self.create_shared_sessions(courses, terms, time_slots, students)
        instructor_requests = self.create_instructor_requests(instructors, course_offerings)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created mock data:\n'
                f'  - {len(departments)} departments\n'
                f'  - {len(instructors)} instructors\n'
                f'  - {len(terms)} terms\n'
                f'  - {len(time_slots)} time slots\n'
                f'  - {len(students)} students\n'
                f'  - {len(courses)} courses\n'
                f'  - {len(course_offerings)} course offerings\n'
                f'  - {len(shared_sessions)} shared sessions\n'
                f'  - {len(instructor_requests)} instructor requests'
            )
        )
    
    def clear_data(self):
        """Clear all existing data, handling foreign key constraints"""
        # Clear in dependency order to avoid foreign key violations
        # InstructorRequest depends on Instructor and CourseOffering
        InstructorRequest.objects.all().delete()
        
        # SharedSession depends on Course, Term, and TimeSlot
        SharedSession.objects.all().delete()
        
        # CourseOffering depends on Course and Term  
        CourseOffering.objects.all().delete()
        
        # Course depends on Department
        Course.objects.all().delete()
        
        # TimeSlot is independent
        TimeSlot.objects.all().delete()
        
        # Don't delete Terms as they might be referenced by other services
        # Term.objects.all().delete()
        
        # Don't delete Instructors as they might be referenced by other services
        # Instructor.objects.all().delete()
        
        # Note: Not clearing Department as it's unmanaged and shared
        self.stdout.write('  Cleared course-specific data (kept Terms and Instructors for other services)')
    
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
            winter_term_1, created = Term.objects.get_or_create(
                code=f'W{year} Term 1',
                defaults={
                    'description': f'Winter Term 1 {year}/{year+1}',
                    'start': date(year, 9, 1),
                    'end': date(year, 12, 31),
                    'startCalendarYear': year,
                    'endCalendarYear': year,
                    'academicYear': f'{year}/{str(year+1)[2:]}',
                    'is_active': year == 2025,  # Only 2025 terms are active
                    'term_type': 'winter'
                }
            )
            terms.append(winter_term_1)
            if created:
                self.stdout.write(f'  Created term: {winter_term_1.code}')
            
            winter_term_2, created = Term.objects.get_or_create(
                code=f'W{year} Term 2',
                defaults={
                    'description': f'Winter Term 2 {year}/{year+1}',
                    'start': date(year+1, 1, 1),
                    'end': date(year+1, 4, 30),
                    'startCalendarYear': year+1,
                    'endCalendarYear': year+1,
                    'academicYear': f'{year}/{str(year+1)[2:]}',
                    'is_active': year == 2025,
                    'term_type': 'winter'
                }
            )
            terms.append(winter_term_2)
            if created:
                self.stdout.write(f'  Created term: {winter_term_2.code}')
            
            # Summer Term (May - August)
            summer_term, created = Term.objects.get_or_create(
                code=f'S{year+1}',
                defaults={
                    'description': f'Summer Term {year+1}',
                    'start': date(year+1, 5, 1),
                    'end': date(year+1, 8, 31),
                    'startCalendarYear': year+1,
                    'endCalendarYear': year+1,
                    'academicYear': f'{year}/{str(year+1)[2:]}',
                    'is_active': year == 2025,
                    'term_type': 'summer'
                }
            )
            terms.append(summer_term)
            if created:
                self.stdout.write(f'  Created term: {summer_term.code}')
            
            # Create parent "Both Terms" term for winter terms
            both_terms, created = Term.objects.get_or_create(
                code=f'W{year} Both Terms',
                defaults={
                    'description': f'Winter Both Terms {year}/{year+1}',
                    'start': date(year, 9, 1),
                    'end': date(year+1, 4, 30),
                    'startCalendarYear': year,
                    'endCalendarYear': year+1,
                    'academicYear': f'{year}/{str(year+1)[2:]}',
                    'is_active': year == 2025,
                    'term_type': 'full_year'
                }
            )
            terms.append(both_terms)
            if created:
                self.stdout.write(f'  Created term: {both_terms.code}')
            
            # Set subsetOf relationships
            if winter_term_1.subsetOf != both_terms:
                winter_term_1.subsetOf = both_terms
                winter_term_1.save()
            if winter_term_2.subsetOf != both_terms:
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
    
    def create_students(self):
        """Create student data for TA assignments"""
        student_data = [
            ('S12345678', 'Alice Chen', 'alice.chen@student.university.edu', 'Computer Science', 4, 'undergraduate'),
            ('S12345679', 'Bob Smith', 'bob.smith@student.university.edu', 'Computer Science', 3, 'undergraduate'),
            ('S12345680', 'Carol Wang', 'carol.wang@student.university.edu', 'Computer Science', 2, 'graduate'),
            ('S12345681', 'David Kim', 'david.kim@student.university.edu', 'Mathematics', 4, 'undergraduate'),
            ('S12345682', 'Emma Rodriguez', 'emma.rodriguez@student.university.edu', 'Computer Science', 1, 'graduate'),
            ('S12345683', 'Frank Liu', 'frank.liu@student.university.edu', 'Computer Science', 3, 'undergraduate'),
            ('S12345684', 'Grace Taylor', 'grace.taylor@student.university.edu', 'Mathematics', 2, 'graduate'),
            ('S12345685', 'Henry Park', 'henry.park@student.university.edu', 'Computer Science', 4, 'undergraduate'),
            ('S12345686', 'Ivy Zhang', 'ivy.zhang@student.university.edu', 'Computer Science', 1, 'graduate'),
            ('S12345687', 'Jack Brown', 'jack.brown@student.university.edu', 'Computer Science', 3, 'undergraduate'),
        ]
        
        students = []
        for student_number, name, email, program, year, study_level in student_data:
            student, created = Student.objects.get_or_create(
                student_number=student_number,
                defaults={
                    'name': name,
                    'email': email,
                    'program': program,
                    'year_standing': year,
                    'study_level': study_level
                }
            )
            students.append(student)
            if created:
                self.stdout.write(f'  Created student: {name} ({student_number})')
        
        return students
    
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
                offering, created = CourseOffering.objects.get_or_create(
                    course=course,
                    section_number=section,
                    academic_term=term,
                    defaults={'instructor': instructor}
                )
                offerings.append(offering)
                if created:
                    self.stdout.write(f'  Created offering: {course_number} {section} - {term.code}')
            except Course.DoesNotExist:
                self.stdout.write(f'  Warning: Course {course_number} not found')
        
        return offerings
    
    def create_shared_sessions(self, courses, terms, time_slots, students):
        """Create shared session (lab/tutorial) data with TA assignments"""
        sessions = []
        
        # Get some specific data
        w2025_t1 = Term.objects.get(code='W2025 Term 1')
        w2025_t2 = Term.objects.get(code='W2025 Term 2')
        
        # Get CS students (potential TAs)
        cs_students = [s for s in students if s.program == 'Computer Science']
        
        # Create labs and tutorials for programming courses
        session_data = [
            # COSC 111 labs
            ('COSC 111', w2025_t1, 'lab', 'L01', cs_students[0] if cs_students else None),
            ('COSC 111', w2025_t1, 'lab', 'L02', cs_students[1] if len(cs_students) > 1 else None),
            ('COSC 111', w2025_t1, 'lab', 'L03', cs_students[2] if len(cs_students) > 2 else None),
            ('COSC 111', w2025_t2, 'lab', 'L01', cs_students[3] if len(cs_students) > 3 else None),
            
            # COSC 111 tutorials
            ('COSC 111', w2025_t1, 'tutorial', 'T01', cs_students[4] if len(cs_students) > 4 else None),
            ('COSC 111', w2025_t2, 'tutorial', 'T01', cs_students[5] if len(cs_students) > 5 else None),
            
            # COSC 121 labs
            ('COSC 121', w2025_t2, 'lab', 'L01', cs_students[6] if len(cs_students) > 6 else None),
            ('COSC 121', w2025_t2, 'lab', 'L02', cs_students[7] if len(cs_students) > 7 else None),
            
            # COSC 320 tutorials
            ('COSC 320', w2025_t1, 'tutorial', 'T01', cs_students[8] if len(cs_students) > 8 else None),
            ('COSC 320', w2025_t2, 'tutorial', 'T01', cs_students[0] if cs_students else None),  # Reuse first student
            
            # COSC 499 seminars
            ('COSC 499', w2025_t2, 'seminar', 'S01', cs_students[1] if len(cs_students) > 1 else None),
        ]
        
        for course_number, term, session_type, section, assigned_student in session_data:
            try:
                course = Course.objects.get(course_number=course_number)
                session, created = SharedSession.objects.get_or_create(
                    session_type=session_type,
                    course=course,
                    section_number=section,
                    academic_term=term,
                    defaults={'student': assigned_student}
                )
                
                if created:
                    # Assign random time slots
                    import random
                    assigned_slots = random.sample(time_slots, k=random.randint(1, 2))
                    session.time_slots.set(assigned_slots)
                    ta_info = f"TA: {assigned_student.name}" if assigned_student else "No TA assigned"
                    self.stdout.write(f'  Created session: {course_number} {section} ({session_type}) - {term.code} ({ta_info})')
                
                sessions.append(session)
            except Course.DoesNotExist:
                self.stdout.write(f'  Warning: Course {course_number} not found')
        
        return sessions
    
    def create_instructor_requests(self, instructors, course_offerings):
        """Create instructor request data"""
        requests = []
        
        # Get some sample data
        from datetime import date, timedelta
        today = date.today()
        
        # Sample instructor requests
        request_data = [
            (instructors[0], course_offerings[0], today - timedelta(days=5), 'Request for additional grading support for COSC 111 section 001'),
            (instructors[1], course_offerings[1], today - timedelta(days=3), 'Need teaching assistant for lab sections in COSC 111 section 002'),
            (instructors[0], course_offerings[2], today - timedelta(days=10), 'Requesting TA support for office hours and grading'),
            (instructors[2], course_offerings[4], today - timedelta(days=1), 'Summer session COSC 121 requires additional tutoring support'),
            (instructors[1], course_offerings[7], today - timedelta(days=15), 'COSC 320 complex algorithms course needs advanced TA'),
            (instructors[2], course_offerings[8], today - timedelta(days=7), 'Capstone project coordination requires graduate student assistance'),
            (instructors[0], course_offerings[9], today - timedelta(days=20), 'Large enrollment in MATH 100 requires multiple grading assistants'),
            (instructors[0], course_offerings[10], today - timedelta(days=2), 'Second section of MATH 100 needs lab supervision'),
        ]
        
        for instructor, course_offering, request_date, description in request_data:
            try:
                request, created = InstructorRequest.objects.get_or_create(
                    instructor=instructor,
                    course_offering=course_offering,
                    request_date=request_date,
                    defaults={'request_description': description}
                )
                requests.append(request)
                if created:
                    offering_info = f"{course_offering.course.course_number} {course_offering.section_number}"
                    self.stdout.write(f'  Created request: {instructor.name} -> {offering_info}')
            except Exception as e:
                self.stdout.write(f'  Warning: Failed to create request - {str(e)}')
        
        return requests
