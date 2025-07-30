import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Calendar,
  MapPin,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import { getProfile } from "@/logic/student-profile";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  fetchStudentAssignments,
  transformAssignmentsToCalendarEvents,
  getAssignmentStatus,
  formatAssignmentDisplay,
} from "@/logic/student-schedule";

const localizer = momentLocalizer(moment);

export default function ViewStudentSchedule() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [assignmentsSummary, setAssignmentsSummary] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("week");

  // Load user profile and assignments on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user profile
        const profile = await getProfile();
        setUserData(profile);

        // Load assignments
        const assignmentsData = await fetchStudentAssignments();

        if (assignmentsData && assignmentsData.assignments) {
          setAssignments(assignmentsData.assignments);
          setAssignmentsSummary(assignmentsData.summary || {});

          // Transform assignments to calendar events
          const events = transformAssignmentsToCalendarEvents(
            assignmentsData.assignments
          );
          setCalendarEvents(events);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load assignments. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Custom toolbar component without "Today" button
  const CustomToolbar = ({ label, onNavigate, onView, views, view }) => {
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="rbc-btn rbc-btn-prev"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="rbc-btn rbc-btn-next"
          >
            Next
          </button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <span className="rbc-btn-group">
          {views.map((name) => (
            <button
              key={name}
              type="button"
              className={`rbc-btn ${view === name ? "rbc-active" : ""}`}
              onClick={() => onView(name)}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </span>
      </div>
    );
  };

  // Custom event component for calendar
  const EventComponent = ({ event }) => (
    <div
      className="h-full w-full overflow-hidden p-1 rounded-sm"
      style={{
        backgroundColor: "#3b82f6",
        color: "white",
        lineHeight: "1.2",
        fontSize: "12px",
        border: "none",
        outline: "none",
      }}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="font-semibold truncate">{event.sessionType}</div>
    </div>
  );

  // Render assignment card
  const AssignmentCard = ({ assignment }) => {
    const formatted = formatAssignmentDisplay(assignment);
    const statusInfo = getAssignmentStatus(assignment);

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {formatted.courseCode} - {formatted.courseName}
              </CardTitle>
              <CardDescription>
                Section {formatted.sectionNumber} • {formatted.sessionType}
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* Display combined offer item information */}
              {formatted.offerItems && formatted.offerItems.length > 0 && (
                <div className="space-y-2">
                  {formatted.offerItems.map((item, index) => {
                    const timeSlot = item.time_slot;
                    const sessionType =
                      item.item_type === "course_offering" ? "Course" : "Lab";
                    const courseCode = item.course_number;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>
                          {timeSlot ? (
                            <>
                              {timeSlot.day} {timeSlot.start_time} -{" "}
                              {timeSlot.end_time} • {sessionType}, {courseCode}
                            </>
                          ) : (
                            <>
                              {sessionType}, {courseCode} • Time TBD
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fallback to original time slots display if offer items not available */}
              {(!formatted.offerItems || formatted.offerItems.length === 0) &&
                formatted.timeSlots &&
                formatted.timeSlots.length > 0 && (
                  <div className="space-y-1">
                    {formatted.timeSlots.map((timeSlot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>
                          {timeSlot.day} {timeSlot.start_time} -{" "}
                          {timeSlot.end_time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              {/* Display locations if available */}
              {formatted.offerItems && formatted.offerItems.length > 0 && (
                <div className="space-y-1">
                  {formatted.offerItems
                    .filter((item) => item.time_slot?.location)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>{item.time_slot.location}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Role: {formatted.role.toUpperCase()}</span>
              </div>

              {formatted.instructor && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span>Instructor: {formatted.instructor}</span>
                </div>
              )}

              {/* Show total weekly hours */}
              {formatted.weeklyHours > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatted.weeklyHours} hours/week</span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Assigned:{" "}
                {new Date(formatted.assignedDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Show detailed breakdown for multi-item assignments - simplified */}
          {formatted.offerItems && formatted.offerItems.length > 1 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Assignment Summary:
              </p>
              <div className="text-xs text-blue-800">
                Total: {formatted.offerItems.length} sessions •{" "}
                {formatted.weeklyHours} hours/week
              </div>
            </div>
          )}

          {formatted.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{formatted.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            name={`${userData.first_name || ""} ${userData.last_name || ""}`}
            email={userData.email || ""}
            avatar={userData.avatar}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your assignments...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          name={`${userData.first_name || ""} ${userData.last_name || ""}`}
          email={userData.email || ""}
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

          <main className="flex-1 space-y-6 p-6">
            <div className="min-h-screen bg-gray-50 py-8">
              <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Schedule
                  </h1>
                  <p className="text-gray-600">
                    View and manage your teaching assistant assignments
                  </p>

                  {/*  Summary Cards {assignmentsSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-primary">
                            {assignmentsSummary.total_assignments || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Assignments
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-primary">
                            {assignmentsSummary.total_weekly_hours || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Hours per Week
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-primary">
                            {assignmentsSummary.courses?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Unique Courses
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )} */}
                </div>

                {/* Error Display */}
                {error && (
                  <Alert className="mb-6" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Tabbed Content */}
                <Tabs defaultValue="list" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="list">Assignment List</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  </TabsList>

                  {/* List View Tab */}
                  <TabsContent value="list" className="space-y-4">
                    {assignments.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Assignments Yet
                          </h3>
                          <p className="text-gray-600">
                            You don't have any TA assignments at the moment.
                            Check back later.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <AssignmentCard
                            key={assignment.assignment_id}
                            assignment={assignment}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Calendar View Tab */}
                  <TabsContent value="calendar" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Schedule</CardTitle>
                        <CardDescription>
                          Your TA assignments displayed on a weekly calendar
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {calendarEvents.length === 0 ? (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              No scheduled assignments to display on calendar
                            </p>
                          </div>
                        ) : (
                          <div className="h-[650px] overflow-hidden rounded-lg border">
                            <BigCalendar
                              localizer={localizer}
                              events={calendarEvents}
                              startAccessor="start"
                              endAccessor="end"
                              views={["week", "day"]}
                              view={currentView}
                              date={currentDate}
                              onNavigate={(date) => setCurrentDate(date)}
                              onView={(view) => setCurrentView(view)}
                              step={30}
                              timeslots={2}
                              showMultiDayTimes
                              components={{
                                event: EventComponent,
                                toolbar: CustomToolbar,
                              }}
                              dayLayoutAlgorithm="no-overlap"
                              // onSelectEvent={(event) => {
                              //   // Optional: Handle event selection
                              //   console.log("Selected event:", event);
                              // }}
                              eventPropGetter={(event) => ({
                                //needed to correctly format the event box on calendar
                                style: {
                                  borderRadius: "4px",
                                  border: "none",
                                  padding: "4px",
                                  fontSize: "12px",
                                  lineHeight: "1.3",
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  minHeight: "50px",
                                  backgroundColor: "#3b82f6", // Important to avoid default blue background!
                                },
                              })}
                              formats={{
                                eventTimeRangeFormat: () => "",
                                agendaTimeFormat: () => "",
                                agendaTimeRangeFormat: () => "",
                              }}
                              min={new Date(2025, 0, 1, 8, 0)} // 8:00 AM
                              max={new Date(2025, 0, 1, 20, 0)} // 8:00 PM
                              toolbar={true}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
