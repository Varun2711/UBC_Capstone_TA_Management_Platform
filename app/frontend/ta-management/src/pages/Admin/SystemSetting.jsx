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
import { 
  getTerms, 
  createTerm, 
  updateTerm, 
  deleteTerm, 
  getTermById 
} from "../../logic/courseManagement"


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
  }
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("terms")
  const [academicTerms, setAcademicTerms] = useState([])
  const [systemSettings, setSystemSettings] = useState(mockSystemSettings)
  const [editingTerm, setEditingTerm] = useState(null)
  const [showAddTerm, setShowAddTerm] = useState(false)
  const [showEditTerm, setShowEditTerm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load academic terms from API
  const loadAcademicTerms = async () => {
    try {
      setLoading(true)
      setError(null)
      const terms = await getTerms()
      setAcademicTerms(terms)
    } catch (error) {
      console.error('Error loading academic terms:', error)
      setError('Failed to load academic terms')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (activeTab === "terms") {
      loadAcademicTerms()
    }
  }, [activeTab])

  const tabs = [
    { id: "terms", label: "Academic Terms", icon: Calendar },
    { id: "general", label: "General Settings", icon: Settings },
    { id: "deadlines", label: "Deadlines", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield }
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

  const handleAddTerm = async (termData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Create term object matching backend expectations
      const termPayload = {
        code: termData.code,
        description: termData.description || "",
        start: termData.startDate,
        end: termData.endDate,
        startCalendarYear: new Date(termData.startDate).getFullYear(),
        endCalendarYear: new Date(termData.endDate).getFullYear(),
        academicYear: termData.academicYear,
        is_active: termData.is_active || true,
        term_type: termData.term_type || 'winter'
      }
      
      await createTerm(termPayload)
      setShowAddTerm(false)
      await loadAcademicTerms() // Reload terms from server
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error creating term:', error)
      setError('Failed to create term')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTerm = async (termId, termData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Update term object matching backend expectations
      const termPayload = {
        code: termData.code,
        description: termData.description || "",
        start: termData.startDate,
        end: termData.endDate,
        startCalendarYear: new Date(termData.startDate).getFullYear(),
        endCalendarYear: new Date(termData.endDate).getFullYear(),
        academicYear: termData.academicYear,
        is_active: termData.is_active,
        term_type: termData.term_type
      }
      
      await updateTerm(termId, termPayload)
      setShowEditTerm(false)
      setEditingTerm(null)
      await loadAcademicTerms() // Reload terms from server
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error updating term:', error)
      setError('Failed to update term')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTerm = async (termId) => {
    if (!confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      await deleteTerm(termId)
      await loadAcademicTerms() // Reload terms from server
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error deleting term:', error)
      setError('Failed to delete term')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditTerm = async (termId) => {
    try {
      setLoading(true)
      const termData = await getTermById(termId)
      setEditingTerm({
        ...termData,
        startDate: termData.start,
        endDate: termData.end
      })
      setShowEditTerm(true)
    } catch (error) {
      console.error('Error loading term for edit:', error)
      setError('Failed to load term data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (term) => {
    if (!term.is_active) {
      return 'bg-gray-100 text-gray-800'
    }
    
    const today = new Date()
    const startDate = new Date(term.start)
    const endDate = new Date(term.end)
    
    if (today >= startDate && today <= endDate) {
      return 'bg-green-100 text-green-800'
    } else if (today < startDate) {
      return 'bg-blue-100 text-blue-800'
    } else {
      return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (term) => {
    if (!term.is_active) {
      return 'Inactive'
    }
    
    const today = new Date()
    const startDate = new Date(term.start)
    const endDate = new Date(term.end)
    
    if (today >= startDate && today <= endDate) {
      return 'Active'
    } else if (today < startDate) {
      return 'Upcoming'
    } else {
      return 'Completed'
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
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      academicYear: "",
      term_type: "winter",
      is_active: true
    })

    const validateTermData = () => {
      if (!termData.code.trim()) return "Term code is required"
      if (!termData.startDate) return "Start date is required"
      if (!termData.endDate) return "End date is required"
      if (!termData.academicYear.trim()) return "Academic year is required"
      if (new Date(termData.startDate) >= new Date(termData.endDate)) {
        return "End date must be after start date"
      }
      return null
    }

    const handleSubmit = () => {
      const validation = validateTermData()
      if (validation) {
        alert(validation)
        return
      }
      handleAddTerm(termData)
    }

    return showAddTerm ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold mb-4">Add Academic Term</h3>
          <div className="space-y-4">
            <SettingField
              label="Term Code (e.g., W2025 Term 1)"
              value={termData.code}
              onChange={(value) => setTermData(prev => ({ ...prev, code: value }))}
            />
            <SettingField
              label="Description"
              value={termData.description}
              onChange={(value) => setTermData(prev => ({ ...prev, description: value }))}
            />
            <SettingField
              label="Term Type"
              value={termData.term_type}
              onChange={(value) => setTermData(prev => ({ ...prev, term_type: value }))}
              type="select"
              options={[
                { value: "winter", label: "Winter" },
                { value: "summer", label: "Summer" },
                { value: "full_year", label: "Full Year" }
              ]}
            />
            <SettingField
              label="Academic Year (e.g., 2024/25)"
              value={termData.academicYear}
              onChange={(value) => setTermData(prev => ({ ...prev, academicYear: value }))}
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
              label="Active"
              value={termData.is_active}
              onChange={(value) => setTermData(prev => ({ ...prev, is_active: value }))}
              type="checkbox"
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Term'}
            </button>
            <button
              onClick={() => setShowAddTerm(false)}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null
  }

  const EditTermModal = () => {
    const [termData, setTermData] = useState({
      code: "",
      description: "",
      startDate: "",
      endDate: "",
      academicYear: "",
      term_type: "winter",
      is_active: true
    })

    const validateTermData = () => {
      if (!termData.code.trim()) return "Term code is required"
      if (!termData.startDate) return "Start date is required"
      if (!termData.endDate) return "End date is required"
      if (!termData.academicYear.trim()) return "Academic year is required"
      if (new Date(termData.startDate) >= new Date(termData.endDate)) {
        return "End date must be after start date"
      }
      return null
    }

    const handleSubmit = () => {
      const validation = validateTermData()
      if (validation) {
        alert(validation)
        return
      }
      handleEditTerm(editingTerm.id, termData)
    }

    useEffect(() => {
      if (editingTerm) {
        setTermData({
          code: editingTerm.code || "",
          description: editingTerm.description || "",
          startDate: editingTerm.startDate || "",
          endDate: editingTerm.endDate || "",
          academicYear: editingTerm.academicYear || "",
          term_type: editingTerm.term_type || "winter",
          is_active: editingTerm.is_active !== undefined ? editingTerm.is_active : true
        })
      }
    }, [editingTerm])

    return showEditTerm ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold mb-4">Edit Academic Term</h3>
          <div className="space-y-4">
            <SettingField
              label="Term Code (e.g., W2025 Term 1)"
              value={termData.code}
              onChange={(value) => setTermData(prev => ({ ...prev, code: value }))}
            />
            <SettingField
              label="Description"
              value={termData.description}
              onChange={(value) => setTermData(prev => ({ ...prev, description: value }))}
            />
            <SettingField
              label="Term Type"
              value={termData.term_type}
              onChange={(value) => setTermData(prev => ({ ...prev, term_type: value }))}
              type="select"
              options={[
                { value: "winter", label: "Winter" },
                { value: "summer", label: "Summer" },
                { value: "full_year", label: "Full Year" }
              ]}
            />
            <SettingField
              label="Academic Year (e.g., 2024/25)"
              value={termData.academicYear}
              onChange={(value) => setTermData(prev => ({ ...prev, academicYear: value }))}
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
              label="Active"
              value={termData.is_active}
              onChange={(value) => setTermData(prev => ({ ...prev, is_active: value }))}
              type="checkbox"
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Term'}
            </button>
            <button
              onClick={() => {
                setShowEditTerm(false)
                setEditingTerm(null)
              }}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
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

          {/* Global Success/Error Messages */}
          {saveStatus === "success" && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              Operation completed successfully!
            </div>
          )}

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

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="bg-white rounded-lg shadow border overflow-hidden">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      Loading academic terms...
                    </div>
                  ) : academicTerms.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No academic terms found. Add your first term to get started.
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Term Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Term Dates
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Academic Year
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
                              {term.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {term.description || 'No description'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {term.start} to {term.end}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {term.academicYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(term)}`}>
                                {getStatusText(term)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleStartEditTerm(term.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  disabled={loading}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTerm(term.id)}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={loading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
          </div>
        </div>
      </div>    
      <AddTermModal />
      <EditTermModal />
    </SidebarInset>
    </SidebarProvider>
  )
}