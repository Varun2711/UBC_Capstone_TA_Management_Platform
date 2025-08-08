import axios from "axios";

// API URLs
const PROFILE_API_URL = 'http://localhost:8080/api/profile';
const COURSE_TERM_API_URL = 'http://localhost:8080/api/course-term-service';

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

// --- Instructor/Department Functions (Profile Service) ---

/**
 * Fetches all active instructors.
 * Corresponds to: GET /api/profile/instructors/
 */
export const getInstructors = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/instructors/`, {
    headers: getAuthHeaders()
  });
  
  // Filter to only return active instructors
  const activeInstructors = response.data.filter(instructor => instructor.is_active === true);
  
  return activeInstructors;
};

/**
 * Fetches all available departments.
 * Corresponds to: GET /api/profile/departments/
 */
export const getDepartments = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/departments/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Creates a new instructor.
 * Corresponds to: POST /api/profile/scheduler/create-instructor/
 */
export const addInstructor = async (instructorData) => {
  const response = await axios.post(`${PROFILE_API_URL}/scheduler/create-instructor/`, instructorData, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

/**
 * Updates an existing instructor.
 * @param {string} employeeNumber - The employee number of the instructor.
 * @param {object} instructorData - { name, email, department }
 */
export const updateInstructor = async (employeeNumber, instructorData) => {
  const response = await axios.patch(`${PROFILE_API_URL}/scheduler/update-instructor/${employeeNumber}/`, instructorData, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

/**
 * Deletes an instructor.
 * @param {string} employeeNumber - The employee number of the instructor.
 */
export const deleteInstructor = async (employeeNumber) => {
  const response = await axios.delete(`${PROFILE_API_URL}/scheduler/delete-instructor/${employeeNumber}/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};


// --- Course/Request Functions (Course Term Service) ---

/**
 * Fetches all instructor requests for TA requirements.
 * Corresponds to: GET /api/course-term-service/instructor-requests/
 */
export const getInstructorRequests = async () => {
    const response = await axios.get(`${COURSE_TERM_API_URL}/instructor-requests/`, {
        headers: getAuthHeaders()
    });
    // Assuming pagination, but for now just returning results
    return response.data.results || [];
};

/**
 * Fetches all course offerings.
 * Corresponds to: GET /api/course-term-service/course-offerings/
 */
export const getCourseOfferings = async () => {
    const response = await axios.get(`${COURSE_TERM_API_URL}/course-offerings/`, {
        headers: getAuthHeaders()
    });
    // Assuming pagination, but for now just returning results
    return response.data.results || [];
};