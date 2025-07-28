import axios from "axios";
import moment from 'moment'; // Add this import

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

// --- API Functions ---

/**
 * Fetches user profile to get instructor ID
 */
export const getUserProfile = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/me/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches course full details including all offerings and shared sessions
 */
export const getCourseFullDetails = async (courseId) => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/courses/${courseId}/full_details/`, {
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
    
    // Convert hours to number first
    let hourNum = parseInt(hours, 10);
    
    // Handle 12 AM (midnight) and 12 PM (noon)
    if (modifier === 'AM' && hourNum === 12) {
      hourNum = 0;
    } else if (modifier === 'PM' && hourNum !== 12) {
      hourNum = hourNum + 12;
    }
    // If PM and hour is 12, keep it as 12 (noon)
    
    // Convert back to string with proper padding
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
 * Parses schedule string like "Mon 09:00-12:00" into day and time components
 */
export const parseScheduleString = (schedule) => {
  if (!schedule) return null;
  
  const dayMatch = schedule.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i);
  const timeMatch = schedule.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
  
  if (!dayMatch || !timeMatch) return null;
  
  const dayAbbr = dayMatch[1];
  const [, startTime, endTime] = timeMatch;
  
  const dayMap = {
    'Mon': 'Monday',
    'Tue': 'Tuesday', 
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  };
  
  return {
    dayAbbr,
    fullDayName: dayMap[dayAbbr],
    startTime,
    endTime,
    timeRange: `${startTime}-${endTime}`
  };
};

/**
 * Gets the day index for calendar operations
 */
export const getDayIndex = (dayName) => {
  const dayIndex = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
  };
  return dayIndex[dayName] || 0;
};

// --- Data Processing Functions ---

/**
 * Fetches and processes course data with TA assignments
 */
export const fetchCourseDetailsData = async (courseId, term) => {
  try {
    // Fetch user profile to get instructor ID
    const userProfile = await getUserProfile();
    const instructorId = userProfile.id;

    // Fetch course full details
    const courseFullDetails = await getCourseFullDetails(courseId);

    // Filter offerings for current instructor and term
    const instructorOfferings = courseFullDetails.offerings.filter(
      offering => offering.instructor_id === instructorId && offering.term === term
    );

    // Get shared sessions for the term
    const sharedSessions = courseFullDetails.sharedSessions[term] || {
      labs: [],
      tutorials: [],
      seminars: [],
      workshops: []
    };

    // Fetch TA assignments for each offering
    const offeringsWithTAs = await Promise.all(
      instructorOfferings.map(async (offering) => {
        try {
          const taData = await getTAsForCourseOffering(offering.id);
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

    // Fetch TA assignments for shared sessions
    const allSharedSessions = [
      ...sharedSessions.labs.map(session => ({ ...session, type: 'lab' })),
      ...sharedSessions.tutorials.map(session => ({ ...session, type: 'tutorial' })),
      ...sharedSessions.seminars.map(session => ({ ...session, type: 'seminar' })),
      ...sharedSessions.workshops.map(session => ({ ...session, type: 'workshop' }))
    ];

    const sharedSessionsWithTAs = await Promise.all(
      allSharedSessions.map(async (session) => {
        try {
          const taData = await getTAsForSharedSession(session.id);
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

    return {
      courseFullDetails,
      offeringsWithTAs,
      sharedSessionsWithTAs,
      userProfile
    };
  } catch (error) {
    console.error("Error fetching course details data:", error);
    throw error;
  }
};

/**
 * Transforms backend data to match frontend component structure
 */
export const transformCourseData = (courseFullDetails, offeringsWithTAs, sharedSessionsWithTAs, term) => {
  // Calculate statistics - collect all unique TAs across all offerings and sessions
  const allTAs = [
    ...offeringsWithTAs.flatMap(o => o.assigned_tas || []),
    ...sharedSessionsWithTAs.flatMap(s => s.assigned_tas || [])
  ];
  
  // Get unique TAs by student_number
  const uniqueTAs = allTAs.filter((ta, index, array) => 
    index === array.findIndex(t => 
      t.student_number && ta.student_number && t.student_number === ta.student_number
    )
  );

  return {
    id: courseFullDetails.id,
    course_number: courseFullDetails.code,
    title: courseFullDetails.title,
    department: courseFullDetails.department,
    description: courseFullDetails.description,
    term: term,
    
    // Transform offerings to match existing structure with TA time slot assignments
    offerings: offeringsWithTAs.map(offering => ({
      id: offering.id,
      section: offering.section,
      type: "lecture",
      schedule_days: offering.time_slots.map(timeSlot => {
        // Find TAs assigned to this specific time slot
        const assignedTAsForTimeSlot = (offering.assigned_tas || []).filter(ta => 
          ta.time_slot && 
          ta.time_slot.day === timeSlot.day &&
          ta.time_slot.start_time === convertTimeFormat(timeSlot.time).split('-')[0] &&
          ta.time_slot.end_time === convertTimeFormat(timeSlot.time).split('-')[1]
        );

        return {
          days: timeSlot.day,
          time: convertTimeFormat(timeSlot.time),
          tas_assigned: assignedTAsForTimeSlot.map(ta => ({
            name: ta.student_name,
            student_number: ta.student_number,
            role: ta.role,
            weekly_hours: ta.weekly_hours,
            assignment_id: ta.assignment_id,
            assigned_date: ta.assigned_date
          }))
        };
      })
  })),

    // Transform shared sessions to match existing structure
    shared_sessions: sharedSessionsWithTAs.map(session => ({
      id: session.id,
      type: session.type,
      section: session.section,
      schedule: `${session.day.substring(0, 3)} ${convertTimeFormat(session.time)}`,
      tas_assigned: (session.assigned_tas || []).map(ta => ({
        name: ta.student_name,
        student_number: ta.student_number,
        role: ta.role,
        weekly_hours: ta.weekly_hours,
        assignment_id: ta.assignment_id,
        assigned_date: ta.assigned_date
      }))
    })),

    // Calculate stats
    stats: {
      total_tas: uniqueTAs.length,
      lecture_sections: offeringsWithTAs.length,
      lab_sections: sharedSessionsWithTAs.filter(s => s.type === 'lab').length,
      tutorial_sections: sharedSessionsWithTAs.filter(s => s.type === 'tutorial').length
    }
  };
};

/**
 * Helper function to convert time format and handle time slot matching
 */
export const convertTimeFormatToTimeSlot = (timeString) => {
  if (!timeString) return { start_time: '', end_time: '' };
  
  const converted = convertTimeFormat(timeString);
  const [startTime, endTime] = converted.split('-');
  
  return {
    start_time: startTime,
    end_time: endTime
  };
};

/**
 * Generates calendar events for react-big-calendar with time slot specific TA assignments
 */
export const generateCalendarEvents = (courseData) => {
  if (!courseData) return [];
  
  const events = [];
  const startOfWeek = moment().startOf('week').add(1, 'day'); // Start from Monday
  
  const getDateForDay = (dayName) => {
    const dayIndex = getDayIndex(dayName);
    return startOfWeek.clone().add(dayIndex, 'days');
  };

  const createDateTime = (dayName, timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return getDateForDay(dayName).clone().hour(hours).minute(minutes).toDate();
  };

  // Add lecture events with time slot specific TA assignments
  courseData.offerings.forEach(offering => {
    offering.schedule_days.forEach(scheduleDay => {
      const [startTime, endTime] = scheduleDay.time.split('-');
      const tasNames = scheduleDay.tas_assigned.map(ta => ta.name).join(', ') || 'No TAs assigned';
      
      events.push({
        id: `${offering.id}-${scheduleDay.days}`,
        title: `${offering.section} - ${tasNames}`,
        start: createDateTime(scheduleDay.days, startTime),
        end: createDateTime(scheduleDay.days, endTime),
        resource: {
          type: 'lecture',
          section: offering.section,
          tas: tasNames,
          sessionType: 'lecture',
          tasCount: scheduleDay.tas_assigned.length
        }
      });
    });
  });

  // Add shared session events (unchanged)
  courseData.shared_sessions.forEach(session => {
    const scheduleInfo = parseScheduleString(session.schedule);
    if (!scheduleInfo) return;
    
    const tasNames = session.tas_assigned.map(ta => ta.name).join(', ') || 'No TAs assigned';
    
    events.push({
      id: `${session.id}-${scheduleInfo.dayAbbr}`,
      title: `${session.section} - ${tasNames}`,
      start: createDateTime(scheduleInfo.fullDayName, scheduleInfo.startTime),
      end: createDateTime(scheduleInfo.fullDayName, scheduleInfo.endTime),
      resource: {
        type: session.type,
        section: session.section,
        tas: tasNames,
        sessionType: session.type,
        tasCount: session.tas_assigned.length
      }
    });
  });

  return events;
};

/**
 * Gets event style based on session type
 */
export const getEventStyle = (event) => {
  let backgroundColor = '#3174ad';
  
  switch (event.resource.sessionType) {
    case 'lecture':
      backgroundColor = '#3b82f6';
      break;
    case 'lab':
      backgroundColor = '#10b981';
      break;
    case 'tutorial':
      backgroundColor = '#8b5cf6';
      break;
    case 'seminar':
      backgroundColor = '#f59e0b';
      break;
    case 'workshop':
      backgroundColor = '#6366f1';
      break;
    default:
      backgroundColor = '#6b7280';
  }

  return {
    style: {
      backgroundColor,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      fontSize: '12px',
      padding: '2px 6px'
    }
  };
};

/**
 * Gets session type color for badges
 */
export const getSessionTypeColor = (type) => {
  switch (type) {
    case "lecture":
      return "bg-blue-100 text-blue-800";
    case "lab":
      return "bg-green-100 text-green-800";
    case "tutorial":
      return "bg-purple-100 text-purple-800";
    case "seminar":
      return "bg-orange-100 text-orange-800";
    case "workshop":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

