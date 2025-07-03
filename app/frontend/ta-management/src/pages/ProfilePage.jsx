"use client"

import { useState, useEffect } from "react" // Added useEffect to imports
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
import {getProfile, updateProfile} from "@/logic/student-profile"


// Mock data - Kept for reference or initial structure, but actual data will come from backend
// const studentProfile = { /* ... (your mock data structure) ... */ };
// Removed the studentProfile constant to ensure all data comes from backend logic.
// If you still need a fallback for local development without a backend, keep it and
// uncomment its usage where appropriate, but prioritize fetched data.


export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  // const [profile, setProfile] = useState(studentProfile) // Removed as it's redundant now

  const [editedProfile, setEditedProfile] = useState({}) // Initialize as empty object or null


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
  const [availabilityData, setAvailabilityData] = useState([]) // Initialize as empty array

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


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProfile();

        // Correctly parse the flat API response and map all fields
        const [firstName, ...lastNameParts] = data.name.split(' ');

        const profileData = {
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          email: data.email || '',
          employeeNumber: data.employee_number || '', // Mapped from backend
          studentId: data.student_id || '', // Mapped from backend
          major: data.major || '', // Mapped from backend
          minor: data.minor || '', // Mapped from backend
          year: data.year || '', // Mapped from backend (e.g., "Graduate Student")
          gpa: data.gpa || '', // Mapped from backend
          phone: data.phone || '', // Mapped from backend
          avatar: data.avatar || "/placeholder.svg?height=120&width=120", // Mapped from backend
          coursePreference: data.course_preference || [], // Mapped from backend
          academicInfo: { // Assuming academic info comes nested or you map it
            yearStanding: data.year_standing || '', // Mapped from backend
            degreeStart: data.degree_start || '', // Mapped from backend
            expectedGraduation: data.expected_graduation || '', // Mapped from backend
          },
          experience: data.experience || [], // Mapped from backend
          technicalSkills: data.technical_skills || [], // Mapped from backend
          softSkills: data.soft_skills || [], // Mapped from backend
          availability: data.availability || [], // Mapped from backend
        };

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
        setAvailabilityData([...profileData.availability]);

      } catch (error) {
        setFetchError("Could not load your profile. Please try again later.");
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // New code for saving personal information
  const handleSavePersonalInfo = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      const updatedData = {
        name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
        email: userData.email,
        phone: userData.phone,
        student_id: userData.studentId, // Ensure to send student_id if editable
        employee_number: userData.employeeNumber, // Ensure to send employee_number if editable
        // Add other fields from userData that are part of the personal info update
        // Password change should typically be a separate flow for security reasons
      };

      await updateProfile(updatedData); // Assuming updateProfile can take partial updates

      setOriginalUserData({ ...userData }); // Update originalUserData with latest saved data
      setIsEditing(false);
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
        console.error("Save personal info error:", error);
      }
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


  // *** Start of Missing Save and Cancel Functions for other sections ***

  // handleSave for Academic Information
  const handleSaveAcademicInfo = async () => {
    // Add validation specific to academic info fields if needed
    // For example: if (!editedAcademicInfo.major.trim()) { alert("Major is required."); return; }
    setIsSaving(true);
    try {
      const updatedData = {
        major: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        year: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        year_standing: editedAcademicInfo.academicInfo.yearStanding,
        degree_start: editedAcademicInfo.academicInfo.degreeStart,
        expected_graduation: editedAcademicInfo.academicInfo.expectedGraduation,
      };
      await updateProfile(updatedData); // Adjust your API call as needed

      // Update userData and originalUserData with the new academic info
      setOriginalUserData((prev) => ({
        ...prev,
        major: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        year: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        academicInfo: { ...editedAcademicInfo.academicInfo }
      }));
      setUserData((prev) => ({
        ...prev,
        major: editedAcademicInfo.major,
        minor: editedAcademicInfo.minor,
        year: editedAcademicInfo.year,
        gpa: editedAcademicInfo.gpa,
        academicInfo: { ...editedAcademicInfo.academicInfo }
      }));
      setIsEditingAcademic(false);
    } catch (error) {
      setErrors({ api: "Failed to save academic information. Please try again." });
      console.error("Failed to save academic info:", error);
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
  };

  // handleSave for Experience
  const handleSaveExperience = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ experience: editedExperience }); // Adjust API call as needed

      setOriginalUserData((prev) => ({ ...prev, experience: [...editedExperience] }));
      setUserData((prev) => ({ ...prev, experience: [...editedExperience] }));
      setIsEditingExperience(false);
    } catch (error) {
      setErrors({ api: "Failed to save experience. Please try again." });
      console.error("Failed to save experience:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // handleSave for Skills
  const handleSaveSkills = async () => {
    const hasEmptyTechnical = editedSkills.technicalSkills.some(skill => skill.trim() === "");
    const hasEmptySoft = editedSkills.softSkills.some(skill => skill.trim() === "");

    if (hasEmptyTechnical || hasEmptySoft) {
      alert("Each skill must contain text.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        technical_skills: editedSkills.technicalSkills,
        soft_skills: editedSkills.softSkills
      }); // Adjust API call as needed

      setOriginalUserData((prev) => ({
        ...prev,
        technicalSkills: [...editedSkills.technicalSkills],
        softSkills: [...editedSkills.softSkills]
      }));
      setUserData((prev) => ({
        ...prev,
        technicalSkills: [...editedSkills.technicalSkills],
        softSkills: [...editedSkills.softSkills]
      }));
      setSkillsEdit(false);
    } catch (error) {
      setErrors({ api: "Failed to save skills. Please try again." });
      console.error("Failed to save skills:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // handleSave for Course Preferences
  const handleSaveCourses = async () => {
    const hasEmptyCoursePreference = coursePreference.some(course => course.trim() === "");
    if (hasEmptyCoursePreference) {
      alert("Each course preference must contain text.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ course_preference: coursePreference }); // Adjust API call as needed

      setOriginalUserData((prev) => ({ ...prev, coursePreference: [...coursePreference] }));
      setUserData((prev) => ({ ...prev, coursePreference: [...coursePreference] }));
      setIsEditingCourses(false);
    } catch (error) {
      setErrors({ api: "Failed to save course preferences. Please try again." });
      console.error("Failed to save course preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // handleSave for Availability
  const handleSaveAvailability = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ availability: availabilityData }); // Adjust API call to send availabilityData

      setOriginalUserData((prev) => ({ ...prev, availability: [...availabilityData] }));
      setUserData((prev) => ({ ...prev, availability: [...availabilityData] }));
      setIsEditingAvailability(false);
    } catch (error) {
      setErrors({ api: "Failed to save availability. Please try again." });
      console.error("Failed to save availability:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // *** End of Missing Save and Cancel Functions for other sections ***


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
        <AppSidebar />
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

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Profile Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Profile</h2>
                <p className="text-muted-foreground">Manage your personal information and TA application details</p>
              </div>
            </div>

            {/* Personal Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePersonalInfo} // Call the specific save handler
                      className="gap-2"
                      disabled={isSaving || !isFormValid()} // Disable save during saving or if form is invalid
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
                      setEditedProfile({ ...userData }); // Initialize editedProfile with current userData
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
                {errors.api && <p className="text-red-500 text-sm mb-4">{errors.api}</p>}
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
                        Password<span className="text-red-500">*</span> {/* This section might need a separate password change component */}
                      </Label>
                      {isEditing ? (
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value="********" // Password should not be pre-filled
                            onChange={(e) => { /* handle password change separately if needed */ }}
                            className="pr-10"
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
                      onClick={handleSaveAcademicInfo} // Call the new save handler
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAcademicInfo} // Call the new cancel handler
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

                            {/* Empty selection option */}
                            <Select.Item
                              value=" "
                              className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between text-gray-500"
                            >
                              <Select.ItemText>Select Academic Level</Select.ItemText>
                              <Select.ItemIndicator>
                                <Check className="h-4 w-4" />
                              </Select.ItemIndicator>
                            </Select.Item>

                            {/* Actual academic level options */}
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
                      onClick={handleSaveExperience} // Call the new save handler
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedExperience(originalUserData.experience.map(exp => ({ ...exp }))) // Reset to original fetched data
                        setIsEditingExperience(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditedExperience(userData.experience.map(exp => ({ ...exp }))) // deep copy of userData experience
                      setIsEditingExperience(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Experience
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Use editedExperience for mapping */}
                {editedExperience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Experience #{index + 1}</h4>
                      {isEditingExperience && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = editedExperience.filter((_, i) => i !== index)
                            setEditedExperience(updated)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">

                      <div className="space-y-1">
                        <Label>Course</Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.course}
                            onChange={(e) => {
                              const newExp = [...editedExperience]
                              newExp[index].course = e.target.value
                              setEditedExperience(newExp)
                            }}
                          />
                        ) : (
                          <p className="text-sm">{exp.course}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Semester</Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.semester}
                            onChange={(e) => {
                              const newExp = [...editedExperience]
                              newExp[index].semester = e.target.value
                              setEditedExperience(newExp)
                            }}
                          />
                        ) : (
                          <p className="text-sm">{exp.semester}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label>Professor</Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.professor}
                            onChange={(e) => {
                              const newExp = [...editedExperience]
                              newExp[index].professor = e.target.value
                              setEditedExperience(newExp)
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
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = [...editedExperience]
                            newExp[index].description = e.target.value
                            setEditedExperience(newExp)
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
                          title: '', // Add title if your API expects it, based on your mock
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
                            onClick={handleSaveSkills} // Call the new save handler
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedSkills({
                                technicalSkills: [...originalUserData.technicalSkills], // Reset to original fetched data
                                softSkills: [...originalUserData.softSkills],
                              })
                              setSkillsEdit(false)
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
                              technicalSkills: [...userData.technicalSkills], // Initialize with userData
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

                    {/* TECHNICAL SKILLS */}
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Technical Skills</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            {skillsEdit ? (
                              editedSkills.technicalSkills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={skill}
                                    className="w-40"
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
                              ))
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {userData.technicalSkills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
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
                              editedSkills.softSkills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={skill}
                                    className="w-40"
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
                              ))
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {userData.softSkills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
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
                                onClick={handleSaveCourses} // Call the new save handler
                                className="gap-2"
                                disabled={isSaving}
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsEditingCourses(false)
                                  setCoursePreference([...originalUserData.coursePreference]) // Reset to original fetched data
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
                                setCoursePreference([...userData.coursePreference]) // deep copy of userData course preference
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
                          <div className="flex flex-wrap gap-2 mt-2">
                            {userData.coursePreference.map((course, index) => (
                              <Badge key={index} variant="secondary">
                                {course}
                              </Badge>
                            ))}
                          </div>
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
                        <Button onClick={handleSaveAvailability} className="gap-2" disabled={isSaving}>
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingAvailability(false)
                            setAvailabilityData(originalUserData.availability || []) // Reset to original fetched availability
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
                          setAvailabilityData(userData.availability || []) // Initialize with userData availability
                          setIsEditingAvailability(true)
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
                    availability={availabilityData} // This state should be initialized from fetched userData.availability
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