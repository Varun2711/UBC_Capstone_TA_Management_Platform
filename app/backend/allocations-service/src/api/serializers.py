from rest_framework import serializers
from .models import (
    Offer, Assignment, Student, CourseOffering, SharedSession, Application, 
    ApplicationShortList, Term, JobPosting, OfferItem, Course, AssignmentModification
)

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'student_number', 'name', 'email', 'study_level']

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'code', 'description', 'academicYear', 'term_type']

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = ['posting_id']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'course_number', 'course_name', 'department', 'course_level']

class ApplicationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    termSelection = TermSerializer(read_only=True)
    posting = JobPostingSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'application_id', 'student', 'posting', 'status', 'applied_at', 'updated_at',
            'positionType', 'termSelection', 'workload', 'disciplineRankings',
            'citizenshipStatus', 'residingInKelowna', 'fullTimeEnrollment', 
            'hasOtherPositions', 'otherPositionHours'
        ]

class ShortlistedApplicantSerializer(serializers.ModelSerializer):
    """Serializer for shortlisted applicants available for allocation"""
    application = ApplicationSerializer(read_only=True)
    shortlisted_by = serializers.StringRelatedField(source='created_by')
    
    class Meta:
        model = ApplicationShortList
        fields = ['application', 'shortlisted_by', 'created_at', 'notes']

class CourseOfferingSerializer(serializers.ModelSerializer):
    """Serializer for course offering details in offers"""
    course = CourseSerializer(read_only=True)
    instructor = serializers.StringRelatedField(read_only=True)
    academic_term = TermSerializer(read_only=True)
    
    class Meta:
        model = CourseOffering
        fields = [
            'course_offering_id', 'course', 'section_number', 
            'academic_term', 'instructor'
        ]

class SharedSessionSerializer(serializers.ModelSerializer):
    """Serializer for shared session details in offers"""
    course = CourseSerializer(read_only=True)
    academic_term = TermSerializer(read_only=True)
    
    class Meta:
        model = SharedSession
        fields = [
            'shared_session_id', 'session_type', 'course', 'section_number', 
            'academic_term', 'student'
        ]

class OfferItemSerializer(serializers.ModelSerializer):
    """Simplified serializer for individual offer items"""
    # Remove full course_offering and shared_session details
    # Keep only essential computed fields
    course_number = serializers.SerializerMethodField()
    section_number = serializers.SerializerMethodField()
    weekly_hours = serializers.SerializerMethodField()
    time_slot = serializers.SerializerMethodField()
    all_time_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = OfferItem
        fields = [
            'offer_item_id', 'item_type', 
            'course_number', 'section_number', 'weekly_hours','time_slot'
            ,'all_time_slots' #return all time slots for the calendar view in the frontend
            # *** REMOVED: course_offering, shared_session, course, term, time_slot_details, required_hours_category
        ]
    
    def get_course_number(self, obj):
        return obj.course_number
    
    def get_section_number(self, obj):
        return obj.section_number
    
    def get_weekly_hours(self, obj):
        """Get calculated weekly hours from time slots"""
        return obj.weekly_hours
    
    def get_time_slot(self, obj):
        """Get the specific time slot details for this item."""
        details = obj.time_slot_details
        # The property returns a list, we want the first (and only) item
        if details:
            return details[0]
        return None
    
    def get_all_time_slots(self, obj):
        """Get the all time slot details for this offer item."""
        details = obj.session_time_slot_details
        # The property returns a list, we want the first (and only) item
        if details:
            return details
        return None

class OfferSerializer(serializers.ModelSerializer):
    """Simplified serializer for multi-item offers"""
    # Basic student info only (no full application details)
    student = StudentSerializer(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    # Multi-item support
    offer_items = OfferItemSerializer(many=True, read_only=True)

    #  to identify modification offers
    is_modification = serializers.SerializerMethodField()
    modification_details = serializers.SerializerMethodField()
    
    # Essential computed fields only
    total_weekly_hours = serializers.SerializerMethodField()
    position_summary = serializers.SerializerMethodField()
    
    # Datetime fields
    response_deadline = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', required=False, allow_null=True)
    offer_date = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    responded_at = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', read_only=True, allow_null=True)
    
    class Meta:
        model = Offer
        fields = [
            'offer_id', 'student', 'offer_items',
            'role', 'offer_date', 'response_deadline', 'status',
            'responded_at', 'student_response', 'created_by', 'notes',
            'total_weekly_hours', 'position_summary','is_modification', 'modification_details'
        ]
    
    def get_total_weekly_hours(self, obj):
        """Get total weekly hours calculated from offer items"""
        return obj.total_weekly_hours
    
    def get_position_summary(self, obj):
        """Get a brief summary of positions in this offer"""
        items = obj.offer_items.all()
        if not items:
            return "No positions assigned"
        
        summaries = []
        for item in items:
            if item.item_type == 'course_offering':
                summaries.append(f"{item.course_number} {item.section_number}")
            elif item.item_type == 'shared_session':
                summaries.append(f"{item.course_number} {item.section_number} (Lab)")
        
        return " + ".join(summaries)

    def to_representation(self, instance):
        """Add computed fields that were previously model properties"""
        data = super().to_representation(instance)
        
        # Add essential status fields
        data['can_respond'] = instance.can_respond()
        data['is_expired'] = instance.is_expired()
        
        return data

    # *** ADD: Computed fields for backward compatibility ***
    def to_representation(self, instance):
        """Add computed fields that were previously model properties"""
        data = super().to_representation(instance)
        
        # Add the missing method-based fields
        data['can_respond'] = instance.can_respond()
        data['is_expired'] = instance.is_expired()
        
        return data
    
    def get_is_modification(self, obj):
        """Check if this offer is part of an assignment modification"""
        return hasattr(obj, 'assignment_modifications') and obj.assignment_modifications.exists()
    
    def get_modification_details(self, obj):
        """Get modification details if this is a modification offer"""
        if hasattr(obj, 'assignment_modifications') and obj.assignment_modifications.exists():
            modification = obj.assignment_modifications.first()
            return {
                'modification_id': modification.modification_id,
                'reason': modification.reason,
                'modification_type': modification.modification_type,
                'original_assignment_id': modification.original_assignment.assignment_id,
                'created_at': modification.created_at
            }
        return None

class AssignmentSerializer(serializers.ModelSerializer):
    """Updated assignment serializer"""
    student = StudentSerializer(read_only=True)
    course = CourseSerializer(read_only=True) #Course is nested in course_offering
    course_offering = CourseOfferingSerializer(read_only=True)
    shared_session = SharedSessionSerializer(read_only=True)
    offer_details = OfferSerializer(source='offer', read_only=True)
    assigned_by = serializers.StringRelatedField(read_only=True)
    
    # Add computed fields
    weekly_hours = serializers.SerializerMethodField()
    required_hours_category = serializers.SerializerMethodField()
    time_slots = serializers.SerializerMethodField() 
    
    class Meta:
        model = Assignment
        fields = [
            'assignment_id', 'offer', 'student', 
            'course', #course is nested in course_offering
            'course_offering', 'shared_session',
            # *** REMOVE: 'required_hours' (doesn't exist in model anymore)
            'role', 'assigned_date', 'assigned_by', 'is_active',
            'notes', 'offer_details', 'created_at', 'updated_at',
            'weekly_hours', 'required_hours_category'  # ← Add computed fields
            ,'time_slots'  
        ]
        read_only_fields = ['assignment_id', 'assigned_date']
    
    def get_weekly_hours(self, obj):
        """Get calculated weekly hours from time slots"""
        return obj.weekly_hours
    
    def get_required_hours_category(self, obj):
        """Get the hours category based on actual hours"""
        return obj.required_hours_category
    
    def get_time_slots(self,obj):
        """Get all relevant time slots for this assignment"""
        time_slots = obj.get_all_time_slots  # Fixed: added parentheses
        # Return basic time slot info - adjust fields as needed
        return [
            {
                'slot_id': str(slot.slot_id) if hasattr(slot, 'slot_id') else None,
                'day': slot.get_day_display() if hasattr(slot, 'get_day_display') else None,
                'start_time': slot.start_time.strftime('%H:%M') if hasattr(slot, 'start_time') and slot.start_time else None,
                'end_time': slot.end_time.strftime('%H:%M') if hasattr(slot, 'end_time') and slot.end_time else None,
            }
            for slot in time_slots
        ]    
    
class AssignmentModificationSerializer(serializers.ModelSerializer):
    """Serializer for assignment modifications that appear in student's offers"""
    original_assignment = AssignmentSerializer(read_only=True)
    new_offer = OfferSerializer(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = AssignmentModification
        fields = [
            'modification_id', 'original_assignment', 'new_offer', 
            'reason', 'modification_type', 'status', 'requires_response',
            'created_by', 'created_at', 'student_responded_at', 'student_response'
        ]
        read_only_fields = ['modification_id', 'created_at', 'student_responded_at']