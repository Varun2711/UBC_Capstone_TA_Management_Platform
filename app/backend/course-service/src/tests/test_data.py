"""
Test configuration and setup for bulk import tests.
"""

# Test data constants
VALID_CSV_HEADERS = [
    'Session year', 'Term type', 'term number', 'department', 
    'course number', 'course name', 'course description', 
    'item_type', 'section number', 'weekday', 'time start', 'time end'
]

VALID_ITEM_TYPES = ['lecture', 'lab', 'tutorial', 'seminar']

VALID_WEEKDAYS = {
    'monday': ['monday', 'mon', 'm'],
    'tuesday': ['tuesday', 'tue', 'tues', 't'],
    'wednesday': ['wednesday', 'wed', 'w'],
    'thursday': ['thursday', 'thu', 'thurs', 'th'],
    'friday': ['friday', 'fri', 'f'],
    'saturday': ['saturday', 'sat'],
    'sunday': ['sunday', 'sun']
}

# Sample test data
SAMPLE_VALID_CSV_ROW = {
    'Session year': '2025',
    'Term type': 'winter',
    'term number': '1',
    'department': 'Computer Science',
    'course number': 'COSC 101',
    'course name': 'Introduction to Programming',
    'course description': 'Basic programming concepts',
    'item_type': 'lecture',
    'section number': '001',
    'weekday': 'Monday',
    'time start': '09:00',
    'time end': '10:30'
}

SAMPLE_VALID_CSV_CONTENT = """Session year,Term type,term number,department,course number,course name,course description,item_type,section number,weekday,time start,time end
2025,winter,1,Computer Science,COSC 101,Introduction to Programming,Basic programming concepts,lecture,001,Monday,09:00,10:30
2025,winter,1,Computer Science,COSC 101,Introduction to Programming,Basic programming concepts,lecture,001,Wednesday,09:00,10:30
2025,winter,1,Computer Science,COSC 101,Programming Lab,Hands-on programming exercises,lab,L01,Friday,14:00,17:00"""

# Test cases for validation
INVALID_CSV_TEST_CASES = [
    {
        'name': 'missing_session_year',
        'data': {**SAMPLE_VALID_CSV_ROW, 'Session year': ''},
        'expected_error': 'Missing required fields'
    },
    {
        'name': 'missing_course_name',
        'data': {**SAMPLE_VALID_CSV_ROW, 'course name': ''},
        'expected_error': 'Missing required fields'
    },
    {
        'name': 'invalid_item_type',
        'data': {**SAMPLE_VALID_CSV_ROW, 'item_type': 'invalid_type'},
        'expected_error': 'Invalid item_type'
    },
    {
        'name': 'invalid_weekday',
        'data': {**SAMPLE_VALID_CSV_ROW, 'weekday': 'InvalidDay'},
        'expected_error': 'Invalid weekday'
    }
]

# Time format test cases
TIME_FORMAT_TEST_CASES = [
    ('09:00', True),
    ('9:00', True),
    ('10:30', True),
    ('23:59', True),
    ('00:00', True),
    ('12:00', True),
    ('25:00', False),  # Invalid hour
    ('12:60', False),  # Invalid minute
    ('abc:def', False),  # Non-numeric
    ('', False),  # Empty
    ('12', False),  # Missing colon
]

# Weekday format test cases
WEEKDAY_TEST_CASES = [
    ('Monday', 'monday'),
    ('monday', 'monday'),
    ('MONDAY', 'monday'),
    ('Mon', 'monday'),
    ('mon', 'monday'),
    ('M', 'monday'),
    ('m', 'monday'),
    ('Tuesday', 'tuesday'),
    ('Tue', 'tuesday'),
    ('T', 'tuesday'),
    ('Wednesday', 'wednesday'),
    ('Wed', 'wednesday'),
    ('W', 'wednesday'),
    ('Thursday', 'thursday'),
    ('Thu', 'thursday'),
    ('Th', 'thursday'),
    ('Friday', 'friday'),
    ('Fri', 'friday'),
    ('F', 'friday'),
    ('InvalidDay', None),
    ('', None),
    ('123', None),
]

# Term code generation test cases
TERM_CODE_TEST_CASES = [
    ('2025', 'winter', '1', 'W2025 Term 1'),
    ('2025', 'winter', '2', 'W2025 Term 2'),
    ('2025', 'winter', '0', 'W2025 Both Terms'),
    ('2025', 'summer', '1', 'S2025 Term 1'),
    ('2025', 'summer', '0', 'S2025 Both Terms'),
    ('2025', 'fall', '1', 'FALL2025 Term 1'),
    ('2025', 'WINTER', '1', 'W2025 Term 1'),  # Case insensitive
]

# Course level generation test cases
COURSE_LEVEL_TEST_CASES = [
    ('101', '100'),
    ('201', '200'),
    ('301', '300'),
    ('401', '400'),
    ('COSC 101', '100'),  # Non-digit first character
    ('', '100'),  # Empty string
    ('ABC', '100'),  # No digits
]
