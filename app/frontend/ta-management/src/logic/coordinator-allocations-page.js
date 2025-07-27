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
  const response = await fetch(`${API_URL}/allocations/shortlisted-applicants/`, {
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

export const createOffer = async (applicationId, sections) => {

  const offerItems = sections.map((section) => {
    if (section.item_type === "course_offering") {
      return {
        item_type: "course_offering",
        course_offering_id: section.course_offering_id,
      };
    } else if (section.item_type === "shared_session") {
      return {
        item_type: "shared_session",
        shared_session_id: section.shared_session_id,
      };
    } else {
      throw new Error(`Unsupported item_type: ${section.item_type}`);
    }
  });

  console.log("offerItems in createOffer: ", offerItems);
  console.log("Payload being sent: ", {
    application_id: applicationId,
    offer_items: offerItems,
  });

  const response = await fetch(`${API_URL}/allocations/offers/create_offer/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    "Content-Type": "application/json",
    },
    body: JSON.stringify({
      application_id: applicationId,
      offer_items: offerItems
      }),
  });
  

  if (!response.ok) {
    throw new Error("Failed to create offer");
  }

  return await response.json();
};

// Add more functions as needed
