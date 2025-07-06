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
    const headers = getAuthHeaders();
    console.log("Sending headers:", headers); // Debugging log
    const response = await axios.get(`${API_URL}/profile/me/`, { headers });
    console.log("API response:", response.data); // Debugging log
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
 * @param {Array} skillsArray - Array of skill objects with skill_name and skill_type.
 */
export const updateSkills = async (skillsArray) => {
  try {
    const headers = getAuthHeaders();

    // Delete existing skills first
    try {
      await axios.delete(`${API_URL}/profile/me/skills/`, { headers });
    } catch (deleteError) {
      console.warn("No skills to delete or delete failed:", deleteError);
    }

    // Add skills one by one, which is what the API expects
    if (skillsArray && skillsArray.length > 0) {
      for (const skill of skillsArray) {
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
 * Updates student experiences.
 * @param {Array} experienceData - Array of experience items.
 */
export const updateExperience = async (experienceData) => {
  try {
    const headers = getAuthHeaders();
    console.log("Sending experiences to backend:", experienceData); // Debug log

    // Delete existing experiences first
    try {
      const deleteResponse = await axios.delete(`${API_URL}/profile/me/experience/`, { headers });
      console.log("Delete experiences response:", deleteResponse.status); // Debug log
    } catch (deleteError) {
      console.warn("No experiences to delete or delete failed:", deleteError);
    }

    // Add new experiences one by one
    if (experienceData && experienceData.length > 0) {
      for (const exp of experienceData) {
        console.log("Adding experience:", exp); // Debug log
        const response = await axios.post(`${API_URL}/profile/me/experience/`, exp, { headers });
        console.log("Experience added successfully:", response.data); // Debug log
      }
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating experiences:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates user availability.
 * @param {Array} availabilityData - Availability data from WeeklyAvailabilityCalendar.
 */
export const updateAvailability = async (availabilityData) => {
  try {
    const headers = getAuthHeaders();

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    const availabilityGrid = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    if (Array.isArray(availabilityData)) {
      const stringSlots = availabilityData.filter(slot => typeof slot === 'string' && slot.includes('-'));

      if (stringSlots.length > 0) {
        stringSlots.forEach(slot => {
          const parts = slot.split('-');
          if (parts.length >= 3) {
            const dayName = parts[0].toLowerCase();
            const timeSlot = parts[1];
            const halfSlot = parts[2];

            // Extended time map to include slots up to 9:30 PM
            const timeMap = {
              '8': { top: '8:00am', bottom: '8:30am' },
              '9': { top: '9:00am', bottom: '9:30am' },
              '10': { top: '10:00am', bottom: '10:30am' },
              '11': { top: '11:00am', bottom: '11:30am' },
              '12': { top: '12:00pm', bottom: '12:30pm' },
              '13': { top: '1:00pm', bottom: '1:30pm' },
              '14': { top: '2:00pm', bottom: '2:30pm' },
              '15': { top: '3:00pm', bottom: '3:30pm' },
              '16': { top: '4:00pm', bottom: '4:30pm' },
              '17': { top: '5:00pm', bottom: '5:30pm' },
              '18': { top: '6:00pm', bottom: '6:30pm' },
              '19': { top: '7:00pm', bottom: '7:30pm' },
              '20': { top: '8:00pm', bottom: '8:30pm' },
              '21': { top: '9:00pm', bottom: '9:30pm' }
            };

            const timeString = timeMap[timeSlot]?.[halfSlot];

            if (days.includes(dayName) && timeString && !availabilityGrid[dayName].includes(timeString)) {
              availabilityGrid[dayName].push(timeString);
            }
          }
        });
      }
    }

    const formattedPayload = {
      availability_grid: availabilityGrid
    };

    console.log("Formatted payload:", formattedPayload);

    const response = await axios.patch(`${API_URL}/profile/me/availability/`,
      formattedPayload,
      { headers }
    );

    console.log("API response successful:", response.data);
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