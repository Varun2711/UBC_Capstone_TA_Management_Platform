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


// Mock data
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "SJ2024001",
  major: "Computer Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=120&width=120",
  address: "123 University Ave, College Town, ST 12345",
  emergencyContact: {
    name: "John Johnson",
    relationship: "Father",
    phone: "+1 (555) 987-6543",
  },
  academicInfo: {
    expectedGraduation: "May 2025",
    credits: "45/60",
    advisor: "Dr. Emily Chen",
    concentration: "Software Engineering",
  },
  experience: [
    {
      title: "Teaching Assistant",
      course: "CS 101 - Introduction to Programming",
      semester: "Fall 2023",
      professor: "Dr. Smith",
      description: "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
    },
    {
      title: "Research Assistant",
      department: "Computer Science Department",
      duration: "Summer 2023",
      supervisor: "Dr. Brown",
      description: "Conducted research on machine learning algorithms and published findings in conference paper.",
    },
  ],
  skills: [
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
  languages: [
    { language: "English", proficiency: "Native" },
    { language: "Spanish", proficiency: "Conversational" },
    { language: "Mandarin", proficiency: "Basic" },
  ],
  availability: {
    maxHours: "20",
    preferredDays: ["Monday", "Wednesday", "Friday"],
    timePreference: "Morning",
  },
  references: [
    {
      name: "Dr. Michael Smith",
      title: "Professor",
      department: "Computer Science",
      email: "m.smith@university.edu",
      phone: "+1 (555) 111-2222",
    },
    {
      name: "Dr. Jennifer Brown",
      title: "Research Supervisor",
      department: "Computer Science",
      email: "j.brown@university.edu",
      phone: "+1 (555) 333-4444",
    },
  ],
  personalStatement:
    "I am a dedicated graduate student with a passion for teaching and helping others learn computer science concepts. My experience as a TA has taught me the importance of patience, clear communication, and adapting teaching methods to different learning styles. I am committed to creating an inclusive and supportive learning environment for all students.",
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(studentProfile)

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
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Picture and Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
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
                        <p className="text-sm font-medium">{profile.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <p className="text-sm text-muted-foreground">{profile.studentId}</p>
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
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={profile.address}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm">{profile.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <p className="text-sm font-medium">{profile.major}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Level</Label>
                    <p className="text-sm">{profile.year}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>GPA</Label>
                    <p className="text-sm font-medium">{profile.gpa}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Graduation</Label>
                    <p className="text-sm">{profile.academicInfo.expectedGraduation}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Credits Completed</Label>
                    <p className="text-sm">{profile.academicInfo.credits}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Advisor</Label>
                    <p className="text-sm">{profile.academicInfo.advisor}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Concentration</Label>
                    <p className="text-sm">{profile.academicInfo.concentration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
                <CardDescription>Your teaching and work experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exp.course || exp.department} • {exp.semester || exp.duration}
                        </p>
                        <p className="text-sm text-muted-foreground">Supervisor: {exp.professor || exp.supervisor}</p>
                        <p className="text-sm mt-2">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Technical Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium">Languages</Label>
                      <div className="space-y-2 mt-2">
                        {profile.languages.map((lang, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{lang.language}</span>
                            <Badge variant="outline">{lang.proficiency}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maximum Hours per Week</Label>
                    <p className="text-sm font-medium">{profile.availability.maxHours} hours</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.availability.preferredDays.map((day, index) => (
                        <Badge key={index} variant="secondary">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Preference</Label>
                    <p className="text-sm">{profile.availability.timePreference}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle>References</CardTitle>
                <CardDescription>Academic and professional references</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.references.map((ref, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium">{ref.name}</h4>
                      <p className="text-sm text-muted-foreground">{ref.title}</p>
                      <p className="text-sm text-muted-foreground">{ref.department}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{ref.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{ref.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personal Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Statement</CardTitle>
                <CardDescription>Tell us about yourself and your teaching philosophy</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={profile.personalStatement}
                    onChange={(e) => setProfile({ ...profile, personalStatement: e.target.value })}
                    rows={6}
                    placeholder="Write about your teaching experience, philosophy, and what makes you a great TA candidate..."
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{profile.personalStatement}</p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{profile.emergencyContact.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <p className="text-sm">{profile.emergencyContact.relationship}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <p className="text-sm">{profile.emergencyContact.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
