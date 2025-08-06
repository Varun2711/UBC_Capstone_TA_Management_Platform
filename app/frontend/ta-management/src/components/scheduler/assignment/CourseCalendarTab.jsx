import { useState, useMemo } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import {
  Search,
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

import { parseTermCode } from "@/logic/assignmentManagement";

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Define custom styles for the calendar
const calendarStyle = {
  height: 600,
};

const eventStyleGetter = (event) => {
  let backgroundColor = '#3174ad';
  
  // Color code based on section type
  switch (event.sectionType) {
    case 'Lecture':
      backgroundColor = '#3174ad'; // Blue
      break;
    case 'Lab':
      backgroundColor = '#28a745'; // Green
      break;
    case 'Tutorial':
      backgroundColor = '#ffc107'; // Yellow
      break;
    case 'Seminar':
      backgroundColor = '#dc3545'; // Red
      break;
    case 'Workshop':
      backgroundColor = '#6f42c1'; // Purple
      break;
    default:
      backgroundColor = '#6c757d'; // Gray
  }

  return {
    style: {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '12px',
      fontWeight: 'bold',
    }
  };
};

export function CourseCalendarTab({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!courseSearch) return courses;
    
    return courses.filter(course =>
      course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.department.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, courseSearch]);

  // Get available years for selected course
  const availableYears = useMemo(() => {
    if (!selectedCourse) return [];
    
    return Object.keys(selectedCourse.yearlyOfferings || {})
      .sort((a, b) => parseInt(b) - parseInt(a));
  }, [selectedCourse]);

  // Get available terms for selected course and year
  const availableTerms = useMemo(() => {
    if (!selectedCourse || !selectedYear) return [];
    
    const yearData = selectedCourse.yearlyOfferings[selectedYear] || {};
    return Object.keys(yearData).map(termKey => {
      const parsedTerm = parseTermCode(termKey);
      if (parsedTerm) {
        let formattedTerm = "";
        if (parsedTerm.term === 'Both') {
          formattedTerm = `${parsedTerm.season} Both Terms`;
        } else {
          formattedTerm = `${parsedTerm.season} Term ${parsedTerm.term}`;
        }
        return { key: termKey, display: formattedTerm };
      }
      return null;
    }).filter(Boolean);
  }, [selectedCourse, selectedYear]);

  // Convert time string to Date object for a specific day
  const convertTimeToDate = (timeStr, dayOfWeek) => {
    // Create a date for the start of the week (Monday)
    const startOfWeek = moment().startOf('week').add(1, 'day'); // Start from Monday
    
    // Map day names to numbers (0 = Monday, 6 = Sunday)
    const dayMap = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6
    };
    
    const dayNumber = dayMap[dayOfWeek] || 0;
    const targetDate = startOfWeek.clone().add(dayNumber, 'days');
    
    // Parse time (e.g., "9:00 AM")
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return targetDate.hour(hour24).minute(minutes).second(0).toDate();
  };

  // Generate calendar events from course sections
  const calendarEvents = useMemo(() => {
    if (!selectedCourse || !selectedYear || !selectedTerm) return [];
    
    const yearData = selectedCourse.yearlyOfferings[selectedYear] || {};
    const termKey = availableTerms.find(term => term.display === selectedTerm)?.key;
    
    if (!termKey) return [];
    
    const sections = yearData[termKey] || [];
    
    const events = [];
    
    sections.forEach(section => {
      section.timeSlots.forEach(timeSlot => {
        if (timeSlot.day === 'TBD' || timeSlot.startTime === 'TBD') return;
        
        const startDate = convertTimeToDate(timeSlot.startTime, timeSlot.day);
        const endDate = convertTimeToDate(timeSlot.endTime, timeSlot.day);
        
        // Create a unique title based on section type and assigned TA
        let eventTitle = `${selectedCourse.code} ${section.section}`;
        if (section.assignedTA) {
          eventTitle += ` - ${section.assignedTA}`;
        } else {
          eventTitle += ` - Unassigned`;
        }
        
        events.push({
          id: `${section.id}-${timeSlot.day}`,
          title: eventTitle,
          start: startDate,
          end: endDate,
          resource: {
            section,
            timeSlot,
            courseName: selectedCourse.name,
            courseCode: selectedCourse.code,
            sectionType: section.sectionType,
            assignedTA: section.assignedTA,
            studentId: section.studentId,
            weekHours: section.weekHours,
            instructor: selectedCourse.instructor
          },
          sectionType: section.sectionType
        });
      });
    });
    
    return events;
  }, [selectedCourse, selectedYear, selectedTerm, availableTerms]);

  // Custom event component for course calendar
  const EventComponent = ({ event }) => (
    <div className="p-1 h-full overflow-hidden">
      <div className="font-semibold text-xs truncate" title={event.title}>
        {selectedCourse.code} {event.resource.section.section}
      </div>
      <div className="text-xs opacity-90 truncate" title={event.resource.sectionType}>
        {event.resource.sectionType}
      </div>
      <div className="text-xs opacity-80 truncate" title={event.resource.assignedTA || 'Unassigned'}>
        {event.resource.assignedTA || 'Unassigned'}
      </div>
    </div>
  );

  // Reset selections when course changes
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedYear("");
    setSelectedTerm("");
    setCourseSearchOpen(false);
  };

  // Count total sections and assigned TAs
  const getCourseSummary = () => {
    if (!selectedCourse || !selectedYear || !selectedTerm) return null;
    
    const yearData = selectedCourse.yearlyOfferings[selectedYear] || {};
    const termKey = availableTerms.find(term => term.display === selectedTerm)?.key;
    
    if (!termKey) return null;
    
    const sections = yearData[termKey] || [];
    const totalSections = sections.length;
    const assignedSections = sections.filter(section => section.assignedTA).length;
    const totalHours = sections.reduce((sum, section) => sum + (section.weekHours || 0), 0);
    
    return {
      totalSections,
      assignedSections,
      unassignedSections: totalSections - assignedSections,
      totalHours
    };
  };

  const courseSummary = getCourseSummary();

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Course Schedule Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Selection */}
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Popover open={courseSearchOpen} onOpenChange={setCourseSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={courseSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedCourse ? (
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {selectedCourse.code} - {selectedCourse.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search courses...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search courses..." 
                      value={courseSearch}
                      onValueChange={setCourseSearch}
                    />
                    <CommandEmpty>No courses found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {filteredCourses.map((course) => (
                          <CommandItem
                            key={course.id}
                            value={`${course.code} ${course.name}`}
                            onSelect={() => handleCourseSelect(course)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{course.code} - {course.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {course.department}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Year Selection */}
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm} disabled={!selectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {availableTerms.map(term => (
                    <SelectItem key={term.key} value={term.display}>{term.display}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course Info Summary */}
          {selectedCourse && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold">
                    {selectedCourse.code.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedCourse.code} - {selectedCourse.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourse.department}
                    </p>
                  </div>
                </div>
                {courseSummary && (
                  <div className="text-right">
                    <div className="flex gap-2 mb-1">
                      <Badge variant="outline">{courseSummary.totalSections} sections</Badge>
                      <Badge variant="outline">{courseSummary.totalHours}h/week</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {courseSummary.assignedSections} assigned • {courseSummary.unassignedSections} unassigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Display */}
      {selectedCourse && selectedYear && selectedTerm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule - {selectedCourse.code}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedYear}</span>
                <span>•</span>
                <span>{selectedTerm}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarEvents.length > 0 ? (
              <>
                {/* Legend */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge style={{ backgroundColor: '#3174ad' }}>Lecture</Badge>
                  <Badge style={{ backgroundColor: '#28a745' }}>Lab</Badge>
                  <Badge style={{ backgroundColor: '#ffc107', color: '#000' }}>Tutorial</Badge>
                  <Badge style={{ backgroundColor: '#dc3545' }}>Seminar</Badge>
                  <Badge style={{ backgroundColor: '#6f42c1' }}>Workshop</Badge>
                </div>

                {/* Calendar */}
                <div style={calendarStyle}>
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['week']}
                    defaultView="week"
                    toolbar={false}
                    eventPropGetter={eventStyleGetter}
                    components={{
                      event: EventComponent,
                    }}
                    step={30}
                    timeslots={2}
                    min={new Date(2024, 0, 1, 7, 0)} // 7 AM
                    max={new Date(2024, 0, 1, 22, 0)} // 10 PM
                    formats={{
                      timeGutterFormat: 'h:mm A',
                      eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                        localizer.format(start, 'h:mm A', culture) + ' - ' +
                        localizer.format(end, 'h:mm A', culture)
                    }}
                  />
                </div>

                {/* Section Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendarEvents.map(event => (
                    <Card key={event.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">
                            {event.resource.courseCode} {event.resource.section.section}
                          </h4>
                          <p className="text-xs text-muted-foreground">{event.resource.courseName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {event.resource.sectionType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.resource.weekHours}h/week
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {moment(event.start).format('dddd h:mm A')} - {moment(event.end).format('h:mm A')}
                          </p>
                          <div className="mt-1">
                            {event.resource.assignedTA ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">
                                  {event.resource.assignedTA}
                                </span>
                                {event.resource.studentId && (
                                  <span className="text-xs text-muted-foreground">
                                    ({event.resource.studentId})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-orange-600" />
                                <span className="text-xs text-orange-600 font-medium">
                                  Unassigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No sections found
                </h3>
                <p className="text-sm text-muted-foreground">
                  This course has no sections for the selected term.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Select Course, Year, and Term
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a course, academic year, and term to view its weekly schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}