"use client"

import { useState } from "react"
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


// Mock data
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "20240012",
  UBCEmployeeId: "82342316",
  password: "password123",
  major: "Computer Science",
  minor: "Data Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=120&width=120",
  coursePreference: [
    "COSC 111",
    "MATH 101",
    "COSC 121",
    "DATA 101",
    "STAT 121",
    "PHYS 111"
  ],
  academicInfo: {
    yearStanding: "4th Year",
    degreeStart: "September 2022",
    expectedGraduation: "May 2026",
  },
  experience: [
    {
      course: "CS 111 - Introduction to Programming",
      semester: "Fall 2023",
      professor: "Dr. Smith",
      description: "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
    },
    {
      course: "MATH 101 - Introduction to Calculus",
      semester: "Summer 2023",
      professor: "Dr. Brown",
      description: "Assisted with lecture sessions, and graded midterms and exams.",
    },
  ],
  technicalSkills: [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Git",
    "Linux",
    "Machine Learning",
    "Data Structures",
  ],
  softSkills: [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
  ],
}


export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(studentProfile)

  const [editedProfile, setEditedProfile] = useState({ ...studentProfile })


  // State for skills editing
  const [skillsEdit, setSkillsEdit] = useState(false)
  const [editedSkills, setEditedSkills] = useState({
    technicalSkills: [...profile.technicalSkills],
    softSkills: [...profile.softSkills]
  })

  // State for academic information editing
  const [isEditingAcademic, setIsEditingAcademic] = useState(false)
  const [editedAcademicInfo, setEditedAcademicInfo] = useState({
    major: profile.major,
    minor: profile.minor,
    year: profile.year,
    gpa: profile.gpa,
    academicInfo: { ...profile.academicInfo }
  })

  // State for experience editing
  const [isEditingExperience, setIsEditingExperience] = useState(false)
  const [editedExperience, setEditedExperience] = useState([...profile.experience])

  // State for availability editing
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [availabilityData, setAvailabilityData] = useState([]) // Initialize as needed

  // State for course preference editing
  const [isEditingCourses, setIsEditingCourses] = useState(false)
  const [coursePreference, setCoursePreference] = useState(profile.coursePreference)

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false)

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State for original user data
  const [originalUserData, setOriginalUserData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProfile();

        // Correctly parse the flat API response
        const [firstName, ...lastNameParts] = data.name.split(' ');

        const profile = {
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          email: data.email || '',
          employeeNumber: data.employee_number || '',
          studentId: data.student_id || '',
          department: data.department_name || '', // Ensure department is set, default to empty string if not present
        };

        setOriginalUserData(profile);
        setUserData(profile);
      } catch (error) {
        setFetchError("Could not load your profile. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  //Existing code
  /*
  const handleSave = (profileData) => {
  const {
    name,
    studentId,
    UBCEmployeeId,
    password,
    email,
    major,
    year,
    academicInfo,
    experience
  } = profileData

  if (
    !name.trim() ||
    !studentId.trim() ||
    !email.trim() ||
    !major.trim() ||
    !year.trim() ||
    !password.trim() ||
    !academicInfo.expectedGraduation.trim() ||
    !academicInfo.degreeStart.trim() ||
    !academicInfo.yearStanding.trim()
  ) {
    alert("Please fill out all required fields.")
    return false
  }
  console.log("Profile validated successfully:", profileData)
  return true
}
*/

  //New code
  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      const updatedData = {
        name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
        email: userData.email,
      };

      await updateProfile(updatedData);

      setOriginalUserData({ ...userData });
      setIsEditing(false);
    } catch (error) {
       // Check if the error is a 400 Bad Request with validation details
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};

        // Format backend errors to match the frontend state structure
        for (const field in backendErrors) {
          // Example: backend sends { "email": ["Enter a valid email."] }
          // We format it to { email: "Enter a valid email." }
          formattedErrors[field] = backendErrors[field][0]; 
        }

        setErrors(formattedErrors); // Update state with specific field errors
      } else {
        // Handle other errors (network, server 500, etc.)
        setErrors({ api: "Failed to save changes. Please try again." });
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

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setUserData({ ...originalUserData });
    setErrors({});
    setIsEditing(false);
  };

  const isFormValid = () => {
    if (!userData) return false;
    return (
      userData.firstName?.trim().length >= 2 &&
      userData.lastName?.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email?.trim() || '')
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center items-center h-screen text-red-500">{fetchError}</div>;
  }

  if (!userData) return null;


  //Existing code 
  /*
  const handleCancel = (profileData) => {
    setProfile(profileData) // Reset to original data
    setIsEditing(false)
  }
  */

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

            {/* Profile Picture and Personal Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                    onClick={() => {
                      const isValid = handleSave(editedProfile) // ✅ validate the latest state
                      if (!isValid) return

                      setProfile(editedProfile) // ✅ update profile with validated data
                      setIsEditing(false) // ✅ only close edit mode if validation passed
                    }}
                    className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={ 
                      () => handleCancel(profile)} 
                      variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={
                    () => {
                      setEditedProfile({ ...profile }) // deep copy of profile
                      setIsEditing(true)
                      }
                    }
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
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                      <AvatarFallback className="text-2xl">SJ</AvatarFallback>
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
                      <Label htmlFor="name">Full Name<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedProfile.name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID<span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="studentId"
                          value={editedProfile.studentId}
                          onChange={(e) => setEditedProfile({ ...editedProfile, studentId: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.studentId}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="UBCEmployeeId">UBC Employee ID (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id="UBCEmployeeId"
                          value={editedProfile.UBCEmployeeId}
                          onChange={(e) => setEditedProfile({ ...editedProfile, UBCEmployeeId: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.UBCEmployeeId}</p>
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
                            value={editedProfile.password}
                            onChange={(e) => setEditedProfile({ ...editedProfile, password: e.target.value })}
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
                          value={editedProfile.email}
                          onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedProfile.phone}
                          onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Academic Information</CardTitle>
                {isEditingAcademic ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const updatedProfile = {
                          ...profile,
                          major: editedAcademicInfo.major,
                          minor: editedAcademicInfo.minor,
                          year: editedAcademicInfo.year,
                          gpa: editedAcademicInfo.gpa,
                          academicInfo: { ...editedAcademicInfo.academicInfo },
                        }

                        const isValid = handleSave(updatedProfile)
                        if (!isValid) return

                        setProfile(updatedProfile)
                        setIsEditingAcademic(false)
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedAcademicInfo({
                          major: profile.major,
                          minor: profile.minor,
                          year: profile.year,
                          gpa: profile.gpa,
                          academicInfo: { ...profile.academicInfo }
                        })
                        setIsEditingAcademic(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setIsEditingAcademic(true)}>
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
                      <p className="text-sm">{profile.major}</p>
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
                      <p className="text-sm">{profile.year}</p>
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
                      <p className="text-sm">{profile.gpa}</p>
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
                      <p className="text-sm">{profile.academicInfo.expectedGraduation}</p>
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
                      <p className="text-sm">{profile.academicInfo.degreeStart}</p>
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
                      <p className="text-sm">{profile.academicInfo.yearStanding}</p>
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
                      <p className="text-sm">{profile.minor}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Past TA Experiences */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Past TA Experience</CardTitle>
                </div>
                {isEditingExperience ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setProfile({ ...profile, experience: editedExperience })
                        setIsEditingExperience(false)
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditedExperience(profile.experience.map(exp => ({ ...exp })))
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
                      setEditedExperience(profile.experience.map(exp => ({ ...exp }))) // deep copy
                      setIsEditingExperience(true)
                    }}
                    >
                    <Edit className="h-4 w-4" />
                    Edit Experience
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
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
                          title: '',
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
                {/* Skills*/}
                <div className="flex-1 flex flex-col">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Skills & Qualifications</CardTitle>
                      {skillsEdit ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const hasEmptyTechnical = editedSkills.technicalSkills.some(skill => skill.trim() === "")
                              const hasEmptySoft = editedSkills.softSkills.some(skill => skill.trim() === "")

                              if (hasEmptyTechnical || hasEmptySoft) {
                                alert("Each skill must contain text.")
                                return
                              }
                              setProfile((prev) => ({
                                ...prev,
                                technicalSkills: editedSkills.technicalSkills,
                                softSkills: editedSkills.softSkills,
                              }))
                              setSkillsEdit(false)
                            }}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditedSkills({
                                technicalSkills: [...profile.technicalSkills],
                                softSkills: [...profile.softSkills],
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
                        //onClick={() => setSkillsEdit(true)}
                        onClick={() => {
                          setEditedSkills({
                            technicalSkills: [...profile.technicalSkills],
                            softSkills: [...profile.softSkills],
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
                                {profile.technicalSkills.map((skill, index) => (
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
                                {profile.softSkills.map((skill, index) => (
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
                    {/* Course Preferences */}
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Course Preferences</CardTitle>
                        <div className="flex gap-2 mt-2">
                          {isEditingCourses ? (
                            <>
                              <Button
                                onClick={() => {
                                  const hasEmptyCoursePreference = coursePreference.some(coursePreference => coursePreference.trim() === "")

                                  if (hasEmptyCoursePreference) {
                                    alert("Each course preference must contain text.")
                                    return
                                  }
                                  setProfile((prev) => ({
                                    ...prev,
                                    coursePreference: [...coursePreference],
                                  }))
                                  setIsEditingCourses(false)
                                }}
                                className="gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setIsEditingCourses(false)
                                  setCoursePreference([...profile.coursePreference]) // Reset to original
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
                              setCoursePreference([...profile.coursePreference]) // deep copy
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
                            {coursePreference.map((course, index) => (
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
              {/* Availability Calendar */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Availability</CardTitle>
                  <div className="flex gap-2 mt-2">
                    {isEditingAvailability ? (
                      <>
                        <Button onClick={() => setIsEditingAvailability(false)} className="gap-2">
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingAvailability(false)
                            setAvailabilityData([]) // or reset to original data if available
                          }}
                          variant="outline"
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditingAvailability(true)} className="gap-2">
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
                    represent times that you are not.<br/><br/>
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
