"use client"

import { useState, useMemo } from "react"
import { Plus, AlertCircle, Check, ChevronsUpDown, Calendar } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mockProfessors } from "@/data/mock-professors"

const TERMS = [
  { value: "Winter Term 1", label: "Winter Term 1" },
  { value: "Winter Term 2", label: "Winter Term 2" },
  { value: "Summer Term 1", label: "Summer Term 1" },
  { value: "Summer Term 2", label: "Summer Term 2" },
  { value: "Winter Both Terms", label: "Winter Both Terms" },
  { value: "Summer Both Terms", label: "Summer Both Terms" },
]
const YEARS = ["2024", "2025", "2026"]

export function AddOfferingModal({ isOpen, onClose, onAddOffering, course, existingOfferings = [] }) {
  const [formData, setFormData] = useState({
    instructor: "",
    year: "",
    term: "",
    section: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [professorSearchOpen, setProfessorSearchOpen] = useState(false)
  const [professorSearch, setProfessorSearch] = useState("")

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

        // Check for duplicate section in same term/year
        const duplicateOffering = existingOfferings.find(
          (offering) =>
            offering.year === formData.year &&
            offering.term === formData.term &&
            offering.section.toLowerCase() === value.trim().toLowerCase(),
        )
        if (duplicateOffering) {
          return `Section "${value.trim()}" already exists for ${formData.term} ${formData.year}`
        }
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
      // Handle "Both Terms" options
      const termsToCreate = []
      if (formData.term === "Winter Both Terms") {
        termsToCreate.push("Winter Term 1", "Winter Term 2")
      } else if (formData.term === "Summer Both Terms") {
        termsToCreate.push("Summer Term 1", "Summer Term 2")
      } else {
        termsToCreate.push(formData.term)
      }

      // Create offerings for each term
      termsToCreate.forEach((term, index) => {
        const newOffering = {
          id: `${course.id}-${term.toLowerCase().replace(/\s+/g, "")}-${formData.year}-${formData.section.toLowerCase().replace(/\s+/g, "")}-${Date.now()}-${index}`,
          year: formData.year,
          term: term,
          instructor: selectedProfessor?.name || formData.instructor,
          section: formData.section.trim(),
          requirements: {
            specialRequirements: [], // Empty array since we removed the field
          },
        }

        onAddOffering(course.id, newOffering)
      })

      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding offering:", error)
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

  const generateSectionSuggestion = () => {
    if (!formData.year || !formData.term) return ""

    const existingSections = existingOfferings
      .filter((offering) => offering.year === formData.year && offering.term === formData.term)
      .map((offering) => offering.section)

    // Generate next section letter
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (let i = 0; i < letters.length; i++) {
      const suggestion = `Section ${letters[i]}`
      if (!existingSections.includes(suggestion)) {
        return suggestion
      }
    }
    return `Section ${existingSections.length + 1}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Course Offering
          </DialogTitle>
          <DialogDescription>
            Add a new offering for{" "}
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
              <Badge variant="outline">{existingOfferings.length} existing offerings</Badge>
            </div>
          </div>

          {/* Offering Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Offering Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange("year", value)}>
                  <SelectTrigger id="year" className={errors.year ? "border-red-500" : ""}>
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
                <Label htmlFor="term">Term *</Label>
                <Select value={formData.term} onValueChange={(value) => handleInputChange("term", value)}>
                  <SelectTrigger id="term" className={errors.term ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((term) => (
                      <SelectItem key={term.value} value={term.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{term.label}</span>
                        </div>
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
                {formData.term === "Winter Both Terms" && (
                  <Alert variant="secondary">
                    <AlertDescription>Creating offerings for both Winter Term 1 and Winter Term 2.</AlertDescription>
                  </Alert>
                )}
                {formData.term === "Summer Both Terms" && (
                  <Alert variant="secondary">
                    <AlertDescription>Creating offerings for both Summer Term 1 and Summer Term 2.</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor *</Label>
              <Popover open={professorSearchOpen} onOpenChange={setProfessorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    id="instructor"
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
              <Label htmlFor="section">Section *</Label>
              <div className="flex gap-2">
                <Input
                  id="section"
                  placeholder="e.g., Section A"
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  onBlur={(e) => handleBlur("section", e.target.value)}
                  className={errors.section ? "border-red-500" : ""}
                />
                {formData.year && formData.term && (
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
            {isSubmitting ? "Adding Offering..." : "Add Offering"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
