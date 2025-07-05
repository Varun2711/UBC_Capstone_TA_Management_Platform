"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Edit,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Phone,
  Save,
  Settings,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  EyeOff,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "../components/student-dashboard-sidebar"
import WeeklyAvailabilityCalendar from "../components/WeeklyAvailabilityCalendar"
import * as Select from '@radix-ui/react-select'
import {
  getProfile,
  updateProfile,
  updateAcademicInfo,
  updateSkills,
  updateExperience,
  updateAvailability,
  updateCoursePreferences
} from "@/logic/student-profile"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})

  // State for skills editing
  const [skillsEdit, setSkillsEdit] = useState(false)
  const [editedSkills, setEditedSkills] = useState({
    technicalSkills: [],
    softSkills: []
  })

  // State for academic information editing
  const [isEditingAcademic, setIsEditingAcademic] = useState(false)
  const [editedAcademicInfo, setEditedAcademicInfo] = useState({
    major: '',
    minor: '',
    year: '',
    gpa: '',
    academicInfo: {
      yearStanding: '',
      degreeStart: '',
      expectedGraduation: '',
    }
  })

  // State for experience editing
  const [isEditingExperience, setIsEditingExperience] = useState(false)
  const [editedExperience, setEditedExperience] = useState([])

  // State for availability editing
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [availabilityData, setAvailabilityData] = useState([])

  // State for course preference editing
  const [isEditingCourses, setIsEditingCourses] = useState(false)
  const [coursePreference, setCoursePreference] = useState([])

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false)

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State for original user data (to revert changes)
  const [originalUserData, setOriginalUserData] = useState(null);
  // State for current user data (displayed and modified)
  const [userData, setUserData] = useState(null);

  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for saving loading indicator
  const [isSaving, setIsSaving] = useState(false);
  // State for success message
  const [successMessage, setSuccessMessage] = useState("");

  const transformAvailability = (availability) => {
    if (!availability || typeof availability !== 'object') {
      return Array(50).fill(false);
    }
    // If it's already a valid array, return it.
    if (Array.isArray(availability) && availability.length === 50) {
      return availability;
    }
    // If it's already a valid array, return it.
    if (Array.isArray(availability) && availability.length === 50) {
      return availability;
    }

    // If it's an object (the availability_grid from the backend), transform it.
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const times = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
    const newAvailability = Array(50).fill(false);

    days.forEach((day, dayIndex) => {
      // Check if the day exists in the backend object
      if (availability[day] && Array.isArray(availability[day])) {
        availability[day].forEach(time => {
          const timeIndex = times.indexOf(time);
          if (timeIndex !== -1) {
            newAvailability[dayIndex * 10 + timeIndex] = true;
          }
        });
      }
    });
    return newAvailability;
  };

  // Helper functions for data transformation
  const transformBackendDataToFrontend = (data) => {
    // Transform experiences from backend format to frontend format
    const transformExperiences = (backendExperiences) => {
      return backendExperiences?.map(exp => ({
        course: exp.position_title?.replace('TA for ', '') || '',
        semester: extractSemesterFromDate(exp.start_date),
        professor: exp.organization || '',
        description: exp.description || ''
      })) || [];
    };

    // Helper to extract semester info from date
    const extractSemesterFromDate = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth();

        let term = 'Winter';
        if (month >= 4 && month <= 7) term = 'Summer';
        else if (month >= 8) term = 'Fall';

        return `${term} ${year}`;
      } catch (e) {
        return dateString;
      }
    };

    return {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email || '',
      studentId: data.student_info?.student_number || '',
      phone: data.student_info?.phone || '',
      major: data.student_info?.program || '',
      year: data.student_info?.study_level || '',
      gpa: data.student_profile?.gpa || '',
      minor: data.student_profile?.minor || '',
      employeeNumber: data.student_profile?.ubc_employee_id || '',
      avatar: data.avatar || "/placeholder.svg?height=120&width=120",



      // Transform arrays appropriately
      coursePreference: data.course_preferences?.map(pref => pref.course_code) || [],
      experience: transformExperiences(data.experiences),
      availability: transformAvailability(data.availability),

      // Handle skills - separate by type
      technicalSkills: data.skills?.filter(skill => skill.skill_type === 'technical')
        .map(skill => skill.name) || [],
      softSkills: data.skills?.filter(skill => skill.skill_type === 'soft')
        .map(skill => skill.name) || [],

      academicInfo: {
        yearStanding: data.student_info?.year_standing?.toString() || '',
        degreeStart: data.student_profile?.year_degree_start?.toString() || '',
        expectedGraduation: data.student_profile?.expected_graduation || '',
      },
    };
  };



  const transformSkillsToBackend = (technicalSkills, softSkills) => {
    const skills = [];

    technicalSkills.forEach(skill => {
      if (skill.trim()) {
        skills.push({
          skill_name: skill.trim(),
          skill_type: 'technical'
        });
      }
    });

    softSkills.forEach(skill => {
      if (skill.trim()) {
        skills.push({
          skill_name: skill.trim(),
          skill_type: 'soft'
        });
      }
    });

    return skills;
  };

  // Show success message with auto-dismiss
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const checkProfileAssociation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      try {
        await axios.get(`${API_URL}/api/profile/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return true;
      } catch (error) {
        // If profile doesn't exist, try to create it
        if (error.response && error.response.status === 404) {
          await axios.patch(
            `${API_URL}/api/profile/me/update/`,
            { first_name: "", last_name: "" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error("Profile check failed:", error);
      return false;
    }
  };

  // Then update your fetchUserData function in useEffect:
  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      // First, ensure profile connection
      await checkProfileAssociation();

      const data = await getProfile();
      console.log("Fetched user data from backend:", data);

      // Rest of your existing code...
    } catch (error) {
      // Your existing error handling...
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await getProfile();
        console.log("Fetched user data from backend:", data);

        // Transform data to match frontend structure
        const profileData = transformBackendDataToFrontend(data);

        setOriginalUserData(profileData);
        setUserData(profileData);

        // Initialize all edited states with fetched data
        setEditedProfile({ ...profileData });
        setEditedAcademicInfo({
          major: profileData.major,
          minor: profileData.minor,
          year: profileData.year,
          gpa: profileData.gpa,
          academicInfo: { ...profileData.academicInfo }
        });
        setEditedExperience([...profileData.experience]);
        setEditedSkills({
          technicalSkills: [...profileData.technicalSkills],
          softSkills: [...profileData.softSkills]
        });
        setCoursePreference([...profileData.coursePreference]);

        const availabilityArray = profileData.availability;
        if (Array.isArray(availabilityArray) && availabilityArray.length === 50) {
          setAvailabilityData([...availabilityArray]);
        } else {
          // If not valid, create a new 50-element array
          setAvailabilityData(Array(50).fill(false));
        }

      } catch (error) {
        setFetchError("Could not load your profile. Please try again later.");
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSavePersonalInfo = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      const updatedData = {
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        email: userData.email,
        student_profile: {
          phone: userData.phone,
          student_number: userData.studentId,
          ubc_employee_id: userData.employeeNumber
        }
      };

      const response = await updateProfile(updatedData);

      // Update the original data
      setOriginalUserData({ ...userData });
      setIsEditing(false);
      showSuccessMessage("Personal information updated successfully");
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};

        for (const field in backendErrors) {
          formattedErrors[field] = backendErrors[field][0];
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ api: "Failed to save personal information. Please try again." });
      }
      console.error("Save personal info error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateField = (field, value) => {
    let error = null;
    if (field === "firstName" || field === "lastName") {
      if (!value || value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      }
    } else if (field === "email") {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = "Invalid email address";
      }
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ["firstName", "lastName", "email"];
    fields.forEach((field) => {
      const error = validateField(field, userData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Specific handleCancel for Personal Information
  const handleCancelPersonalInfo = () => {
    setUserData({ ...originalUserData }); // Reset to original fetched data
    setEditedProfile({ ...originalUserData }); // Also reset editedProfile
    setErrors({});
    setIsEditing(false);
  };

  const isFormValid = () => {
    if (!userData) return false;
    return (
      (userData.firstName?.trim().length >= 2 || (originalUserData && originalUserData.firstName?.trim().length >= 2)) &&
      (userData.lastName?.trim().length >= 2 || (originalUserData && originalUserData.lastName?.trim().length >= 2)) &&
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email?.trim() || '') || (originalUserData && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(originalUserData.email?.trim() || '')))
    );
  };

  // Add this function to ProfilePage.jsx
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);

    if (error.response) {
      if (error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};

        for (const field in backendErrors) {
          if (Array.isArray(backendErrors[field])) {
            formattedErrors[field] = backendErrors[field][0];
          } else if (typeof backendErrors[field] === 'object') {
            for (const nestedField in backendErrors[field]) {
              formattedErrors[nestedField] = backendErrors[field][nestedField][0];
            }
          } else {
            formattedErrors[field] = backendErrors[field];
          }
        }

        setErrors(formattedErrors);
      } else if (error.response.status === 404) {
        setErrors({ api: "Your profile may not be properly connected. Try logging out and back in." });
      } else {
        setErrors({ api: defaultMessage });
      }
    } else if (error.request) {
      setErrors({ api: "No response received from server. Please check your connection." });
    } else {
      setErrors({ api: defaultMessage });
    }
  };

  // handleSave for Academic Information
  const handleSaveAcademicInfo = async () => {
    // Add validation specific to academic info fields if needed
    if (!editedAcademicInfo.major.trim()) {
      setErrors({ major: "Major is required." });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const academicData = {
        program: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        study_level: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        year_standing: editedAcademicInfo.academicInfo.yearStanding,
        year_degree_start: editedAcademicInfo.academicInfo.degreeStart,
        expected_graduation: editedAcademicInfo.academicInfo.expectedGraduation
      };

      await updateAcademicInfo(academicData);

      // Update local state
      setUserData(prev => ({
        ...prev,
        major: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        year: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        academicInfo: { ...editedAcademicInfo.academicInfo }
      }));

      setOriginalUserData(prev => ({
        ...prev,
        major: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        year: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        academicInfo: { ...editedAcademicInfo.academicInfo }
      }));

      setIsEditingAcademic(false);
      showSuccessMessage("Academic information updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to save academic information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // handleCancel for Academic Information
  const handleCancelAcademicInfo = () => {
    setEditedAcademicInfo({
      major: originalUserData.major,
      minor: originalUserData.minor,
      year: originalUserData.year,
      gpa: originalUserData.gpa,
      academicInfo: { ...originalUserData.academicInfo }
    });
    setIsEditingAcademic(false);
    setErrors({});
  };

  // handleSave for Experience
  const handleSaveExperience = async () => {
    // Validate experience data
    const hasEmptyFields = editedExperience.some(exp =>
      !exp.course || !exp.semester || !exp.professor
    );

    if (hasEmptyFields) {
      setErrors({ experience: "Please fill in all required fields for each experience." });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Format experiences for API - use a better approach to handle dates
      const currentYear = new Date().getFullYear();

      const formattedExperiences = editedExperience.map(exp => {
        // Extract year and term from semester (e.g., "Winter 2024")
        const semesterParts = exp.semester.split(' ');
        const year = semesterParts.length > 1 ?
          semesterParts[1] : currentYear.toString();
        const term = semesterParts[0] || 'Winter';

        // Create a reasonable date based on term and year
        let startDate = `${year}-`;
        if (term.toLowerCase().includes('winter')) startDate += '01-01';
        else if (term.toLowerCase().includes('summer')) startDate += '05-01';
        else if (term.toLowerCase().includes('fall')) startDate += '09-01';
        else startDate += '01-01';

        return {
          experience_type: 'teaching',
          position_title: `TA for ${exp.course}`,
          organization: exp.professor,
          start_date: startDate,
          description: exp.description || `TA position for ${exp.course} with ${exp.professor}`,
          is_current: false
        };
      });

      // Use updateExperience with properly formatted data
      await updateExperience(formattedExperiences);

      // After successful update, refresh the profile data
      const updatedProfile = await getProfile();
      const transformedProfile = transformBackendDataToFrontend(updatedProfile);

      // Update local state
      setUserData(prev => ({
        ...prev,
        experience: transformedProfile.experience
      }));

      setOriginalUserData(prev => ({
        ...prev,
        experience: transformedProfile.experience
      }));

      setEditedExperience(transformedProfile.experience);
      setIsEditingExperience(false);
      showSuccessMessage("Experience updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to save experience. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // handleSave for Course Preferences
  const handleSaveCourses = async () => {
    const hasEmptyCoursePreference = coursePreference.some(course => course.trim() === "");
    if (hasEmptyCoursePreference) {
      setErrors({ courses: "Each course preference must contain text." });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Use the specialized course preferences update function
      await updateCoursePreferences(coursePreference);

      // After successful update, refresh the profile to get updated data
      const updatedProfile = await getProfile();
      const transformedProfile = transformBackendDataToFrontend(updatedProfile);

      // Update local state
      setUserData(prev => ({
        ...prev,
        coursePreference: transformedProfile.coursePreference
      }));

      setOriginalUserData(prev => ({
        ...prev,
        coursePreference: transformedProfile.coursePreference
      }));

      // Update the edited course preference state with the fresh data
      setCoursePreference(transformedProfile.coursePreference);

      setIsEditingCourses(false);
      showSuccessMessage("Course preferences updated successfully");
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};
        for (const field in backendErrors) {
          formattedErrors[field] = backendErrors[field][0];
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ api: "Failed to save course preferences. Please try again." });
      }
      console.error("Failed to save course preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // handleSave for Availability
  const handleSaveAvailability = async () => {
    console.log("=== DEBUG AVAILABILITY SAVE ===");
    console.log("availabilityData:", availabilityData);
    console.log("availabilityData type:", typeof availabilityData);
    console.log("availabilityData length:", availabilityData?.length);
    console.log("Is array?", Array.isArray(availabilityData));
    console.log("First 5 elements:", availabilityData?.slice(0, 5));
    console.log("================================");
    setIsSaving(true);
    setErrors({});

    try {
      // Use the specialized availability update function
      await updateAvailability(availabilityData);

      // Update local state
      setUserData(prev => ({
        ...prev,
        availability: [...availabilityData]
      }));

      setOriginalUserData(prev => ({
        ...prev,
        availability: [...availabilityData]
      }));

      setIsEditingAvailability(false);
      showSuccessMessage("Availability updated successfully");
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};
        for (const field in backendErrors) {
          formattedErrors[field] = backendErrors[field][0];
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ api: "Failed to save availability. Please try again." });
      }
      console.error("Failed to save availability:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center items-center h-screen text-red-500">{fetchError}</div>;
  }

  if (!userData) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          name={`${userData.firstName} ${userData.lastName}`}
          email={userData.email}
          avatar={userData.avatar}
        />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Success Message Toast */}
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Profile Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Profile</h2>
                <p className="text-muted-foreground">Manage your personal information and TA application details</p>
              </div>
            </div>

            {/* General API Error */}
            {errors.api && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{errors.api}</span>
              </div>
            )}

            {/* Personal Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePersonalInfo}
                      className="gap-2"
                      disabled={isSaving || !isFormValid()}
                    >
                      {isSaving ? "Saving..." : "Save"}
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCancelPersonalInfo} variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setEditedProfile({ ...userData });
                      setIsEditing(true);
                    }}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Personal Information
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={`${userData.firstName} ${userData.lastName}`} />
                      <AvatarFallback className="text-2xl">{`${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={userData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                        />
                      ) : (
                        <p className="text-sm">{userData.firstName}</p>
                      )}
                      {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                      {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={userData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                        />
                      ) : (
                        <p className="text-sm">{userData.lastName}</p>
                      )}
                      {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                      {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="studentId"
                          value={userData.studentId}
                          onChange={(e) => setUserData({ ...userData, studentId: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{userData.studentId}</p>
                      )}
                      {errors.student_number && <p className="text-red-500 text-xs">{errors.student_number}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="UBCEmployeeId">UBC Employee ID (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id="UBCEmployeeId"
                          value={userData.employeeNumber}
                          onChange={(e) => setUserData({ ...userData, employeeNumber: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{userData.employeeNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password<span className="text-red-500">*</span>
                      </Label>
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value="********"
                            onChange={(e) => { }}
                            className="pr-10"
                            disabled={true}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm">••••••••</p>
                      )}
                      {isEditing && (
                        <p className="text-xs text-muted-foreground">Password can be changed in the account settings.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={userData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                        />
                      ) : (
                        <p className="text-sm">{userData.email}</p>
                      )}
                      {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={userData.phone}
                          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{userData.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Academic Information</CardTitle>
                {isEditingAcademic ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveAcademicInfo}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAcademicInfo}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditedAcademicInfo({
                        major: userData.major,
                        minor: userData.minor,
                        year: userData.year,
                        gpa: userData.gpa,
                        academicInfo: { ...userData.academicInfo }
                      });
                      setIsEditingAcademic(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Academic Information
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                {errors.major && <p className="text-red-500 text-xs mb-2">{errors.major}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Major<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.major}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, major: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{userData.major}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Level<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Select.Root
                        value={editedAcademicInfo.year}
                        onValueChange={(value) =>
                          setEditedAcademicInfo({ ...editedAcademicInfo, year: value })
                        }
                      >
                        <Select.Trigger className="flex items-center justify-between w-full border rounded px-3 py-2 text-sm">
                          <Select.Value placeholder="Select Academic Level" />
                          <Select.Icon>
                            <ChevronDown className="h-4 w-4" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Content className="border rounded shadow bg-white">
                          <Select.ScrollUpButton className="flex items-center justify-center">
                            <ChevronUp className="h-4 w-4" />
                          </Select.ScrollUpButton>
                          <Select.Viewport className="p-1">
                            <Select.Item
                              value=" "
                              className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between text-gray-500"
                            >
                              <Select.ItemText>Select Academic Level</Select.ItemText>
                              <Select.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item
                              value="Undergraduate"
                              className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            >
                              <Select.ItemText>Undergraduate</Select.ItemText>
                              <Select.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                            <Select.Item
                              value="Graduate"
                              className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            >
                              <Select.ItemText>Graduate</Select.ItemText>
                              <Select.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </Select.ItemIndicator>
                            </Select.Item>
                          </Select.Viewport>
                          <Select.ScrollDownButton className="flex items-center justify-center">
                            <ChevronDown className="h-4 w-4" />
                          </Select.ScrollDownButton>
                        </Select.Content>
                      </Select.Root>
                    ) : (
                      <p className="text-sm">{userData.year}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>GPA (Optional)</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.gpa}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, gpa: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{userData.gpa}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Graduation<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.academicInfo.expectedGraduation}
                        onChange={(e) =>
                          setEditedAcademicInfo({
                            ...editedAcademicInfo,
                            academicInfo: {
                              ...editedAcademicInfo.academicInfo,
                              expectedGraduation: e.target.value
                            }
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo.expectedGraduation}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Degree Start<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.academicInfo.degreeStart}
                        onChange={(e) =>
                          setEditedAcademicInfo({
                            ...editedAcademicInfo,
                            academicInfo: {
                              ...editedAcademicInfo.academicInfo,
                              degreeStart: e.target.value
                            }
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo.degreeStart}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Year Standing<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.academicInfo.yearStanding}
                        onChange={(e) =>
                          setEditedAcademicInfo({
                            ...editedAcademicInfo,
                            academicInfo: {
                              ...editedAcademicInfo.academicInfo,
                              yearStanding: e.target.value
                            }
                          })
                        }
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo.yearStanding}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Minor (Optional)</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.minor}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, minor: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{userData.minor}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Past TA Experiences Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Past TA Experience</CardTitle>
                </div>
                {isEditingExperience ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveExperience}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedExperience(originalUserData.experience.map(exp => ({ ...exp })))
                        setIsEditingExperience(false)
                        setErrors({})
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditedExperience(userData.experience.map(exp => ({ ...exp })))
                      setIsEditingExperience(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Experience
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {errors.experience && <p className="text-red-500 text-xs mb-2">{errors.experience}</p>}

                {(isEditingExperience ? editedExperience : userData.experience).length === 0 && (
                  <p className="text-sm text-muted-foreground">No past TA experience added yet.</p>
                )}

                {(isEditingExperience ? editedExperience : userData.experience).map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Experience #{index + 1}</h4>
                      {isEditingExperience && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = editedExperience.filter((_, i) => i !== index);
                            setEditedExperience(updated);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Course<span className="text-red-500">*</span></Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.course || ''}
                            onChange={(e) => {
                              const newExp = [...editedExperience];
                              newExp[index].course = e.target.value;
                              setEditedExperience(newExp);
                            }}
                          />
                        ) : (
                          <p className="text-sm">{exp.course}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Semester<span className="text-red-500">*</span></Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.semester || ''}
                            onChange={(e) => {
                              const newExp = [...editedExperience];
                              newExp[index].semester = e.target.value;
                              setEditedExperience(newExp);
                            }}
                          />
                        ) : (
                          <p className="text-sm">{exp.semester}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Professor<span className="text-red-500">*</span></Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.professor || ''}
                            onChange={(e) => {
                              const newExp = [...editedExperience];
                              newExp[index].professor = e.target.value;
                              setEditedExperience(newExp);
                            }}
                          />
                        ) : (
                          <p className="text-sm">{exp.professor}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Description</Label>
                      {isEditingExperience ? (
                        <Textarea
                          value={exp.description || ''}
                          onChange={(e) => {
                            const newExp = [...editedExperience];
                            newExp[index].description = e.target.value;
                            setEditedExperience(newExp);
                          }}
                        />
                      ) : (
                        <p className="text-sm mt-2">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isEditingExperience && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditedExperience([
                        ...editedExperience,
                        {
                          course: '',
                          semester: '',
                          professor: '',
                          description: '',
                        },
                      ])
                    }
                  >
                    + Add Experience
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Skills Card */}
                <div className="flex-1 flex flex-col">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Skills & Qualifications</CardTitle>
                      {skillsEdit ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveSkills}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save"}
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedSkills({
                                technicalSkills: [...originalUserData.technicalSkills],
                                softSkills: [...originalUserData.softSkills],
                              })
                              setSkillsEdit(false)
                              setErrors({})
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditedSkills({
                              technicalSkills: [...userData.technicalSkills],
                              softSkills: [...userData.softSkills],
                            })
                            setSkillsEdit(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Skills
                        </Button>
                      )}
                    </CardHeader>

                    {errors.skills && <p className="text-red-500 text-xs px-6">{errors.skills}</p>}

                    {/* TECHNICAL SKILLS */}
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Technical Skills</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            {skillsEdit ? (
                              <>
                                {editedSkills.technicalSkills.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No technical skills added yet.</p>
                                )}

                                {editedSkills.technicalSkills.map((skill, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Input
                                      value={skill}
                                      className="w-full"
                                      onChange={(e) => {
                                        const newSkills = [...editedSkills.technicalSkills]
                                        newSkills[index] = e.target.value
                                        setEditedSkills({ ...editedSkills, technicalSkills: newSkills })
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const updated = editedSkills.technicalSkills.filter((_, i) => i !== index)
                                        setEditedSkills({ ...editedSkills, technicalSkills: updated })
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <>
                                {userData.technicalSkills.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No technical skills added yet.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {userData.technicalSkills.map((skill, index) => (
                                      <Badge key={index} variant="secondary">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Add Button */}
                            {skillsEdit && (
                              <Button
                                onClick={() =>
                                  setEditedSkills({
                                    ...editedSkills,
                                    technicalSkills: [...editedSkills.technicalSkills, ""],
                                  })
                                }
                                variant="outline"
                              >
                                + Add Technical Skill
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <Separator />

                    {/* SOFT SKILLS */}
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Soft Skills</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            {skillsEdit ? (
                              <>
                                {editedSkills.softSkills.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No soft skills added yet.</p>
                                )}

                                {editedSkills.softSkills.map((skill, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Input
                                      value={skill}
                                      className="w-full"
                                      onChange={(e) => {
                                        const newSkills = [...editedSkills.softSkills]
                                        newSkills[index] = e.target.value
                                        setEditedSkills({ ...editedSkills, softSkills: newSkills })
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const updated = editedSkills.softSkills.filter((_, i) => i !== index)
                                        setEditedSkills({ ...editedSkills, softSkills: updated })
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <>
                                {userData.softSkills.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No soft skills added yet.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {userData.softSkills.map((skill, index) => (
                                      <Badge key={index} variant="secondary">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Add Button */}
                            {skillsEdit && (
                              <Button
                                onClick={() =>
                                  setEditedSkills({
                                    ...editedSkills,
                                    softSkills: [...editedSkills.softSkills, ""],
                                  })
                                }
                                variant="outline"
                              >
                                + Add Soft Skill
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {/* Course Preferences Card */}
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Course Preferences</CardTitle>
                        <div className="flex gap-2 mt-2">
                          {isEditingCourses ? (
                            <>
                              <Button
                                onClick={handleSaveCourses}
                                className="gap-2"
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsEditingCourses(false)
                                  setCoursePreference([...originalUserData.coursePreference])
                                  setErrors({})
                                }}
                                variant="outline"
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => {
                                setCoursePreference([...userData.coursePreference])
                                setIsEditingCourses(true)
                              }}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Preferences
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        {errors.courses && <p className="text-red-500 text-xs mb-2">{errors.courses}</p>}

                        {isEditingCourses ? (
                          <div className="space-y-4">
                            {coursePreference.length === 0 && (
                              <p className="text-sm text-muted-foreground">No course preferences added yet.</p>
                            )}

                            {coursePreference.map((course, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={course}
                                  onChange={(e) => {
                                    const updated = [...coursePreference]
                                    updated[index] = e.target.value
                                    setCoursePreference(updated)
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const updated = coursePreference.filter((_, i) => i !== index)
                                    setCoursePreference(updated)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={() => setCoursePreference([...coursePreference, ""])}
                              variant="outline"
                            >
                              + Add Course
                            </Button>
                          </div>
                        ) : (
                          <>
                            {userData.coursePreference.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No course preferences added yet.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {userData.coursePreference.map((course, index) => (
                                  <Badge key={index} variant="secondary">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {/* Availability Calendar Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Availability</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {isEditingAvailability ? (
                      <>
                        <Button
                          onClick={handleSaveAvailability}
                          className="gap-2"
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save"}
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingAvailability(false)
                            setAvailabilityData(originalUserData.availability || Array(50).fill(false))
                            setErrors({})
                          }}
                          variant="outline"
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          // FIX 
                          if (Array.isArray(availabilityData) && availabilityData.length === 50) {
                            // Use existing valid data
                            setIsEditingAvailability(true);
                          } else {
                            // Create new valid data if current data is invalid
                            setAvailabilityData(Array(50).fill(false));
                            setIsEditingAvailability(true);
                          }
                        }}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Availability
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p>
                    Please indicate your general weekly availability below. Blue boxes
                    represent times that you are available for TA work, and white boxes
                    represent times that you are not.<br /><br />
                  </p>
                  <WeeklyAvailabilityCalendar
                    editable={isEditingAvailability}
                    availability={availabilityData}
                    setAvailability={setAvailabilityData}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}