"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Settings,
  User,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavigationHeader } from "@/components/ui/navigation-header"
import { AppSidebar } from "../components/student-dashboard-sidebar"
import { getProfile } from "@/logic/student-profile"
import { getPendingOffers, getCourseOfferingDetails, getSharedSessionDetails } from "@/logic/student-offers-page"

import axios from "axios"


// Mock data for student profile
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "SJ2024001",
  major: "Computer Science",
  year: "Graduate Student",
  avatar: "/placeholder.svg?height=40&width=40",
}

// Updated mock data for current offers
const currentOffers = [
  {
    id: 1,
    courses: [
      {
        course: "CS 102 - Programming Fundamentals",
        courseCode: "CS 102",
        instructor: "Dr. Wilson",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 001",
            time: "Mon/Wed 10:00-11:30 AM",
          },
          {
            type: "Lecture",
            section: "LEC 002",
            time: "Tue/Thurs 10:00-11:30 AM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L01",
            time: "Monday 2:00-4:00 PM",
          },
          {
            type: "Tutorial",
            section: "TUT T01",
            time: "Friday 1:00-2:00 PM",
          },
        ],
      },
      {
        course: "CS 103 - Data Structures",
        courseCode: "CS 103",
        instructor: "Dr. Smith",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 002",
            time: "Tue/Thu 9:00-10:30 AM",
          },
          {
            type: "Lecture",
            section: "LEC 002",
            time: "Mon/Wed/Fri 10:00-11:00 AM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L02",
            time: "Wednesday 3:00-5:00 PM",
          },
          {
            type: "Tutorial",
            section: "TUT T02",
            time: "Friday 3:00-4:00 PM",
          },
        ],
      },
    ],
    hoursPerWeek: 10,
    hourlyRate: 15.5,
    totalWeeks: 16,
    totalPay: 2480,
    startDate: "2024-02-05",
    endDate: "2024-05-20",
    session: "Winter Session 2025-26",
    offerDate: "2024-01-20",
    responseDeadline: "2024-02-01",
    daysLeft: 5,
    requirements: "Previous programming experience preferred. Must be available for office hours.",
    status: "Pending",
    priority: "High",
  },
  {
    id: 2,
    courses: [
      {
        course: "CS 250 - Computer Organization",
        courseCode: "CS 250",
        instructor: "Dr. Davis",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 001",
            time: "Tue/Thu 11:00-12:30 PM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L02",
            time: "Wednesday 3:00-5:00 PM",
          },
          {
            type: "Tutorial",
            section: "TUT T01",
            time: "Friday 10:00-11:00 AM",
          },
        ],
      },
      {
        course: "CS 260 - Digital Systems",
        courseCode: "CS 260",
        instructor: "Dr. Lee",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 002",
            time: "Mon/Wed 1:00-2:30 PM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L01",
            time: "Thursday 3:00-5:00 PM",
          },
          {
            type: "Tutorial",
            section: "TUT T03",
            time: "Friday 2:00-3:00 PM",
          },
        ],
      },
    ],
    hoursPerWeek: 15,
    hourlyRate: 16.0,
    totalWeeks: 16,
    totalPay: 3840,
    startDate: "2024-02-05",
    endDate: "2024-05-20",
    session: "Summer Session 2026",
    offerDate: "2024-01-22",
    responseDeadline: "2024-02-05",
    daysLeft: 9,
    requirements: "Strong understanding of computer architecture and assembly language.",
    status: "Pending",
    priority: "Medium",
  },
];

const pastOffers = [
  {
    id: 3,
    courses: [
      {
        course: "CS 301 - Algorithms",
        courseCode: "CS 301",
        instructor: "Dr. Brown",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 001",
            time: "Mon/Wed/Fri 10:00-11:00 AM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L01",
            time: "Monday 2:00-4:00 PM",
          },
        ],
      },
      {
        course: "CS 101 - Introduction to Programming",
        courseCode: "CS 101",
        instructor: "Dr. Smith",
        courseOfferings: [
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L03",
            time: "Friday 1:00-3:00 PM",
          },
        ],
      },
    ],
    hoursPerWeek: 10,
    session: "Winter Session 2024-25",
    offerDate: "2024-01-20",
    responseDeadline: "2024-02-01",
    responseDate: "2024-01-30",
    status: "Accepted",
  },
  {
    id: 4,
    courses: [
      {
        course: "CS 102 - Digital Citizenship",
        courseCode: "CS 102",
        instructor: "Dr. Smith",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 001",
            time: "Mon/Wed/Fri 10:00-11:00 AM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L01",
            time: "Monday 2:00-4:00 PM",
          },
        ],
      },
      {
        course: "CS 124 - Capstone Software Engineering Project",
        courseCode: "CS 124",
        instructor: "Dr. Town",
        courseOfferings: [
          {
            type: "Lecture",
            section: "LEC 001",
            time: "Mon/Fri 10:00-11:30 AM",
          },
        ],
        sharedSessions: [
          {
            type: "Lab",
            section: "LAB L04",
            time: "Friday 1:00-3:00 PM",
          },
          {
            type: "Tutorial",
            section: "TUT T01",
            time: "Wednesday 1:00-3:00 PM",
          },
        ],
      },
    ],
    hoursPerWeek: 10,
    session: "Summer Session 2024",
    offerDate: "2024-02-20",
    responseDeadline: "2024-03-01",
    responseDate: "2024-02-27",
    status: "Rejected",
  },
];


function getStatusBadge(status) {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Response</Badge>
    case "accepted":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    case "expired":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case "High":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>
    case "Medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>
    case "Low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Pending":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "Accepted":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "Rejected":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "Expired":
      return <Clock className="h-4 w-4 text-gray-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}


export default function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState(null)
  // State for current user data (displayed and modified)
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [isLoadingPendingOffers, setIsLoadingPendingOffers] = useState(true);
  const [isLoadingOfferItemsDetails, setIsLoadingOfferItemsDetails] = useState(true);
  const [error, setError] = useState(null);

  const handleAcceptOffer = (offerId) => {
    console.log("Accepting offer:", offerId)
    // Handle accept logic here
  }

  const handleRejectOffer = (offerId) => {
    console.log("Rejecting offer:", offerId)
    // Handle reject logic here
  }

  const transformBackendDataToFrontend = (data) => {

    let firstName = '';
    let lastName = '';

    // Check if backend returns a single 'name' field (expected)
    if (data.name) {
      console.log("Using name field:", data.name);
      const nameParts = data.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    // Fallback: if backend returns first_name and last_name separately
    else if (data.first_name || data.last_name) {
      console.log("Using first_name and last_name fields");
      if (data.first_name && data.last_name && data.last_name.trim() !== '') {
        // Both fields exist and are not empty
        firstName = data.first_name;
        lastName = data.last_name;
      } else if (data.first_name) {
        // Only first_name exists, split it
        const nameParts = data.first_name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
    }
    // Try student_info if available
    else if (data.student_info?.name) {
      const nameParts = data.student_info.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    return {
      // USE THE PARSED NAMES:
      firstName: firstName,
      lastName: lastName,
      email: data.email || '',
      avatar: data.avatar || "/placeholder.svg?height=120&width=120",
    };
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // First fetch user data
        setIsLoading(true);
        const data = await getProfile();
        const profileData = transformBackendDataToFrontend(data);
        setUserData(profileData);
        
        // Then fetch pending offers
        setIsLoadingPendingOffers(true);
        const pendingOffersData = await getPendingOffers();
        setPendingOffers(pendingOffersData);
        
        // Only fetch details if we have pending offers
        if (pendingOffersData.length > 0) {
          setIsLoadingOfferItemsDetails(true);
          const offersWithDetails = await Promise.all(
            pendingOffersData.map(async (offer) => {
              const detailedItems = await Promise.all(
                offer.offer_items.map(async (item) => {
                  if (item.item_type === "course_offering") {
                    const details = await getCourseOfferingDetails(item.course_offering_id);
                    return { ...item, details };
                  } else if (item.item_type === "shared_session") {
                    const details = await getSharedSessionDetails(item.shared_session_id);
                    return { ...item, details };
                  }
                  return item; //if item_type is not recognized, then return the item as is
                })
              );
              return { ...offer, offer_items: detailedItems };
            })
          );
          setPendingOffers(offersWithDetails);
        }
      } catch (error) {
        setError("Failed to load data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingPendingOffers(false);
        setIsLoadingOfferItemsDetails(false);
      }
    };

    fetchAllData();
  }, []); // Only runs once on mount

  if (isLoading && isLoadingPendingOffers && isLoadingOfferItemsDetails) {
    return <div className="flex justify-center items-center h-screen">Loading student offers...</div>;
  }

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            name={`${userData.firstName} ${userData.lastName}`}
            email={userData.email}
            avatar={userData.avatar}
          />
          <div className="flex-1">
            {/* Header */}
            <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">TA Position Offers</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={studentProfile.avatar || "/placeholder.svg"} alt={studentProfile.name} />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 space-y-6 p-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your TA Offers</h2>
                  <p className="text-muted-foreground">Manage your teaching assistant position offers</p>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Offers</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingOffers.length}</div>
                    <p className="text-xs text-muted-foreground">Awaiting response</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Accepted Offers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {pastOffers.filter((offer) => offer.status === "Accepted").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Active positions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Needed</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {currentOffers.filter((offer) => offer.daysLeft <= 7).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Urgent responses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="current" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="current">Current Offers ({currentOffers.length})</TabsTrigger>
                  <TabsTrigger value="past">Past Offers ({pastOffers.length})</TabsTrigger>
                </TabsList>

                {/* Current Offers Tab */}
                <TabsContent value="current" className="space-y-4">
                  {pendingOffers.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Pending Offers</h3>
                        <p className="text-muted-foreground text-center">
                          You don't have any pending offers at the moment. Check back later or browse available
                          positions.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {pendingOffers.map((offer) => (
                        <Card key={offer.offer_id} className="overflow-hidden">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{"offer.session"} Offer</CardTitle>
                                </div>
                                <CardDescription>
                                  {/*offer.courses.map(course = course.instructor).join(", ")*/}
                                  course instructor
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(offer.status)}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Course Details */}
                            <div className="space-y-3">
                              {offer.offer_items.map((course, idx) => (
                                <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-2">
                                  <div className="font-semibold text-base">{course.course}</div>
                                  <div className="text-sm text-muted-foreground">Instructor: {course.instructor}</div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {course.courseOfferings.map((section, i) => (
                                      <div key={`offer-${i}`} className="text-sm">
                                        📘 {section.type} - {section.section} • {section.time}
                                      </div>
                                    ))}
                                    {course.sharedSessions.map((session, i) => (
                                      <div key={`session-${i}`} className="text-sm">
                                        🧪 {session.type} - {session.section} • {session.time}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Offer Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">Hours/Week</p>
                                <p className="text-lg font-bold">{offer.hoursPerWeek}</p>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Offer Received</p>
                                <p className="text-muted-foreground">{offer.offerDate}</p>
                              </div>
                              <div>
                                <p className="font-medium">Response Deadline</p>
                                <p className={offer.daysLeft <= 7 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                                  {offer.responseDeadline}
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                              <Button onClick={() => handleAcceptOffer(offer.id)} className="flex-1">
                                <Check className="h-4 w-4 mr-2" />
                                Accept Offer
                              </Button>
                              <Button variant="outline" onClick={() => handleRejectOffer(offer.id)} className="flex-1">
                                <X className="h-4 w-4 mr-2" />
                                Decline Offer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                  )}
                </TabsContent>

                {/* Past Offers Tab */}
                <TabsContent value="past" className="space-y-4">
                  {pastOffers.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Past Offers</h3>
                        <p className="text-muted-foreground text-center">
                          Your offer history will appear here once you receive and respond to offers.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {pastOffers.map((offer) => (
                        <Card key={offer.id} className="overflow-hidden">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{offer.session} Offer</CardTitle>
                                </div>
                                <CardDescription>
                                  {offer.courses.map(course => course.instructor).join(", ")}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Course Details */}
                            <div className="space-y-3">
                              {offer.courses.map((course, idx) => (
                                <div key={idx} className="p-4 bg-muted/50 rounded-lg space-y-2">
                                  <div className="font-semibold text-base">{course.course}</div>
                                  <div className="text-sm text-muted-foreground">Instructor: {course.instructor}</div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {course.courseOfferings.map((section, i) => (
                                      <div key={`offer-${i}`} className="text-sm">
                                        📘 {section.type} - {section.section} • {section.time}
                                      </div>
                                    ))}
                                    {course.sharedSessions.map((session, i) => (
                                      <div key={`session-${i}`} className="text-sm">
                                        🧪 {session.type} - {session.section} • {session.time}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Offer Metadata */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">Hours/Week</p>
                                <p className="text-lg font-bold">{offer.hoursPerWeek}</p>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Offer Received</p>
                                <p className="text-muted-foreground">{offer.offerDate}</p>
                              </div>
                              <div>
                                <p className="font-medium">Response Deadline</p>
                                <p className={offer.daysLeft <= 7 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                                  {offer.responseDeadline}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Status:</p>
                                <p className={offer.status === "Accepted" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{offer.status}</p>
                              </div>
                            </div>

                          </CardContent>
                        </Card>
                      ))}

                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
