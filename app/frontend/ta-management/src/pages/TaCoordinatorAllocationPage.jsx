"use client"

import { useState } from "react"
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Plus,
  Settings,
  Users,
  CheckCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "../components/scheduler-sidebar"
import App from "@/App"


// Mock data for TAs
const availableTAs = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    studentId: "SJ2024001",
    major: "Computer Science",
    year: "Graduate",
    gpa: "3.85",
    maxHours: 20,
    currentHours: 10,
    skills: ["Python", "Java", "JavaScript"],
    experience: ["CS 101", "CS 201"],
    availability: ["Monday", "Wednesday", "Friday"],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Available",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@university.edu",
    studentId: "MC2024002",
    major: "Computer Science",
    year: "PhD",
    gpa: "3.92",
    maxHours: 20,
    currentHours: 15,
    skills: ["C++", "Python", "Machine Learning"],
    experience: ["CS 301", "CS 401"],
    availability: ["Tuesday", "Thursday"],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Partially Allocated",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@university.edu",
    studentId: "ER2024003",
    major: "Computer Science",
    year: "Graduate",
    gpa: "3.78",
    maxHours: 15,
    currentHours: 15,
    skills: ["JavaScript", "React", "Node.js"],
    experience: ["CS 102", "CS 250"],
    availability: ["Monday", "Tuesday", "Wednesday"],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Fully Allocated",
  },
]

// Mock data for courses
const courses = [
  {
    id: 1,
    code: "CS 101",
    name: "Introduction to Programming",
    instructor: "Dr. Smith",
    semester: "Spring 2024",
    sections: [
      {
        id: 1,
        type: "Lecture",
        section: "001",
        time: "MWF 9:00-10:00",
        enrollment: 120,
        taRequired: 2,
        taAssigned: 1,
        assignedTAs: ["Sarah Johnson"],
      },
      {
        id: 2,
        type: "Lab",
        section: "L01",
        time: "M 2:00-4:00",
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
        assignedTAs: [],
      },
      {
        id: 3,
        type: "Lab",
        section: "L02",
        time: "W 2:00-4:00",
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
        assignedTAs: [],
      },
    ],
    totalTARequired: 4,
    totalTAAssigned: 1,
    priority: "High",
  },
  {
    id: 2,
    code: "CS 201",
    name: "Data Structures",
    instructor: "Dr. Johnson",
    semester: "Spring 2024",
    sections: [
      {
        id: 4,
        type: "Lecture",
        section: "001",
        time: "TTh 11:00-12:30",
        enrollment: 80,
        taRequired: 2,
        taAssigned: 2,
        assignedTAs: ["Michael Chen", "Emily Rodriguez"],
      },
      {
        id: 5,
        type: "Lab",
        section: "L01",
        time: "T 3:00-5:00",
        enrollment: 20,
        taRequired: 1,
        taAssigned: 1,
        assignedTAs: ["Emily Rodriguez"],
      },
    ],
    totalTARequired: 3,
    totalTAAssigned: 3,
    priority: "Medium",
  },
]

function getStatusBadge(status) {
  switch (status) {
    case "Available":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
    case "Partially Allocated":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partially Allocated</Badge>
    case "Fully Allocated":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Fully Allocated</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case "High":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>
    case "Medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>
    case "Low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

export default function TAAllocationPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTA, setSelectedTA] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredTAs = availableTAs.filter((ta) => {
    const matchesSearch =
      ta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || ta.status.toLowerCase().includes(filterStatus.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const totalTAs = availableTAs.length
  const availableTACount = availableTAs.filter((ta) => ta.status === "Available").length
  const totalCourses = courses.length
  const coursesNeedingTAs = courses.filter((course) => course.totalTAAssigned < course.totalTARequired).length

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activePage="TA Allocation"/>
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">TA Allocation Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Coordinator" />
                <AvatarFallback>TC</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total TAs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTAs}</div>
                  <p className="text-xs text-muted-foreground">{availableTACount} available</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCourses}</div>
                  <p className="text-xs text-muted-foreground">{coursesNeedingTAs} need TAs</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours Allocated</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{availableTAs.reduce((sum, ta) => sum + ta.currentHours, 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    of {availableTAs.reduce((sum, ta) => sum + ta.maxHours, 0)} max hours
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Allocation Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      (courses.reduce((sum, course) => sum + course.totalTAAssigned, 0) /
                        courses.reduce((sum, course) => sum + course.totalTARequired, 0)) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Allocation Interface */}
            <Tabs defaultValue="courses" className="space-y-4">
              <TabsList>
                <TabsTrigger value="courses">Manage Courses</TabsTrigger>
                <TabsTrigger value="allocate">Allocate TAs</TabsTrigger>
              </TabsList>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Sections</CardTitle>
                    <CardDescription>Manage course sections and TA requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {courses.map((course) => (
                        <div key={course.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {course.code} - {course.name}
                              </h3>
                              <p className="text-muted-foreground">
                                {course.instructor} • {course.semester}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPriorityBadge(course.priority)}
                              <Badge variant="outline">
                                {course.totalTAAssigned}/{course.totalTARequired} TAs Assigned
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-3">
                            {course.sections.map((section) => (
                              <div
                                key={section.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-4">
                                  <Badge variant={section.type === "Lecture" ? "default" : "secondary"}>
                                    {section.type}
                                  </Badge>
                                  <div>
                                    <p className="font-medium">Section {section.section}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {section.time} • {section.enrollment} students
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {section.taAssigned}/{section.taRequired} TAs
                                    </p>
                                    {section.assignedTAs.length > 0 && (
                                      <p className="text-xs text-muted-foreground">{section.assignedTAs.join(", ")}</p>
                                    )}
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Assign TA
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Allocate Tab */}
              <TabsContent value="allocate" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* TA Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select TA</CardTitle>
                      <CardDescription>Choose a TA to assign to a course section</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {availableTAs
                          .filter((ta) => ta.status !== "Fully Allocated")
                          .map((ta) => (
                            <div
                              key={ta.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedTA?.id === ta.id ? "border-blue-500 bg-blue-50" : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedTA(ta)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={ta.avatar || "/placeholder.svg"} alt={ta.name} />
                                    <AvatarFallback>
                                      {ta.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{ta.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {ta.currentHours}/{ta.maxHours} hours • {ta.major}
                                    </p>
                                  </div>
                                </div>
                                {getStatusBadge(ta.status)}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {ta.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Course Section Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Course Section</CardTitle>
                      <CardDescription>Choose a course section that needs a TA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {courses.map((course) => {
                          const availableSections = course.sections.filter(
                            (section) => section.taAssigned < section.taRequired
                          )

                          return (
                            <div key={course.id}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">
                                  {course.code} - {course.name}
                                </h4>
                                {availableSections.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No TA positions remaining</p>
                                )}
                              </div>

                              <div className="space-y-2 ml-4">
                                {availableSections.map((section) => (
                                  <div
                                    key={section.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                      selectedCourse?.id === section.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "hover:bg-muted/50"
                                    }`}
                                    onClick={() => setSelectedCourse(section)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {section.type} - Section {section.section}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {section.time} • {section.enrollment} students
                                        </p>
                                      </div>
                                      <Badge variant="outline">
                                        Needs {section.taRequired - section.taAssigned} TA
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Assignment Action */}
                {selectedTA && selectedCourse && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Confirm Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            Assign <span className="text-blue-600">{selectedTA.name}</span> to{" "}
                            <span className="text-blue-600">
                              {selectedCourse.type} Section {selectedCourse.section}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            This will add to their current workload: {selectedTA.currentHours} →{" "}
                            {selectedTA.currentHours + 5} hours
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTA(null)
                              setSelectedCourse(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              // Handle assignment logic here
                              console.log("Assigning", selectedTA.name, "to", selectedCourse)
                              setSelectedTA(null)
                              setSelectedCourse(null)
                            }}
                          >
                            Confirm Assignment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
