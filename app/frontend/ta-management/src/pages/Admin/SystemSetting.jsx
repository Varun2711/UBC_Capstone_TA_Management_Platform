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
  Loader2,
  RefreshCw,
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
import systemSettingsService from "../../services/systemSettingsService"

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("terms")
  const [academicTerms, setAcademicTerms] = useState([])
  const [systemSettings, setSystemSettings] = useState({})
  const [editingTerm, setEditingTerm] = useState(null)
  const [showAddTerm, setShowAddTerm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [systemStats, setSystemStats] = useState({})

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [terms, settings, stats] = await Promise.all([
        systemSettingsService.getAcademicTerms(),
        systemSettingsService.getSystemSettings(),
        systemSettingsService.getSystemStatistics()
      ])
      
      setAcademicTerms(terms)
      setSystemSettings(settings)
      setSystemStats(stats)
    } catch (err) {
      setError(err.message || 'Failed to load system data')
      console.error('Failed to load initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await loadInitialData()
    setSaveStatus(null)
    setHasChanges(false)
  }

  const tabs = [
    { id: "terms", label: "Academic Terms", icon: Calendar },
    { id: "general", label: "General Settings", icon: Settings },
    { id: "deadlines", label: "Deadlines", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "enrollment", label: "Enrollment", icon: Users }
  ]

  const handleSettingChange = async (category, setting, value) => {
    try {
      const updatedSettings = {
        ...systemSettings,
        [category]: {
          ...systemSettings[category],
          [setting]: value
        }
      }
      setSystemSettings(updatedSettings)
      setHasChanges(true)
      
      // Auto-save individual setting changes
      await systemSettingsService.updateSystemSetting(category, setting, value)
    } catch (err) {
      setError(err.message || 'Failed to update setting')
      console.error('Failed to update setting:', err)
    }
  }

  const handleSaveSettings = async () => {
    setSaveStatus("saving")
    setError(null)
    try {
      await systemSettingsService.saveSystemSettings(systemSettings)
      setSaveStatus("success")
      setHasChanges(false)
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      setSaveStatus("error")
      setError(err.message || 'Failed to save settings')
      setTimeout(() => setSaveStatus(null), 3000)
      console.error('Failed to save settings:', err)
    }
  }

  const handleAddTerm = async (termData) => {
    setLoading(true)
    setError(null)
    try {
      // Validate term data
      const validation = systemSettingsService.validateTermData(termData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(' '))
      }

      const newTerm = await systemSettingsService.createAcademicTerm({
        ...termData,
        academicYear: systemSettingsService.generateAcademicYear(termData.startDate, termData.endDate),
        termType: 'winter' // Default term type
      })
      
      setAcademicTerms(prev => [...prev, newTerm])
      setShowAddTerm(false)
      setHasChanges(true)
    } catch (err) {
      setError(err.message || 'Failed to create term')
      console.error('Failed to create term:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditTerm = async (termId, termData) => {
    setLoading(true)
    setError(null)
    try {
      // Validate term data
      const validation = systemSettingsService.validateTermData(termData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(' '))
      }

      const updatedTerm = await systemSettingsService.updateAcademicTerm(termId, {
        ...termData,
        academicYear: systemSettingsService.generateAcademicYear(termData.startDate, termData.endDate)
      })
      
      setAcademicTerms(prev => 
        prev.map(term => term.id === termId ? updatedTerm : term)
      )
      setEditingTerm(null)
      setHasChanges(true)
    } catch (err) {
      setError(err.message || 'Failed to update term')
      console.error('Failed to update term:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTerm = async (termId) => {
    if (!window.confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      await systemSettingsService.deleteAcademicTerm(termId)
      setAcademicTerms(prev => prev.filter(term => term.id !== termId))
      setHasChanges(true)
    } catch (err) {
      setError(err.message || 'Failed to delete term')
      console.error('Failed to delete term:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveTerm = async (termId) => {
    if (!window.confirm('Are you sure you want to archive this term?')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await systemSettingsService.archiveAcademicTerm(termId)
      setAcademicTerms(prev => 
        prev.map(term => term.id === termId ? { ...term, status: 'archived', isActive: false } : term)
      )
      setHasChanges(true)
    } catch (err) {
      setError(err.message || 'Failed to archive term')
      console.error('Failed to archive term:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      case 'draft':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Get dynamic status based on current date
  const getDynamicStatus = (term) => {
    if (!term.isActive) return 'draft'
    return systemSettingsService.getTermStatus(term)
  }

  const SettingField = ({ label, value, onChange, type = "text", options = null, disabled = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {type === "select" && options ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            disabled={disabled}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-600">Enable this setting</span>
        </label>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          min={type === "number" ? 0 : undefined}
        />
      )}
    </div>
  )

  const AddTermModal = () => {
    const [termData, setTermData] = useState({
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      termType: "winter"
    })
    const [modalError, setModalError] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)

    const handleSubmit = async () => {
      setModalError(null)
      setModalLoading(true)
      
      try {
        await handleAddTerm(termData)
        setTermData({
          name: "",
          startDate: "",
          endDate: "",
          description: "",
          termType: "winter"
        })
      } catch (err) {
        setModalError(err.message)
      } finally {
        setModalLoading(false)
      }
    }

    return showAddTerm ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Add Academic Term</h3>
          
          {modalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {modalError}
            </div>
          )}
          
          <div className="space-y-4">
            <SettingField
              label="Term Code"
              value={termData.name}
              onChange={(value) => setTermData(prev => ({ ...prev, name: value }))}
              disabled={modalLoading}
            />
            <SettingField
              label="Description"
              value={termData.description}
              onChange={(value) => setTermData(prev => ({ ...prev, description: value }))}
              disabled={modalLoading}
            />
            <SettingField
              label="Term Type"
              value={termData.termType}
              onChange={(value) => setTermData(prev => ({ ...prev, termType: value }))}
              type="select"
              options={systemSettingsService.getTermTypeOptions()}
              disabled={modalLoading}
            />
            <SettingField
              label="Start Date"
              value={termData.startDate}
              onChange={(value) => setTermData(prev => ({ ...prev, startDate: value }))}
              type="date"
              disabled={modalLoading}
            />
            <SettingField
              label="End Date"
              value={termData.endDate}
              onChange={(value) => setTermData(prev => ({ ...prev, endDate: value }))}
              type="date"
              disabled={modalLoading}
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSubmit}
              disabled={modalLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {modalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Add Term'
              )}
            </button>
            <button
              onClick={() => {
                setShowAddTerm(false)
                setModalError(null)
                setTermData({
                  name: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                  termType: "winter"
                })
              }}
              disabled={modalLoading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {systemStats && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{systemStats.activeTermsCount} active terms</span>
                  <span>{systemStats.totalCoursesCount} courses</span>
                  <span>{systemStats.totalOfferingsCount} offerings</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {hasChanges && (
                <button
                  onClick={handleSaveSettings}
                  disabled={saveStatus === "saving" || loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveStatus === "success" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saved
                    </>
                  ) : saveStatus === "error" ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Error
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
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
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
                      {academicTerms.map((term) => {
                        const dynamicStatus = getDynamicStatus(term)
                        return (
                          <tr key={term.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{term.name}</div>
                                {term.description && (
                                  <div className="text-xs text-gray-500">{term.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <div>{term.startDate} to {term.endDate}</div>
                                {term.academicYear && (
                                  <div className="text-xs text-gray-400">Academic Year: {term.academicYear}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <div>{term.registrationStart || term.startDate} to {term.registrationEnd || term.endDate}</div>
                                {term.termType && (
                                  <div className="text-xs text-gray-400">Type: {term.termType}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(dynamicStatus)}`}>
                                {dynamicStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setEditingTerm(term)}
                                  disabled={loading}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Edit term"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleArchiveTerm(term.id)}
                                  disabled={loading || dynamicStatus === 'active'}
                                  className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={dynamicStatus === 'active' ? 'Cannot archive active term' : 'Archive term'}
                                >
                                  <Database className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTerm(term.id)}
                                  disabled={loading || dynamicStatus === 'active'}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={dynamicStatus === 'active' ? 'Cannot delete active term' : 'Delete term'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {academicTerms.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <div className="text-lg font-medium mb-2">No academic terms found</div>
                            <div className="text-sm">Create your first academic term to get started.</div>
                          </td>
                        </tr>
                      )}
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
                    value={systemSettings.general?.institutionName || ''}
                    onChange={(value) => handleSettingChange("general", "institutionName", value)}
                    disabled={loading}
                  />
                  <SettingField
                    label="Timezone"
                    value={systemSettings.general?.timezone || 'America/Vancouver'}
                    onChange={(value) => handleSettingChange("general", "timezone", value)}
                    type="select"
                    options={systemSettingsService.getTimezoneOptions()}
                    disabled={loading}
                  />
                  <SettingField
                    label="Academic Year"
                    value={systemSettings.general?.academicYear || ''}
                    onChange={(value) => handleSettingChange("general", "academicYear", value)}
                    disabled={loading}
                  />
                  <SettingField
                    label="Default Language"
                    value={systemSettings.general?.defaultLanguage || 'English'}
                    onChange={(value) => handleSettingChange("general", "defaultLanguage", value)}
                    type="select"
                    options={systemSettingsService.getLanguageOptions()}
                    disabled={loading}
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
                    value={systemSettings.deadlines?.gradeSubmissionDays || 0}
                    onChange={(value) => handleSettingChange("deadlines", "gradeSubmissionDays", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Attendance Submission (Days after class)"
                    value={systemSettings.deadlines?.attendanceSubmissionDays || 0}
                    onChange={(value) => handleSettingChange("deadlines", "attendanceSubmissionDays", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Course Withdrawal (Weeks into term)"
                    value={systemSettings.deadlines?.courseWithdrawalWeeks || 0}
                    onChange={(value) => handleSettingChange("deadlines", "courseWithdrawalWeeks", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Incomplete Grade Resolution (Weeks)"
                    value={systemSettings.deadlines?.incompleteGradeWeeks || 0}
                    onChange={(value) => handleSettingChange("deadlines", "incompleteGradeWeeks", value)}
                    type="number"
                    disabled={loading}
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
                    value={systemSettings.notifications?.emailNotifications || false}
                    onChange={(value) => handleSettingChange("notifications", "emailNotifications", value)}
                    type="checkbox"
                    disabled={loading}
                  />
                  <SettingField
                    label="SMS Notifications"
                    value={systemSettings.notifications?.smsNotifications || false}
                    onChange={(value) => handleSettingChange("notifications", "smsNotifications", value)}
                    type="checkbox"
                    disabled={loading}
                  />
                  <SettingField
                    label="Reminder Days Before Deadline"
                    value={systemSettings.notifications?.reminderDaysBefore || 0}
                    onChange={(value) => handleSettingChange("notifications", "reminderDaysBefore", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="System Maintenance Notices"
                    value={systemSettings.notifications?.systemMaintenanceNotice || false}
                    onChange={(value) => handleSettingChange("notifications", "systemMaintenanceNotice", value)}
                    type="checkbox"
                    disabled={loading}
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
                    value={systemSettings.security?.passwordMinLength || 0}
                    onChange={(value) => handleSettingChange("security", "passwordMinLength", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Session Timeout (Minutes)"
                    value={systemSettings.security?.sessionTimeoutMinutes || 0}
                    onChange={(value) => handleSettingChange("security", "sessionTimeoutMinutes", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Max Login Attempts"
                    value={systemSettings.security?.maxLoginAttempts || 0}
                    onChange={(value) => handleSettingChange("security", "maxLoginAttempts", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Two-Factor Authentication Required"
                    value={systemSettings.security?.twoFactorRequired || false}
                    onChange={(value) => handleSettingChange("security", "twoFactorRequired", value)}
                    type="checkbox"
                    disabled={loading}
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
                    value={systemSettings.enrollment?.maxCoursesPerStudent || 0}
                    onChange={(value) => handleSettingChange("enrollment", "maxCoursesPerStudent", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Minimum Courses for Full-Time Status"
                    value={systemSettings.enrollment?.minCoursesForFullTime || 0}
                    onChange={(value) => handleSettingChange("enrollment", "minCoursesForFullTime", value)}
                    type="number"
                    disabled={loading}
                  />
                  <SettingField
                    label="Enable Waitlist"
                    value={systemSettings.enrollment?.waitlistEnabled || false}
                    onChange={(value) => handleSettingChange("enrollment", "waitlistEnabled", value)}
                    type="checkbox"
                    disabled={loading}
                  />
                  <SettingField
                    label="Auto-enroll from Waitlist"
                    value={systemSettings.enrollment?.autoEnrollFromWaitlist || false}
                    onChange={(value) => handleSettingChange("enrollment", "autoEnrollFromWaitlist", value)}
                    type="checkbox"
                    disabled={loading}
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