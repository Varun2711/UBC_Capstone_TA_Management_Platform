// src/logic/application-management.js

import axios from "axios";

const API_URL = "http://localhost:8080/api";

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: API_URL,
});

// Helper function to get the auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("accessToken");
  if (!token) {
    console.warn("Access token not found in sessionStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ===============================
// APPLICATION FUNCTIONS
// ===============================

export const fetchApplications = async (filters = {}) => {
  try {
    const headers = getAuthHeaders();

    // Remove empty filters
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        cleanFilters[key] = value;
      }
    });

    const response = await instance.get("/ajp/applications/", {
      headers,
      params: cleanFilters,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

export const fetchApplicationById = async (applicationId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/applications/by-id/${applicationId}/`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    throw error;
  }
};

export const fetchApplicationsByStudent = async (studentId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/applications/by-student/${studentId}/`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching applications by student:", error);
    throw error;
  }
};

export const fetchApplicationsByPosting = async (postingId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/applications/by-posting/${postingId}/`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching applications by posting:", error);
    throw error;
  }
};

export const createApplication = async (applicationData) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.post(
      "/ajp/applications/",
      applicationData,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.patch(
      `/ajp/applications/${applicationId}/`,
      { status },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

// ===============================
// SHORTLIST FUNCTIONS
// ===============================

export const fetchShortlists = async (filters = {}) => {
  try {
    const headers = getAuthHeaders();

    // Remove empty filters
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        cleanFilters[key] = value;
      }
    });

    const response = await instance.get("/ajp/application-shortlists/", {
      headers,
      params: cleanFilters,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching shortlists:", error);
    throw error;
  }
};

export const fetchShortlistsByScheduler = async (schedulerId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/application-shortlists/by-scheduler/${schedulerId}/`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching shortlists by scheduler:", error);
    throw error;
  }
};

export const fetchShortlistsByPosting = async (postingId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/application-shortlists/by-posting/${postingId}/`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching shortlists by posting:", error);
    throw error;
  }
};

export const fetchShortlistsByApplication = async (applicationId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/application-shortlists/by-application/${applicationId}/`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching shortlists by application:", error);
    throw error;
  }
};

export const checkApplicationShortlisted = async (applicationId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/ajp/application-shortlists/by-application/${applicationId}/exists/`,
      { headers }
    );
    return response.data.shortlisted;
  } catch (error) {
    console.error("Error checking if application is shortlisted:", error);
    return false; // Default to false if error occurs
  }
};

export const addToShortlist = async (applicationId, notes = "") => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.post(
      "/ajp/application-shortlists/",
      {
        application_id: applicationId,
        notes,
        created_by_id: null, // Backend will handle this automatically
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding to shortlist:", error);
    throw error;
  }
};

export const removeFromShortlist = async (applicationId) => {
  try {
    const headers = getAuthHeaders();

    // First get the shortlist data to find the ID
    const shortlistResponse = await instance.get(
      `/ajp/application-shortlists/by-application/${applicationId}/`,
      { headers }
    );

    if (shortlistResponse.data.length > 0) {
      const shortlistId = shortlistResponse.data[0].id;

      // Delete the shortlist entry
      const response = await instance.delete(
        `/ajp/application-shortlists/${shortlistId}/`,
        { headers }
      );
      return response.data;
    } else {
      throw new Error("Shortlist entry not found");
    }
  } catch (error) {
    console.error("Error removing from shortlist:", error);
    throw error;
  }
};

// ===============================
// APPLICATION RESPONSE FUNCTIONS
// ===============================

export const fetchApplicationResponses = async (
  applicationId = null,
  questionId = null
) => {
  try {
    const headers = getAuthHeaders();
    const params = {};
    if (applicationId) params.application = applicationId;
    if (questionId) params.question = questionId;

    const response = await instance.get("/ajp/application-responses/", {
      headers,
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching application responses:", error);
    throw error;
  }
};

// ===============================
// FILTERING AND SEARCH UTILITIES
// ===============================

export const buildApplicationFilters = (filters) => {
  const params = {};

  // Add non-empty filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params[key] = value;
    }
  });

  return params;
};

export const filterApplications = (applications, searchQuery, filters) => {
  let filteredApplications = [...applications];

  // Apply search query
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredApplications = filteredApplications.filter(
      (app) =>
        app.student?.name?.toLowerCase().includes(query) ||
        app.student?.student_number?.toLowerCase().includes(query) ||
        app.posting?.title?.toLowerCase().includes(query)
    );
  }

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "") {
      switch (key) {
        case "status":
          filteredApplications = filteredApplications.filter(
            (app) => app.status === value
          );
          break;
        case "positionType":
          filteredApplications = filteredApplications.filter(
            (app) => app.positionType === value
          );
          break;
        case "discipline":
          filteredApplications = filteredApplications.filter(
            (app) =>
              app.disciplineRankings?.rank1 === value ||
              app.disciplineRankings?.rank2 === value ||
              app.disciplineRankings?.rank3 === value
          );
          break;
        case "term_code":
          filteredApplications = filteredApplications.filter(
            (app) => app.termSelection?.code === value
          );
          break;
        case "workload":
          filteredApplications = filteredApplications.filter(
            (app) => app.workload === value
          );
          break;
        case "fullTimeEnrollment":
          filteredApplications = filteredApplications.filter(
            (app) => app.fullTimeEnrollment === value
          );
          break;
        case "hasOtherPositions":
          filteredApplications = filteredApplications.filter(
            (app) => app.hasOtherPositions === value
          );
          break;
        default:
          break;
      }
    }
  });

  return filteredApplications;
};

// ===============================
// STATUS AND BADGE UTILITIES
// ===============================

export const getStatusConfig = (status) => {
  const statusConfigs = {
    draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-800",
      variant: "secondary",
    },
    submitted: {
      label: "Submitted",
      className: "bg-yellow-100 text-yellow-800",
      variant: "default",
    },
    under_review: {
      label: "Under Review",
      className: "bg-blue-100 text-blue-800",
      variant: "default",
    },
    accepted: {
      label: "Accepted",
      className: "bg-green-100 text-green-800",
      variant: "default",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-100 text-red-800",
      variant: "destructive",
    },
    withdrawn: {
      label: "Withdrawn",
      className: "bg-gray-100 text-gray-600",
      variant: "outline",
    },
    archived: {
      label: "Archived",
      className: "bg-gray-100 text-gray-500",
      variant: "outline",
    },
  };

  return statusConfigs[status] || statusConfigs.draft;
};

export const getPositionTypeConfig = (positionType) => {
  const typeConfigs = {
    UTA: {
      label: "Undergraduate TA",
      className: "bg-blue-100 text-blue-800",
    },
    GTA2: {
      label: "Graduate TA 2",
      className: "bg-purple-100 text-purple-800",
    },
    GTA1: {
      label: "Graduate TA 1 (Ph.D)",
      className: "bg-orange-100 text-orange-800",
    },
  };

  return (
    typeConfigs[positionType] || {
      label: positionType,
      className: "bg-gray-100 text-gray-800",
    }
  );
};

// ===============================
// BULK OPERATIONS
// ===============================

export const fetchApplicationManagementData = async (filters = {}) => {
  try {
    // Default to showing only submitted applications for management
    const defaultFilters = {
      status: "submitted",
      ...filters,
    };

    const [applications, shortlists] = await Promise.all([
      fetchApplications(defaultFilters),
      fetchShortlists(defaultFilters),
    ]);

    return {
      applications,
      shortlists,
    };
  } catch (error) {
    console.error("Error fetching application management data:", error);
    throw error;
  }
};

export const enrichApplicationsWithShortlistStatus = async (applications) => {
  try {
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const isShortlisted = await checkApplicationShortlisted(
          app.application_id
        );
        return { ...app, isShortlisted };
      })
    );
    return enrichedApplications;
  } catch (error) {
    console.error("Error enriching applications with shortlist status:", error);
    return applications; // Return original applications if enrichment fails
  }
};

// ===============================
// FORMATTING UTILITIES
// ===============================

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDisciplineRankings = (disciplineRankings) => {
  if (!disciplineRankings) return "Not specified";

  const rankings = [];
  if (disciplineRankings.rank1)
    rankings.push(`1st: ${disciplineRankings.rank1}`);
  if (disciplineRankings.rank2)
    rankings.push(`2nd: ${disciplineRankings.rank2}`);
  if (disciplineRankings.rank3)
    rankings.push(`3rd: ${disciplineRankings.rank3}`);

  return rankings.join(", ") || "Not specified";
};

// ===============================
// ERROR HANDLING UTILITIES
// ===============================

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message =
      error.response.data?.message ||
      error.response.data?.detail ||
      error.response.statusText;

    switch (status) {
      case 401:
        return "Authentication required. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 422:
        return "Invalid data provided. Please check your input.";
      case 400:
        // Check if it's a validation error with detailed field errors
        if (error.response.data && typeof error.response.data === "object") {
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(error.response.data)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(", ")}`);
            } else if (typeof errors === "string") {
              fieldErrors.push(`${field}: ${errors}`);
            }
          }
          if (fieldErrors.length > 0) {
            return `Validation errors: ${fieldErrors.join("; ")}`;
          }
        }
        return message || "Bad request. Please check your input.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return message || "An unexpected error occurred.";
    }
  } else if (error.request) {
    // Network error
    return "Network error. Please check your connection.";
  } else {
    // Other error
    return error.message || "An unexpected error occurred.";
  }
};

// ===============================
// CONSTANTS AND OPTIONS
// ===============================

export const APPLICATION_STATUS_OPTIONS = [
  { value: "", label: "Select Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const POSITION_TYPE_OPTIONS = [
  { value: "", label: "Select Position" },
  { value: "UTA", label: "Undergraduate Teaching Assistant" },
  { value: "GTA2", label: "Graduate Teaching Assistant 2 (Masters)" },
  { value: "GTA1", label: "Graduate Teaching Assistant 1 (Ph.D)" },
];

export const TERM_CODE_OPTIONS = [
  { value: "", label: "Select Term" },
  { value: "W2025BOTH", label: "Winter 2025 Term 1 & 2" },
  { value: "W2025T1", label: "Winter 2025 Term 1" },
  { value: "W2025T2", label: "Winter 2025 Term 2" },
];

export const DISCIPLINE_OPTIONS = [
  { value: "", label: "Select Discipline" },
  { value: "ASTR", label: "ASTR" },
  { value: "COSC", label: "COSC" },
  { value: "DATA", label: "DATA" },
  { value: "MATH", label: "MATH" },
  { value: "PHYS", label: "PHYS" },
  { value: "STAT", label: "STAT" },
];

export const WORKLOAD_OPTIONS = [
  { value: "", label: "All Workloads" },
  { value: "6", label: "6 hours" },
  { value: "12", label: "12 hours" },
];

export const YES_NO_OPTIONS = [
  { value: "", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// ===============================
// EXPORTS
// ===============================

export default {
  // Application functions
  fetchApplications,
  fetchApplicationById,
  fetchApplicationsByStudent,
  fetchApplicationsByPosting,

  // Shortlist functions
  fetchShortlists,
  fetchShortlistsByScheduler,
  fetchShortlistsByPosting,
  fetchShortlistsByApplication,
  checkApplicationShortlisted,
  addToShortlist,
  removeFromShortlist,

  // Application response functions
  fetchApplicationResponses,

  // Utility functions
  buildApplicationFilters,
  filterApplications,

  getStatusConfig,
  getPositionTypeConfig,
  fetchApplicationManagementData,
  enrichApplicationsWithShortlistStatus,
  formatDate,
  formatDateTime,
  formatDisciplineRankings,
  handleApiError,

  // Constants
  APPLICATION_STATUS_OPTIONS,
  POSITION_TYPE_OPTIONS,
  TERM_CODE_OPTIONS,
  DISCIPLINE_OPTIONS,
  WORKLOAD_OPTIONS,
  YES_NO_OPTIONS,
};
