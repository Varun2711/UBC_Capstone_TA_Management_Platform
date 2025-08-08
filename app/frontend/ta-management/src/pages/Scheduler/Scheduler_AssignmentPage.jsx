import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  Search,
  Users,
  BookOpen,
  Calendar,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/scheduler-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { StudentCard } from "@/components/scheduler/assignment/StudentCard";
import { CourseCard } from "@/components/scheduler/assignment/CourseCard";
import { CalendarTab } from "@/components/scheduler/assignment/CalendarTab";

import { fetchAssignmentData, parseTermCode, finalizeAllAllocations } from "@/logic/assignmentManagement";

export default function SchedulerAssignmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [expandedStudentYears, setExpandedStudentYears] = useState(new Set());
  const [expandedCourseYears, setExpandedCourseYears] = useState(new Set());

  // Backend data state
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchAssignmentData();
        
        setCourses(data.courses);
        setStudents(data.students);
        setDepartments(data.departments);
        setInstructors(data.instructors);
      } catch (err) {
        setError("Failed to load assignment data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFinalizeAllocations = async () => {
    try {
      setFinalizing(true);
      
      await finalizeAllAllocations();
      
      toast.success("Allocations Finalized", {
        description: "All instructors have been notified of their course allocations.",
      });
      
    } catch (error) {
      toast.error("Failed to finalize allocations", {
        description: "Please try again.",
      });
    } finally {
      setFinalizing(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedYear !== "all" || selectedTerm !== "all") {
        const hasMatchingAssignment = Object.entries(student.yearlyAssignments).some(([year, yearData]) => {
          if (selectedYear !== "all" && year !== selectedYear) return false;
          
          return Object.entries(yearData).some(([termKey, assignments]) => {
            if (selectedTerm !== "all") {
              const parsedTerm = parseTermCode(termKey);
              if (!parsedTerm) return false;
              
              let formattedTerm = "";
              if (parsedTerm.term === 'Both') {
                formattedTerm = `${parsedTerm.season} Both Terms`;
              } else {
                formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`;
              }
              
              if (formattedTerm !== selectedTerm) return false;
            }
            return assignments.length > 0;
          });
        });
        
        if (!hasMatchingAssignment) return false;
      }

      return true;
    });
  }, [students, searchTerm, selectedTerm, selectedYear]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedDepartment !== "all" && course.department !== selectedDepartment) return false;

      if (selectedYear !== "all" || selectedTerm !== "all") {
        const hasMatchingOffering = Object.entries(course.yearlyOfferings || {}).some(([year, yearData]) => {
          if (selectedYear !== "all" && year !== selectedYear) return false;
          
          return Object.entries(yearData).some(([termKey, sections]) => {
            if (selectedTerm !== "all") {
              const parsedTerm = parseTermCode(termKey);
              if (!parsedTerm) return false;
              
              let formattedTerm = "";
              if (parsedTerm.term === 'Both') {
                formattedTerm = `${parsedTerm.season} Both Terms`;
              } else {
                formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`;
              }
              
              if (formattedTerm !== selectedTerm) return false;
            }
            return sections.length > 0;
          });
        });
        
        if (!hasMatchingOffering) return false;
      }

      return true;
    });
  }, [courses, searchTerm, selectedDepartment, selectedYear, selectedTerm]);

  // Get unique years and terms from both students and courses
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    
    courses.forEach(course => {
      Object.keys(course.yearlyOfferings || {}).forEach(year => {
        yearSet.add(year);
      });
    });
    
    students.forEach(student => {
      Object.keys(student.yearlyAssignments || {}).forEach(year => {
        yearSet.add(year);
      });
    });
    
    return Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
  }, [courses, students]);

  const availableTerms = useMemo(() => {
    const termSet = new Set();
    
    courses.forEach(course => {
      Object.values(course.yearlyOfferings || {}).forEach(yearData => {
        Object.keys(yearData).forEach(termKey => {
          const parsedTerm = parseTermCode(termKey);
          if (parsedTerm) {
            let formattedTerm = "";
            if (parsedTerm.term === 'Both') {
              formattedTerm = `${parsedTerm.season} Both Terms`;
            } else {
              formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`;
            }
            termSet.add(formattedTerm);
          }
        });
      });
    });
    
    students.forEach(student => {
      Object.values(student.yearlyAssignments || {}).forEach(yearData => {
        Object.keys(yearData).forEach(termKey => {
          const parsedTerm = parseTermCode(termKey);
          if (parsedTerm) {
            let formattedTerm = "";
            if (parsedTerm.term === 'Both') {
              formattedTerm = `${parsedTerm.season} Both Terms`;
            } else {
              formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`;
            }
            termSet.add(formattedTerm);
          }
        });
      });
    });
    
    return Array.from(termSet).sort();
  }, [courses, students]);

  const availableDepartments = useMemo(() => {
    const deptSet = new Set();
    courses.forEach(course => {
      if (course.department) {
        deptSet.add(course.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [courses]);

  const toggleStudentYear = (studentId, year) => {
    const key = `${studentId}-${year}`;
    setExpandedStudentYears(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleCourseYear = (courseId, year) => {
    const key = `${courseId}-${year}`;
    setExpandedCourseYears(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar activePage="Assignments" />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading assignment data...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar activePage="Assignments" />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center max-w-md">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar activePage="Assignments" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Assignment Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center space-x-4">
            <Button 
              onClick={handleFinalizeAllocations}
              disabled={finalizing || students.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {finalizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Notifications...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Final Assignment Notification
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assignment Management</h2>
              <p className="text-muted-foreground">
                View and manage TA assignments across courses and students
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{students.length} assigned student{students.length !== 1 ? 's' : ''}</p>
              <p>{courses.length} course{courses.length !== 1 ? 's' : ''} with assignments</p>
            </div>
          </div>

          <Tabs defaultValue="students" className="space-y-4">
            <TabsList>
              <TabsTrigger value="students">By Students</TabsTrigger>
              <TabsTrigger value="courses">By Courses</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students, courses..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Terms</SelectItem>
                          {availableTerms.map(term => (
                            <SelectItem key={term} value={term}>{term}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {availableDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    expandedYears={expandedStudentYears}
                    onToggleYear={toggleStudentYear}
                  />
                ))}
              </div>

              {filteredStudents.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        No students found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search criteria or filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search students, courses..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Terms</SelectItem>
                          {availableTerms.map(term => (
                            <SelectItem key={term} value={term}>{term}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {availableDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    expandedYears={expandedCourseYears}
                    onToggleYear={toggleCourseYear}
                  />
                ))}
              </div>

              {filteredCourses.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        No courses found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search criteria or filters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarTab students={students} courses={courses} />
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}