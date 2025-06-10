"use client"

import { useState } from "react"
import {
  Users,
  BookOpen,
  UserCheck,
  FileText,
  Upload,
  Plus,
  Search,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "../components/scheduler-sidebar"

export default function TASchedulerDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for demonstration
  const stats = [
    {
      title: "Active Courses",
      value: "24",
      change: "+3 from last term",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "TA Positions",
      value: "48",
      change: "+12 new positions",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Applications",
      value: "156",
      change: "+23 this week",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Appointments",
      value: "42",
      change: "87% filled",
      icon: CheckCircle,
      color: "text-orange-600",
    },
  ]

  const recentActivity = [
    {
      action: "New application received",
      course: "CS 101 - Introduction to Programming",
      student: "Sarah Johnson",
      time: "2 hours ago",
      status: "pending",
    },
    {
      action: "TA appointed",
      course: "CS 201 - Data Structures",
      student: "Michael Chen",
      time: "4 hours ago",
      status: "completed",
    },
    {
      action: "Position posted",
      course: "CS 301 - Algorithms",
      student: "System",
      time: "1 day ago",
      status: "active",
    },
    {
      action: "Course updated",
      course: "CS 401 - Software Engineering",
      student: "Dr. Smith",
      time: "2 days ago",
      status: "completed",
    },
  ]

  const quickActions = [
    {
      title: "Add New Course",
      description: "Create or import courses for the upcoming term",
      icon: BookOpen,
      action: "add-course",
    },
    {
      title: "Create TA Position",
      description: "Define new TA roles and requirements",
      icon: Plus,
      action: "create-position",
    },
    {
      title: "Review Applications",
      description: "View and process student applications",
      icon: FileText,
      action: "review-apps",
    },
    {
      title: "Upload CSV Data",
      description: "Import previous TA appointment data",
      icon: Upload,
      action: "upload-csv",
    },
  ]

  const upcomingTasks = [
    {
      task: "Review pending applications",
      count: 12,
      priority: "high",
      dueDate: "Today",
    },
    {
      task: "Assign instructors to new courses",
      count: 5,
      priority: "medium",
      dueDate: "This week",
    },
    {
      task: "Post remaining TA positions",
      count: 8,
      priority: "medium",
      dueDate: "Next week",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses, students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-4 p-4 md:p-8">
          {/* Welcome Section */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
            <p className="text-muted-foreground">Here's what's happening with your TA scheduling system today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Quick Actions */}
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and management functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <action.icon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="col-span-full lg:col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Items that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.task}</p>
                        <p className="text-xs text-gray-500">{task.dueDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Activity */}
            <Card className="col-span-full lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and actions in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.status === "pending" && <Clock className="h-4 w-4 text-yellow-500 mt-1" />}
                        {activity.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500 mt-1" />}
                        {activity.status === "active" && <AlertCircle className="h-4 w-4 text-blue-500 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500 truncate">{activity.course}</p>
                        {activity.student !== "System" && (
                          <p className="text-xs text-gray-400">by {activity.student}</p>
                        )}
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="col-span-full lg:col-span-3">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Application Period</span>
                    <Badge variant="secondary">Open</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Term</span>
                    <span className="text-sm font-medium">Fall 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <span className="text-sm font-medium">127</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Last Updated</span>
                    <span className="text-sm text-gray-500">2 min ago</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Management Tools</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Instructors
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Overview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
