import axios from "axios";
import { fetchTemplateDetails } from "./student-applications";

const API_URL = "http://localhost:8080/api";

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: API_URL,
});

// Note: Using getAuthHeaders() function instead of interceptors for explicit auth handling

// Helper function to get the auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("accessToken");
  if (!token) {
    // console.warn("Access token not found in sessionStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Fetches detailed application information including responses
 * @param {string|number} applicationId - Application ID
 * @returns {Promise<Object>} Detailed application data with responses
 */
export const fetchApplicationDetail = async (applicationId) => {
  try {
    const headers = getAuthHeaders();

    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    //console.log("Fetching application detail for ID:", applicationId);

    const response = await instance.get(
      `/ajp/applications/by-id/${applicationId}/`,
      {
        headers,
      }
    );

    //console.log("Application detail response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching application detail:",
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      console.error("Authentication failed - token may be expired");
    } else if (error.response?.status === 403) {
      console.error("Access forbidden - user may not have permissions");
    } else if (error.response?.status === 404) {
      console.error("Application not found");
    }

    throw error;
  }
};

/**
 * Fetches the form template used for a specific job posting
 * @param {string|number} jobPostingId - Job posting ID
 * @returns {Promise<Object>} Form template with sections and questions
 */
export const fetchJobPostingFormTemplate = async (jobPostingId) => {
  try {
    const headers = getAuthHeaders();

    // First, get the job posting to find the template ID
    const jobPosting = await fetchJobPostingDetails(jobPostingId);

    if (!jobPosting.form_template_id) {
      console.warn("No form template associated with this job posting");
      return null;
    }

    // Then fetch the template details
    const template = await fetchTemplateDetails(jobPosting.form_template_id);
    //console.log("Form template for job posting:", template);

    return template;
  } catch (error) {
    console.error(
      "Error fetching job posting form template:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Combines application data with form template questions to create a complete view
 * @param {Object} application - Application data from API
 * @returns {Promise<Object>} Combined application data with organized responses
 */
export const getApplicationWithFormData = async (application) => {
  try {
    //  console.log(
    //  "Processing application with form data:",
    //  application.application_id
    //  );

    // Get the form template used for this job posting
    let formTemplate = null;
    if (application.posting?.form_template_id) {
      formTemplate = await fetchTemplateDetails(
        application.posting.form_template_id
      );
    }

    // Organize the responses by section
    const organizedData = {
      application: application,
      formTemplate: formTemplate,
      staticResponses: extractStaticResponses(application),
      dynamicResponses: organizeDynamicResponses(
        application.responses || [],
        formTemplate
      ),
      sections: formTemplate
        ? organizeSectionData(formTemplate, application)
        : [],
    };

    //console.log("Organized application data:", organizedData);
    return organizedData;
  } catch (error) {
    console.error("Error organizing application form data:", error);
    throw error;
  }
};

/**
 * Extracts static responses that are stored directly in the Application model
 * @param {Object} application - Application data
 * @returns {Object} Static responses object
 */
export const extractStaticResponses = (application) => {
  return {
    positionType: application.positionType,
    workload: application.workload,
    disciplineRankings: application.disciplineRankings,
    citizenshipStatus: application.citizenshipStatus,
    residingInKelowna: application.residingInKelowna,
    fullTimeEnrollment: application.fullTimeEnrollment,
    hasOtherPositions: application.hasOtherPositions,
    otherPositionHours: application.otherPositionHours,
    termSelection: application.termSelection,
  };
};

/**
 * Organizes dynamic responses by question field name
 * @param {Array} responses - Array of ApplicationResponse objects
 * @param {Object} formTemplate - Form template with sections and questions
 * @returns {Object} Responses organized by field name
 */
export const organizeDynamicResponses = (responses, formTemplate) => {
  const organizedResponses = {};

  if (!responses || !Array.isArray(responses)) {
    return organizedResponses;
  }

  // Create a map of question_id to field_name for easier lookup
  const questionMap = {};
  if (formTemplate && formTemplate.sections) {
    formTemplate.sections.forEach((section) => {
      if (section.questions) {
        section.questions.forEach((question) => {
          questionMap[question.question_id] = question.field_name;
        });
      }
    });
  }

  // Organize responses by field name
  responses.forEach((response) => {
    const fieldName =
      questionMap[response.question.question_id] ||
      response.question.field_name;
    if (fieldName) {
      organizedResponses[fieldName] = response.response_data;
    }
  });

  return organizedResponses;
};

/**
 * Organizes form sections with questions and corresponding responses
 * @param {Object} formTemplate - Form template with sections and questions
 * @param {Object} application - Application data with responses
 * @returns {Array} Array of sections with questions and responses
 */
export const organizeSectionData = (formTemplate, application) => {
  if (!formTemplate || !formTemplate.sections) {
    return [];
  }

  const staticResponses = extractStaticResponses(application);
  const dynamicResponses = organizeDynamicResponses(
    application.responses || [],
    formTemplate
  );

  // Combine all responses for easy lookup
  const allResponses = {
    ...staticResponses,
    ...dynamicResponses,
  };

  // Organize sections with their questions and responses
  return formTemplate.sections.map((section) => {
    const sectionWithResponses = {
      ...section,
      questions: section.questions
        ? section.questions.map((question) => {
            const response = allResponses[question.field_name];
            return {
              ...question,
              response: response !== undefined ? response : null,
              hasResponse:
                response !== undefined && response !== null && response !== "",
            };
          })
        : [],
    };

    return sectionWithResponses;
  });
};

/**
 * Formats response data for display based on question type
 * @param {*} responseData - The response data
 * @param {Object} question - Question object with type and options
 * @returns {string} Formatted response for display
 */
export const formatResponseForDisplay = (responseData, question) => {
  if (
    responseData === null ||
    responseData === undefined ||
    responseData === ""
  ) {
    return "Not provided";
  }

  // Handle objects (like termSelection with {code, description})
  if (typeof responseData === "object" && responseData !== null) {
    // Special handling for different object types

    // If it's a term selection object with description
    if (responseData.description) {
      return responseData.description;
    }

    // If it's a term selection object with code
    if (responseData.code) {
      return responseData.code;
    }

    // For ranking questions, show the ordered list
    if (question.question_type === "ranking") {
      // Handle both formats: {rank1: "COSC", rank2: "MATH"} or {"COSC": 1, "MATH": 2}
      const entries = Object.entries(responseData);

      // Check if it's in format {rank1: "COSC", rank2: "MATH"}
      if (entries.some(([key, value]) => key.startsWith("rank"))) {
        const rankings = entries
          .filter(([key, value]) => key.startsWith("rank") && value) // Only include non-empty ranks
          .sort(([a], [b]) => {
            // Sort by rank number (rank1, rank2, rank3, etc.)
            const rankA = parseInt(a.replace("rank", ""));
            const rankB = parseInt(b.replace("rank", ""));
            return rankA - rankB;
          })
          .map(([key, value], index) => `${index + 1}. ${value}`);
        return rankings.join(", ");
      } else {
        // Handle format {"COSC": 1, "MATH": 2}
        const rankings = entries
          .sort(([, a], [, b]) => a - b)
          .map(([item, rank]) => `${rank}. ${item}`);
        return rankings.join(", ");
      }
    }

    // For other objects, try to stringify or show a meaningful representation
    try {
      return JSON.stringify(responseData);
    } catch {
      return "Complex data";
    }
  }

  switch (question.question_type) {
    case "radio":
    case "select":
      // For radio and select, the response might be a value that needs to be mapped to a label
      if (question.options && Array.isArray(question.options)) {
        const option = question.options.find(
          (opt) => opt.value === responseData
        );
        return option ? option.label : responseData.toString();
      }
      return responseData.toString();

    case "checkbox":
      // For checkboxes, response might be an array
      if (Array.isArray(responseData)) {
        return responseData.join(", ");
      }
      return responseData.toString();

    case "ranking":
      // This case is handled above in the object check
      return responseData.toString();

    case "number":
      return responseData.toString();

    case "textarea":
    case "text":
    case "email":
    default:
      return responseData.toString();
  }
};

/**
 * Gets status display information for an application
 * @param {string} status - Application status
 * @returns {Object} Status display configuration
 */
export const getStatusDisplayInfo = (status) => {
  switch (status?.toLowerCase()) {
    case "submitted":
      return {
        label: "Submitted",
        color: "blue",
        description:
          "Your application has been submitted and is awaiting review.",
      };
    case "under_review":
      return {
        label: "Under Review",
        color: "yellow",
        description:
          "Your application is currently being reviewed by the hiring committee.",
      };
    case "accepted":
      return {
        label: "Accepted",
        color: "green",
        description: "Congratulations! Your application has been accepted.",
      };
    case "rejected":
    case "no longer in consideration":
      return {
        label: "Not Selected",
        color: "red",
        description: "Your application was not selected for this position.",
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        color: "gray",
        description: "You have withdrawn your application.",
      };
    case "draft":
      return {
        label: "Draft",
        color: "gray",
        description:
          "Your application is saved as a draft and has not been submitted.",
      };
    default:
      return {
        label: status || "Unknown",
        color: "gray",
        description: "Application status is unknown.",
      };
  }
};

export const fetchStudentApplications = async () => {
  try {
    const headers = getAuthHeaders();

    // Check if we have a valid token
    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    // console.log("Fetching applications with headers:", headers);

    const response = await instance.get(
      "/ajp/applications/myapplications-short/",
      {
        headers,
      }
    );

    // console.log("Student applications response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching student applications:",
      error.response?.data || error.message
    );

    // More specific error handling
    if (error.response?.status === 401) {
      console.error("Authentication failed - token may be expired");
      // Optionally redirect to login or refresh token
    } else if (error.response?.status === 403) {
      console.error("Access forbidden - user may not have student permissions");
    }

    throw error;
  }
};

/**
 * Fetches job posting details by ID
 * @param {string|number} postingId - Job posting ID
 * @returns {Promise<Object>} Job posting data
 */
export const fetchJobPostingDetails = async (postingId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(`/ajp/jobpostings/${postingId}/`, {
      headers,
    });
    console.log("Job posting details:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching job posting:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Fetches documents associated with a specific application
 * @param {string|number} applicationId - Application ID
 * @returns {Promise<Array>} Array of document objects
 */
export const fetchApplicationDocuments = async (applicationId) => {
  try {
    const headers = getAuthHeaders();
    // Check if we have a valid token
    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    console.log("fetching documents");

    console.log("Auth headers for document fetch:", getAuthHeaders());

    const response = await instance.get(
      `/ajp/documents/by-application/${applicationId}/`,
      { headers }
    );

    console.log("here's the response", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching application documents:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Gets a signed download URL for a document
 * @param {string|number} documentId - Document ID
 * @returns {Promise<string>} Signed download URL
 */
export const getDocumentDownloadUrl = async (documentId) => {
  try {
    const headers = getAuthHeaders();

    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    const response = await instance.get(
      `/ajp/documents/${documentId}/signed_download_url/`,
      {
        headers,
      }
    );

    return response.data.url;
  } catch (error) {
    console.error(
      "Error getting document download URL:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Downloads a document by opening the signed URL
 * @param {string|number} documentId - Document ID
 * @param {string} fileName - Original file name for download
 */
export const downloadDocument = async (documentId, fileName) => {
  try {
    const downloadUrl = await getDocumentDownloadUrl(documentId);

    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading document:", error);
    throw error;
  }
};

// Also update your default export to include the new function:
export default {
  fetchApplicationDetail,
  fetchJobPostingDetails, // Add this line
  fetchJobPostingFormTemplate,
  fetchTemplateDetails,
  getApplicationWithFormData,
  extractStaticResponses,
  organizeDynamicResponses,
  organizeSectionData,
  formatResponseForDisplay,
  getStatusDisplayInfo,
  fetchStudentApplications,
  fetchApplicationDocuments,
  getDocumentDownloadUrl,
  downloadDocument,
};
