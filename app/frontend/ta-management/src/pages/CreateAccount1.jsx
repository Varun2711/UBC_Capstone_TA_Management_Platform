"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { isAlreadyLoggedIn, navigateToUserDashboard } from "@/logic/auth"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import axios from "axios"

const API_URL = 'http://localhost:8080';

export default function CreateAccount1() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    ubcStudentNumber: "",
  })

  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [studentNumberStatus, setStudentNumberStatus] = useState(null) // 'checking', 'available', 'taken', null
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce timer for student number check
  const [debounceTimer, setDebounceTimer] = useState(null)

  // on page load, check for token and redirect user who is already logged in
  useEffect(() => {
    if(isAlreadyLoggedIn()) {
      const user_type = sessionStorage.getItem('user_type')
      navigateToUserDashboard(user_type, navigate)
    }
  }, [navigate])

  // Load saved form data from sessionStorage if available
  useEffect(() => {
    const savedData = sessionStorage.getItem("createAccount1")
    if (savedData) {
      setFormData(JSON.parse(savedData))
    }
  }, [])

  // Check if student number is available
  const checkStudentNumberAvailability = async (studentNumber) => {
    if (!/^\d{8}$/.test(studentNumber)) {
      setStudentNumberStatus(null)
      return
    }

    setStudentNumberStatus('checking')
    
    try {
      const response = await axios.get(`${API_URL}/find-user/`, {
        params: { student_number: studentNumber },
      })

      // Debug: Log the actual response to understand the structure
      console.log("API Response:", response.data)
      
      // Check if response contains user data - adjust this logic based on your API
      // Common patterns:
      // - API returns user object when found: response.data.id or response.data.user_id exists
      // - API returns array: response.data.length > 0
      // - API returns object with user field: response.data.user exists
      
      // Updated logic - adjust based on your actual API response structure:
      const userExists = response.data && (
        response.data.id ||           // If user object has id
        response.data.user_id ||      // If response has user_id
        response.data.student_number || // If response has student_number
        (Array.isArray(response.data) && response.data.length > 0) // If array with results
      )

      if (userExists) {
        setStudentNumberStatus('taken')
        setFieldErrors(prev => ({
          ...prev,
          ubcStudentNumber: "This UBC student number is already registered"
        }))
      } else {
        setStudentNumberStatus('available')
        setFieldErrors(prev => ({
          ...prev,
          ubcStudentNumber: null
        }))
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // 404 = No user found, student number is available
        setStudentNumberStatus('available')
        setFieldErrors(prev => ({
          ...prev,
          ubcStudentNumber: null
        }))
      } else {
        console.error("Error checking student number:", err)
        setStudentNumberStatus(null)
        setFieldErrors(prev => ({
          ...prev,
          ubcStudentNumber: "Failed to validate student number. Please try again."
        }))
      }
    }
  }

  const validateField = (name, value) => {
    const errors = { ...fieldErrors }
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = "First name is required"
        } else if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
          errors.firstName = "First name must only contain letters"
        } else {
          errors.firstName = null
        }
        break
        
      case 'lastName':
        if (!value.trim()) {
          errors.lastName = "Last name is required"
        } else if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
          errors.lastName = "Last name must only contain letters"
        } else {
          errors.lastName = null
        }
        break
        
      case 'ubcStudentNumber':
        if (!value.trim()) {
          errors.ubcStudentNumber = "UBC student number is required"
          setStudentNumberStatus(null)
        } else if (!/^\d{8}$/.test(value.trim())) {
          errors.ubcStudentNumber = "UBC student number must be exactly 8 digits"
          setStudentNumberStatus(null)
        } else {
          errors.ubcStudentNumber = null
          // Debounced availability check
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }
          const timer = setTimeout(() => {
            checkStudentNumberAvailability(value.trim())
          }, 500) // Check after 500ms of no typing
          setDebounceTimer(timer)
        }
        break
    }
    
    setFieldErrors(errors)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setError("") // Reset general error
    
    const updated = {
      ...formData,
      [name]: value,
    }
    setFormData(updated)
    sessionStorage.setItem("createAccount1", JSON.stringify(updated))
    
    // Validate field on change
    validateField(name, value)
  }

  const handleNext = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Final validation
    const { firstName, lastName, ubcStudentNumber } = formData
    let hasErrors = false

    validateField('firstName', firstName)
    validateField('lastName', lastName)
    validateField('ubcStudentNumber', ubcStudentNumber)

    // Check if any field errors exist
    if (Object.values(fieldErrors).some(error => error !== null)) {
      hasErrors = true
    }

    // Check student number availability status
    if (studentNumberStatus === 'taken') {
      hasErrors = true
    } else if (studentNumberStatus === 'checking') {
      setError("Please wait while we verify your student number...")
      setIsSubmitting(false)
      return
    } else if (studentNumberStatus !== 'available') {
      // If we haven't checked or there was an error, do a final check
      try {
        await checkStudentNumberAvailability(ubcStudentNumber.trim())
        if (studentNumberStatus === 'taken') {
          hasErrors = true
        }
      } catch (err) {
        setError("Failed to validate student number. Please try again.")
        setIsSubmitting(false)
        return
      }
    }

    if (hasErrors) {
      setError("Please fix the errors above before continuing.")
      setIsSubmitting(false)
      return
    }

    // Proceed to next step
    sessionStorage.setItem("createAccount1", JSON.stringify(formData))
    navigate("/create-account/step2")
    setIsSubmitting(false)
  }

  const getStudentNumberIcon = () => {
    switch (studentNumberStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'taken':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getInputClassName = (fieldName) => {
    const baseClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition duration-200"
    const hasError = fieldErrors[fieldName]
    const isStudentNumberField = fieldName === 'ubcStudentNumber'
    
    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`
    } else if (isStudentNumberField && studentNumberStatus === 'available') {
      return `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500`
    } else {
      return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create an Account (1/3)</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-8">1. About You</h2>
          {/* Progress indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleNext} role="form">
          {/* General error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              First name *
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              className={getInputClassName('firstName')}
              required
            />
            {fieldErrors.firstName && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Last name *
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              className={getInputClassName('lastName')}
              required
            />
            {fieldErrors.lastName && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubcStudentNumber" className="text-sm font-medium text-gray-700">
              UBC student number *
              <span className="text-xs text-gray-500 block mt-1">Must be exactly 8 digits</span>
            </Label>
            <div className="relative">
              <Input
                id="ubcStudentNumber"
                name="ubcStudentNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.ubcStudentNumber}
                onChange={handleInputChange}
                className={`${getInputClassName('ubcStudentNumber')} pr-10`}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {getStudentNumberIcon()}
              </div>
            </div>
            {fieldErrors.ubcStudentNumber && (
              <p className="text-sm text-red-500 mt-1">{fieldErrors.ubcStudentNumber}</p>
            )}
            {studentNumberStatus === 'available' && !fieldErrors.ubcStudentNumber && (
              <p className="text-sm text-green-600 mt-1">✓ Student number is available</p>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting || studentNumberStatus === 'taken' || studentNumberStatus === 'checking'}
              className="px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 rounded-md transition duration-200"
            >
              {isSubmitting ? "Validating..." : "Next"}
            </Button>            
          </div>
          
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}