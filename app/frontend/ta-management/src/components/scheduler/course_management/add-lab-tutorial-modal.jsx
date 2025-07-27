"use client"

import { useState } from "react"
import { Plus, AlertCircle, FlaskConical, Users, Clock, Trash2 } from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

export function AddLabTutorialModal({
  isOpen,
  onClose,
  onAddSession,
  course,
  offering,
  existingSessions = { labs: [], tutorials: [], seminars: [], workshops: [] },
  terms = [],
}) {
  const [selectedTab, setSelectedTab] = useState("lab")
  const [formData, setFormData] = useState({
    section: "",
    term: "",
    year: "",
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
    { value: "sunday", label: "Sunday" }
  ]

  const formatTermDisplay = (termCode) => {
    const match = termCode.match(/^([A-Z])(\d{4})\s+(.+)$/);
    
    if (match) {
      const [, seasonCode, year, termPart] = match;
      
      const seasonMap = {
        'W': 'Winter',
        'S': 'Summer', 
        'F': 'Fall',
        'Sp': 'Spring'
      };
      
      const seasonName = seasonMap[seasonCode] || seasonCode;
      
      if (termPart.includes('Both')) {
        return `${seasonName} Both Terms, ${year}`;
      } else if (termPart.includes('Term')) {
        return `${seasonName} ${termPart}, ${year}`;
      } else {
        return `${seasonName} ${termPart}, ${year}`;
      }
    }
    
    return termCode;
  };

  const validateField = (name, value) => {
    switch (name) {
      case "section":
        if (!value.trim()) return "Section is required"

        const sectionPattern = selectedTab === "lab" ? /^L\d{2}$/ : /^T\d{2}$/
        const sectionFormat = selectedTab === "lab" ? "L01, L02, etc." : "T01, T02, etc."

        if (!sectionPattern.test(value.trim())) {
          return `Section must be in format: ${sectionFormat}`
        }

        // Check for duplicate sections
        const sessionType = selectedTab === "lab" ? "labs" : "tutorials"
        const termKey = formData.term && formData.year ? `${formData.term}` : ""

        if (termKey && existingSessions[sessionType]) {
          const existingInTerm = existingSessions[sessionType].filter(
            (session) => session.term === formData.term && session.year === formData.year,
          )

          if (existingInTerm.some((session) => session.section === value.trim())) {
            return `A ${selectedTab} section with this number already exists for the selected term`
          }
        }

        return ""

      case "term":
        if (!value) return "Term is required"
        return ""

      case "year":
        if (!value) return "Year is required"
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

    // Re-validate section when term/year changes (for duplicate check)
    if ((name === "term" || name === "year") && formData.section) {
      const sectionError = validateField("section", formData.section)
      setErrors((prev) => ({ ...prev, section: sectionError }))
    }
  }

  const handleBlur = (name, value) => {
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleTabChange = (tab) => {
    setSelectedTab(tab)
    // Reset section when switching tabs
    setFormData((prev) => ({ ...prev, section: "" }))
    setErrors((prev) => ({ ...prev, section: "" }))
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

    // Validate basic form fields
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
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
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      section: "",
      term: "",
      year: "",
    })
    setTimeSlots([{ day: "", start_time: "", end_time: "" }])
    setErrors({})
    setIsSubmitting(false)
    setSelectedTab("lab")
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
      
      await onAddSession(course.id, formData.term, formData.year, selectedTab, {
        section: formData.section.trim().toUpperCase(),
        termId: selectedTerm?.id,
        timeSlots: timeSlots.filter(slot => slot.day && slot.start_time && slot.end_time)
      })

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

  if (!course) return null

  // Get unique years from terms
  const availableYears = [...new Set(terms.map((term) => term.year))].sort()

  // Filter terms by selected year
  const availableTerms = formData.year ? terms.filter((term) => term.year.toString() === formData.year) : []

  const getExistingSessions = (sessionType, termValue, yearValue) => {
    if (!termValue || !yearValue || !existingSessions) return []

    const sessionKey = sessionType === "lab" ? "labs" : "tutorials"
    let allSessions = []

    // Find the term key that matches the selected term
    const selectedTermFromDropdown = terms.find(t => t.value === termValue && t.year.toString() === yearValue)
    
    if (selectedTermFromDropdown) {
      // Look for sessions under the exact term label
      if (existingSessions[selectedTermFromDropdown.label]) {
        allSessions = existingSessions[selectedTermFromDropdown.label][sessionKey] || []
      }
    }

    return allSessions
  }

  const existingSessionsForTerm = getExistingSessions(selectedTab, formData.term, formData.year)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Lab/Tutorial Session
          </DialogTitle>
          <DialogDescription>
            Add a new lab or tutorial session for <strong>{course.code} - {course.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lab" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Lab
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tutorial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Create a new lab session. Lab sections typically use format L01, L02, etc.
            </div>
          </TabsContent>

          <TabsContent value="tutorial" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Create a new tutorial session. Tutorial sections typically use format T01, T02, etc.
            </div>
          </TabsContent>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) => handleInputChange("year", value)}
                >
                  <SelectTrigger className={errors.year ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.year}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term *</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value) => handleInputChange("term", value)}
                  disabled={!formData.year}
                >
                  <SelectTrigger className={errors.term ? "border-red-500" : ""}>
                    <SelectValue placeholder={formData.year ? "Select term" : "Select year first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        {formatTermDisplay(term.label)}
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

            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                placeholder={selectedTab === "lab" ? "e.g., L01" : "e.g., T01"}
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value.toUpperCase())}
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

            {/* Time Slots Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Slots *
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
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Show existing sessions for reference */}
            {existingSessionsForTerm.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Existing {selectedTab} sessions for {formatTermDisplay(formData.term)} {formData.year}:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {existingSessionsForTerm.map((session) => (
                    <div
                      key={session.id}
                      className="text-sm text-gray-600 bg-white px-2 py-1 rounded border"
                    >
                      {session.section}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            {isSubmitting ? `Adding ${selectedTab}...` : `Add ${selectedTab}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
