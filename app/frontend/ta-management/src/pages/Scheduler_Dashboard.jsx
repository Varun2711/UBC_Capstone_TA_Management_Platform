import { useState, useEffect } from "react";
import {
  BookOpen,
  UserCheck,
  FileText,
  Search,
  Bell,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { AppSidebar } from "../components/scheduler-sidebar";
import { getApplications, getCourses } from "@/logic/scheduler-dashboard"
import { getCourseOfferings } from "@/logic/instructorManagement";

/**
 * Fetches course offerings, shared sessions, and assignments, then calculates
 * the total time slots available and subtracts those used in assignments.
 *
 * @returns {Promise<number>} The number of available time slots.
 */
async function calculateAvailableTimeSlots() {

  try {
    // Fetch all the data concurrently for efficiency
    const [courseOfferings, sharedSessions, assignments] = await Promise.all([
      getCourseOfferings(),
      getSharedSessions(),
      getAssignments(),
    ]);

    // 1. Get all unique time slot IDs from course offerings and shared sessions
    const allCourseTimeSlotIds = new Set();
    courseOfferings.forEach(offering => {
      offering.time_slots_info.forEach(timeSlot => allCourseTimeSlotIds.add(timeSlot.slot_id));
    });
    sharedSessions.forEach(session => {
      session.time_slots_info.forEach(timeSlot => allCourseTimeSlotIds.add(timeSlot.slot_id));
    });

    let totalHours = allCourseTimeSlotIds.size;
    let counter = totalHours;

    // 2. Create an array of unique time slot IDs from assignments
    const assignmentTimeSlotIds = new Set();
    assignments.forEach(assignment => {
      assignmentTimeSlotIds.add(assignment.time_slots_info.slot_id);
    });

    // 3. Subtract from the counter if a time slot is in both sets
    allCourseTimeSlotIds.forEach(slotId => {
      if (assignmentTimeSlotIds.has(slotId)) {
        counter--;
      }
    });

    return counter;
  } catch (error) {
    console.error("An error occurred:", error);
    // You might want to handle this error in a more specific way in a real application
    throw error;
  }
}

// Example usage:
calculateAvailableTimeSlots().then(availableHours => {
  console.log('Total hours available:', availableHours); // Expected output: 6
});

export default function TASchedulerDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourseCount, setActiveCourseCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const stats = [
    {
      title: "Active Courses",
      value: activeCourseCount,
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
      value: applicationCount,
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
  ];

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
  ];

  useEffect(() => {
    const fetchAndCountCourses = async () => {
      try {
        setLoadingCourses(true);
        const courses = await getCourses();
        const activeCourses = courses.results.filter(course => course.is_active);
        setActiveCourseCount(activeCourses.length);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingCourses(false);
      }
    };

    const fetchAndCountApplications = async () => {
      try {
        setLoadingApplications(true);
        const data = await getApplications();
        setApplicationCount(data.length);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchAndCountCourses();
    fetchAndCountApplications();
  }, []); 
  
  if (loadingCourses || loadingApplications) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar activePage="Dashboard" />
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
            {/* Search
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses, students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div> */}

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, TA Coordinator
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your TA scheduling system today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Upcoming Tasks */}
            <Card className="col-span-full md:col-span-1">
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>
                  Items that need your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.map((task, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-gray-900">
                            {task.task}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.dueDate}
                          </p>
                        </div>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : "secondary"
                          }
                          className="flex-shrink-0"
                        >
                          {task.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Overview */}
            <Card className="col-span-full md:col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>
                  TA distribution and workload by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      dept: "Computer Science",
                      tas: 18,
                      positions: 22,
                      percentage: 82,
                    },
                    {
                      dept: "Mathematics",
                      tas: 12,
                      positions: 15,
                      percentage: 80,
                    },
                    { dept: "Physics", tas: 8, positions: 10, percentage: 80 },
                    {
                      dept: "Engineering",
                      tas: 4,
                      positions: 6,
                      percentage: 67,
                    },
                  ].map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{dept.dept}</p>
                          <p className="text-xs text-muted-foreground">
                            {dept.tas} of {dept.positions} positions filled
                          </p>
                        </div>
                        <Badge variant="outline">{dept.percentage}%</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${dept.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status & Management Tools</CardTitle>
                <CardDescription>
                  Current system information and quick management access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">System Information</h4>
                    <div className="space-y-3">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
