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
  updateSkills,
  updateExperience,
  updateAvailability,
  updateCoursePreferences
} from "@/logic/student-profile"
import axios from "axios"

const API_URL = 'http://localhost:8080';

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

  // Add these missing state variables
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  const [academicErrors, setAcademicErrors] = useState({});

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

  useEffect(() => {
    if (userData) {
      console.log("userData updated:", userData);
    }
  }, [userData]);

  const transformAvailability = (availability) => {
    console.log("Transforming availability from backend:", availability);

    if (!availability || typeof availability !== 'object') {
      return [];
    }

    if (Array.isArray(availability)) {
      return availability;
    }

    const availabilityGrid = availability.availability_grid || availability;
    console.log("Extracted availability_grid:", availabilityGrid);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Extended time map to handle slots up to 9:30 PM
    const timeMap = {
      // 30-minute slots
      '8:00am': '8-top', '8:30am': '8-bottom',
      '9:00am': '9-top', '9:30am': '9-bottom',
      '10:00am': '10-top', '10:30am': '10-bottom',
      '11:00am': '11-top', '11:30am': '11-bottom',
      '12:00pm': '12-top', '12:30pm': '12-bottom',
      '1:00pm': '13-top', '1:30pm': '13-bottom',
      '2:00pm': '14-top', '2:30pm': '14-bottom',
      '3:00pm': '15-top', '3:30pm': '15-bottom',
      '4:00pm': '16-top', '4:30pm': '16-bottom',
      '5:00pm': '17-top', '5:30pm': '17-bottom',
      '6:00pm': '18-top', '6:30pm': '18-bottom',
      '7:00pm': '19-top', '7:30pm': '19-bottom',
      '8:00pm': '20-top', '8:30pm': '20-bottom',
      '9:00pm': '21-top', '9:30pm': '21-bottom',
      // Legacy 1-hour slots (create both top and bottom)
      '8am': '8', '9am': '9', '10am': '10', '11am': '11',
      '12pm': '12', '1pm': '13', '2pm': '14', '3pm': '15',
      '4pm': '16', '5pm': '17', '6pm': '18', '7pm': '19',
      '8pm': '20', '9pm': '21'
    };

    const selectedSlots = [];

    days.forEach(day => {
      if (availabilityGrid[day] && Array.isArray(availabilityGrid[day])) {
        availabilityGrid[day].forEach(time => {
          const timeSlot = timeMap[time];
          if (timeSlot) {
            const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);

            if (timeSlot.includes('-')) {
              // 30-minute slot
              selectedSlots.push(`${dayCapitalized}-${timeSlot}`);
            } else {
              // Legacy 1-hour slot - create both halves
              selectedSlots.push(`${dayCapitalized}-${timeSlot}-top`);
              selectedSlots.push(`${dayCapitalized}-${timeSlot}-bottom`);
            }
          }
        });
      }
    });

    console.log("Transformed to calendar format:", selectedSlots);
    return selectedSlots;
  };

  // Update your transformBackendDataToFrontend function in ProfilePage.jsx
  const transformBackendDataToFrontend = (data) => {
    // Transform experiences from backend format to frontend format
    const transformExperiences = (backendExperiences) => {
      return backendExperiences?.map(exp => ({
        course: exp.position_title?.replace('TA for ', '') || '',
        semester: extractSemesterFromDate(exp.start_date),
        professor: exp.organization || '',
        description: exp.description || '',


      })) || [];
    };

    // Helper to extract semester info from date
    const extractSemesterFromDate = (dateString) => {
      if (!dateString) return '';
      try {
        console.log("dateString is:", dateString);
        const date = new Date(dateString);
        console.log("dateString to date becomes :", date);
        const year = date.getFullYear();
        const month = date.getMonth();
        console.log("Extracted semester info:", { year, month });


        let term = 'Winter';
        if (month >= 4 && month <= 7) term = 'Summer';
        else if (month >= 8) term = 'Fall';

        return `${term} ${year}`;
      } catch (e) {
        return dateString;
      }
    };

    let firstName = '';
    let lastName = '';

    // Check if backend returns a single 'name' field (expected)
    if (data.name) {
      console.log("Using name field:", data.name);
      const nameParts = data.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    // Fallback: if backend returns first_name and last_name separately
    else if (data.first_name || data.last_name) {
      console.log("Using first_name and last_name fields");
      if (data.first_name && data.last_name && data.last_name.trim() !== '') {
        // Both fields exist and are not empty
        firstName = data.first_name;
        lastName = data.last_name;
      } else if (data.first_name) {
        // Only first_name exists, split it
        const nameParts = data.first_name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
    }
    // Try student_info if available
    else if (data.student_info?.name) {
      const nameParts = data.student_info.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      // USE THE PARSED NAMES:
      firstName: firstName,
      lastName: lastName,
      email: data.email || '',
      studentId: data.student_info?.student_number || '',
      phone: data.student_info?.phone || '',

      // ✅ FIX THESE MAPPINGS - this is the key change you need:
      major: data.student_info?.program || '', // ✅ Map from student_info.program
      year: data.student_info?.study_level || '',
      gpa: data.student_profile?.gpa || '',
      minor: data.student_profile?.minor || '', // ✅ Map from student_profile.minor
      employeeNumber: data.student_profile?.ubc_employee_id || '',
      avatar: data.avatar || "/placeholder.svg?height=120&width=120",

      // Transform arrays appropriately
      coursePreference: data.course_preferences?.map(pref => pref.course_code) || [],
      experience: transformExperiences(data.experiences),
      availability: transformAvailability(data.availability) || [],

      // Handle skills - separate by type
      technicalSkills: data.skills?.filter(skill => skill.skill_type === 'technical')
        .map(skill => skill.name) || [],
      softSkills: data.skills?.filter(skill => skill.skill_type === 'soft')
        .map(skill => skill.name) || [],

      academicInfo: {
        yearStanding: data.student_info?.year_standing?.toString() || '',
        degreeStart: data.student_profile?.year_degree_start?.toString() || '',
        expectedGraduation: data.student_info?.expected_graduation || '',  // ✅ This should work now
      },
    };
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
      const token = sessionStorage.getItem('accessToken');
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
            { name: "" },
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


  // In ProfilePage.jsx, update your existing useEffect:
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await getProfile();
        console.log("Fetched user data from backend:", data);

        // ✅ ADD THIS DEBUG LOGGING:
        console.log("=== PROFILE DATA DEBUG ===");
        console.log("Backend student_info:", data.student_info);
        console.log("Backend student_profile:", data.student_profile);
        console.log("Major from backend:", data.student_info?.program);
        console.log("Minor from backend:", data.student_profile?.minor);
        console.log("Degree start from backend:", data.student_profile?.year_degree_start);
        console.log("=== END DEBUG ===");

        // Transform data to match frontend structure
        const profileData = transformBackendDataToFrontend(data);
        console.log("Transformed data:", profileData);

        // ✅ ADD THIS DEBUG LOGGING TOO:
        console.log("=== TRANSFORMED DATA DEBUG ===");
        console.log("Transformed major:", profileData.major);
        console.log("Transformed minor:", profileData.minor);
        console.log("Transformed degreeStart:", profileData.academicInfo?.degreeStart);
        console.log("=== END TRANSFORMED DEBUG ===");

        setOriginalUserData(profileData);
        setUserData(profileData);

        // Rest of your existing logic...
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

  const handleSavePersonalInfo = async (userData) => {
    if (!validateForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      // Send separate first_name and last_name instead of concatenated name
      const updatedData = {
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        email: userData.email,

        student_number: userData.studentId,
        phone: userData.phone || '',

        student_profile: {
          ubc_employee_id: userData.employeeNumber
        }
      };

      console.log("=== SAVE DEBUG ===");
      console.log("userData before save:", userData);
      console.log("Sending to backend:", updatedData);
      console.log("==================");

      const response = await updateProfile(updatedData);
      console.log("Backend response:", response);

      // After successful save, refresh the profile data from backend
      const refreshedData = await getProfile();
      console.log("Refreshed data from backend:", refreshedData);

      const transformedData = transformBackendDataToFrontend(refreshedData);
      console.log("Transformed refreshed data:", transformedData);

      // Update both original and current data
      console.log("About to update originalUserData by calling setOriginalUserData function");
      setOriginalUserData(transformedData);

      console.log("About to update userData by calling setUserData function");
      setUserData(transformedData);

      setIsEditing(false);
      showSuccessMessage("Personal information updated successfully");
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};

        for (const field in backendErrors) {
          if (Array.isArray(backendErrors[field])) {
            formattedErrors[field] = backendErrors[field][0];
          } else {
            formattedErrors[field] = backendErrors[field];
          }
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
    console.log(`Input change: ${field} = "${value}"`);
    setUserData((prev) => {
      const updated = { ...prev, [field]: value };
      console.log("Updated userData:", updated);
      return updated;
    });

    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Update the validation functions
  const validateField = (field, value) => {
    let error = null;

    if (field === "firstName" || field === "lastName") {
      if (!value || value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      } else if (value.trim().length > 50) {
        error = "Name must be less than 50 characters";
      } else if (!/^[a-zA-Z\s\-']+$/.test(value.trim())) {
        error = "Name can only contain letters, spaces, hyphens, and apostrophes";
      }
    } else if (field === "email") {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = "Please enter a valid email address";
      }
    } else if (field === "studentId") {
      if (!value || value.trim() === "") {
        error = "Student ID is required";
      } else if (!/^\d{8}$/.test(value.trim())) {
        error = "Student ID must be exactly 8 digits";
      }
    } else if (field === "employeeNumber") {
      if (value && value.trim() !== "") {
        if (!/^\d+$/.test(value.trim())) {
          error = "UBC Employee ID must contain only numbers";
        } else if (value.trim().length > 10) {
          error = "UBC Employee ID must be maximum 10 digits";
        }
      }
    } else if (field === "phone") {
      if (value && value.trim() !== "") {
        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          error = "Phone number must have at least 10 digits";
        } else if (digitsOnly.length > 15) {
          error = "Phone number must be maximum 15 digits";
        } else if (!/^[\+]?[\d\s\-\(\)\.]{10,20}$/.test(value.trim())) {
          error = "Please enter a valid phone number format (e.g., +1-234-567-8900)";
        }
      }
    }

    return error;
  };

  // Update skills validation to only allow letters
  const validateSkillField = (value) => {
    if (!value || value.trim() === "") {
      return "Skill cannot be empty";
    } else if (value.trim().length < 2) {
      return "Skill must be at least 2 characters";
    } else if (value.trim().length > 50) {
      return "Skill must be 50 characters or less";
    } else if (!/^[a-zA-Z\s\+\#\.\-\/\(\)]+$/.test(value.trim())) {
      return "Skills can only contain letters, spaces, and common symbols (+, #, -, /, etc.)";
    }
    return null;
  };

  // Update academic validation for expected graduation
  const validateAcademicField = (field, value) => {
    let error = null;

    if (field === "major" || field === "minor") {
      if (field === "major" && (!value || value.trim().length < 2)) {
        error = "Major is required (minimum 2 characters)";
      } else if (value && value.trim() !== "") {
        if (value.trim().length > 100) {
          error = `${field === "major" ? "Major" : "Minor"} must be less than 100 characters`;
        } else if (!/^[a-zA-Z\s\-&]+$/.test(value.trim())) {
          error = `${field === "major" ? "Major" : "Minor"} can only contain letters, spaces, hyphens, and ampersands`;
        }
      }
    } else if (field === "year") {
      if (!value || value.trim() === "") {
        error = "Academic level is required";
      }
    } else if (field === "gpa") {
      if (value && value.trim() !== "") {
        const gpaValue = parseFloat(value);
        if (isNaN(gpaValue)) {
          error = "GPA must be a number";
        } else if (gpaValue < 0 || gpaValue > 4.33) {
          error = "GPA must be between 0.00 and 4.33 (UBC scale)";
        } else if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
          error = "GPA can have maximum 2 decimal places";
        }
      }
    } else if (field === "academicInfo.expectedGraduation") {
      if (!value || value.trim() === "") {
        error = "Expected graduation date is required";
      } else if (value.trim().length > 20) {
        error = "Expected graduation must be 20 characters or less";
      }
    } else if (field === "academicInfo.degreeStart") {
      if (!value || value.trim() === "") {
        error = "Degree start year is required";
      } else if (!/^\d{4}$/.test(value.trim())) {
        error = "Degree start must be a 4-digit year (e.g., 2021)";
      } else {
        const year = parseInt(value.trim());
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 10) {
          error = `Degree start year must be between 1900 and ${currentYear + 10}`;
        }
      }
    } else if (field === "academicInfo.yearStanding") {
      if (!value || value.trim() === "") {
        error = "Year standing is required";
      } else if (!/^\d+$/.test(value.trim())) {
        error = "Year standing must be a whole number";
      } else {
        const standing = parseInt(value.trim());
        if (standing < 1 || standing > 8) {
          error = "Year standing must be between 1 and 8";
        }
      }
    }

    return error;
  };

  

  // Add experience validation function
  const validateExperienceField = (field, value, context = {}) => {
    let error = null;

    if (field === "course") {
      if (!value || value.trim() === "") {
        error = "Course is required";
      } else if (!/^[A-Z]{2,4}\s*\d{3}[A-Z]?$/i.test(value.trim())) {
        error = "Enter course code like 'COSC 499' or 'MATH 100A'";
      } else if (value.trim().length > 100) {
        error = "Course name must be 100 characters or less";
      }
    } else if (field === "semester") {
      if (!value || value.trim() === "") {
        error = "Semester is required";
      } else {
        const semesterRegex = /^(Fall|Winter|Summer)\s+\d{4}$/i;
        if (!semesterRegex.test(value.trim())) {
          error = "Enter semester as 'Fall 2023', 'Winter 2024', or 'Summer 2023'";
        } else {
          const year = parseInt(value.trim().split(' ')[1]);
          const currentYear = new Date().getFullYear();
          if (year < 1990 || year > currentYear + 2) {
            error = `Year must be between 1990 and ${currentYear + 2}`;
          }
        }
      }
    } else if (field === "professor") {
      if (!value || value.trim() === "") {
        error = "Professor name is required";
      } else if (value.trim().length < 2) {
        error = "Professor name must be at least 2 characters";
      } else if (value.trim().length > 100) {
        error = "Professor name must be 100 characters or less";
      } else if (!/^[a-zA-Z\s\.\-']+$/.test(value.trim())) {
        error = "Professor name can only contain letters, spaces, periods, hyphens, and apostrophes";
      }
    }

    return error;
  };

  // Add course preference validation function
  const validateCoursePreference = (value) => {
    if (!value || value.trim() === "") {
      return "Course preference cannot be empty";
    } else if (value.trim().length > 20) {
      return "Course code must be 20 characters or less";
    } else if (!/^[A-Z]{2,4}\s*\d{3}[A-Z]?$/i.test(value.trim())) {
      return "Enter course code like 'COSC 499' or 'MATH 100A'";
    }
    return null;
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

    const firstNameValid = userData.firstName?.trim().length >= 2;
    const lastNameValid = userData.lastName?.trim().length >= 2;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email?.trim() || '');

    return firstNameValid && lastNameValid && emailValid;
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
  // Add this function with your other validation functions
  const validateAcademicForm = () => {
    const newErrors = {};

    // Validate required fields and their formats
    if (!userData.major?.trim()) {
      newErrors.major = "Major is required";
    } else {
      const majorError = validateAcademicField("major", userData.major);
      if (majorError) newErrors.major = majorError;
    }

    if (!userData.year?.trim()) {
      newErrors.year = "Academic level is required";
    }

    if (!userData.academicInfo?.degreeStart?.trim()) {
      newErrors.degreeStart = "Degree start year is required";
    } else {
      const degreeStartError = validateAcademicField("academicInfo.degreeStart", userData.academicInfo.degreeStart);
      if (degreeStartError) newErrors.degreeStart = degreeStartError;
    }

    if (!userData.academicInfo?.yearStanding?.trim()) {
      newErrors.yearStanding = "Year standing is required";
    } else {
      const yearStandingError = validateAcademicField("academicInfo.yearStanding", userData.academicInfo.yearStanding);
      if (yearStandingError) newErrors.yearStanding = yearStandingError;
    }

    if (!userData.academicInfo?.expectedGraduation?.trim()) {
      newErrors.expectedGraduation = "Expected graduation is required";
    }

    // Validate optional fields if they have values
    if (userData.gpa && userData.gpa.trim() !== "") {
      const gpaError = validateAcademicField("gpa", userData.gpa);
      if (gpaError) newErrors.gpa = gpaError;
    }

    if (userData.minor && userData.minor.trim() !== "") {
      const minorError = validateAcademicField("minor", userData.minor);
      if (minorError) newErrors.minor = minorError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExperienceForm = (editedExperience) => {
    const newErrors = {};
    let hasErrors = false;
    editedExperience.forEach((exp, index) => {
      const courseError = validateExperienceField("course", exp.course);
      if (courseError) {
        newErrors[`course_${index}`] = courseError;
        hasErrors = true;
      }
      const semesterError = validateExperienceField("semester", exp.semester);
      if (semesterError) {
        newErrors[`semester_${index}`] = semesterError;
        hasErrors = true;
      }
      const professorError = validateExperienceField("professor", exp.professor);
      if (professorError) {
        newErrors[`professor_${index}`] = professorError;
        hasErrors = true;
      }
    });
    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors, experience: "Please fix the validation errors before saving." }));
    }
    return !hasErrors;
  };

  const validateSkillsForm = (editedSkills) => {
    const newErrors = {};
    let hasErrors = false;
    editedSkills.technicalSkills.forEach((skill, index) => {
      const error = validateSkillField(skill);
      if (error) {
        newErrors[`technical_${index}`] = error;
        hasErrors = true;
      }
    });
    editedSkills.softSkills.forEach((skill, index) => {
      const error = validateSkillField(skill);
      if (error) {
        newErrors[`soft_${index}`] = error;
        hasErrors = true;
      }
    });
    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors, skills: "Please fix the validation errors before saving." }));
    }
    return !hasErrors;
  };

  // Add validation function for the entire course preferences form
  const validateCoursePreferencesForm = (coursePreference) => {
    const newErrors = {};
    let hasErrors = false;
    coursePreference.forEach((course, index) => {
      const error = validateCoursePreference(course);
      if (error) {
        newErrors[`course_${index}`] = error;
        hasErrors = true;
      }
    });
    if (hasErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
    return !hasErrors;
  };

  // Fix the handleSaveAcademicInfo function to match your working original
  const handleSaveAcademicInfo = async (userData) => {
    if (!validateAcademicForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      // Use the EXACT same structure as your working original file
      const updatedData = {
        // Top-level fields for Student model
        program: userData.major,  // Major -> program
        study_level: userData.year,  // Academic Level -> study_level
        year_standing: parseInt(userData.academicInfo?.yearStanding || 0),
        expected_graduation: userData.academicInfo?.expectedGraduation,  // This was working in original

        // Nested StudentProfile fields
        student_profile: {
          gpa: userData.gpa ? parseFloat(userData.gpa) : null,
          minor: userData.minor,
          year_degree_start: parseInt(userData.academicInfo?.degreeStart || new Date().getFullYear())
        }
      };

      console.log("Saving academic data:", updatedData);

      const response = await updateProfile(updatedData);
      console.log("Academic save response:", response);

      // Refresh the profile data
      const refreshedData = await getProfile();
      const transformedData = transformBackendDataToFrontend(refreshedData);

      setOriginalUserData(transformedData);
      setUserData(transformedData);

      setIsEditingAcademic(false);
      showSuccessMessage("Academic information updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to save academic information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add this function to handle academic input changes
  const handleAcademicInputChange = (field, value) => {
    console.log(`Academic input change: ${field} = "${value}"`);

    if (field.includes('.')) {
      // Handle nested fields like academicInfo.degreeStart
      const [parent, child] = field.split('.');
      console.log(`Nested field detected: parent = ${parent}, child = ${child}`);
      setUserData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level fields
      console.log(`Inside else block for handleAcademicInputChange for field: ${field}`);
      console.log(`Setting userData[${field}] to "${value}"`);
      setUserData((prev) => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear any related errors
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const handleCancelAcademicInfo = () => {
    // Reset userData to original values instead of editedAcademicInfo
    setUserData({ ...originalUserData });
    setIsEditingAcademic(false);
    setErrors({});
  };

  // Add the missing functions for experience, skills, and courses
  const handleSaveExperience = async (editedExperience) => {
    // Validate experience data
    const hasEmptyFields = editedExperience.some(exp =>
      !exp.course.trim() || !exp.semester.trim() || !exp.professor.trim()
    );

    if (hasEmptyFields) {
      setErrors({ experience: "Please fill in all required fields for each experience." });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Format experiences for API
      const formattedExperiences = editedExperience.map(exp => {
        // Extract year and term from semester (e.g., "Winter 2024")
        const semesterParts = exp.semester.trim().split(' ');
        const year = semesterParts.length > 1 ? semesterParts[1] : new Date().getFullYear().toString();
        const term = semesterParts[0] || 'Winter';

        // Create a reasonable date based on term and year
        let startDate = `${year}-`;
        if (term.toLowerCase().includes('winter')) startDate += '01-02';
        else if (term.toLowerCase().includes('summer')) startDate += '05-02';
        else if (term.toLowerCase().includes('fall')) startDate += '09-02';
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

      console.log("Experiences data being sent:", formattedExperiences);

      // Use the specialized experience update function
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

      setEditedExperience([...transformedProfile.experience]);
      setIsEditingExperience(false);
      showSuccessMessage("Experience updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to save experience. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSkills = async (editedSkills) => {
    // Validate skills data
    const hasEmptyTechnicalSkills = editedSkills.technicalSkills.some(skill => skill.trim() === "");
    const hasEmptySoftSkills = editedSkills.softSkills.some(skill => skill.trim() === "");

    if (hasEmptyTechnicalSkills || hasEmptySoftSkills) {
      setErrors({ skills: "Each skill must contain text. Remove empty fields or fill them in." });
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Build the payload
      const skillsArray = []
      editedSkills.technicalSkills
        .filter(s => s.trim() !== "")
        .forEach(s => skillsArray.push({ skill_name: s.trim(), skill_type: "technical" }))
      editedSkills.softSkills
        .filter(s => s.trim() !== "")
        .forEach(s => skillsArray.push({ skill_name: s.trim(), skill_type: "soft" }))

      // 1) Send update and grab the returned skills list
      const response = await updateSkills(skillsArray)
      const returned = response.data.skills

      // 2) Map that into just names
      const newTechnical = returned
        .filter(sk => sk.skill_type === "technical")
        .map(sk => sk.name)
      const newSoft = returned
        .filter(sk => sk.skill_type === "soft")
        .map(sk => sk.name)

      // 3) Update all the relevant state
      setUserData(prev => ({
        ...prev,
        technicalSkills: newTechnical,
        softSkills: newSoft
      }))
      setOriginalUserData(prev => ({
        ...prev,
        technicalSkills: newTechnical,
        softSkills: newSoft
      }))
      setEditedSkills({
        technicalSkills: [...newTechnical],
        softSkills: [...newSoft]
      })

      setSkillsEdit(false)
      showSuccessMessage("Skills updated successfully")
    } catch (error) {
      handleApiError(error, "Failed to save skills. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCourses = async (coursePreference) => {
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

  const handleSaveAvailability = async (availabilityData) => {
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

  // Add the majors array
  const majors = [
    "Computer Science",
    "Mathematics", 
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "Psychology",
    "Other (please specify)",
  ];

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
                      onClick={() => handleSavePersonalInfo(userData)}
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
                      console.log("Edit button clicked, setting userData to editedProfile");
                      setEditedProfile({ ...userData });
                      console.log("EditedProfile finished");
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
                          onChange={(e) => {
                            // Only allow digits and limit to 8 characters
                            const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                            handleInputChange("studentId", value);
                          }}
                          placeholder="12345678 (8 digits)"
                          maxLength="8"
                        />
                      ) : (
                        <p className="text-sm">{userData.studentId}</p>
                      )}
                      {errors.studentId && <p className="text-red-500 text-xs">{errors.studentId}</p>}
                      {errors.student_number && <p className="text-red-500 text-xs">{errors.student_number}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="UBCEmployeeId">UBC Employee ID (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id="UBCEmployeeId"
                          value={userData.employeeNumber}
                          onChange={(e) => {
                            // Only allow digits and limit to 10 characters
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            handleInputChange("employeeNumber", value);
                          }}
                          placeholder="1234567890 (max 10 digits)"
                          maxLength="10"
                        />
                      ) : (
                        <p className="text-sm">{userData.employeeNumber}</p>
                      )}
                      {errors.employeeNumber && <p className="text-red-500 text-xs">{errors.employeeNumber}</p>}
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
                          onChange={(e) => {
                            // Allow common phone formats
                            const value = e.target.value.replace(/[^\d\s\-\(\)\.\+]/g, '');
                            handleInputChange("phone", value);
                          }}
                          placeholder="+1-234-567-8900 or (234) 567-8900"
                        />
                      ) : (
                        <p className="text-sm">{userData.phone}</p>
                      )}
                      {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                      {isEditing && (
                        <p className="text-xs text-muted-foreground">
                          Format: +1-234-567-8900, (234) 567-8900, or 234.567.8900
                        </p>
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
                      onClick={() => handleSaveAcademicInfo(userData)}
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
                      setIsEditingAcademic(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Academic Information
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Major<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <div className="space-y-2">
                        {/* Always show dropdown first, but handle custom values better */}
                        {(userData.major === "" || userData.major === "Other (please specify)" || majors.includes(userData.major || '')) && (
                          <select
                            value={userData.major === "Other (please specify)" ? "Other (please specify)" : userData.major || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Major dropdown changed to:", value);
                              if (value === "Other (please specify)") {
                                // Set to empty string to trigger input field
                                handleAcademicInputChange("major", "");
                              } else {
                                handleAcademicInputChange("major", value);
                              }
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select Major</option>
                            {majors.map((major) => (
                              <option key={major} value={major}>
                                {major}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Show input field for custom major or when "Other" is selected */}
                        {((userData.major && !majors.includes(userData.major) && userData.major !== "Other (please specify)") || userData.major === "") && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Please specify your major"
                              value={userData.major === "Other (please specify)" ? "" : userData.major || ''}
                              onChange={(e) => {
                                console.log("Major input changed to:", e.target.value);
                                handleAcademicInputChange("major", e.target.value);
                              }}
                              autoFocus
                            />
                            {/* Show button to go back to dropdown if they want */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log("Switching back to dropdown");
                                handleAcademicInputChange("major", "");
                              }}
                            >
                              Choose from predefined majors
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{userData.major}</p>
                    )}
                    {errors.major && <p className="text-red-500 text-xs">{errors.major}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Academic Level<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <select
                        value={userData.year || ''}
                        onChange={(e) => handleAcademicInputChange("year", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Academic Level</option>
                        <option value="undergraduate">Undergraduate</option>
                        <option value="graduate">Graduate</option>
                      </select>
                    ) : (
                      <p className="text-sm">{userData.year}</p>
                    )}
                    {errors.year && <p className="text-red-500 text-xs">{errors.year}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>GPA (Optional)</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={userData.gpa || ''}
                        onChange={(e) => handleAcademicInputChange("gpa", e.target.value)}
                        placeholder="e.g., 3.85 (0.00-4.33)"
                      />
                    ) : (
                      <p className="text-sm">{userData.gpa}</p>
                    )}
                    {errors.gpa && <p className="text-red-500 text-xs">{errors.gpa}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Graduation<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={userData.academicInfo?.expectedGraduation || ''}
                        onChange={(e) => handleAcademicInputChange("academicInfo.expectedGraduation", e.target.value)}
                        placeholder="e.g., May 2025, 2025-05, Spring 2025"
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo?.expectedGraduation}</p>
                    )}
                    {errors.expectedGraduation && <p className="text-red-500 text-xs">{errors.expectedGraduation}</p>}
                    {isEditingAcademic && (
                      <p className="text-xs text-muted-foreground">
                        Enter any format: "May 2025", "2025-05", "Spring 2025", etc.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Degree Start<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={userData.academicInfo?.degreeStart || ''}
                        onChange={(e) => {
                          // Only allow 4 digits for year
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          handleAcademicInputChange("academicInfo.degreeStart", value);
                          
                          // Real-time validation
                          const error = validateAcademicField("academicInfo.degreeStart", value);
                          setErrors(prev => ({
                            ...prev,
                            degreeStart: error
                          }));
                        }}
                        placeholder="e.g., 2021"
                        maxLength="4"
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo?.degreeStart}</p>
                    )}
                    {errors.degreeStart && <p className="text-red-500 text-xs">{errors.degreeStart}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Year Standing<span className="text-red-500">*</span></Label>
                    {isEditingAcademic ? (
                      <Input
                        value={userData.academicInfo?.yearStanding || ''}
                        onChange={(e) => {
                          // Only allow digits, max 1 character for standing
                          const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                          handleAcademicInputChange("academicInfo.yearStanding", value);
                          
                          // Real-time validation
                          const error = validateAcademicField("academicInfo.yearStanding", value);
                          setErrors(prev => ({
                            ...prev,
                            yearStanding: error
                          }));
                        }}
                        placeholder="e.g., 3 (1-8)"
                        maxLength="1"
                      />
                    ) : (
                      <p className="text-sm">{userData.academicInfo?.yearStanding}</p>
                    )}
                    {errors.yearStanding && <p className="text-red-500 text-xs">{errors.yearStanding}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Minor (Optional)</Label>
                    {isEditingAcademic ? (
                      <div className="space-y-2">
                        {/* Always show dropdown first for minor too */}
                        {(userData.minor === "" || userData.minor === "Other (please specify)" || majors.includes(userData.minor || '') || !userData.minor) && (
                          <select
                            value={userData.minor === "Other (please specify)" ? "Other (please specify)" : userData.minor || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Minor dropdown changed to:", value);
                              if (value === "Other (please specify)") {
                                handleAcademicInputChange("minor", "");
                              } else {
                                handleAcademicInputChange("minor", value);
                              }
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">No Minor</option>
                            {majors.map((major) => (
                              <option key={major} value={major}>
                                {major}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Show input field for custom minor */}
                        {((userData.minor && !majors.includes(userData.minor) && userData.minor !== "Other (please specify)") || userData.minor === "") && userData.minor !== null && (
                          <div className="space-y-2">
                            <Input
                              placeholder="Please specify your minor"
                              value={userData.minor === "Other (please specify)" ? "" : userData.minor || ''}
                              onChange={(e) => {
                                console.log("Minor input changed to:", e.target.value);
                                handleAcademicInputChange("minor", e.target.value);
                              }}
                              autoFocus
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log("Switching minor back to dropdown");
                                handleAcademicInputChange("minor", "");
                              }}
                            >
                              Choose from predefined minors
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{userData.minor}</p>
                    )}
                    {errors.minor && <p className="text-red-500 text-xs">{errors.minor}</p>}
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
                      onClick={() => handleSaveExperience(editedExperience)}
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
                          <div className="space-y-1">
                            <Input
                              value={exp.course || ''}
                              onChange={(e) => {
                                const newExp = [...editedExperience];
                                newExp[index].course = e.target.value;
                                setEditedExperience(newExp);

                                // Real-time validation
                                const error = validateExperienceField("course", e.target.value);
                                setErrors(prev => ({
                                  ...prev,
                                  [`course_${index}`]: error
                                }));
                              }}
                              placeholder="e.g., COSC 499"
                            />
                            {errors[`course_${index}`] && (
                              <p className="text-red-500 text-xs">{errors[`course_${index}`]}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">{exp.course}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Semester<span className="text-red-500">*</span></Label>
                        {isEditingExperience ? (
                          <div className="space-y-1">
                            <Input
                              value={exp.semester || ''}
                              onChange={(e) => {
                                const newExp = [...editedExperience];
                                newExp[index].semester = e.target.value;
                                setEditedExperience(newExp);

                                // Real-time validation
                                const error = validateExperienceField("semester", e.target.value);
                                setErrors(prev => ({
                                  ...prev,
                                  [`semester_${index}`]: error
                                }));
                              }}
                              placeholder="e.g., Fall 2023"
                            />
                            {errors[`semester_${index}`] && (
                              <p className="text-red-500 text-xs">{errors[`semester_${index}`]}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Format: Fall/Winter/Summer YYYY</p>
                          </div>
                        ) : (
                          <p className="text-sm">{exp.semester}</p>
                        )}
                        {isEditingExperience && (
                          <p className="text-xs text-muted-foreground">Accepted formats are Fall 2023, Winter 2024, Summer 2021</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Professor<span className="text-red-500">*</span></Label>
                        {isEditingExperience ? (
                          <div className="space-y-1">
                            <Input
                              value={exp.professor || ''}
                              onChange={(e) => {
                                const newExp = [...editedExperience];
                                newExp[index].professor = e.target.value;
                                setEditedExperience(newExp);

                                // Real-time validation
                                const error = validateExperienceField("professor", e.target.value);
                                setErrors(prev => ({
                                  ...prev,
                                  [`professor_${index}`]: error
                                }));
                              }}
                              placeholder="Professor's name"
                            />
                            {errors[`professor_${index}`] && (
                              <p className="text-red-500 text-xs">{errors[`professor_${index}`]}</p>
                            )}
                          </div>
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
                          placeholder="Describe your TA responsibilities..."
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
                            onClick={() => handleSaveSkills(editedSkills)}
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
                                    <div className="flex-1">
                                      <Input
                                        value={skill}
                                        className="w-full"
                                        onChange={(e) => {
                                          // Filter out numbers and restrict to letters/symbols only
                                          const value = e.target.value.replace(/[0-9]/g, '');
                                          const newSkills = [...editedSkills.technicalSkills]
                                          newSkills[index] = value
                                          setEditedSkills({ ...editedSkills, technicalSkills: newSkills })

                                          // Real-time validation
                                          const error = validateSkillField(value);
                                          setErrors(prev => ({
                                            ...prev,
                                            [`technical_${index}`]: error
                                          }));
                                        }}
                                        placeholder="e.g., JavaScript, Python, React"
                                      />
                                      {errors[`technical_${index}`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`technical_${index}`]}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const updated = editedSkills.technicalSkills.filter((_, i) => i !== index)
                                        setEditedSkills({ ...editedSkills, technicalSkills: updated })
                                        // Clear error
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[`technical_${index}`];
                                          return newErrors;
                                        });
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
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        data-testid="technical-skill"
                                      >
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
                                    <div className="flex-1">
                                      <Input
                                        value={skill}
                                        className="w-full"
                                        onChange={(e) => {
                                          // Filter out numbers and restrict to letters/symbols only
                                          const value = e.target.value.replace(/[0-9]/g, '');
                                          const newSkills = [...editedSkills.softSkills]
                                          newSkills[index] = value
                                          setEditedSkills({ ...editedSkills, softSkills: newSkills })

                                          // Real-time validation
                                          const error = validateSkillField(value);
                                          setErrors(prev => ({
                                            ...prev,
                                            [`soft_${index}`]: error
                                          }));
                                        }}
                                        placeholder="e.g., Communication, Leadership"
                                      />
                                      {errors[`soft_${index}`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`soft_${index}`]}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const updated = editedSkills.softSkills.filter((_, i) => i !== index)
                                        setEditedSkills({ ...editedSkills, softSkills: updated })
                                        // Clear error
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[`soft_${index}`];
                                          return newErrors;
                                        });
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
                                onClick={() => handleSaveCourses(coursePreference)}
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
                        {isEditingCourses ? (
                          <div className="space-y-4">
                            {coursePreference.length === 0 && (
                              <p className="text-sm text-muted-foreground">No course preferences added yet.</p>
                            )}

                            {coursePreference.map((course, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={course}
                                    onChange={(e) => {
                                      const updated = [...coursePreference]
                                      updated[index] = e.target.value
                                      setCoursePreference(updated)

                                      // Real-time validation
                                      const error = validateCoursePreference(e.target.value);
                                      setErrors(prev => ({
                                        ...prev,
                                        [`course_${index}`]: error
                                      }));
                                    }}
                                    placeholder="e.g., COSC 499, MATH 100A"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const updated = coursePreference.filter((_, i) => i !== index)
                                      setCoursePreference(updated)
                                      // Clear error for this field
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[`course_${index}`];
                                        return newErrors;
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {/* Show validation error for this specific course */}
                                {errors[`course_${index}`] && (
                                  <p className="text-red-500 text-xs">{errors[`course_${index}`]}</p>
                                )}
                              </div>
                            ))}

                            <Button
                              onClick={() => setCoursePreference([...coursePreference, ""])}
                              variant="outline"
                            >
                              + Add Course
                            </Button>

                            {/* General help text */}
                            <p className="text-xs text-muted-foreground">
                              Format: Department code + space + course number (e.g., COSC 499, MATH 100A)
                            </p>
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
                          onClick={() => {
                            console.log("Save button clicked!"); // Add this debug line
                            handleSaveAvailability(availabilityData);
                          }}
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
                          // Initialize editing state with fresh copy of saved availability
                          setAvailabilityData(userData.availability ? [...userData.availability] : Array(50).fill(false));
                          setIsEditingAvailability(true);
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


                    <span style={{ display: "block", marginBottom: "1rem" }}>
                      Please indicate your general weekly availability below.
                    </span>

                    <div style={{
                      backgroundColor: "#f0f7ff",
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1rem",
                      border: "1px solid #cfe2ff"
                    }}>
                      <strong style={{ color: "#2563eb" }}>Blue boxes</strong> represent times that you are
                      <strong style={{ color: "#ef4444" }}> NOT available </strong>for work, and
                      <strong style={{ color: "#000" }}> white boxes </strong>represent times that you
                      <strong style={{ color: "#22c55e" }}> ARE available</strong>.
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                      marginBottom: "1.5rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#2563eb",
                          border: "1px solid #ccc"
                        }} />
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>Not Available</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: "#fff",
                          border: "1px solid #ccc"
                        }} />
                        <span style={{ color: "#22c55e", fontWeight: "bold" }}>Available</span>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: "#fff5f5",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1.5rem"
    
                    }}>
                      <strong style={{ color: "#b91c1c" }}>⚠ Tip:</strong>
                      <span style={{ color: "#b91c1c", marginLeft: "0.5rem" }}>
                        Only highlight the times you are <u>NOT available</u>!
                      </span>
                    </div>
                  </p>

                  {isEditingAvailability ? (
                    <WeeklyAvailabilityCalendar
                      editable={true}
                      availability={availabilityData}
                      setAvailability={setAvailabilityData}
                    />
                  ) : (
                    <WeeklyAvailabilityCalendar
                      editable={false}
                      availability={userData.availability || []}
                      setAvailability={() => { }} // Empty function since we're not editing
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}