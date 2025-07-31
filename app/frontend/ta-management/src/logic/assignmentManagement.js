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

// --- Term Parsing Functions (reused from courseManagement) ---

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

// --- API Functions ---

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
    
    return Math.round(durationHours * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating time slot duration:', error);
    return 0;
  }
};

// --- Data Processing Functions ---

/**
 * Fetches and processes all course assignment data
 */
export const fetchAllCourseAssignments = async () => {
  try {
    console.log("Fetching all course data with assignments...");
    
    // Fetch all courses with full details
    const allCourses = await getAllCoursesFullDetails();
    console.log("Raw courses data:", allCourses);

    // Fetch instructors for name resolution
    const instructors = await getInstructors();
    const instructorMap = new Map();
    instructors.forEach(instructor => {
      instructorMap.set(instructor.id, instructor.name);
    });

    // Process each course with TA assignments
    const coursesWithAssignments = await Promise.all(
      allCourses.map(async (course) => {
        console.log(`Processing course: ${course.code}`);
        
        // Process course offerings
        const offeringsWithTAs = await Promise.all(
          (course.offerings || []).map(async (offering) => {
            try {
              const taData = await getTAsForCourseOffering(offering.id);
              console.log(`TAs for offering ${offering.id}:`, taData);
              
              return {
                ...offering,
                assigned_tas: taData.assigned_tas || []
              };
            } catch (error) {
              console.error(`Failed to fetch TAs for offering ${offering.id}:`, error);
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
                    console.log(`TAs for shared session ${session.id}:`, taData);
                    
                    return {
                      ...session,
                      assigned_tas: taData.assigned_tas || []
                    };
                  } catch (error) {
                    console.error(`Failed to fetch TAs for shared session ${session.id}:`, error);
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

    console.log("Processed courses with assignments:", coursesWithAssignments);
    return coursesWithAssignments;
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    throw error;
  }
};

/**
 * Transforms backend course data to frontend assignment format
 */
export const transformCoursesToAssignmentFormat = (coursesData, instructors = []) => {
  console.log("Transforming courses to assignment format...");
  
  // Create instructor lookup map
  const instructorMap = new Map();
  instructors.forEach(instructor => {
    instructorMap.set(instructor.id, instructor.name);
  });

  return coursesData.map(course => {
    console.log(`Transforming course: ${course.code}`);
    
    // Transform the course structure for assignment view
    const transformedCourse = {
      id: course.id,
      code: course.code,
      name: course.title,
      department: course.department,
      instructor: course.instructor || 'Unknown',
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

      // Process time slots for lecture sections
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
          // Use actual calculated hours or assigned TA hours
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

    // Add shared sessions
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

      // Process each session type
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
          
          // Calculate actual duration for shared sessions
          const calculatedHours = calculateTimeSlotDuration(session.time);
          
          const sessionEntry = {
            id: session.id,
            type: sectionTypeMap[sessionType] || sessionType,
            section: session.section,
            sectionType: sectionTypeMap[sessionType] || sessionType,
            assignedTA: assignedTAs.length > 0 ? assignedTAs[0].student_name : null,
            studentId: assignedTAs.length > 0 ? assignedTAs[0].student_number : null,
            // Use actual calculated hours or assigned TA hours
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

    console.log(`Transformed course ${course.code}:`, transformedCourse);
    return transformedCourse;
  });
};

/**
 * Main function to fetch and transform all assignment data
 */
export const fetchAssignmentData = async () => {
  try {
    console.log("Starting assignment data fetch...");
    
    // Fetch all required data
    const [coursesData, instructors, departments] = await Promise.all([
      fetchAllCourseAssignments(),
      getInstructors(),
      getDepartments()
    ]);

    // Transform to assignment format
    const transformedCourses = transformCoursesToAssignmentFormat(coursesData, instructors);

    console.log("Final transformed courses:", transformedCourses);

    return {
      courses: transformedCourses,
      instructors,
      departments
    };
  } catch (error) {
    console.error("Error in fetchAssignmentData:", error);
    throw error;
  }
};