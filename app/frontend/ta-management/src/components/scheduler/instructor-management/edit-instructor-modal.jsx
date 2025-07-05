
import { useState, useEffect } from "react"
import { Edit, AlertCircle } from "lucide-react"

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

const DEPARTMENTS = ["Computer Science", "Mathematics", "Physics", "Engineering", "Chemistry", "Biology"]
const TITLES = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Adjunct Professor"]

export function EditInstructorModal({ isOpen, onClose, onEditInstructor, instructor, existingInstructors = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    title: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when instructor changes or modal opens
  useEffect(() => {
    if (instructor && isOpen) {
      setFormData({
        name: instructor.instructorName || "",
        email: instructor.email || "",
        department: instructor.department || "",
        title: instructor.title || "",
      })
      setErrors({})
    }
  }, [instructor, isOpen])

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Instructor name is required"
        if (value.trim().length < 2) return "Name must be at least 2 characters"
        if (value.trim().length > 100) return "Name must be less than 100 characters"
        return ""

      case "email":
        if (!value.trim()) return "Email address is required"
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.trim())) return "Please enter a valid email address"

        // Check for duplicate email (excluding current instructor)
        const duplicateInstructor = existingInstructors.find(
          (inst) =>
            inst.instructorId !== instructor?.instructorId && inst.email.toLowerCase() === value.trim().toLowerCase(),
        )
        if (duplicateInstructor) {
          return "An instructor with this email already exists"
        }
        return ""

      case "department":
        if (!value) return "Department is required"
        return ""

      case "title":
        if (!value) return "Title is required"
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
      name: "",
      email: "",
      department: "",
      title: "",
    })
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create updated instructor object
      const updatedInstructor = {
        ...instructor,
        instructorName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
        title: formData.title,
      }

      onEditInstructor(updatedInstructor)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error updating instructor:", error)
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
    instructor &&
    (formData.name !== instructor.instructorName ||
      formData.email !== instructor.email ||
      formData.department !== instructor.department ||
      formData.title !== instructor.title)


      
  const hasErrors = Object.values(errors).some(Boolean);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Instructor
          </DialogTitle>
          <DialogDescription>
            Update the instructor's information. Changes will be reflected across all their course offerings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              placeholder="e.g., Dr. John Smith"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onBlur={(e) => handleBlur("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address *</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="e.g., john.smith@university.edu"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-department">Department *</Label>
            <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
              <SelectTrigger aria-label = 'department' className={errors.department ? "border-red-500" : ""}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.department}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Select value={formData.title} onValueChange={(value) => handleInputChange("title", value)}>
              <SelectTrigger aria-label = 'title' className={errors.title ? "border-red-500" : ""}>
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                {TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.title && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </div>
            )}
          </div>

          {Object.keys(errors).some((key) => errors[key]) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the errors above before submitting.</AlertDescription>
            </Alert>
          )}

          {instructor && instructor.courseOfferings && instructor.courseOfferings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This instructor has {instructor.courseOfferings.length} course offering(s). Changes will be reflected
                across all offerings.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !hasChanges || hasErrors}>
            {isSubmitting ? "Updating Instructor..." : "Update Instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
