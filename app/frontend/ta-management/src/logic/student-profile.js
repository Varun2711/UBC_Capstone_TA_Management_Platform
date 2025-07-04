// src/logic/student-profile.js

import axios from "axios";

const API_URL = 'http://localhost:8080/api';

// Helper function to get the auth token from local storage
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error("Access token not found in local storage.");
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Fetches the current user's profile data from the backend.
 * Corresponds to: GET /api/profile/me/
 */
export const getProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/me/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates the user's profile data.
 * @param {object} profileData - The user data to update.
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await axios.patch(`${API_URL}/profile/me/update/`, profileData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates students academic information.
 * @param {object} academicData - Academic information to update.
 */
export const updateAcademicInfo = async (academicData) => {
  try {
    // Format academic data to match backend structure
    const formattedData = {
      student_info: {
        program: academicData.program,
        study_level: academicData.study_level,
        year_standing: academicData.year_standing,
      },
      student_profile: {
        gpa: academicData.gpa,
        minor: academicData.minor,
        year_degree_start: academicData.year_degree_start,
        expected_graduation: academicData.expected_graduation
      }
    };

    const response = await axios.patch(`${API_URL}/profile/me/update/`, formattedData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error("Error updating academic info:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates or creates student skills.
 * @param {object} skillsData - Skills to update.
 */
export const updateSkills = async (skillsData) => {
  try {
    const headers = getAuthHeaders();
    
    // Delete existing skills first
    try {
      await axios.delete(`${API_URL}/profile/me/skills/`, { headers });
    } catch (deleteError) {
      console.warn("No skills to delete or delete failed:", deleteError);
    }
    
    // Add skills one by one, which is what the API expects
    if (skillsData.skills && skillsData.skills.length > 0) {
      for (const skill of skillsData.skills) {
        await axios.post(`${API_URL}/profile/me/skills/`, {
          skill_type: skill.skill_type,
          name: skill.skill_name
        }, { headers });
      }
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating skills:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates student experience.
 * @param {Array} experienceData - Array of experience items.
 */
export const updateExperience = async (experienceData) => {
  try {
    const headers = getAuthHeaders();

    // The API expects specific fields for experience
    const formattedExperiences = experienceData.map(exp => ({
      experience_type: 'teaching', // Default to teaching for TA experience
      position_title: exp.course || 'Teaching Assistant',
      organization: exp.professor || 'UBC',
      start_date: exp.semester || '2024-01-01', // Default date if not provided
      description: exp.description || '',
      is_current: true // Default to current
    }));

    // Delete existing experiences
    try {
      await axios.delete(`${API_URL}/profile/me/experiences/`, { headers });
    } catch (deleteError) {
      console.warn("No experiences to delete or delete failed:", deleteError);
    }

    // Add new experiences
    if (formattedExperiences.length > 0) {
      for (const exp of formattedExperiences) {
        await axios.post(`${API_URL}/profile/me/experiences/`, exp, { headers });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating experience:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates user availability.
 * @param {Array} availabilityData - Availability data.
 */
export const updateAvailability = async (availabilityData) => {
  try {
    const headers = getAuthHeaders();

    // Convert availabilityData to the format expected by backend
    const formattedAvailability = {};

    // Assuming availabilityData is an array of time slots by day
    if (Array.isArray(availabilityData)) {
      // Format for array-based availability
      formattedAvailability.availability = availabilityData;
    } else {
      // Format for object-based availability (day => slots mapping)
      const availabilityGrid = {};

      for (const day in availabilityData) {
        if (availabilityData[day]) {
          availabilityGrid[day.toLowerCase()] = [];

          for (const timeSlot in availabilityData[day]) {
            if (availabilityData[day][timeSlot]) {
              availabilityGrid[day.toLowerCase()].push(timeSlot);
            }
          }
        }
      }

      formattedAvailability.availability_grid = availabilityGrid;
    }

    const response = await axios.put(`${API_URL}/profile/me/availability/`,
      formattedAvailability,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating availability:", error.response?.data || error.message);
    throw error;
  }
};
/**
 * Updates user course preferences.
 * @param {Array} coursePreferences - Course preferences array.
 */
export const updateCoursePreferences = async (coursePreferences) => {
  try {
    const headers = getAuthHeaders();

    // Try to get existing preferences first to check connection
    try {
      await axios.get(`${API_URL}/profile/me/preferences/`, { headers });
    } catch (getError) {
      // If 404, try to establish profile connection first
      if (getError.response?.status === 404) {
        await axios.patch(`${API_URL}/profile/me/update/`,
          { first_name: "", last_name: "" },
          { headers }
        );
      }
    }

    // Format the preferences for the backend
    const formattedPreferences = coursePreferences
      .filter(course => course.trim() !== '')
      .map((course, index) => ({
        course_code: course.trim(),
        preference_rank: index + 1
      }));

    // First delete existing preferences
    try {
      await axios.delete(`${API_URL}/profile/me/preferences/`, { headers });
    } catch (deleteError) {
      console.warn("No existing preferences to delete:", deleteError);
    }

    // Add new preferences one by one
    if (formattedPreferences.length > 0) {
      for (const pref of formattedPreferences) {
        await axios.post(`${API_URL}/profile/me/preferences/`, pref, { headers });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating course preferences:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Ensures a user's auth profile is properly connected to their student profile.
 * Call this after successful login to avoid "failed to save" errors.
 */
export const connectUserProfile = async () => {
  try {
    const headers = getAuthHeaders();

    // First get the user's profile to ensure it exists
    try {
      const profileResponse = await axios.get(`${API_URL}/profile/me/`, { headers });
      return profileResponse.data; // Profile exists, no further action needed
    } catch (profileError) {
      // If profile doesn't exist or has issues, try to create/update it
      if (profileError.response && (profileError.response.status === 404 || profileError.response.status === 400)) {
        // Create a minimal profile update to trigger user creation
        const response = await axios.patch(
          `${API_URL}/profile/me/update/`,
          { first_name: "", last_name: "" },
          { headers }
        );
        return response.data;
      }
      throw profileError; // Re-throw if it's not a 404/400 error
    }
  } catch (error) {
    console.error("Profile connection error:", error.response?.data || error.message);
    throw error;
  }
};