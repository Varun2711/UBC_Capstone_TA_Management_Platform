import { useState, useMemo, useEffect } from "react"
import { Edit, AlertCircle, Check, ChevronsUpDown } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mockProfessors } from "@/data/mock-professors"

const TERMS = ["Winter Term 1", "Winter Term 2"]
const YEARS = ["2024", "2025", "2026"]

export function EditOfferingModal({ isOpen, onClose, onEditOffering, course, offering, existingOfferings = [] }) {
  const [formData, setFormData] = useState({
    instructor: "",
    year: "",
    term: "",
    section: "",
    specialRequirements: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [professorSearchOpen, setProfessorSearchOpen] = useState(false)
  const [professorSearch, setProfessorSearch] = useState("")

  // Populate form when offering changes or modal opens
  useEffect(() => {
    if (offering && isOpen) {
      // Find the professor by name to get the ID
      const professor = mockProfessors.find((prof) => prof.name === offering.instructor)

      setFormData({
        instructor: professor?.id || "",
        year: offering.year || "",
        term: offering.term || "",
        section: offering.section || "",
        specialRequirements: offering.requirements?.specialRequirements?.join(", ") || "",
      })
      setErrors({})
      setProfessorSearch("")
    }
  }, [offering, isOpen])

  // Filter professors based on course department and search query
  const filteredProfessors = useMemo(() => {
    let professors = mockProfessors

    if (course?.department) {
      professors = professors.filter((prof) => prof.department === course.department)
    }

    // Explicitly filter by your component's search state
    if (professorSearch) {
      professors = professors.filter((prof) =>
        `${prof.name} ${prof.email} ${prof.title}`.toLowerCase().includes(professorSearch.toLowerCase()),
      )
    }

    return professors
  }, [course?.department, professorSearch])

  const selectedProfessor = mockProfessors.find((prof) => prof.id === formData.instructor)

  const validateField = (name, value) => {
    switch (name) {
      case "instructor":
        if (!value) return "Instructor is required"
        return ""

      case "year":
        if (!value) return "Year is required"
        return ""

      case "term":
        if (!value) return "Term is required"
        return ""

      case "section":
        if (!value.trim()) return "Section is required"
        if (value.trim().length < 1) return "Section must be at least 1 character"
        if (value.trim().length > 20) return "Section must be less than 20 characters"

        // Check for duplicate section in same term/year (excluding current offering)
        const duplicateOffering = existingOfferings.find(
          (existingOffering) =>
            existingOffering.id !== offering?.id && // Exclude current offering
            existingOffering.year === formData.year &&
            existingOffering.term === formData.term &&
            existingOffering.section.toLowerCase() === value.trim().toLowerCase(),
        )
        if (duplicateOffering) {
          return `Section "${value.trim()}" already exists for ${formData.term} ${formData.year}`
        }
        return ""

      case "specialRequirements":
        // Optional field, but if provided, validate length
        if (value && value.length > 500) return "Special requirements must be less than 500 characters"
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

    // Also validate in real-time to clear the general error alert
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
      newErrors[key] = error // This will be empty string if no error
    })

    setErrors(newErrors)
    return !Object.keys(newErrors).some((key) => newErrors[key]) // Check if any errors have actual messages
  }

  const resetForm = () => {
    setFormData({
      instructor: "",
      year: "",
      term: "",
      section: "",
      specialRequirements: "",
    })
    setErrors({})
    setIsSubmitting(false)
    setProfessorSearch("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create updated offering object
      const updatedOffering = {
        ...offering,
        year: formData.year,
        term: formData.term,
        instructor: selectedProfessor?.name || formData.instructor,
        section: formData.section.trim(),
        requirements: {
          specialRequirements: formData.specialRequirements
            ? formData.specialRequirements
                .split(",")
                .map((req) => req.trim())
                .filter((req) => req)
            : [],
        },
      }

      onEditOffering(course.id, updatedOffering)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error updating offering:", error)
      // In a real app, you'd show an error message to the user
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

  // Check if form has changes
  const hasChanges =
    offering &&
    (formData.year !== offering.year ||
      formData.term !== offering.term ||
      formData.section !== offering.section ||
      selectedProfessor?.name !== offering.instructor ||
      formData.specialRequirements !== (offering.requirements?.specialRequirements?.join(", ") || ""))

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Course Offering
          </DialogTitle>
          <DialogDescription>
            Edit the offering for{" "}
            <strong>
              {course?.code} - {course?.title}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Info Display */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {course?.code} - {course?.title}
                </h4>
                <p className="text-sm text-muted-foreground">{course?.department}</p>
              </div>
              <Badge variant="outline">Editing: {offering?.section}</Badge>
            </div>
          </div>

          {/* Offering Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Offering Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Academic Year *</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange("year", value)}>
                  <SelectTrigger id="edit-year" className={errors.year ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.year}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-term">Term *</Label>
                <Select value={formData.term} onValueChange={(value) => handleInputChange("term", value)}>
                  <SelectTrigger id="edit-term" className={errors.term ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.term && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.term}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructor">Instructor *</Label>
              <Popover open={professorSearchOpen} onOpenChange={setProfessorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    id="edit-instructor"
                    aria-expanded={professorSearchOpen}
                    className={cn("w-full justify-between", errors.instructor ? "border-red-500" : "")}
                  >
                    {selectedProfessor ? (
                      <div className="flex items-center gap-2">
                        <span>{selectedProfessor.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedProfessor.title}
                        </Badge>
                      </div>
                    ) : (
                      "Select instructor..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search professors..."
                      value={professorSearch}
                      onValueChange={setProfessorSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No professors found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProfessors.map((professor) => (
                          <CommandItem
                            key={professor.id}
                            value={`${professor.name} ${professor.email} ${professor.title} ${professor.department}`}
                            onSelect={() => {
                              handleInputChange("instructor", professor.id)
                              setProfessorSearchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.instructor === professor.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{professor.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {professor.title} • {professor.department}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.instructor && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.instructor}
                </div>
              )}
              {course?.department && (
                <p className="text-xs text-muted-foreground">Showing professors from {course.department} department</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-section">Section *</Label>
              <Input
                id="edit-section"
                placeholder="e.g., Section A"
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
                onBlur={(e) => handleBlur("section", e.target.value)}
                className={errors.section ? "border-red-500" : ""}
              />
              {errors.section && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.section}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-specialRequirements">Special Requirements</Label>
              <Textarea
                id="edit-specialRequirements"
                placeholder="e.g., Python experience, Strong communication skills (separate multiple requirements with commas)"
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
                onBlur={(e) => handleBlur("specialRequirements", e.target.value)}
                className={errors.specialRequirements ? "border-red-500" : ""}
                rows={2}
              />
              {errors.specialRequirements && (
                <div className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.specialRequirements}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Optional. Separate multiple requirements with commas.</p>
            </div>
          </div>

          {Object.keys(errors).some((key) => errors[key]) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the errors above before submitting.</AlertDescription>
            </Alert>
          )}

          {/* Warning about existing sessions */}
          {offering && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes to term or year may affect associated lab/tutorial sessions and TA assignments.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? "Updating Offering..." : "Update Offering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
