"use client"

import { useState } from "react"
import {
  Bell,
  Users,
  BookOpen,
  FileText,
  UserCheck,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSidebar } from "../components/admin-dashboard-sidebar"

export default function AdminDashboard() {
  const [selectedView, setSelectedView] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data - comprehensive system overview
  const systemStats = [
    {
      title: "Total Users",
      value: "1,247",
      change: "+23 this week",
      icon: Users,
      color: "text-blue-600",
      trend: "up",
    },
    {
      title: "Active Courses",
      value: "156",
      change: "+8 this term",
      icon: BookOpen,
      color: "text-green-600",
      trend: "up",
    },
    {
      title: "TA Positions",
      value: "342",
      change: "89% filled",
      icon: UserCheck,
      color: "text-purple-600",
      trend: "stable",
    },
    {
      title: "Pending Applications",
      value: "89",
      change: "-12 from yesterday",
      icon: FileText,
      color: "text-orange-600",
      trend: "down",
    },
  ]

  const userBreakdown = [
    { role: "Students", count: 1089, percentage: 87.3, color: "bg-blue-500" },
    { role: "Instructors", count: 124, percentage: 9.9, color: "bg-green-500" },
    { role: "TA Schedulers", count: 28, percentage: 2.2, color: "bg-purple-500" },
    { role: "Admins", count: 7, percentage: 0.5, color: "bg-red-500" },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "New user registration",
      user: "Sarah Johnson",
      role: "Student",
      timestamp: "2 minutes ago",
      status: "completed",
    },
    {
      id: 2,
      action: "Course created",
      user: "Dr. Smith",
      role: "Instructor",
      timestamp: "15 minutes ago",
      status: "completed",
    },
    {
      id: 3,
      action: "TA position posted",
      user: "Admin User",
      role: "TA Scheduler",
      timestamp: "1 hour ago",
      status: "completed",
    },
    {
      id: 4,
      action: "System backup",
      user: "System",
      role: "Automated",
      timestamp: "2 hours ago",
      status: "completed",
    },
    {
      id: 5,
      action: "Failed login attempt",
      user: "Unknown",
      role: "N/A",
      timestamp: "3 hours ago",
      status: "warning",
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Application Volume",
      message: "TA applications are 40% higher than usual this week",
      timestamp: "1 hour ago",
    },
    {
      id: 2,
      type: "info",
      title: "Scheduled Maintenance",
      message: "System maintenance scheduled for Sunday 2:00 AM",
      timestamp: "2 hours ago",
    },
    {
      id: 3,
      type: "success",
      title: "Backup Completed",
      message: "Daily system backup completed successfully",
      timestamp: "3 hours ago",
    },
  ]

  const pendingActions = [
    {
      id: 1,
      action: "Review new instructor applications",
      count: 5,
      priority: "high",
      dueDate: "Today",
    },
    {
      id: 2,
      action: "Approve course modifications",
      count: 12,
      priority: "medium",
      dueDate: "This week",
    },
    {
      id: 3,
      action: "Update system configurations",
      count: 3,
      priority: "low",
      dueDate: "Next week",
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "info":
        return <Bell className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePage="Dashboard" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>System Administration</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users, courses, logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Quick Actions */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Welcome Section */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Administration</h1>
            </div>
            <p className="text-muted-foreground">Complete system overview and management controls</p>
          </div>

          {/* System Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {systemStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* User Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown by user role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userBreakdown.map((user, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${user.color}`}></div>
                        <span className="text-sm font-medium">{user.role}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{user.count}</div>
                        <div className="text-xs text-muted-foreground">{user.percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${user.color}`} style={{ width: `${user.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Recent system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
                <CardDescription>Items requiring admin attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium">{action.action}</p>
                          <p className="text-xs text-muted-foreground">{action.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              action.priority === "high"
                                ? "destructive"
                                : action.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {action.count}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent System Activity</CardTitle>
                  <CardDescription>Latest user actions and system events</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.action}</TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{activity.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(activity.status)}
                          <span className="capitalize text-sm">{activity.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Management Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Management Tools</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <Plus className="h-6 w-6" />
                  <span>Create User</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <BookOpen className="h-6 w-6" />
                  <span>Manage Courses</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <Settings className="h-6 w-6" />
                  <span>System Settings</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-transparent" variant="outline">
                  <FileText className="h-6 w-6" />
                  <span>Generate Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
