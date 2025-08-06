import { useState, useMemo } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import {
  Search,
  Calendar as CalendarIcon,
  User,
  Clock,
  BookOpen,
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

export function StudentCalendarTab({ students }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    
    return students.filter(student =>
      student.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  // Get available years for selected student
  const availableYears = useMemo(() => {
    if (!selectedStudent) return [];
    
    return Object.keys(selectedStudent.yearlyAssignments || {})
      .sort((a, b) => parseInt(b) - parseInt(a));
  }, [selectedStudent]);

  // Get available terms for selected student and year
  const availableTerms = useMemo(() => {
    if (!selectedStudent || !selectedYear) return [];
    
    const yearData = selectedStudent.yearlyAssignments[selectedYear] || {};
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
  }, [selectedStudent, selectedYear]);

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

  // Generate calendar events from student assignments
  const calendarEvents = useMemo(() => {
    if (!selectedStudent || !selectedYear || !selectedTerm) return [];
    
    const yearData = selectedStudent.yearlyAssignments[selectedYear] || {};
    const termKey = availableTerms.find(term => term.display === selectedTerm)?.key;
    
    if (!termKey) return [];
    
    const assignments = yearData[termKey] || [];
    
    const events = [];
    
    assignments.forEach(assignment => {
      assignment.timeSlots.forEach(timeSlot => {
        if (timeSlot.day === 'TBD' || timeSlot.startTime === 'TBD') return;
        
        const startDate = convertTimeToDate(timeSlot.startTime, timeSlot.day);
        const endDate = convertTimeToDate(timeSlot.endTime, timeSlot.day);
        
        events.push({
          id: `${assignment.id}-${timeSlot.day}`,
          title: `${assignment.courseCode} ${assignment.section}`,
          start: startDate,
          end: endDate,
          resource: {
            assignment,
            timeSlot,
            courseName: assignment.courseName,
            instructor: assignment.instructor,
            sectionType: assignment.sectionType,
            weekHours: assignment.weekHours,
            notes: assignment.notes
          },
          sectionType: assignment.sectionType
        });
      });
    });
    
    return events;
  }, [selectedStudent, selectedYear, selectedTerm, availableTerms]);

  // Custom event component - removed the hours display
  const EventComponent = ({ event }) => (
    <div className="p-1 h-full overflow-hidden">
      <div className="font-semibold text-xs truncate" title={event.title}>
        {event.title}
      </div>
      <div className="text-xs opacity-90 truncate" title={event.resource.sectionType}>
        {event.resource.sectionType}
      </div>
    </div>
  );

  // Reset selections when student changes
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSelectedYear("");
    setSelectedTerm("");
    setStudentSearchOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Schedule Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedStudent ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedStudent.studentName} ({selectedStudent.studentId})
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search students...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search students..." 
                      value={studentSearch}
                      onValueChange={setStudentSearch}
                    />
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {filteredStudents.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={`${student.studentName} ${student.studentId}`}
                            onSelect={() => handleStudentSelect(student)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{student.studentName}</span>
                              <span className="text-sm text-muted-foreground">
                                {student.studentId} • {student.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {student.studyLevel} • {student.totalWeeklyHours}h/week
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
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedStudent}>
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

          {/* Student Info Summary */}
          {selectedStudent && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {selectedStudent.studentName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedStudent.studentName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.studentId} • {selectedStudent.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{selectedStudent.studyLevel}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: {selectedStudent.totalWeeklyHours}h/week
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Display */}
      {selectedStudent && selectedYear && selectedTerm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule - {selectedStudent.studentName}
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

                {/* Assignment Summary */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendarEvents.map(event => (
                    <Card key={event.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
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
                          {event.resource.instructor && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Instructor: {event.resource.instructor}
                            </p>
                          )}
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
                  No assignments found
                </h3>
                <p className="text-sm text-muted-foreground">
                  This student has no assignments for the selected term.
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
                Select Student, Year, and Term
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a student, academic year, and term to view their weekly schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}