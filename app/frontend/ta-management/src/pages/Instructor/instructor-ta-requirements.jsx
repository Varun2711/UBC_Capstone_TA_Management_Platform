"use client"

import { useState, useMemo, useEffect } from "react"
import { Bell, FileText, Plus, Check, Clock, AlertCircle, BookOpen, Users, Calendar, Search, Filter, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar"
import { TARequirementsModal } from "@/components/instructor/ta-requirements-modal"
import { 
  getInstructorCourseOfferings,
  submitTARequirements,
  updateTARequirements
} from "../../logic/instructor-ta-requirements"

export default function InstructorTARequirements() {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Load courses on component mount
  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const courseData = await getInstructorCourseOfferings()
      setCourses(courseData)
    } catch (err) {
      console.error('Error loading courses:', err)
      setError('Failed to load course offerings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleRequirementsSubmit = async (courseId, requirements) => {
    try {
      setIsSubmitting(true)
      
      const course = courses.find(c => c.id === courseId)
      
      if (isEditing && course.requestId) {
        // Update existing requirements
        await updateTARequirements(course.requestId, courseId, requirements)
      } else {
        // Submit new requirements
        await submitTARequirements(courseId, requirements)
      }
      
      // Reload courses to get updated data
      await loadCourses()
      
      console.log("Requirements submitted successfully for course:", courseId)
    } catch (err) {
      console.error("Error submitting requirements:", err)
      setError('Failed to submit requirements. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedYear("all")
    setSelectedTerm("all")
    setSelectedStatus("all")
  }

  // Get unique years and terms for filter options
  const { years, terms } = useMemo(() => {
    const yearsSet = new Set(courses.map(course => course.year))
    const termsSet = new Set(courses.map(course => course.term))
    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      terms: Array.from(termsSet).sort()
    }
  }, [courses])

  // Filter courses based on all filter criteria
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Search query filter (course code, title, or section)
      const matchesSearch = searchQuery === "" || 
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.section.toLowerCase().includes(searchQuery.toLowerCase())

      // Year filter
      const matchesYear = selectedYear === "all" || course.year.toString() === selectedYear

      // Term filter
      const matchesTerm = selectedTerm === "all" || course.term === selectedTerm

      // Status filter
      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "submitted" && course.hasSubmittedRequirements) ||
        (selectedStatus === "pending" && !course.hasSubmittedRequirements)

      return matchesSearch && matchesYear && matchesTerm && matchesStatus
    })
  }, [courses, searchQuery, selectedYear, selectedTerm, selectedStatus])

  // Calculate stats based on filtered courses
  const stats = {
    totalCourses: filteredCourses.length,
    submittedRequirements: filteredCourses.filter((course) => course.hasSubmittedRequirements).length,
    pendingRequirements: filteredCourses.filter((course) => !course.hasSubmittedRequirements).length,
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || selectedYear !== "all" || selectedTerm !== "all" || selectedStatus !== "all"

  if (isLoading) {
    return (
      <SidebarProvider>
        <InstructorSidebar activePage="TA Requirements" />
        <SidebarInset>
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
          </header>
          
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading course offerings...</span>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <InstructorSidebar activePage="TA Requirements" />
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
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="outline" size="sm" onClick={loadCourses}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
                  <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? "Filtered results" : "Assigned to you"}
                  </p>
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

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Course code, title, or section..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Year Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Term Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      {terms.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredCourses.length} of {courses.length} courses
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Offerings List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Course Offerings</h2>

            {filteredCourses.map((course) => (
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

          {/* Empty State - No Courses */}
          {courses.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Course Offerings</h3>
                <p className="text-muted-foreground">You don't have any assigned course offerings at the moment.</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State - No Filtered Results */}
          {courses.length > 0 && filteredCourses.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses Found</h3>
                <p className="text-muted-foreground mb-4">
                  No courses match your current filter criteria.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
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
          isSubmitting={isSubmitting}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
