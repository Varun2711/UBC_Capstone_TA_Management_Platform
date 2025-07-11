"use client"

import { useState } from "react"
import { Bell, FileText, Plus, Check, Clock, AlertCircle, BookOpen, Users, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar"
import { mockInstructorCourses } from "../../data/mock-instructor-courses"
import { TARequirementsModal } from "@/components/instructor/ta-requirements-modal"

export default function InstructorTARequirements() {
  const [courses, setCourses] = useState(mockInstructorCourses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleSubmitRequirements = (course) => {
    setSelectedCourse(course)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditRequirements = (course) => {
    setSelectedCourse(course)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
    setIsEditing(false)
  }

  const handleRequirementsSubmit = (courseId, requirements) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              hasSubmittedRequirements: true,
              submittedAt: new Date().toISOString(),
              requirements: {
                generalRequirements: requirements,
              },
            }
          : course,
      ),
    )
    console.log("Requirements submitted for course:", courseId, requirements)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    totalCourses: courses.length,
    submittedRequirements: courses.filter((course) => course.hasSubmittedRequirements).length,
    pendingRequirements: courses.filter((course) => !course.hasSubmittedRequirements).length,
  }

  return (
    <SidebarProvider>
      <InstructorSidebar activePage="TA Requests" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>TA Requirements</BreadcrumbPage>
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
          {/* Header Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">TA Requirements</h1>
              <p className="text-muted-foreground">
                Submit and manage TA requirements for your assigned course offerings
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <p className="text-xs text-muted-foreground">Assigned to you</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requirements Submitted</CardTitle>
                  <Check className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.submittedRequirements}</div>
                  <p className="text-xs text-muted-foreground">Complete submissions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingRequirements}</div>
                  <p className="text-xs text-muted-foreground">Awaiting requirements</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course Offerings List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Course Offerings</h2>

            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">
                            {course.courseCode} - {course.section}
                          </CardTitle>
                          <CardDescription className="text-sm">{course.courseTitle}</CardDescription>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {course.term} {course.year}
                      </Badge>
                      
                      {course.hasSubmittedRequirements ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {course.hasSubmittedRequirements ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Submitted on: {formatDate(course.submittedAt)}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditRequirements(course)}>
                          Edit Requirements
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Current Requirements:</h4>
                        <ul className="space-y-1">
                          {course.requirements.generalRequirements.map((req, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-900">TA Requirements Needed</p>
                          <p className="text-sm text-orange-700">
                            Please submit your TA requirements for this course offering.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSubmitRequirements(course)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Requirements
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {courses.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Course Offerings</h3>
                <p className="text-muted-foreground">You don't have any assigned course offerings at the moment.</p>
              </CardContent>
            </Card>
          )}
        </main>

        {/* TA Requirements Modal */}
        <TARequirementsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleRequirementsSubmit}
          course={selectedCourse}
          isEditing={isEditing}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
