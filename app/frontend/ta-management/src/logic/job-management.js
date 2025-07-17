// src/logic/job-management.js

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

// Mock data for fallback when APIs are not available
const mockDepartments = [{ id: "1", name: "CMPS" }];
const mockTerms = [
  { id: "1", code: "W2025T1", description: "Winter 2025 Term 1" },
  { id: "2", code: "W2025T2", description: "Winter 2025 Term 2" },
  { id: "3", code: "W2025BOTH", description: "Winter 2025 Both Terms" },
];

// ===============================
// JOB POSTING FUNCTIONS
// ===============================

export const fetchJobPostings = async () => {
  try {
    const response = await instance.get("/ajp/jobpostings/");
    return response.data;
  } catch (error) {
    console.error("Error fetching job postings:", error);
    throw error;
  }
};

export const fetchJobPostingById = async (postingId) => {
  try {
    const response = await instance.get(`/ajp/jobpostings/${postingId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching job posting by ID:", error);
    throw error;
  }
};

export const createJobPosting = async (jobPostingData) => {
  try {
    const headers = getAuthHeaders();

    // Prepare data - remove empty template ID to avoid validation errors
    const submitData = { ...jobPostingData };
    if (!submitData.form_template_id) {
      delete submitData.form_template_id;
    }

    const response = await instance.post("/ajp/jobpostings/", submitData, {
      headers,
    });

    console.log("Job posting created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating job posting:", error);
    throw error;
  }
};

export const updateJobPosting = async (postingId, jobPostingData) => {
  try {
    const headers = getAuthHeaders();

    // Prepare data - handle form_template_id properly
    const submitData = {
      ...jobPostingData,
      form_template_id: jobPostingData.form_template_id || null,
    };

    // Remove empty template ID to avoid validation errors
    if (!submitData.form_template_id) {
      delete submitData.form_template_id;
    }

    const response = await instance.put(
      `/ajp/jobpostings/${postingId}/`,
      submitData,
      { headers }
    );

    console.log("Job posting updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating job posting:", error);
    throw error;
  }
};

export const deleteJobPosting = async (postingId) => {
  try {
    const headers = getAuthHeaders();
    // Note: This will archive the job posting, not actually delete it
    const response = await instance.delete(`/ajp/jobpostings/${postingId}/`, {
      headers,
    });

    console.log("Job posting archived successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error archiving job posting:", error);
    throw error;
  }
};

export const assignTemplateToJobPosting = async (postingId, templateId) => {
  try {
    const headers = getAuthHeaders();
    const payload = {
      form_template_id: templateId === null ? null : templateId,
    };

    const response = await instance.patch(
      `/ajp/jobpostings/${postingId}/`,
      payload,
      { headers }
    );

    console.log("Template assigned successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error assigning template:", error);
    throw error;
  }
};

export const fetchOpenJobPostings = async () => {
  try {
    const response = await instance.get("/ajp/jobpostings/open/");
    return response.data;
  } catch (error) {
    console.error("Error fetching open job postings:", error);
    throw error;
  }
};

export const fetchJobPostingsByTerm = async (termId) => {
  try {
    const response = await instance.get(`/ajp/jobpostings/by-term/${termId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching job postings by term:", error);
    throw error;
  }
};

// ===============================
// TEMPLATE FUNCTIONS
// ===============================

export const fetchTemplates = async () => {
  try {
    const response = await instance.get("/ajp/form-templates/");
    console.log("Templates fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const fetchTemplateById = async (templateId) => {
  try {
    const response = await instance.get(`/ajp/form-templates/${templateId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching template by ID:", error);
    throw error;
  }
};

export const createTemplate = async (templateData) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.post("/ajp/form-templates/", templateData, {
      headers,
    });

    console.log("Template created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating template:", error);
    throw error;
  }
};

export const updateTemplate = async (templateId, templateData) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.put(
      `/ajp/form-templates/${templateId}/`,
      templateData,
      { headers }
    );

    console.log("Template updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
};

export const duplicateTemplate = async (templateId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.post(
      `/ajp/form-templates/${templateId}/duplicate/`,
      {},
      { headers }
    );

    console.log("Template duplicated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error duplicating template:", error);
    throw error;
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    const headers = getAuthHeaders();
    // Note: This will deactivate the template, not actually delete it
    const response = await instance.delete(
      `/ajp/form-templates/${templateId}/`,
      { headers }
    );

    console.log("Template deactivated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deactivating template:", error);
    throw error;
  }
};

// ===============================
// REFERENCE DATA FUNCTIONS
// ===============================

export const fetchDepartments = async () => {
  try {
    const response = await instance.get("/courses/departments/");
    return response.data;
  } catch (error) {
    console.error("Error fetching departments from API:", error);
    console.log("Falling back to mock departments");
    return mockDepartments;
  }
};

export const fetchTerms = async () => {
  try {
    const response = await instance.get("/courses/terms/");
    return response.data;
  } catch (error) {
    console.error("Error fetching terms from API:", error);
    console.log("Falling back to mock terms");
    return mockTerms;
  }
};

// ===============================
// USER PROFILE FUNCTIONS
// ===============================

export const fetchSchedulerProfile = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get("/profile/me/", { headers });

    console.log("Scheduler profile fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching scheduler profile:", error);
    throw error;
  }
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

export const validateJobPostingData = (data) => {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = "Title is required";
  }

  if (!data.description?.trim()) {
    errors.description = "Description is required";
  }

  if (!data.department_id) {
    errors.department_id = "Department is required";
  }

  if (!data.term_id) {
    errors.term_id = "Term is required";
  }

  if (!data.deadline_date) {
    errors.deadline_date = "Deadline date is required";
  }

  // Validate deadline is in the future
  if (data.deadline_date && new Date(data.deadline_date) <= new Date()) {
    errors.deadline_date = "Deadline must be in the future";
  }

  // Validate deadline is after post date
  if (
    data.deadline_date &&
    data.post_date &&
    new Date(data.deadline_date) <= new Date(data.post_date)
  ) {
    errors.deadline_date = "Deadline must be after post date";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateTemplateData = (data) => {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = "Template name is required";
  }

  if (!data.sections || data.sections.length === 0) {
    errors.sections = "At least one section is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ===============================
// BATCH OPERATIONS
// ===============================

export const fetchAllInitialData = async () => {
  try {
    const [jobPostings, templates, departments, terms] = await Promise.all([
      fetchJobPostings(),
      fetchTemplates(),
      fetchDepartments(),
      fetchTerms(),
    ]);

    return {
      jobPostings,
      templates,
      departments,
      terms,
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    throw error;
  }
};

export const fetchJobManagementData = async () => {
  try {
    const [jobPostings, templates] = await Promise.all([
      fetchJobPostings(),
      fetchTemplates(),
    ]);

    return {
      jobPostings,
      templates,
    };
  } catch (error) {
    console.error("Error fetching job management data:", error);
    throw error;
  }
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
// SEARCH AND FILTER UTILITIES
// ===============================

export const buildSearchParams = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, value);
    }
  });

  return params;
};

export const filterJobPostings = (jobPostings, searchTerm, statusFilter) => {
  return jobPostings.filter((posting) => {
    const matchesSearch =
      posting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      posting.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      statusFilter === "all" || posting.status === statusFilter;
    return matchesSearch && matchesFilter;
  });
};

export const filterTemplates = (templates, searchTerm, activeFilter) => {
  return templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "active" && template.is_active) ||
      (activeFilter === "inactive" && !template.is_active);
    return matchesSearch && matchesFilter;
  });
};

// ===============================
// EXPORTS
// ===============================

export default {
  // Job Posting functions
  fetchJobPostings,
  fetchJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  assignTemplateToJobPosting,
  fetchOpenJobPostings,

  fetchJobPostingsByTerm,

  // Template functions
  fetchTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,

  // Reference data functions
  fetchDepartments,
  fetchTerms,

  // User functions
  fetchSchedulerProfile,

  // Utility functions
  validateJobPostingData,
  validateTemplateData,

  fetchAllInitialData,
  fetchJobManagementData,
  handleApiError,
  buildSearchParams,
  filterJobPostings,
  filterTemplates,
};
