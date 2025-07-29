import axios from "axios";

const API_URL = 'http://localhost:8080';
const ADMIN_API = `${API_URL}/api/profile/admin`;
const PROFILE_API = `${API_URL}/api/profile`; // Add this

// Helper to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Create a new instructor
export const createInstructor = async (instructorData) => {
  try {
    const response = await axios.post(`${ADMIN_API}/create-instructor/`, instructorData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating instructor:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new TA scheduler
export const createScheduler = async (schedulerData) => {
  try {
    const response = await axios.post(`${ADMIN_API}/create-scheduler/`, schedulerData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating scheduler:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new admin
export const createAdmin = async (adminData) => {
  try {
    const response = await axios.post(`${ADMIN_API}/create-admin/`, adminData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating admin:', error.response?.data || error.message);
    throw error;
  }
};

// Update (or deactivate) a user
export const updateUser = async (updateData) => {
  try {
    const response = await axios.patch(`${ADMIN_API}/user-management/`, updateData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error.response?.data || error.message);
    throw error;
  }
};

// Get admin dashboard statistics
export const getAdminDashboard = async () => {
  try {
    const response = await axios.get(`${ADMIN_API}/dashboard/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error.response?.data || error.message);
    throw error;
  }
};

// Get a list of all users - FIXED ENDPOINT
export const getAllUsers = async (userType = "") => {
  try {
    const url = `${PROFILE_API}/users/${userType ? `?user_type=${userType}` : ""}`;
    console.log('Fetching users from:', url); // Debug log
    
    const response = await axios.get(url, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    throw error;
  }
};