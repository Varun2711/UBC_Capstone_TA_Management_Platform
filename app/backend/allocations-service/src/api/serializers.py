from rest_framework import serializers
from .models import Offer, Assignment, Student, CourseOffering, SharedSession, Application, ApplicationShortList, Term, JobPosting

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['student_number', 'name', 'email', 'study_level']

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'code', 'description', 'academicYear', 'term_type']

class JobPostingSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosting
        fields = ['posting_id']

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

class OfferSerializer(serializers.ModelSerializer):
    application = ApplicationSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    # Include detailed information for both course offerings and shared sessions
    course_offering_id = serializers.CharField(read_only=True)  # ← Fixed from 'course_offering'
    shared_session_id = serializers.CharField(read_only=True, allow_null=True)
    
    course_offering_details = serializers.SerializerMethodField()
    shared_session_details = serializers.SerializerMethodField()
    position_details = serializers.SerializerMethodField()
    
    # Explicitly handle datetime fields
    response_deadline = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', required=False, allow_null=True)
    offer_date = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    responded_at = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', read_only=True, allow_null=True)
    
    class Meta:
        model = Offer
        fields = [
            'offer_id', 'application', 'course_offering_id', 'student', 'shared_session_id',
            'required_hours', 'role', 'offer_date', 'response_deadline', 'status',
            'responded_at', 'student_response', 'created_by', 'notes',
            'can_respond', 'is_expired', 'created_at', 'updated_at',
            # New detailed fields
            'course_offering_details', 'shared_session_details', 'position_details'
        ]
    
    def get_course_offering_details(self, obj):
        """Get detailed course offering information"""
        if obj.course_offering_id:
            try:
                # You'll need to fetch from course-service or have it in your database
                # For now, return the UUID - you can enhance this later
                return {
                    'course_offering_id': obj.course_offering_id,
                    'type': 'course_offering'
                }
            except:
                return None
        return None
    
    def get_shared_session_details(self, obj):
        """Get detailed shared session information"""
        if obj.shared_session_id:
            try:
                # You'll need to fetch from course-service or have it in your database
                # For now, return the UUID - you can enhance this later
                return {
                    'shared_session_id': obj.shared_session_id,
                    'type': 'shared_session'
                }
            except:
                return None
        return None
    
    def get_position_details(self, obj):
        """Get comprehensive position details"""
        if obj.course_offering_id:
            return {
                'position_type': 'Course TA',
                'assignment_type': 'course_offering',
                'course_offering_id': obj.course_offering_id,
                'description': f'Teaching Assistant for course offering {obj.course_offering_id}',
                'duties': 'Lectures, tutorials, grading, office hours'
            }
        elif obj.shared_session_id:
            return {
                'position_type': 'Lab/Tutorial TA',
                'assignment_type': 'shared_session', 
                'shared_session_id': obj.shared_session_id,
                'description': f'Teaching Assistant for lab/tutorial session {obj.shared_session_id}',
                'duties': 'Lab supervision, tutorial sessions, student assistance'
            }
        else:
            return {
                'position_type': 'TA Position',
                'assignment_type': 'general',
                'description': 'Teaching Assistant position',
                'duties': 'To be determined'
            }
        

class AssignmentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    offer_details = OfferSerializer(source='offer', read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'assignment_id', 'offer', 'student', 'course_offering', 'shared_session',
            'required_hours', 'role', 'assigned_date', 'assigned_by', 'is_active',
            'notes', 'offer_details'
        ]
        read_only_fields = ['assignment_id', 'assigned_date']

class SharedSessionSerializer(serializers.ModelSerializer):
    """Serializer for shared session details in offers"""
    course = serializers.StringRelatedField(read_only=True)
    academic_term = TermSerializer(read_only=True)
    
    class Meta:
        model = SharedSession
        fields = [
            'shared_session_id', 'session_type', 'course', 'section_number', 
            'academic_term', 'student'
        ]

class CourseOfferingSerializer(serializers.ModelSerializer):
    """Serializer for course offering details in offers"""
    course = serializers.StringRelatedField(read_only=True)
    instructor = serializers.StringRelatedField(read_only=True)
    academic_term = TermSerializer(read_only=True)
    
    class Meta:
        model = CourseOffering
        fields = [
            'course_offering_id', 'course', 'section_number', 
            'academic_term', 'instructor'
        ]

