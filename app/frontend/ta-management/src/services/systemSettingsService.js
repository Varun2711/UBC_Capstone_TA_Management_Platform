import courseAPI from './courseAPI.js';

// System Settings Service - handles all system configuration operations
class SystemSettingsService {
  constructor() {
    this.api = courseAPI;
  }

  // ===============================
  // ACADEMIC TERMS MANAGEMENT
  // ===============================

  async getAcademicTerms() {
    try {
      const response = await this.api.getTerms({ ordering: '-startCalendarYear,start' });
      // Handle both paginated and non-paginated responses
      const terms = response.results || response;
      return Array.isArray(terms) ? terms.map(term => this.api.transformTermData(term)) : [];
    } catch (error) {
      console.error('Failed to fetch academic terms:', error);
      throw new Error('Failed to load academic terms. Please try again.');
    }
  }

  async getActiveTerms() {
    try {
      const response = await this.api.getActiveTerms();
      const terms = response.results || response;
      return Array.isArray(terms) ? terms.map(term => this.api.transformTermData(term)) : [];
    } catch (error) {
      console.error('Failed to fetch active terms:', error);
      throw new Error('Failed to load active terms. Please try again.');
    }
  }

  async getCurrentTerms() {
    try {
      const response = await this.api.getCurrentTerms();
      const terms = response.results || response;
      return Array.isArray(terms) ? terms.map(term => this.api.transformTermData(term)) : [];
    } catch (error) {
      console.error('Failed to fetch current terms:', error);
      throw new Error('Failed to load current terms. Please try again.');
    }
  }

  async createAcademicTerm(termData) {
    try {
      // Validate required fields
      if (!termData.name || !termData.startDate || !termData.endDate) {
        throw new Error('Term name, start date, and end date are required.');
      }

      // Check date logic
      if (new Date(termData.startDate) >= new Date(termData.endDate)) {
        throw new Error('Start date must be before end date.');
      }

      const apiData = this.api.transformTermDataForAPI(termData);
      const response = await this.api.createTerm(apiData);
      return this.api.transformTermData(response);
    } catch (error) {
      console.error('Failed to create academic term:', error);
      throw new Error(error.message || 'Failed to create academic term. Please try again.');
    }
  }

  async updateAcademicTerm(termId, termData) {
    try {
      // Validate required fields
      if (!termData.name || !termData.startDate || !termData.endDate) {
        throw new Error('Term name, start date, and end date are required.');
      }

      // Check date logic
      if (new Date(termData.startDate) >= new Date(termData.endDate)) {
        throw new Error('Start date must be before end date.');
      }

      const apiData = this.api.transformTermDataForAPI(termData);
      const response = await this.api.updateTerm(termId, apiData);
      return this.api.transformTermData(response);
    } catch (error) {
      console.error('Failed to update academic term:', error);
      throw new Error(error.message || 'Failed to update academic term. Please try again.');
    }
  }

  async deleteAcademicTerm(termId) {
    try {
      await this.api.deleteTerm(termId);
      return { success: true, message: 'Academic term deleted successfully.' };
    } catch (error) {
      console.error('Failed to delete academic term:', error);
      throw new Error(error.message || 'Failed to delete academic term. Please try again.');
    }
  }

  async archiveAcademicTerm(termId) {
    try {
      const response = await this.api.archiveTerm(termId);
      return { 
        success: true, 
        message: 'Academic term archived successfully.',
        term: this.api.transformTermData(response.term || response)
      };
    } catch (error) {
      console.error('Failed to archive academic term:', error);
      throw new Error(error.message || 'Failed to archive academic term. Please try again.');
    }
  }

  async restoreAcademicTerm(termId) {
    try {
      const response = await this.api.restoreTerm(termId);
      return { 
        success: true, 
        message: 'Academic term restored successfully.',
        term: this.api.transformTermData(response.term || response)
      };
    } catch (error) {
      console.error('Failed to restore academic term:', error);
      throw new Error(error.message || 'Failed to restore academic term. Please try again.');
    }
  }

  async getArchivedTerms() {
    try {
      const response = await this.api.getArchivedTerms();
      const terms = response.results || response;
      return Array.isArray(terms) ? terms.map(term => this.api.transformTermData(term)) : [];
    } catch (error) {
      console.error('Failed to fetch archived terms:', error);
      throw new Error('Failed to load archived terms. Please try again.');
    }
  }

  // ===============================
  // SYSTEM SETTINGS MANAGEMENT
  // ===============================

  // Note: These would typically be stored in a separate settings service/database
  // For now, we'll use localStorage as a fallback, but in production these should
  // be backed by a proper settings API

  getDefaultSystemSettings() {
    return {
      general: {
        institutionName: "University of British Columbia",
        timezone: "America/Vancouver",
        academicYear: "2024-2025",
        defaultLanguage: "English"
      },
      deadlines: {
        gradeSubmissionDays: 7,
        attendanceSubmissionDays: 3,
        courseWithdrawalWeeks: 6,
        incompleteGradeWeeks: 8
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        reminderDaysBefore: 3,
        systemMaintenanceNotice: true
      },
      security: {
        passwordMinLength: 8,
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 5,
        twoFactorRequired: false
      },
      enrollment: {
        maxCoursesPerStudent: 6,
        minCoursesForFullTime: 4,
        waitlistEnabled: true,
        autoEnrollFromWaitlist: true
      }
    };
  }

  async getSystemSettings() {
    try {
      // Try to get from localStorage first (fallback)
      const saved = localStorage.getItem('systemSettings');
      if (saved) {
        return { ...this.getDefaultSystemSettings(), ...JSON.parse(saved) };
      }
      return this.getDefaultSystemSettings();
    } catch (error) {
      console.error('Failed to load system settings:', error);
      return this.getDefaultSystemSettings();
    }
  }

  async saveSystemSettings(settings) {
    try {
      // In production, this would make an API call to save settings
      // For now, save to localStorage
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      return { success: true, message: 'System settings saved successfully.' };
    } catch (error) {
      console.error('Failed to save system settings:', error);
      throw new Error('Failed to save system settings. Please try again.');
    }
  }

  async updateSystemSetting(category, setting, value) {
    try {
      const currentSettings = await this.getSystemSettings();
      const updatedSettings = {
        ...currentSettings,
        [category]: {
          ...currentSettings[category],
          [setting]: value
        }
      };
      return await this.saveSystemSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update system setting:', error);
      throw new Error('Failed to update system setting. Please try again.');
    }
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  validateTermData(termData) {
    const errors = [];

    if (!termData.name || !termData.name.trim()) {
      errors.push('Term name is required.');
    }

    if (!termData.startDate) {
      errors.push('Start date is required.');
    }

    if (!termData.endDate) {
      errors.push('End date is required.');
    }

    if (termData.startDate && termData.endDate) {
      const startDate = new Date(termData.startDate);
      const endDate = new Date(termData.endDate);
      
      if (startDate >= endDate) {
        errors.push('Start date must be before end date.');
      }

      // Check if term is not too long (more than 1 year)
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        errors.push('Term duration cannot exceed 365 days.');
      }

      // Check if term is not too short (less than 1 week)
      if (diffDays < 7) {
        errors.push('Term duration must be at least 7 days.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  async getSystemStatistics() {
    try {
      const [activeTerms, currentTerms, totalCourses, totalOfferings] = await Promise.all([
        this.getActiveTerms(),
        this.getCurrentTerms(),
        this.api.getCourses({ is_active: true }),
        this.api.getCurrentCourseOfferings()
      ]);

      return {
        activeTermsCount: activeTerms.length,
        currentTermsCount: currentTerms.length,
        totalCoursesCount: totalCourses.results?.length || totalCourses.length || 0,
        totalOfferingsCount: totalOfferings.results?.length || totalOfferings.length || 0,
      };
    } catch (error) {
      console.error('Failed to get system statistics:', error);
      return {
        activeTermsCount: 0,
        currentTermsCount: 0,
        totalCoursesCount: 0,
        totalOfferingsCount: 0,
      };
    }
  }

  // Get term status based on dates
  getTermStatus(term) {
    const now = new Date();
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);

    if (!term.isActive) {
      return 'draft';
    }

    if (now >= startDate && now <= endDate) {
      return 'active';
    }

    if (now < startDate) {
      return 'upcoming';
    }

    return 'completed';
  }

  // Generate academic year string from dates
  generateAcademicYear(startDate, endDate) {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    
    if (startYear === endYear) {
      return startYear.toString();
    }
    
    return `${startYear}/${endYear.toString().slice(-2)}`;
  }

  // Get timezone options
  getTimezoneOptions() {
    return [
      { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
      { value: "America/Edmonton", label: "Mountain Time (Edmonton)" },
      { value: "America/Regina", label: "Central Time (Regina)" },
      { value: "America/Winnipeg", label: "Central Time (Winnipeg)" },
      { value: "America/Toronto", label: "Eastern Time (Toronto)" },
      { value: "America/Montreal", label: "Eastern Time (Montreal)" },
      { value: "America/Halifax", label: "Atlantic Time (Halifax)" },
      { value: "America/St_Johns", label: "Newfoundland Time (St. John's)" },
    ];
  }

  // Get language options
  getLanguageOptions() {
    return [
      { value: "English", label: "English" },
      { value: "French", label: "Français" },
      { value: "Spanish", label: "Español" },
      { value: "Mandarin", label: "中文" },
    ];
  }

  // Get term type options
  getTermTypeOptions() {
    return [
      { value: "winter", label: "Winter" },
      { value: "summer", label: "Summer" },
      { value: "full_year", label: "Full Year" },
    ];
  }
}

// Create and export singleton instance
const systemSettingsService = new SystemSettingsService();
export default systemSettingsService;

// Export class for testing
export { SystemSettingsService };
