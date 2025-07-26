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
// Add more functions as needed
