from rest_framework import serializers
from .models import Offer, Assignment, Student, CourseOffering, SharedSession, Application, ApplicationShortList, Term, JobPosting

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['student_number', 'name', 'email', 'study_level']

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'code', 'name']

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
    student = StudentSerializer(read_only=True)
    application = ApplicationSerializer(read_only=True)
    can_respond = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Offer
        fields = [
            'offer_id', 'application', 'course_offering', 'student', 'shared_session',
            'required_hours', 'role', 'offer_date', 'response_deadline', 'status',
            'responded_at', 'student_response', 'created_by', 'notes',
            'can_respond', 'is_expired', 'created_at', 'updated_at'
        ]
        read_only_fields = ['offer_id', 'created_at', 'updated_at', 'responded_at']
    
    def get_can_respond(self, obj):
        return obj.can_respond()
    
    def get_is_expired(self, obj):
        return obj.is_expired()

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