"use client"

import { useState } from "react"
import { Plus, AlertCircle, Clock, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const SESSION_TYPES = [
  { value: "lab", label: "Laboratory Session", icon: "🧪" },
  { value: "tutorial", label: "Tutorial Session", icon: "📚" },
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString())
const MINUTES = ["00", "15", "30", "45"]
const PERIODS = ["AM", "PM"]
const DURATIONS = [
  { value: "1", label: "1 hour" },
  { value: "1.5", label: "1.5 hours" },
  { value: "2", label: "2 hours" },
  { value: "2.5", label: "2.5 hours" },
  { value: "3", label: "3 hours" },
  { value: "3.5", label: "3.5 hours" },
  { value: "4", label: "4 hours" },
]

export function AddLabTutorialModal({ isOpen, onClose, onAddSession, course, offering, existingSessions = [] }) {
  const [formData, setFormData] = useState({
    sessionType: "",
    section: "",
    day: "",
    startHour: "",
    startMinute: "",
    startPeriod: "",
    duration: "",
    location: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name, value) => {
    switch (name) {
      case "sessionType":
        if (!value) return "Session type is required"
        return ""

      case "section":
        if (!value.trim()) return "Section name is required"
        if (value.trim().length < 1) return "Section name must be at least 1 character"
        if (value.trim().length > 30) return "Section name must be less than 30 characters"

        // Check for duplicate section names within the same session type
        const sessionsKey = formData.sessionType === 'lab' ? 'labs' : 'tutorials';
        const sessionsOfType = existingSessions[sessionsKey] || [];
        const duplicateSession = sessionsOfType.find(
          (session) => session.section.toLowerCase() === value.trim().toLowerCase(),
        )
        if (duplicateSession) {
          return `${formData.sessionType === "lab" ? "Lab" : "Tutorial"} section "${value.trim()}" already exists`
        }
        return ""

      case "day":
        if (!value) return "Day is required"
        return ""

      case "startHour":
        if (!value) return "Start hour is required"
        return ""

      case "startMinute":
        if (!value) return "Start minute is required"
        return ""

      case "startPeriod":
        if (!value) return "AM/PM is required"
        return ""

      case "duration":
        if (!value) return "Duration is required"
        return ""

      case "location":
        if (!value.trim()) return "Location is required"
        if (value.trim().length < 2) return "Location must be at least 2 characters"
        if (value.trim().length > 50) return "Location must be less than 50 characters"
        return ""

      default:
        return ""
    }
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    const error = validateField(name, value)
    if (!error) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleBlur = (name, value) => {
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const validateForm = () => {
    const newErrors = {}

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key])
      newErrors[key] = error
    })

    setErrors(newErrors)
    return !Object.keys(newErrors).some((key) => newErrors[key])
  }

  const resetForm = () => {
    setFormData({
      sessionType: "",
      section: "",
      day: "",
      startHour: "",
      startMinute: "",
      startPeriod: "",
      duration: "",
      location: "",
    })
    setErrors({})
    setIsSubmitting(false)
  }

  // =================================================================
  // CORRECTED FUNCTION
  // =================================================================
  const generateSectionSuggestion = () => {
    if (!formData.sessionType) return ""

    // Determine the correct plural key for the existingSessions object
    const sessionsKey = formData.sessionType === 'lab' ? 'labs' : 'tutorials';
    
    // Use the correct key to get the right array of sessions
    const sessionsOfType = existingSessions[sessionsKey] || [];
    const existingSectionNames = sessionsOfType.map((session) => session.section)

    const prefix = formData.sessionType === "lab" ? "Lab" : "Tutorial"

    for (let i = 1; i <= 99; i++) {
      const suggestion = `${prefix} ${i.toString().padStart(2, "0")}`
      if (!existingSectionNames.includes(suggestion)) {
        return suggestion
      }
    }
    return `${prefix} ${existingSectionNames.length + 1}`
  }

  const formatTimeRange = (hour, minute, period, duration) => {
    const startTime = `${hour}:${minute} ${period}`

    let endHour = Number.parseInt(hour)
    let endMinute = Number.parseInt(minute)
    let endPeriod = period

    if (period === "PM" && endHour !== 12) endHour += 12
    if (period === "AM" && endHour === 12) endHour = 0

    const durationHours = Math.floor(Number.parseFloat(duration))
    const durationMinutes = (Number.parseFloat(duration) % 1) * 60

    endMinute += durationMinutes
    if (endMinute >= 60) {
      endHour += 1
      endMinute -= 60
    }
    endHour += durationHours

    if (endHour >= 24) endHour -= 24
    if (endHour === 0) {
      endHour = 12
      endPeriod = "AM"
    } else if (endHour > 12) {
      endHour -= 12
      endPeriod = "PM"
    } else if (endHour === 12) {
      endPeriod = "PM"
    } else {
      endPeriod = "AM"
    }

    const endTime = `${endHour}:${endMinute.toString().padStart(2, "0")} ${endPeriod}`
    return `${startTime} - ${endTime}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const timeString = formatTimeRange(
        formData.startHour,
        formData.startMinute,
        formData.startPeriod,
        formData.duration,
      )

      const newSession = {
        id: `${course.id}-${offering.id}-${formData.sessionType}-${formData.section.toLowerCase().replace(/\s+/g, "")}-${Date.now()}`,
        section: formData.section.trim(),
        day: formData.day,
        time: timeString,
        location: formData.location.trim(),
        taAssigned: null,
        forOfferings: [offering.id],
      }

      onAddSession(course.id, offering.term, offering.year, formData.sessionType, newSession)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding session:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  const selectedSessionType = SESSION_TYPES.find((type) => type.value === formData.sessionType)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Lab/Tutorial Session
          </DialogTitle>
          <DialogDescription>
            Add a new lab or tutorial session for{" "}
            <strong>
              {course?.code} - {offering?.section}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course and Offering Info Display */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {course?.code} - {course?.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {offering?.section} • {offering?.term} {offering?.year} • {offering?.instructor}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {(existingSessions.labs?.length || 0) + (existingSessions.tutorials?.length || 0)} existing sessions
                </Badge>
              </div>
            </div>
          </div>

          {/* Session Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Details</h3>

            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type *</Label>
              <Select value={formData.sessionType} onValueChange={(value) => handleInputChange("sessionType", value)}>
                <SelectTrigger id="sessionType" className={errors.sessionType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sessionType && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.sessionType}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section Name *</Label>
              <div className="flex gap-2">
                <Input
                  id="section"
                  placeholder={
                    formData.sessionType === "lab"
                      ? "e.g., Lab 01"
                      : formData.sessionType === "tutorial"
                        ? "e.g., Tutorial 01"
                        : "e.g., Lab 01 or Tutorial 01"
                  }
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  onBlur={(e) => handleBlur("section", e.target.value)}
                  className={errors.section ? "border-red-500" : ""}
                />
                {formData.sessionType && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange("section", generateSectionSuggestion())}
                  >
                    Suggest
                  </Button>
                )}
              </div>
              {errors.section && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.section}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">Schedule</h4>

              <div className="space-y-2">
                <Label htmlFor="day">Day *</Label>
                <Select value={formData.day} onValueChange={(value) => handleInputChange("day", value)}>
                  <SelectTrigger id="day" aria-label= 'Day' className={errors.day ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{day}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.day && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.day}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Select value={formData.startHour} onValueChange={(value) => handleInputChange("startHour", value)}>
                    <SelectTrigger aria-label="Hour" className={errors.startHour ? "border-red-500" : ""}>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.startMinute}
                    onValueChange={(value) => handleInputChange("startMinute", value)}
                  >
                    <SelectTrigger aria-label="Minute" className={errors.startMinute ? "border-red-500" : ""}>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.startPeriod}
                    onValueChange={(value) => handleInputChange("startPeriod", value)}
                  >
                    <SelectTrigger aria-label="AM/PM" className={errors.startPeriod ? "border-red-500" : ""}>
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                    <SelectTrigger aria-label="Duration" className={errors.duration ? "border-red-500" : ""}>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(errors.startHour || errors.startMinute || errors.startPeriod || errors.duration) && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.startHour || errors.startMinute || errors.startPeriod || errors.duration}
                  </div>
                )}

                {formData.startHour && formData.startMinute && formData.startPeriod && formData.duration && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatTimeRange(
                        formData.startHour,
                        formData.startMinute,
                        formData.startPeriod,
                        formData.duration,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder={
                  formData.sessionType === "lab"
                    ? "e.g., CS Lab 101, Physics Lab A"
                    : formData.sessionType === "tutorial"
                      ? "e.g., Room 205, Tutorial Room B"
                      : "e.g., CS Lab 101, Room 205"
                }
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                onBlur={(e) => handleBlur("location", e.target.value)}
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.location}
                </div>
              )}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No TA will be assigned to this session initially. You can assign TAs later from the TA Allocation section.
            </AlertDescription>
          </Alert>

          {Object.keys(errors).some((key) => errors[key]) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the errors above before submitting.</AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? `Adding ${selectedSessionType?.label || "Session"}...`
              : `Add ${selectedSessionType?.label || "Session"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
