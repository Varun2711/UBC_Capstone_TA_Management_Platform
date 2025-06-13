"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"

export default function CreateAccount2() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    degreeProgram: "",
    yearOfDegree: "",
    majorProgram: "",
    minorProgram: "",
  })

  const [Error, setError] = useState("")

  useEffect(() => {
    // Check if step 1 data exists
    const step1Data = localStorage.getItem("createAccount1")
    if (!step1Data) {
      navigate("/create-account/step1")
    }
  }, [navigate])

  const handleSelectChange = (name, value) => {
    // clear any previous error
    setError("")
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNext = (e) => {
    e.preventDefault()

    // Check if major and minor are the same (and both are selected)
    if (formData.majorProgram && formData.minorProgram && formData.majorProgram === formData.minorProgram) {
      setError("Major and minor programs cannot be the same")
      return
    }

    setError("")
    // Store form data in localStorage or context
    localStorage.setItem("createAccount2", JSON.stringify(formData))
    navigate("/create-account/step3")
  }

  const handlePrev = () => {
    navigate("/create-account/step1")
  }

  const degreePrograms = ["Bachelor of Science", "Bachelor of Arts", "Bachelor of Engineering", "Bachelor of Commerce"]

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year+"]

  const majors = ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Psychology"]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create an Account (2/3)</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-8">2. About Your Degree</h2>
        </div>

        <form className="space-y-6" onSubmit={handleNext} role="form">
          {Error && (
            <div
              className="text-red-600 text-sm font-medium"
              role="alert"
              data-testid="error-message"
            >
              {Error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="degreeProgram" className="text-sm font-medium text-gray-700">
              Degree program *
            </Label>
            <select
              id="degreeProgram"
              name="degreeProgram"
              value={formData.degreeProgram}
              onChange={(e) => handleSelectChange("degreeProgram", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select a program</option>
              {degreePrograms.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearOfDegree" className="text-sm font-medium text-gray-700">
              Year of degree *
            </Label>
            <select
              id="yearOfDegree"
              name="yearOfDegree"
              value={formData.yearOfDegree}
              onChange={(e) => handleSelectChange("yearOfDegree", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="majorProgram" className="text-sm font-medium text-gray-700">
              Major program of study *
            </Label>
            <select
              id="majorProgram"
              name="majorProgram"
              value={formData.majorProgram}
              onChange={(e) => handleSelectChange("majorProgram", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select major</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minorProgram" className="text-sm font-medium text-gray-700">
              Minor program of study (optional)
            </Label>
            <select
              id="minorProgram"
              name="minorProgram"
              value={formData.minorProgram}
              onChange={(e) => handleSelectChange("minorProgram", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select minor (optional)</option>
              {majors.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              onClick={handlePrev}
              className="px-8 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-md transition duration-200"
            >
              Prev
            </Button>
            <Button
              type="submit"
              className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition duration-200"
            >
              Next
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
