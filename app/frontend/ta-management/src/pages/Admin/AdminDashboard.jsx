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
  Mail,
  Database,
  Server,

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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts'
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"
import { getAdminDashboard, getNotificationStats, getSystemHealth } from "@/logic/admin"

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
  const [stats, setStats] = useState(null);
  const [notificationStats, setNotificationStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {

        setLoading(true);
        
        // Fetch all dashboard data concurrently
        const [userStatsResult, notificationResult, healthResult] = await Promise.allSettled([
          getAdminDashboard(),
          getNotificationStats(),
          getSystemHealth()
        ]);
        
        // Handle user statistics
        if (userStatsResult.status === 'fulfilled') {
          const result = userStatsResult.value;
          console.log("User stats response:", result);
          
          if (result?.data?.statistics) {
            setStats(result.data.statistics);
          } else if (result?.statistics) {
            setStats(result.statistics);
          } else {
            throw new Error("Invalid user statistics format from API.");
          }
        } else {
          console.error("Failed to fetch user stats:", userStatsResult.reason);
        }
        
        // Handle notification statistics
        if (notificationResult.status === 'fulfilled') {
          setNotificationStats(notificationResult.value);
        } else {
          console.warn("Failed to fetch notification stats:", notificationResult.reason);
          setNotificationStats({
            total_notifications: 0,
            pending_notifications: 0,
            sent_notifications: 0,
            failed_notifications: 0
          });
        }
        
        // Handle system health
        if (healthResult.status === 'fulfilled') {
          setSystemHealth(healthResult.value);
        } else {
          console.warn("Failed to fetch system health:", healthResult.reason);
          setSystemHealth({ overall_health: 'unknown', services: [] });
        }
        
      } catch (err) {
        console.error("Error fetching admin dashboard:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Color schemes for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Prepare chart data
  const userTypeChartData = stats ? [
    { name: 'Students', value: stats.total_students, color: '#0088FE' },
    { name: 'Instructors', value: stats.total_instructors, color: '#00C49F' },
    { name: 'Schedulers', value: stats.total_schedulers, color: '#FFBB28' },
    { name: 'Admins', value: stats.total_admins, color: '#FF8042' }
  ] : [];

  const activityStatusData = stats ? [
    { name: 'Active', value: stats.total_active_users, color: '#00C49F' },
    { name: 'Inactive', value: stats.inactive_users, color: '#FF8042' }
  ] : [];

  const departmentChartData = stats?.department_distribution ? 
    Object.entries(stats.department_distribution).map(([dept, data]) => ({
      name: dept,
      students: data.students,
      instructors: data.instructors,
      total: data.total
    })) : [];

  const notificationChartData = notificationStats ? [
    { name: 'Sent', value: notificationStats.sent_notifications, color: '#00C49F' },
    { name: 'Pending', value: notificationStats.pending_notifications, color: '#FFBB28' },
    { name: 'Failed', value: notificationStats.failed_notifications, color: '#FF8042' }
  ] : [];

  const statItems = stats ? [
    {
      title: "Total Users",
      value: stats.total_users,
      icon: Users,
      description: `${stats.user_activity_rate}% active`,
      trend: stats.user_activity_rate >= 80 ? "positive" : stats.user_activity_rate >= 60 ? "neutral" : "negative"
    },
    {
      title: "Active Users",
      value: stats.total_active_users,
      icon: Activity,
      description: `${stats.inactive_users} inactive`,
      trend: "positive"
    },
    {
      title: "Departments",
      value: stats.total_departments,
      icon: BookOpen,
      description: "Total departments",
      trend: "neutral"
    },
    {
      title: "Notifications",
      value: notificationStats?.total_notifications || 0,
      icon: Mail,
      description: `${notificationStats?.pending_notifications || 0} pending`,
      trend: (notificationStats?.failed_notifications || 0) === 0 ? "positive" : "negative"
    },
    {
      title: "System Health",
      value: systemHealth?.overall_health || "Unknown",
      icon: Server,
      description: systemHealth?.services?.length ? `${systemHealth.services.length} services` : "Checking...",
      trend: systemHealth?.overall_health === 'healthy' ? "positive" : 
             systemHealth?.overall_health === 'degraded' ? "negative" : "neutral"
    }
  ] : [];

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'positive': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar activePage="Dashboard" />
      <SidebarInset>
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and statistics</p>
            </div>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" data-testid="skeleton" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-80 w-full rounded-xl" />
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            </div>
          ) : error ? (
            <div className="text-red-600 flex items-center gap-2 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statItems.map((item, index) => (
                  <Card key={index} className="shadow-sm border transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className={`text-xs ${getTrendColor(item.trend)}`}>
                            {item.description}
                          </p>
                        </div>
                        {getTrendIcon(item.trend)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts and Analytics */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">User Analytics</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                  <TabsTrigger value="system">System Health</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Type Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          User Type Distribution
                        </CardTitle>
                        <CardDescription>
                          Breakdown of users by role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={userTypeChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {userTypeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Activity Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          User Activity Status
                        </CardTitle>
                        <CardDescription>
                          Active vs inactive users
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={activityStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {activityStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notification Statistics */}
                  {notificationStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Notification Statistics
                        </CardTitle>
                        <CardDescription>
                          Email notification status overview
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Success Rate</span>
                              <span className="text-2xl font-bold text-green-600">
                                {notificationStats.total_notifications > 0 
                                  ? Math.round((notificationStats.sent_notifications / notificationStats.total_notifications) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <Progress 
                              value={notificationStats.total_notifications > 0 
                                ? (notificationStats.sent_notifications / notificationStats.total_notifications) * 100
                                : 0} 
                              className="w-full"
                            />
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-green-600">{notificationStats.sent_notifications}</div>
                                <div className="text-muted-foreground">Sent</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-yellow-600">{notificationStats.pending_notifications}</div>
                                <div className="text-muted-foreground">Pending</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-red-600">{notificationStats.failed_notifications}</div>
                                <div className="text-muted-foreground">Failed</div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={notificationChartData.filter(item => item.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {notificationChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  {/* Detailed User Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Growth Overview</CardTitle>
                        <CardDescription>
                          Total users by category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={userTypeChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0088FE" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Metrics</CardTitle>
                        <CardDescription>
                          User activity breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Overall Activity Rate</span>
                            <span className="text-sm font-bold">{stats?.user_activity_rate}%</span>
                          </div>
                          <Progress value={stats?.user_activity_rate || 0} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats?.total_active_users}</div>
                            <div className="text-sm text-green-700">Active Users</div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{stats?.inactive_users}</div>
                            <div className="text-sm text-red-700">Inactive Users</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="departments" className="space-y-4">
                  {/* Department Analytics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Department Distribution</CardTitle>
                      <CardDescription>
                        Users across different departments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={departmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="students" stackId="a" fill="#0088FE" name="Students" />
                          <Bar dataKey="instructors" stackId="a" fill="#00C49F" name="Instructors" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  {/* System Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        System Health
                      </CardTitle>
                      <CardDescription>
                        Service status and monitoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              systemHealth?.overall_health === 'healthy' ? 'bg-green-500' :
                              systemHealth?.overall_health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">Overall System Status</span>
                          </div>
                          <Badge variant={
                            systemHealth?.overall_health === 'healthy' ? 'default' :
                            systemHealth?.overall_health === 'degraded' ? 'destructive' : 'secondary'
                          }>
                            {systemHealth?.overall_health || 'Unknown'}
                          </Badge>
                        </div>
                        
                        {systemHealth?.services && systemHealth.services.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Service Status</h4>
                            {systemHealth.services.map((service, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    service.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <span className="text-sm">{service.name}</span>
                                </div>
                                <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                                  {service.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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