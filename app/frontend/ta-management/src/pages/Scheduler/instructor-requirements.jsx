"use client";

import { useState, useMemo, useEffect } from "react";
import { Bell, Users, FileText, Plus, Loader2, AlertTriangle } from "lucide-react";
import { getInstructors, getDepartments, deleteInstructor } from "@/logic/instructorManagement";

import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/scheduler-sidebar";
import { InstructorRequirementsCard } from "@/components/scheduler/instructor-management/instructor-requirement-card";
import { RequirementsFilters } from "@/components/scheduler/instructor-management/requirement-filters";
import { AddInstructorModal } from "@/components/scheduler/instructor-management/add-instructor-modal";
import { EditInstructorModal } from "@/components/scheduler/instructor-management/edit-instructor-modal";

export default function InstructorRequirements() {
  // --- STATE MANAGEMENT ---
  const [instructors, setInstructors] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]); // Will store [{id, name}]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [expandedInstructors, setExpandedInstructors] = useState(new Set());
  const [isAddInstructorModalOpen, setIsAddInstructorModalOpen] = useState(false);
  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch instructors and departments in parallel
        const [instructorsData, departmentsData] = await Promise.all([
          getInstructors(), 
          getDepartments()
        ]);

        setAllDepartments(departmentsData); // Store full department objects

        // Create a lookup map for department IDs to names for efficient mapping
        const departmentMap = new Map(departmentsData.map(d => [d.id, d.name]));

        // Format instructors with the correct department name
        const formattedInstructors = instructorsData.map((inst) => ({
          instructorId: inst.employee_number, // Use employee_number as the unique key
          dbId: inst.id, // Keep the database primary key if needed elsewhere
          instructorName: inst.name,
          email: inst.email,
          department: departmentMap.get(inst.department) || "Unknown", // Map ID to name
          employeeNumber: inst.employee_number,
          courseOfferings: [],
        }));

        setInstructors(formattedInstructors);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- EVENT HANDLERS ---
  const handleAddInstructorSubmit = (newInstructorFromApi) => {
    // The create API returns the department name directly
    const formatted = {
      instructorId: newInstructorFromApi.id, // API returns employee_number as 'id'
      instructorName: newInstructorFromApi.name,
      email: newInstructorFromApi.email,
      department: newInstructorFromApi.department,
      employeeNumber: newInstructorFromApi.id,
      courseOfferings: [],
    };
    setInstructors((prev) => [...prev, formatted]);
  };
  
  const handleEditInstructorSubmit = (updatedFromApi) => {
    setInstructors((prev) =>
      prev.map((inst) =>
        inst.instructorId === updatedFromApi.id // Match by employee_number
          ? { ...inst, instructorName: updatedFromApi.name, email: updatedFromApi.email, department: updatedFromApi.department }
          : inst
      )
    );
  };
  
  const handleDeleteInstructor = async (employeeNumber) => {
    const instructor = instructors.find((inst) => inst.instructorId === employeeNumber);
    if (!instructor) return;

    if (window.confirm(`Are you sure you want to delete ${instructor.instructorName}?`)) {
      try {
        await deleteInstructor(employeeNumber);
        setInstructors((prev) => prev.filter((inst) => inst.instructorId !== employeeNumber));
        alert(`${instructor.instructorName} has been deleted.`);
      } catch (err) {
        console.error("Failed to delete instructor:", err);
        alert(`Error: Could not delete ${instructor.instructorName}.`);
      }
    }
  };

  const handleEditInstructor = (instructor) => {
    setSelectedInstructor(instructor);
    setIsEditInstructorModalOpen(true);
  };

  // --- MEMOIZED FILTERS & STATS ---
  const { filteredInstructors, stats } = useMemo(() => {
    const filtered = instructors.filter((instructor) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch =
        instructor.instructorName.toLowerCase().includes(lowerCaseQuery) ||
        instructor.email.toLowerCase().includes(lowerCaseQuery) ||
        instructor.employeeNumber.includes(lowerCaseQuery);
      const matchesDepartment = selectedDepartment === "all" || instructor.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });

    return {
      filteredInstructors: filtered,
      stats: {
        totalInstructors: instructors.length,
        visibleInstructors: filtered.length,
        totalRequirements: 0, // Placeholder
        visibleRequirements: 0, // Placeholder
      },
    };
  }, [searchQuery, selectedDepartment, instructors]);

  const departmentNames = allDepartments.map(d => d.name);

  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center h-screen text-red-500"><AlertTriangle className="h-12 w-12 mb-4" /><p>{error}</p></div>;
  }
  
  return (
    <SidebarProvider>
      <AppSidebar activePage={"Instructor Management"} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Instructor Management</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setIsAddInstructorModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Instructor</Button>
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex flex-col space-y-4">
    <div className="flex flex-col space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Instructor Management</h1>
      <p className="text-muted-foreground">Add, edit, and manage course instructors.</p>
    </div>

    {/* --- THIS IS THE MISSING SECTION --- */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Instructors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.visibleInstructors}</div>
          <p className="text-xs text-muted-foreground">
            of {stats.totalInstructors} total instructors
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Requirements</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.visibleRequirements}</div>
          <p className="text-xs text-muted-foreground">
            of {stats.totalRequirements} total requirements
          </p>
        </CardContent>
      </Card>
    </div>
    {/* --- END OF MISSING SECTION --- */}

    <RequirementsFilters
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedDepartment={selectedDepartment}
      onDepartmentChange={setSelectedDepartment}
      departments={departmentNames}
      selectedYear={"all"} onYearChange={() => {}} years={[]}
      selectedTerm={"all"} onTermChange={() => {}} terms={[]}
    />
  </div>
          <div className="space-y-4">
            {filteredInstructors.length > 0 ? (
              filteredInstructors.map((instructor) => (
                <InstructorRequirementsCard
                  key={instructor.instructorId}
                  instructor={instructor}
                  isExpanded={false} /* Manage expansion state if needed */
                  onToggle={() => {}}
                  onEdit={handleEditInstructor}
                  onDelete={handleDeleteInstructor}
                  visibleOfferingsCount={0}
                  filteredOfferings={[]}
                />
              ))
            ) : (
              <Card><CardContent className="text-center py-8"><p>No instructors found.</p></CardContent></Card>
            )}
          </div>
        </main>
        
        <AddInstructorModal
          isOpen={isAddInstructorModalOpen}
          onClose={() => setIsAddInstructorModalOpen(false)}
          onAddInstructor={handleAddInstructorSubmit}
          existingInstructors={instructors}
          departments={departmentNames}
        />
        <EditInstructorModal
          isOpen={isEditInstructorModalOpen}
          onClose={() => setIsEditInstructorModalOpen(false)}
          onEditInstructor={handleEditInstructorSubmit}
          instructor={selectedInstructor}
          existingInstructors={instructors}
          departments={departmentNames}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}