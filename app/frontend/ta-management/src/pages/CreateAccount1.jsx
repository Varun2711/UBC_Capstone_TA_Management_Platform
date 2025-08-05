"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { isAlreadyLoggedIn, navigateToUserDashboard } from "@/logic/auth"
import axios from "axios"

const API_URL = 'http://localhost:8080';

export default function CreateAccount1() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    ubcStudentNumber: "",
  })

  const [error, setError] = useState("") // ADDED: Error state for validation

  // on page load, check for token and redirect user who is already logged in (cannot create an account!)
  useEffect(() => {
    // if already logged in, send them to correct dashboard based on user type
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setError("") // Reset error on input change
    const updated = {
      ...formData,
      [name]: value,
    }
    setFormData(updated)
    sessionStorage.setItem("createAccount1", JSON.stringify(updated)) // Optional live save
  }

  const handleNext = async (e) => {
  e.preventDefault();

  const studentNumber = formData.ubcStudentNumber.trim();

  // Validate UBC student number (exactly 8 digits)
  if (!/^\d{8}$/.test(studentNumber)) {
    setError("UBC student number must be exactly 8 digits");
    return;
  }

  const { firstName, lastName } = formData;
  if (!firstName.trim()) {
    setError("First name is required");
    return;
  }
  if (!/^[A-Za-z\s'-]+$/.test(firstName.trim())) {
    setError("First name must only contain letters");
    return;
  }
  if (!lastName.trim()) {
    setError("Last name is required");
    return;
  }
  if (!/^[A-Za-z\s'-]+$/.test(lastName.trim())) {
    setError("Last name must only contain letters");
    return;
  }

  // Check for duplicate student number using find-user endpoint
  try {
    const response = await axios.get(`${API_URL}/api/profile/find-user/`, {
      params: { student_number: studentNumber },
    });

    // If the request succeeds and the user is found, it's a duplicate
    if (response.data && response.data.success) {
      setError("This UBC student number is already registered.");
      return;
    }
    // If response.data.success is false, the user does not exist, so we can proceed.

  } catch (err) {
    // The backend should not return a 404 for a non-existent user, but we handle it just in case.
    if (err.response?.status === 404) {
      // 404 = No user found, student number is available.
      // This is a valid state to continue.
    } else {
      // Handle other potential network or server errors
      console.error("Error checking student number:", err);
      setError("Failed to validate student number. Please try again.");
      return;
    }
  }

  // Passed validation, proceed
  sessionStorage.setItem("createAccount1", JSON.stringify(formData));
  navigate("/create-account/step2");
}



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create an Account (1/3)</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-8">1. About You</h2>
        </div>

        <form className="space-y-6" onSubmit={handleNext} role="form">
          {/* ADDED: Error message display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubcStudentNumber" className="text-sm font-medium text-gray-700">
              UBC student number * {/* ADDED: Helper text */}
              <span className="text-xs text-gray-500 block mt-1">Must be exactly 8 digits</span>
            </Label>
            <Input
              id="ubcStudentNumber"
              name="ubcStudentNumber"
              type="number"
              value={formData.ubcStudentNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition duration-200"
            >
              Next
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
