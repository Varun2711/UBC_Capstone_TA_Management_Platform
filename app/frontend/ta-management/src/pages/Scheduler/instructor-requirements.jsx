
import { useState, useMemo } from "react"
import { Bell, Users, FileText, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppSidebar } from "@/components/scheduler-sidebar"
import { InstructorRequirementsCard } from "@/components/scheduler/instructor-management/instructor-requirement-card"
import { RequirementsFilters } from "@/components/scheduler/instructor-management/requirement-filters"
import { mockInstructorRequirements } from "@/data/mock-instructor-requirements"
import { AddInstructorModal } from "@/components/scheduler/instructor-management/add-instructor-modal"
import { EditInstructorModal } from "@/components/scheduler/instructor-management/edit-instructor-modal"

export default function InstructorRequirements() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [expandedInstructors, setExpandedInstructors] = useState(new Set())

  const [instructors, setInstructors] = useState(mockInstructorRequirements)
  const [isAddInstructorModalOpen, setIsAddInstructorModalOpen] = useState(false)
  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState(null)

  const toggleInstructor = (instructorId) => {
    setExpandedInstructors((prev) => {
      const next = new Set(prev)
      if (next.has(instructorId)) {
        next.delete(instructorId)
      } else {
        next.add(instructorId)
      }
      return next
    })
  }

  // Calculate statistics and filter data
  const { filteredInstructors, stats, departments, years, terms } = useMemo(() => {
    // Get unique departments, years, and terms
    const depts = [...new Set(instructors.map((inst) => inst.department))]
    const allOfferings = instructors.flatMap((inst) => inst.courseOfferings)
    const uniqueYears = [...new Set(allOfferings.map((offering) => offering.year))].sort()
    const uniqueTerms = [...new Set(allOfferings.map((offering) => offering.term))]

    // Filter instructors and their offerings
    const filtered = instructors
      .map((instructor) => {
        // Filter course offerings based on year and term
        const filteredOfferings = instructor.courseOfferings.filter((offering) => {
          const matchesYear = selectedYear === "all" || offering.year === selectedYear
          const matchesTerm = selectedTerm === "all" || offering.term === selectedTerm
          return matchesYear && matchesTerm
        })

        return {
          ...instructor,
          filteredOfferings,
          visibleOfferingsCount: filteredOfferings.length,
        }
      })
      .filter((instructor) => {
        const matchesSearch =
          instructor.instructorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instructor.filteredOfferings.some(
            (offering) =>
              offering.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
              offering.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()),
          )

        const matchesDepartment = selectedDepartment === "all" || instructor.department === selectedDepartment

        // Only show instructors who have at least one visible offering (unless no filters are applied)
        const hasVisibleOfferings =
          instructor.filteredOfferings.length > 0 ||
          (selectedYear === "all" && selectedTerm === "all" && searchQuery === "")

        return matchesSearch && matchesDepartment && hasVisibleOfferings
      })

    // Calculate statistics based on filtered data
    const totalInstructors = instructors.length
    const visibleInstructors = filtered.length
    const totalRequirements = instructors.reduce((acc, instructor) => acc + instructor.courseOfferings.length, 0)
    const visibleRequirements = filtered.reduce((acc, instructor) => acc + instructor.visibleOfferingsCount, 0)

    return {
      filteredInstructors: filtered,
      stats: {
        totalInstructors,
        visibleInstructors,
        totalRequirements,
        visibleRequirements,
      },
      departments: depts,
      years: uniqueYears,
      terms: uniqueTerms,
    }
  }, [searchQuery, selectedDepartment, selectedYear, selectedTerm, instructors])

  const handleAddInstructor = () => {
    setIsAddInstructorModalOpen(true)
  }

  const handleAddInstructorSubmit = (newInstructor) => {
    setInstructors((prev) => [...prev, newInstructor])
    console.log("Instructor added:", newInstructor)
  }

  const handleCloseAddInstructorModal = () => {
    setIsAddInstructorModalOpen(false)
  }

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor)
    setIsEditInstructorModalOpen(true)
  }

  const handleEditInstructorSubmit = (updatedInstructor) => {
    setInstructors((prev) =>
      prev.map((instructor) =>
        instructor.instructorId === updatedInstructor.instructorId ? updatedInstructor : instructor,
      ),
    )
    console.log("Instructor updated:", updatedInstructor)
  }

  const handleCloseEditInstructorModal = () => {
    setIsEditInstructorModalOpen(false)
    setSelectedInstructor(null)
  }

  const handleDeleteInstructor = (instructorId) => {
    const instructor = instructors.find((inst) => inst.instructorId === instructorId)
    const hasRequirements = instructor?.courseOfferings?.length > 0

    const confirmMessage = hasRequirements
      ? `Are you sure you want to delete ${instructor.instructorName}? This will also delete ${instructor.courseOfferings.length} course requirement(s). This action cannot be undone.`
      : `Are you sure you want to delete ${instructor.instructorName}? This action cannot be undone.`

    if (window.confirm(confirmMessage)) {
      setInstructors(instructors.filter((inst) => inst.instructorId !== instructorId))
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activePage={"Instructor Management"} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Instructor Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleAddInstructor}>
              <Plus className="h-4 w-4 mr-2" />
              Add Instructor
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Instructor Requirements</h1>
              <p className="text-muted-foreground">View TA requirements submitted by course instructors</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.visibleInstructors}</div>
                  <p className="text-xs text-muted-foreground">of {stats.totalInstructors} total instructors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.visibleRequirements}</div>
                  <p className="text-xs text-muted-foreground">of {stats.totalRequirements} total requirements</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <RequirementsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
              departments={departments}
              years={years}
              terms={terms}
            />
          </div>

          {/* Instructors List */}
          <div className="space-y-4">
            {filteredInstructors.length > 0 ? (
              filteredInstructors.map((instructor) => (
                <InstructorRequirementsCard
                  key={instructor.instructorId}
                  instructor={instructor}
                  isExpanded={expandedInstructors.has(instructor.instructorId)}
                  onToggle={() => toggleInstructor(instructor.instructorId)}
                  onEdit={handleEditInstructor}
                  onDelete={handleDeleteInstructor}
                  visibleOfferingsCount={instructor.visibleOfferingsCount}
                  filteredOfferings={instructor.filteredOfferings}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No instructors found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Summary */}
          {filteredInstructors.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredInstructors.length} of {stats.totalInstructors} instructors • {stats.visibleRequirements}{" "}
              of {stats.totalRequirements} requirements
            </div>
          )}
        </main>
        {/* Modals */}
        <AddInstructorModal
          isOpen={isAddInstructorModalOpen}
          onClose={handleCloseAddInstructorModal}
          onAddInstructor={handleAddInstructorSubmit}
          existingInstructors={instructors}
        />

        <EditInstructorModal
          isOpen={isEditInstructorModalOpen}
          onClose={handleCloseEditInstructorModal}
          onEditInstructor={handleEditInstructorSubmit}
          instructor={selectedInstructor}
          existingInstructors={instructors}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
