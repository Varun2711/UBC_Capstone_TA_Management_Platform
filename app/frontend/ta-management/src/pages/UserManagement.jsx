"use client"

import { useState } from "react"
import {
  Users,
  UserPlus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  GraduationCap,
  Calendar,
  User,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { AdminSidebar } from "../components/admin-dashboard-sidebar"

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Mock user data
  const users = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@university.edu",
      role: "Student",
      status: "Active",
      lastLogin: "2 hours ago",
      joinDate: "2023-08-15",
      avatar: "/placeholder.svg",
    },
    {
      id: 2,
      name: "Dr. Michael Smith",
      email: "m.smith@university.edu",
      role: "Instructor",
      status: "Active",
      lastLogin: "1 day ago",
      joinDate: "2022-01-10",
      avatar: "/placeholder.svg",
    },
    {
      id: 3,
      name: "Emily Chen",
      email: "e.chen@university.edu",
      role: "TA Scheduler",
      status: "Active",
      lastLogin: "30 minutes ago",
      joinDate: "2023-03-22",
      avatar: "/placeholder.svg",
    },
    {
      id: 4,
      name: "Admin User",
      email: "admin@university.edu",
      role: "Admin",
      status: "Active",
      lastLogin: "5 minutes ago",
      joinDate: "2021-09-01",
      avatar: "/placeholder.svg",
    },
    {
      id: 5,
      name: "John Doe",
      email: "j.doe@university.edu",
      role: "Student",
      status: "Inactive",
      lastLogin: "2 weeks ago",
      joinDate: "2023-09-01",
      avatar: "/placeholder.svg",
    },
  ]

  const userStats = [
    {
      title: "Total Users",
      value: "1,247",
      change: "+23 this week",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: "1,089",
      change: "87.3% of total",
      icon: GraduationCap,
      color: "text-green-600",
    },
    {
      title: "Instructors",
      value: "124",
      change: "9.9% of total",
      icon: User,
      color: "text-purple-600",
    },
    {
      title: "Admins",
      value: "34",
      change: "2.8% of total",
      icon: Shield,
      color: "text-red-600",
    },
  ]

  const getRoleIcon = (role) => {
    switch (role) {
      case "Admin":
        return <Shield className="h-4 w-4 text-red-600" />
      case "Instructor":
        return <User className="h-4 w-4 text-purple-600" />
      case "TA Scheduler":
        return <Calendar className="h-4 w-4 text-blue-600" />
      case "Student":
        return <GraduationCap className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "Admin":
        return "destructive"
      case "Instructor":
        return "default"
      case "TA Scheduler":
        return "secondary"
      case "Student":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <SidebarProvider>
      <AdminSidebar activePage="User Management" />
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
                <BreadcrumbPage>User Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
            </div>
            <p className="text-muted-foreground">Manage all system users, roles, and permissions</p>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {userStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>Add a new user to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="ta-scheduler">TA Scheduler</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">Computer Science</SelectItem>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button>Create User</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage and monitor all system users</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Student">Students</SelectItem>
                    <SelectItem value="Instructor">Instructors</SelectItem>
                    <SelectItem value="TA Scheduler">TA Schedulers</SelectItem>
                    <SelectItem value="Admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
