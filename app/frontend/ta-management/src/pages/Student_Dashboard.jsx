"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
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

//fetch the students applications

const mockSubmittedApplications = [
  {
    application_id: 1,
    termSelection: {
      code: "2025 Winter Term 1 & Term 2",
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
      code: "2025 Summer",
    },
    status: "accepted",
    applied_at: "2024-01-15",
    posting: {
      title: "2025 TA Applications",
    },
  },
];

const openPositions = [
  {
    id: 4,
    course: "CS 102 - Programming Fundamentals",
    professor: "Dr. Wilson",
    deadline: "2024-02-01",
    requirements: "Previous TA experience preferred",
    hours: "10 hrs/week",
  },
  {
    id: 5,
    course: "CS 250 - Computer Organization",
    professor: "Dr. Davis",
    deadline: "2024-02-05",
    requirements: "Strong understanding of computer architecture",
    hours: "15 hrs/week",
  },
  {
    id: 6,
    course: "CS 350 - Software Engineering",
    professor: "Dr. Miller",
    deadline: "2024-02-10",
    requirements: "Experience with software development projects",
    hours: "12 hrs/week",
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

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "#",
    isActive: true,
  },
  {
    title: "My Applications",
    icon: FileText,
    url: "#",
  },
  {
    title: "Available Positions",
    icon: BookOpen,
    url: "#",
  },
  {
    title: "Schedule",
    icon: Calendar,
    url: "#",
  },
  {
    title: "Profile",
    icon: User,
    url: "#",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "#",
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

//base url for the api calls
const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [error, setError] = useState([]);
  const [student, setStudent] = useState(null);

  //on mount, load the student data
  //this includes application data
  useEffect(() => {
    const loadStudentDashboardData = async () => {
      const accessToken = localStorage.getItem("accessToken");
      //if we can't find the accces token, then for the demo, use the mock student profile data
      if (!accessToken) {
        // console.log( "No access token found in localStorage, using mock student data"    );
        setStudent(studentProfile);
        setSubmittedApplications(mockSubmittedApplications);
        return;
      }

      try {
        console.log("We're here!");
        //get user profile to get the student id
        // probably need another way to do this than getting the entire profile
        const res = await instance.get(`/profile/me/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        //console.log(res.data);
        const studentId = res.data.id;
        //console.log(studentId);

        // const applicationResponse = await instance.get("/ajp/applications/", {
        //   params: { by-student: studentId }, // or whatever field the filter expects
        // });

        const applicationResponse = await instance.get(
          `/ajp/applications/by-student/${studentId}/`
        );

        //console.log(applicationResponse.data);

        if (Array.isArray(applicationResponse.data)) {
          const transformedApplications = applicationResponse.data.map(
            (app) => ({
              application_id: app.application_id,
              termSelection: {
                code:
                  app.termSelection?.code || app.posting?.term?.code || "N/A",
              },
              status: app.status,
              applied_at: app.applied_at,
              posting: {
                title: app.posting?.title || "N/A",
                posting_id: app.posting?.posting_id,
                description: app.posting?.description,
                department: app.posting?.department?.name,
              },
            })
          );

          console.log(transformedApplications);

          setSubmittedApplications(transformedApplications);
        } else {
          console.error(
            "Applications data is not an array:",
            applicationResponse.data
          );
          setSubmittedApplications(mockSubmittedApplications);
        }

        setSubmittedApplications(applicationResponse.data);
      } catch (err) {
        //if something goes wrong and we can't load the student application, fall back on the mockdata
        //console.log(err);
        setSubmittedApplications(mockSubmittedApplications);
      }
    };
    loadStudentDashboardData();
  }, []);

  const filteredOpenPositions = openPositions.filter(
    (position) =>
      position.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.professor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
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
                  Welcome back, {studentProfile.name}!
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
                        src={studentProfile.avatar || "/placeholder.svg"}
                        alt={studentProfile.name}
                      />
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{studentProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {studentProfile.major}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {studentProfile.year}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">GPA: {studentProfile.gpa}</span>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedApplications.map((application) => (
                      <TableRow key={application.application_id}>
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
