import { useState, useEffect } from "react"
import { Bell, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/scheduler-sidebar"
import { CourseCard } from "@/components/scheduler/course_management/course-card"
import { CourseFilters } from "@/components/scheduler/course_management/course-filters"
import { EmptyState } from "@/components/scheduler/course_management/empty-state"
import { AddCourseModal } from "@/components/scheduler/course_management/add-course-modal"
import { EditCourseModal } from "@/components/scheduler/course_management/edit-course-modal"
import { AddOfferingModal } from "@/components/scheduler/course_management/add-offering-modal"
import { EditOfferingModal } from "@/components/scheduler/course_management/edit-offering-modal"
import { AddLabTutorialModal } from "@/components/scheduler/course_management/add-lab-tutorial-modal"

// Import API functions
import {
  getAllCoursesFullDetails,
  createCourse,
  updateCourse,
  deleteCourse,
  createCourseOffering,
  updateCourseOffering,
  deleteCourseOffering,
  createSharedSession,
  getTerms,
  getDepartments,
  getInstructors,
  mapCourseData,
  mapTermsForDropdown,
  mapInstructorsForDropdown
} from "@/logic/courseManagement"

export default function CourseManagement() {
  // State for courses and UI
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [expandedCourses, setExpandedCourses] = useState(new Set())
  const [expandedOfferings, setExpandedOfferings] = useState(new Set())
  const [expandedLabSections, setExpandedLabSections] = useState(new Set())
  
  // Data state
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [terms, setTerms] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddOfferingModalOpen, setIsAddOfferingModalOpen] = useState(false)
  const [isEditOfferingModalOpen, setIsEditOfferingModalOpen] = useState(false)
  const [isAddLabTutorialModalOpen, setIsAddLabTutorialModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedOffering, setSelectedOffering] = useState(null)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load all required data in parallel
        const [coursesData, departmentsData, termsData, instructorsData] = await Promise.all([
          getAllCoursesFullDetails(),
          getDepartments(),
          getTerms(),
          getInstructors()
        ])

        // Map data to frontend format - pass instructors to resolve names
        const mappedInstructors = mapInstructorsForDropdown(instructorsData, departmentsData)
        const mappedCourses = coursesData.map(course => mapCourseData(course, instructorsData)) // Pass instructors here
        const mappedTerms = mapTermsForDropdown(termsData)

        setCourses(mappedCourses)
        setDepartments(departmentsData)
        setTerms(mappedTerms)
        setInstructors(mappedInstructors)
      } catch (err) {
        console.error("Failed to load course management data:", err)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Toggle functions
  const toggleCourse = (courseId) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      return next
    })
  }

  const toggleOffering = (offeringId) => {
    setExpandedOfferings((prev) => {
      const next = new Set(prev)
      if (next.has(offeringId)) {
        next.delete(offeringId)
      } else {
        next.add(offeringId)
      }
      return next
    })
  }

  const toggleLabSection = (sectionId) => {
    setExpandedLabSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Course management functions
  const handleAddCourse = () => {
    setIsAddModalOpen(true)
  }

  const handleAddCourseSubmit = async (newCourseData) => {
    try {
      const createdCourse = await createCourse(newCourseData)
      
      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))
      
      console.log("Course added:", createdCourse)
    } catch (error) {
      console.error("Error adding course:", error)
      setError("Failed to add course. Please try again.")
    }
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleEditCourse = (course) => {
    setSelectedCourse(course)
    setIsEditModalOpen(true)
  }

  const handleEditCourseSubmit = async (updatedCourseData) => {
    try {
      await updateCourse(selectedCourse.id, updatedCourseData)
      
      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))
      
      console.log("Course updated:", updatedCourseData)
    } catch (error) {
      console.error("Error updating course:", error)
      setError("Failed to update course. Please try again.")
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCourse(null)
  }

  // Course offering functions
  const handleAddOffering = (course) => {
    setSelectedCourse(course)
    setIsAddOfferingModalOpen(true)
  }

  const handleAddOfferingSubmit = async (courseId, newOfferingData) => {
    try {
      console.log("Adding offering with data:", newOfferingData)
      
      await createCourseOffering(newOfferingData)
      
      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))
      
      console.log("Offering added successfully")
    } catch (error) {
      console.error("Error adding offering:", error)
      setError("Failed to add offering. Please try again.")
    }
  }
  

  const handleCloseAddOfferingModal = () => {
    setIsAddOfferingModalOpen(false)
    setSelectedCourse(null)
  }

  const handleEditOffering = (offering) => {
    setSelectedOffering(offering)
    setSelectedCourse(courses.find((course) => course.offerings.some((o) => o.id === offering.id)))
    setIsEditOfferingModalOpen(true)
  }

  const handleEditOfferingSubmit = async (courseId, updatedOfferingData) => {
    try {
      console.log("Updating offering with data:", updatedOfferingData)
      
      await updateCourseOffering(updatedOfferingData.id, updatedOfferingData)
      
      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))
      
      console.log("Offering updated successfully")
    } catch (error) {
      console.error("Error updating offering:", error)
      setError("Failed to update offering. Please try again.")
    }
  }

  const handleCloseEditOfferingModal = () => {
    setIsEditOfferingModalOpen(false)
    setSelectedOffering(null)
    setSelectedCourse(null)
  }

  // Lab/Tutorial functions
  const handleAddLabTutorial = (course) => {
    setSelectedCourse(course)
    setSelectedOffering(null)
    setIsAddLabTutorialModalOpen(true)
  }

  const handleAddLabTutorialSubmit = async (courseId, term, year, sessionType, newSessionData) => {
    try {
      // Find the term ID from the term code
      const selectedTerm = terms.find(t => t.value === term && t.year.toString() === year)
      
      const sessionData = {
        sessionType: sessionType,
        courseId: courseId,
        section: newSessionData.section,
        termId: selectedTerm?.id,
        studentId: null, // No TA assigned initially
        timeSlots: [] // Time slots will be handled separately
      }

      await createSharedSession(sessionData)
      
      // Reload the courses to get the updated data
      const updatedCourses = await getAllCoursesFullDetails()
      setCourses(updatedCourses.map(mapCourseData))
      
      console.log("Lab/Tutorial session added:", newSessionData)
    } catch (error) {
      console.error("Error adding lab/tutorial session:", error)
      setError("Failed to add session. Please try again.")
    }
  }

  const handleCloseAddLabTutorialModal = () => {
    setIsAddLabTutorialModalOpen(false)
    setSelectedOffering(null)
    setSelectedCourse(null)
  }

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await deleteCourse(courseId)
        setCourses(courses.filter((course) => course.id !== courseId))
        console.log("Course deleted:", courseId)
      } catch (error) {
        console.error("Error deleting course:", error)
        setError("Failed to delete course. Please try again.")
      }
    }
  }

  // Filter courses based on search and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || course.department === selectedDepartment
    const matchesYear = selectedYear === "all" || course.offerings.some((offering) => offering.year === selectedYear)

    return matchesSearch && matchesDepartment && matchesYear
  })

  // Get unique department names and years from data
  const departmentNames = [...new Set(courses.map(course => course.department))].sort()
  const years = [...new Set(courses.flatMap(course => course.offerings.map(offering => offering.year)))].sort()

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Course Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleAddCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-4 md:p-8">
          {/* Header Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Course Management</h1>
              <p className="text-muted-foreground">Manage courses, offerings, and associated lab/tutorial sessions</p>
            </div>

            {/* Filters and Search */}
            <CourseFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              departments={departmentNames}
              years={years}
            />
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              // Calculate visible offerings count based on current filters
              const visibleOfferingsCount = course.offerings.filter((offering) => {
                const matchesYear = selectedYear === "all" || offering.year === selectedYear
                return matchesYear
              }).length

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  isExpanded={expandedCourses.has(course.id)}
                  onToggle={() => toggleCourse(course.id)}
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteCourse}
                  onAddOffering={handleAddOffering}
                  onEditOffering={handleEditOffering}
                  onAddLabTutorial={handleAddLabTutorial}
                  expandedOfferings={expandedOfferings}
                  expandedLabSections={expandedLabSections}
                  onToggleOffering={toggleOffering}
                  onToggleLabSection={toggleLabSection}
                  visibleOfferingsCount={visibleOfferingsCount}
                />
              )
            })}
          </div>

          {filteredCourses.length === 0 && <EmptyState onAddCourse={handleAddCourse} />}
        </main>
      </SidebarInset>

      {/* Modals */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAddCourse={handleAddCourseSubmit}
        existingCourses={courses}
        departments={departments}
      />

      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onEditCourse={handleEditCourseSubmit}
        course={selectedCourse}
        existingCourses={courses}
        departments={departments}
      />

      <AddOfferingModal
        isOpen={isAddOfferingModalOpen}
        onClose={handleCloseAddOfferingModal}
        onAddOffering={handleAddOfferingSubmit}
        course={selectedCourse}
        existingOfferings={selectedCourse?.offerings || []}
        terms={terms}
        instructors={instructors}
      />

      <EditOfferingModal
        isOpen={isEditOfferingModalOpen}
        onClose={handleCloseEditOfferingModal}
        onEditOffering={handleEditOfferingSubmit}
        course={selectedCourse}
        offering={selectedOffering}
        existingOfferings={selectedCourse?.offerings || []}
        terms={terms}
        instructors={instructors}
      />

      <AddLabTutorialModal
        isOpen={isAddLabTutorialModalOpen}
        onClose={handleCloseAddLabTutorialModal}
        onAddSession={handleAddLabTutorialSubmit}
        course={selectedCourse}
        offering={selectedOffering}
        existingSessions={
          selectedCourse && selectedOffering
            ? selectedCourse.sharedSessions[`${selectedOffering.term}-${selectedOffering.year}`] || {
                labs: [],
                tutorials: [],
              }
            : { labs: [], tutorials: [] }
        }
        terms={terms}
      />
    </SidebarProvider>
  )
}
