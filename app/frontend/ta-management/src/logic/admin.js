import axios from "axios";

const API_URL = 'http://localhost:8080';
const ADMIN_API = `${API_URL}/api/profile/admin`;
const PROFILE_API = `${API_URL}/api/profile`; 

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

// Get notification statistics for admin dashboard
export const getNotificationStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/notifications/stats/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification stats:', error.response?.data || error.message);
    // Return default stats if service is unavailable
    return {
      total_notifications: 0,
      pending_notifications: 0,
      sent_notifications: 0,
      failed_notifications: 0,
      stats_by_type: {}
    };
  }
};

// Get system health metrics
export const getSystemHealth = async () => {
  try {
    // This could be expanded to check multiple services
    const services = [
      { name: 'User Profile Service', url: `${API_URL}/api/profile/` },
      { name: 'Notification Service', url: `${API_URL}/api/notifications/` },
      { name: 'Allocations Service', url: `${API_URL}/api/allocations/` },
      { name: 'Auth Service', url: `${API_URL}/api/auth/` },
      { name: 'Applications JobPostings Service', url: `${API_URL}/api/ajp/` },
      { name: 'Course Service', url: `${API_URL}/api/course-term-service/` },
      { name: 'Simple API Service', url: `${API_URL}/api/` }
    ];
    
    const serviceChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url, { 
            headers: getAuthHeaders(),
            timeout: 5000 
          });
          return { ...service, status: 'healthy', response_time: Date.now() };
        } catch (error) {
          return { ...service, status: 'unhealthy', error: error.message };
        }
      })
    );
    
    return {
      services: serviceChecks.map(result => result.value || result.reason),
      overall_health: serviceChecks.every(result => result.status === 'fulfilled' && result.value?.status === 'healthy') ? 'healthy' : 'degraded'
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      services: [],
      overall_health: 'unknown'
    };
  }
};

// Get a list of all users 
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