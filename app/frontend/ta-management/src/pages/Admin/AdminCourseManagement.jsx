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
  XCircle,
  Star,
  MapPin,
  Mail,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"

export default function AdminCourseManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [activeTab, setActiveTab] = useState("overview")

  // Course data similar to scheduler version but with admin-specific fields
  const courses = [
    {
      id: 1,
      code: "CS 101",
      name: "Introduction to Computer Science",
      department: "Computer Science",
      instructor: {
        name: "Dr. Michael Smith",
        email: "m.smith@university.edu",
        phone: "(555) 123-4567",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.8,
        experience: "15 years",
      },
      enrollment: {
        current: 45,
        max: 50,
        waitlist: 8,
        dropRate: "5%",
      },
      taPositions: {
        total: 3,
        filled: 2,
        pending: 5,
        deadline: "2024-02-01",
      },
      status: "Active",
      semester: "Fall 2024",
      credits: 3,
      schedule: {
        days: "MWF",
        time: "10:00-11:00 AM",
        room: "CS Building 101",
        capacity: 50,
      },
      prerequisites: ["None"],
      description:
        "An introduction to computer science concepts, programming fundamentals, and problem-solving techniques.",
      lastModified: "2024-01-15",
      priority: "High",
      budget: "$15,000",
      approvalStatus: "Approved",
      createdBy: "Dr. Johnson",
      tags: ["Core", "Freshman", "Programming"],
      performance: {
        passRate: "92%",
        satisfaction: 4.6,
        difficulty: 3.2,
      },
    },
    {
      id: 2,
      code: "MATH 201",
      name: "Calculus II",
      department: "Mathematics",
      instructor: {
        name: "Dr. Sarah Johnson",
        email: "s.johnson@university.edu",
        phone: "(555) 234-5678",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.9,
        experience: "12 years",
      },
      enrollment: {
        current: 38,
        max: 40,
        waitlist: 12,
        dropRate: "8%",
      },
      taPositions: {
        total: 2,
        filled: 2,
        pending: 3,
        deadline: "2024-01-28",
      },
      status: "Active",
      semester: "Fall 2024",
      credits: 4,
      schedule: {
        days: "TTh",
        time: "2:00-3:30 PM",
        room: "Math Building 205",
        capacity: 40,
      },
      prerequisites: ["MATH 101"],
      description: "Advanced calculus covering integration techniques, sequences, series, and applications.",
      lastModified: "2024-01-12",
      priority: "High",
      budget: "$12,000",
      approvalStatus: "Approved",
      createdBy: "Dr. Williams",
      tags: ["Core", "Mathematics", "Advanced"],
      performance: {
        passRate: "85%",
        satisfaction: 4.4,
        difficulty: 4.1,
      },
    },
    {
      id: 3,
      code: "PHYS 301",
      name: "Quantum Mechanics",
      department: "Physics",
      instructor: {
        name: "Dr. Robert Chen",
        email: "r.chen@university.edu",
        phone: "(555) 345-6789",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.7,
        experience: "20 years",
      },
      enrollment: {
        current: 25,
        max: 30,
        waitlist: 3,
        dropRate: "12%",
      },
      taPositions: {
        total: 1,
        filled: 0,
        pending: 8,
        deadline: "2024-01-25",
      },
      status: "Active",
      semester: "Fall 2024",
      credits: 3,
      schedule: {
        days: "MWF",
        time: "1:00-2:00 PM",
        room: "Physics Lab 301",
        capacity: 30,
      },
      prerequisites: ["PHYS 201", "MATH 201"],
      description: "Introduction to quantum mechanics principles, wave functions, and quantum systems.",
      lastModified: "2024-01-10",
      priority: "Medium",
      budget: "$18,000",
      approvalStatus: "Approved",
      createdBy: "Dr. Chen",
      tags: ["Advanced", "Physics", "Graduate"],
      performance: {
        passRate: "78%",
        satisfaction: 4.2,
        difficulty: 4.8,
      },
    },
    {
      id: 4,
      code: "CS 401",
      name: "Advanced Algorithms",
      department: "Computer Science",
      instructor: {
        name: "Dr. Emily Davis",
        email: "e.davis@university.edu",
        phone: "(555) 456-7890",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.6,
        experience: "8 years",
      },
      enrollment: {
        current: 20,
        max: 25,
        waitlist: 5,
        dropRate: "15%",
      },
      taPositions: {
        total: 2,
        filled: 1,
        pending: 12,
        deadline: "2024-03-01",
      },
      status: "Pending Approval",
      semester: "Spring 2025",
      credits: 3,
      schedule: {
        days: "TTh",
        time: "11:00-12:30 PM",
        room: "CS Building 301",
        capacity: 25,
      },
      prerequisites: ["CS 201", "CS 221"],
      description: "Advanced algorithmic techniques, complexity analysis, and optimization methods.",
      lastModified: "2024-01-08",
      priority: "High",
      budget: "$16,000",
      approvalStatus: "Pending",
      createdBy: "Dr. Davis",
      tags: ["Advanced", "Algorithms", "Graduate"],
      performance: {
        passRate: "88%",
        satisfaction: 4.5,
        difficulty: 4.3,
      },
    },
    {
      id: 5,
      code: "CHEM 101",
      name: "General Chemistry",
      department: "Chemistry",
      instructor: {
        name: "Dr. Lisa Wang",
        email: "l.wang@university.edu",
        phone: "(555) 567-8901",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.8,
        experience: "18 years",
      },
      enrollment: {
        current: 60,
        max: 65,
        waitlist: 15,
        dropRate: "6%",
      },
      taPositions: {
        total: 4,
        filled: 3,
        pending: 7,
        deadline: "2024-01-30",
      },
      status: "Active",
      semester: "Fall 2024",
      credits: 4,
      schedule: {
        days: "MWF + Lab",
        time: "9:00-10:00 AM, Lab: T 2:00-5:00 PM",
        room: "Chemistry Building 101",
        capacity: 65,
      },
      prerequisites: ["None"],
      description: "Fundamental principles of chemistry including atomic structure, bonding, and reactions.",
      lastModified: "2024-01-14",
      priority: "High",
      budget: "$22,000",
      approvalStatus: "Approved",
      createdBy: "Dr. Wang",
      tags: ["Core", "Laboratory", "Science"],
      performance: {
        passRate: "91%",
        satisfaction: 4.7,
        difficulty: 3.5,
      },
    },
    {
      id: 6,
      code: "ENG 102",
      name: "Advanced Composition",
      department: "English",
      instructor: {
        name: "Prof. Jennifer Martinez",
        email: "j.martinez@university.edu",
        phone: "(555) 678-9012",
        avatar: "/placeholder.svg?height=40&width=40",
        rating: 4.5,
        experience: "10 years",
      },
      enrollment: {
        current: 28,
        max: 30,
        waitlist: 2,
        dropRate: "4%",
      },
      taPositions: {
        total: 1,
        filled: 1,
        pending: 2,
        deadline: "2024-02-15",
      },
      status: "Active",
      semester: "Fall 2024",
      credits: 3,
      schedule: {
        days: "MW",
        time: "3:00-4:30 PM",
        room: "Humanities 204",
        capacity: 30,
      },
      prerequisites: ["ENG 101"],
      description: "Advanced writing techniques, research methods, and critical analysis skills.",
      lastModified: "2024-01-11",
      priority: "Medium",
      budget: "$8,000",
      approvalStatus: "Approved",
      createdBy: "Prof. Martinez",
      tags: ["Writing", "Core", "Communication"],
      performance: {
        passRate: "95%",
        satisfaction: 4.3,
        difficulty: 3.8,
      },
    },
  ]

  const courseStats = [
    {
      title: "Total Courses",
      value: "156",
      change: "+8 this term",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Enrollment",
      value: "3,247",
      change: "+12% from last term",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "TA Positions",
      value: "342",
      change: "89% filled",
      icon: UserCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Approvals",
      value: "23",
      change: "5 urgent",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Active":
        return "default"
      case "Pending Approval":
        return "secondary"
      case "Draft":
        return "outline"
      case "Archived":
        return "outline"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getApprovalBadge = (status) => {
    const variants = {
      Approved: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      Pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      Rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" },
    }
    const config = variants[status] || variants.Pending
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
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

  const getEnrollmentStatus = (current, max, waitlist) => {
    const percentage = (current / max) * 100
    if (percentage >= 95) return { color: "text-red-600", status: "Full", bgColor: "bg-red-100" }
    if (percentage >= 85) return { color: "text-yellow-600", status: "Nearly Full", bgColor: "bg-yellow-100" }
    return { color: "text-green-600", status: "Available", bgColor: "bg-green-100" }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      <AdminSidebar activePage="Admin Course Management" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
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
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
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
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Course Management</h1>
            </div>
            <p className="text-muted-foreground">
              Comprehensive administrative control over all courses, instructors, and academic programs
            </p>
          </div>

          {/* Course Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {courseStats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Create Course Form */}
              {showCreateForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Course</CardTitle>
                    <CardDescription>
                      Add a new course to the academic catalog with full administrative details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                            <SelectItem value="English">English</SelectItem>
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
                            <SelectItem value="prof-martinez">Prof. Jennifer Martinez</SelectItem>
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
                        <Label htmlFor="maxEnrollment">Max Enrollment *</Label>
                        <Input id="maxEnrollment" type="number" placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taPositions">TA Positions *</Label>
                        <Input id="taPositions" type="number" placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Course Budget</Label>
                        <Input id="budget" placeholder="$15,000" />
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prerequisites">Prerequisites</Label>
                      <Input id="prerequisites" placeholder="e.g., CS 101, MATH 101" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Course Description</Label>
                      <Textarea id="description" placeholder="Enter detailed course description" rows={4} />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button variant="outline">Save as Draft</Button>
                      <Button>Create & Submit for Approval</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters and Search */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Courses</CardTitle>
                      <CardDescription>Comprehensive administrative view of all courses and programs</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending Approval">Pending</SelectItem>
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

                  {/* Enhanced Courses Table */}
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
                          <TableHead>TA Positions</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourses.map((course) => {
                          const enrollmentStatus = getEnrollmentStatus(
                            course.enrollment.current,
                            course.enrollment.max,
                            course.enrollment.waitlist,
                          )
                          return (
                            <TableRow key={course.id} className="hover:bg-muted/50">
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
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">{course.code}</div>
                                    {getPriorityBadge(course.priority)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{course.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {course.department} • {course.credits} credits • {course.semester}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {course.schedule.room} • {course.schedule.days} {course.schedule.time}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {course.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={course.instructor.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {course.instructor.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{course.instructor.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {course.instructor.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      {course.instructor.rating} • {course.instructor.experience}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${enrollmentStatus.color}`}>
                                      {course.enrollment.current}/{course.enrollment.max}
                                    </span>
                                    <Badge variant="outline" className={`text-xs ${enrollmentStatus.bgColor}`}>
                                      {enrollmentStatus.status}
                                    </Badge>
                                  </div>
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{
                                        width: `${(course.enrollment.current / course.enrollment.max) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                  {course.enrollment.waitlist > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {course.enrollment.waitlist} waitlisted
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    Drop rate: {course.enrollment.dropRate}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {course.taPositions.filled}/{course.taPositions.total}
                                    </span>
                                    <Badge
                                      variant={
                                        course.taPositions.filled === course.taPositions.total ? "default" : "secondary"
                                      }
                                    >
                                      {course.taPositions.filled === course.taPositions.total ? "Full" : "Open"}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {course.taPositions.pending} applications
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Deadline: {course.taPositions.deadline}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-green-600">{course.budget}</div>
                                  <div className="text-xs text-muted-foreground">Created by: {course.createdBy}</div>
                                  <div className="text-xs text-muted-foreground">Modified: {course.lastModified}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    Pass:{" "}
                                    <span className="font-medium text-green-600">{course.performance.passRate}</span>
                                  </div>
                                  <div className="text-sm flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{course.performance.satisfaction}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Difficulty: {course.performance.difficulty}/5
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge variant={getStatusBadgeVariant(course.status)}>{course.status}</Badge>
                                  {getApprovalBadge(course.approvalStatus)}
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
                                    <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Full Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Course
                                    </DropdownMenuItem>
                                    {course.approvalStatus === "Pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleApproveCourse(course.id)}>
                                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                          Approve Course
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRejectCourse(course.id)}>
                                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                          Reject Course
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Manage TA Assignments
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Users className="mr-2 h-4 w-4" />
                                      View Enrollment Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View TA Applications
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <BarChart3 className="mr-2 h-4 w-4" />
                                      Performance Analytics
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Course Settings
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
                  <CardDescription>Review and approve pending course submissions and modifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Course approval workflow coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Analytics</CardTitle>
                  <CardDescription>
                    Comprehensive analytics on course performance, enrollment trends, and resource utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced analytics dashboard coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>
                    Monitor and manage course budgets, resource allocation, and financial planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Budget management tools coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Administrative Reports</CardTitle>
                  <CardDescription>
                    Generate comprehensive reports for academic planning and institutional analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Report generation system coming soon...</p>
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
