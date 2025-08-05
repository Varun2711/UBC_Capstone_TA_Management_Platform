"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Bell, ArrowLeft, Users, Calendar, Clock, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar"
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Import logic functions
import {
  fetchCourseDetailsData,
  transformCourseData,
  generateCalendarEvents,
  getEventStyle,
  getSessionTypeColor
} from "@/logic/courseDetails"

const localizer = momentLocalizer(moment)

export default function CourseDetails() {
  const { courseId, term } = useParams() // Get both courseId and term from URL
  const navigate = useNavigate()
  const [courseData, setCourseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId || !term) {
        setError("Missing course ID or term parameter")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch all data using logic functions
        const {
          courseFullDetails,
          offeringsWithTAs,
          sharedSessionsWithTAs
        } = await fetchCourseDetailsData(courseId, term)

        // Transform data to match component structure
        const transformedData = transformCourseData(
          courseFullDetails,
          offeringsWithTAs,
          sharedSessionsWithTAs,
          term
        )

        setCourseData(transformedData)
      } catch (error) {
        console.error("Failed to fetch course data:", error)
        setError(error.message || "Failed to load course data")
      } finally {
        setIsLoading(false)
      }
    }

    loadCourseData()
  }, [courseId, term])

  const handleBackToCourses = () => {
    navigate("/my-courses")
  }

  // Custom event component
  const EventComponent = ({ event }) => {
    return (
      <div className="h-full w-full overflow-hidden bg-transparent" style={{ padding: '2px' }}>
        <div className="font-semibold text-xs leading-tight mb-1 text-white">
          {event.resource.section}
        </div>
        <div className="text-xs opacity-90 leading-tight text-white">
          {event.resource.tas}
        </div>
      </div>
    )
  }

  // Custom header
  const CustomHeader = ({ date }) => {
    const dayName = moment(date).format('dddd')
    return (
      <div className="text-center font-medium py-2">
        {dayName}
      </div>
    )
  }

  // Calendar component with proper height to show until 9 PM
  const SimpleCalendar = () => {
    const events = generateCalendarEvents(courseData)
    
    return (
      <div className="space-y-6">
        <div className="h-[650px] overflow-hidden rounded-lg border"> {/* Increased from 600px to 650px */}
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            view="week"  // Changed from 'work_week' to 'week'
            views={['week']}  // Changed from ['work_week'] to ['week']
            defaultView="week"  // Changed from 'work_week' to 'week'
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 8, 0)}   // 8:00 AM
            max={new Date(2024, 0, 1, 21, 0)}  // 9:00 PM (21:00)
            eventPropGetter={getEventStyle}
            components={{
              week: {  // Changed from 'work_week' to 'week'
                header: CustomHeader,
                event: EventComponent
              }
            }}
            toolbar={false}
            className="rbc-calendar h-full"
            dayLayoutAlgorithm="no-overlap"
            formats={{
              dayFormat: 'dddd',
              eventTimeRangeFormat: () => '',
              agendaTimeFormat: () => '',
              agendaTimeRangeFormat: () => ''
            }}
          />
        </div>
        
        {/* Legend remains the same */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Lectures</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Labs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">Tutorials</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">Seminars</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-indigo-500 rounded"></div>
              <span className="text-sm">Workshops</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <SidebarProvider>
        <InstructorSidebar activePage="My Courses" />
        <SidebarInset>
          <div className="flex justify-center items-center h-screen">
            <div className="text-lg">Loading course details...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Error state
  if (error) {
    return (
      <SidebarProvider>
        <InstructorSidebar activePage="My Courses" />
        <SidebarInset>
          <div className="flex justify-center items-center h-screen">
            <div className="text-lg text-red-500">Error: {error}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // No data state
  if (!courseData) {
    return (
      <SidebarProvider>
        <InstructorSidebar activePage="My Courses" />
        <SidebarInset>
          <div className="flex justify-center items-center h-screen">
            <div className="text-lg text-red-500">Course not found</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <InstructorSidebar activePage="My Courses" />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={handleBackToCourses} className="cursor-pointer">
                  My Courses
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {courseData.course_number} - {courseData.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-6">
          {/* Back Navigation */}
          <div className="flex items-center space-x-2">
            <Button onClick={handleBackToCourses} variant="ghost" className="text-blue-600 hover:text-blue-700 p-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to My Courses
            </Button>
          </div>

          {/* Course Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {courseData.course_number} - {courseData.title}
            </h1>
            <p className="text-muted-foreground">
              {courseData.term}
            </p>
            {courseData.description && (
              <p className="text-sm text-muted-foreground max-w-3xl">
                {courseData.description}
              </p>
            )}
          </div>

          {/* Course Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total TAs</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseData.stats.total_tas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lectures</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseData.stats.lecture_sections}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Labs</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseData.stats.lab_sections}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tutorials</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseData.stats.tutorial_sections}</div>
              </CardContent>
            </Card>
          </div>

          {/* Course Sections and Sessions */}
          <Tabs defaultValue="offerings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="offerings">My Sections</TabsTrigger>
              <TabsTrigger value="sessions">Labs & Tutorials</TabsTrigger>
              <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            </TabsList>

            {/* Course Offerings Tab */}
            <TabsContent value="offerings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Sections (My Offerings)</CardTitle>
                  <CardDescription>
                    Lecture sections that you are assigned to teach
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.offerings.map((offering) => (
                      <div key={offering.id} className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center">
                          Section {offering.section}
                          <Badge className={`${getSessionTypeColor(offering.type)} ml-2`} variant="secondary">
                            {offering.type.toUpperCase()}
                          </Badge>
                        </h3>
                        
                        <div className="space-y-2">
                          {offering.schedule_days.map((scheduleDay, index) => (
                            <Card key={`${offering.id}-${index}`} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <CardTitle className="text-base">
                                      {scheduleDay.days}
                                    </CardTitle>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {scheduleDay.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <h4 className="font-medium">Assigned TAs:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {scheduleDay.tas_assigned.length > 0 ? (
                                      scheduleDay.tas_assigned.map((ta, taIndex) => (
                                        <div key={taIndex} className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                                          <User className="h-4 w-4" />
                                          <span className="font-medium">{ta.name}</span>
                                          {ta.student_number && (
                                            <span className="text-xs text-muted-foreground">({ta.student_number})</span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No TAs assigned</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                    {courseData.offerings.length === 0 && (
                      <p className="text-muted-foreground">No course sections found for this term.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shared Sessions Tab */}
            <TabsContent value="sessions" className="space-y-4">
              {/* Labs Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Labs</CardTitle>
                  <CardDescription>
                    Lab sessions associated with your course sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.shared_sessions
                      .filter(session => session.type === 'lab')
                      .map((session) => (
                      <Card key={session.id} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">
                                {session.section}
                                <Badge className={`${getSessionTypeColor(session.type)} ml-2`} variant="secondary">
                                  {session.type.toUpperCase()}
                                </Badge>
                              </CardTitle>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {session.schedule}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium">Assigned TAs:</h4>
                            <div className="flex flex-wrap gap-2">
                              {session.tas_assigned.length > 0 ? (
                                session.tas_assigned.map((ta, index) => (
                                  <div key={index} className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{ta.name}</span>
                                    {ta.student_number && (
                                      <span className="text-xs text-muted-foreground">({ta.student_number})</span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No TAs assigned</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {courseData.shared_sessions.filter(session => session.type === 'lab').length === 0 && (
                      <p className="text-muted-foreground">No lab sessions found for this course.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tutorials Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Tutorials</CardTitle>
                  <CardDescription>
                    Tutorial sessions associated with your course sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.shared_sessions
                      .filter(session => session.type === 'tutorial')
                      .map((session) => (
                      <Card key={session.id} className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">
                                {session.section}
                                <Badge className={`${getSessionTypeColor(session.type)} ml-2`} variant="secondary">
                                  {session.type.toUpperCase()}
                                </Badge>
                              </CardTitle>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {session.schedule}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium">Assigned TAs:</h4>
                            <div className="flex flex-wrap gap-2">
                              {session.tas_assigned.length > 0 ? (
                                session.tas_assigned.map((ta, index) => (
                                  <div key={index} className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{ta.name}</span>
                                    {ta.student_number && (
                                      <span className="text-xs text-muted-foreground">({ta.student_number})</span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No TAs assigned</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {courseData.shared_sessions.filter(session => session.type === 'tutorial').length === 0 && (
                      <p className="text-muted-foreground">No tutorial sessions found for this course.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Overview Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule Overview</CardTitle>
                  <CardDescription>
                    All course activities and TA assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleCalendar />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}