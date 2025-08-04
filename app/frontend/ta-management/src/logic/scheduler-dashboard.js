// src/logic/scheduler-dashboard.js

import axios from "axios";

const API_URL = 'http://localhost:8080/api';

// Helper function to get the auth token from session storage
const getAuthHeaders = () => {
  // 🎯 THE FIX: Check if we are in a browser environment
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
 * Fetches the current user's profile data from the backend.
 * Corresponds to: GET /api/profile/me/
 */
export const getProfile = async () => {
  const response = await axios.get(`${API_URL}/profile/me/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Updates the user's profile data.
 * @param {object} profileData - The user data to update.
 */
export const updateProfile = async (profileData) => {
  const response = await axios.patch(`${API_URL}/profile/me/update/`, profileData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getCourses = async () => {
  const response = await axios.get(`${API_URL}/course-term-service/courses/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getApplications = async () => {
  const response = await axios.get(`${API_URL}/ajp/applications/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getCourseOfferings = async () => {
  const response = await axios.get(`${API_URL}/course-term-service/course-offerings/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSharedSessions = async () => {
  const response = await axios.get(`${API_URL}/course-term-service/shared-sessions/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getAssignments = async () => {
  const response = await axios.get(`${API_URL}/allocations/assignments/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};