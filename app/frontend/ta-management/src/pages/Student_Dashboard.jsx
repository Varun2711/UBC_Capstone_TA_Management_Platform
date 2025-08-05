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
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Gift,
  BookMarked,
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
import { Progress } from "@/components/ui/progress";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSidebar } from "../components/student-dashboard-sidebar";
import axios from "axios";
import { getProfile } from "@/logic/student-profile";
import { fetchStudentApplications } from "@/logic/student-applications";

// API functions for new integrations
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("accessToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const fetchActiveJobPostings = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get("http://localhost:8080/api/ajp/jobpostings/active/", { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching active job postings:", error);
    return [];
  }
};

const fetchPendingOffers = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get("http://localhost:8080/api/allocations/offers/pending_offers/", { headers });
    return response.data;
  } catch (error) {
    console.error("Error fetching pending offers:", error);
    return [];
  }
};

const fetchActiveAssignments = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get("http://localhost:8080/api/allocations/assignments/my_assignments/", { headers });
    return response.data.assignments || [];
  } catch (error) {
    console.error("Error fetching active assignments:", error);
    return [];
  }
};

export default function StudentDashboard() {
  const navigate = useNavigate();

  // State for loading and error handling
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingJobPostings, setIsLoadingJobPostings] = useState(true);
  
  // State for current user data
  const [userData, setUserData] = useState(null);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [activeJobPostings, setActiveJobPostings] = useState([]);
  const [error, setError] = useState(null);

  // Helper functions for data transformation
  const transformBackendDataToFrontend = (data) => {
    return {
      id: data.id || "",
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      studentId: data.student_info?.student_number || "",
      phone: data.student_info?.phone || "",
      major: data.student_info?.program || "",
      year: data.student_info?.study_level || "",
      gpa: data.student_profile?.gpa || "",
      minor: data.student_profile?.minor || "",
      avatar: data.avatar || "/placeholder.svg?height=120&width=120",
    };
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await getProfile();
        const profileData = transformBackendDataToFrontend(data);
        setUserData(profileData);
      } catch (error) {
        setError("Could not load your profile. Please try again later.");
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch all dashboard data when user data is available
  useEffect(() => {
    if (!userData) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch applications
        setIsLoadingApplications(true);
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

        // Fetch pending offers
        setIsLoadingOffers(true);
        const offers = await fetchPendingOffers();
        setPendingOffers(offers);

        // Fetch active assignments
        setIsLoadingAssignments(true);
        const assignments = await fetchActiveAssignments();
        setActiveAssignments(assignments);

        // Fetch active job postings
        setIsLoadingJobPostings(true);
        const jobPostings = await fetchActiveJobPostings();
        setActiveJobPostings(jobPostings.slice(0, 3)); // Show only 3 most recent

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoadingApplications(false);
        setIsLoadingOffers(false);
        setIsLoadingAssignments(false);
        setIsLoadingJobPostings(false);
      }
    };

    fetchDashboardData();
  }, [userData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      under_review: { color: "bg-yellow-100 text-yellow-800", label: "Under Review" },
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted" },
      withdrawn: { color: "bg-gray-100 text-gray-800", label: "Withdrawn" },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const calculateCompletionPercentage = () => {
    if (!userData.gpa && !userData.phone && !userData.major) return 25;
    if (!userData.gpa || !userData.phone || !userData.major) return 75;
    return 100;
  };

  // Check for an error state first. This is the most critical state.
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If there's no error, then check if we are still loading the initial data.
  if (isLoadingProfile || !userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
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
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {userData.firstName}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's your TA application overview and current status
                </p>
              </div>
              <Button 
                onClick={() => navigate("/apply")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Apply for Positions
              </Button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Applications</p>
                      <p className="text-2xl font-bold">{submittedApplications.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center">
                    <Gift className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Offers</p>
                      <p className="text-2xl font-bold">{pendingOffers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex items-center">
                    <BookMarked className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Postings</p>
                      <p className="text-2xl font-bold">{activeJobPostings.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={userData.avatar || "/placeholder.svg"}
                        alt={userData.firstName}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                        {userData.firstName.charAt(0)}{userData.lastName?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{userData.firstName} {userData.lastName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {userData.major}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userData.year}
                      </p>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm text-gray-600">{calculateCompletionPercentage()}%</span>
                    </div>
                    <Progress value={calculateCompletionPercentage()} className="h-2" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{userData.email}</span>
                    </div>
                    {userData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{userData.phone}</span>
                      </div>
                    )}
                    {userData.gpa && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">GPA: {userData.gpa}</span>
                      </div>
                    )}
                    {userData.studentId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">ID: {userData.studentId}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate("/profile")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest applications, offers, and assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Pending Offers */}
                    {pendingOffers.length > 0 && (
                      <div className="border-l-4 border-green-400 pl-4">
                        <h4 className="font-medium text-green-800 mb-2">
                          🎉 You have {pendingOffers.length} pending offer{pendingOffers.length > 1 ? 's' : ''}!
                        </h4>
                        {pendingOffers.slice(0, 2).map((offer) => (
                          <div key={offer.offer_id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium">{offer.position_summary}</p>
                              <p className="text-xs text-gray-500">
                                Deadline: {formatDate(offer.response_deadline)}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => navigate("/student-offers")}
                            >
                              View Offers
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recent Applications */}
                    {submittedApplications.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Recent Applications</h4>
                        {submittedApplications.slice(0, 3).map((app) => (
                          <div key={app.application_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium">{app.posting.title}</p>
                              <p className="text-xs text-gray-500">
                                Applied: {formatDate(app.applied_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(app.status)}
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => navigate("/my-applications")}
                        >
                          View All Applications
                        </Button>
                      </div>
                    )}

                    {/* Active Assignments */}
                    {activeAssignments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Current Positions</h4>
                        {activeAssignments.slice(0, 2).map((assignment) => (
                          <div key={assignment.assignment_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium">
                                {assignment.course?.course_number} {assignment.course?.course_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {assignment.weekly_hours}h/week • Started {formatDate(assignment.assigned_date)}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {submittedApplications.length === 0 && pendingOffers.length === 0 && activeAssignments.length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                        <p className="text-gray-600 mb-4">Start by applying to TA positions to see your activity here.</p>
                        <Button 
                          onClick={() => navigate("/apply")}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Browse Open Positions
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Job Postings */}
            {activeJobPostings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5" />
                    Latest Job Postings
                  </CardTitle>
                  <CardDescription>
                    New TA positions available for application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeJobPostings.map((posting) => (
                      <div key={posting.posting_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{posting.title}</h4>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Open
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{posting.department?.name}</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Deadline: {formatDate(posting.deadline_date)}
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate("/apply")}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/apply")}
                    >
                      View All Open Positions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
