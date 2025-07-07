from rest_framework import serializers
from .models import Course, CourseOffering, AcademicTerm, TimeSlot


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = '__all__'

class AcademicTermCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ['year', 'term_number', 'term', 'start_date', 'end_date']

    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("Start date must be before end date.")
        return data


class TimeSlotSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = TimeSlot
        fields = ['slot_id', 'day', 'start_time', 'end_time', 'duration']
    
    def get_duration(self, obj):
        """Calculate and return the duration of the time slot"""
        if obj.duration:
            return str(obj.duration)
        return None

class TimeSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['day', 'start_time', 'end_time']

    def validate(self, data):
        """Validate that end_time is after start_time"""
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        
        # Check for overlapping time slots on the same day
        overlapping_slots = TimeSlot.objects.filter(
            day=data['day'],
            start_time__lt=data['end_time'],
            end_time__gt=data['start_time']
        )
        
        # Exclude current instance if updating
        if self.instance:
            overlapping_slots = overlapping_slots.exclude(pk=self.instance.pk)
            
        if overlapping_slots.exists():
            raise serializers.ValidationError(
                f"Time slot overlaps with existing slot on {data['day']}"
            )
        
        return data

class CourseSerializer(serializers.ModelSerializer):
    offerings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['course_number', 'course_name', 'department', 'course_description', 'course_level', 'offerings_count']
    
    def get_offerings_count(self, obj):
        """Get the number of current offerings for this course"""
        return obj.offerings.count()

class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['course_number', 'course_name', 'department', 'course_description', 'course_level']
    
    def validate_course_number(self, value):
        """Validate course number format"""
        import re
        if not re.match(r'^[A-Z]{3,4}\d{3}[A-Z]?$', value):
            raise serializers.ValidationError(
                "Course number must be in format like 'COSC499' or 'MATH101A'"
            )
        return value
    
    def validate_course_level(self, value):
        """Validate course level"""
        if value and not value.isdigit():
            raise serializers.ValidationError("Course level must be numeric (e.g., '100', '400')")
        if value and (int(value) < 100 or int(value) > 999):
            raise serializers.ValidationError("Course level must be between 100 and 999")
        return value

class CourseOfferingSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    academic_term = AcademicTermSerializer(read_only=True)
    instructor = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CourseOffering
        fields = [
            'course_offering_id', 'course', 'section_number', 'academic_term',
            'instructor'
        ]

class CourseOfferingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseOffering
        fields = [
            'course', 'section_number', 'academic_term',
            'instructor'
        ]

    def validate_section_number(self, value):
        """Validate section number format"""
        import re
        if not re.match(r'^[A-Z0-9]{1,3}$', value):
            raise serializers.ValidationError(
                "Section number must be 1-3 characters, alphanumeric (e.g., '001', 'L01')"
            )
        return value

