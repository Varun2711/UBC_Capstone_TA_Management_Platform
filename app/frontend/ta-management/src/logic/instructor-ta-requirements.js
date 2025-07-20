import axios from "axios";

const API_URL = 'http://localhost:8080/api';

// Helper function to get the auth token from session storage
const getAuthHeaders = () => {
  // Check if we are in a browser environment
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  // If not in a browser, or if no token is found, return empty headers.
  return {};
};

/**
 * Get current date in PST timezone in YYYY-MM-DD format
 */
const getCurrentDateInPST = () => {
  const now = new Date();
  // Convert to PST (UTC-8) or PDT (UTC-7) depending on daylight saving time
  const pstDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Format as YYYY-MM-DD
  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, '0');
  const day = String(pstDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse term info to extract year and readable term
 * @param {string} termInfo - Term info like "W2025 Term 1", "S2025 Term 2", "W2025 Both Terms"
 * @returns {object} - { year: number, term: string }
 */
const parseTermInfo = (termInfo) => {
  const regex = /^([WS])(\d{4})\s+(.+)$/;
  const match = termInfo.match(regex);
  
  if (!match) {
    return { year: new Date().getFullYear(), term: termInfo };
  }
  
  const [, seasonCode, yearStr, termPart] = match;
  const year = parseInt(yearStr, 10);
  const season = seasonCode === 'W' ? 'Winter' : 'Summer';
  
  return {
    year,
    term: `${season} ${termPart}`
  };
};

/**
 * Parse course info to extract course code and title
 * @param {string} courseInfo - Course info like "COSC 121 Computer Programming II"
 * @returns {object} - { courseCode: string, courseTitle: string }
 */
const parseCourseInfo = (courseInfo) => {
  const parts = courseInfo.split(' ');
  if (parts.length < 3) {
    return { courseCode: courseInfo, courseTitle: '' };
  }
  
  const courseCode = `${parts[0]} ${parts[1]}`;
  const courseTitle = parts.slice(2).join(' ');
  
  return { courseCode, courseTitle };
};

/**
 * Transform backend course offering to frontend format
 * @param {object} courseOffering - Backend course offering object
 * @param {object|null} existingRequest - Existing request for this course offering
 * @returns {object} - Frontend formatted course object
 */
const transformCourseOffering = (courseOffering, existingRequest = null) => {
  const { year, term } = parseTermInfo(courseOffering.term_info);
  const { courseCode, courseTitle } = parseCourseInfo(courseOffering.course_info);
  
  return {
    id: courseOffering.course_offering_id,
    courseCode,
    courseTitle,
    section: courseOffering.section_number,
    year,
    term,
    instructor: courseOffering.instructor_info,
    hasSubmittedRequirements: !!existingRequest,
    submittedAt: existingRequest?.request_date || null,
    requestId: existingRequest?.request_id || null,
    requirements: {
      generalRequirements: existingRequest?.request_description || []
    }
  };
};

/**
 * Get current instructor profile
 */
export const getInstructorProfile = async () => {
  const response = await axios.get(`${API_URL}/profile/me/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get all course offerings
 */
export const getAllCourseOfferings = async () => {
  const response = await axios.get(`${API_URL}/course-term-service/course-offerings/`, {
    headers: getAuthHeaders()
  });
  return response.data.results;
};

/**
 * Get instructor requests by instructor ID
 */
export const getInstructorRequests = async (instructorId) => {
  const response = await axios.get(`${API_URL}/course-term-service/instructor-requests/by_instructor/`, {
    params: { instructor_id: instructorId },
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get instructor's course offerings with their TA requirements
 */
export const getInstructorCourseOfferings = async () => {
  try {
    // Get instructor profile
    const profile = await getInstructorProfile();
    const instructorId = profile.id;
    
    // Get all course offerings and instructor requests in parallel
    const [allCourseOfferings, instructorRequests] = await Promise.all([
      getAllCourseOfferings(),
      getInstructorRequests(instructorId)
    ]);
    
    // Filter course offerings for this instructor
    const instructorCourseOfferings = allCourseOfferings.filter(
      offering => offering.instructor_id_read === instructorId
    );
    
    // Create a map of requests by course offering ID
    const requestsMap = new Map();
    instructorRequests.forEach(request => {
      requestsMap.set(request.course_offering_id, request);
    });
    
    // Transform course offerings to frontend format
    const transformedCourses = instructorCourseOfferings.map(offering => {
      const existingRequest = requestsMap.get(offering.course_offering_id);
      return transformCourseOffering(offering, existingRequest);
    });
    
    return transformedCourses;
  } catch (error) {
    console.error('Error fetching instructor course offerings:', error);
    throw error;
  }
};

/**
 * Submit TA requirements for a course offering
 */
export const submitTARequirements = async (courseOfferingId, requirements) => {
  try {
    // Get instructor profile for instructor ID
    const profile = await getInstructorProfile();
    const instructorId = profile.id;
    
    const requestData = {
      instructor_id: instructorId,
      course_offering_id: courseOfferingId,
      request_date: getCurrentDateInPST(), // Current date in PST timezone
      request_description: requirements
    };
    
    const response = await axios.post(`${API_URL}/course-term-service/instructor-requests/`, requestData, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting TA requirements:', error);
    throw error;
  }
};

/**
 * Update TA requirements for a course offering
 */
export const updateTARequirements = async (requestId, courseOfferingId, requirements) => {
  try {
    // Get instructor profile for instructor ID
    const profile = await getInstructorProfile();
    const instructorId = profile.id;
    
    const requestData = {
      instructor_id: instructorId,
      course_offering_id: courseOfferingId,
      request_date: getCurrentDateInPST(), // Current date in PST timezone
      request_description: requirements
    };
    
    const response = await axios.patch(`${API_URL}/course-term-service/instructor-requests/${requestId}/`, requestData, {
      headers: getAuthHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating TA requirements:', error);
    throw error;
  }
};