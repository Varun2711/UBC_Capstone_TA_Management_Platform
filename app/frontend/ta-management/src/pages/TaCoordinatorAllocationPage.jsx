"use client"

import { useEffect, useState } from "react"
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
  Eye
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
import WeeklyAvailabilityCalendar from "@/components/WeeklyAvailabilityCalendar"
import App from "@/App"


// Mock data for TAs
let availableTAs = [
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
    availability: [
      "Monday-9-top", "Monday-10-bottom",
      "Wednesday-13-top", "Wednesday-14-bottom",
      "Friday-11-top", "Friday-12-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Partially Allocated",
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
    availability: [
      "Tuesday-10-top", "Tuesday-11-top",
      "Thursday-14-top", "Thursday-14-bottom"
    ],
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
    maxHours: 10,
    currentHours: 10,
    skills: ["JavaScript", "React", "Node.js"],
    experience: ["CS 102", "CS 250"],
    availability: [
      "Monday-9-bottom", "Tuesday-10-top", "Wednesday-15-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Fully Allocated",
  },
  {
    id: 4,
    name: "Abraham Lincoln",
    email: "abraham.lincoln@university.edu",
    studentId: "AL2354021",
    major: "Political Science",
    year: "Undergraduate",
    gpa: "3.80",
    maxHours: 20,
    currentHours: 0,
    skills: ["Canadian Government", "International Law", "European History"],
    experience: ["GOV 101", "LAW 201"],
    availability: [
      "Monday-8-top", "Tuesday-10-top", "Tuesday-10-bottom", "Friday-9-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Not Allocated",
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
        slots: [
          "Monday-9-top",
          "Monday-9-bottom",
          "Wednesday-9-top",
          "Wednesday-9-bottom",
          "Friday-9-top",
          "Friday-9-bottom",
        ],
        weekHours: 3,
        enrollment: 120,
        taRequired: 2,
        taAssigned: 1,
      },
      {
        id: 2,
        type: "Lab",
        section: "L01",
        slots: [
          "Monday-14-top",
          "Monday-14-bottom",
          "Monday-15-top",
          "Monday-15-bottom",
        ],
        weekHours: 2,
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
      },
      {
        id: 3,
        type: "Lab",
        section: "L02",
        slots: [
          "Wednesday-14-top",
          "Wednesday-14-bottom",
          "Wednesday-15-top",
          "Wednesday-15-bottom",
        ],
        weekHours: 2,
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
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
        slots: [
          "Tuesday-11-top",
          "Tuesday-11-bottom",
          "Tuesday-12-top",
          "Thursday-11-top",
          "Thursday-11-bottom",
          "Thursday-12-top",
        ],
        weekHours: 3,
        enrollment: 80,
        taRequired: 2,
        taAssigned: 2,
      },
      {
        id: 5,
        type: "Lab",
        section: "L01",
        slots: [
          "Tuesday-15-top",
          "Tuesday-15-bottom",
          "Tuesday-16-top",
          "Tuesday-16-bottom",
        ],
        weekHours: 2,
        enrollment: 20,
        taRequired: 1,
        taAssigned: 1,
      },
    ],
    totalTARequired: 3,
    totalTAAssigned: 3,
    priority: "Medium",
  },
  {
    id: 3,
    code: "POLI 105",
    name: "Introduction to European Politics",
    instructor: "Dr. Surrey",
    semester: "Fall 2024",
    sections: [
      {
        id: 6,
        type: "Lecture",
        section: "001",
        slots: [
          "Monday-11-top",
          "Monday-11-bottom",
          "Tuesday-11-bottom",
          "Tuesday-11-bottom",
          "Thursday-11-top",
          "Thursday-11-bottom",
        ],
        weekHours: 3,
        enrollment: 80,
        taRequired: 2,
        taAssigned: 0,
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
  const [searchTermForCourse, setSearchTermForCourse] = useState("")
  const [selectedTAId, setSelectedTAId] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [courseFilterStatus, setCourseFilterStatus] = useState("all")
  const [assignments, setAssignments] = useState([])
  const [taList, setTaList] = useState(availableTAs)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState(null)
  const [activeOffers, setActiveOffers] = useState([])


  const selectedTA = taList.find((ta) => ta.id === selectedTAId)


  // Function to store the assignment of a TA to a course
  const handleAssignTA = (selectedTA, selectedCourse) => {
    const alreadyAssigned = assignments.some(
      (a) =>
        a.taStudentId === selectedTA.studentId &&
        a.courseCode === selectedCourse.code &&
        a.section === selectedCourse.section
    )

    if (alreadyAssigned) return

    const newAssignment = {
      taName: selectedTA.name,
      taStudentId: selectedTA.studentId,
      courseCode: selectedCourse.code,
      courseName: selectedCourse.name,
      section: selectedCourse.section,
      instructor: selectedCourse.instructor,
      semester: selectedCourse.semester,
      type: selectedCourse.type,
      time: selectedCourse.time,
    }

    setActiveOffers((prevOffers) => [...prevOffers, newAssignment])
  }

  const handleDeleteAssignment = (assignmentToDelete) => {
    setAssignments((prevAssignments) =>
      prevAssignments.filter(
        (a) =>
          !(
            a.taStudentId === assignmentToDelete.taStudentId &&
            a.courseCode === assignmentToDelete.courseCode &&
            a.section === assignmentToDelete.section
          )
      )
    )
    
    setActiveOffers((prevOffers) =>
    prevOffers.filter(
      (a) =>
        !(
          a.taStudentId === assignmentToDelete.taStudentId &&
          a.courseCode === assignmentToDelete.courseCode &&
          a.section === assignmentToDelete.section
        )
      )
    )

    // Update TA hours and status
    const ta = taList.find((ta) => ta.studentId === assignmentToDelete.taStudentId)
    const course = courses.find((c) => c.code === assignmentToDelete.courseCode)
    const section = course?.sections.find((s) => s.section === assignmentToDelete.section)

    if (ta && section) {
      const updatedTA = {
        ...ta,
        currentHours: Math.max(0, ta.currentHours - section.weekHours),
        status:
          Math.max(0, ta.currentHours - section.weekHours) === 0
            ? "Not Allocated"
            : "Partially Allocated",
      }

      setTaList((prevTAs) =>
        prevTAs.map((t) => (t.id === updatedTA.id ? updatedTA : t))
      )
    }
  }


  //Adding emily to the list of assignments since she is already assigned to a course
  useEffect(() => {
    setAssignments((prevAssignments) => {
      const hasEmily = prevAssignments.some(
        (a) => a.taStudentId === "ER2024003"
      )
      if (hasEmily) return prevAssignments
      
      return [
      ...prevAssignments,
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        courseCode: "CS 201",
        courseName: "Data Structures",
        section: "L01",
        instructor: "Dr. Johnson",
        semester: "Spring 2024",
        type: "Lab",
        time: "T 3:00-5:00",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        courseCode: "CS 201",
        courseName: "Data Structures",
        section: "001",
        instructor: "Dr. Johnson",
        semester: "Spring 2024",
        type: "Lecture",
        time: "TTh 11:00-12:30",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        courseCode: "CS 101",
        courseName: "Introduction to Programming",
        section: "001",
        instructor: "Dr. Smith",
        semester: "Spring 2024",
        type: "Lecture",
        time: "MWF 9:00-10:00",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        courseCode: "CS 101",
        courseName: "Introduction to Programming",
        section: "L01",
        instructor: "Dr. Smith",
        semester: "Spring 2024",
        type: "Lab",
        time: "M 2:00-4:00",
      },
      ]
    })
  }, [])


  // Function to update TA hours after assignment
  const updateHours = (ta, course) => {
    const newHours = ta.currentHours + course.weekHours
    const newStatus = newHours >= ta.maxHours ? "Fully Allocated" : "Partially Allocated"

    const updatedTA = {
      ...ta,
      currentHours: newHours,
      status: newStatus,
    }

    setTaList((prevTAs) =>
      prevTAs.map((t) => (t.id === ta.id ? updatedTA : t))
    )

    setSelectedTAId(ta.id)
  }

  const dayAbbreviations = {
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "Th",
    Friday: "F",
  }

  // Helper: Convert slot string to minute offset
  const slotToMinutes = (slot) => {
    const [day, hour, half] = slot.split("-")
    return parseInt(hour) * 60 + (half === "bottom" ? 30 : 0)
  }

  // Helper: Convert minutes back to HH:MM
  const minutesToTime = (mins) => {
    const hours = Math.floor(mins / 60).toString().padStart(2, "0")
    const minutes = (mins % 60).toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const formatSlots = (slots = []) => {
    if (!slots.length) return "No scheduled time"

    // Group slot keys by day
    const groupedByDay = {}
    for (const slot of slots) {
      const [day, hour, half] = slot.split("-")
      const mins = slotToMinutes(slot)
      if (!groupedByDay[day]) groupedByDay[day] = []
      groupedByDay[day].push(mins)
    }

    // Sort each day's times
    Object.values(groupedByDay).forEach(times => times.sort((a, b) => a - b))

    const days = Object.keys(groupedByDay)
    const dayLabels = days.map(day => dayAbbreviations[day] || day)

    // Check if all days share the same time range
    const allTimeRanges = Object.values(groupedByDay).map(times => {
      return [times[0], times[times.length - 1]]
    })

    const allSameTime =
      allTimeRanges.every(
        ([start, end]) =>
          start === allTimeRanges[0][0] && end === allTimeRanges[0][1]
      )

    if (allSameTime && days.length > 1) {
      // Condensed format: MWF 09:00–12:30
      const [startMins, endMins] = allTimeRanges[0]
      return `${dayLabels.join("")} ${minutesToTime(startMins)}–${minutesToTime(endMins + 30)}`
    }

    // Fallback: day-by-day format
    return days
      .map((day) => {
        const times = groupedByDay[day]
        const start = minutesToTime(times[0])
        const end = minutesToTime(times[times.length - 1] + 30)
        return `${dayAbbreviations[day] || day}: ${start}–${end}`
      })
      .join(" | ")
  }





// Function to get assignments for a specific TA
  function getAssignmentsForTA(taName) {
  return assignments.filter((assignment) => assignment.taName === taName)
  }

  const filteredTAs = taList.filter((ta) => {
    const matchesSearch =
      ta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.experience.some((exp) => exp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.availability.some((day) => day.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.year.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || ta.status.toLowerCase().includes(filterStatus.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const totalTAs = taList.length
  const availableTACount = taList.filter((ta) => ta.status === "Available").length
  const totalCourses = courses.length

  const filteredCourses = courses.filter((course) => {
    
    const matchesSearch =
      course.code.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.semester.toLowerCase().includes(searchTermForCourse.toLowerCase())

    return matchesSearch 
  })
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activePage="Allocations"/>
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
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Main Allocation Interface */}
            <Tabs defaultValue="allocate" className="space-y-4">
              <TabsList>
                <TabsTrigger value="allocate">Allocate TAs</TabsTrigger>
                <TabsTrigger value="active-offers">Active Offers</TabsTrigger>
                <TabsTrigger value="allocated">Allocated TAs</TabsTrigger>

              </TabsList>

              {/* Allocate Tab */}
              <TabsContent value="allocate" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* TA Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select TA</CardTitle>
                      <CardDescription>
                        {selectedTA ? "TA Details" : "Choose a TA to assign to a course section"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {selectedTA ? (
                        // ✅ TA DETAIL VIEW
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={selectedTA.avatar || "/placeholder.svg"} alt={selectedTA.name} />
                              <AvatarFallback>
                                {selectedTA.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-lg font-semibold">{selectedTA.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTA.currentHours}/{selectedTA.maxHours} hours • {selectedTA.major}
                              </p>
                              <p className="text-sm text-muted-foreground">Status: {selectedTA.status}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Email: {selectedTA.email}</p>
                            <p className="text-sm font-medium mb-2">Student ID: {selectedTA.studentId}</p>
                            <p className="text-sm font-medium mb-2">Academic level: {selectedTA.year}</p>
                            <p className="text-sm font-medium mb-2">Major: {selectedTA.major}</p>
                            <p className="text-sm font-medium mb-2">GPA: {selectedTA.gpa}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Experience</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTA.experience.map((experience, index) => (
                                <Badge key={index} variant="outline">
                                  {experience}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTA.skills.map((skill, index) => (
                                <Badge key={index} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div>
                              <h4 className="text-sm font-medium mb-2">Availability</h4>
                              <WeeklyAvailabilityCalendar
                                editable={false}
                                availability={selectedTA.availability}
                              />
                            </div>

                          </div>

                          {/* ✅ Go Back Button */}
                          <Button variant="outline" onClick={() => setSelectedTAId(null)}>
                            ← Go Back
                          </Button>
                        </div>
                      ) : (
                        // ✅ TA LIST VIEW
                        <>
                          {/* ✅ Search Bar */}
                          <input
                            type="text"
                            placeholder="Search TAs by name, email, ID, major, and other details..."
                            className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          
                          <div className="space-y-3">
                            {filteredTAs
                              .filter((ta) => ta.status !== "Fully Allocated")
                              .map((ta) => (
                                <div
                                  key={ta.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedTA?.id === ta.id ? "border-blue-500 bg-blue-50" : "hover:bg-muted/50"
                                  }`}
                                  onClick={() => setSelectedTAId(ta.id)}
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
                                  <div className="flex items-center justify-between">
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {ta.skills.slice(0, 3).map((skill, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <button
                                        //onClick={() =>
                                          //handleViewApplication(application)
                                        //}
                                        //
                                        className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded"
                                      >
                                        Select Applicant <Eye className="h-4 w-4 ml-1" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                            {filteredTAs.filter((ta) => ta.status !== "Fully Allocated").length === 0 && (
                              <p className="text-sm text-muted-foreground text-center">No TAs match your search.</p>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Course Section Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Course Section</CardTitle>
                      <CardDescription>Choose a course section that needs a TA</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* ✅ Search Bar */}
                        <input
                          type="text"
                          placeholder="Search Courses by name, code, instructor, and semester"
                          className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                          value={searchTermForCourse}
                          onChange={(e) => setSearchTermForCourse(e.target.value)}
                        />
                      <div className="space-y-4">
                        {filteredCourses.map((course) => {
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
                                    key={`${course.id}-${section.id}`}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                      selectedCourse?.sectionId === section.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "hover:bg-muted/50"
                                    }`}
                                    onClick={() => setSelectedCourse({
                                      ...section,
                                      name: course.name,
                                      code: course.code,
                                      sectionId: section.id,
                                    })}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {section.type} - Section {section.section}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatSlots(section.slots)} • {section.enrollment} students
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
                              {selectedCourse.code} - {selectedCourse.name} - {selectedCourse.type} Section {selectedCourse.section}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            This will add to their current workload: {selectedTA.currentHours} →{" "}
                            {selectedTA.currentHours + selectedCourse.weekHours} hours
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTAId(null)
                              setSelectedCourse(null)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              // Handle assignment logic here
                              console.log("Assigning", selectedTA.name, "to", selectedCourse)
                              const newHours = selectedTA.currentHours + selectedCourse.weekHours
                              const newStatus = newHours >= selectedTA.maxHours ? "Fully Allocated" : "Partially Allocated"
                              const updatedAvailability = Array.from(
                                new Set([...(selectedTA.availability || []), ...(selectedCourse.slots || [])])
                              )
                              // Merge course time slots into TA availability
                              const updatedTA = {
                                ...selectedTA,
                                currentHours: newHours,
                                status: newStatus,
                                availability: updatedAvailability,
                              }
                              setTaList((prevTAs) =>
                                prevTAs.map((t) => (t.id === updatedTA.id ? updatedTA : t))
                              )
                              handleAssignTA(updatedTA, selectedCourse)

                              // Re-select the updated TA by ID
                              setSelectedTAId(updatedTA.id)
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

              {/* Active Offers Tab */}
              <TabsContent value="active-offers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active TA Offers</CardTitle>
                    <CardDescription>
                      These are the TA assignments that have been sent as offers to the students.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeOffers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">
                        No active offers at the moment.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {activeOffers.map((offer, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">{offer.taName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {offer.courseCode} - {offer.courseName} - Section {offer.section}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Allocated TAs Tab */}
              <TabsContent value="allocated" className="space-y-4">
                {taList.filter(
                (ta) => ta.status === "Fully Allocated" || ta.status === "Partially Allocated")
                .map((ta) => (
                  <Card key={ta.id}>
                    <CardHeader>
                       <CardTitle>{ta.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Current Workload: {ta.currentHours}/{ta.maxHours} hours
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {ta.status}
                      </p>
                    
                      {getAssignmentsForTA(ta.name).map((assignment, idx) => (
                        <div key={`${assignment.taStudentId}-${assignment.courseCode}-${assignment.section}`}>
                          <p className="font-medium mt-2">
                            {assignment.taName} - {assignment.taStudentId}   
                          </p>
                          <p className="text-sm text-muted-foreground">                      
                            {assignment.courseCode} - {assignment.courseName} - {assignment.section}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setAssignmentToDelete(assignment)
                              setShowDeleteModal(true)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ))} 

                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {showDeleteModal && assignmentToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                    <p className="text-sm mb-6">
                      Are you sure you want to delete the assignment of{" "}
                      <strong>{assignmentToDelete.taName}</strong> to{" "}
                      <strong>
                        {assignmentToDelete.courseCode} - {assignmentToDelete.section}
                      </strong>?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteModal(false)
                          setAssignmentToDelete(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDeleteAssignment(assignmentToDelete)
                          setShowDeleteModal(false)
                          setAssignmentToDelete(null)
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
