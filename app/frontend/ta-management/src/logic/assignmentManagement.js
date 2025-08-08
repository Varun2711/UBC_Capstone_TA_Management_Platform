import axios from "axios";

// API URLs
const COURSE_TERM_API_URL = 'http://localhost:8080/api/course-term-service';
const PROFILE_API_URL = 'http://localhost:8080/api/profile';
const ALLOCATIONS_API_URL = 'http://localhost:8080/api/allocations';

// Helper function to get the auth token from session storage
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  }
  return {};
};

// --- Term Parsing Functions ---

/**
 * Parses term code like "W2025 Term 2" into components
 */
export const parseTermCode = (termCode) => {
  if (!termCode) return null;
  
  const match = termCode.match(/^([WS])(\d{4})\s+(Term\s+(\d+)|Both\s+Terms)$/i);
  
  if (!match) return null;
  
  const seasonCode = match[1].toUpperCase();
  const year = parseInt(match[2]);
  const termPart = match[3];
  
  let term;
  if (termPart.toLowerCase().includes('both')) {
    term = 'Both';
  } else {
    const termMatch = termPart.match(/Term\s+(\d+)/);
    term = termMatch ? termMatch[1] : '1';
  }
  
  const season = seasonCode === 'W' ? 'Winter' : 'Summer';
  
  return {
    season,
    seasonCode,
    year,
    term,
    fullTerm: `${season} ${year} ${term === 'Both' ? 'Both Terms' : `Term ${term}`}`
  };
};

// --- Student Assignment API Functions ---

/**
 * Fetches all assigned students
 */
export const getAssignedStudents = async () => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/assigned_students/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches assignments for a specific student
 */
export const getStudentAssignments = async (studentNumber) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/by_student/`, {
    params: { student_number: studentNumber },
    headers: getAuthHeaders()
  });
  return response.data;
};

// --- Course Assignment API Functions ---

/**
 * Fetches all courses with full details including offerings and shared sessions
 */
export const getAllCoursesFullDetails = async () => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/courses/all_full_details/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches TA assignments for a course offering
 */
export const getTAsForCourseOffering = async (offeringId) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/tas_by_offering/`, {
    params: { course_offering_id: offeringId },
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches TA assignments for a shared session
 */
export const getTAsForSharedSession = async (sessionId) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/tas_by_offering/`, {
    params: { shared_session_id: sessionId },
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches all instructors
 */
export const getInstructors = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/instructors/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches all departments
 */
export const getDepartments = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/departments/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// --- Shared Session API Functions ---

/**
 * Fetches detailed shared session information including time slots
 */
export const getSharedSessionDetails = async (sessionId) => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/shared-sessions/${sessionId}/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// --- Helper Functions ---

/**
 * Converts time format from "05:12 PM - 07:12 PM" to "17:12-19:12"
 */
export const convertTimeFormat = (timeString) => {
  if (!timeString) return '';
  
  const [startTime, endTime] = timeString.split(' - ');
  
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hourNum = parseInt(hours, 10);
    
    if (modifier === 'AM' && hourNum === 12) {
      hourNum = 0;
    } else if (modifier === 'PM' && hourNum !== 12) {
      hourNum = hourNum + 12;
    }
    
    return `${hourNum.toString().padStart(2, '0')}:${minutes}`;
  };
  
  return `${convertTo24Hour(startTime)}-${convertTo24Hour(endTime)}`;
};

/**
 * Converts 24-hour time format to 12-hour format
 */
export const convertTo12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const modifier = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${modifier}`;
};

/**
 * Calculates the duration in hours between start and end time
 */
export const calculateTimeSlotDuration = (timeString) => {
  if (!timeString) return 0;
  
  try {
    const converted = convertTimeFormat(timeString);
    const [startTime, endTime] = converted.split('-');
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;
    
    return Math.round(durationHours * 10) / 10;
  } catch (error) {
    return 0;
  }
};

// --- Student Data Processing Functions ---

/**
 * Fetches and processes all student assignment data
 */
export const fetchAllStudentAssignments = async () => {
  try {
    const assignedStudents = await getAssignedStudents();

    const studentsWithAssignments = await Promise.all(
      assignedStudents.map(async (student) => {
        try {
          const assignments = await getStudentAssignments(student.student_number);
          
          return {
            ...student,
            assignments: assignments || []
          };
        } catch (error) {
          return {
            ...student,
            assignments: []
          };
        }
      })
    );

    return studentsWithAssignments;
  } catch (error) {
    throw error;
  }
};

/**
* Transforms backend student assignment data to frontend format
*/
export const transformStudentsToAssignmentFormat = (studentsData) => {
  return studentsData.map(student => {
    const totalWeeklyHours = student.assignments.reduce((total, assignment) => {
      return total + (assignment.weekly_hours || 0);
    }, 0);

    // Group assignments by academic year and term
    const yearlyAssignments = {};
    
    student.assignments.forEach(assignment => {
      // Get term and year from assignment_term
      if (!assignment.assignment_term) {
        return; // Skip if no term data
      }

      const termCode = assignment.assignment_term.code;
      const academicYear = assignment.assignment_term.academicYear;
      
      const termData = parseTermCode(termCode);
      if (!termData) {
        return;
      }

      const year = termData.year.toString();
      
      if (!yearlyAssignments[year]) {
        yearlyAssignments[year] = {};
      }
      if (!yearlyAssignments[year][termCode]) {
        yearlyAssignments[year][termCode] = [];
      }

      // Determine section type and get time slots
      let sectionType = 'Lecture';
      let section = 'N/A';
      let instructor = 'Unknown';
      let timeSlots = [{ day: 'TBD', startTime: 'TBD', endTime: 'TBD' }];

      // Get the actual assigned time slot from the assignment
      if (assignment.time_slots && assignment.time_slots.length > 0) {
        // Use the time slots directly from the assignment
        timeSlots = assignment.time_slots.map(slot => ({
          day: slot.day,
          startTime: convertTo12Hour(slot.start_time),
          endTime: convertTo12Hour(slot.end_time)
        }));
      }

      // Determine section info based on course_offering or shared_session
      if (assignment.course_offering) {
        sectionType = 'Lecture';
        section = assignment.course_offering.section_number;
        instructor = assignment.course_offering.instructor || 'Unknown';
      } else if (assignment.shared_session) {
        // Capitalize first letter of session type
        sectionType = assignment.shared_session.session_type ? 
          assignment.shared_session.session_type.charAt(0).toUpperCase() + assignment.shared_session.session_type.slice(1) : 'Lab';
        section = assignment.shared_session.section_number;
        instructor = 'Unknown'; // Shared sessions don't have direct instructor info
      }

      // If we don't have time slots from assignment.time_slots, try to match with offer items
      if (timeSlots[0].day === 'TBD' && assignment.offer_details && assignment.offer_details.offer_items) {
        const matchingOfferItem = assignment.offer_details.offer_items.find(item => {
          if (assignment.course_offering && item.item_type === 'course_offering') {
            return item.course_offering_id === assignment.course_offering.course_offering_id;
          } else if (assignment.shared_session && item.item_type === 'shared_session') {
            return item.shared_session_id === assignment.shared_session.shared_session_id;
          }
          return false;
        });

        if (matchingOfferItem) {
          if (matchingOfferItem.item_type === 'course_offering' && matchingOfferItem.time_slot) {
            // For course offerings, use the specific time slot
            timeSlots = [{
              day: matchingOfferItem.time_slot.day,
              startTime: convertTo12Hour(matchingOfferItem.time_slot.start_time.substring(0, 5)),
              endTime: convertTo12Hour(matchingOfferItem.time_slot.end_time.substring(0, 5))
            }];
          } else if (matchingOfferItem.item_type === 'shared_session' && matchingOfferItem.time_slot) {
            // For shared sessions, time_slot might be an array, use the first one as workaround
            const timeSlotData = Array.isArray(matchingOfferItem.time_slot) ? 
              matchingOfferItem.time_slot[0] : matchingOfferItem.time_slot;
            
            if (timeSlotData) {
              timeSlots = [{
                day: timeSlotData.day,
                startTime: convertTo12Hour(timeSlotData.start_time.substring(0, 8)), // Handle HH:MM:SS format
                endTime: convertTo12Hour(timeSlotData.end_time.substring(0, 8))
              }];
            }
          }
        }
      }

      const assignmentEntry = {
        id: assignment.assignment_id,
        courseCode: assignment.course.course_number,
        courseName: assignment.course.course_name,
        section: section,
        sectionType: sectionType,
        weekHours: assignment.weekly_hours || 0,
        instructor: instructor,
        notes: assignment.notes,
        assignedDate: assignment.assigned_date,
        timeSlots: timeSlots
      };

      yearlyAssignments[year][termCode].push(assignmentEntry);
    });

    const transformedStudent = {
      id: student.id,
      studentId: student.student_number,
      studentName: student.name,
      email: student.email,
      studyLevel: student.study_level,
      totalWeeklyHours: totalWeeklyHours,
      maxHours: student.study_level === 'Graduate' ? 20 : 15,
      yearlyAssignments: yearlyAssignments,
      avatar: null
    };

    return transformedStudent;
  });
};

/**
 * Fetches and enriches student assignment data with time slot information
 * Now simplified since most time slot data comes directly from the API
 */
export const fetchAndEnrichStudentAssignments = async () => {
  try {
    // Get all students with assignments
    const studentsData = await fetchAllStudentAssignments();
    
    // Transform to frontend format (this now handles time slots directly)
    const transformedStudents = transformStudentsToAssignmentFormat(studentsData);
    
    // No additional enrichment needed since time slots come from the API
    return transformedStudents;
  } catch (error) {
    throw error;
  }
};

// --- Course Data Processing Functions (existing) ---

/**
 * Fetches and processes all course assignment data
 */
export const fetchAllCourseAssignments = async () => {
  try {
    const allCourses = await getAllCoursesFullDetails();

    const instructors = await getInstructors();
    const instructorMap = new Map();
    instructors.forEach(instructor => {
      instructorMap.set(instructor.id, instructor.name);
    });

    // Process each course with TA assignments
    const coursesWithAssignments = await Promise.all(
      allCourses.map(async (course) => {
        // Process course offerings
        const offeringsWithTAs = await Promise.all(
          (course.offerings || []).map(async (offering) => {
            try {
              const taData = await getTAsForCourseOffering(offering.id);
              
              return {
                ...offering,
                assigned_tas: taData.assigned_tas || []
              };
            } catch (error) {
              return { ...offering, assigned_tas: [] };
            }
          })
        );

        // Process shared sessions
        const processedSharedSessions = {};
        
        for (const [termKey, termSessions] of Object.entries(course.sharedSessions || {})) {
          const processedTermSessions = { labs: [], tutorials: [], seminars: [], workshops: [] };
          
          // Process each session type
          for (const [sessionType, sessions] of Object.entries(termSessions)) {
            if (Array.isArray(sessions)) {
              const sessionsWithTAs = await Promise.all(
                sessions.map(async (session) => {
                  try {
                    const taData = await getTAsForSharedSession(session.id);
                    
                    return {
                      ...session,
                      assigned_tas: taData.assigned_tas || []
                    };
                  } catch (error) {
                    return { ...session, assigned_tas: [] };
                  }
                })
              );
              processedTermSessions[sessionType] = sessionsWithTAs;
            }
          }
          
          processedSharedSessions[termKey] = processedTermSessions;
        }

        return {
          ...course,
          offerings: offeringsWithTAs,
          sharedSessions: processedSharedSessions
        };
      })
    );

    return coursesWithAssignments;
  } catch (error) {
    throw error;
  }
};

/**
 * Transforms backend course data to frontend assignment format
 */
export const transformCoursesToAssignmentFormat = (coursesData, instructors = []) => {
  // Create instructor lookup map
  const instructorMap = new Map();
  instructors.forEach(instructor => {
    instructorMap.set(instructor.id, instructor.name);
  });

  return coursesData.map(course => {
    // Transform the course structure for assignment view
    const transformedCourse = {
      id: course.id,
      code: course.code,
      name: course.title,
      department: course.department,
      yearlyOfferings: {}
    };

    // Group offerings by year and term
    (course.offerings || []).forEach(offering => {
      const termData = parseTermCode(offering.term);
      if (!termData) return;

      const year = termData.year.toString();
      const termKey = offering.term;

      if (!transformedCourse.yearlyOfferings[year]) {
        transformedCourse.yearlyOfferings[year] = {};
      }
      if (!transformedCourse.yearlyOfferings[year][termKey]) {
        transformedCourse.yearlyOfferings[year][termKey] = [];
      }

      // Process time slots for lecture section
      (offering.time_slots || []).forEach((timeSlot, index) => {
        // Calculate actual duration from time slot
        const calculatedHours = calculateTimeSlotDuration(timeSlot.time);
        
        // Find TAs assigned to this specific time slot
        const assignedTAsForTimeSlot = (offering.assigned_tas || []).filter(ta => {
          if (!ta.time_slot) return false;
          
          const taTimeConverted = convertTimeFormat(timeSlot.time);
          const [taStart, taEnd] = taTimeConverted.split('-');
          
          return (
            ta.time_slot.day === timeSlot.day &&
            ta.time_slot.start_time === taStart &&
            ta.time_slot.end_time === taEnd
          );
        });

        // Create a separate entry for each time slot
        const timeSlotEntry = {
          id: `${offering.id}-slot-${index}`,
          type: "Lecture",
          section: `${offering.section} - ${timeSlot.day}`,
          sectionType: "Lecture",
          assignedTA: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].student_name : null,
          studentId: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].student_number : null,
          weekHours: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].weekly_hours : calculatedHours,
          timeSlots: [{
            day: timeSlot.day,
            startTime: convertTo12Hour(convertTimeFormat(timeSlot.time).split('-')[0]),
            endTime: convertTo12Hour(convertTimeFormat(timeSlot.time).split('-')[1])
          }]
        };

        transformedCourse.yearlyOfferings[year][termKey].push(timeSlotEntry);
      });
    });

    Object.entries(course.sharedSessions || {}).forEach(([termKey, termSessions]) => {
      const termData = parseTermCode(termKey);
      if (!termData) return;

      const year = termData.year.toString();

      if (!transformedCourse.yearlyOfferings[year]) {
        transformedCourse.yearlyOfferings[year] = {};
      }
      if (!transformedCourse.yearlyOfferings[year][termKey]) {
        transformedCourse.yearlyOfferings[year][termKey] = [];
      }

      Object.entries(termSessions).forEach(([sessionType, sessions]) => {
        if (!Array.isArray(sessions)) return;

        sessions.forEach(session => {
          const sectionTypeMap = {
            'labs': 'Lab',
            'tutorials': 'Tutorial',
            'seminars': 'Seminar',
            'workshops': 'Workshop'
          };

          const assignedTAs = session.assigned_tas || [];
          
          const calculatedHours = calculateTimeSlotDuration(session.time);
          
          const sessionEntry = {
            id: session.id,
            type: sectionTypeMap[sessionType] || sessionType,
            section: session.section,
            sectionType: sectionTypeMap[sessionType] || sessionType,
            assignedTA: assignedTAs.length > 0 ? assignedTAs[0].student_name : null,
            studentId: assignedTAs.length > 0 ? assignedTAs[0].student_number : null,
            weekHours: assignedTAs.length > 0 ? assignedTAs[0].weekly_hours : calculatedHours,
            timeSlots: [{
              day: session.day,
              startTime: convertTo12Hour(convertTimeFormat(session.time).split('-')[0]),
              endTime: convertTo12Hour(convertTimeFormat(session.time).split('-')[1])
            }]
          };

          transformedCourse.yearlyOfferings[year][termKey].push(sessionEntry);
        });
      });
    });

    return transformedCourse;
  });
};

// --- Main Functions ---

/**
 * Main function to fetch and transform all assignment data (both students and courses)
 */
export const fetchAssignmentData = async () => {
  try {
    // Fetch all required data in parallel
    const [coursesData, instructors, departments] = await Promise.all([
      fetchAllCourseAssignments(),
      getInstructors(),
      getDepartments()
    ]);

    // Fetch and enrich student data separately (with time slot details)
    const enrichedStudents = await fetchAndEnrichStudentAssignments();

    // Transform courses to assignment format
    const transformedCourses = transformCoursesToAssignmentFormat(coursesData, instructors);

    return {
      courses: transformedCourses,
      students: enrichedStudents,
      instructors,
      departments
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Finalizes all allocations and sends notifications to instructors
 */
export const finalizeAllAllocations = async () => {
  try {
    const response = await axios.post(`${ALLOCATIONS_API_URL}/allocations-actions/finalize-all/`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};