"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Bell, Users, FileText, Plus, Loader2, AlertTriangle } from "lucide-react";
import { 
    getInstructors, 
    getDepartments, 
    deleteInstructor, 
    getInstructorRequests, 
    getCourseOfferings    
} from "@/logic/instructorManagement";

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

const parseCourseInfo = (courseInfo) => {
    const parts = courseInfo.split(" ");
    const courseCode = `${parts[0]} ${parts[1]}`;
    const courseTitle = parts.slice(2).join(" ");
    return { courseCode, courseTitle };
};

const parseTermInfo = (termInfo) => {
  const yearMatch = termInfo.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[0] : "Unknown";
  const termPartMatch = termInfo.match(/(Term \d|Both Terms)/);
  const termPart = termPartMatch ? termPartMatch[0] : "Unknown";
  const firstLetter = termInfo.charAt(0).toUpperCase();
  let session = "";
  if (firstLetter === 'W') {
      session = 'Winter';
  } else if (firstLetter === 'S') {
      session = 'Summer';
  }
  
  // Keep the full "Both Terms" text
  let fullTerm;
  if (termPart === "Both Terms") {
    fullTerm = session ? `${session} Both Terms` : "Both Terms";
  } else {
    fullTerm = session ? `${session} ${termPart}` : termPart;
  }
  
  return { year, term: fullTerm };
};

export default function InstructorRequirements() {
  const [instructors, setInstructors] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [allCourseOfferings, setAllCourseOfferings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [expandedInstructors, setExpandedInstructors] = useState(new Set());
  const [isAddInstructorModalOpen, setIsAddInstructorModalOpen] = useState(false);
  const [isEditInstructorModalOpen, setIsEditInstructorModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const fetchPageData = useCallback(async () => {
    try {
      setError(null);
      const [instructorsData, departmentsData, requestsData, offeringsData] = await Promise.all([
        getInstructors(), 
        getDepartments(),
        getInstructorRequests(),
        getCourseOfferings()
      ]);

      const departmentMap = new Map(departmentsData.map(d => [d.id, d.name]));
      
      const formattedInstructors = instructorsData.map((inst) => ({
        dbId: inst.id,
        instructorId: inst.employee_number,
        instructorName: inst.name,
        email: inst.email,
        departmentId: inst.department,
        departmentName: departmentMap.get(inst.department) || "Unknown",
        employeeNumber: inst.employee_number,
        courseOfferings: [],
      }));

      setAllDepartments(departmentsData);
      setInstructors(formattedInstructors);
      setAllRequests(requestsData);
      setAllCourseOfferings(offeringsData);

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Could not load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const toggleInstructor = (instructorId) => {
    setExpandedInstructors((prev) => {
      const next = new Set(prev);
      next.has(instructorId) ? next.delete(instructorId) : next.add(instructorId);
      return next;
    });
  };

  const handleDeleteInstructor = async (employeeNumber) => {
    const instructor = instructors.find((inst) => inst.instructorId === employeeNumber);
    if (!instructor) return;
    if (window.confirm(`Are you sure you want to delete ${instructor.instructorName}?`)) {
      try {
        await deleteInstructor(employeeNumber);
        fetchPageData();
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

  const { filteredInstructors, stats, availableYears, availableTerms } = useMemo(() => {
    if (isLoading) {
        return { filteredInstructors: [], stats: { totalInstructors: 0, visibleInstructors: 0, totalRequirements: 0, visibleRequirements: 0 }, availableYears: [], availableTerms: [] };
    }
    
    // Create a map of requests by course offering ID for quick lookup
    const requestsMap = new Map(allRequests.map(req => [req.course_offering_id, req]));
    const yearSet = new Set();
    const termSet = new Set();
    
    const instructorsWithOfferings = instructors.map(instructor => {
        // Find all course offerings for this instructor
        const instructorOfferings = allCourseOfferings
            .filter(offering => offering.instructor_id_read === instructor.dbId)
            .map(offering => {
                const { courseCode, courseTitle } = parseCourseInfo(offering.course_info);
                const { year, term } = parseTermInfo(offering.term_info);
                yearSet.add(year);
                termSet.add(term);
                
                // Check if there's a request for this course offering
                const request = requestsMap.get(offering.course_offering_id);
                
                return {
                    offeringId: offering.course_offering_id,
                    courseCode,
                    courseTitle,
                    section: offering.section_number,
                    year,
                    term,
                    requirements: {
                        submittedAt: request?.request_date || null,
                        generalRequirements: request?.request_description || [],
                        hasRequest: !!request,
                        requestId: request?.request_id || null,
                    },
                };
            });
            
        return { ...instructor, courseOfferings: instructorOfferings };
    });
    
    let visibleInstructors = instructorsWithOfferings.filter(instructor => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const matchesSearch =
            instructor.instructorName.toLowerCase().includes(lowerCaseQuery) ||
            instructor.email.toLowerCase().includes(lowerCaseQuery) ||
            String(instructor.employeeNumber).includes(lowerCaseQuery);
        
        const matchesDepartment = selectedDepartment === "all" || instructor.departmentName === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });
    
    let visibleRequirementsCount = 0;
    const finalFilteredInstructors = visibleInstructors.map(instructor => {
        const filteredOfferings = instructor.courseOfferings.filter(offering => {
            const matchesYear = selectedYear === "all" || offering.year === selectedYear;
            const matchesTerm = selectedTerm === "all" || offering.term === selectedTerm;
            return matchesYear && matchesTerm;
        });
        visibleRequirementsCount += filteredOfferings.length;
        return { ...instructor, filteredOfferings };
    });
    
    const totalRequirements = instructorsWithOfferings.reduce((sum, inst) => sum + inst.courseOfferings.length, 0);
    const submittedRequirements = instructorsWithOfferings.reduce((sum, inst) => 
      sum + inst.courseOfferings.filter(offering => offering.requirements.hasRequest).length, 0
    );

    return {
        filteredInstructors: finalFilteredInstructors,
        stats: {
            totalInstructors: instructors.length,
            visibleInstructors: visibleInstructors.length,
            totalRequirements,
            submittedRequirements, // Add this new stat
            visibleRequirements: visibleRequirementsCount,
        },
        availableYears: Array.from(yearSet).sort(),
        availableTerms: Array.from(termSet).sort(),
    };
  }, [instructors, allRequests, allCourseOfferings, searchQuery, selectedDepartment, selectedYear, selectedTerm, isLoading]);
  
  const departmentNames = allDepartments.map(d => d.name);

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
                    <p className="text-muted-foreground">Add, edit, and manage course requirement requests from instructors.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.visibleInstructors}</div>
                            <p className="text-xs text-muted-foreground"> of {stats.totalInstructors} total instructors</p>
                        </CardContent>
                    </Card>
                    <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Course Offerings</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
        <div className="text-2xl font-bold">{stats.visibleRequirements}</div>
        <p className="text-xs text-muted-foreground">
            of {stats.totalRequirements} total offerings 
            ({stats.submittedRequirements} with requirements)
        </p>
    </CardContent>
</Card>
                </div>
                <RequirementsFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedDepartment={selectedDepartment}
                    onDepartmentChange={setSelectedDepartment}
                    departments={departmentNames}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                    years={availableYears}
                    selectedTerm={selectedTerm}
                    onTermChange={setSelectedTerm}
                    terms={availableTerms}
                />
            </div>
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
                      visibleOfferingsCount={instructor.filteredOfferings.length}
                      filteredOfferings={instructor.filteredOfferings}
                    />
                ))
                ) : (
                <Card><CardContent className="text-center py-8"><p>No instructors match the current filters.</p></CardContent></Card>
                )}
            </div>
        </main>
        
        <AddInstructorModal
          isOpen={isAddInstructorModalOpen}
          onClose={() => setIsAddInstructorModalOpen(false)}
          onDataChange={fetchPageData}
          existingInstructors={instructors}
          departments={departmentNames}
        />
        <EditInstructorModal
          isOpen={isEditInstructorModalOpen}
          onClose={() => setIsEditInstructorModalOpen(false)}
          onDataChange={fetchPageData}
          instructor={selectedInstructor}
          existingInstructors={instructors}
          departments={departmentNames}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}