"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import axios from "axios"

const API_URL = 'http://localhost:8080';

export default function CreateAccount3() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("") // Add error state
  const [isSubmitting, setIsSubmitting] = useState(false) // Add loading state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    // Check if previous steps data exists
    const step1Data = sessionStorage.getItem("createAccount1")
    const step2Data = sessionStorage.getItem("createAccount2")
    if (!step1Data || !step2Data) {
      navigate("/create-account/step1")
    }
  }, [navigate])

  // Load saved form data from sessionStorage if available
  useEffect(() => {
    const savedData = sessionStorage.getItem("createAccount3")
    if (savedData) {
      setFormData(JSON.parse(savedData))
    }
  }, [])

  useEffect(() => {
    const { password } = formData;
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[\W_]/.test(password), // Checks for non-alphanumeric characters
    });
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError("")

  const trimmedEmail = formData.email.trim()

  // Basic email format check using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    setError("Please enter a valid email address.")
    return
  }

  // Check all password validation criteria are met
  const allValid = Object.values(passwordValidation).every(Boolean);
  if (!allValid) {
    setError("Password does not meet all the requirements.");
    return;
  }


  if (formData.password !== formData.confirmPassword) {
    setError("Passwords don't match!")
    return
  }

  // Set loading state
  setIsSubmitting(true)

  try {
    // Combine all form data
    const step1Data = JSON.parse(sessionStorage.getItem("createAccount1"))
    const step2Data = JSON.parse(sessionStorage.getItem("createAccount2"))

    const actualMajor = step2Data.majorProgram === "Other (please specify)" 
      ? step2Data.otherMajorProgram 
      : step2Data.majorProgram;
  
    const actualMinor = step2Data.minorProgram === "Other (please specify)" 
      ? step2Data.otherMinorProgram 
      : step2Data.minorProgram;

    // Format data to match the StudentRegistrationSerializer
    const registerData = {
      student_number: step1Data.ubcStudentNumber,
      name: `${step1Data.firstName} ${step1Data.lastName}`, // Concatenate first and last name
      email: formData.email,
      password: formData.password,
      study_level: step2Data.degreeProgram,
      // for step 2 info
      program: actualMajor,
      minor: actualMinor || '',  // Send to auth service
      year_degree_start: parseInt(step2Data.yearOfDegreeStart, 10) // ✅ FIX: Use actual year from step2Data
    }

    console.log("Sending account data to backend:", registerData)

    // Send request to backend with the CORRECT endpoint
    const response = await axios.post(`${API_URL}/api/auth/register/`, registerData)

    console.log("Account creation response:", response.data)

    // After registration, log in to get tokens
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login/`, {
        email: formData.email,
        password: formData.password
      })

      // After logging in, save the additional profile data
      if (loginResponse.data && loginResponse.data.access) {
        sessionStorage.setItem('accessToken', loginResponse.data.access)

        // Now save the additional profile information that wasn't part of registration
        try {
          const additionalProfileData = {
            student_profile: {
              minor: step2Data.minorProgram || '',
              year_degree_start: parseInt(step2Data.yearOfDegreeStart, 10), // FIX: Use actual year here too
            }
          };

          await axios.patch(`${API_URL}/api/profile/me/update/`, additionalProfileData, {
            headers: { Authorization: `Bearer ${loginResponse.data.access}` }
          });
        } catch (profileError) {
          console.warn("Additional profile data not saved, but account created successfully:", profileError);
        }

        // Continue with redirect
        navigate("/student-dashboard")
      }
    }
    catch (loginError) {
      // If login fails after registration
      setError("Account created but login failed. Please try logging in manually.")
      navigate("/login")
    }
  } catch (error) {
    console.error("Account creation error:", error)

    // Handle various error responses
    if (error.response) {
      if (error.response.status === 400) {
        // Format validation errors
        const backendErrors = error.response.data
        const errorMessages = []

        // Extract error messages from response
        for (const field in backendErrors) {
          if (Array.isArray(backendErrors[field])) {
            errorMessages.push(`${field}: ${backendErrors[field].join(', ')}`)
          } else if (typeof backendErrors[field] === 'object') {
            // Handle nested errors (like in student_profile)
            for (const nestedField in backendErrors[field]) {
              errorMessages.push(`${nestedField}: ${backendErrors[field][nestedField].join(', ')}`)
            }
          } else {
            errorMessages.push(`${field}: ${backendErrors[field]}`)
          }
        }

        setError(errorMessages.join('. ') || "Invalid form data. Please check your entries.")
      } else if (error.response.status === 409) {
        setError("An account with this email already exists.")
      } else {
        setError("Failed to create account. Please try again later.")
      }
    } else {
      setError("Network error. Please check your connection and try again.")
    }
  } finally { 
    setIsSubmitting(false)
  }
}

  const handlePrev = () => {
    navigate("/create-account/step2")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create an Account (3/3)</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-8">3. Account Details</h2>
        </div>

        {/* Show error message if there is one */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} role="form">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Live Password Validation Checklist */}
          <div className="text-sm text-gray-600">
              <ul className="list-inside space-y-1">
                <li className={passwordValidation.length ? 'text-green-600' : 'text-red-600'}>
                  {passwordValidation.length ? '✓' : '✗'} At least 8 characters
                </li>
                <li className={passwordValidation.uppercase ? 'text-green-600' : 'text-red-600'}>
                  {passwordValidation.uppercase ? '✓' : '✗'} At least one uppercase letter
                </li>
                <li className={passwordValidation.lowercase ? 'text-green-600' : 'text-red-600'}>
                  {passwordValidation.lowercase ? '✓' : '✗'} At least one lowercase letter
                </li>
                <li className={passwordValidation.number ? 'text-green-600' : 'text-red-600'}>
                  {passwordValidation.number ? '✓' : '✗'} At least one number
                </li>
                <li className={passwordValidation.symbol ? 'text-green-600' : 'text-red-600'}>
                  {passwordValidation.symbol ? '✓' : '✗'} At least one symbol
                </li>
              </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              onClick={handlePrev}
              className="px-8 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-md transition duration-200"
              disabled={isSubmitting}
            >
              Prev
            </Button>
            <Button
              type="submit"
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Done"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}