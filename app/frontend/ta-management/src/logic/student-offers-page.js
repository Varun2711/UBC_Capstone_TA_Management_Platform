// src/logic/profile.js

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
 * Fetches the current user's pending offers from the backend.
 * Corresponds to: GET /api/allocations/offers/pending_offers/
 */
export const getPendingOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/pending_offers/`, {
    headers: getAuthHeaders()
  });
  console.log("Pending offers response: ", response.data);
  return response.data;
};

/**
 * Fetches the current user's pending offers from the backend.
 * Corresponds to: GET /api/allocations/offers/pending_offers/
 */
export const getCourseOfferingDetails = async (course_offering_id) => {
  const response = await axios.get(`${API_URL}/course-term-service/course-offerings/${course_offering_id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches the current user's pending offers from the backend.
 * Corresponds to: GET /api/allocations/offers/pending_offers/
 */
export const getSharedSessionDetails = async (shared_session_id) => {
  const response = await axios.get(`${API_URL}/course-term-service/sharedsessions/${shared_session_id}`, {
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