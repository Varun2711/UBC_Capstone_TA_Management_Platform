import axios from "axios";

const API_URL = 'http://localhost:8080/api';

/**
 * Fetches all open job postings from the backend.
 * Corresponds to: GET /api/ajp/jobpostings/open/
 */
export const getOpenJobPostings = async () => {
  try {
    const response = await axios.get(`${API_URL}/ajp/jobpostings/open/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching open job postings:', error);
    throw error;
  }
};

/**
 * Transforms job posting data for display on the landing page
 * @param {Array} jobPostings - Raw job postings from API
 * @returns {Object} Transformed data with stats and formatted postings
 */
export const transformJobPostingsData = (jobPostings) => {
  if (!jobPostings || !Array.isArray(jobPostings)) {
    return {
      activePostings: [],
      totalPositions: 0,
      departments: [],
      terms: []
    };
  }

  // Get unique departments and terms
  const departments = [...new Set(jobPostings.map(posting => 
    posting.department?.name || 'Unknown'
  ))];

  const terms = [...new Set(jobPostings.map(posting => 
    posting.term?.description || posting.term?.code || 'Unknown'
  ))];

  // Format postings for display
  const activePostings = jobPostings.map(posting => ({
    id: posting.posting_id,
    title: posting.title || 'TA Position',
    description: posting.description || '',
    department: posting.department?.name || 'Unknown',
    term: posting.term?.description || posting.term?.code || 'Unknown',
    termCode: posting.term?.code || '',
    status: posting.status || 'unknown',
    post_date: posting.post_date,
    deadline_date: posting.deadline_date,
    requirements: posting.requirements || '',
    created_by: posting.created_by?.name || 'Unknown',
    created_by_email: posting.created_by?.email || '',
    form_template_id: posting.form_template_id
  }));

  return {
    activePostings,
    totalPositions: activePostings.length, // Each posting represents available positions
    departments,
    terms
  };
};

/**
 * Formats date for display
 * @param {string} dateString - Date string (YYYY-MM-DD format)
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Gets the status of application period based on current date and deadlines
 * @param {Array} jobPostings - Array of job postings
 * @returns {Object} Status information
 */
export const getApplicationPeriodStatus = (jobPostings) => {
  if (!jobPostings || jobPostings.length === 0) {
    return {
      status: 'closed',
      message: 'No active applications available',
      nextDeadline: null
    };
  }

  const now = new Date();
  const activePostings = jobPostings.filter(posting => {
    if (!posting.deadline_date) return true;
    // Simple date comparison without timezone issues
    const deadline = new Date(posting.deadline_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(23, 59, 59, 999);
    return deadline >= today && posting.status === 'open';
  });

  if (activePostings.length === 0) {
    return {
      status: 'closed',
      message: 'Application period has ended',
      nextDeadline: null
    };
  }

  // Find the earliest deadline without timezone manipulation
  const nextDeadline = activePostings
    .map(posting => new Date(posting.deadline_date))
    .filter(date => !isNaN(date))
    .sort((a, b) => a - b)[0];

  return {
    status: 'open',
    message: `${activePostings.length} position${activePostings.length > 1 ? 's' : ''} available`,
    nextDeadline: nextDeadline ? formatDate(nextDeadline.toISOString().split('T')[0]) : null
  };
};

/**
 * Gets days remaining until deadline
 * @param {string} deadlineDate - Deadline date string
 * @returns {number} Days remaining (negative if past due)
 */
export const getDaysUntilDeadline = (deadlineDate) => {
  if (!deadlineDate) return null;
  
  const now = new Date();
  const deadline = new Date(deadlineDate + 'T23:59:59');
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};