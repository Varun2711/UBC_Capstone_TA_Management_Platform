"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, Plus, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"

import { AdminSidebar } from "@/components/admin-dashboard-sidebar"
import { CourseFilters } from "@/components/scheduler/course_management/course-filters"
import { CourseCard } from "@/components/scheduler/course_management/course-card"
import { EmptyState } from "@/components/scheduler/course_management/empty-state"
import { AddCourseModal } from "@/components/scheduler/course_management/add-course-modal"
import { EditCourseModal } from "@/components/scheduler/course_management/edit-course-modal"
import { AddOfferingModal } from "@/components/scheduler/course_management/add-offering-modal"
import { EditOfferingModal } from "@/components/scheduler/course_management/edit-offering-modal"
import { AddLabTutorialModal } from "@/components/scheduler/course_management/add-lab-tutorial-modal"
import { EditSessionModal } from "@/components/scheduler/course_management/edit-session-modal"

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
  updateSharedSession,
  deleteSharedSession,
  getActiveTerms,
  getDepartments,
  getInstructors,
  mapCourseData,
  mapTermsForDropdown,
  mapInstructorsForDropdown,
  parseTermCode
} from "@/logic/courseManagement"

export default function AdminCourseManagement() {
  // State for courses and UI
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState("all")
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
  const [isEditSharedSessionModalOpen, setIsEditSharedSessionModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedOffering, setSelectedOffering] = useState(null)
  const [selectedSharedSession, setSelectedSharedSession] = useState(null)
  const [selectedSessionType, setSelectedSessionType] = useState(null)
  const [selectedTermKey, setSelectedTermKey] = useState(null)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load all required data in parallel - USE ACTIVE TERMS ONLY
        const [coursesData, departmentsData, termsData, instructorsData] = await Promise.all([
          getAllCoursesFullDetails(),
          getDepartments(),
          getActiveTerms(), // Changed from getTerms() to getActiveTerms()
          getInstructors()
        ])

        // Map data to frontend format - pass instructors to resolve names
        const mappedInstructors = mapInstructorsForDropdown(instructorsData, departmentsData)
        const mappedCourses = coursesData.map(course => mapCourseData(course, instructorsData))
        const mappedTerms = mapTermsForDropdown(termsData)

        setCourses(mappedCourses)
        setDepartments(departmentsData)
        setTerms(mappedTerms)
        setInstructors(mappedInstructors)
      } catch (err) {
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

    } catch (error) {
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

    } catch (error) {
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
      await createCourseOffering(newOfferingData)

      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))

    } catch (error) {
      setError("Failed to add offering. Please try again.")
    }
  }

  const handleCloseAddOfferingModal = () => {
    setIsAddOfferingModalOpen(false)
    setSelectedCourse(null)
  }

  const handleEditOffering = (offering) => {
    try {
      // Find the course that contains this offering
      const parentCourse = courses.find((course) => 
        course.offerings && course.offerings.some((o) => o.id === offering.id)
      )
      
      if (!parentCourse) {
        setError("Could not find the course for this offering.")
        return
      }
      
      setSelectedOffering(offering)
      setSelectedCourse(parentCourse)
      setIsEditOfferingModalOpen(true)
    } catch (error) {
      setError("Failed to open edit offering dialog.")
    }
  }

  const handleDeleteOffering = async (offering) => {
    if (window.confirm(`Are you sure you want to delete Section ${offering.section}? This action cannot be undone.`)) {
      try {
        await deleteCourseOffering(offering.id)

        // Reload the courses to get the updated data
        const [updatedCourses, instructorsData] = await Promise.all([
          getAllCoursesFullDetails(),
          getInstructors()
        ])
        setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))

      } catch (error) {
        setError("Failed to delete offering. Please try again.")
      }
    }
  }

  const handleEditOfferingSubmit = async (courseId, updatedOfferingData) => {
    try {
      await updateCourseOffering(updatedOfferingData.id, updatedOfferingData)

      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))

      // Close the modal and clear selections
      setIsEditOfferingModalOpen(false)
      setSelectedOffering(null)
      setSelectedCourse(null)
    } catch (error) {
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
      // Find the term ID from the term code FIRST
      const selectedTerm = terms.find(t => t.value === term && t.year.toString() === year)

      const sessionData = {
        sessionType: sessionType,
        courseId: courseId,
        section: newSessionData.section,
        termId: selectedTerm?.id || newSessionData.termId,
        studentId: null, // No TA assigned initially
        timeSlots: newSessionData.timeSlots || [] // Include time slots
      }

      const createdSession = await createSharedSession(sessionData)

      // Reload the courses to get the updated data
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      
      // Find the specific course that was updated
      const updatedCourse = updatedCourses.find(course => course.id === courseId);
      
      const mappedCourses = updatedCourses.map(course => mapCourseData(course, instructorsData))
      setCourses(mappedCourses)

    } catch (error) {
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

        // Reload the courses to get the updated data
        const [updatedCourses, instructorsData] = await Promise.all([
          getAllCoursesFullDetails(),
          getInstructors()
        ])
        setCourses(updatedCourses.map(course => mapCourseData(course, instructorsData)))

      } catch (error) {
        setError("Failed to delete course. Please try again.")
      }
    }
  }

  // Add edit shared session handler
  const handleEditSharedSession = (session, sessionType, termKey) => {
    setSelectedSharedSession(session)
    setSelectedSessionType(sessionType)
    setSelectedTermKey(termKey)
    
    // Find the course that contains this shared session
    const foundCourse = courses.find(course => {
      if (course.sharedSessions && course.sharedSessions[termKey]) {
        const sessionsInTerm = course.sharedSessions[termKey]
        const sessionTypePlural = sessionType === 'lab' ? 'labs' : 'tutorials'
        
        if (sessionsInTerm[sessionTypePlural]) {
          return sessionsInTerm[sessionTypePlural].some(s => s.id === session.id)
        }
      }
      return false
    })
    
    setSelectedCourse(foundCourse)
    setIsEditSharedSessionModalOpen(true)
  }

  // Add edit shared session submit handler
  const handleEditSharedSessionSubmit = async (sessionId, updatedSessionData) => {
    try {
      await updateSharedSession(sessionId, updatedSessionData)

      // Reload courses
      const [updatedCourses, instructorsData] = await Promise.all([
        getAllCoursesFullDetails(),
        getInstructors()
      ])
      
      const mappedCourses = updatedCourses.map(course => mapCourseData(course, instructorsData))
      setCourses(mappedCourses)

    } catch (error) {
      setError("Failed to update session. Please try again.")
    }
  }

  // Add delete shared session handler
  const handleDeleteSharedSession = async (session, sessionType, termKey) => {
    const sessionTypeLabel = sessionType === 'lab' ? 'laboratory' : 'tutorial'
    
    if (window.confirm(`Are you sure you want to delete ${sessionTypeLabel} section ${session.section}? This action cannot be undone.`)) {
      try {
        await deleteSharedSession(session.id)

        // Reload courses
        const [updatedCourses, instructorsData] = await Promise.all([
          getAllCoursesFullDetails(),
          getInstructors()
        ])
        
        const mappedCourses = updatedCourses.map(course => mapCourseData(course, instructorsData))
        setCourses(mappedCourses)

      } catch (error) {
        setError("Failed to delete session. Please try again.")
      }
    }
  }

  // close handler for edit modal
  const handleCloseEditSharedSessionModal = () => {
    setIsEditSharedSessionModalOpen(false)
    setSelectedSharedSession(null)
    setSelectedSessionType(null)
    setSelectedTermKey(null)
    setSelectedCourse(null)
  }

  // Filter courses based on search and filters AND filter course content
  const filteredCourses = courses.filter((course) => {
    // Search filter
    const matchesSearch = !searchQuery || (
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Department filter
    const matchesDepartment = selectedDepartment === "all" || course.department === selectedDepartment

    // Year filter
    const matchesYear = selectedYear === "all" || (() => {
      // Check offerings for the year
      const hasOfferingForYear = course.offerings?.some(offering => 
        String(offering.year) === String(selectedYear)
      ) || false

      // Check shared sessions for the year
      const hasSharedSessionForYear = Object.keys(course.sharedSessions || {}).some(termKey => {
        const termMatch = termKey.match(/^([A-Z])(\d{4})\s+(.+)$/)
        return termMatch && termMatch[2] === String(selectedYear)
      }) || false
    
      return hasOfferingForYear || hasSharedSessionForYear
    })()

    // Term filter - FIXED using parseTermCode
    const matchesTerm = selectedTerm === "all" || (() => {
      // Helper function to format term for comparison using parseTermCode
      const formatTermForComparison = (termCode) => {
        const parsedTerm = parseTermCode(termCode)
        if (!parsedTerm) {
          return null
        }
        
        let formattedTerm = ""
        if (parsedTerm.term === 'Both') {
          formattedTerm = `${parsedTerm.season} Both Terms`
        } else {
          formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`
        }
        
        return formattedTerm
      }

      // Check offerings for the term
      const hasOfferingForTerm = course.offerings?.some(offering => {
        const formattedOfferingTerm = formatTermForComparison(offering.term)
        const matches = formattedOfferingTerm === selectedTerm
        return matches
      }) || false

      // Check shared sessions for the term
      const hasSharedSessionForTerm = Object.keys(course.sharedSessions || {}).some(termKey => {
        const formattedSessionTerm = formatTermForComparison(termKey)
        const matches = formattedSessionTerm === selectedTerm
        return matches
      }) || false
    
      const finalResult = hasOfferingForTerm || hasSharedSessionForTerm
      
      return finalResult
    })()

    const finalResult = matchesSearch && matchesDepartment && matchesYear && matchesTerm

    return finalResult
  }).map((course) => {
    // FILTER COURSE CONTENT based on selected filters
    const filteredCourse = { ...course }

    // Filter offerings based on year and term
    if (selectedYear !== "all" || selectedTerm !== "all") {
      filteredCourse.offerings = course.offerings?.filter((offering) => {
        const matchesYear = selectedYear === "all" || String(offering.year) === String(selectedYear)
        
        const matchesTerm = selectedTerm === "all" || (() => {
          const parsedTerm = parseTermCode(offering.term)
          if (!parsedTerm) return false
          
          let formattedTerm = ""
          if (parsedTerm.term === 'Both') {
            formattedTerm = `${parsedTerm.season} Both Terms`
          } else {
            formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`
          }
          
          return formattedTerm === selectedTerm
        })()
        
        return matchesYear && matchesTerm
      }) || []
    }

    // Filter shared sessions based on year and term
    if (selectedYear !== "all" || selectedTerm !== "all") {
      const filteredSharedSessions = {}
      
      Object.keys(course.sharedSessions || {}).forEach((termKey) => {
        const termMatch = termKey.match(/^([A-Z])(\d{4})\s+(.+)$/)
        let includeThisTerm = true
        
        // Check year filter
        if (selectedYear !== "all" && termMatch) {
          includeThisTerm = termMatch[2] === String(selectedYear)
        }
        
        // Check term filter
        if (selectedTerm !== "all" && includeThisTerm) {
          const parsedTerm = parseTermCode(termKey)
          if (parsedTerm) {
            let formattedTerm = ""
            if (parsedTerm.term === 'Both') {
              formattedTerm = `${parsedTerm.season} Both Terms`
            } else {
              formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`
            }
            includeThisTerm = formattedTerm === selectedTerm
          } else {
            includeThisTerm = false
          }
        }
        
        if (includeThisTerm) {
          filteredSharedSessions[termKey] = course.sharedSessions[termKey]
        }
      })
      
      filteredCourse.sharedSessions = filteredSharedSessions
    }

    return filteredCourse
  })

  // Get unique department names and years from data
  const departmentNames = [...new Set(courses.map(course => course.department))].sort()
  
  // Update the years calculation to use parseTermCode:
  const years = (() => {
    const yearSet = new Set()
    
    // Add years from offerings
    courses.forEach(course => {
      course.offerings?.forEach(offering => {
        if (offering.year) {
          yearSet.add(String(offering.year))
        }
      })
      
      // Add years from shared sessions using parseTermCode
      if (course.sharedSessions) {
        Object.keys(course.sharedSessions).forEach(termKey => {
          const parsedTerm = parseTermCode(termKey)
          if (parsedTerm && parsedTerm.year) {
            yearSet.add(String(parsedTerm.year))
          }
        })
      }
    })
    
    const finalYears = Array.from(yearSet).sort((a, b) => parseInt(a) - parseInt(b))
    
    return finalYears
  })()

  // Extract unique terms for the term filter
  const uniqueTerms = useMemo(() => {
    const termSet = new Set()
    
    // Helper function to format terms consistently using parseTermCode
    const formatTermForDisplay = (termCode) => {
      const parsedTerm = parseTermCode(termCode)
      if (!parsedTerm) {
        return null
      }
      
      // Format consistently
      let formattedTerm = ""
      if (parsedTerm.term === 'Both') {
        formattedTerm = `${parsedTerm.season} Both Terms`
      } else {
        formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`
      }
      
      return formattedTerm
    }
    
    courses.forEach(course => {
      // Add terms from offerings
      course.offerings?.forEach(offering => {
        const formattedTerm = formatTermForDisplay(offering.term)
        if (formattedTerm) {
          termSet.add(formattedTerm)
        }
      })
      
      // Add terms from shared sessions
      Object.keys(course.sharedSessions || {}).forEach(termKey => {
        const formattedTerm = formatTermForDisplay(termKey)
        if (formattedTerm) {
          termSet.add(formattedTerm)
        }
      })
    })
    
    const sortedTerms = Array.from(termSet).sort()
    return sortedTerms
  }, [courses])

  if (loading) {
    return (
      <SidebarProvider>
        <AdminSidebar />
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
        <AdminSidebar activePage={"Course Management"} />
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
      <AdminSidebar activePage={"Course Management"}/>
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
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
              departments={departmentNames}
              years={years}
              terms={uniqueTerms}
            />
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              // Calculate visible offerings count based on current filters (FIXED)
              const visibleOfferingsCount = course.offerings.filter((offering) => {
                const matchesYear = selectedYear === "all" || String(offering.year) === String(selectedYear)
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
                  onDeleteOffering={handleDeleteOffering}
                  onAddLabTutorial={handleAddLabTutorial}
                  onEditSharedSession={handleEditSharedSession}
                  onDeleteSharedSession={handleDeleteSharedSession}
                  expandedOfferings={expandedOfferings}
                  expandedLabSections={expandedLabSections}
                  onToggleOffering={toggleOffering}
                  onToggleLabSection={toggleLabSection}
                  visibleOfferingsCount={visibleOfferingsCount}
                  selectedYear={selectedYear}
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
          selectedCourse?.sharedSessions || { labs: [], tutorials: [] }
        }
        terms={terms}
      />

      <EditSessionModal
        isOpen={isEditSharedSessionModalOpen}
        onClose={handleCloseEditSharedSessionModal}
        onEditSession={handleEditSharedSessionSubmit}
        course={selectedCourse}
        session={selectedSharedSession}
        terms={terms}
      />
    </SidebarProvider>
  )
}

