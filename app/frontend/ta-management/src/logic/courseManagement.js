import axios from "axios";

// API URLs
const COURSE_TERM_API_URL = "http://localhost:8080/api/course-term-service";
const PROFILE_API_URL = "http://localhost:8080/api/profile";

// Helper function to get the auth token from session storage
const getAuthHeaders = () => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
};

// --- Term Parsing Functions ---

/**
 * Parses term code like "W2025 Term 2" into components
 * @param {string} termCode - Term code like "W2025 Term 2", "S2024 Term 1", "W2025 Both Terms"
 * @returns {object} - { season: 'Winter'|'Summer', year: 2025, term: '1'|'2'|'Both', seasonCode: 'W'|'S' }
 */
export const parseTermCode = (termCode) => {
  if (!termCode) return null;

  // Match pattern like "W2025 Term 2" or "S2024 Both Terms"
  const match = termCode.match(
    /^([WS])(\d{4})\s+(Term\s+(\d+)|Both\s+Terms)$/i
  );

  if (!match) return null;

  const seasonCode = match[1].toUpperCase();
  const year = parseInt(match[2]);
  const termPart = match[3];

  let term;
  if (termPart.toLowerCase().includes("both")) {
    term = "Both";
  } else {
    const termMatch = termPart.match(/Term\s+(\d+)/);
    term = termMatch ? termMatch[1] : "1";
  }

  const season = seasonCode === "W" ? "Winter" : "Summer";

  return {
    season,
    seasonCode,
    year,
    term,
    fullTerm: `${season} ${year} ${
      term === "Both" ? "Both Terms" : `Term ${term}`
    }`,
  };
};

/**
 * Creates a term code from components
 * @param {string} seasonCode - 'W' or 'S'
 * @param {number} year - Year like 2025
 * @param {string} term - '1', '2', or 'Both'
 * @returns {string} - Term code like "W2025 Term 2"
 */
export const createTermCode = (seasonCode, year, term) => {
  const termPart = term === "Both" ? "Both Terms" : `Term ${term}`;
  return `${seasonCode}${year} ${termPart}`;
};

// --- Course Functions ---

/**
 * Fetches all courses with full details including offerings and shared sessions
 */
export const getAllCoursesFullDetails = async () => {
  const response = await axios.get(
    `${COURSE_TERM_API_URL}/courses/all_full_details/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Fetches a specific course by ID
 */
export const getCourseById = async (courseId) => {
  const response = await axios.get(
    `${COURSE_TERM_API_URL}/courses/${courseId}/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Creates a new course
 */
export const createCourse = async (courseData) => {
  const response = await axios.post(
    `${COURSE_TERM_API_URL}/courses/`,
    {
      course_number: courseData.code,
      course_name: courseData.title,
      department: courseData.departmentId,
      course_description: courseData.description,
      course_level: courseData.level || "100",
      is_active: true,
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Updates an existing course
 */
export const updateCourse = async (courseId, courseData) => {
  const response = await axios.put(
    `${COURSE_TERM_API_URL}/courses/${courseId}/`,
    {
      course_number: courseData.code,
      course_name: courseData.title,
      department: courseData.departmentId,
      course_description: courseData.description,
      course_level: courseData.level || "100",
      is_active:
        courseData.is_active !== undefined ? courseData.is_active : true,
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Deletes a course
 */
export const deleteCourse = async (courseId) => {
  const response = await axios.delete(
    `${COURSE_TERM_API_URL}/courses/${courseId}/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

// --- Course Offering Functions ---

/**
 * Creates a new course offering
 */
export const createCourseOffering = async (offeringData) => {
  const response = await axios.post(
    `${COURSE_TERM_API_URL}/course-offerings/`,
    {
      course_id: offeringData.courseId,
      section_number: offeringData.section,
      term_id: offeringData.termId,
      instructor_id: offeringData.instructorId,
      time_slots: offeringData.time_slots || [],
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Updates an existing course offering
 */
export const updateCourseOffering = async (offeringId, offeringData) => {
  const response = await axios.put(
    `${COURSE_TERM_API_URL}/course-offerings/${offeringId}/`,
    {
      course_id: offeringData.courseId,
      section_number: offeringData.section,
      term_id: offeringData.termId,
      instructor_id: offeringData.instructorId,
      time_slots: offeringData.time_slots || [],
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Deletes a course offering
 */
export const deleteCourseOffering = async (offeringId) => {
  const response = await axios.delete(
    `${COURSE_TERM_API_URL}/course-offerings/${offeringId}/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

// --- Shared Session Functions ---

/**
 * Creates a new shared session (lab/tutorial)
 */
export const createSharedSession = async (sessionData) => {
  const response = await axios.post(
    `${COURSE_TERM_API_URL}/shared-sessions/`,
    {
      session_type: sessionData.sessionType,
      course_id: sessionData.courseId, // Changed from 'course'
      section_number: sessionData.section,
      academic_term_id: sessionData.termId, // Changed from 'academic_term'
      time_slots: sessionData.timeSlots || [],
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Updates an existing shared session
 */
export const updateSharedSession = async (sessionId, sessionData) => {
  const response = await axios.put(
    `${COURSE_TERM_API_URL}/shared-sessions/${sessionId}/`,
    {
      session_type: sessionData.sessionType,
      course_id: sessionData.courseId,
      section_number: sessionData.section,
      academic_term_id: sessionData.termId,
      time_slots: sessionData.timeSlots || [],
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Deletes a shared session
 */
export const deleteSharedSession = async (sessionId) => {
  const response = await axios.delete(
    `${COURSE_TERM_API_URL}/shared-sessions/${sessionId}/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

// --- Terms Functions ---

/**
 * Fetches all terms
 */
export const getTerms = async () => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/terms/`, {
    headers: getAuthHeaders(),
  });
  return response.data.results || [];
};

/**
 * Fetches active terms
 */
export const getActiveTerms = async () => {
  const response = await axios.get(
    `${COURSE_TERM_API_URL}/terms/?is_active=true`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data.results || [];
};

// --- Department Functions ---

/**
 * Fetches all departments
 */
export const getDepartments = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/departments/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// --- Instructor Functions ---

/**
 * Fetches all instructors
 */
export const getInstructors = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/instructors/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// --- Helper Functions ---

/**
 * Extracts course level from course code (e.g., "COSC 111" -> "100")
 */
const extractLevelFromCode = (code) => {
  if (!code) return "100";

  const match = code.match(/(\d+)/);
  if (match) {
    const number = match[1];
    return number.charAt(0) + "00"; // Convert 111 to 100, 221 to 200, etc.
  }
  return "100"; // Default
};

/**
 * Maps backend course data to frontend format with instructor names resolved
 */
export const mapCourseData = (backendCourse, instructors = []) => {
  // Create instructor lookup map
  const instructorMap = new Map();
  instructors.forEach((instructor) => {
    instructorMap.set(instructor.id, instructor.name);
    instructorMap.set(String(instructor.id), instructor.name);
    instructorMap.set(Number(instructor.id), instructor.name);
  });

  return {
    id: backendCourse.id,
    code: backendCourse.code,
    title: backendCourse.title,
    department: backendCourse.department,
    departmentId: backendCourse.departmentId,
    description: backendCourse.description,
    level: extractLevelFromCode(backendCourse.code),
    offerings: (backendCourse.offerings || []).map((offering) => {
      const instructorName =
        instructorMap.get(offering.instructor_id) ||
        instructorMap.get(String(offering.instructor_id)) ||
        instructorMap.get(Number(offering.instructor_id)) ||
        "Unassigned";

      const termData = parseTermCode(offering.term);
      return {
        id: offering.id,
        year: termData?.year || offering.year,
        term: offering.term,
        termData: termData,
        instructor: offering.instructor_id,
        instructorId: offering.instructor_id,
        instructorName: instructorName,
        section: offering.section,
        displaySection: `${backendCourse.code}-${offering.section}`,
        requirements: offering.requirements,
        // Add time slots handling
        time_slots: offering.time_slots || [],
        timeSlots: offering.time_slots || [], // For compatibility
        time_increments: offering.time_increments || [],
      };
    }),
    // The backend already returns sharedSessions grouped by term - just use it directly!
    sharedSessions: backendCourse.sharedSessions || {},
  };
};

/**
 * Maps terms data to frontend format for simplified dropdown
 */
export const mapTermsForDropdown = (terms) => {
  return terms.map((term) => {
    const parsedTerm = parseTermCode(term.code);

    // Extract year from multiple possible sources
    let year = null;
    if (parsedTerm) {
      year = parsedTerm.year;
    } else if (term.startCalendarYear) {
      year = term.startCalendarYear;
    } else if (term.year) {
      year = term.year;
    } else {
      // Try to extract year from any string field
      const yearMatch = (term.code || term.term_code || term.name || "").match(
        /(\d{4})/
      );
      year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    }

    // Create a readable label combining season and term
    let label = term.description || term.code;
    if (parsedTerm) {
      label = `${parsedTerm.season} Term ${parsedTerm.term}`;
      if (parsedTerm.term === "Both") {
        label = `${parsedTerm.season} Both Terms`;
      }
    }

    return {
      value: term.code || term.term_code || term.id,
      label: label,
      id: term.id,
      year: year,
      parsedData: parsedTerm,
      // Keep original term data for debugging
      _original: term,
    };
  });
};

/**
 * Maps instructors for dropdown with enhanced search capability
 */
export const mapInstructorsForDropdown = (instructors, departments) => {
  const departmentMap = new Map(
    departments.map((dept) => [dept.id, dept.name])
  );

  return instructors.map((instructor) => ({
    id: instructor.id,
    name:
      instructor.name ||
      `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim(),
    email: instructor.email,
    department:
      departmentMap.get(instructor.department) ||
      instructor.department_name ||
      "Unknown",
    departmentId: instructor.department,
    // Additional fields for search
    searchableText: `${
      instructor.name ||
      `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim()
    } ${instructor.email} ${
      departmentMap.get(instructor.department) ||
      instructor.department_name ||
      ""
    }`,
  }));
};

/**
 * Updated course offering submission handler
 */
export const handleOfferingSubmission = async (
  courseId,
  offeringData,
  terms,
  isEdit = false,
  offeringId = null
) => {
  try {
    // Find the term details from the term code
    const selectedTerm = terms.find((term) => term.value === offeringData.term);

    const submitData = {
      courseId: courseId,
      section: offeringData.section,
      termId: selectedTerm?.id,
      instructorId: offeringData.instructor,
      // Add time_slots to the submission data
      time_slots: offeringData.time_slots || [],
      // Add year for additional context
      academicYear: offeringData.year,
    };

    if (isEdit && offeringId) {
      return await updateCourseOffering(offeringId, submitData);
    } else {
      return await createCourseOffering(submitData);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches only active terms (Updated to use the existing getActiveTerms function)
 */
export const getActiveTermsForDropdowns = async () => {
  const response = await axios.get(
    `${COURSE_TERM_API_URL}/terms/?is_active=true`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data.results || [];
};

/**
 * Alternative: Filter terms on frontend if backend doesn't support is_active filter
 */
export const getFilteredActiveTerms = async () => {
  const allTerms = await getTerms();
  return allTerms.filter((term) => term.is_active === true);
};

/**
 * Bulk import courses from a CSV file
 * @param {File} file - The CSV file containing course data
 * @returns {object} - Response containing import results
 */
export const bulkImportCourses = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${COURSE_TERM_API_URL}/bulk-import/`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Download sample CSV file for bulk import
 * @returns {void} - Triggers browser download of sample CSV file
 */
export const downloadSampleCSV = async () => {
  try {
    const response = await axios.get(`${COURSE_TERM_API_URL}/sample-csv/`, {
      headers: {
        ...getAuthHeaders(),
      },
      responseType: "blob", // Important for file download
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Set filename for download
    link.setAttribute("download", "sample_bulk_import.csv");

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading sample CSV:", error);
    throw error;
  }
};
