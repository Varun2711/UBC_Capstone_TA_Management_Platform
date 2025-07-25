"use client"

import { useState, useEffect, use } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"
import { getAdminDashboard } from "@/logic/admin"

export default function AdminDashboard() {
   const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const result = await getAdminDashboard();
      
      // DEBUG: Log the entire response to see its structure
      console.log("Full API response:", result);
      console.log("Type of result:", typeof result);
      console.log("Keys in result:", Object.keys(result || {}));
      
      // Check if the response has a 'data' property (common in success_response wrappers)
      if (result?.data?.statistics) {
        console.log("Found statistics in result.data:", result.data.statistics);
        setStats(result.data.statistics);
      } else if (result?.statistics) {
        console.log("Found statistics in result:", result.statistics);
        setStats(result.statistics);
      } else {
        console.error("No statistics found. Full response structure:", JSON.stringify(result, null, 2));
        throw new Error("Invalid data format from API.");
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
    : [];

  return (
    <SidebarProvider>
      <AdminSidebar activePage="Dashboard" />
      <SidebarInset>
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
            <SidebarTrigger className="md:hidden" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
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
        </main>
        </SidebarInset>
    </SidebarProvider>
  )
}
