"use client"

import { useState, useEffect } from "react"
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
  ChevronUp,
  UserX,
  UserCheck,
  Building
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"

// API Configuration
const API_URL = 'http://localhost:8080'
const ADMIN_API = `${API_URL}/api/profile/admin`
const PROFILE_API = `${API_URL}/api/profile`

// Helper to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  }
  return {
    'Content-Type': 'application/json'
  }
}

// API Functions
const getAllUsers = async (userType = '') => {
  try {
    // Use the correct API endpoint with proper prefix
    const url = `${PROFILE_API}/users/${userType ? `?user_type=${userType}` : ''}`
    console.log('Fetching users from:', url) // Debug log
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    throw error
  }
}

const createInstructor = async (instructorData) => {
  try {
    const response = await fetch(`${ADMIN_API}/create-instructor/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(instructorData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create Instructor Error:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in createInstructor:', error)
    throw error
  }
}

const createScheduler = async (schedulerData) => {
  try {
    const response = await fetch(`${ADMIN_API}/create-scheduler/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(schedulerData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create Scheduler Error:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in createScheduler:', error)
    throw error
  }
}

const createAdmin = async (adminData) => {
  try {
    const response = await fetch(`${ADMIN_API}/create-admin/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adminData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create Admin Error:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in createAdmin:', error)
    throw error
  }
}

const updateUser = async (updateData) => {
  try {
    const response = await fetch(`${ADMIN_API}/user-management/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Update User Error:', errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in updateUser:', error)
    throw error
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewEditDialog, setShowViewEditDialog] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createType, setCreateType] = useState('instructor')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    name: '', // For admin creation
    email: '',
    employee_number: '',
    department: ''
  })

  const departments = [
    { code: 'cosc', name: 'Computer Science' },
    { code: 'math', name: 'Mathematics' },
    { code: 'phy', name: 'Physics' },
    { code: 'astr', name: 'Astronomy' },
    { code: 'data', name: 'Data Science' },
    { code: 'stat', name: 'Statistics' }
  ]

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users when search term or filters change
  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getAllUsers()
      if (response.success) {
        setUsers(response.data.users)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Error fetching users: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.type === roleFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(user => user.is_active === isActive)
    }

    // Filter by search term
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    try {
      // Validation based on user type
      if (createType === 'admin') {
        if (!formData.name || !formData.email || !formData.employee_number) {
          alert('Please fill in all required fields (Name, Email, Employee Number)')
          return
        }
      } else {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.employee_number || !formData.department) {
          alert('Please fill in all fields')
          return
        }
      }

      setLoading(true)
      
      let response
      if (createType === 'instructor') {
        response = await createInstructor(formData)
      } else if (createType === 'scheduler') {
        response = await createScheduler(formData)
      } else if (createType === 'admin') {
        // For admin, we only need name, email, and employee_number
        const adminData = {
          name: formData.name,
          email: formData.email,
          employee_number: formData.employee_number
        }
        response = await createAdmin(adminData)
      }

      if (response.success) {
        setShowCreateForm(false)
        setFormData({
          first_name: '',
          last_name: '',
          name: '',
          email: '',
          employee_number: '',
          department: ''
        })
        fetchUsers() // Refresh the user list
        
        const userTypeLabel = createType === 'instructor' ? 'Instructor' : 
                             createType === 'scheduler' ? 'TA Scheduler' : 'Admin'
        alert(`${userTypeLabel} created successfully!\nTemporary password: ${response.data.temporary_password}`)
      } else {
        alert('Error creating user: ' + response.message)
      }
    } catch (err) {
      alert('Error creating user: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToCoordinator = async (user) => {
    if (user.type !== 'instructor') {
      alert('Only instructors can be promoted to TA coordinators')
      return
    }

    try {
      // Create a scheduler record with the same details as the instructor
      const schedulerData = {
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' '),
        email: user.email,
        employee_number: user.id,
        department: getDepartmentCode(user.department)
      }

      const response = await createScheduler(schedulerData)
      if (response.success) {
        alert(`${user.name} has been promoted to TA Coordinator!`)
        fetchUsers()
      } else {
        alert('Error promoting user: ' + response.message)
      }
    } catch (err) {
      alert('Error promoting user: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDeactivateUser = async (user) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      try {
        const response = await updateUser({
          action: 'deactivate',
          user_type: user.type,
          user_id: user.id
        })

        if (response.success) {
          alert(`${user.name} has been deactivated`)
          fetchUsers()
        } else {
          alert('Error deactivating user: ' + response.message)
        }
      } catch (err) {
        alert('Error deactivating user: ' + (err.message || 'Unknown error'))
      }
    }
  }

  const handleReactivateUser = async (user) => {
    if (window.confirm(`Are you sure you want to reactivate ${user.name}?`)) {
      try {
        const response = await updateUser({
          action: 'reactivate',
          user_type: user.type,
          user_id: user.id
        })

        if (response.success) {
          alert(`${user.name} has been reactivated`)
          fetchUsers()
        } else {
          alert('Error reactivating user: ' + response.message)
        }
      } catch (err) {
        alert('Error reactivating user: ' + (err.message || 'Unknown error'))
      }
    }
  }

  const getDepartmentCode = (departmentName) => {
    const dept = departments.find(d => d.name === departmentName)
    return dept ? dept.code : 'cosc'
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'instructor':
        return <User className="h-4 w-4 text-purple-600" />
      case 'scheduler':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'student':
        return <GraduationCap className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'instructor':
        return 'default'
      case 'scheduler':
        return 'secondary'
      case 'student':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (type) => {
    const labels = {
      admin: 'Admin',
      scheduler: 'TA Coordinator',
      instructor: 'Instructor',
      student: 'Student'
    }
    return labels[type] || type
  }

  // Calculate user stats
  const userStats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      change: `${filteredUsers.length} shown`,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Students',
      value: users.filter(u => u.type === 'student').length.toString(),
      change: `${((users.filter(u => u.type === 'student').length / users.length) * 100 || 0).toFixed(1)}% of total`,
      icon: GraduationCap,
      color: 'text-green-600',
    },
    {
      title: 'Instructors',
      value: users.filter(u => u.type === 'instructor').length.toString(),
      change: `${((users.filter(u => u.type === 'instructor').length / users.length) * 100 || 0).toFixed(1)}% of total`,
      icon: User,
      color: 'text-purple-600',
    },
    {
      title: 'TA Coordinators',
      value: users.filter(u => u.type === 'scheduler').length.toString(),
      change: `${((users.filter(u => u.type === 'scheduler').length / users.length) * 100 || 0).toFixed(1)}% of total`,
      icon: Calendar,
      color: 'text-blue-600',
    },
  ]

  if (loading && users.length === 0) {
    return (
      <SidebarProvider>
        <AdminSidebar activePage="User Management" />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
            <p className="text-muted-foreground">Manage instructors, TA coordinators, and other users</p>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

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

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage and monitor all system users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name, email, or ID..."
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
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="instructor">Instructors</SelectItem>
                    <SelectItem value="scheduler">TA Coordinators</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={`${user.type}-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.type)}
                          <Badge variant={getRoleBadgeVariant(user.type)}>{getRoleLabel(user.type)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{user.department || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setFormData({
                                first_name: user.first_name || '',
                                last_name: user.last_name || '',
                                name: user.name || '',
                                email: user.email || '',
                                employee_number: user.id.toString(), // assuming this is employee/student number
                                department: getDepartmentCode(user.department || '')
                              })
                              setIsEditMode(false)
                              setShowViewEditDialog(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setFormData({
                                first_name: user.first_name || '',
                                last_name: user.last_name || '',
                                name: user.name || '',
                                email: user.email || '',
                                employee_number: user.id.toString(),
                                department: getDepartmentCode(user.department || '')
                              })
                              setIsEditMode(true)
                              setShowViewEditDialog(true)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {user.type === 'instructor' && user.is_active && (
                              <DropdownMenuItem onClick={() => handlePromoteToCoordinator(user)}>
                                <ChevronUp className="mr-2 h-4 w-4" />
                                Promote to TA Coordinator
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.is_active && user.type !== 'admin' ? (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeactivateUser(user)}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            ) : !user.is_active && user.type !== 'admin' && (
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => handleReactivateUser(user)}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Create User Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                Create New {createType === 'instructor' ? 'Instructor' : 
                           createType === 'scheduler' ? 'TA Scheduler' : 'Admin'}
              </DialogTitle>
              <DialogDescription>
                Add a new {createType === 'instructor' ? 'instructor' : 
                          createType === 'scheduler' ? 'TA scheduler' : 'admin'} to the system
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={createType === 'instructor' ? 'default' : 'outline'}
                  onClick={() => setCreateType('instructor')}
                  size="sm"
                >
                  Instructor
                </Button>
                <Button
                  type="button"
                  variant={createType === 'scheduler' ? 'default' : 'outline'}
                  onClick={() => setCreateType('scheduler')}
                  size="sm"
                >
                  TA Scheduler
                </Button>
                <Button
                  type="button"
                  variant={createType === 'admin' ? 'default' : 'outline'}
                  onClick={() => setCreateType('admin')}
                  size="sm"
                >
                  Admin
                </Button>
              </div>

              {createType === 'admin' ? (
                // Admin form fields
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                      placeholder="Enter employee number"
                    />
                  </div>
                </>
              ) : (
                // Instructor/Scheduler form fields
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                      placeholder="Enter employee number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.code} value={dept.code}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}