"use client"

import { useState } from "react"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  GraduationCap,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AdminSidebar } from "../components/admin-dashboard-sidebar"

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    studentId: "",
    department: "",
  })

  // Mock user data
  const users = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@university.edu",
      role: "student",
      department: "Computer Science",
      studentId: "12345678",
      status: "active",
      lastLogin: "2024-01-15",
      created: "2023-09-01",
    },
    {
      id: 2,
      name: "Dr. Robert Smith",
      email: "robert.smith@university.edu",
      role: "instructor",
      department: "Computer Science",
      studentId: null,
      status: "active",
      lastLogin: "2024-01-14",
      created: "2020-08-15",
    },
    {
      id: 3,
      name: "Admin User",
      email: "admin@university.edu",
      role: "ta_scheduler",
      department: "Administration",
      studentId: null,
      status: "active",
      lastLogin: "2024-01-15",
      created: "2019-01-01",
    },
    {
      id: 4,
      name: "System Admin",
      email: "sysadmin@university.edu",
      role: "admin",
      department: "IT",
      studentId: null,
      status: "active",
      lastLogin: "2024-01-15",
      created: "2019-01-01",
    },
    {
      id: 5,
      name: "John Doe",
      email: "john.doe@university.edu",
      role: "student",
      department: "Mathematics",
      studentId: "87654321",
      status: "inactive",
      lastLogin: "2023-12-20",
      created: "2023-09-01",
    },
  ]

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-red-600" />
      case "ta_scheduler":
        return <UserCheck className="h-4 w-4 text-purple-600" />
      case "instructor":
        return <GraduationCap className="h-4 w-4 text-green-600" />
      case "student":
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleBadge = (role) => {
    const variants = {
      admin: "destructive",
      ta_scheduler: "default",
      instructor: "secondary",
      student: "outline",
    }
    return (
      <Badge variant={variants[role]} className="capitalize">
        {role.replace("_", " ")}
      </Badge>
    )
  }

  const getStatusBadge = (status) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleCreateUser = (e) => {
    e.preventDefault()
    console.log("Creating user:", newUser)
    // Here you would typically make an API call
    alert("User created successfully!")
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
      studentId: "",
      department: "",
    })
    setShowCreateForm(false)
  }

  const handleDeleteUser = (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      console.log("Deleting user:", userId)
      alert("User deleted successfully!")
    }
  }

  const userStats = [
    { role: "Students", count: users.filter((u) => u.role === "student").length, color: "text-blue-600" },
    { role: "Instructors", count: users.filter((u) => u.role === "instructor").length, color: "text-green-600" },
    { role: "TA Schedulers", count: users.filter((u) => u.role === "ta_scheduler").length, color: "text-purple-600" },
    { role: "Admins", count: users.filter((u) => u.role === "admin").length, color: "text-red-600" },
  ]

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
                <BreadcrumbPage>User Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Page Title */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage all system users and their permissions</p>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {userStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.role}</CardTitle>
                  <Users className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
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
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <select
                        id="role"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="ta_scheduler">TA Scheduler</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        value={newUser.department}
                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {newUser.role === "student" && (
                    <div>
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={newUser.studentId}
                        onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                        placeholder="8-digit student number"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit">Create User</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage existing users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                  <option value="ta_scheduler">TA Schedulers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getRoleIcon(user.role)}
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.studentId && (
                              <div className="text-xs text-muted-foreground">ID: {user.studentId}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
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
