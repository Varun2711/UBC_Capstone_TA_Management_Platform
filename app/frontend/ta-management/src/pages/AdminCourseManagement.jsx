"use client"

import { useState } from "react"
import {
  BookOpen,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  UserCheck,
  Settings,
  Upload,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Building,
  GraduationCap,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSidebar } from "../components/admin-dashboard-sidebar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export default function AdminCourseManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const [viewMode, setViewMode] = useState("table") // table or grid

  // Mock course data with comprehensive admin fields
  const courses = [
    {
      id: 1,
      code: "CS 101",
      name: "Introduction to Computer Science",
      department: "Computer Science",
      instructor: "Dr. Michael Smith",
      instructorEmail: "m.smith@university.edu",
      instructorId: "inst_001",
      enrollment: 45,
      maxEnrollment: 50,
      waitlist: 8,
      taPositions: 3,
      filledTaPositions: 2,
      openTaPositions: 1,
      status: "Active",
      semester: "Fall 2024",
      credits: 3,
      schedule: "MWF 10:00-11:00 AM",
      room: "CS Building 101",
      building: "Computer Science Building",
      prerequisites: "None",
      lastModified: "2024-01-15",
      applicationDeadline: "2024-02-01",
      priority: "High",
      budget: 15000,
      budgetUsed: 8500,
      courseType: "Core",
      level: "Undergraduate",
      format: "In-Person",
      approvalStatus: "Approved",
      createdBy: "admin_001",
      createdDate: "2023-12-01",
      lastUpdated: "2024-01-15",
      enrollmentTrend: "+12%",
      satisfactionRating: 4.2,
      completionRate: 89,
      averageGrade: "B+",
      taApplications: 15,
      pendingApplications: 5,
    },
    {
      id: 2,
      code: "MATH 201",
      name: "Calculus II",
      department: "Mathematics",
      instructor: "Dr. Sarah Johnson",
      instructorEmail: "s.johnson@university.edu",
      instructorId: "inst_002",
      enrollment: 38,
      maxEnrollment: 40,
      waitlist: 12,
      taPositions: 2,
      filledTaPositions: 2,
      openTaPositions: 0,
      status: "Active",
      semester: "Fall 2024",
      credits: 4,
      schedule: "TTh 2:00-3:30 PM",
      room: "Math Building 205",
      building: "Mathematics Building",
      prerequisites: "MATH 101",
      lastModified: "2024-01-12",
      applicationDeadline: "2024-01-28",
      priority: "Medium",
      budget: 12000,
      budgetUsed: 11800,
      courseType: "Core",
      level: "Undergraduate",
      format: "In-Person",
      approvalStatus: "Approved",
      createdBy: "admin_002",
      createdDate: "2023-11-15",
      lastUpdated: "2024-01-12",
      enrollmentTrend: "+8%",
      satisfactionRating: 4.5,
      completionRate: 92,
      averageGrade: "B",
      taApplications: 8,
      pendingApplications: 0,
    },
    {
      id: 3,
      code: "PHYS 301",
      name: "Quantum Mechanics",
      department: "Physics",
      instructor: "Dr. Robert Chen",
      instructorEmail: "r.chen@university.edu",
      instructorId: "inst_003",
      enrollment: 25,
      maxEnrollment: 30,
      waitlist: 3,
      taPositions: 1,
      filledTaPositions: 0,
      openTaPositions: 1,
      status: "Active",
      semester: "Fall 2024",
      credits: 3,
      schedule: "MWF 1:00-2:00 PM",
      room: "Physics Lab 301",
      building: "Physics Building",
      prerequisites: "PHYS 201, MATH 201",
      lastModified: "2024-01-10",
      applicationDeadline: "2024-01-25",
      priority: "High",
      budget: 18000,
      budgetUsed: 5200,
      courseType: "Advanced",
      level: "Graduate",
      format: "Hybrid",
      approvalStatus: "Pending",
      createdBy: "admin_001",
      createdDate: "2023-12-10",
      lastUpdated: "2024-01-10",
      enrollmentTrend: "-5%",
      satisfactionRating: 4.8,
      completionRate: 95,
      averageGrade: "A-",
      taApplications: 12,
      pendingApplications: 8,
    },
    {
      id: 4,
      code: "CS 401",
      name: "Advanced Algorithms",
      department: "Computer Science",
      instructor: "Dr. Emily Davis",
      instructorEmail: "e.davis@university.edu",
      instructorId: "inst_004",
      enrollment: 20,
      maxEnrollment: 25,
      waitlist: 5,
      taPositions: 2,
      filledTaPositions: 1,
      openTaPositions: 1,
      status: "Draft",
      semester: "Spring 2025",
      credits: 3,
      schedule: "TTh 11:00-12:30 PM",
      room: "CS Building 301",
      building: "Computer Science Building",
      prerequisites: "CS 201, CS 221",
      lastModified: "2024-01-08",
      applicationDeadline: "2024-03-01",
      priority: "Medium",
      budget: 16000,
      budgetUsed: 0,
      courseType: "Advanced",
      level: "Graduate",
      format: "In-Person",
      approvalStatus: "Under Review",
      createdBy: "admin_003",
      createdDate: "2024-01-01",
      lastUpdated: "2024-01-08",
      enrollmentTrend: "New",
      satisfactionRating: null,
      completionRate: null,
      averageGrade: null,
      taApplications: 3,
      pendingApplications: 3,
    },
    {
      id: 5,
      code: "CHEM 101",
      name: "General Chemistry",
      department: "Chemistry",
      instructor: "Dr. Lisa Wang",
      instructorEmail: "l.wang@university.edu",
      instructorId: "inst_005",
      enrollment: 60,
      maxEnrollment: 65,
      waitlist: 15,
      taPositions: 4,
      filledTaPositions: 3,
      openTaPositions: 1,
      status: "Active",
      semester: "Fall 2024",
      credits: 4,
      schedule: "MWF 9:00-10:00 AM, Lab: T 2:00-5:00 PM",
      room: "Chemistry Building 101",
      building: "Chemistry Building",
      prerequisites: "None",
      lastModified: "2024-01-14",
      applicationDeadline: "2024-01-30",
      priority: "High",
      budget: 22000,
      budgetUsed: 19500,
      courseType: "Core",
      level: "Undergraduate",
      format: "In-Person",
      approvalStatus: "Approved",
      createdBy: "admin_002",
      createdDate: "2023-10-01",
      lastUpdated: "2024-01-14",
      enrollmentTrend: "+15%",
      satisfactionRating: 4.1,
      completionRate: 87,
      averageGrade: "B",
      taApplications: 25,
      pendingApplications: 2,
    },
  ]

  // Admin-specific statistics
  const adminStats = [
    {
      title: "Total Courses",
      value: "156",
      change: "+8 this term",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up",
    },
    {
      title: "Total Budget",
      value: "$2.4M",
      change: "78% utilized",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up",
    },
    {
      title: "TA Positions",
      value: "342",
      change: "89% filled",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "stable",
    },
    {
      title: "Pending Approvals",
      value: "23",
      change: "5 urgent",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "down",
    },
  ]

  const departmentStats = [
    { name: "Computer Science", courses: 45, enrollment: 1250, budget: 680000, utilization: 92 },
    { name: "Mathematics", courses: 38, enrollment: 980, budget: 520000, utilization: 87 },
    { name: "Physics", courses: 28, enrollment: 720, budget: 450000, utilization: 78 },
    { name: "Chemistry", courses: 32, enrollment: 890, budget: 580000, utilization: 85 },
    { name: "Biology", courses: 25, enrollment: 650, budget: 420000, utilization: 82 },
  ]

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Active":
        return "default"
      case "Draft":
        return "secondary"
      case "Archived":
        return "outline"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getApprovalStatusBadge = (status) => {
    const variants = {
      Approved: { variant: "default", color: "text-green-600" },
      Pending: { variant: "secondary", color: "text-yellow-600" },
      "Under Review": { variant: "outline", color: "text-blue-600" },
      Rejected: { variant: "destructive", color: "text-red-600" },
    }
    const config = variants[status] || variants.Pending
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const variants = {
      High: { variant: "destructive", icon: AlertCircle },
      Medium: { variant: "default", icon: Clock },
      Low: { variant: "secondary", icon: CheckCircle },
    }
    const config = variants[priority] || variants.Medium
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {priority}
      </Badge>
    )
  }

  const getEnrollmentStatus = (enrolled, max, waitlist) => {
    const percentage = (enrolled / max) * 100
    if (percentage >= 95) return { color: "text-red-600", status: "Full", bgColor: "bg-red-100" }
    if (percentage >= 85) return { color: "text-yellow-600", status: "Nearly Full", bgColor: "bg-yellow-100" }
    return { color: "text-green-600", status: "Available", bgColor: "bg-green-100" }
  }

  const getBudgetUtilization = (used, total) => {
    const percentage = (used / total) * 100
    if (percentage >= 90) return { color: "text-red-600", status: "High" }
    if (percentage >= 70) return { color: "text-yellow-600", status: "Medium" }
    return { color: "text-green-600", status: "Low" }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || course.department === departmentFilter
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesSemester = semesterFilter === "all" || course.semester === semesterFilter
    return matchesSearch && matchesDepartment && matchesStatus && matchesSemester
  })

  const handleBulkAction = (action) => {
    if (selectedCourses.length === 0) {
      alert("Please select courses first")
      return
    }
    console.log(`Performing ${action} on courses:`, selectedCourses)
    alert(`${action} applied to ${selectedCourses.length} courses`)
    setSelectedCourses([])
  }

  const handleExportCourses = () => {
    console.log("Exporting courses data...")
    alert("Course data exported successfully!")
  }

  const handleApproveCourse = (courseId) => {
    console.log(`Approving course ${courseId}`)
    alert("Course approved successfully!")
  }

  const handleRejectCourse = (courseId) => {
    console.log(`Rejecting course ${courseId}`)
    alert("Course rejected!")
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePage="Course Management" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">Admin Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Course Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportCourses}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import Courses
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Course Management</h1>
            </div>
            <p className="text-muted-foreground">
              Comprehensive administrative control over all courses, budgets, approvals, and academic operations
            </p>
          </div>

          {/* Admin Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {adminStats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs for different admin views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Course Overview</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="budget">Budget Management</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Create Course Dialog */}
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>
                      Add a new course to the system with comprehensive administrative details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="courseCode">Course Code *</Label>
                        <Input id="courseCode" placeholder="e.g., CS 101" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courseName">Course Name *</Label>
                        <Input id="courseName" placeholder="Enter course name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructor">Instructor *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dr-smith">Dr. Michael Smith</SelectItem>
                            <SelectItem value="dr-johnson">Dr. Sarah Johnson</SelectItem>
                            <SelectItem value="dr-chen">Dr. Robert Chen</SelectItem>
                            <SelectItem value="dr-davis">Dr. Emily Davis</SelectItem>
                            <SelectItem value="dr-wang">Dr. Lisa Wang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="credits">Credits *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select credits" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Credit</SelectItem>
                            <SelectItem value="2">2 Credits</SelectItem>
                            <SelectItem value="3">3 Credits</SelectItem>
                            <SelectItem value="4">4 Credits</SelectItem>
                            <SelectItem value="6">6 Credits</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">Course Level *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                            <SelectItem value="Doctoral">Doctoral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courseType">Course Type *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Core">Core</SelectItem>
                            <SelectItem value="Elective">Elective</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Research">Research</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="format">Course Format *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In-Person">In-Person</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxEnrollment">Max Enrollment *</Label>
                        <Input id="maxEnrollment" type="number" placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taPositions">TA Positions *</Label>
                        <Input id="taPositions" type="number" placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Course Budget ($)</Label>
                        <Input id="budget" type="number" placeholder="15000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                            <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                            <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High Priority</SelectItem>
                            <SelectItem value="Medium">Medium Priority</SelectItem>
                            <SelectItem value="Low">Low Priority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule">Schedule</Label>
                        <Input id="schedule" placeholder="e.g., MWF 10:00-11:00 AM" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room">Room Assignment</Label>
                        <Input id="room" placeholder="e.g., CS Building 101" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prerequisites">Prerequisites</Label>
                        <Input id="prerequisites" placeholder="e.g., CS 101, MATH 101" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Course Description</Label>
                      <Textarea id="description" placeholder="Enter detailed course description" rows={4} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="autoApprove" />
                      <Label htmlFor="autoApprove">Auto-approve course (skip approval process)</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button variant="outline">Save as Draft</Button>
                      <Button>Create & Submit for Approval</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Courses</CardTitle>
                      <CardDescription>
                        Comprehensive administrative view of all courses across departments
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                      >
                        {viewMode === "table" ? "Grid View" : "Table View"}
                      </Button>
                      {selectedCourses.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Bulk Actions ({selectedCourses.length})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleBulkAction("Approve")}>
                              Approve Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkAction("Archive")}>
                              Archive Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkAction("Export")}>
                              Export Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkAction("Update Budget")}>
                              Update Budget
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search courses by name, code, instructor, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Semesters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="Fall 2024">Fall 2024</SelectItem>
                        <SelectItem value="Spring 2025">Spring 2025</SelectItem>
                        <SelectItem value="Summer 2025">Summer 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Courses Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCourses(filteredCourses.map((c) => c.id))
                                } else {
                                  setSelectedCourses([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Course Details</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Enrollment</TableHead>
                          <TableHead>TA Management</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approval</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourses.map((course) => {
                          const enrollmentStatus = getEnrollmentStatus(
                            course.enrollment,
                            course.maxEnrollment,
                            course.waitlist,
                          )
                          const budgetUtil = getBudgetUtilization(course.budgetUsed, course.budget)
                          return (
                            <TableRow key={course.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCourses([...selectedCourses, course.id])
                                    } else {
                                      setSelectedCourses(selectedCourses.filter((id) => id !== course.id))
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {course.code}
                                    {getPriorityBadge(course.priority)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{course.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {course.department} • {course.credits} credits • {course.level}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {course.courseType} • {course.format} • {course.semester}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{course.instructor}</div>
                                  <div className="text-sm text-muted-foreground">{course.instructorEmail}</div>
                                  <div className="text-xs text-muted-foreground">ID: {course.instructorId}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${enrollmentStatus.color}`}>
                                      {course.enrollment}/{course.maxEnrollment}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${enrollmentStatus.bgColor}`}>
                                      {enrollmentStatus.status}
                                    </Badge>
                                  </div>
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{
                                        width: `${(course.enrollment / course.maxEnrollment) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                  {course.waitlist > 0 && (
                                    <div className="text-xs text-muted-foreground">{course.waitlist} on waitlist</div>
                                  )}
                                  {course.enrollmentTrend && (
                                    <div className="text-xs text-green-600">Trend: {course.enrollmentTrend}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {course.filledTaPositions}/{course.taPositions}
                                    </span>
                                    <Badge
                                      variant={
                                        course.filledTaPositions === course.taPositions ? "default" : "secondary"
                                      }
                                    >
                                      {course.openTaPositions === 0 ? "Full" : `${course.openTaPositions} Open`}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Applications: {course.taApplications}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Pending: {course.pendingApplications}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Deadline: {course.applicationDeadline}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    ${course.budgetUsed.toLocaleString()} / ${course.budget.toLocaleString()}
                                  </div>
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        budgetUtil.color.includes("red")
                                          ? "bg-red-500"
                                          : budgetUtil.color.includes("yellow")
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                      }`}
                                      style={{
                                        width: `${(course.budgetUsed / course.budget) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <div className={`text-xs ${budgetUtil.color}`}>
                                    {Math.round((course.budgetUsed / course.budget) * 100)}% used
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge variant={getStatusBadgeVariant(course.status)}>{course.status}</Badge>
                                  <div className="text-xs text-muted-foreground">Updated: {course.lastUpdated}</div>
                                  <div className="text-xs text-muted-foreground">By: {course.createdBy}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {getApprovalStatusBadge(course.approvalStatus)}
                                  {course.approvalStatus === "Pending" && (
                                    <div className="flex gap-1 mt-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs text-green-600 bg-transparent"
                                        onClick={() => handleApproveCourse(course.id)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs text-red-600 bg-transparent"
                                        onClick={() => handleRejectCourse(course.id)}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Course Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Full Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Course
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Users className="mr-2 h-4 w-4" />
                                      Manage Enrollment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Manage TAs
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <TrendingUp className="mr-2 h-4 w-4" />
                                      Budget Management
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Applications
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <BarChart3 className="mr-2 h-4 w-4" />
                                      Course Analytics
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Advanced Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Archive Course
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Approvals</CardTitle>
                  <CardDescription>Review and approve pending course requests and modifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Course approval interface coming soon...</p>
                    <p className="text-sm">Review pending courses, budget requests, and instructor assignments</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>Monitor and manage course budgets across all departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Budget management dashboard coming soon...</p>
                    <p className="text-sm">Track spending, allocate resources, and manage financial approvals</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>Monitor course distribution and performance across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {departmentStats.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{dept.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {dept.courses} courses • {dept.enrollment} students
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${dept.budget.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{dept.utilization}% utilized</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Analytics</CardTitle>
                  <CardDescription>
                    Comprehensive analytics and reporting for administrative decision making
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced analytics dashboard coming soon...</p>
                    <p className="text-sm">Enrollment trends, performance metrics, and predictive insights</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
