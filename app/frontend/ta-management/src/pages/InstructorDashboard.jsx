"use client"

import { useState } from "react"
import { Home, User, LogOut, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function InstructorDashboard() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [requestItem, setRequestItem] = useState("")
  const [selectedRequestCourse, setSelectedRequestCourse] = useState("")

  // Mock data - to be replaced with actual API calls
  const instructor = {
    name: "Ronnie Smith",
    role: "Instructor",
  }

  const courses = [
    {
      id: 1,
      code: "COSC 101",
      name: "Digital Citizenship",
      tas: ["Alice Johnson", "Bob Wilson"],
    },
    {
      id: 2,
      code: "COSC 221",
      name: "Discrete Structures",
      tas: ["Harry Potter", "Virat Kohli", "Cristiano Ronaldo"],
    },
    {
      id: 3,
      code: "DATA 101",
      name: "Mining procedures with data",
      tas: ["Emma Davis", "Michael Brown"],
    },
  ]

  const scheduleData = [
    { time: "8:00 AM", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
    {
      time: "9:00 AM",
      monday: "COSC 221 - DH1 LAB 01\nHarry Potter",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    { time: "10:00 AM", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
    {
      time: "11:00 AM",
      monday: "",
      tuesday: "COSC 221 - 001\nLECTURE\nCristiano Ronaldo",
      wednesday: "",
      thursday: "COSC 221 - 001 LECTURE\nVirat Kohli",
      friday: "",
    },
    { time: "12:00 PM", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
    { time: "1:00 PM", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
  ]

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    console.log("Request submitted:", { course: selectedRequestCourse, item: requestItem })
    setRequestItem("")
    setSelectedRequestCourse("")
    alert("Request submitted successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-medium text-gray-900">UBC CMPS Department Teaching Assistant Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Home className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900" />
            <User className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900" />
            <LogOut className="h-5 w-5 text-gray-600 cursor-pointer hover:text-gray-900" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Instructor Info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{instructor.name}</h2>
          <p className="text-gray-600">{instructor.role}</p>
        </div>

        {!selectedCourse ? (
          /* Course Overview */
          <div className="space-y-8">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h3>
              <p className="text-gray-700 mb-4">
                The TAs for your courses have not been assigned yet. Please wait, or contact Chad for more details.
              </p>

              {/* View Assigned Courses */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">View Assigned Courses</h4>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h5 className="font-semibold text-gray-900 mb-1">{course.code}</h5>
                      <p className="text-sm text-gray-600 mb-3">{course.name}</p>
                      <Button
                        onClick={() => handleCourseSelect(course)}
                        className={`w-full text-sm ${
                        //   course.code === "COSC 221"
                        //     ? "bg-blue-600 hover:bg-blue-700 text-white"
                            // : 
                            "bg-gray-100 hover:bg-gray-300 text-gray-700"
                        }`}
                      >
                        View Assigned TAs
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Request Course Specific Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Request Course Specific Items</h3>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="course-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Select the course you want to request specific info on: *
                  </Label>
                  <select
                    id="course-select"
                    value={selectedRequestCourse}
                    onChange={(e) => setSelectedRequestCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select an option</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="request-input" className="text-sm font-medium text-gray-700 mb-2 block">
                    Enter your request: *
                  </Label>
                  <Input
                    id="request-input"
                    type="text"
                    value={requestItem}
                    onChange={(e) => setRequestItem(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your request details..."
                    required
                  />
                </div>

                <Button type="submit" className="bg-black hover:bg-gray-300 text-white px-6 py-2 rounded-md">
                  Submit
                </Button>
              </form>
            </div>

            {/* My Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">My Profile</h3>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        ) : (
          /* Course Detail View */
          <div className="space-y-8">
            {/* Back Navigation */}
            <div className="flex items-center space-x-2">
              <Button onClick={handleBackToCourses} variant="ghost" className="text-blue-600 hover:text-blue-700 p-0">
                <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                Back to Courses
              </Button>
            </div>

            {/* Course Title */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedCourse.code}</h3>
            </div>

            {/* Assigned TAs */}
            <div className="bg-orange-100 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Assigned TAs</h4>
              <ul className="space-y-2">
                {selectedCourse.tas.map((ta, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-gray-800 rounded-full mr-3"></span>
                    <span className="text-gray-900 font-medium">{ta}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lab and Schedule Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Lab and Schedule Details</h4>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">Time</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">Monday</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                        Tuesday
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                        Wednesday
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                        Thursday
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">Friday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.map((row, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 bg-gray-50">
                          {row.time}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {row.monday && <div className="whitespace-pre-line text-gray-900">{row.monday}</div>}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {row.tuesday && <div className="whitespace-pre-line text-gray-900">{row.tuesday}</div>}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {row.wednesday && <div className="whitespace-pre-line text-gray-900">{row.wednesday}</div>}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {row.thursday && <div className="whitespace-pre-line text-gray-900">{row.thursday}</div>}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {row.friday && <div className="whitespace-pre-line text-gray-900">{row.friday}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
