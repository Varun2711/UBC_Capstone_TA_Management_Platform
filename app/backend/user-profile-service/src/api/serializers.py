from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Student, Instructor, TAScheduler, Admin, StudentProfile, StudentExperience, StudentAvailability, StudentCoursePreference, StudentSkill, Department

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']  
        read_only_fields = ['id', 'name']  

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }

class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }


class TASchedulerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TAScheduler
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }

class SchedulerInstructorSerializer(serializers.Serializer):
    """Serializer for TA scheduler instructor management"""
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    department = serializers.CharField(max_length=100)
    employee_number = serializers.CharField(max_length=20, required=True, allow_blank=False)
    
    def validate_email(self, value):
        # Check if creating new instructor
        if not self.instance:
            if Instructor.objects.filter(email=value).exists():
                raise serializers.ValidationError("Instructor with this email already exists.")
        else:
            # Check if updating existing instructor
            if Instructor.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_employee_number(self, value):
        if not value:
            return value
        
        # Check if creating new instructor
        if not self.instance:
            if Instructor.objects.filter(employee_number=value).exists():
                raise serializers.ValidationError("Instructor with this employee number already exists.")
        else:
            # Check if updating existing instructor
            if Instructor.objects.exclude(pk=self.instance.pk).filter(employee_number=value).exists():
                raise serializers.ValidationError("This employee number is already in use.")
        return value

class SchedulerInstructorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating instructor via TA scheduler"""
    department = serializers.SlugRelatedField(
        queryset=Department.objects.all(),
        slug_field='name'
    )

    class Meta:
        model = Instructor
        fields = ['name', 'email', 'department']

    def validate_email(self, value):
        """Ensure email is not already in use by another instructor"""
        instance = self.instance
        if Instructor.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['employee_number', 'name', 'email', 'password', 'is_active', 'created_at']
        read_only_fields = ['created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['gpa', 'year_degree_start', 'minor', 'ubc_employee_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

# role-specific serializers
class TASchedulerProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = TAScheduler
        fields = ['employee_number', 'name', 'email', 'department', 'department_name']

class InstructorProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Instructor
        fields = ['id', 'employee_number', 'name', 'email', 'department', 'department_name']  # Add 'id' to fields

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['employee_number', 'name', 'email']

class UpdateStudentProfileSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer()
    student_number = serializers.CharField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    year_standing = serializers.IntegerField(required=False)  # ✅ Add this line
    expected_graduation = serializers.CharField(required=False, allow_blank=True)  # ✅ Add this line
    program = serializers.CharField(required=False, allow_blank=True)  # ✅ Add this too
    study_level = serializers.CharField(required=False, allow_blank=True)  # ✅ Add this too
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'student_profile', 
            'student_number', 'phone', 'year_standing', 'expected_graduation', 
            'program', 'study_level'  #
        ]

class UpdateStudentSerializer(serializers.ModelSerializer):
    """Serializer for updating student records in admin panel"""
    first_name = serializers.CharField(max_length=50, required=False, write_only=True)
    last_name = serializers.CharField(max_length=50, required=False, write_only=True)
    
    class Meta:
        model = Student
        fields = ['name', 'email', 'student_number', 'department', 'phone', 'program', 'year_standing', 'study_level', 'expected_graduation', 'first_name', 'last_name']
        read_only_fields = ['is_active']
        
    def validate_email(self, value):
        """Ensure email is not already in use by another student"""
        instance = self.instance
        if Student.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_student_number(self, value):
        """Ensure student number is not already in use by another student"""
        instance = self.instance
        if Student.objects.exclude(pk=instance.pk).filter(student_number=value).exists():
            raise serializers.ValidationError("This student number is already in use.")
        return value
    
    def update(self, instance, validated_data):
        # Handle first_name and last_name combination
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        # If both first_name and last_name are provided, combine them into name
        if first_name and last_name:
            validated_data['name'] = f"{first_name} {last_name}"
        elif first_name:
            # If only first_name, keep existing last name
            existing_name_parts = instance.name.split(' ', 1)
            last_name_part = existing_name_parts[1] if len(existing_name_parts) > 1 else ''
            validated_data['name'] = f"{first_name} {last_name_part}".strip()
        elif last_name:
            # If only last_name, keep existing first name
            existing_name_parts = instance.name.split(' ', 1)
            first_name_part = existing_name_parts[0] if existing_name_parts else ''
            validated_data['name'] = f"{first_name_part} {last_name}".strip()
            
        return super().update(instance, validated_data)
    
class UpdateInstructorSerializer(serializers.ModelSerializer):
    """Serializer for updating instructor profiles"""
    first_name = serializers.CharField(max_length=50, required=False, write_only=True)
    last_name = serializers.CharField(max_length=50, required=False, write_only=True)
    
    class Meta:
        model = Instructor
        fields = ['name', 'email', 'department', 'employee_number', 'first_name', 'last_name']
        read_only_fields = ['is_active']
        
    def validate_email(self, value):
        """Ensure email is not already in use by another instructor"""
        instance = self.instance
        if Instructor.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_employee_number(self, value):
        """Ensure employee number is not already in use by another instructor"""
        instance = self.instance
        if Instructor.objects.exclude(pk=instance.pk).filter(employee_number=value).exists():
            raise serializers.ValidationError("This employee number is already in use.")
        return value
    
    def update(self, instance, validated_data):
        # Handle first_name and last_name combination
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        # If both first_name and last_name are provided, combine them into name
        if first_name and last_name:
            validated_data['name'] = f"{first_name} {last_name}"
        elif first_name:
            # If only first_name, keep existing last name
            existing_name_parts = instance.name.split(' ', 1)
            last_name_part = existing_name_parts[1] if len(existing_name_parts) > 1 else ''
            validated_data['name'] = f"{first_name} {last_name_part}".strip()
        elif last_name:
            # If only last_name, keep existing first name
            existing_name_parts = instance.name.split(' ', 1)
            first_name_part = existing_name_parts[0] if existing_name_parts else ''
            validated_data['name'] = f"{first_name_part} {last_name}".strip()
            
        return super().update(instance, validated_data)


class UpdateTASchedulerSerializer(serializers.ModelSerializer):
    """Serializer for updating TA scheduler profiles"""
    first_name = serializers.CharField(max_length=50, required=False, write_only=True)
    last_name = serializers.CharField(max_length=50, required=False, write_only=True)
    
    class Meta:
        model = TAScheduler
        fields = ['name', 'email', 'department', 'employee_number', 'first_name', 'last_name']
        read_only_fields = ['is_active']
        
    def validate_email(self, value):
        """Ensure email is not already in use by another scheduler"""
        instance = self.instance
        if TAScheduler.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_employee_number(self, value):
        """Ensure employee number is not already in use by another scheduler"""
        instance = self.instance
        if TAScheduler.objects.exclude(pk=instance.pk).filter(employee_number=value).exists():
            raise serializers.ValidationError("This employee number is already in use.")
        return value
    
    def update(self, instance, validated_data):
        # Handle first_name and last_name combination
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        # If both first_name and last_name are provided, combine them into name
        if first_name and last_name:
            validated_data['name'] = f"{first_name} {last_name}"
        elif first_name:
            # If only first_name, keep existing last name
            existing_name_parts = instance.name.split(' ', 1)
            last_name_part = existing_name_parts[1] if len(existing_name_parts) > 1 else ''
            validated_data['name'] = f"{first_name} {last_name_part}".strip()
        elif last_name:
            # If only last_name, keep existing first name
            existing_name_parts = instance.name.split(' ', 1)
            first_name_part = existing_name_parts[0] if existing_name_parts else ''
            validated_data['name'] = f"{first_name_part} {last_name}".strip()
            
        return super().update(instance, validated_data)


class UpdateAdminSerializer(serializers.ModelSerializer):
    """Serializer for updating admin profiles"""
    class Meta:
        model = Admin
        fields = ['name', 'email', 'employee_number']
        read_only_fields = ['is_active', 'created_at']
        
    def validate_email(self, value):
        """Ensure email is not already in use by another admin"""
        instance = self.instance
        if Admin.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def validate_employee_number(self, value):
        """Ensure employee number is not already in use by another admin"""
        instance = self.instance
        if Admin.objects.exclude(pk=instance.pk).filter(employee_number=value).exists():
            raise serializers.ValidationError("This employee number is already in use.")
        return value

class StudentExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentExperience
        fields = [
            'id', 'experience_type', 'position_title', 'organization',  
            'start_date', 'end_date', 'is_current', 'description',    
            'created_at', 'updated_at'    
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Custom validation for TA experience"""
        # Ensure end_date is after start_date if provided
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError("End date cannot be before start date.")
        
        # If is_current is True, end_date should be None
        if data.get('is_current') and data.get('end_date'):
            raise serializers.ValidationError("Current positions should not have an end date.")
        
        return data

class StudentSkillsSerializer( serializers.ModelSerializer):
    class Meta:
        model = StudentSkill
        fields = ['id', 'skill_type', 'name', 'created_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StudentAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAvailability
        fields = ['id', 'availability_grid', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_availability_grid(self, value):
        # Validate that the grid follows the expected format
        # Expected format: {"monday": ["9:00-10:00", "14:00-15:00"], ...}
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("Availability grid must be a dictionary")
        
        for day, times in value.items():
            if day not in valid_days:
                raise serializers.ValidationError(f"Invalid day in grid: {day}")
            if not isinstance(times, list):
                raise serializers.ValidationError(f"Times for {day} must be a list")
        return value

class StudentCoursePreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCoursePreference
        fields = ['id', 'course_code', 'preference_rank', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ComprehensiveStudentProfileSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer()
    experiences = StudentExperienceSerializer(many=True, read_only=True)
    skills = StudentSkillsSerializer(many=True, read_only=True)
    availability = StudentAvailabilitySerializer(read_only=True)
    course_preferences = StudentCoursePreferenceSerializer(many=True, read_only=True)
    
    # Override the ID to return the Student model ID instead of User model ID
    id = serializers.SerializerMethodField()
    student_info = serializers.SerializerMethodField()
    
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'student_info','student_profile', 'experiences', 'skills', 
            'availability', 'course_preferences'
        ]

    def get_id(self, obj):
        """Return the Student model ID instead of User model ID"""
        try:
            student = Student.objects.get(email=obj.email)
            return student.id
        except Student.DoesNotExist:
            return obj.id  # Fallback to User ID if no Student found

    def get_student_info(self, obj):
        """Get student info from the custom Student model"""
        try:
            student = Student.objects.get(email=obj.email)
            return {
                'student_number': student.student_number,
                'program': student.program,
                'year_standing': student.year_standing,
                'study_level': student.study_level,
                'phone': student.phone,
                'expected_graduation': student.expected_graduation
            }
        except Student.DoesNotExist:
            return None
        
class CreateInstructorSerializer(serializers.Serializer):
    DEPARTMENT_CHOICES = [
        ('astr', 'Astronomy'),
        ('math', 'Mathematics'),
        ('phy', 'Physics'),
        ('data', 'Data Science'),
        ('stat', 'Statistics'), 
        ('cosc', 'Computer Science'),
        ('eng', 'Engineering'),  # Add Engineering
        ('psych', 'Psychology'),  # Add Psychology
        ('bio', 'Biology'),  # Add Biology
        ('chem', 'Chemistry'),  # Add Chemistry
        # based on current ta application form
    ]
    department = serializers.ChoiceField(choices=DEPARTMENT_CHOICES)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    employee_number = serializers.CharField(max_length=20)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        if Instructor.objects.filter(email=value).exists():
            raise serializers.ValidationError("Instructor with this email already exists.")
        return value
    
    def validate_employee_number(self, value):
        if Instructor.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("Instructor with this employee number already exists.")
        return value
    
class CreateSchedulerSerializer(serializers.Serializer):
    DEPARTMENT_CHOICES = [
        ('astr', 'Astronomy'),
        ('math', 'Mathematics'),
        ('phy', 'Physics'),
        ('data', 'Data Science'),
        ('stat', 'Statistics'), 
        ('cosc', 'Computer Science'),
        ('eng', 'Engineering'),  # Add Engineering
        # based on current ta application form
    ]
    department = serializers.ChoiceField(choices=DEPARTMENT_CHOICES)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    employee_number = serializers.CharField(max_length=20)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        if TAScheduler.objects.filter(email=value).exists():
            raise serializers.ValidationError("TA Scheduler with this email already exists.")
        return value
    
    def validate_employee_number(self, value):
        if TAScheduler.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("TA Scheduler with this employee number already exists.")
        return value
    
    # Adding serializer for admin accounts 
class CreateAdminSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    employee_number = serializers.CharField(max_length=20)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        if Admin.objects.filter(email=value).exists():
            raise serializers.ValidationError("Admin with this email already exists.")
        return value
    
    def validate_employee_number(self, value):
        if Admin.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("Admin with this employee number already exists.")
        return value
