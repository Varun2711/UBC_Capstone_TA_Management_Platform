"use client"

import { useState } from "react"
import { Bell, Users, BookOpen, Calendar, MessageSquare, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InstructorSidebar } from "../components/instructor-dashboard-sidebar"

export default function InstructorDashboard() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [requestItem, setRequestItem] = useState("")
  const [selectedRequestCourse, setSelectedRequestCourse] = useState("")

  // Mock data - to be replaced with actual API calls
  const instructor = {
    name: "Ronnie Smith",
    role: "Instructor",
  }

  const courses = [
    {
      id: 1,
      code: "COSC 101",
      name: "Digital Citizenship",
      tas: ["Alice Johnson", "Bob Wilson"],
      status: "active",
    },
    {
      id: 2,
      code: "COSC 221",
      name: "Discrete Structures",
      tas: ["Harry Potter", "Virat Kohli", "Cristiano Ronaldo"],
      status: "active",
    },
    {
      id: 3,
      code: "DATA 101",
      name: "Mining procedures with data",
      tas: ["Emma Davis", "Michael Brown"],
      status: "active",
    },
  ]

  const scheduleData = [
    {
      time: "8:00 AM",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    {
      time: "9:00 AM",
      monday: "COSC 221 - DH1 LAB 01\nHarry Potter",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    {
      time: "10:00 AM",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    {
      time: "11:00 AM",
      monday: "",
      tuesday: "COSC 221 - 001\nLECTURE\nCristiano Ronaldo",
      wednesday: "",
      thursday: "COSC 221 - 001 LECTURE\nVirat Kohli",
      friday: "",
    },
    {
      time: "12:00 PM",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    {
      time: "1:00 PM",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
  ]

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    console.log("TA qualifications request submitted:", { course: selectedRequestCourse, qualifications: requestItem })
    setRequestItem("")
    setSelectedRequestCourse("")
    alert("TA qualification preferences submitted successfully!")
  }

  const stats = [
    {
      title: "Active Courses",
      value: "3",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Total TAs",
      value: "7",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "This Week's Classes",
      value: "12",
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Pending Requests",
      value: "2",
      icon: MessageSquare,
      color: "text-orange-600",
    },
  ]

  return (
    <SidebarProvider>
      <InstructorSidebar activePage="Dashboard" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Dashboard"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {!selectedCourse ? (
            /* Dashboard Overview */
            <>
              {/* Welcome Section */}
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{instructor.name}</h1>
                <p className="text-muted-foreground">{instructor.role}</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    The TAs for your courses have not been assigned yet. Please wait, or contact Chad for more details.
                  </p>

                  {/* View Assigned Courses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">View Assigned Courses</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {courses.map((course) => (
                        <Card
                          key={course.id}
                          className={`cursor-pointer transition-all hover:shadow-md`}
                          onClick={() => handleCourseSelect(course)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{course.code}</CardTitle>
                            <CardDescription className="text-sm">{course.name}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              className={`w-full bg-gray-600 hover:bg-gray-700`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCourseSelect(course)
                              }}
                            >
                              View Assigned TAs
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Course Specific Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Request TA Preferred Qualifications</CardTitle>
                  <CardDescription>Submit a request for course-specific preferred qualifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="course-select" className="text-sm font-medium">
                        Select the course you wish to specify preferred qualifications for: *
                      </Label>
                      <select
                        id="course-select"
                        value={selectedRequestCourse}
                        onChange={(e) => setSelectedRequestCourse(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Select an option</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.code}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="request-input" className="text-sm font-medium">
                        Enter your request: *
                      </Label>
                      <Input
                        id="request-input"
                        type="text"
                        value={requestItem}
                        onChange={(e) => setRequestItem(e.target.value)}
                        className="mt-1"
                        placeholder="e.g., Experience with Unity, JavaScript proficiency, etc."
                        required
                      />
                    </div>

                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Course Detail View */
            <>
              {/* Back Navigation */}
              <div className="flex items-center space-x-2">
                <Button onClick={handleBackToCourses} variant="ghost" className="text-blue-600 hover:text-blue-700 p-0">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Courses
                </Button>
              </div>

              {/* Course Title */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.code}</h2>
                <p className="text-muted-foreground">{selectedCourse.name}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Assigned TAs */}
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <CardTitle>Assigned TAs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {selectedCourse.tas.map((ta, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-gray-800 rounded-full mr-3"></div>
                          <span className="font-medium">{ta}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total TAs:</span>
                      <Badge variant="secondary">{selectedCourse.tas.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Hours:</span>
                      <span className="text-sm font-medium">15 hrs</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lab and Schedule Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Lab and Schedule Details</CardTitle>
                  <CardDescription>Weekly schedule for {selectedCourse.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Time</TableHead>
                          <TableHead className="text-center">Monday</TableHead>
                          <TableHead className="text-center">Tuesday</TableHead>
                          <TableHead className="text-center">Wednesday</TableHead>
                          <TableHead className="text-center">Thursday</TableHead>
                          <TableHead className="text-center">Friday</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduleData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium bg-gray-50">{row.time}</TableCell>
                            <TableCell className="text-center text-sm">
                              {row.monday && (
                                <div className="whitespace-pre-line text-gray-900 p-2 bg-blue-50 rounded">
                                  {row.monday}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.tuesday && (
                                <div className="whitespace-pre-line text-gray-900 p-2 bg-green-50 rounded">
                                  {row.tuesday}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.wednesday && (
                                <div className="whitespace-pre-line text-gray-900 p-2 bg-purple-50 rounded">
                                  {row.wednesday}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.thursday && (
                                <div className="whitespace-pre-line text-gray-900 p-2 bg-yellow-50 rounded">
                                  {row.thursday}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.friday && (
                                <div className="whitespace-pre-line text-gray-900 p-2 bg-red-50 rounded">
                                  {row.friday}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
