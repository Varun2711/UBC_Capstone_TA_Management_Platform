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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  consolidateTimeSlots,
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load user profile and assignments on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user profile
        const profile = await getProfile();
        setUserData(profile);

        // Load assignments (now includes term information)
        const assignmentsData = await fetchStudentAssignments();

        if (assignmentsData && assignmentsData.assignments) {
          setAssignments(assignmentsData.assignments);
          setAssignmentsSummary(assignmentsData.summary || {});

          // Transform assignments to calendar events (now async)
          const events = await transformAssignmentsToCalendarEvents(
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

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  //what the user sees when they click on the event
  const EventDetailsModal = () => {
    if (!selectedEvent) return null;

    const { resource } = selectedEvent;
    const assignment = resource.assignment;
    const timeSlot = resource.timeSlot;

    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              data-testid="dialog-title"
            >
              <Calendar className="h-5 w-5 text-blue-600" />
              {selectedEvent.title}
            </DialogTitle>
            <DialogDescription
              className="text-dark-800 font-medium"
              data-testid="dialog-description"
            >
              {selectedEvent.sessionType}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Time and Date */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-dark-800">
                <div className="font-medium capitalize">{timeSlot.day}</div>
                <div>{moment(selectedEvent.start).format("MMMM Do, YYYY")}</div>
                <div>
                  {moment(selectedEvent.start).format("h:mm A")} -{" "}
                  {moment(selectedEvent.end).format("h:mm A")}
                </div>
              </div>
            </div>

            {/* Location */}
            {resource.location && resource.location !== "TBD" && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{resource.location}</span>
              </div>
            )}

            {/* Assignment Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700 bg-blue-50 rounded-lg p-3">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-dark">
                  Role:{" "}
                  <span className="font-medium">
                    {resource.role.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>

            {/* Course Information */}
            {assignment.course && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    Course Details
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="font-medium">Course:</span>{" "}
                    {assignment.course.course_name}
                  </div>
                  {assignment.course_offering?.instructor && (
                    <div>
                      <span className="font-medium">Instructor:</span>{" "}
                      {assignment.course_offering.instructor}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {assignment.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">Notes</span>
                </div>
                <p className="text-sm text-amber-800">{assignment.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              data-testid="dialog-close"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // AssignmentCard component that shows TA assignments as list
  const AssignmentCard = ({ assignment }) => {
    const formatted = formatAssignmentDisplay(assignment);
    const statusInfo = getAssignmentStatus(assignment);

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-lg">
                {formatted.courseCode} - {formatted.courseName}
              </CardTitle>

              {/* Term and Basic Info Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {formatted.term && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                    {formatted.term}
                  </span>
                )}

                {formatted.term_start && formatted.term_end && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(formatted.term_start).toLocaleDateString()} -{" "}
                      {new Date(formatted.term_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Role and Hours Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Role: {formatted.role.toUpperCase()}</span>
                </div>

                {formatted.weeklyHours > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatted.weeklyHours} hours/week</span>
                  </div>
                )}

                {formatted.instructor && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>Instructor: {formatted.instructor}</span>
                  </div>
                )}
              </div>
            </div>

            <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Schedule Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Details
            </h4>

            {formatted.offerItems && formatted.offerItems.length > 0 ? (
              <div className="space-y-3">
                {formatted.offerItems.map((item, index) => {
                  const sectionNumber = item.section_number;
                  const sessionType =
                    item.item_type === "course_offering"
                      ? "Course"
                      : sectionNumber.startsWith("L")
                      ? "Lab"
                      : "Tutorial";
                  const courseCode = item.course_number;
                  const timeSlots = consolidateTimeSlots(item);

                  return (
                    <div
                      key={index}
                      className="border-l-4 border-blue-200 pl-4 py-2 bg-gray-50 rounded-r-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {courseCode} {sectionNumber}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {sessionType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.weekly_hours}h/week
                        </span>
                      </div>

                      <div className="space-y-1">
                        {timeSlots.length > 0 ? (
                          timeSlots.map((timeSlot, slotIndex) => (
                            <div
                              key={`${index}-${slotIndex}`}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="font-medium capitalize">
                                {timeSlot.day}
                              </span>
                              <span>
                                {timeSlot.start_time} - {timeSlot.end_time}
                              </span>
                              {timeSlot.location && (
                                <span className="text-gray-500">
                                  • {timeSlot.location}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span>Time and location TBD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No schedule information available</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          {formatted.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Notes
              </h4>
              <p className="text-sm text-amber-800">{formatted.notes}</p>
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
                          Your TA assignments displayed on the calendar.
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
                              views={["week", "day", "month"]}
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
                              onSelectEvent={handleSelectEvent}
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

                {/* Event Details Modal */}
                <EventDetailsModal />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
