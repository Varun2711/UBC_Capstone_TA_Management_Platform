from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (StudentViewSet, InstructorViewSet, TASchedulerViewSet, find_user, api_root, CreateInstructorView, CreateSchedulerView, UserManagementView,
                    ProfileDetailView, StudentProfileUpdateView, StudentTAExperienceListCreateView, StudentExperienceDetailView,StudentSkillListCreateView, 
                    StudentSkillDetailView, StudentAvailabilityView, StudentCoursePreferenceListCreateView, StudentCoursePreferenceDetailView, FacultyListView)

router = DefaultRouter()
router.include_root_view = False
router.register(r'students', StudentViewSet)
router.register(r'instructors', InstructorViewSet)  
router.register(r'schedulers', TASchedulerViewSet)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('', include(router.urls)),
    path('find-user/', find_user, name='find-user'),
    
    # Admin endpoints
    path('admin/create-instructor/', CreateInstructorView.as_view(), name='create-instructor'),
    path('admin/create-scheduler/', CreateSchedulerView.as_view(), name='create-scheduler'),
    path('admin/user-management/', UserManagementView.as_view(), name='user-management'),
    path('faculties/', FacultyListView.as_view(), name='faculty-list'),
    
    # Student Profile Management
    path('me/', ProfileDetailView.as_view(), name='my-profile'),
    path('me/update/', StudentProfileUpdateView.as_view(), name='update-my-profile'),
    
    # Student Experience Management  
    path('me/experience/', StudentTAExperienceListCreateView.as_view(), name='my-experiences'),
    path('me/experience/<uuid:pk>/', StudentExperienceDetailView.as_view(), name='my-experience-detail'),
    
    # Student Skills Management
    path('me/skills/', StudentSkillListCreateView.as_view(), name='my-skills'),
    path('me/skills/<uuid:pk>/', StudentSkillDetailView.as_view(), name='my-skill-detail'),
    
    # Student Availability Management
    path('me/availability/', StudentAvailabilityView.as_view(), name='my-availability'),
    
    # Student Course Preferences Management
    path('me/preferences/', StudentCoursePreferenceListCreateView.as_view(), name='my-preferences'),
    path('me/preferences/<uuid:pk>/', StudentCoursePreferenceDetailView.as_view(), name='my-preference-detail'),
    
    # Admin views for specific students
    path('student/<str:student_id>/', ProfileDetailView.as_view(), name='student-profile'),
    path('student/<str:student_id>/experience/', StudentTAExperienceListCreateView.as_view(), name='student-experiences'),
    path('student/<str:student_id>/skills/', StudentSkillListCreateView.as_view(), name='student-skills'),
    path('student/<str:student_id>/availability/', StudentAvailabilityView.as_view(), name='student-availability'),
    path('student/<str:student_id>/preferences/', StudentCoursePreferenceListCreateView.as_view(), name='student-preferences'),
    path('student/<str:student_id>/experience/<uuid:pk>/', StudentExperienceDetailView.as_view(), name='student-experience-detail'),
    path('student/<str:student_id>/skills/<uuid:pk>/', StudentSkillDetailView.as_view(), name='student-skill-detail'),
    path('student/<str:student_id>/preferences/<uuid:pk>/', StudentCoursePreferenceDetailView.as_view(), name='student-preference-detail'),
]