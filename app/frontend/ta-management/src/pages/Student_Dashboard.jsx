"use client"

import { useState } from "react"
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppSidebar } from "../components/student-dashboard-sidebar"


// Mock data
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "SJ2024001",
  major: "Computer Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=40&width=40",
}

const submittedApplications = [
  {
    id: 1,
    course: "CS 101 - Introduction to Programming",
    professor: "Dr. Smith",
    status: "Under Review",
    appliedDate: "2024-01-15",
    deadline: "2024-01-20",
  },
  {
    id: 2,
    course: "CS 201 - Data Structures",
    professor: "Dr. Johnson",
    status: "Accepted",
    appliedDate: "2024-01-10",
    deadline: "2024-01-15",
  },
  {
    id: 3,
    course: "CS 301 - Algorithms",
    professor: "Dr. Brown",
    status: "Rejected",
    appliedDate: "2024-01-05",
    deadline: "2024-01-10",
  },
]

const openPositions = [
  {
    id: 4,
    course: "CS 102 - Programming Fundamentals",
    professor: "Dr. Wilson",
    deadline: "2024-02-01",
    requirements: "Previous TA experience preferred",
    hours: "10 hrs/week",
  },
  {
    id: 5,
    course: "CS 250 - Computer Organization",
    professor: "Dr. Davis",
    deadline: "2024-02-05",
    requirements: "Strong understanding of computer architecture",
    hours: "15 hrs/week",
  },
  {
    id: 6,
    course: "CS 350 - Software Engineering",
    professor: "Dr. Miller",
    deadline: "2024-02-10",
    requirements: "Experience with software development projects",
    hours: "12 hrs/week",
  },
]

const upcomingDeadlines = [
  {
    course: "Winter Session 2025-2026 TA Applications",
    deadline: "2024-04-30",
    daysLeft: 39,
  },
  {
    course: "Summer Session 2025 TA Applications",
    deadline: "2024-03-31",
    daysLeft: 9,
  },
]

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "#",
    isActive: true,
  },
  {
    title: "My Applications",
    icon: FileText,
    url: "#",
  },
  {
    title: "Available Positions",
    icon: BookOpen,
    url: "#",
  },
  {
    title: "Schedule",
    icon: Calendar,
    url: "#",
  },
  {
    title: "Profile",
    icon: User,
    url: "#",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "#",
  },
]

/*
function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-semibold">Student</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={studentProfile.avatar || "/placeholder.svg"} alt={studentProfile.name} />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{studentProfile.name}</span>
            <span className="text-xs text-muted-foreground">{studentProfile.major}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
*/


function getStatusBadge(status) {
  switch (status) {
    case "Accepted":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
    case "Rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    case "Under Review":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Under Review</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOpenPositions = openPositions.filter(
    (position) =>
      position.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.professor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Student Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={studentProfile.avatar || "/placeholder.svg"} alt={studentProfile.name} />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {studentProfile.name}!</h2>
                <p className="text-muted-foreground">Here's your TA application overview</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submittedApplications.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {submittedApplications.filter((app) => app.status === "Accepted").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {submittedApplications.filter((app) => app.status === "Under Review").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{openPositions.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={studentProfile.avatar || "/placeholder.svg"} alt={studentProfile.name} />
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{studentProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">{studentProfile.major}</p>
                      <p className="text-sm text-muted-foreground">{studentProfile.year}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">GPA: {studentProfile.gpa}</span>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Don't miss these application deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{deadline.course}</p>
                          <p className="text-sm text-muted-foreground">Deadline: {deadline.deadline}</p>
                        </div>
                        <Badge variant={deadline.daysLeft <= 7 ? "destructive" : "secondary"}>
                          {deadline.daysLeft} days left
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Applications */}
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track the status of your submitted applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.course}</TableCell>
                        <TableCell>{application.professor}</TableCell>
                        <TableCell>{application.appliedDate}</TableCell>
                        <TableCell>{application.deadline}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Available Positions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Available TA Positions</CardTitle>
                    <CardDescription>Open positions you can apply for</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search positions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Hours/Week</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Requirements</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpenPositions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">{position.course}</TableCell>
                        <TableCell>{position.professor}</TableCell>
                        <TableCell>{position.hours}</TableCell>
                        <TableCell>{position.deadline}</TableCell>
                        <TableCell className="max-w-xs truncate">{position.requirements}</TableCell>
                        <TableCell>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
