"use client";

import { useState, useEffect } from "react";
import { Bell, Users, BookOpen, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { InstructorSidebar } from "../components/instructor-dashboard-sidebar";
import { fetchInstructorDashboardData } from "../logic/instructorDashboard";

export default function InstructorDashboard() {
  // State for dynamic data
  const [instructor, setInstructor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    activeCourses: 0,
    totalTAs: 0,
    totalCourses: 0,
    pendingRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchInstructorDashboardData();

        setInstructor(data.instructor);
        setCourses(data.courses);
        setStats(data.stats);

        console.log("Courses state array:", data.courses);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <SidebarProvider>
      <InstructorSidebar activePage="Dashboard" />
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
            <Button variant="ghost" size="icon">
              {/* <Bell className="h-5 w-5" /> */}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-4 p-4 md:p-6">
          {isLoading ? (
            /* Loading State */
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading dashboard data...
                </p>
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            /* Dashboard Overview */
            <>
              {/* Welcome Section */}
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {instructor?.name || "Loading..."}
                </h1>
                <p className="text-muted-foreground">
                  {instructor?.role || "Instructor"}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Courses
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.activeCourses}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total TAs
                    </CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTAs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Courses
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalCourses}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Requests
                    </CardTitle>
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.pendingRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    The TAs for your courses have not been assigned yet. Please
                    wait, or contact Admin for more details.
                  </p>

                  {/* View Assigned Courses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      View Assigned Courses
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {courses.map((course) => (
                        <Card
                          key={course.id}
                          className={`cursor-pointer transition-all hover:shadow-md`}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {course.code}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {course.name}
                            </CardDescription>
                            {course.section && (
                              <div className="text-xs text-muted-foreground">
                                Section: {course.section}
                              </div>
                            )}
                            {course.term && (
                              <div className="text-xs text-muted-foreground">
                                {course.term}
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="mb-2">
                              <Badge
                                variant={
                                  course.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  course.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : ""
                                }
                              >
                                {course.status || "Active"}
                              </Badge>
                            </div>
                            <Link
                              to={`/course-details/${course.course_id}/${course.term}`}
                              className="w-full"
                            >
                              <Button
                                className={`w-full bg-gray-600 hover:bg-gray-700`}
                              >
                                View Course Details
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
