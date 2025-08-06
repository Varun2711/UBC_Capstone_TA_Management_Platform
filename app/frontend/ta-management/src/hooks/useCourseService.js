import { useState, useEffect, useCallback } from 'react'
import courseAPI from '../services/courseAPI'

// Custom hook for handling API operations with loading and error states
export const useApiOperation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (apiCall, errorMessage = 'Operation failed') => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiCall()
      return result
    } catch (err) {
      const message = err.message || errorMessage
      setError(message)
      console.error('API operation failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    execute,
    clearError
  }
}

// Custom hook for handling course service authentication
export const useCourseServiceAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      // Check if we have a token
      const token = localStorage.getItem('authToken')
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      // Test the token with the debug endpoint
      await courseAPI.debugAuth()
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Authentication check failed:', err)
      setAuthError(err.message || 'Authentication failed')
      setIsAuthenticated(false)
      
      // Clear invalid token
      localStorage.removeItem('authToken')
    } finally {
      setAuthLoading(false)
    }
  }

  const login = (token) => {
    localStorage.setItem('authToken', token)
    setIsAuthenticated(true)
    setAuthError(null)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
    setAuthError(null)
  }

  return {
    isAuthenticated,
    authLoading,
    authError,
    checkAuthentication,
    login,
    logout
  }
}

// Custom hook for handling system settings operations
export const useSystemSettings = () => {
  const [terms, setTerms] = useState([])
  const [settings, setSettings] = useState({})
  const [stats, setStats] = useState({})
  const { loading, error, execute, clearError } = useApiOperation()

  const loadTerms = useCallback(async () => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.getAcademicTerms()
      setTerms(result)
      return result
    }, 'Failed to load academic terms')
  }, [execute])

  const loadSettings = useCallback(async () => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.getSystemSettings()
      setSettings(result)
      return result
    }, 'Failed to load system settings')
  }, [execute])

  const loadStats = useCallback(async () => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.getSystemStatistics()
      setStats(result)
      return result
    }, 'Failed to load system statistics')
  }, [execute])

  const loadAll = useCallback(async () => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const [termsResult, settingsResult, statsResult] = await Promise.all([
        systemSettingsService.getAcademicTerms(),
        systemSettingsService.getSystemSettings(),
        systemSettingsService.getSystemStatistics()
      ])
      
      setTerms(termsResult)
      setSettings(settingsResult)
      setStats(statsResult)
      
      return { terms: termsResult, settings: settingsResult, stats: statsResult }
    }, 'Failed to load system data')
  }, [execute])

  const createTerm = useCallback(async (termData) => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.createAcademicTerm(termData)
      setTerms(prev => [...prev, result])
      return result
    }, 'Failed to create academic term')
  }, [execute])

  const updateTerm = useCallback(async (termId, termData) => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.updateAcademicTerm(termId, termData)
      setTerms(prev => prev.map(term => term.id === termId ? result : term))
      return result
    }, 'Failed to update academic term')
  }, [execute])

  const deleteTerm = useCallback(async (termId) => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      await systemSettingsService.deleteAcademicTerm(termId)
      setTerms(prev => prev.filter(term => term.id !== termId))
      return true
    }, 'Failed to delete academic term')
  }, [execute])

  const updateSettings = useCallback(async (newSettings) => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.saveSystemSettings(newSettings)
      setSettings(newSettings)
      return result
    }, 'Failed to save system settings')
  }, [execute])

  const updateSetting = useCallback(async (category, setting, value) => {
    return execute(async () => {
      const systemSettingsService = (await import('../services/systemSettingsService')).default
      const result = await systemSettingsService.updateSystemSetting(category, setting, value)
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value
        }
      }))
      return result
    }, 'Failed to update setting')
  }, [execute])

  return {
    terms,
    settings,
    stats,
    loading,
    error,
    clearError,
    loadTerms,
    loadSettings,
    loadStats,
    loadAll,
    createTerm,
    updateTerm,
    deleteTerm,
    updateSettings,
    updateSetting
  }
}

// Custom hook for handling course operations
export const useCourseOperations = () => {
  const [courses, setCourses] = useState([])
  const [offerings, setOfferings] = useState([])
  const [sharedSessions, setSharedSessions] = useState([])
  const { loading, error, execute, clearError } = useApiOperation()

  const loadCourses = useCallback(async (params = {}) => {
    return execute(async () => {
      const result = await courseAPI.getCourses(params)
      const coursesData = result.results || result
      setCourses(coursesData)
      return coursesData
    }, 'Failed to load courses')
  }, [execute])

  const loadOfferings = useCallback(async (params = {}) => {
    return execute(async () => {
      const result = await courseAPI.getCourseOfferings(params)
      const offeringsData = result.results || result
      setOfferings(offeringsData)
      return offeringsData
    }, 'Failed to load course offerings')
  }, [execute])

  const loadSharedSessions = useCallback(async (params = {}) => {
    return execute(async () => {
      const result = await courseAPI.getSharedSessions(params)
      const sessionsData = result.results || result
      setSharedSessions(sessionsData)
      return sessionsData
    }, 'Failed to load shared sessions')
  }, [execute])

  const createCourse = useCallback(async (courseData) => {
    return execute(async () => {
      const result = await courseAPI.createCourse(courseData)
      setCourses(prev => [...prev, result])
      return result
    }, 'Failed to create course')
  }, [execute])

  const updateCourse = useCallback(async (courseId, courseData) => {
    return execute(async () => {
      const result = await courseAPI.updateCourse(courseId, courseData)
      setCourses(prev => prev.map(course => course.id === courseId ? result : course))
      return result
    }, 'Failed to update course')
  }, [execute])

  const deleteCourse = useCallback(async (courseId) => {
    return execute(async () => {
      await courseAPI.deleteCourse(courseId)
      setCourses(prev => prev.filter(course => course.id !== courseId))
      return true
    }, 'Failed to delete course')
  }, [execute])

  return {
    courses,
    offerings,
    sharedSessions,
    loading,
    error,
    clearError,
    loadCourses,
    loadOfferings,
    loadSharedSessions,
    createCourse,
    updateCourse,
    deleteCourse
  }
}

export default {
  useApiOperation,
  useCourseServiceAuth,
  useSystemSettings,
  useCourseOperations
}
