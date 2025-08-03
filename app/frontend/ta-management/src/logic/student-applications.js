// src/logic/student-applications.js
import {
  validateDynamicStep,
  validateAllResponses,
} from "@/components/application-form/utils/dynamicFormValidation";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: API_URL,
});

//get the cookie to padd the CSRF Token to Django backend services
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Helper function to get the auth headers
// const getAuthHeaders = () => {
//   const token = sessionStorage.getItem("accessToken");
//   const csrfToken = getCookie("csrftoken");

//   if (!token) {
//     //console.warn("Access token not found in sessionStorage");
//     return {};
//   }
//   return {
//     Authorization: `Bearer ${token}`,
//   };
// };

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("accessToken");
  const csrfToken = getCookie("csrftoken");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return headers;
};

// ===========================
// STUDENT PROFILE FUNCTIONS
// ===========================

/**
 * Fetches the current student's profile data
 * @returns {Promise<Object>} Student profile data
 */
export const fetchStudentProfile = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get("/profile/me/", { headers });
    //console.log("Student profile response:", response.data);

    // Transform API data to match the frontend format
    const cleanedData = cleanApiDataFormat(response.data);
    //console.log("Cleaned student data:", cleanedData);
    return cleanedData;
  } catch (error) {
    // console.error(
    //   "Error fetching student profile:",
    //   error.response?.data || error.message
    // );

    // Fallback to mock data for development
    console.warn("Falling back to mock data");
    return getMockStudentProfile();
  }
};

/**
 * Fetches the current student's profile data for the app bar/sidebar
 * @returns {Promise<Object>} Student profile data for UI
 */
export const fetchAppBarProfile = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get("/profile/me/", { headers });

    //  console.log("App bar profile response:", response.data);

    let student = {};
    student.name = `${response.data.first_name || ""} ${
      response.data.last_name || ""
    }`.trim();
    student.email = response.data.email;
    student.avatar = "/placeholder.svg?height=120&width=120";

    return student;
  } catch (error) {
    console.error("Error getting app bar information:", error.message);
    // Return default values instead of throwing
    return {
      name: "Student User",
      email: "",
      avatar: "/placeholder.svg?height=120&width=120",
    };
  }
};
/**
 * Updates the student's profile before application submission
 * @param {Object} studentData - Student data to update
 * @returns {Promise<Object>} Updated profile response
 */
export const updateStudentProfile = async (studentData) => {
  try {
    const headers = getAuthHeaders();
    const profileData = transformStudentToApiFormat(studentData);
    // console.log("Updating student profile with:", profileData);

    const response = await instance.patch("/profile/me/update/", profileData, {
      headers,
    });
    // console.log("Profile update response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error updating student profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ===========================
// APPLICATION FUNCTIONS
// ===========================

/**
 * Submits a complete TA application
 * @param {Object} params - Application submission parameters
 * @param {Object} params.student - Student profile data
 * @param {Object} params.responses - Application form responses
 * @param {string} params.postingId - Job posting ID
 * @param {boolean} params.confirmation - Confirmation checkbox status
 * @param {Array} params.supportingDocs - Supporting documents
 * @param {Function} params.setSubmissionStatus - Status setter function
 * @param {Function} params.setValidationErrors - Validation errors setter
 * @returns {Promise<Object>} Submission response
 */
export const submitApplication = async ({
  student,
  defaultResponses,
  dynamicResponses,
  dynamicSections,
  postingId,
  templateId,
  confirmation,
  supportingDocs = [],
  setSubmissionStatus,
  setValidationErrors,
}) => {
  try {
    // Validate confirmation
    if (!confirmation) {
      const confirmationError = {
        confirmation: "You must check the confirmation box before submitting.",
      };
      setValidationErrors(confirmationError);
      throw new Error("Confirmation required");
    }

    const allResponses = getAllResponses(defaultResponses, dynamicResponses);

    //("All combined responses:", allResponses);
    //console.log("Default responses:", defaultResponses);
    //console.log("Dynamic responses:", dynamicResponses);

    // Prepare application data
    const applicationData = {
      student_id: student.id,
      posting_id: postingId,
      termSelection_id: allResponses.termSelection,
      positionType: allResponses.positionType || null,
      workload: allResponses.workload || null,
      disciplineRankings: allResponses.disciplineRankings || {},
      citizenshipStatus: allResponses.citizenshipStatus || null,
      residingInKelowna: allResponses.residingInKelowna || null,
      fullTimeEnrollment: allResponses.fullTimeEnrollment || null,
      hasOtherPositions: allResponses.hasOtherPositions || null,
      otherPositionHours: allResponses.otherPositionHours || null,
      status: "submitted",
    };

    //console.log("here's application data:", applicationData);
    // Prepare dynamic responses data
    const responsesData = formatDynamicResponsesForSubmission(
      allResponses,
      dynamicSections
    );

    // Prepare the complete submission payload
    const submissionPayload = {
      application: applicationData,
      responses: responsesData,
      template_id: templateId,
    };

    //console.log("Submitting application:", submissionPayload);

    // Submit the application
    const headers = getAuthHeaders();
    //console.log(headers);
    const response = await instance.post(
      "/ajp/applications/submit_with_responses/",
      submissionPayload,
      { headers }
    );
    //console.log("Application submitted successfully:", response.data);

    // Update student profile if needed
    try {
      await updateStudentProfile(student);
      // console.log("Student profile updated successfully");
    } catch (profileError) {
      console.warn(
        "Profile update failed, but application was submitted:",
        profileError.message
      );
      // Don't fail the entire submission if profile update fails
    }

    // Handle supporting documents if document service is available
    if (supportingDocs.length > 0) {
      try {
        await submitSupportingDocuments(
          response.data.application_id,
          supportingDocs
        );
        //  console.log("Supporting documents submitted successfully");
      } catch (docError) {
        console.warn("Document submission failed:", docError.message);
        // Don't fail the entire submission if document upload fails
      }
    }

    setSubmissionStatus("success");
    return response.data;
  } catch (error) {
    console.error(
      "Application submission failed:",
      error.response?.data || error.message
    );
    setSubmissionStatus("error");
    throw error;
  }
};

/**
 * Formats dynamic responses for submission to ApplicationResponse model
 * @param {Object} allResponses - Combined responses from form (default + dynamic)
 * @param {Array} dynamicSections - Template sections with questions
 * @returns {Object} Formatted responses with field_name as keys (excluding Application model fields)
 */
export const formatDynamicResponsesForSubmission = (
  allResponses,
  dynamicSections
) => {
  const formattedResponses = {};

  // Fields that are stored directly in the Application model (not in ApplicationResponse)
  const applicationModelFields = [
    "positionType",
    "workload",
    "disciplineRankings",
    "citizenshipStatus",
    "residingInKelowna",
    "fullTimeEnrollment",
    "hasOtherPositions",
    "otherPositionHours",
    "termSelection",
  ];

  // Go through each section and question to map responses
  dynamicSections.forEach((section) => {
    if (section.questions && Array.isArray(section.questions)) {
      section.questions.forEach((question) => {
        const fieldName = question.field_name;
        const responseValue = allResponses[fieldName];

        // Only include responses that:
        // 1. Have values
        // 2. Are NOT already stored in the Application model
        if (
          responseValue !== undefined &&
          responseValue !== null &&
          responseValue !== "" &&
          !applicationModelFields.includes(fieldName)
        ) {
          formattedResponses[fieldName] = responseValue;
        }
      });
    }
  });

  // console.log(
  //   "Formatted dynamic responses (excluding Application model fields):",
  //   formattedResponses
  // );
  //console.log("Application model fields excluded:", applicationModelFields);
  return formattedResponses;
};

export const handleFormSubmission = async (submissionData) => {
  const {
    student,
    defaultResponses,
    dynamicResponses,
    dynamicSections,
    fieldMapping,
    postingId,
    templateId,
    confirmation,
    supportingDocs,
    setSubmissionStatus,
    setValidationErrors,
    setCurrentStep,
  } = submissionData;

  // console.log("=== FORM SUBMISSION STARTED ===");
  //console.log("Default responses:", defaultResponses);
  //console.log("Dynamic responses:", dynamicResponses);
  //console.log("Field mapping:", fieldMapping);

  // Also validate confirmation checkbox
  const finalErrors = {};
  if (!confirmation) {
    finalErrors.confirmation =
      "You must check the confirmation box before submitting.";
    setValidationErrors(finalErrors);
    return false;
  }

  // console.log("✅ All validation passed, proceeding with submission");
  setValidationErrors({});

  try {
    const allResponses = getAllResponses(defaultResponses, dynamicResponses);
    //console.log("Combined responses before submission:", allResponses);

    await submitApplication({
      student,
      defaultResponses,
      dynamicResponses,
      dynamicSections,
      postingId,
      templateId,
      confirmation,
      supportingDocs,
      setSubmissionStatus,
      setValidationErrors,
    });

    //console.log("🎉 Application submitted successfully!");
    return true;
  } catch (error) {
    //console.error("💥 Application submission failed:", error);
    setSubmissionStatus("error");
    return false;
  }
};
/**
 * Submits supporting documents for an application
 * @param {string} applicationId - Application ID
 * @param {Array} documents - Array of document objects
 * @returns {Promise<Object>} Document submission response
 */
export const submitSupportingDocuments = async (applicationId, documents) => {
  try {
    const headers = getAuthHeaders();

    // Remove Content-Type from headers to let browser set it for FormData
    const uploadHeaders = { ...headers };
    delete uploadHeaders["Content-Type"];

    const uploadPromises = documents.map(async (doc) => {
      const formData = new FormData();

      // Only append the file and application fields
      // The serializer will auto-populate file_name, file_type, and file_size
      //console.log("Is file valid:", doc.file instanceof File); // should be true

      formData.append("file", doc.file);
      formData.append("application", applicationId);

      // console.log("DOC TYPE CHECK", doc instanceof File); // should be true

      // Debug logging
      // console.log("Uploading document:", {
      //   name: doc.name,
      //   size: doc.size,
      //   type: doc.type,
      //   applicationId: applicationId,
      // });

      return instance.post("/ajp/documents/", formData, {
        headers: uploadHeaders,
      });
    });

    const responses = await Promise.all(uploadPromises);
    // console.log(
    //   "Documents submitted successfully:",
    //   responses.map((r) => r.data)
    // );
    return responses.map((r) => r.data);
  } catch (error) {
    console.error(
      "Error submitting documents:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Fetches job posting details by ID
 * @param {string} postingId - Job posting ID
 * @returns {Promise<Object>} Job posting data
 */
export const fetchJobPostingDetails = async (postingId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(`/ajp/jobpostings/${postingId}/`, {
      headers,
    });
    // console.log("Job posting details:", response.data);
    return response.data;
  } catch (error) {
    // console.error(
    //   "Error fetching job posting:",
    //   error.response?.data || error.message
    // );
    throw error;
  }
};

export const fetchTemplateDetails = async (templateId) => {
  try {
    const response = await instance.get(`/ajp/form-templates/${templateId}/`);
    return response.data;
  } catch (error) {
    // console.error(
    //   "Error fetching template:",
    //   error.response?.data || error.message
    // );
    //
  }
};

//Fetch the term details to use in the term selection question
export const fetchTermDetails = async (termId) => {
  try {
    //console.log("Fetching term details for term ID:", termId);
    const headers = getAuthHeaders();

    // Fetch the main term details
    const termResponse = await instance.get(
      `/course-term-service/terms/${termId}`,
      { headers }
    );

    // Fetch subterms for this term
    const subtermResponse = await instance.get(
      `/course-term-service/terms/${termId}/subterms/`,
      { headers }
    );

    // console.log("Main term info:", termResponse.data);
    //console.log("Subterms info:", subtermResponse.data);

    // Create options array for the termSelection field
    const termOptions = [];

    // Add the main term as an option
    if (termResponse.data) {
      termOptions.push({
        value: termResponse.data.id?.toString() || termId.toString(),
        label: termResponse.data.description,
      });
    }

    // Add subterms as additional options
    if (subtermResponse.data && Array.isArray(subtermResponse.data)) {
      subtermResponse.data.forEach((subterm) => {
        termOptions.push({
          value: subterm.id?.toString(),
          label: subterm.description,
        });
      });
    }

    //console.log("Generated term options:", termOptions);
    return termOptions;
  } catch (error) {
    // console.error(
    //   "Error fetching term information:",
    //   error.response?.data || error.message
    // );
  }
};
/**
 * Fetches student's application history
 * @returns {Promise<Array>} Array of student applications
 */
export const fetchStudentApplications = async () => {
  try {
    const headers = getAuthHeaders();

    // Check if we have a valid token
    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    // console.log("Fetching applications with headers:", headers);

    const response = await instance.get("/ajp/applications/myapplications/", {
      headers,
    });

    // console.log("Student applications response:", response.data);
    return response.data;
  } catch (error) {
    // console.error(
    //   "Error fetching student applications:",
    //   error.response?.data || error.message
    // );

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
// ===========================
// DATA TRANSFORMATION FUNCTIONS
// ===========================

/**
 * Transforms API data to frontend format
 * @param {Object} apiData - Raw API response data
 * @returns {Object} Formatted student data
 */
export const cleanApiDataFormat = (apiData) => {
  const transformAvailability = (availability) => {
    //  console.log("=== AVAILABILITY TRANSFORM DEBUG ===");
    //  console.log("Input availability:", availability);

    if (Array.isArray(availability)) {
      //  console.log("Already array format, returning as-is");
      return availability;
    }

    if (!availability || typeof availability !== "object") {
      //console.log("No availability data, returning empty array");
      return [];
    }

    const availabilityGrid = availability.availability_grid || availability;
    //console.log("Extracted grid:", availabilityGrid);

    if (!availabilityGrid || typeof availabilityGrid !== "object") {
      return [];
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const selectedSlots = [];

    const timeMap = {
      "8:00am": "8-top",
      "8:30am": "8-bottom",
      "9:00am": "9-top",
      "9:30am": "9-bottom",
      "10:00am": "10-top",
      "10:30am": "10-bottom",
      "11:00am": "11-top",
      "11:30am": "11-bottom",
      "12:00pm": "12-top",
      "12:30pm": "12-bottom",
      "1:00pm": "13-top",
      "1:30pm": "13-bottom",
      "2:00pm": "14-top",
      "2:30pm": "14-bottom",
      "3:00pm": "15-top",
      "3:30pm": "15-bottom",
      "4:00pm": "16-top",
      "4:30pm": "16-bottom",
      "5:00pm": "17-top",
      "5:30pm": "17-bottom",
      "6:00pm": "18-top",
      "6:30pm": "18-bottom",
      "7:00pm": "19-top",
      "7:30pm": "19-bottom",
      "8:00pm": "20-top",
      "8:30pm": "20-bottom",
      "9:00pm": "21-top",
      "9:30pm": "21-bottom",
    };

    days.forEach((day) => {
      if (availabilityGrid[day] && Array.isArray(availabilityGrid[day])) {
        availabilityGrid[day].forEach((time) => {
          const timeSlot = timeMap[time];
          if (timeSlot) {
            const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
            selectedSlots.push(`${dayCapitalized}-${timeSlot}`);
          }
        });
      }
    });

    //console.log("Transformed slots:", selectedSlots);
    // console.log("=== END AVAILABILITY DEBUG ===");
    return selectedSlots;
  };

  const result = {
    id: apiData.id,
    name: `${apiData.first_name || ""} ${apiData.last_name || ""}`.trim(),
    email: apiData.email,
    studentId: apiData.student_info?.student_number || "N/A",
    UBCEmployeeId: apiData.student_profile?.ubc_employee_id || "N/A",
    major: apiData.student_info?.program || "N/A",
    minor: apiData.student_profile?.minor || "N/A",
    year: apiData.student_info?.study_level || "N/A",
    gpa: apiData.student_profile?.gpa || "N/A",
    phone: apiData.student_info?.phone || "N/A",
    avatar: "/placeholder.svg?height=120&width=120",
    coursePreference:
      apiData.course_preferences?.map((pref) => pref.course_code) || [],
    academicInfo: {
      yearStanding: apiData.student_info?.year_standing?.toString() || "N/A",
      degreeStart:
        apiData.student_profile?.year_degree_start?.toString() || "N/A",
      expectedGraduation: apiData.student_info?.expected_graduation || "N/A",
    },
    experience:
      apiData.experiences?.map((exp) => ({
        course:
          exp.position_title?.replace("TA for ", "") || exp.organization || "",
        semester: extractSemesterFromDate(exp.start_date),
        professor: exp.organization || "Unknown",
        description: exp.description || "",
      })) || [],
    technicalSkills:
      apiData.skills
        ?.filter((skill) => skill.skill_type === "technical")
        .map((skill) => skill.name) || [],
    softSkills:
      apiData.skills
        ?.filter((skill) => skill.skill_type === "soft")
        .map((skill) => skill.name) || [],
    availability: transformAvailability(apiData.availability),
  };

  // console.log("=== FINAL CLEANED DATA ===");
  // console.log("Availability in result:", result.availability);
  // console.log("=== END FINAL DATA ===");
  // console.log("student", result);
  return result;
};

/**
 * Transforms frontend student data to API format
 * @param {Object} studentData - Frontend student data
 * @returns {Object} API-formatted data
 */
export const transformStudentToApiFormat = (studentData) => {
  const nameParts = studentData.name ? studentData.name.split(" ") : ["", ""];
  const first_name = nameParts[0] || "";
  const last_name = nameParts.slice(1).join(" ") || "";

  return {
    id: studentData.id,
    first_name: first_name,
    last_name: last_name,
    email: studentData.email,
    student_info: {
      student_number:
        studentData.studentId !== "N/A" ? studentData.studentId : null,
      program: studentData.major !== "N/A" ? studentData.major : null,
      year_standing: studentData.year !== "N/A" ? studentData.year : null,
      study_level: "Undergraduate", // You might want to make this dynamic
      phone: studentData.phone !== "N/A" ? studentData.phone : null,
    },
    student_profile: {
      gpa: studentData.gpa !== "N/A" ? studentData.gpa : null,
      year_degree_start:
        studentData.academicInfo?.degreeStart !== "N/A"
          ? studentData.academicInfo.degreeStart
          : null,
      minor: studentData.minor !== "N/A" ? studentData.minor : null,
      ubc_employee_id:
        studentData.UBCEmployeeId !== "N/A" ? studentData.UBCEmployeeId : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    experiences:
      studentData.experience?.map((exp, index) => ({
        id: `exp${index + 1}`,
        experience_type: "TA",
        position_title: "Teaching Assistant",
        organization: exp.course,
        start_date: exp.semester?.split(" to ")[0] || null,
        end_date: exp.semester?.split(" to ")[1] || null,
        is_current: false,
        description: exp.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [],
    skills: [
      ...(studentData.technicalSkills?.map((skill, index) => ({
        id: `tech_skill${index + 1}`,
        skill_type: "technical",
        name: skill,
        created_at: new Date().toISOString(),
      })) || []),
      ...(studentData.softSkills?.map((skill, index) => ({
        id: `soft_skill${index + 1}`,
        skill_type: "soft",
        name: skill,
        created_at: new Date().toISOString(),
      })) || []),
    ],
    course_preferences:
      studentData.coursePreference?.map((course, index) => ({
        id: `pref${index + 1}`,
        course_code: course,
        preference_rank: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [],
    availability: {
      id: "avail1",
      availability_grid: {
        monday: ["9:00-10:00", "14:00-15:00"],
        tuesday: ["10:00-12:00"],
        wednesday: ["9:00-10:00", "14:00-15:00"],
        thursday: ["10:00-12:00"],
        friday: ["9:00-11:00"],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Extracts semester information from date string
 * @param {string} dateString - Date string to parse
 * @returns {string} Formatted semester string (e.g., "Fall 2023")
 */
export const extractSemesterFromDate = (dateString) => {
  if (!dateString) return "";

  // If it's already in "Fall 2022" format, return as-is
  if (dateString.match(/^(Fall|Winter|Summer)\s+\d{4}$/)) {
    //console.log("Already in semester format:", dateString);
    return dateString;
  }

  // Handle the "2022-09-02 to " format from ApplicationForm
  if (dateString.includes(" to ")) {
    const datePart = dateString.split(" to ")[0];
    if (datePart) {
      dateString = datePart;
    }
  }

  try {
    //console.log("dateString is:", dateString);

    // Only try to parse if it looks like a date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(dateString);
      //console.log("dateString to date becomes:", date);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        //  console.log("Invalid date, returning original string");
        return dateString;
      }

      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed: Jan=0, Sep=8, Dec=11

      //console.log("Extracted semester info:", { year, month });

      let term = "Winter";
      if (month >= 4 && month <= 7) term = "Summer"; // May-Aug
      else if (month >= 8) term = "Fall"; // Sep-Dec
      // Jan-Apr stays as Winter

      const result = `${term} ${year}`;
      //console.log("Final result:", result);
      return result;
    }

    // If it doesn't look like a date, return as-is
    // console.log("Not a date format, returning original:", dateString);
    return dateString;
  } catch (e) {
    //console.error("Date parsing error:", e);
    return dateString;
  }
};

/**
 * Gets mock student profile for development/fallback
 * @returns {Object} Mock student profile data
 */
export const getMockStudentProfile = () => {
  return {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    studentId: "20240012",
    UBCEmployeeId: "82342316",
    password: "password123",
    major: "Computer Science",
    minor: "Data Science",
    year: "Graduate Student",
    gpa: "3.85",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=120&width=120",
    coursePreference: [
      "COSC 111",
      "MATH 101",
      "COSC 121",
      "DATA 101",
      "STAT 121",
      "PHYS 111",
    ],
    academicInfo: {
      yearStanding: "4th Year",
      degreeStart: "September 2022",
      expectedGraduation: "May 2026",
    },
    experience: [
      {
        course: "CS 111 - Introduction to Programming",
        semester: "Fall 2023",
        professor: "Dr. Smith",
        description:
          "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
      },
      {
        course: "MATH 101 - Introduction to Calculus",
        semester: "Summer 2023",
        professor: "Dr. Brown",
        description:
          "Assisted with lecture sessions, and graded midterms and exams.",
      },
    ],
    technicalSkills: [
      "Python",
      "Java",
      "JavaScript",
      "React",
      "Node.js",
      "SQL",
      "Git",
      "Linux",
      "Machine Learning",
      "Data Structures",
    ],
    softSkills: [
      "Communication",
      "Teamwork",
      "Problem Solving",
      "Time Management",
      "Adaptability",
      "Critical Thinking",
    ],
    availability: [],
  };
};

export const checkApplicationFields = (sections) => {
  const fieldsExist = {
    citizenshipStatus: false,
    residingInKelowna: false,
    fullTimeEnrollment: false,
    hasOtherPositions: false,
    otherPositionHours: false,
    positionType: false,
    termSelection: false,
    workload: false,
    disciplineRankings: false,
  };

  // Check each section and question
  if (sections && Array.isArray(sections)) {
    sections.forEach((section) => {
      if (section.questions && Array.isArray(section.questions)) {
        section.questions.forEach((question) => {
          if (
            question.field_name &&
            fieldsExist.hasOwnProperty(question.field_name)
          ) {
            fieldsExist[question.field_name] = true;
          }
        });
      }
    });
  }

  return fieldsExist;
};

export const getAllResponses = (defaultResponses, dynamicResponses) => {
  return {
    ...defaultResponses,
    ...dynamicResponses,
  };
};

/**
 * Validates application form data
 * @param {Object} student - Student profile data
 * @param {Object} responses - Application responses
 * @param {boolean} confirmation - Confirmation status
 * @returns {Object} Validation result with isValid boolean and errors object
 */

// ===========================
// FORM NAVIGATION HELPERS
// ===========================

/**
 * Enhanced navigation handler that supports both dynamic and static validation
 * @param {number} currentStep - Current step number
 * @param {Function} setStep - Step setter function
 * @param {Function} legacyValidateStep - Legacy validation function for static forms
 * @param {Object} navigationData - All data needed for navigation and validation
 * @returns {boolean} Whether navigation was successful
 */
export const handleNextStep = (
  currentStep,
  setStep,
  legacyValidateStep,
  navigationData
) => {
  const {
    student,
    defaultResponses,
    dynamicResponses,
    dynamicSections = [],
    fieldMapping = {},
    totalSteps,
    setValidationErrors,
  } = navigationData;

  //console.log("=== ENHANCED NAVIGATION STARTED ===");
  //console.log("Current step:", currentStep);
  //console.log("Total steps:", totalSteps);
  //console.log("Dynamic sections count:", dynamicSections.length);

  const isDynamicStep = currentStep <= dynamicSections.length;

  if (isDynamicStep) {
    //console.log("=== DYNAMIC STEP VALIDATION ===");
    //console.log("Validating dynamic step:", currentStep);

    const currentSection = dynamicSections[currentStep - 1];
    // console.log("Current section:", currentSection?.name);

    // Use the new dynamic validation system
    const { isValid, errors } = validateDynamicStep(
      currentStep,
      dynamicSections,
      defaultResponses,
      dynamicResponses,
      fieldMapping
    );

    if (isValid) {
      // console.log(
      //   "✅ Dynamic step validation passed, moving to step:",
      //   currentStep + 1
      // );
      setStep(currentStep + 1);
      if (setValidationErrors) setValidationErrors({});
      return true;
    } else {
      //  console.log("❌ Dynamic step validation failed:", errors);
      if (setValidationErrors) setValidationErrors(errors);
      return false;
    }
  } else {
    //console.log("=== STATIC STEP NAVIGATION ===");
    const adjustedStep = currentStep - dynamicSections.length;
    //console.log("Adjusted step for static validation:", adjustedStep);

    // Handle specific static sections
    if (adjustedStep === 1) {
      // Personal Details section
      //console.log("Personal Details section - moving to next step");
      setStep(currentStep + 1);
      if (setValidationErrors) setValidationErrors({});
      return true;
    } else if (adjustedStep === 2) {
      // Supporting Documents section
      // console.log("Supporting Documents section - moving to next step");
      setStep(currentStep + 1);
      if (setValidationErrors) setValidationErrors({});
      return true;
    } else if (legacyValidateStep) {
      // Use legacy validation for other static sections
      //console.log("Using legacy validation for static section");
      const { isValid, errors } = legacyValidateStep(
        adjustedStep,
        student,
        defaultResponses
      );

      if (isValid) {
        setStep(currentStep + 1);
        if (setValidationErrors) setValidationErrors({});
        return true;
      } else {
        //console.log("Legacy validation errors:", errors);
        if (setValidationErrors) setValidationErrors(errors);
        return false;
      }
    } else {
      // No validation function provided, just move forward
      //console.log("No validation function, moving to next step");
      setStep(currentStep + 1);
      if (setValidationErrors) setValidationErrors({});
      return true;
    }
  }
};

/**
 * Handles moving to the previous step in the application form
 * @param {number} currentStep - Current step number
 * @param {Function} setStep - Step setter function
 * @param {Function} clearErrors - Function to clear validation errors
 */
export const handlePreviousStep = (currentStep, setStep, clearErrors) => {
  if (clearErrors) clearErrors();
  setStep(currentStep - 1);
};

// ===========================
// ACCESS PROTECTION FUNCTIONS
// ===========================

/**
 * Check if the user has already applied to this job posting
 * @param {string|number} postingId - Job posting ID
 * @returns {Promise<Object|null>} Existing application or null
 */
export const checkExistingApplication = async (postingId) => {
  try {
    const headers = getAuthHeaders();

    if (!headers.Authorization) {
      throw new Error("No authentication token available");
    }

    // Use the short endpoint to check existing applications
    const response = await instance.get(
      "/ajp/applications/myapplications-short/",
      {
        headers,
      }
    );

    // Find if there's already an application for this posting
    const existingApplication = response.data.find(
      (app) => String(app.posting_id) === String(postingId)
    );

    return existingApplication || null;
  } catch (error) {
    console.error("Error checking existing application:", error);
    throw error;
  }
};

/**
 * Validates if the user can access the application form for a given posting
 * @param {string|number} postingId - Job posting ID
 * @returns {Promise<Object>} Validation result with status and redirect info
 */
export const validateApplicationFormAccess = async (postingId) => {
  try {
    // Check if posting exists and is open
    const jobPosting = await fetchJobPostingDetails(postingId);

    if (!jobPosting) {
      return {
        canAccess: false,
        reason: "Job posting not found",
        redirectTo: "/student-dashboard",
        message: "The job posting you're trying to access does not exist.",
      };
    }

    if (jobPosting.status !== "open") {
      return {
        canAccess: false,
        reason: "Job posting is not open",
        redirectTo: "/view-job-postings",
        message: "This job posting is no longer accepting applications.",
      };
    }

    // Check if application deadline has passed
    const currentDate = new Date();
    const deadlineDate = new Date(jobPosting.deadline_date);

    if (currentDate > deadlineDate) {
      return {
        canAccess: false,
        reason: "Application deadline has passed",
        redirectTo: "/view-job-postings",
        message: "The application deadline for this position has passed.",
      };
    }

    // Check if user has already applied
    const existingApplication = await checkExistingApplication(postingId);

    if (existingApplication) {
      return {
        canAccess: false,
        reason: "Already applied",
        redirectTo: `/my-applications/detail/${existingApplication.application_id}`,
        message: "You have already submitted an application for this position.",
        existingApplication,
      };
    }

    // All checks passed
    return {
      canAccess: true,
      jobPosting,
    };
  } catch (error) {
    console.error("Error validating application form access:", error);
    return {
      canAccess: false,
      reason: "Validation error",
      redirectTo: "/student-dashboard",
      message: "There was an error validating your access. Please try again.",
    };
  }
};

export default {
  fetchStudentProfile,
  updateStudentProfile,
  submitApplication,
  submitSupportingDocuments,
  fetchJobPostingDetails,
  fetchTemplateDetails,
  fetchStudentApplications,
  cleanApiDataFormat,
  transformStudentToApiFormat,
  extractSemesterFromDate,
  getMockStudentProfile,
  handleNextStep,
  handlePreviousStep,
  checkApplicationFields,
  getAllResponses,
  handleFormSubmission,
  formatDynamicResponsesForSubmission,
  fetchTermDetails,
  fetchAppBarProfile,
  checkExistingApplication, // NEW
  validateApplicationFormAccess, // NEW
};
