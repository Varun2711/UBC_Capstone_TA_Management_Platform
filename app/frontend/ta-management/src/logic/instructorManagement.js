import axios from "axios";

// NOTE: Your API URL is localhost:8080
const API_URL = 'http://localhost:8080/api/profile'; 

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

/**
 * Fetches all instructors.
 * Corresponds to: GET /api/profile/instructors/
 */
export const getInstructors = async () => {
  const response = await axios.get(`${API_URL}/instructors/`, {
    headers: getAuthHeaders()
  });
  // The response is a direct array
  return response.data; 
};

/**
 * Fetches all available departments.
 * Corresponds to: GET /api/profile/departments/
 */
export const getDepartments = async () => {
  const response = await axios.get(`${API_URL}/departments/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Creates a new instructor.
 * Corresponds to: POST /api/profile/scheduler/create-instructor/
 */
export const addInstructor = async (instructorData) => {
  const response = await axios.post(`${API_URL}/scheduler/create-instructor/`, instructorData, {
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
  const response = await axios.patch(`${API_URL}/scheduler/update-instructor/${employeeNumber}/`, instructorData, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

/**
 * Deletes an instructor.
 * @param {string} employeeNumber - The employee number of the instructor.
 */
export const deleteInstructor = async (employeeNumber) => {
  const response = await axios.delete(`${API_URL}/scheduler/delete-instructor/${employeeNumber}/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};