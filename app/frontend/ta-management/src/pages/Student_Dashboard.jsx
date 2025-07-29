"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSidebar } from "../components/student-dashboard-sidebar";
import axios from "axios";
import { getProfile } from "@/logic/student-profile";
import { fetchStudentApplications } from "@/logic/student-applications";

// Mock data
const studentProfile = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarahj@mail.com",
  studentId: "SJ2024001",
  major: "Computer Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=40&width=40",
};

const mockSubmittedApplications = [
  {
    application_id: 1,
    termSelection: {
      code: "2025 Mock Term 1 & Term 2",
    },
    status: "under_review",
    applied_at: "2024-01-15",
    posting: {
      title: "2025 TA Applications",
    },
  },
  {
    application_id: 2,
    termSelection: {
      code: "2025 Summer Mock",
    },
    status: "accepted",
    applied_at: "2024-01-15",
    posting: {
      title: "2025 TA Applications",
    },
  },
];

const upcomingDeadlines = [
  {
    course: "Winter Session 2025-2026 TA Applications",
    deadline: "2024-04-30",
    daysLeft: 39,
  },
  {
    course: "Summer Session 2025 TA Applications",
    deadline: "2024-03-31",
    daysLeft: 9,
  },
];

function getStatusBadge(status) {
  switch (status) {
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Under Review
        </Badge>
      );
    case "submitted":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-100">
          Submitted
        </Badge>
      );
    case "withdrawn":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Under Review
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [error, setError] = useState([]);
  const navigate = useNavigate();

  // State for loading and error handling
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // State for current user data (displayed and modified)
  const [userData, setUserData] = useState(null);

  // Helper functions for data transformation
  const transformBackendDataToFrontend = (data) => {
    return {
      id: data.id || "",
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      studentId: data.student_info?.studentId || "",
      phone: data.student_info?.phone || "",
      major: data.student_info?.program || "",
      year: data.student_info?.study_level || "",
      gpa: data.student_profile?.gpa || "",
      minor: data.student_profile?.minor || "",
      avatar: data.avatar || "/placeholder.svg?height=120&width=120",
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await getProfile();
        //console.log("Fetched user data:", data);
        //console.log("ID of student data:", data.id);

        const profileData = transformBackendDataToFrontend(data);
        //console.log("Transformed user data:", profileData);

        setUserData(profileData); // ✅ Let this trigger the next useEffect
      } catch (error) {
        setFetchError("Could not load your profile. Please try again later.");
        //console.error("Fetch profile error:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoadingApplications(true);

        if (!userData) {
          //  console.error("User data is not available yet.");
          setIsLoadingApplications(false);
          return;
        }

        const applications = await fetchStudentApplications();

        const transformedApplications = applications.map((app) => ({
          application_id: app.application_id,
          termSelection: {
            code: app.termSelection?.code || app.posting?.term?.code || "N/A",
          },
          status: app.status,
          applied_at: app.applied_at,
          posting: {
            title: app.posting?.title || "N/A",
            posting_id: app.posting?.posting_id,
            description: app.posting?.description,
            department: app.posting?.department?.name,
          },
        }));

        setSubmittedApplications(transformedApplications);
      } catch (err) {
        console.log("Error fetching student applications:", err);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [userData]); // ✅ Runs only when userData is updated

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApplicationClick = (applicationId) => {
    navigate(`/my-applications/detail/${applicationId}`);
  };

  if (isLoadingProfile || isLoadingApplications || !userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading dashboard...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          name={userData.firstName}
          email={userData.email}
          avatar={userData.avatar}
        />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {userData.firstName}!
                </h2>
                <p className="text-muted-foreground">
                  Here's your TA application overview
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={userData.avatar || "/placeholder.svg"}
                        alt={userData.firstName}
                      />
                      <AvatarFallback>
                        {userData.firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{userData.firstName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {userData.major}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userData.year}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{userData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{userData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">GPA: {userData.gpa}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>
                    Don't miss these application deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{deadline.course}</p>
                          <p className="text-sm text-muted-foreground">
                            Deadline: {deadline.deadline}
                          </p>
                        </div>
                        <Badge
                          variant={
                            deadline.daysLeft <= 7 ? "destructive" : "secondary"
                          }
                        >
                          {deadline.daysLeft} days left
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Applications */}
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>
                  Track the status of your submitted applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Job Posting</TableHead>
                      <TableHead>Academic Period</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedApplications.map((application) => (
                      <TableRow
                        key={application.application_id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {application.application_id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {application.posting.title}
                        </TableCell>
                        <TableCell className="font-medium">
                          {application.termSelection.code}
                        </TableCell>
                        <TableCell>
                          {formatDate(application.applied_at)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="View Application Details"
                            onClick={() =>
                              handleApplicationClick(application.application_id)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
