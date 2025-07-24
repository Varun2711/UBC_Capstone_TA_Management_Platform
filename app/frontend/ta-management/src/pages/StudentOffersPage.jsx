"use client"

import { useState } from "react"
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


// Mock data for student profile
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "SJ2024001",
  major: "Computer Science",
  year: "Graduate Student",
  avatar: "/placeholder.svg?height=40&width=40",
}

// Mock data for current offers
const currentOffers = [
  {
    id: 1,
    course: "CS 102 - Programming Fundamentals",
    courseCode: "CS 102",
    instructor: "Dr. Wilson",
    section: "Lab L01",
    sectionTime: "Monday 2:00-4:00 PM",
    hoursPerWeek: 10,
    hourlyRate: 15.5,
    totalWeeks: 16,
    totalPay: 2480,
    startDate: "2024-02-05",
    endDate: "2024-05-20",
    offerDate: "2024-01-20",
    responseDeadline: "2024-02-01",
    daysLeft: 5,
    requirements: "Previous programming experience preferred. Must be available for office hours.",
    responsibilities: [
      "Assist students during lab sessions",
      "Grade lab assignments and provide feedback",
      "Hold 2 hours of office hours per week",
      "Attend weekly TA meetings",
    ],
    status: "Pending",
    priority: "High",
  },
  {
    id: 2,
    course: "CS 250 - Computer Organization",
    courseCode: "CS 250",
    instructor: "Dr. Davis",
    section: "Lecture 001 & Lab L02",
    sectionTime: "TTh 11:00-12:30, Lab: Wed 3:00-5:00 PM",
    hoursPerWeek: 15,
    hourlyRate: 16.0,
    totalWeeks: 16,
    totalPay: 3840,
    startDate: "2024-02-05",
    endDate: "2024-05-20",
    offerDate: "2024-01-22",
    responseDeadline: "2024-02-05",
    daysLeft: 9,
    requirements: "Strong understanding of computer architecture and assembly language.",
    responsibilities: [
      "Assist with lecture demonstrations",
      "Grade exams and assignments",
      "Lead lab sessions",
      "Provide tutoring support",
    ],
    status: "Pending",
    priority: "Medium",
  },
]

// Mock data for past offers
const pastOffers = [
  {
    id: 3,
    course: "CS 101 - Introduction to Programming",
    courseCode: "CS 101",
    instructor: "Dr. Smith",
    section: "Lab L03",
    sectionTime: "Friday 1:00-3:00 PM",
    hoursPerWeek: 8,
    hourlyRate: 15.0,
    totalWeeks: 16,
    totalPay: 1920,
    startDate: "2024-01-15",
    endDate: "2024-05-01",
    offerDate: "2024-01-05",
    responseDeadline: "2024-01-15",
    responseDate: "2024-01-12",
    status: "Accepted",
    priority: "High",
    currentStatus: "Active",
  },
  {
    id: 4,
    course: "CS 301 - Algorithms",
    courseCode: "CS 301",
    instructor: "Dr. Brown",
    section: "Lecture 001",
    sectionTime: "MWF 10:00-11:00 AM",
    hoursPerWeek: 12,
    hourlyRate: 17.0,
    totalWeeks: 16,
    totalPay: 3264,
    startDate: "2024-01-15",
    endDate: "2024-05-01",
    offerDate: "2024-01-03",
    responseDeadline: "2024-01-10",
    responseDate: "2024-01-08",
    status: "Rejected",
    rejectionReason: "Schedule conflict with another commitment",
    priority: "Medium",
  },
  {
    id: 5,
    course: "CS 350 - Software Engineering",
    courseCode: "CS 350",
    instructor: "Dr. Miller",
    section: "Lab L01",
    sectionTime: "Tuesday 2:00-4:00 PM",
    hoursPerWeek: 10,
    hourlyRate: 16.5,
    totalWeeks: 16,
    totalPay: 2640,
    startDate: "2023-09-01",
    endDate: "2023-12-15",
    offerDate: "2023-08-15",
    responseDeadline: "2023-08-25",
    status: "Expired",
    priority: "Low",
  },
]

function getStatusBadge(status) {
  switch (status) {
    case "Pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Response</Badge>
    case "Accepted":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
    case "Rejected":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    case "Expired":
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

  const handleAcceptOffer = (offerId) => {
    console.log("Accepting offer:", offerId)
    // Handle accept logic here
  }

  const handleRejectOffer = (offerId) => {
    console.log("Rejecting offer:", offerId)
    // Handle reject logic here
  }

  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
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
                    <div className="text-2xl font-bold">{currentOffers.length}</div>
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
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      $
                      {pastOffers
                        .filter((offer) => offer.status === "Accepted")
                        .reduce((sum, offer) => sum + offer.totalPay, 0)
                        .toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">From accepted offers</p>
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
                  {currentOffers.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Current Offers</h3>
                        <p className="text-muted-foreground text-center">
                          You don't have any pending offers at the moment. Check back later or browse available
                          positions.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {currentOffers.map((offer) => (
                        <Card key={offer.id} className="overflow-hidden">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{offer.course}</CardTitle>
                                  {getPriorityBadge(offer.priority)}
                                </div>
                                <CardDescription>
                                  {offer.instructor} • {offer.section} • {offer.sectionTime}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(offer.status)}
                                <Badge variant={offer.daysLeft <= 7 ? "destructive" : "secondary"}>
                                  {offer.daysLeft} days left
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Offer Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">Hours/Week</p>
                                <p className="text-lg font-bold">{offer.hoursPerWeek}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Hourly Rate</p>
                                <p className="text-lg font-bold">${offer.hourlyRate}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Duration</p>
                                <p className="text-lg font-bold">{offer.totalWeeks} weeks</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Total Pay</p>
                                <p className="text-lg font-bold text-green-600">${offer.totalPay.toLocaleString()}</p>
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
                                <p
                                  className={offer.daysLeft <= 7 ? "text-red-600 font-medium" : "text-muted-foreground"}
                                >
                                  {offer.responseDeadline}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">Position Duration</p>
                                <p className="text-muted-foreground">
                                  {offer.startDate} - {offer.endDate}
                                </p>
                              </div>
                            </div>

                            {/* Requirements */}
                            <div>
                              <p className="font-medium mb-2">Requirements</p>
                              <p className="text-sm text-muted-foreground">{offer.requirements}</p>
                            </div>

                            {/* Responsibilities */}
                            <div>
                              <p className="font-medium mb-2">Responsibilities</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {offer.responsibilities.map((responsibility, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    {responsibility}
                                  </li>
                                ))}
                              </ul>
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
                              <Button variant="ghost" size="sm">
                                Contact Instructor
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
                                  {getStatusIcon(offer.status)}
                                  <CardTitle className="text-lg">{offer.course}</CardTitle>
                                  {offer.status === "Accepted" && offer.currentStatus === "Active" && (
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
                                  )}
                                </div>
                                <CardDescription>
                                  {offer.instructor} • {offer.section} • {offer.sectionTime}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(offer.status)}
                                {getPriorityBadge(offer.priority)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Offer Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium">Hours/Week</p>
                                <p className="text-lg font-bold">{offer.hoursPerWeek}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Hourly Rate</p>
                                <p className="text-lg font-bold">${offer.hourlyRate}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Duration</p>
                                <p className="text-lg font-bold">{offer.totalWeeks} weeks</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Total Pay</p>
                                <p
                                  className={`text-lg font-bold ${offer.status === "Accepted" ? "text-green-600" : "text-muted-foreground"}`}
                                >
                                  ${offer.totalPay.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* Response Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Offer Date</p>
                                <p className="text-muted-foreground">{offer.offerDate}</p>
                              </div>
                              <div>
                                <p className="font-medium">Response Deadline</p>
                                <p className="text-muted-foreground">{offer.responseDeadline}</p>
                              </div>
                              <div>
                                <p className="font-medium">Your Response</p>
                                <p className="text-muted-foreground">
                                  {offer.responseDate ? offer.responseDate : "No response"}
                                </p>
                              </div>
                            </div>

                            {/* Status-specific information */}
                            {offer.status === "Rejected" && offer.rejectionReason && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                                <p className="text-sm text-red-700">{offer.rejectionReason}</p>
                              </div>
                            )}

                            {offer.status === "Accepted" && offer.currentStatus === "Active" && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium text-green-800">Position Status:</p>
                                <p className="text-sm text-green-700">
                                  Currently active - {offer.startDate} to {offer.endDate}
                                </p>
                              </div>
                            )}

                            {offer.status === "Expired" && (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm font-medium text-gray-800">Offer Expired:</p>
                                <p className="text-sm text-gray-700">Response deadline passed without action</p>
                              </div>
                            )}
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
