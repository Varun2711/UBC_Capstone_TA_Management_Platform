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
import { getApplications, getCourses, getCourseOfferings, getSharedSessions, getAssignments, getShortlistedApplicants, getOffers, getPendingOffers, getAcceptedOffers, getRejectedOffers } from "@/logic/scheduler-dashboard"
//import { getCourseOfferings, getSharedSessions } from "@/logic/instructorManagement";

/**
 * Fetches course offerings, shared sessions, and assignments, then calculates
 * the total time slots available and subtracts those used in assignments.
 *
 * @returns {Promise<number>} The number of available time slots.
 */

async function calculateAvailableTimeSlots() {
  try {
    const [courseOfferings, sharedSessions, assignments] = await Promise.all([
      getCourseOfferings(),
      getSharedSessions(),
      getAssignments(),
    ]);

    // Initialize department tracking
    const departmentSlots = {
      'Computer Science': { total: 0, assigned: 0, available: 0 },
      'Mathematics': { total: 0, assigned: 0, available: 0 },
      'Statistics': { total: 0, assigned: 0, available: 0 },
      'Physics': { total: 0, assigned: 0, available: 0 },
      'Data Science': { total: 0, assigned: 0, available: 0 },
      'Psychology': { total: 0, assigned: 0, available: 0 },
      'Biology': { total: 0, assigned: 0, available: 0 },
      'Chemistry': { total: 0, assigned: 0, available: 0 },
      'Engineering': { total: 0, assigned: 0, available: 0 }
    };

    // 1. Track all available offering-slot and session-slot combinations
    const allAvailableSlotCombinations = new Set();
    const slotToDepartmentMap = new Map();

    // Process course offerings
    courseOfferings.results.forEach(offering => {
      const department = getDepartmentFromCourseName(offering.course_info);
      offering.time_slots_info.forEach(slot => {
        const uniqueKey = `offering-${offering.course_offering_id}-${slot.slot_id}`;
        if (!allAvailableSlotCombinations.has(uniqueKey)) {
          allAvailableSlotCombinations.add(uniqueKey);
          slotToDepartmentMap.set(uniqueKey, department);
          if (departmentSlots[department]) {
            departmentSlots[department].total++;
          }
        }
      });
    });

    // Process shared sessions
    sharedSessions.results.forEach(session => {
      const department = getDepartmentFromCourseName(session.course_info);
      session.time_slots_info.forEach(slot => {
        const uniqueKey = `session-${session.shared_session_id}-${slot.slot_id}`;
        if (!allAvailableSlotCombinations.has(uniqueKey)) {
          allAvailableSlotCombinations.add(uniqueKey);
          slotToDepartmentMap.set(uniqueKey, department);
          if (departmentSlots[department]) {
            departmentSlots[department].total++;
          }
        }
      });
    });

    // 2. Track assigned slot combinations
    const assignedSlotCombinations = new Set();

    assignments.forEach(assignment => {
      // An assignment is for ONE course offering OR ONE shared session.
      // We need to find the ID of that specific offering/session.
      const assignedOfferingId = assignment.course_offering?.course_offering_id;
      const assignedSessionId = assignment.shared_session?.shared_session_id;

      if (assignment.offer_details && assignment.offer_details.offer_items) {
        // Now, find the specific offer_item that matches the assignment's target
        // and has a time_slot.
        const matchingOfferItem = assignment.offer_details.offer_items.find(item => {
          // The item must match the assignment's offering/session AND have a time slot.
          return (item.course_offering_id === assignedOfferingId || item.shared_session_id === assignedSessionId) && item.time_slot;
        });

        if (matchingOfferItem) {
          const timeSlots = Array.isArray(matchingOfferItem.time_slot)
            ? matchingOfferItem.time_slot
            : [matchingOfferItem.time_slot];

          timeSlots.forEach(slot => {
            const idToMatch = assignedOfferingId || assignedSessionId;
            const idType = assignedOfferingId ? 'offering' : 'session';
            const uniqueKey = `${idType}-${idToMatch}-${slot.slot_id}`;

            // Check if the slot combination is valid and exists in our master list.
            if (allAvailableSlotCombinations.has(uniqueKey)) {
              // Add the key to our set of assigned slots.
              // The Set automatically handles duplicates, so we don't need an extra if-check here.
              assignedSlotCombinations.add(uniqueKey);

              // **FIX:** We must increment the department's assigned count
              // every time we find a valid assigned slot in an assignment,
              // as the total count is what matters for the department breakdown.
              const department = slotToDepartmentMap.get(uniqueKey);
              if (department && departmentSlots[department]) {
                departmentSlots[department].assigned++;
              }
            }
          });
        }
      }
    });

    // Calculate available slots for each department using the now-correct assigned count
    Object.keys(departmentSlots).forEach(dept => {
      departmentSlots[dept].available = departmentSlots[dept].total - departmentSlots[dept].assigned;
    });

    // **FIX:** Calculate the total by summing the departmental `available` counts.
    // This ensures the main stat card is consistent with the department breakdown.
    const totalAvailable = Object.values(departmentSlots).reduce(
      (sum, deptData) => sum + deptData.available,
      0
    );
    console.log("printing totalAvailable: ", totalAvailable);
    return {
      totalAvailable: totalAvailable,
      byDepartment: departmentSlots
    };

  } catch (error) {
    console.error("An error occurred in calculateAvailableTimeSlots:", error);
    // Return a default state on error to prevent crashes
    return { totalAvailable: 0, byDepartment: {} };
  }
}

function getDepartmentFromCourseName(course_info) {
  if (!course_info) return 'OTHER';
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


export default function TASchedulerDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourseCount, setActiveCourseCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(true);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(true);
  const [departmentSlots, setDepartmentSlots] = useState({});
  const [error, setError] = useState(null);

  // Add new state for application status
  const [applicationStatus, setApplicationStatus] = useState({
    pendingReview: 0,
    shortlisted: 0,
    offersSent: 0,
    accepted: 0
  });
  const [loadingApplicationStatus, setLoadingApplicationStatus] = useState(true);

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
      title: "Available time slots",
      value: availableTimeSlots,
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

  // Update your useEffect to handle the new return structure
useEffect(() => {
  const fetchAllData = async () => {
    try {
      setLoadingCourses(true);
      setLoadingApplications(true);
      setLoadingTimeSlots(true);
      setLoadingApplicationStatus(true);

      // Fetch courses and applications
      const [courses, applications, slotsData, shortlistedApplicants, pendingOffers, acceptedOffers, rejectedOffers] = await Promise.all([
        getCourses(),
        getApplications(),
        calculateAvailableTimeSlots(),
        getShortlistedApplicants(),
        getPendingOffers(),
        getAcceptedOffers(),
        getRejectedOffers()
      ]);
      
      console.log("availableSlots: ", slotsData);
      console.log("shortlistedApplicants: ", shortlistedApplicants);
      console.log("pendingOffers: ", pendingOffers);
      console.log("acceptedOffers: ", acceptedOffers);
      console.log("rejectedOffers: ", rejectedOffers);

      // Update all states
      const activeCourses = courses.results.filter(course => course.is_active);
      setActiveCourseCount(activeCourses.length);
      setApplicationCount(applications.length);
      setAvailableTimeSlots(slotsData.totalAvailable); // Use totalAvailable
      setDepartmentSlots(slotsData.byDepartment); // Store department data

      // Set application status data
      setApplicationStatus({
        shortlisted: shortlistedApplicants.length,
        offersSent: pendingOffers.length,
        accepted: acceptedOffers.length,
        rejected: rejectedOffers.length
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err);
    } finally {
      setLoadingCourses(false);
      setLoadingApplications(false);
      setLoadingTimeSlots(false);
      setLoadingApplicationStatus(false);
    } 
  };

  fetchAllData();
}, []);
  
  if (loadingCourses || loadingApplications || loadingTimeSlots || loadingApplicationStatus) {
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
            {/* Application Status */}
            <Card className="col-span-full md:col-span-1">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Current application pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      status: "Shortlisted", 
                      count: applicationStatus.shortlisted, 
                      color: "bg-blue-500" 
                    },
                    { 
                      status: "Offers Sent", 
                      count: applicationStatus.offersSent, 
                      color: "bg-purple-500" 
                    },
                    { 
                      status: "Accepted", 
                      count: applicationStatus.accepted, 
                      color: "bg-green-500" 
                    },
                    { 
                      status: "Rejected", 
                      count: applicationStatus.rejected, 
                      color: "bg-yellow-500" 
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <Badge variant="outline">{item.count}</Badge>
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
                  Available time slots by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(departmentSlots).map(([deptName, data]) => {
                    const percentage = data.total > 0 ? 100 - Math.round((data.available / data.total) * 100) : 0;
                    return (
                      <div key={deptName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{deptName}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.total - data.available} of {data.total} slots assigned
                            </p>
                          </div>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
