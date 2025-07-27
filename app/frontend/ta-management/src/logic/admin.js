import axios from "axios";

const API_URL = 'http://localhost:8080';
const ADMIN_API = `${API_URL}/api/profile/admin`;

// Helper to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return {};
};

// Create a new instructor
export const createInstructor = async (instructorData) => {
  const response = await axios.post(`${ADMIN_API}/create-instructor/`, instructorData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Create a new TA scheduler
export const createScheduler = async (schedulerData) => {
  const response = await axios.post(`${ADMIN_API}/create-scheduler/`, schedulerData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Create a new admin
export const createAdmin = async (adminData) => {
  const response = await axios.post(`${ADMIN_API}/create-admin/`, adminData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Update (or deactivate) a user
export const updateUser = async (updateData) => {
  const response = await axios.patch(`${ADMIN_API}/user-management/`, updateData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get admin dashboard statistics
export const getAdminDashboard = async () => {
  const response = await axios.get(`${ADMIN_API}/dashboard/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get a list of all users (can be filtered by type via query param ?user_type=)
export const getAllUsers = async (userType = "") => {
  const url = `${API_URL}/users/${userType ? `?user_type=${userType}` : ""}`;
  const response = await axios.get(url, {
    headers: getAuthHeaders()
  });
  return response.data;
};
