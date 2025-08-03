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

export const getAcceptedOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/accepted_offers/`, {
    headers: getAuthHeaders()
  });
  console.log("Accepted offers response: ", response.data);
  return response.data;
};

export const getRejectedOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/rejected_offers/`, {
    headers: getAuthHeaders()
  });
  console.log("Rejected offers response: ", response.data);
  return response.data;
};

export const getExpiredOffers = async () => {
  const response = await axios.get(`${API_URL}/allocations/offers/expired_offers/`, {
    headers: getAuthHeaders()
  });
  console.log("Expired offers response: ", response.data);
  return response.data;
};

export const respondToOffer = async (offer_id, responseToOffer) => {
  const response = await axios.post(
    `${API_URL}/allocations/offers/${offer_id}/respond_to_offer/`,
    { status: responseToOffer },
    { 
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      } 
    }
  );
  console.log("accepted or rejected offers response:", response.data);
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
 * Fetches the shared session details based on shared session id from the backend.
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