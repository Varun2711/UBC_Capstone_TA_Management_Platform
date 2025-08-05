// src/logic/scheduler-dashboard.js

import axios from "axios";

const API_URL = 'http://localhost:8080/api';

// Helper function to get the auth token from session storage
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    console.warn('No access token found in sessionStorage');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
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
  console.log()
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

// Add these new API functions
export const getShortlistedApplicants = async () => {
  const response = await axios.get(`${API_URL}/allocations/shortlisted-applicants/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Or if you have separate endpoints for different offer statuses:
export const getPendingOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/pending_offers/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getAcceptedOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/accepted_offers/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getRejectedOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/rejected_offers/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};