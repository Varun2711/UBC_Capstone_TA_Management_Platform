from rest_framework import serializers
from .models import Course, CourseOffering, AcademicTerm, TimeSlot


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = '__all__'


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['slot_id', 'day', 'start_time', 'end_time']

class TimeSlotCreateSerializer(serializers.Serializer):
    day = serializers.ChoiceField(choices=TimeSlot.DAYS_OF_WEEK)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        return data

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class CourseOfferingSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    academic_term = AcademicTermSerializer(read_only=True)
    instructor = serializers.StringRelatedField(read_only=True)
    time_slots = TimeSlotSerializer(many=True, read_only=True)

    class Meta:
        model = CourseOffering
        fields = '__all__'

class CourseOfferingCreateSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotCreateSerializer(many=True)

    class Meta:
        model = CourseOffering
        fields = [
            'course', 'section_number', 'academic_term',
            'instructor', 'enrollment_capacity', 'enrollment_current',
            'time_slots'
        ]

    def create(self, validated_data):
        time_slots_data = validated_data.pop('time_slots')

        # Extract FK relations (assume they are passed by ID/UUID)
        course = validated_data.pop('course')
        academic_term = validated_data.pop('academic_term')
        instructor = validated_data.pop('instructor', None)

        # Create the CourseOffering
        course_offering = CourseOffering.objects.create(
            course=course,
            academic_term=academic_term,
            instructor=instructor,
            **validated_data
        )

        # Add time slots (create or reuse)
        for slot in time_slots_data:
            slot_obj, _ = TimeSlot.objects.get_or_create(
                day=slot['day'],
                start_time=slot['start_time'],
                end_time=slot['end_time']
            )
            course_offering.time_slots.add(slot_obj)

        return course_offering

