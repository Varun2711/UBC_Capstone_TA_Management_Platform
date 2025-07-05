// src/logic/profile.js

import axios from "axios";

const API_URL = 'http://localhost:8080/api';

// Helper function to get the auth token from local storage
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    console.error("Access token not found in local storage.");
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
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