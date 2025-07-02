# this file will consist of utility functions for the user profile service
from api.models import Student, Instructor, TAScheduler, Admin


def get_user_by_id(user_id, user_type):
    """
    Find a user by their id (based on student_number or employee_number).
    
    Args:
        user_id (str): Student number or employee number
        user_type (str): Type of user ('student', 'instructor', 'scheduler')
        
    Returns:
        object or None: User object if found, None otherwise
    """
    if user_type == 'student':
        try:
            return Student.objects.get(student_number=user_id)
        except Student.DoesNotExist:
            return None
            
    elif user_type == 'instructor':
        try:
            return Instructor.objects.get(employee_number=user_id)
        except Instructor.DoesNotExist:
            return None
            
    elif user_type == 'scheduler':
        try:
            return TAScheduler.objects.get(employee_number=user_id)
        except TAScheduler.DoesNotExist:
            return None
        
    elif user_type == 'admin':
        try:
            return Admin.objects.get(employee_number=user_id)
        except Admin.DoesNotExist:
            return None
            
    return None

def get_user_by_email(email):
    """
    Find a user by email across all user types.
    
    Args:
        email (str): Email address to search for
        
    Returns:
        tuple: (user object, user_type string) or (None, None) if not found
    """
    # Check if user exists as a student
    try:
        user = Student.objects.get(email=email)
        return user, 'student'
    except Student.DoesNotExist:
        pass
    
    # Check if user exists as an instructor
    try:
        user = Instructor.objects.get(email=email)
        return user, 'instructor'
    except Instructor.DoesNotExist:
        pass
    
    # Check if user exists as a scheduler
    try:
        user = TAScheduler.objects.get(email=email)
        return user, 'scheduler'
    except TAScheduler.DoesNotExist:
        pass

    try:
        user = Admin.objects.get(email=email)
        return user, 'admin'
    except Admin.DoesNotExist:
        pass
    
    return None, None

def get_user_details(user, user_type):
    """
    Get user details from a user object.
    
    Args:
        user: Student, Instructor, or TAScheduler object
        user_type (str): Type of user ('student', 'instructor', 'scheduler')
        
    Returns:
        dict: User information
    """
    if user_type == 'student':
        return {
            'id': user.student_number,
            'name': user.name,
            'email': user.email,
            'type': 'student',
            'program': user.program,
            'study_level': user.study_level,
            'year': user.year_standing,
            'department': user.department.name if user.department else None,
            'phone': user.phone
        }
            
    elif user_type == 'instructor':
        return {
            'id': user.employee_number,
            'name': user.name,
            'email': user.email,
            'type': 'instructor',
            'faculty': user.faculty.name if user.faculty else None
        }
            
    elif user_type == 'scheduler':
        return {
            'id': user.employee_number,
            'name': user.name,
            'email': user.email,
            'type': 'scheduler',
            'department': user.department.name if user.department else None
        }
    
    elif user_type == 'admin':
        return {
            'id': user.employee_number,
            'name': user.name,
            'email': user.email,
            'type': 'admin'
        }
    
    return None