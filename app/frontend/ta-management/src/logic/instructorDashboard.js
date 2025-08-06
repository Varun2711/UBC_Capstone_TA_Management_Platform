import axios from "axios";

// API URLs
const PROFILE_API_URL = "http://localhost:8080/api/profile";
const ALLOCATIONS_API_URL = "http://localhost:8080/api/allocations";
const COURSE_OFFERINGS_API_URL =
  "http://localhost:8080/api/course-term-service/course-offerings";
const INSTRUCTOR_REQUESTS_API_URL =
  "http://localhost:8080/api/course-term-service/instructor-requests";

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

/**
 * Fetches the current instructor's profile data
 */
export const getInstructorProfile = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/me/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

/**
 * Fetches course offerings for a specific instructor
 */
export const getInstructorCourseOfferings = async (instructorId) => {
  const response = await axios.get(
    `${COURSE_OFFERINGS_API_URL}/by_instructor/?instructor_id=${instructorId}&is_active=true`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Fetches instructor requests for a specific instructor
 */
export const getInstructorRequests = async (instructorId) => {
  const response = await axios.get(
    `${INSTRUCTOR_REQUESTS_API_URL}/by_instructor/?instructor_id=${instructorId}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Fetches assignments for courses taught by the current instructor
 * This returns course assignments with TA details
 */
export const getInstructorCourseAssignments = async () => {
  const response = await axios.get(
    `${ALLOCATIONS_API_URL}/assignments/by_instructor/`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

/**
 * Transforms course offerings data to frontend format
 */
export const transformCourseOfferings = (courseOfferingsData) => {
  if (!Array.isArray(courseOfferingsData)) {
    return {
      courses: [],
    };
  }

  const courses = courseOfferingsData
    .filter((courseOffering) => {
      // Filter out inactive courses and offerings
      return (
        courseOffering.is_active !== false &&
        courseOffering.course_is_active !== false
      );
    })
    .map((courseOffering) => {
      // Extract course code and name from course_info (e.g., "COSC 111 Introduction to Programming")
      const courseInfoParts = courseOffering.course_info.split(" ");
      const courseCode = courseInfoParts.slice(0, 2).join(" "); // "COSC 111"
      const courseName = courseInfoParts.slice(2).join(" "); // "Introduction to Programming"

      return {
        id: courseOffering.course_offering_id,
        code: courseCode,
        name: courseName,
        course_id: courseOffering.course_id,
        section: courseOffering.section_number,
        tas: [], // Will be populated from TA assignments later
        status: courseOffering.is_active ? "active" : "inactive",
        term: courseOffering.term_info,
        description: courseOffering.course_description,
        timeSlots: courseOffering.time_slots_info,
      };
    });

  return { courses };
};

/**
 * Main function to fetch all instructor dashboard data
 */
export const fetchInstructorDashboardData = async () => {
  try {
    console.log("Fetching instructor dashboard data...");

    // First, get the instructor profile
    const instructorProfile = await getInstructorProfile();
    console.log("Raw instructor profile response:", instructorProfile);

    // Then get the course offerings using the instructor's ID
    const courseOfferingsData = await getInstructorCourseOfferings(
      instructorProfile.id
    );
    console.log("Raw course offerings response:", courseOfferingsData);

    // Get TA assignments for stats
    const assignmentsData = await getInstructorCourseAssignments();
    console.log("Raw assignments response:", assignmentsData);

    // Get instructor requests for pending requests count
    const requestsData = await getInstructorRequests(instructorProfile.id);
    console.log("Raw requests response:", requestsData);

    // Transform the course offerings data
    const { courses } = transformCourseOfferings(courseOfferingsData);

    // Calculate total unique courses from course offerings
    const uniqueCourseNumbers = new Set(courses.map((course) => course.code));
    const totalCourses = uniqueCourseNumbers.size;

    // Use the stats from assignments API for TA-related data
    const stats = {
      activeCourses: courses.filter((course) => course.status === "active")
        .length,
      totalTAs: assignmentsData.total_tas || 0,
      totalCourses: totalCourses, // Count of unique course numbers from instructor's course offerings
      pendingRequests: Math.max(
        0,
        totalCourses - (Array.isArray(requestsData) ? requestsData.length : 0)
      ),
    };

    return {
      instructor: {
        name: instructorProfile.name || "Unknown Instructor",
        email: instructorProfile.email || "",
        employee_number: instructorProfile.employee_number || "",
        department_name: instructorProfile.department_name || "",
        role: "Instructor",
      },
      courses: courses,
      stats: stats,
    };
  } catch (error) {
    console.error("Error in fetchInstructorDashboardData:", error);
    console.error("Error details:", error.response?.data || error.message);
    console.error("Error status:", error.response?.status);

    // For development, provide fallback mock data to prevent crashes
    console.warn("API error, using fallback mock data for development");
    return {
      instructor: {
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@university.edu",
        employee_number: "EMP1001",
        department_name: "Computer Science",
        role: "Instructor",
      },
      courses: [
        {
          id: "1",
          code: "COSC 101",
          name: "Digital Citizenship",
          section: "001",
          tas: ["Alice Johnson", "Bob Wilson"],
          status: "active",
        },
        {
          id: "2",
          code: "COSC 221",
          name: "Discrete Structures",
          section: "001",
          tas: ["Harry Potter", "Virat Kohli"],
          status: "active",
        },
      ],
      stats: {
        activeCourses: 2,
        totalTAs: 4,
        totalCourses: 2,
        pendingRequests: 0,
      },
    };
  }
};
