"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Calendar,
  Clock,
  Save,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  School,
  Users,
  Mail,
  Shield,
  Database,
  Bell,
  Globe,
  FileText,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminSidebar } from "../../components/admin-dashboard-sidebar"


// Mock data for academic terms
const mockAcademicTerms = [
  {
    id: 1,
    name: "Fall 2024",
    startDate: "2024-08-26",
    endDate: "2024-12-15",
    registrationStart: "2024-07-01",
    registrationEnd: "2024-08-15",
    status: "active"
  },
  {
    id: 2,
    name: "Spring 2025",
    startDate: "2025-01-13",
    endDate: "2025-05-10",
    registrationStart: "2024-11-01",
    registrationEnd: "2024-12-20",
    status: "upcoming"
  },
  {
    id: 3,
    name: "Summer 2025",
    startDate: "2025-06-02",
    endDate: "2025-08-15",
    registrationStart: "2025-03-01",
    registrationEnd: "2025-05-20",
    status: "draft"
  }
]

// Mock system settings
const mockSystemSettings = {
  general: {
    institutionName: "University of Education",
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
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("terms")
  const [academicTerms, setAcademicTerms] = useState(mockAcademicTerms)
  const [systemSettings, setSystemSettings] = useState(mockSystemSettings)
  const [editingTerm, setEditingTerm] = useState(null)
  const [showAddTerm, setShowAddTerm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  const tabs = [
    { id: "terms", label: "Academic Terms", icon: Calendar },
    { id: "general", label: "General Settings", icon: Settings },
    { id: "deadlines", label: "Deadlines", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "enrollment", label: "Enrollment", icon: Users }
  ]

  const handleSettingChange = (category, setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    setSaveStatus("saving")
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaveStatus("success")
    setHasChanges(false)
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const handleAddTerm = (termData) => {
    const newTerm = {
      id: Date.now(),
      ...termData,
      status: "draft"
    }
    setAcademicTerms(prev => [...prev, newTerm])
    setShowAddTerm(false)
    setHasChanges(true)
  }

  const handleDeleteTerm = (termId) => {
    setAcademicTerms(prev => prev.filter(term => term.id !== termId))
    setHasChanges(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const SettingField = ({ label, value, onChange, type = "text", options = null }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {type === "select" && options ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Enable this setting</span>
        </label>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? parseInt(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )

  const AddTermModal = () => {
    const [termData, setTermData] = useState({
      name: "",
      startDate: "",
      endDate: "",
      registrationStart: "",
      registrationEnd: ""
    })

    return showAddTerm ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add Academic Term</h3>
          <div className="space-y-4">
            <SettingField
              label="Term Name"
              value={termData.name}
              onChange={(value) => setTermData(prev => ({ ...prev, name: value }))}
            />
            <SettingField
              label="Start Date"
              value={termData.startDate}
              onChange={(value) => setTermData(prev => ({ ...prev, startDate: value }))}
              type="date"
            />
            <SettingField
              label="End Date"
              value={termData.endDate}
              onChange={(value) => setTermData(prev => ({ ...prev, endDate: value }))}
              type="date"
            />
            <SettingField
              label="Registration Start"
              value={termData.registrationStart}
              onChange={(value) => setTermData(prev => ({ ...prev, registrationStart: value }))}
              type="date"
            />
            <SettingField
              label="Registration End"
              value={termData.registrationEnd}
              onChange={(value) => setTermData(prev => ({ ...prev, registrationEnd: value }))}
              type="date"
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => handleAddTerm(termData)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Term
            </button>
            <button
              onClick={() => setShowAddTerm(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null
  }

  return (
    <SidebarProvider>
        <AdminSidebar activePage="System Settings" />
            <SidebarInset>
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure academic terms and system-wide settings</p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSaveSettings}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saveStatus === "saving" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : saveStatus === "success" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "terms" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Academic Terms</h2>
                  <button
                    onClick={() => setShowAddTerm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Term
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Term Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {academicTerms.map((term) => (
                        <tr key={term.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {term.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {term.startDate} to {term.endDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {term.registrationStart} to {term.registrationEnd}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(term.status)}`}>
                              {term.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTerm(term.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "general" && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-6">General Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingField
                    label="Institution Name"
                    value={systemSettings.general.institutionName}
                    onChange={(value) => handleSettingChange("general", "institutionName", value)}
                  />
                  <SettingField
                    label="Timezone"
                    value={systemSettings.general.timezone}
                    onChange={(value) => handleSettingChange("general", "timezone", value)}
                    type="select"
                    options={[
                      { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
                      { value: "America/Toronto", label: "Eastern Time (Toronto)" },
                      { value: "America/Chicago", label: "Central Time (Chicago)" },
                      { value: "America/Denver", label: "Mountain Time (Denver)" }
                    ]}
                  />
                  <SettingField
                    label="Academic Year"
                    value={systemSettings.general.academicYear}
                    onChange={(value) => handleSettingChange("general", "academicYear", value)}
                  />
                  <SettingField
                    label="Default Language"
                    value={systemSettings.general.defaultLanguage}
                    onChange={(value) => handleSettingChange("general", "defaultLanguage", value)}
                    type="select"
                    options={[
                      { value: "English", label: "English" },
                      { value: "French", label: "Français" },
                      { value: "Spanish", label: "Español" }
                    ]}
                  />
                </div>
              </div>
            )}

            {activeTab === "deadlines" && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-6">Academic Deadlines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingField
                    label="Grade Submission (Days after term end)"
                    value={systemSettings.deadlines.gradeSubmissionDays}
                    onChange={(value) => handleSettingChange("deadlines", "gradeSubmissionDays", value)}
                    type="number"
                  />
                  <SettingField
                    label="Attendance Submission (Days after class)"
                    value={systemSettings.deadlines.attendanceSubmissionDays}
                    onChange={(value) => handleSettingChange("deadlines", "attendanceSubmissionDays", value)}
                    type="number"
                  />
                  <SettingField
                    label="Course Withdrawal (Weeks into term)"
                    value={systemSettings.deadlines.courseWithdrawalWeeks}
                    onChange={(value) => handleSettingChange("deadlines", "courseWithdrawalWeeks", value)}
                    type="number"
                  />
                  <SettingField
                    label="Incomplete Grade Resolution (Weeks)"
                    value={systemSettings.deadlines.incompleteGradeWeeks}
                    onChange={(value) => handleSettingChange("deadlines", "incompleteGradeWeeks", value)}
                    type="number"
                  />
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                <div className="space-y-6">
                  <SettingField
                    label="Email Notifications"
                    value={systemSettings.notifications.emailNotifications}
                    onChange={(value) => handleSettingChange("notifications", "emailNotifications", value)}
                    type="checkbox"
                  />
                  <SettingField
                    label="SMS Notifications"
                    value={systemSettings.notifications.smsNotifications}
                    onChange={(value) => handleSettingChange("notifications", "smsNotifications", value)}
                    type="checkbox"
                  />
                  <SettingField
                    label="Reminder Days Before Deadline"
                    value={systemSettings.notifications.reminderDaysBefore}
                    onChange={(value) => handleSettingChange("notifications", "reminderDaysBefore", value)}
                    type="number"
                  />
                  <SettingField
                    label="System Maintenance Notices"
                    value={systemSettings.notifications.systemMaintenanceNotice}
                    onChange={(value) => handleSettingChange("notifications", "systemMaintenanceNotice", value)}
                    type="checkbox"
                  />
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingField
                    label="Minimum Password Length"
                    value={systemSettings.security.passwordMinLength}
                    onChange={(value) => handleSettingChange("security", "passwordMinLength", value)}
                    type="number"
                  />
                  <SettingField
                    label="Session Timeout (Minutes)"
                    value={systemSettings.security.sessionTimeoutMinutes}
                    onChange={(value) => handleSettingChange("security", "sessionTimeoutMinutes", value)}
                    type="number"
                  />
                  <SettingField
                    label="Max Login Attempts"
                    value={systemSettings.security.maxLoginAttempts}
                    onChange={(value) => handleSettingChange("security", "maxLoginAttempts", value)}
                    type="number"
                  />
                  <SettingField
                    label="Two-Factor Authentication Required"
                    value={systemSettings.security.twoFactorRequired}
                    onChange={(value) => handleSettingChange("security", "twoFactorRequired", value)}
                    type="checkbox"
                  />
                </div>
              </div>
            )}

            {activeTab === "enrollment" && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-6">Enrollment Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingField
                    label="Maximum Courses Per Student"
                    value={systemSettings.enrollment.maxCoursesPerStudent}
                    onChange={(value) => handleSettingChange("enrollment", "maxCoursesPerStudent", value)}
                    type="number"
                  />
                  <SettingField
                    label="Minimum Courses for Full-Time Status"
                    value={systemSettings.enrollment.minCoursesForFullTime}
                    onChange={(value) => handleSettingChange("enrollment", "minCoursesForFullTime", value)}
                    type="number"
                  />
                  <SettingField
                    label="Enable Waitlist"
                    value={systemSettings.enrollment.waitlistEnabled}
                    onChange={(value) => handleSettingChange("enrollment", "waitlistEnabled", value)}
                    type="checkbox"
                  />
                  <SettingField
                    label="Auto-enroll from Waitlist"
                    value={systemSettings.enrollment.autoEnrollFromWaitlist}
                    onChange={(value) => handleSettingChange("enrollment", "autoEnrollFromWaitlist", value)}
                    type="checkbox"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>    
      <AddTermModal />
    </SidebarInset>
    </SidebarProvider>
  )
}