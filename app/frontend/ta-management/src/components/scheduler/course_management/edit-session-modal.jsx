"use client"

import { useState, useEffect } from "react"
import { Edit, AlertCircle, Clock, X, FlaskConical, Users, Plus } from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"

export function EditSessionModal({
  isOpen,
  onClose,
  onEditSession,
  course,
  session,
  terms = [],
}) {
  const [formData, setFormData] = useState({
    section: "",
    term: "",
    sessionType: "",
  })

  const [timeSlots, setTimeSlots] = useState([{
    day: "",
    start_time: "",
    end_time: ""
  }])

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  // Helper function to convert 12-hour time format to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return ""
    
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    
    if (modifier === 'PM' && hours !== '12') {
      hours = parseInt(hours, 10) + 12
    }
    if (modifier === 'AM' && hours === '12') {
      hours = '00'
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`
  }

  // Helper function to parse time range string like "08:00 AM - 09:00 AM"
  const parseTimeRange = (timeString) => {
    if (!timeString || !timeString.includes(' - ')) return null
    
    const [startTime, endTime] = timeString.split(' - ')
    return {
      start_time: convertTo24Hour(startTime.trim()),
      end_time: convertTo24Hour(endTime.trim())
    }
  }

  // Update form data when session prop changes
  useEffect(() => {
    if (session && isOpen) {
      console.log("=== EDIT SESSION MODAL DEBUG ===")
      console.log("Full session object:", session)
      console.log("Available properties:", Object.keys(session))
      console.log("session.time:", session.time)
      console.log("session.day:", session.day)
      console.log("session_type:", session.session_type)
      console.log("sessionType:", session.sessionType)
      console.log("term:", session.term)
      console.log("time_slots property:", session.time_slots)
      
      // Determine session type from multiple possible sources
      let sessionType = ""
      if (session.session_type) {
        sessionType = session.session_type
      } else if (session.sessionType) {
        sessionType = session.sessionType
      } else {
        // Fallback: try to determine from section format
        if (session.section && session.section.startsWith('L')) {
          sessionType = "lab"
        } else if (session.section && session.section.startsWith('T')) {
          sessionType = "tutorial"
        }
      }
      
      console.log("Determined sessionType:", sessionType)
      
      setFormData({
        section: session.section || "",
        term: session.term || "",
        sessionType: sessionType,
      })

      // Handle time slots - NEW LOGIC FOR SHARED SESSIONS
      let slotsData = []
      
      // First, try the new format (time_slots array) - used when creating/editing
      if (session.time_slots && Array.isArray(session.time_slots) && session.time_slots.length > 0) {
        console.log("Processing time_slots from session:", session.time_slots)
        
        slotsData = session.time_slots.map(slot => {
          console.log("Processing slot:", slot)
          
          // Convert time format from backend to frontend format
          const convertTimeFormat = (timeStr) => {
            if (!timeStr) return ""
            // If it's already in HH:MM:SS format, just take HH:MM
            if (timeStr.includes(":")) {
              const parts = timeStr.split(":")
              return `${parts[0]}:${parts[1]}`
            }
            return timeStr
          }
          
          return {
            day: slot.day?.toLowerCase() || "",
            start_time: convertTimeFormat(slot.start_time),
            end_time: convertTimeFormat(slot.end_time)
          }
        })
        
        console.log("Processed slots data from time_slots:", slotsData)
      }
      // Second, try the shared session format (day + time string) - from getAllCoursesFullDetails
      else if (session.day && session.time) {
        console.log("Processing day/time format from shared session:", { day: session.day, time: session.time })
        
        const parsedTime = parseTimeRange(session.time)
        if (parsedTime) {
          slotsData = [{
            day: session.day.toLowerCase(),
            start_time: parsedTime.start_time,
            end_time: parsedTime.end_time
          }]
          console.log("Processed slots data from day/time:", slotsData)
        } else {
          console.log("Failed to parse time range:", session.time)
          slotsData = [{ day: session.day?.toLowerCase() || "", start_time: "", end_time: "" }]
        }
      }
      // Third, try time_increments format as fallback
      else if (session.time_increments && Array.isArray(session.time_increments) && session.time_increments.length > 0) {
        console.log("Processing time_increments from session:", session.time_increments)
        
        // Convert time increments to start/end times
        const sortedTimes = session.time_increments.sort()
        const startTime = sortedTimes[0]
        const endTime = sortedTimes[sortedTimes.length - 1]
        
        // Convert to 24-hour format if needed
        const convertTimeIncrement = (timeStr) => {
          if (!timeStr) return ""
          // If it's just HH:MM format, return as is
          if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
          // If it's just HH:MM without colon, add colon
          if (/^\d{4}$/.test(timeStr)) return `${timeStr.substr(0,2)}:${timeStr.substr(2,2)}`
          return timeStr
        }
        
        slotsData = [{
          day: session.day?.toLowerCase() || "",
          start_time: convertTimeIncrement(startTime),
          end_time: convertTimeIncrement(endTime)
        }]
        
        console.log("Processed slots from time_increments:", slotsData)
      }
      else {
        console.log("No time data found, using default empty slot")
        slotsData = [{ day: "", start_time: "", end_time: "" }]
      }

      setTimeSlots(slotsData)
      setErrors({})
      console.log("=== END DEBUG ===")
    }
  }, [session, isOpen])

  const validateField = (name, value) => {
    switch (name) {
      case "section":
        if (!value.trim()) return "Section is required"
        return ""

      case "term":
        if (!value) return "Term is required"
        return ""

      case "sessionType":
        if (!value) return "Session type is required"
        return ""

      default:
        return ""
    }
  }

  const validateTimeSlots = () => {
    const timeSlotErrors = []
    
    timeSlots.forEach((slot, index) => {
      const slotErrors = {}
      
      if (!slot.day) slotErrors.day = "Day is required"
      if (!slot.start_time) slotErrors.start_time = "Start time is required"
      if (!slot.end_time) slotErrors.end_time = "End time is required"
      
      if (slot.start_time && slot.end_time && slot.start_time >= slot.end_time) {
        slotErrors.end_time = "End time must be after start time"
      }
      
      timeSlotErrors[index] = slotErrors
    })
    
    return timeSlotErrors
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleBlur = (name, value) => {
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots[index][field] = value
    setTimeSlots(newTimeSlots)
    
    // Clear time slot errors when user changes values
    setErrors(prev => ({
      ...prev,
      timeSlots: prev.timeSlots?.map((slotErrors, i) => 
        i === index ? { ...slotErrors, [field]: "" } : slotErrors
      )
    }))
  }

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: "", start_time: "", end_time: "" }])
  }

  const removeTimeSlot = (index) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key])
      newErrors[key] = error
    })

    // Validate time slots
    const timeSlotErrors = validateTimeSlots()
    const hasTimeSlotErrors = timeSlotErrors.some(slotErrors => 
      Object.keys(slotErrors).length > 0
    )

    if (hasTimeSlotErrors) {
      newErrors.timeSlots = timeSlotErrors
    }

    setErrors(newErrors)
    return !Object.keys(newErrors).some((key) => newErrors[key]) && !hasTimeSlotErrors
  }

  const resetForm = () => {
    if (session) {
      // Reset with proper session type detection
      let sessionType = ""
      if (session.session_type) {
        sessionType = session.session_type
      } else if (session.sessionType) {
        sessionType = session.sessionType
      } else if (session.section) {
        sessionType = session.section.startsWith('L') ? "lab" : "tutorial"
      }
      
      setFormData({
        section: session.section || "",
        term: session.term || "",
        sessionType: sessionType,
      })
      
      // Reset time slots based on session data
      if (session.day && session.time) {
        const parsedTime = parseTimeRange(session.time)
        if (parsedTime) {
          setTimeSlots([{
            day: session.day.toLowerCase(),
            start_time: parsedTime.start_time,
            end_time: parsedTime.end_time
          }])
        } else {
          setTimeSlots([{ day: "", start_time: "", end_time: "" }])
        }
      } else if (session.time_slots && session.time_slots.length > 0) {
        const slotsData = session.time_slots.map(slot => ({
          day: slot.day?.toLowerCase() || "",
          start_time: slot.start_time?.substring(0, 5) || "",
          end_time: slot.end_time?.substring(0, 5) || ""
        }))
        setTimeSlots(slotsData)
      } else {
        setTimeSlots([{ day: "", start_time: "", end_time: "" }])
      }
    }
    setErrors({})
    setIsSubmitting(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Find the selected term to get its ID
      const selectedTerm = terms.find(term => term.value === formData.term)
      
      await onEditSession(session.id, {
        sessionType: formData.sessionType,
        courseId: course.id,
        section: formData.section.trim(),
        termId: selectedTerm?.id,
        timeSlots: timeSlots.filter(slot => slot.day && slot.start_time && slot.end_time).map(slot => ({
          day: slot.day,
          start_time: `${slot.start_time}:00`, // Add seconds for backend
          end_time: `${slot.end_time}:00`
        }))
      })

      onClose()
    } catch (error) {
      console.error("Error updating session:", error)
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

  if (!course || !session) return null

  // Get available years from terms
  const availableYears = [...new Set(terms.map(term => term.year))].sort((a, b) => b - a)
  
  // Get available terms for selected year
  const availableTerms = terms

  const sessionTypeIcon = formData.sessionType === "lab" ? <FlaskConical className="h-4 w-4" /> : <Users className="h-4 w-4" />
  const sessionTypeLabel = formData.sessionType === "lab" ? "Laboratory" : "Tutorial"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit {sessionTypeLabel} Session
          </DialogTitle>
          <DialogDescription>
            Edit {sessionTypeLabel.toLowerCase()} session for <strong>{course.code} - {course.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              {sessionTypeIcon}
              Session Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section *</Label>
                <Input
                  id="edit-section"
                  placeholder={formData.sessionType === "lab" ? "e.g., L01" : "e.g., T01"}
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  onBlur={(e) => handleBlur("section", e.target.value)}
                  className={errors.section ? "border-red-500" : ""}
                  maxLength={3}
                />
                {errors.section && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.section}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-term">Term *</Label>
                <Select 
                  value={formData.term} 
                  onValueChange={(value) => handleInputChange("term", value)}
                >
                  <SelectTrigger className={errors.term ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.term && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.term}
                  </p>
                )}
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Session Schedule *
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>

              {timeSlots.map((slot, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Day *</Label>
                        <Select
                          value={slot.day}
                          onValueChange={(value) => handleTimeSlotChange(index, "day", value)}
                        >
                          <SelectTrigger className={errors.timeSlots?.[index]?.day ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.timeSlots?.[index]?.day && (
                          <p className="text-sm text-red-600">{errors.timeSlots[index].day}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Start Time *</Label>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => handleTimeSlotChange(index, "start_time", e.target.value)}
                          className={errors.timeSlots?.[index]?.start_time ? "border-red-500" : ""}
                        />
                        {errors.timeSlots?.[index]?.start_time && (
                          <p className="text-sm text-red-600">{errors.timeSlots[index].start_time}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>End Time *</Label>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => handleTimeSlotChange(index, "end_time", e.target.value)}
                          className={errors.timeSlots?.[index]?.end_time ? "border-red-500" : ""}
                        />
                        {errors.timeSlots?.[index]?.end_time && (
                          <p className="text-sm text-red-600">{errors.timeSlots[index].end_time}</p>
                        )}
                      </div>

                      <div>
                        {timeSlots.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {(Object.keys(errors).some((key) => key !== 'timeSlots' && errors[key]) || errors.timeSlots) && (
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
            {isSubmitting ? "Updating Session..." : "Update Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}