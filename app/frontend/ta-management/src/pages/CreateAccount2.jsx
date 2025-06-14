"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function CreateAccountStep2() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    degreeProgram: "",
    otherDegreeProgram: "",
    yearOfDegreeStart: "",
    majorProgram: "",
    otherMajorProgram: "", // ADDED: Track custom major program entry
    minorProgram: "",
    otherMinorProgram: "", // ADDED: Track custom minor program entry
  })
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if step 1 data exists
    const step1Data = localStorage.getItem("createAccountStep1")
    if (!step1Data) {
      navigate("/create-account/step1")
    }
  }, [navigate])

  const handleSelectChange = (name, value) => {
    setError("") // Clear error when user makes changes
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Clear other degree program if not selecting "Other"
      ...(name === "degreeProgram" && value !== "Other (please specify)" && { otherDegreeProgram: "" }),
      // ADDED: Clear other major program if not selecting "Other"
      ...(name === "majorProgram" && value !== "Other (please specify)" && { otherMajorProgram: "" }),
      // ADDED: Clear other minor program if not selecting "Other"
      ...(name === "minorProgram" && value !== "Other (please specify)" && { otherMinorProgram: "" }),
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setError("") // Clear error when user makes changes
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNext = (e) => {
    e.preventDefault()

    // Check if "Other" is selected but no custom degree is provided
    if (formData.degreeProgram === "Other (please specify)" && !formData.otherDegreeProgram.trim()) {
      setError("Please specify your degree program")
      return
    }

    // ADDED: Check if "Other" is selected for major but no custom major is provided
    if (formData.majorProgram === "Other (please specify)" && !formData.otherMajorProgram.trim()) {
      setError("Please specify your major program")
      return
    }

    // ADDED: Check if "Other" is selected for minor but no custom minor is provided
    if (formData.minorProgram === "Other (please specify)" && !formData.otherMinorProgram.trim()) {
      setError("Please specify your minor program")
      return
    }

    // ADDED: Enhanced duplicate checking - compare actual values (including custom entries)
    const actualMajor =
      formData.majorProgram === "Other (please specify)" ? formData.otherMajorProgram : formData.majorProgram
    const actualMinor =
      formData.minorProgram === "Other (please specify)" ? formData.otherMinorProgram : formData.minorProgram

    // MODIFIED: Use actualMajor and actualMinor for comparison, with case-insensitive matching
    if (actualMajor && actualMinor && actualMajor.toLowerCase() === actualMinor.toLowerCase()) {
      setError("Major and minor programs cannot be the same")
      return
    }

    setError("")
    localStorage.setItem("createAccountStep2", JSON.stringify(formData))
    navigate("/create-account/step3")
  }

  const handlePrev = () => {
    navigate("/create-account/step1")
  }

  const degreePrograms = ["BSc or BA", "MSc", "PhD", "Other (please specify)"]

  const years = ["2019", "2020", "2021", "2022", "2023", "2024"]

  const majors = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Economics",
    "Psychology",
    "Other (please specify)", // ADDED: Allow custom major/minor entries
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create an Account (2/3)</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-8">2. About Your Degree</h2>
        </div>

        <form className="space-y-6" onSubmit={handleNext} role="form">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="degreeProgram" className="text-sm font-medium text-gray-700">
              Degree currently in progress *
            </Label>
            <select
              id="degreeProgram"
              name="degreeProgram"
              value={formData.degreeProgram}
              onChange={(e) => handleSelectChange("degreeProgram", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select a degree</option>
              {degreePrograms.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>

          {formData.degreeProgram === "Other (please specify)" && (
            <div className="space-y-2">
              <Label htmlFor="otherDegreeProgram" className="text-sm font-medium text-gray-700">
                Please specify your degree *
              </Label>
              <Input
                id="otherDegreeProgram"
                name="otherDegreeProgram"
                type="text"
                value={formData.otherDegreeProgram}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your degree program"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="yearOfDegreeStart" className="text-sm font-medium text-gray-700">
              Year of degree start *
            </Label>
            <select
              id="yearOfDegreeStart"
              name="yearOfDegreeStart"
              value={formData.yearOfDegreeStart}
              onChange={(e) => handleSelectChange("yearOfDegreeStart", e.target.value)}
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

          {/* ADDED: Conditional input for custom major program */}
          {formData.majorProgram === "Other (please specify)" && (
            <div className="space-y-2">
              <Label htmlFor="otherMajorProgram" className="text-sm font-medium text-gray-700">
                Please specify your major *
              </Label>
              <Input
                id="otherMajorProgram"
                name="otherMajorProgram"
                type="text"
                value={formData.otherMajorProgram}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your major program"
                required
              />
            </div>
          )}

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

          {/* ADDED: Conditional input for custom minor program */}
          {formData.minorProgram === "Other (please specify)" && (
            <div className="space-y-2">
              <Label htmlFor="otherMinorProgram" className="text-sm font-medium text-gray-700">
                Please specify your minor *
              </Label>
              <Input
                id="otherMinorProgram"
                name="otherMinorProgram"
                type="text"
                value={formData.otherMinorProgram}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your minor program"
                required
              />
            </div>
          )}

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
