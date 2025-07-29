"use client"

import { useState, useEffect } from "react"
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
  GraduationCap,
  Activity,
  Database,
  Server,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"
import { getAdminDashboard } from "@/logic/admin"

// Mock data for system statistics
const mockSystemStats = {
  system_health: 98.5,
  active_sessions: 147,
  database_size: "2.4 GB",
  server_uptime: "15 days, 7 hours",
  total_requests_today: 8924,
  average_response_time: "120ms"
}

const mockAuditLogs = [
  {
    id: 1,
    timestamp: "2024-01-29 14:30:25",
    user: "admin@school.edu",
    action: "User Created",
    details: "Created new instructor account for John Smith",
    severity: "info"
  },
  {
    id: 2,
    timestamp: "2024-01-29 13:45:12",
    user: "scheduler@school.edu",
    action: "Schedule Modified",
    details: "Updated CS101 class schedule",
    severity: "info"
  },
  {
    id: 3,
    timestamp: "2024-01-29 12:20:08",
    user: "system",
    action: "Security Alert",
    details: "Multiple failed login attempts detected",
    severity: "warning"
  },
  {
    id: 4,
    timestamp: "2024-01-29 11:15:44",
    user: "admin@school.edu",
    action: "Permission Changed",
    details: "Updated role permissions for scheduler group",
    severity: "info"
  },
  {
    id: 5,
    timestamp: "2024-01-29 10:30:17",
    user: "instructor@school.edu",
    action: "Grade Submitted",
    details: "Submitted final grades for MATH202",
    severity: "info"
  }
]

const mockActivityData = [
  { day: "Mon", users: 120, sessions: 89 },
  { day: "Tue", users: 145, sessions: 102 },
  { day: "Wed", users: 132, sessions: 95 },
  { day: "Thu", users: 168, sessions: 118 },
  { day: "Fri", users: 187, sessions: 134 },
  { day: "Sat", users: 89, sessions: 62 },
  { day: "Sun", users: 76, sessions: 48 }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await getAdminDashboard()
        
        console.log("Full API response:", result)
        console.log("Type of result:", typeof result)
        console.log("Keys in result:", Object.keys(result || {}))
        
        if (result?.data?.statistics) {
          console.log("Found statistics in result.data:", result.data.statistics)
          setStats(result.data.statistics)
        } else if (result?.statistics) {
          console.log("Found statistics in result:", result.statistics)
          setStats(result.statistics)
        } else {
          console.error("No statistics found. Full response structure:", JSON.stringify(result, null, 2))
          throw new Error("Invalid data format from API.")
        }
      } catch (err) {
        console.error("Error fetching admin dashboard:", err)
        setError("Failed to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statItems = stats
    ? [
        {
          title: "Total Users",
          value: stats.total_users,
          icon: Users,
        },
        {
          title: "Admins",
          value: stats.total_admins,
          icon: Shield,
        },
        {
          title: "Schedulers",
          value: stats.total_schedulers,
          icon: Clock,
        },
        {
          title: "Instructors",
          value: stats.total_instructors,
          icon: UserCheck,
        },
        {
          title: "Students",
          value: stats.total_students,
          icon: GraduationCap,
        },
      ]
    : []

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const SystemHealthCard = () => (
    <Card className="shadow-md border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Health</span>
            <span className="text-2xl font-bold text-green-600">{mockSystemStats.system_health}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${mockSystemStats.system_health}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Active Sessions</p>
              <p className="font-semibold">{mockSystemStats.active_sessions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="font-semibold">{mockSystemStats.server_uptime}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ActivityChart = () => (
    <Card className="shadow-md border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Weekly Activity
        </CardTitle>
        <CardDescription>User activity over the past 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivityData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-8 text-sm font-medium">{day.day}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Users: {day.users}</span>
                  <span>Sessions: {day.sessions}</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(day.users / 200) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(day.sessions / 150) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <SidebarProvider>
      <AdminSidebar activePage="Dashboard" />
      <SidebarInset>
        <main className="flex-1 p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
            <SidebarTrigger className="md:hidden" />
          </div>

          {/* User Statistics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">User Overview</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" data-testid="skeleton" />
                ))}
              </div>
            ) : error ? (
              <div className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statItems.map((item, index) => (
                  <Card key={index} className="shadow-md border">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{item.title}</CardTitle>
                      <item.icon className="w-6 h-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* System Statistics Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">System Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                  <Database className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.database_size}</div>
                </CardContent>
              </Card>

              <Card className="shadow-md border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.total_requests_today.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="shadow-md border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.average_response_time}</div>
                </CardContent>
              </Card>

              <Card className="shadow-md border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                  <Server className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts and Health Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemHealthCard />
            <ActivityChart />
          </div>

          {/* Recent Audit Logs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Recent Audit Logs</h2>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            <Card className="shadow-md border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.timestamp}
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)} variant="secondary">
                            {log.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}