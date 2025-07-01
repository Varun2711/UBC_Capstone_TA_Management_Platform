
import { useState } from "react"
import { Bell, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/scheduler-sidebar"
import { CourseCard } from "@/components/scheduler/course_management/course-card"
import { CourseFilters } from "@/components/scheduler/course_management/course-filters"
import { EmptyState } from "@/components/scheduler/course_management/empty-state"
import { mockCourses } from "@/data/mock-courses"
import { AddCourseModal } from "@/components/scheduler/course_management/add-course-modal"
import { EditCourseModal } from "@/components/scheduler/course_management/edit-course-modal"
import { AddOfferingModal } from "@/components/scheduler/course_management/add-offering-modal"
import { EditOfferingModal } from "@/components/scheduler/course_management/edit-offering-modal"
import { AddLabTutorialModal } from "@/components/scheduler/course_management/add-lab-tutorial-modal"

export default function CourseManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [expandedCourses, setExpandedCourses] = useState(new Set())
  const [expandedOfferings, setExpandedOfferings] = useState(new Set())
  const [expandedLabSections, setExpandedLabSections] = useState(new Set())
  const [courses, setCourses] = useState(mockCourses)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddOfferingModalOpen, setIsAddOfferingModalOpen] = useState(false)
  const [isEditOfferingModalOpen, setIsEditOfferingModalOpen] = useState(false)
  const [isAddLabTutorialModalOpen, setIsAddLabTutorialModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedOffering, setSelectedOffering] = useState(null)

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

  const handleAddCourse = () => {
    setIsAddModalOpen(true)
  }

  const handleAddCourseSubmit = (newCourse) => {
    setCourses((prev) => [...prev, newCourse])
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleEditCourse = (course) => {
    setSelectedCourse(course)
    setIsEditModalOpen(true)
  }

  const handleEditCourseSubmit = (updatedCourse) => {
    setCourses((prev) => prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)))
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedCourse(null)
  }

  const handleAddOffering = (course) => {
    setSelectedCourse(course)
    setIsAddOfferingModalOpen(true)
  }

  const handleAddOfferingSubmit = (courseId, newOffering) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId ? { ...course, offerings: [...course.offerings, newOffering] } : course,
      ),
    )
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

  const handleEditOfferingSubmit = (courseId, updatedOffering) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              offerings: course.offerings.map((offering) =>
                offering.id === updatedOffering.id ? updatedOffering : offering,
              ),
            }
          : course,
      ),
    )
  }

  const handleCloseEditOfferingModal = () => {
    setIsEditOfferingModalOpen(false)
    setSelectedOffering(null)
    setSelectedCourse(null)
  }

  const handleAddLabTutorial = (offering) => {
    setSelectedOffering(offering)
    setSelectedCourse(courses.find((course) => course.offerings.some((o) => o.id === offering.id)))
    setIsAddLabTutorialModalOpen(true)
  }

  const handleAddLabTutorialSubmit = (courseId, term, year, sessionType, newSession) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id === courseId) {
          const termKey = `${term}-${year}`
          const updatedSharedSessions = { ...course.sharedSessions }

          // Initialize term if it doesn't exist
          if (!updatedSharedSessions[termKey]) {
            updatedSharedSessions[termKey] = { labs: [], tutorials: [] }
          }

          // Add session to appropriate type
          const sessionTypeKey = sessionType === "lab" ? "labs" : "tutorials"
          updatedSharedSessions[termKey] = {
            ...updatedSharedSessions[termKey],
            [sessionTypeKey]: [...updatedSharedSessions[termKey][sessionTypeKey], newSession],
          }

          return {
            ...course,
            sharedSessions: updatedSharedSessions,
          }
        }
        return course
      }),
    )
  }

  const handleCloseAddLabTutorialModal = () => {
    setIsAddLabTutorialModalOpen(false)
    setSelectedOffering(null)
    setSelectedCourse(null)
  }

  const handleDeleteCourse = (courseId) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      setCourses(courses.filter((course) => course.id !== courseId))
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || course.department === selectedDepartment
    const matchesYear = selectedYear === "all" || course.offerings.some((offering) => offering.year === selectedYear)

    return matchesSearch && matchesDepartment && matchesYear
  })

  const departments = ["Computer Science", "Mathematics", "Physics", "Engineering"]
  const years = ["2024", "2025", "2026"]

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
              departments={departments}
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
      />

      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onEditCourse={handleEditCourseSubmit}
        course={selectedCourse}
        existingCourses={courses}
      />

      <AddOfferingModal
        isOpen={isAddOfferingModalOpen}
        onClose={handleCloseAddOfferingModal}
        onAddOffering={handleAddOfferingSubmit}
        course={selectedCourse}
        existingOfferings={selectedCourse?.offerings || []}
      />

      <EditOfferingModal
        isOpen={isEditOfferingModalOpen}
        onClose={handleCloseEditOfferingModal}
        onEditOffering={handleEditOfferingSubmit}
        course={selectedCourse}
        offering={selectedOffering}
        existingOfferings={selectedCourse?.offerings || []}
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
      />
    </SidebarProvider>
  )
}
