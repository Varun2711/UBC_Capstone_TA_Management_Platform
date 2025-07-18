"use client"

import { useState, useEffect } from "react"
import { Edit, AlertCircle, Search } from "lucide-react"

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

export function EditOfferingModal({
  isOpen,
  onClose,
  onEditOffering,
  course,
  offering,
  existingOfferings = [],
  terms = [],
  instructors = [],
}) {
  const [formData, setFormData] = useState({
    section: "",
    year: "",
    term: "",
    instructor: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [instructorSearchOpen, setInstructorSearchOpen] = useState(false)

  // Update form data when offering prop changes
  useEffect(() => {
    if (offering && isOpen) {
      setFormData({
        section: offering.section || "",
        year: offering.year?.toString() || "",
        term: offering.term || "",
        instructor: offering.instructor?.toString() || "",
      })
      setErrors({})
    }
  }, [offering, isOpen])

  const validateField = (name, value) => {
    switch (name) {
      case "section":
        if (!value.trim()) return "Section number is required"
        if (!/^\d{3}$/.test(value.trim())) return "Section must be 3 digits (e.g., 001, 002)"

        // Check for duplicate section in the same term and year (excluding current offering)
        if (formData.term && formData.year && existingOfferings.some((off) =>
          off.id !== offering?.id &&
          off.section === value.trim() &&
          off.term === formData.term &&
          off.year.toString() === formData.year
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
    if (offering) {
      setFormData({
        section: offering.section || "",
        year: offering.year?.toString() || "",
        term: offering.term || "",
        instructor: offering.instructor?.toString() || "",
      })
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
      
      await onEditOffering(course.id, {
        id: offering.id,
        courseId: course.id,
        section: formData.section.trim(),
        termId: selectedTerm?.id,  // Use the term ID from the mapped terms
        instructorId: parseInt(formData.instructor),
      })

      onClose()
    } catch (error) {
      console.error("Error updating offering:", error)
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

  if (!course || !offering) return null

  // Filter instructors by course department if available
  const availableInstructors = instructors.filter(
    (instructor) => instructor.departmentId === course.departmentId || instructor.department === course.department,
  )

  // Get available years from terms
  const availableYears = [...new Set(terms.map(term => term.year))].sort((a, b) => b - a)
  
  // Get available terms for selected year
  const availableTerms = formData.year 
    ? terms.filter(term => term.year.toString() === formData.year)
    : []

  // Get selected instructor for display
  const selectedInstructor = availableInstructors.find(inst => inst.id.toString() === formData.instructor)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Course Offering
          </DialogTitle>
          <DialogDescription>
            Edit offering for <strong>{course.code} - {course.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Offering Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section Number *</Label>
                <Input
                  id="edit-section"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-year">Academic Year *</Label>
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
              <Label htmlFor="edit-term">Term *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="edit-instructor">Instructor *</Label>
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
            </div>

            {/* Show other offerings for reference */}
            {existingOfferings.filter((off) => off.id !== offering.id).length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Other Offerings:</p>
                <div className="space-y-1">
                  {existingOfferings
                    .filter((off) => off.id !== offering.id)
                    .map((off) => (
                      <p key={off.id} className="text-sm text-gray-600">
                        <strong>{off.displaySection || `${course.code}-${off.section}`}</strong> - {off.term} {off.year}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>

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
            {isSubmitting ? "Updating Offering..." : "Update Offering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
