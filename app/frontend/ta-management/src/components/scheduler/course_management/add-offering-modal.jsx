"use client"

import { useState } from "react"
import { Plus, AlertCircle, Search, Clock, X } from "lucide-react"

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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function AddOfferingModal({ 
  isOpen, 
  onClose, 
  onAddOffering, 
  course, 
  existingOfferings = [], 
  terms = [], 
  instructors = [] 
}) {
  const [formData, setFormData] = useState({
    section: "",
    year: "",
    term: "",
    instructor: "",
  })

  const [timeSlots, setTimeSlots] = useState([{
    day: "",
    start_time: "",
    end_time: ""
  }])
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [instructorSearchOpen, setInstructorSearchOpen] = useState(false)

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  const validateField = (name, value) => {
    switch (name) {
      case "section":
        if (!value.trim()) return "Section number is required"
        if (!/^\d{3}$/.test(value.trim())) return "Section must be 3 digits (e.g., 001, 002)"
        
        // Check for duplicate section in the same term and year
        if (formData.term && formData.year && existingOfferings.some((offering) =>
          offering.section === value.trim() && 
          offering.term === formData.term && 
          offering.year.toString() === formData.year
        )) {
          return "A section with this number already exists for the selected term and year"
        }
        return ""

      case "year":
        if (!value) return "Academic year is required"
        return ""

      case "term":
        if (!value) return "Term is required"
        return ""

      case "instructor":
        if (!value) return "Instructor is required"
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

    // Also validate section when term/year changes (for duplicate check)
    if ((name === "term" || name === "year") && formData.section) {
      const sectionError = validateField("section", formData.section)
      setErrors((prev) => ({ ...prev, section: sectionError }))
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

    // Validate all required fields
    const requiredFields = ["section", "year", "term", "instructor"];
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field])
      newErrors[field] = error
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
    setFormData({
      section: "",
      year: "",
      term: "",
      instructor: "",
    })
    setTimeSlots([{
      day: "",
      start_time: "",
      end_time: ""
    }])
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
      
      await onAddOffering(course.id, {
        courseId: course.id,
        section: formData.section.trim(),
        termId: selectedTerm?.id,
        instructorId: parseInt(formData.instructor),
        time_slots: timeSlots.filter(slot => slot.day && slot.start_time && slot.end_time)
      })

      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding offering:", error)
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

  // Filter instructors by course department if available
  const availableInstructors = instructors.filter(instructor => 
    instructor.departmentId === course.departmentId || 
    instructor.department === course.department
  )

  // Get available years from terms
  const availableYears = [...new Set(terms.map(term => term.year))].sort((a, b) => b - a)
  
  // Get available terms for selected year
  const availableTerms = formData.year 
    ? terms.filter(term => term.year.toString() === formData.year)
    : []

  // Get selected instructor for display
  const selectedInstructor = availableInstructors.find(inst => inst.id.toString() === formData.instructor)

  // Add this function to format term display
  const formatTermDisplay = (termCode) => {
    // Parse term codes like "W2024 Term 2" or "W2025 Term 1"
    const match = termCode.match(/^([A-Z])(\d{4})\s+(.+)$/);
    
    if (match) {
      const [, seasonCode, year, termPart] = match;
      
      // Map season codes to full names
      const seasonMap = {
        'W': 'Winter',
        'S': 'Summer', 
        'F': 'Fall',
        'Sp': 'Spring'
      };
      
      const seasonName = seasonMap[seasonCode] || seasonCode;
      
      // Handle different term formats
      if (termPart.includes('Both')) {
        return `${seasonName} Both Terms, ${year}`;
      } else if (termPart.includes('Term')) {
        return `${seasonName} ${termPart}, ${year}`;
      } else {
        return `${seasonName} ${termPart}, ${year}`;
      }
    }
    
    // Fallback for unexpected formats
    return termCode;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Course Offering
          </DialogTitle>
          <DialogDescription>
            Add a new offering for <strong>{course.code} - {course.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Offering Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section Number *</Label>
                <Input
                  id="section"
                  placeholder="e.g., 001"
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
                {formData.section && (
                  <p className="text-sm text-muted-foreground">
                    Will display as: <strong>{course.code}-{formData.section}</strong>
                  </p>
                )}
              </div>

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

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Popover open={instructorSearchOpen} onOpenChange={setInstructorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={instructorSearchOpen}
                    className={cn(
                      "w-full justify-between",
                      errors.instructor ? "border-red-500" : ""
                    )}
                  >
                    {selectedInstructor ? (
                      <span>{selectedInstructor.name} - {selectedInstructor.department}</span>
                    ) : (
                      <span className="text-muted-foreground">Search and select instructor...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search instructors..." className="h-9" />
                    <CommandEmpty>No instructor found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {availableInstructors.map((instructor) => (
                          <CommandItem
                            key={instructor.id}
                            value={`${instructor.name} ${instructor.email} ${instructor.department}`}
                            onSelect={() => {
                              handleInputChange("instructor", instructor.id.toString())
                              setInstructorSearchOpen(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{instructor.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {instructor.email} • {instructor.department}
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                formData.instructor === instructor.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.instructor && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.instructor}
                </p>
              )}
              {availableInstructors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No instructors available for the {course.department} department.
                </p>
              )}
            </div>

            {/* Time Slots Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Class Schedule *
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

            {/* Show existing offerings for reference */}
            {existingOfferings.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Existing Offerings:</p>
                <div className="space-y-1">
                  {existingOfferings.map((offering) => (
                    <p key={offering.id} className="text-sm text-gray-600">
                      <strong>Section {offering.section}</strong> - {formatTermDisplay(offering.term)} ({offering.instructorName || 'Unassigned'})
                    </p>
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
            {isSubmitting ? "Adding Offering..." : "Add Offering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
