// src/logic/coordinator-allocations-page.js

import axios from "axios";

const API_URL = 'http://localhost:8080/api';

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

export const fetchCourses = async () => {
  const response = await fetch(`${API_URL}/course-term-service/courses/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch courses");
  return response.json();
};

export const fetchOfferingsForCourse = async (courseId) => {
  const response = await fetch(`${API_URL}/course-term-service/courses/${courseId}/offerings/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch offerings for course of course id: ", courseId);
  return response.json();
};

export const fetchSharedSessionsForCourse = async (courseId) => {
  const response = await fetch(`${API_URL}/course-term-service/shared-sessions/by_course/?course_id=${courseId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch shared sessions for course of course id: ", courseId);
  return response.json();
};

export const fetchShortlistedApplicants = async () => {
  const response = await fetch(`${API_URL}/allocations/shortlisted-applicants/available_for_allocation/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch shortlisted applicants");
  return response.json();
};

export const fetchProfilesOfShortlistedApplicants = async (student_number) => {
  const response = await fetch(`${API_URL}/profile/student/${student_number}/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch profile of shortlisted applicant with student number: ", student_number);
  return response.json();
};

export const fetchOffers = async () => {
  const response = await fetch(`${API_URL}/allocations/offers/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch offers");

  const data = await response.json();
  return data;
};

export const fetchCourseOfferingDetails = async (courseOfferingId) => {
  const response = await fetch(`${API_URL}/course-term-service/course-offerings/${courseOfferingId}/`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error(`Failed to fetch offer for course offering id: ${courseOfferingId}`);

  const data = await response.json();
  return data;
};

export const fetchSharedSessionDetails = async (sharedSessionId) => {
  try {
    console.log("Fetching shared session ID:", sharedSessionId);
    const response = await fetch(`${API_URL}/course-term-service/shared-sessions/${sharedSessionId}/`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch shared session details");
    return await response.json();
  } catch (error) {
    console.error("Error fetching shared session details:", error);
    return null;
  }
};

export const createOffer = async (dataToSend) => {
  console.log("Type of dataToSend:", typeof dataToSend);
  console.log("Is array:", Array.isArray(dataToSend));
  console.log("Payload being sent to createOffer:", JSON.stringify(dataToSend, null, 2));

  // Add validation
  if (typeof dataToSend !== 'object' || dataToSend === null) {
    throw new Error(`Invalid payload type: ${typeof dataToSend}. Expected object.`);
  }

  try {
    const response = await fetch(`${API_URL}/allocations/offers/create_offer/`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      // If response is not OK, try to get error details from the body
      let errorData;
      try {
        // Clone the response to be able to read it twice
        errorData = await response.clone().json();
      } catch (e) {
        // If parsing JSON fails, get the raw text
        errorData = await response.text();
      }
      console.error("Error from backend on createOffer:", errorData);
      const errorMessage = errorData?.error || errorData?.detail || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // If response is OK, parse the JSON
    return await response.json();

  } catch (error) {
    console.error("Network or parsing error in createOffer:", error);
    throw error;
  }
};

export const editOffer = async (offer_id, dataToUpdate) => {
  console.log(`Payload being sent to editOffer for offer_id ${offer_id}:`, JSON.stringify(dataToUpdate, null, 2));

  const response = await fetch(`${API_URL}/allocations/offers/${offer_id}/edit_offer/`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToUpdate),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => response.text());
    console.error("Error from backend on editOffer:", errorData);
    throw new Error(errorData?.detail || "Failed to edit offer");
  }

  return await response.json();
};

export const sendOffer = async (response_deadline, offer_id) => {

  const response = await fetch(`${API_URL}/allocations/offers/${offer_id}/send-offer/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      response_deadline: response_deadline,
    }),
  });


  if (!response.ok) {
    throw new Error("Failed to send offer");
  }

  return await response.json();
};

export const deleteOffer = async (offer_id) => {

  const response = await fetch(`${API_URL}/allocations/offers/${offer_id}/cancel_offer/`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });


  if (!response.ok) {
    throw new Error("Failed to delete offer");
  }

  return await response.json();
};
// Add more functions as needed
