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

// Mock data
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "SJ2024001",
  UBCEmployeeId: "82342316",
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
    credits: "45/60",
    concentration: "Software Engineering",
  },
  experience: [
    {
      title: "Teaching Assistant",
      course: "CS 111 - Introduction to Programming",
      semester: "Fall 2023",
      professor: "Dr. Smith",
      description: "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
    },
    {
      title: "Teaching Assistant",
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

  const handleSave = () => {
    // Here you would typically save to a backend
    setIsEditing(false)
    console.log("Profile saved:", profile)
  }

  const handleCancel = () => {
    setProfile(studentProfile) // Reset to original data
    setIsEditing(false)
  }

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

            {/* Profile Picture and Basic Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Basic Information</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
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
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      {isEditing ? (
                        <Input
                          id="studentId"
                          value={profile.studentId}
                          onChange={(e) => setProfile({ ...profile, studentId: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.studentId}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="UBCEmployeeId">UBC Employee ID</Label>
                      {isEditing ? (
                        <Input
                          id="UBCEmployeeId"
                          value={profile.UBCEmployeeId}
                          onChange={(e) => setProfile({ ...profile, UBCEmployeeId: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.UBCEmployeeId}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
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
                        setProfile({
                          ...profile,
                          major: editedAcademicInfo.major,
                          minor: editedAcademicInfo.minor,
                          year: editedAcademicInfo.year,
                          gpa: editedAcademicInfo.gpa,
                          academicInfo: { ...editedAcademicInfo.academicInfo }
                        })
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
                    Edit Academic Information
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Major</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.major}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, major: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.major}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Level</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.year}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, year: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{profile.year}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    {isEditingAcademic ? (
                      <Input
                        value={editedAcademicInfo.gpa}
                        onChange={(e) => setEditedAcademicInfo({ ...editedAcademicInfo, gpa: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile.gpa}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Graduation</Label>
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
                    <Label>Degree Start</Label>
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
                    <Label>Year Standing</Label>
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


            {/* Experience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Experience</CardTitle>
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
                        setEditedExperience([...profile.experience])
                        setIsEditingExperience(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setIsEditingExperience(true)}>
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
                        <Label>Title</Label>
                        {isEditingExperience ? (
                          <Input
                            value={exp.title}
                            onChange={(e) => {
                              const newExp = [...editedExperience]
                              newExp[index].title = e.target.value
                              setEditedExperience(newExp)
                            }}
                          />
                        ) : (
                          <p className="text-sm font-medium">{exp.title}</p>
                        )}
                      </div>

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
                          <p className="text-sm text-muted-foreground">{exp.semester}</p>
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
                          <p className="text-sm text-muted-foreground">{exp.professor}</p>
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



            <div className="grid gap-6 lg:grid-cols-3">

              <div className="space-y-6 col-span-2">
                {/* Skills and Qualifications */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Skills & Qualifications</CardTitle>
                    {skillsEdit ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
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
                      <Button size="sm" onClick={() => setSkillsEdit(true)}>
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



                {/* Course Preference */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Course Preference</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {isEditingCourses ? (
                        <>
                          <Button
                            onClick={() => {
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
                              setCoursePreference(profile.coursePreference) // Reset to original
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditingCourses(true)} className="gap-2">
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
                    <WeeklyAvailabilityCalendar
                      editable={isEditingAvailability}
                      availability={availabilityData}
                      setAvailability={setAvailabilityData}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
