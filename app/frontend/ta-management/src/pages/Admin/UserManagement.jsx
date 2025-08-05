"use client"

import { useState, useEffect } from "react"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Shield,
  GraduationCap,
  Calendar,
  User,
  ChevronUp,
  UserX,
  UserCheck,
  Building,
  AlertCircle,
  Loader2,
  CheckCircle
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
import { Alert, AlertDescription } from "@/components/ui/alert"
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
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return data
  } catch (error) {
    console.error(`API Request failed for ${url}:`, error)
    throw error
  }
}

const getAllUsers = async (userType = '') => {
  const queryParam = userType ? `?user_type=${userType}` : ''
  const data = await apiRequest(`${PROFILE_API}/users/${queryParam}`)
  return data
}

const getDepartments = async () => {
  try {
    const data = await apiRequest(`${PROFILE_API}/departments/`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching departments:', error)
    return []
  }
}

const createUser = async (userData, userType) => {
  const endpoints = {
    instructor: `${ADMIN_API}/create-instructor/`,
    scheduler: `${ADMIN_API}/create-scheduler/`,
    admin: `${ADMIN_API}/create-admin/`
  }
  
  const data = await apiRequest(endpoints[userType], {
    method: 'POST',
    body: JSON.stringify(userData)
  })
  return data
}

const updateUser = async (updateData) => {
  const data = await apiRequest(`${ADMIN_API}/user-management/`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  })
  return data
}

// Department mapping functions - matching scheduler dashboard approach
function getDepartmentFromCourseName(course_info) {
  if (!course_info) return 'Other';
  const firstWord = course_info.split(' ')[0].toUpperCase();
  
  // Map variations to standard department names
  const departmentMap = {
    'COSC': 'Computer Science',
    'MATH': 'Mathematics', 
    'MATHS': 'Mathematics',
    'STAT': 'Statistics',
    'PHYS': 'Physics',
    'DATA': 'Data Science',
    'PSYO': 'Psychology',
    'BIOL': 'Biology',
    'CHEM': 'Chemistry',
    'ENGR': 'Engineering',
  };
  
  return departmentMap[firstWord] || 'Other';
}

// Function to get standard department name from various formats
function getStandardDepartmentName(departmentInput) {
  if (!departmentInput) return 'Other';
  
  // If it's already a standard name, return it
  const standardNames = [
    'Computer Science', 'Mathematics', 'Statistics', 'Physics', 
    'Data Science', 'Psychology', 'Biology', 'Chemistry', 'Engineering'
  ];
  
  if (standardNames.includes(departmentInput)) {
    return departmentInput;
  }
  
  // Try to parse it as a course name
  return getDepartmentFromCourseName(departmentInput);
}

// Department code mappings for backend API calls
const DEPARTMENT_MAPPINGS = {
  'Computer Science': 'cosc',
  'Mathematics': 'math',
  'Physics': 'phy',
  'Data Science': 'data',
  'Statistics': 'stat',
  'Psychology': 'psyo',
  'Biology': 'biol',
  'Chemistry': 'chem',
  'Engineering': 'engr'
}

const getDepartmentCode = (departmentName) => {
  return DEPARTMENT_MAPPINGS[departmentName] || null
}

export default function UserManagement() {
  // State management
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewEditDialog, setShowViewEditDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [createType, setCreateType] = useState('instructor')
  const [createdUserData, setCreatedUserData] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    name: '',
    email: '',
    employee_number: '',
    department: ''
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Filter users when dependencies change
  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter])

  const loadInitialData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const [usersData, departmentsData] = await Promise.all([
        getAllUsers(),
        getDepartments()
      ])
      
      if (usersData.success) {
        // Process users to standardize department names
        const processedUsers = (usersData.data.users || []).map(user => ({
          ...user,
          department: user.department ? getStandardDepartmentName(user.department) : 'Other'
        }));
        setUsers(processedUsers)
      } else {
        throw new Error(usersData.message || 'Failed to fetch users')
      }
      
      // Filter departments to only supported ones and standardize names
      const supportedDepartments = departmentsData
        .map(dept => ({
          ...dept,
          name: getStandardDepartmentName(dept.name)
        }))
        .filter(dept => Object.keys(DEPARTMENT_MAPPINGS).includes(dept.name))
        // Remove duplicates that might occur after standardization
        .reduce((unique, dept) => {
          const exists = unique.find(u => u.name === dept.name);
          if (!exists) {
            unique.push(dept);
          }
          return unique;
        }, []);
      
      setDepartments(supportedDepartments)
      
    } catch (err) {
      setError(err.message || 'Failed to load data')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

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
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id?.toString().toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }

  const resetFormData = () => {
    setFormData({
      first_name: '',
      last_name: '',
      name: '',
      email: '',
      employee_number: '',
      department: ''
    })
  }

  const validateCreateForm = () => {
    if (createType === 'admin') {
      return formData.name && formData.email && formData.employee_number
    } else {
      return formData.first_name && formData.last_name && formData.email && 
             formData.employee_number && formData.department
    }
  }

  const handleCreateUser = async () => {
    if (!validateCreateForm()) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      let userData = { ...formData }
      
      if (createType !== 'admin') {
        // Convert department ID to department code for backend
        const selectedDept = departments.find(d => d.id.toString() === formData.department)
        if (!selectedDept) {
          throw new Error('Please select a valid department')
        }
        
        const departmentCode = getDepartmentCode(selectedDept.name)
        if (!departmentCode) {
          throw new Error(`Department "${selectedDept.name}" is not supported`)
        }
        
        userData.department = departmentCode
      }

      const response = await createUser(userData, createType)
      
      if (response.success) {
        setShowCreateForm(false)
        resetFormData()
        
        // Set up success dialog data
        const userTypeLabel = createType === 'instructor' ? 'Instructor' : 
                             createType === 'scheduler' ? 'TA Scheduler' : 'Admin'
        setCreatedUserData({
          name: createType === 'admin' ? formData.name : `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          userType: userTypeLabel
        })
        setShowSuccessDialog(true)
        
        await loadInitialData() // Refresh user list
      } else {
        throw new Error(response.message || 'Failed to create user')
      }
    } catch (err) {
      setError(err.message || 'Failed to create user')
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setLoading(true)
    setError('')

    try {
      const updateData = {
        action: 'modify',
        user_type: selectedUser.type,
        user_id: selectedUser.id,
        update_data: {
          email: formData.email,
          employee_number: formData.employee_number,
          ...(selectedUser.type === 'admin' 
            ? { name: formData.name }
            : { 
                first_name: formData.first_name,
                last_name: formData.last_name,
                department: formData.department ? parseInt(formData.department) : null
              }
          )
        }
      }

      const response = await updateUser(updateData)
      
      if (response.success) {
        setShowViewEditDialog(false)
        await loadInitialData() // Refresh user list
        alert('User updated successfully!')
      } else {
        throw new Error(response.message || 'Failed to update user')
      }
    } catch (err) {
      setError(err.message || 'Failed to update user')
      console.error('Error updating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (user, action) => {
    const actionText = action === 'deactivate' ? 'deactivate' : 'reactivate'
    
    if (!window.confirm(`Are you sure you want to ${actionText} ${user.name}?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await updateUser({
        action,
        user_type: user.type,
        user_id: user.id
      })

      if (response.success) {
        await loadInitialData() // Refresh user list
        alert(`${user.name} has been ${actionText}d successfully`)
      } else {
        throw new Error(response.message || `Failed to ${actionText} user`)
      }
    } catch (err) {
      setError(err.message || `Failed to ${actionText} user`)
      console.error(`Error ${actionText}ing user:`, err)
    } finally {
      setLoading(false)
    }
  }

  const openViewDialog = (user) => {
    setSelectedUser(user)
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      name: user.name || '',
      email: user.email || '',
      employee_number: user.id?.toString() || '',
      department: user.department ? getDepartmentIdFromName(user.department) : ''
    })
    setIsEditMode(false)
    setShowViewEditDialog(true)
  }

  const openEditDialog = (user) => {
    setSelectedUser(user)
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      name: user.name || '',
      email: user.email || '',
      employee_number: user.id?.toString() || '',
      department: user.department ? getDepartmentIdFromName(user.department) : ''
    })
    setIsEditMode(true)
    setShowViewEditDialog(true)
  }

  // Helper functions
  const getDepartmentIdFromName = (departmentName) => {
    const standardName = getStandardDepartmentName(departmentName)
    const dept = departments.find(d => d.name === standardName)
    return dept ? dept.id.toString() : ''
  }

  const getRoleIcon = (role) => {
    const icons = {
      admin: <Shield className="h-4 w-4 text-red-600" />,
      instructor: <User className="h-4 w-4 text-purple-600" />,
      scheduler: <Calendar className="h-4 w-4 text-blue-600" />,
      student: <GraduationCap className="h-4 w-4 text-green-600" />
    }
    return icons[role] || <User className="h-4 w-4 text-gray-400" />
  }

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'destructive',
      instructor: 'default',
      scheduler: 'secondary',
      student: 'outline'
    }
    return variants[role] || 'outline'
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
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
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
            <Button onClick={() => setShowCreateForm(true)} disabled={loading}>
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                    disabled={loading}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter} disabled={loading}>
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
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
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
              <div className="rounded-md border">
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
                                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                              <div className="text-xs text-muted-foreground">ID: {user.id || 'N/A'}</div>
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
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openViewDialog(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_active ? (
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleUserAction(user, 'deactivate')}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  className="text-green-600"
                                  onClick={() => handleUserAction(user, 'reactivate')}
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

                {loading && (
                  <div className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500">Loading...</p>
                  </div>
                )}
              </div>
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
              {/* User Type Selection */}
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={createType === 'instructor' ? 'default' : 'outline'}
                  onClick={() => setCreateType('instructor')}
                  size="sm"
                  disabled={loading}
                >
                  Instructor
                </Button>
                <Button
                  type="button"
                  variant={createType === 'scheduler' ? 'default' : 'outline'}
                  onClick={() => setCreateType('scheduler')}
                  size="sm"
                  disabled={loading}
                >
                  TA Scheduler
                </Button>
                <Button
                  type="button"
                  variant={createType === 'admin' ? 'default' : 'outline'}
                  onClick={() => setCreateType('admin')}
                  size="sm"
                  disabled={loading}
                >
                  Admin
                </Button>
              </div>

              {/* Form Fields */}
              {createType === 'admin' ? (
                // Admin form fields
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                      placeholder="Enter employee number"
                      disabled={loading}
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
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Enter last name"
                        disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                      placeholder="Enter employee number"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={departments.length === 0 ? "No departments available" : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 ? (
                          <SelectItem value="" disabled>
                            No supported departments found
                          </SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false)
                  resetFormData()
                  setError('')
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={loading || !validateCreateForm()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View/Edit User Dialog */}
        <Dialog open={showViewEditDialog} onOpenChange={setShowViewEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit User" : "User Details"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update user information below" : "User information (read-only)"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name Fields */}
              {selectedUser?.type === 'admin' ? (
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    disabled={!isEditMode || loading}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={formData.first_name}
                      disabled={!isEditMode || loading}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.last_name}
                      disabled={!isEditMode || loading}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  disabled={!isEditMode || loading}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Employee Number */}
              <div className="space-y-2">
                <Label>Employee Number</Label>
                <Input
                  value={formData.employee_number}
                  disabled={!isEditMode || loading}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                />
              </div>

              {/* Department (not for admin) */}
              {selectedUser?.type !== 'admin' && (
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    disabled={!isEditMode || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={departments.length === 0 ? "No departments available" : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <SelectItem value="" disabled>
                          No supported departments found
                        </SelectItem>
                      ) : (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowViewEditDialog(false)
                  setError('')
                }}
                disabled={loading}
              >
                Close
              </Button>
              {isEditMode && (
                <Button onClick={handleEditUser} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                {createdUserData?.userType} Added
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                <strong>{createdUserData?.name}</strong> has been successfully added as a {createdUserData?.userType?.toLowerCase()}.
              </p>
              <p className="mt-2 text-muted-foreground">
                An email with their account details and a temporary password has been sent to <strong>{createdUserData?.email}</strong>.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccessDialog(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}