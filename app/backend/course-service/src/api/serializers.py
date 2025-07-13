from rest_framework import serializers
from .models import (
    Term,
    Instructor,
    Department,
    TimeSlot,
    Course,
    CourseOffering,
    SharedSession,
    InstructorRequest,
    Student
)

# Term Serializer
class TermSerializer(serializers.ModelSerializer):
    """
    Serializer for Term model with CRUD operations support.
    Even though managed=False, we can perform CRUD operations on shared database.
    """
    # Read-only computed fields
    is_current = serializers.ReadOnlyField()
    subterms = serializers.SerializerMethodField()
    
    # Optional nested serialization for subset relationship
    subset_of = serializers.StringRelatedField(source='subsetOf', read_only=True)
    subset_of_id = serializers.PrimaryKeyRelatedField(
        source='subsetOf', 
        queryset=Term.objects.all(), 
        required=False, 
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = Term
        fields = [
            'id',  # Django auto-generated primary key
            'code',
            'description',
            'subset_of',
            'subset_of_id',
            'start',
            'end',
            'startCalendarYear',
            'endCalendarYear',
            'academicYear',
            'createdAt',
            'is_active',
            'term_type',
            'is_current',
            'subterms'
        ]
        read_only_fields = ['id', 'createdAt', 'is_current', 'subterms']
    
    def get_subterms(self, obj):
        """
        Get all subterms of this term with basic information.
        """
        subterms = obj.get_subterms()
        return [{'id': term.id, 'code': term.code, 'description': term.description} 
                for term in subterms]
    
    def validate(self, data):
        """
        Validate that start date is before end date and calendar years are consistent.
        """
        start_date = data.get('start')
        end_date = data.get('end')
        start_year = data.get('startCalendarYear')
        end_year = data.get('endCalendarYear')
        
        if start_date and end_date:
            if start_date >= end_date:
                raise serializers.ValidationError("Start date must be before end date.")
        
        if start_date and start_year:
            if start_date.year != start_year:
                raise serializers.ValidationError("Start calendar year must match the year of the start date.")
        
        if end_date and end_year:
            if end_date.year != end_year:
                raise serializers.ValidationError("End calendar year must match the year of the end date.")
        
        return data


# Instructor Serializer
class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = '__all__'
        # Exclude password in responses
        extra_kwargs = {
            'password': {'write_only': True}
        }


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']  
        read_only_fields = ['id', 'name']  

# TimeSlot Serializer
class TimeSlotSerializer(serializers.ModelSerializer):
    """
    Serializer for TimeSlot model with full CRUD operations.
    Includes validation for time consistency and computed duration field.
    """
    # Read-only computed fields
    duration = serializers.ReadOnlyField()
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    time_increments = serializers.ReadOnlyField()
    
    class Meta:
        model = TimeSlot
        fields = [
            'slot_id',
            'day',
            'day_display',
            'start_time',
            'end_time',
            'duration',
            'time_increments'
        ]
        read_only_fields = ['slot_id', 'duration', 'day_display', 'time_increments']
    
    def validate(self, data):
        """
        Validate that end_time is after start_time.
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time.")
        
        return data


# TimeSlot Input Serializer (for nested creation without uniqueness constraints)
class TimeSlotInputSerializer(serializers.Serializer):
    """
    Simplified serializer for time slot input data.
    Used for creating/finding time slots without uniqueness validation.
    """
    day = serializers.ChoiceField(choices=TimeSlot.DAYS_OF_WEEK)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    
    def validate(self, data):
        """
        Validate that end_time is after start_time.
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError("End time must be after start time.")
        
        return data


# Course Serializer
class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for Course model with full CRUD operations.
    Includes simplified department information (just name and id).
    """
    # Department information - just name and id
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_id = serializers.IntegerField(source='department.id', read_only=True)
    
    # For write operations, accept department by ID
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        write_only=True
    )
    
    # Related offerings (read-only)
    offerings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'course_number',
            'course_name',
            'department_name',
            'department_id',
            'department',
            'course_description',
            'course_level',
            'offerings_count'
        ]
        read_only_fields = ['id', 'department_name', 'department_id', 'offerings_count']
    
    def get_offerings_count(self, obj):
        """
        Get count of course offerings for this course.
        """
        return obj.offerings.count()
    
    def validate_course_number(self, value):
        """
        Validate that course number is not empty and properly formatted.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Course number cannot be empty.")
        return value.strip().upper()
    
    def validate_course_name(self, value):
        """
        Validate that course name is not empty.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Course name cannot be empty.")
        return value.strip()


# CourseOffering Serializer
class CourseOfferingSerializer(serializers.ModelSerializer):
    """
    Serializer for CourseOffering model with full CRUD operations.
    Includes nested information for course, term, and instructor.
    """
    # Nested serialization for related objects
    course_info = serializers.StringRelatedField(source='course', read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True
    )
    
    term_info = serializers.StringRelatedField(source='academic_term', read_only=True)
    term_id = serializers.PrimaryKeyRelatedField(
        source='academic_term',
        queryset=Term.objects.all(),
        write_only=True
    )
    
    instructor_info = serializers.StringRelatedField(source='instructor', read_only=True)
    instructor_id = serializers.PrimaryKeyRelatedField(
        source='instructor',
        queryset=Instructor.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = CourseOffering
        fields = [
            'course_offering_id',
            'course_info',
            'course_id',
            'section_number',
            'term_info',
            'term_id',
            'instructor_info',
            'instructor_id'
        ]
        read_only_fields = ['course_offering_id', 'course_info', 'term_info', 'instructor_info']
    
    def validate_section_number(self, value):
        """
        Validate that section number is not empty and properly formatted.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Section number cannot be empty.")
        return value.strip().upper()


# SharedSession Serializer
class SharedSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for SharedSession model with full CRUD operations.
    Includes nested information and many-to-many time slots.
    """
    # Display field for session type
    session_type_display = serializers.CharField(source='get_session_type_display', read_only=True)
    
    # Nested serialization for related objects
    course_info = serializers.StringRelatedField(source='course', read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course',
        queryset=Course.objects.all(),
        write_only=True
    )
    
    academic_term_info = serializers.StringRelatedField(source='academic_term', read_only=True)
    academic_term_id = serializers.PrimaryKeyRelatedField(
        source='academic_term',
        queryset=Term.objects.all(),
        write_only=True
    )
    
    # Student information for TA assignment
    student_info = serializers.StringRelatedField(source='student', read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    # Many-to-many time slots - support both ID-based and data-based creation
    time_slots_info = TimeSlotSerializer(source='time_slots', many=True, read_only=True)
    time_slot_ids = serializers.PrimaryKeyRelatedField(
        source='time_slots',
        queryset=TimeSlot.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    
    # Accept time slot data for auto-creation/linking
    time_slots = TimeSlotInputSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = SharedSession
        fields = [
            'shared_session_id',
            'session_type',
            'session_type_display',
            'course_info',
            'course_id',
            'section_number',
            'academic_term_info',
            'academic_term_id',
            'student_info',
            'student_id',
            'time_slots_info',
            'time_slot_ids',
            'time_slots'
        ]
        read_only_fields = ['shared_session_id', 'session_type_display', 'course_info', 'academic_term_info', 'student_info', 'time_slots_info']
    
    def validate_session_type(self, value):
        """
        Validate that session type is a valid choice.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Session type cannot be empty.")
        
        # Convert to lowercase for validation
        value = value.strip().lower()
        
        # Check if the value is in the valid choices
        valid_choices = [choice[0] for choice in SharedSession.SESSION_TYPE_CHOICES]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Invalid session type. Must be one of: {', '.join(valid_choices)}"
            )
        
        return value
    
    def validate_section_number(self, value):
        """
        Validate that section number is not empty and properly formatted.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Section number cannot be empty.")
        return value.strip().upper()
    
    def _handle_time_slots(self, validated_data):
        """
        Helper method to handle time slot creation/linking.
        Returns a list of TimeSlot objects to be assigned to the SharedSession.
        """
        # Extract time slot data - both fields map to 'time_slots' in validated_data due to source mapping
        # We need to check the original data to see which format was used
        time_slot_objects = []
        
        # Get the time slots from validated_data (could be from either field)
        time_slots_value = validated_data.pop('time_slots', [])
        
        # Check if we have TimeSlot objects (from time_slot_ids) or data dicts (from time_slots)
        for slot_item in time_slots_value:
            if hasattr(slot_item, 'slot_id'):
                # This is already a TimeSlot object from PrimaryKeyRelatedField
                time_slot_objects.append(slot_item)
            else:
                # This is slot data for creation/finding
                # Use the input serializer for proper validation
                slot_serializer = TimeSlotInputSerializer(data=slot_item)
                if slot_serializer.is_valid(raise_exception=True):
                    validated_slot_data = slot_serializer.validated_data
                    
                    # Try to find existing time slot first, create if not found
                    time_slot, created = TimeSlot.objects.get_or_create(
                        day=validated_slot_data['day'],
                        start_time=validated_slot_data['start_time'],
                        end_time=validated_slot_data['end_time']
                    )
                    time_slot_objects.append(time_slot)
        
        return time_slot_objects
    
    def create(self, validated_data):
        """
        Custom create method to handle time slot creation/linking.
        """
        # Handle time slots
        time_slot_objects = self._handle_time_slots(validated_data)
        
        # Create the SharedSession
        shared_session = SharedSession.objects.create(**validated_data)
        
        # Assign time slots
        if time_slot_objects:
            shared_session.time_slots.set(time_slot_objects)
        
        return shared_session
    
    def update(self, instance, validated_data):
        """
        Custom update method to handle time slot updates.
        """
        # Handle time slots
        time_slot_objects = self._handle_time_slots(validated_data)
        
        # Update the SharedSession fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update time slots if provided
        if time_slot_objects:
            instance.time_slots.set(time_slot_objects)
        
        return instance


# InstructorRequest Serializer
class InstructorRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for InstructorRequest model with full CRUD operations.
    Includes nested information for instructor and course offering.
    """
    # Nested serialization for related objects
    instructor_info = serializers.StringRelatedField(source='instructor', read_only=True)
    instructor_id = serializers.PrimaryKeyRelatedField(
        source='instructor',
        queryset=Instructor.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    course_offering_info = serializers.StringRelatedField(source='course_offering', read_only=True)
    course_offering_id = serializers.PrimaryKeyRelatedField(
        source='course_offering',
        queryset=CourseOffering.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = InstructorRequest
        fields = [
            'request_id',
            'instructor_info',
            'instructor_id',
            'course_offering_info',
            'course_offering_id',
            'request_date',
            'request_description'
        ]
        read_only_fields = ['request_id', 'instructor_info', 'course_offering_info']
    
    def validate_request_description(self, value):
        """
        Validate that request description is not empty.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Request description cannot be empty.")
        return value.strip()
    
    def validate_request_date(self, value):
        """
        Validate that request date is not in the past.
        """
        from django.utils import timezone
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Request date cannot be in the past.")
        return value


# Student Serializer
class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for Student model - read-only since it's managed in other services.
    """
    class Meta:
        model = Student
        fields = ['student_number', 'name', 'email', 'program', 'year_standing', 'study_level']
        read_only_fields = ['student_number', 'name', 'email', 'program', 'year_standing', 'study_level']