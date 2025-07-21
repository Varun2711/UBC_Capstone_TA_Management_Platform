// src/logic/student-applications.js

import axios from "axios";

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
    console.warn("Access token not found in sessionStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
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
    console.error(
      "Error fetching student profile:",
      error.response?.data || error.message
    );

    // Fallback to mock data for development
    console.warn("Falling back to mock data");
    return getMockStudentProfile();
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
    console.log("Updating student profile with:", profileData);

    const response = await instance.patch("/profile/me/update/", profileData, {
      headers,
    });
    console.log("Profile update response:", response.data);
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
  responses,
  postingId,
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

    // Prepare application data
    const applicationData = {
      student_id: student.id,
      posting_id: postingId,
      termSelection_id: 1, // You may want to make this dynamic
      positionType: responses.positionType,
      workload: responses.workload,
      disciplineRankings: responses.disciplineRanking,
      citizenshipStatus: responses.citizenshipStatus,
      residingInKelowna: responses.residingInKelowna,
      fullTimeEnrollment: responses.fullTimeEnrollment,
      hasOtherPositions: responses.hasOtherPositions,
      otherPositionHours: responses.otherPositionHours || null,
      status: "submitted",
    };

    console.log("Submitting application:", applicationData);

    // Submit the application
    const headers = getAuthHeaders();
    const applicationResponse = await instance.post(
      "/ajp/applications/",
      applicationData,
      { headers }
    );
    console.log(
      "Application submitted successfully:",
      applicationResponse.data
    );

    // Update student profile if needed
    try {
      await updateStudentProfile(student);
      console.log("Student profile updated successfully");
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
          applicationResponse.data.id,
          supportingDocs
        );
        console.log("Supporting documents submitted successfully");
      } catch (docError) {
        console.warn("Document submission failed:", docError.message);
        // Don't fail the entire submission if document upload fails
      }
    }

    setSubmissionStatus("success");
    return applicationResponse.data;
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
 * Submits supporting documents for an application
 * @param {string} applicationId - Application ID
 * @param {Array} documents - Array of document objects
 * @returns {Promise<Object>} Document submission response
 */
export const submitSupportingDocuments = async (applicationId, documents) => {
  try {
    const headers = getAuthHeaders();
    const documentData = {
      applicationId,
      supportingDocuments: documents.map((doc) => ({
        name: doc.name,
        size: doc.size,
        type: doc.type,
        // Add other document properties as needed
      })),
    };

    const response = await instance.post("/ajp/documents/", documentData, {
      headers,
    });
    console.log("Documents submitted successfully:", response.data);
    return response.data;
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
    console.error(
      "Error fetching job posting:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const fetchTemplateDetails = async (templateId) => {
  try {
    const response = await instance.get(`/ajp/form-templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching template:",
      error.response?.data || error.message
    );
    //
  }
};

/**
 * Fetches student's application history
 * @returns {Promise<Array>} Array of student applications
 */
export const fetchStudentApplications = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get("/ajp/applications/my-applications/", {
      headers,
    });
    console.log("Student applications:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching student applications:",
      error.response?.data || error.message
    );
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
      console.log("Already array format, returning as-is");
      return availability;
    }

    if (!availability || typeof availability !== "object") {
      console.log("No availability data, returning empty array");
      return [];
    }

    const availabilityGrid = availability.availability_grid || availability;
    console.log("Extracted grid:", availabilityGrid);

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

    console.log("Transformed slots:", selectedSlots);
    console.log("=== END AVAILABILITY DEBUG ===");
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
    console.log("Already in semester format:", dateString);
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
    console.log("dateString is:", dateString);

    // Only try to parse if it looks like a date
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(dateString);
      console.log("dateString to date becomes:", date);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date, returning original string");
        return dateString;
      }

      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed: Jan=0, Sep=8, Dec=11

      console.log("Extracted semester info:", { year, month });

      let term = "Winter";
      if (month >= 4 && month <= 7) term = "Summer"; // May-Aug
      else if (month >= 8) term = "Fall"; // Sep-Dec
      // Jan-Apr stays as Winter

      const result = `${term} ${year}`;
      console.log("Final result:", result);
      return result;
    }

    // If it doesn't look like a date, return as-is
    console.log("Not a date format, returning original:", dateString);
    return dateString;
  } catch (e) {
    console.error("Date parsing error:", e);
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

const applicationResponsesExist = {
  citizenshipStatus: false,
  residingInKelowna: false,
  fullTimeEnrollment: false,
  hasOtherPositions: false,
  otherPositionHours: false,
  positionType: false,
  winterTerm: false,
  workload: false,
  disciplineRanking: false,
};

export const checkApplicationFields = (sections) => {
  //to be filled in
  //if sections.questions.field name is present in the default applicationform,
  // then set applicationResponsesExist to true
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
 * Handles moving to the next step in the application form
 * @param {number} currentStep - Current step number
 * @param {Function} setStep - Step setter function
 * @param {Function} validateStep - Step validation function
 * @param {Object} validationData - Data needed for validation
 * @returns {boolean} Whether navigation was successful
 */
export const handleNextStep = (
  currentStep,
  setStep,
  validateStep,
  validationData
) => {
  console.log("Current step is", currentStep);
  console.log("Validaton data", validationData.responses);
  const { isValid, errors } = validateStep(
    currentStep,
    validationData.student,
    validationData.responses
  );

  if (isValid) {
    setStep(currentStep + 1);
    return true;
  } else {
    console.log("Validation errors:", errors);
    return false;
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
};
