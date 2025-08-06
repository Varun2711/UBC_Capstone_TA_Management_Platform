// Course Service API
const API_BASE_URL = 'http://localhost:8002/api/course-term-service';

class CourseAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Helper method to make API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================
  // TERMS API METHODS
  // ===============================

  // Get all terms
  async getTerms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/terms/${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  // Get active terms
  async getActiveTerms() {
    return this.makeRequest('/terms/active/', { method: 'GET' });
  }

  // Get current terms
  async getCurrentTerms() {
    return this.makeRequest('/terms/current/', { method: 'GET' });
  }

  // Get terms by year
  async getTermsByYear(year) {
    return this.makeRequest(`/terms/by_year/?year=${year}`, { method: 'GET' });
  }

  // Create a new term
  async createTerm(termData) {
    return this.makeRequest('/terms/', {
      method: 'POST',
      body: termData,
    });
  }

  // Update a term
  async updateTerm(termId, termData) {
    return this.makeRequest(`/terms/${termId}/`, {
      method: 'PATCH',
      body: termData,
    });
  }

  // Delete a term
  async deleteTerm(termId) {
    return this.makeRequest(`/terms/${termId}/`, { method: 'DELETE' });
  }

  // Archive a term
  async archiveTerm(termId) {
    return this.makeRequest(`/terms/${termId}/archive/`, { method: 'PATCH' });
  }

  // Restore a term
  async restoreTerm(termId) {
    return this.makeRequest(`/terms/${termId}/restore/`, { method: 'PATCH' });
  }

  // Get archived terms
  async getArchivedTerms() {
    return this.makeRequest('/terms/archived/', { method: 'GET' });
  }

  // ===============================
  // COURSES API METHODS
  // ===============================

  // Get all courses
  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/courses/${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  // Get courses by department
  async getCoursesByDepartment(departmentId) {
    return this.makeRequest(`/courses/by_department/?department_id=${departmentId}`, { method: 'GET' });
  }

  // Get courses by level
  async getCoursesByLevel(level) {
    return this.makeRequest(`/courses/by_level/?level=${level}`, { method: 'GET' });
  }

  // Create a new course
  async createCourse(courseData) {
    return this.makeRequest('/courses/', {
      method: 'POST',
      body: courseData,
    });
  }

  // Update a course
  async updateCourse(courseId, courseData) {
    return this.makeRequest(`/courses/${courseId}/`, {
      method: 'PATCH',
      body: courseData,
    });
  }

  // Delete a course
  async deleteCourse(courseId) {
    return this.makeRequest(`/courses/${courseId}/`, { method: 'DELETE' });
  }

  // Get course details with full information
  async getCourseFullDetails(courseId) {
    return this.makeRequest(`/courses/${courseId}/full_details/`, { method: 'GET' });
  }

  // Get all courses with full details
  async getAllCoursesFullDetails() {
    return this.makeRequest('/courses/all_full_details/', { method: 'GET' });
  }

  // ===============================
  // COURSE OFFERINGS API METHODS
  // ===============================

  // Get all course offerings
  async getCourseOfferings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/course-offerings/${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  // Get current course offerings
  async getCurrentCourseOfferings() {
    return this.makeRequest('/course-offerings/current/', { method: 'GET' });
  }

  // Get course offerings by term
  async getCourseOfferingsByTerm(termId) {
    return this.makeRequest(`/course-offerings/by_term/?term_id=${termId}`, { method: 'GET' });
  }

  // Get course offerings by course
  async getCourseOfferingsByCourse(courseId) {
    return this.makeRequest(`/course-offerings/by_course/?course_id=${courseId}`, { method: 'GET' });
  }

  // Get course offerings by instructor
  async getCourseOfferingsByInstructor(instructorId) {
    return this.makeRequest(`/course-offerings/by_instructor/?instructor_id=${instructorId}`, { method: 'GET' });
  }

  // Create a new course offering
  async createCourseOffering(offeringData) {
    return this.makeRequest('/course-offerings/', {
      method: 'POST',
      body: offeringData,
    });
  }

  // Update a course offering
  async updateCourseOffering(offeringId, offeringData) {
    return this.makeRequest(`/course-offerings/${offeringId}/`, {
      method: 'PATCH',
      body: offeringData,
    });
  }

  // Delete a course offering
  async deleteCourseOffering(offeringId) {
    return this.makeRequest(`/course-offerings/${offeringId}/`, { method: 'DELETE' });
  }

  // ===============================
  // SHARED SESSIONS API METHODS
  // ===============================

  // Get all shared sessions
  async getSharedSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/shared-sessions/${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  // Get current shared sessions
  async getCurrentSharedSessions() {
    return this.makeRequest('/shared-sessions/current/', { method: 'GET' });
  }

  // Get shared sessions by term
  async getSharedSessionsByTerm(termId) {
    return this.makeRequest(`/shared-sessions/by_term/?academic_term_id=${termId}`, { method: 'GET' });
  }

  // Get shared sessions by course
  async getSharedSessionsByCourse(courseId) {
    return this.makeRequest(`/shared-sessions/by_course/?course_id=${courseId}`, { method: 'GET' });
  }

  // Get shared sessions by session type
  async getSharedSessionsByType(sessionType) {
    return this.makeRequest(`/shared-sessions/by_session_type/?session_type=${sessionType}`, { method: 'GET' });
  }

  // Get available session types
  async getSessionTypes() {
    return this.makeRequest('/shared-sessions/session_types/', { method: 'GET' });
  }

  // Create a new shared session
  async createSharedSession(sessionData) {
    return this.makeRequest('/shared-sessions/', {
      method: 'POST',
      body: sessionData,
    });
  }

  // Update a shared session
  async updateSharedSession(sessionId, sessionData) {
    return this.makeRequest(`/shared-sessions/${sessionId}/`, {
      method: 'PATCH',
      body: sessionData,
    });
  }

  // Delete a shared session
  async deleteSharedSession(sessionId) {
    return this.makeRequest(`/shared-sessions/${sessionId}/`, { method: 'DELETE' });
  }

  // ===============================
  // INSTRUCTOR REQUESTS API METHODS
  // ===============================

  // Get all instructor requests
  async getInstructorRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/instructor-requests/${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  // Get instructor requests by instructor
  async getInstructorRequestsByInstructor(instructorId) {
    return this.makeRequest(`/instructor-requests/by_instructor/?instructor_id=${instructorId}`, { method: 'GET' });
  }

  // Get recent instructor requests
  async getRecentInstructorRequests() {
    return this.makeRequest('/instructor-requests/recent/', { method: 'GET' });
  }

  // Create a new instructor request
  async createInstructorRequest(requestData) {
    return this.makeRequest('/instructor-requests/', {
      method: 'POST',
      body: requestData,
    });
  }

  // Update an instructor request
  async updateInstructorRequest(requestId, requestData) {
    return this.makeRequest(`/instructor-requests/${requestId}/`, {
      method: 'PATCH',
      body: requestData,
    });
  }

  // Delete an instructor request
  async deleteInstructorRequest(requestId) {
    return this.makeRequest(`/instructor-requests/${requestId}/`, { method: 'DELETE' });
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  // Get API root information
  async getAPIRoot() {
    return this.makeRequest('/', { method: 'GET' });
  }

  // Test authentication
  async debugAuth() {
    return this.makeRequest('/debug-auth/', { method: 'GET' });
  }

  // Transform term data for frontend use
  transformTermData(term) {
    return {
      id: term.id,
      name: term.code,
      startDate: term.start,
      endDate: term.end,
      registrationStart: term.start, // Note: API doesn't have registration dates
      registrationEnd: term.end,     // Using term dates as fallback
      status: term.is_current ? 'active' : (term.is_active ? 'upcoming' : 'draft'),
      description: term.description,
      academicYear: term.academicYear,
      termType: term.term_type,
      isActive: term.is_active,
    };
  }

  // Transform frontend term data for API
  transformTermDataForAPI(termData) {
    return {
      code: termData.name,
      description: termData.description || '',
      start: termData.startDate,
      end: termData.endDate,
      startCalendarYear: new Date(termData.startDate).getFullYear(),
      endCalendarYear: new Date(termData.endDate).getFullYear(),
      academicYear: termData.academicYear || `${new Date(termData.startDate).getFullYear()}/${new Date(termData.endDate).getFullYear() % 100}`,
      is_active: termData.status !== 'draft',
      term_type: termData.termType || 'winter',
    };
  }
}

// Create and export a singleton instance
const courseAPI = new CourseAPI();
export default courseAPI;

// Export the class for testing
export { CourseAPI };
