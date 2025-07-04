
import { useState } from "react"
import { Plus, AlertCircle } from "lucide-react"

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

export function AddInstructorModal({ isOpen, onClose, onAddInstructor, existingInstructors = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    title: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

        // Check for duplicate email
        const duplicateInstructor = existingInstructors.find(
          (instructor) => instructor.email.toLowerCase() === value.trim().toLowerCase(),
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

      // Create new instructor object
      const newInstructor = {
        instructorId: `prof-${Date.now()}`,
        instructorName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
        title: formData.title,
        courseOfferings: [], // Start with no course offerings
      }

      onAddInstructor(newInstructor)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding instructor:", error)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Instructor
          </DialogTitle>
          <DialogDescription>
            Add a new instructor to the system. They can submit course requirements later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Dr. John Smith"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onBlur={(e) => handleBlur("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., john.smith@university.edu"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
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
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.department}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
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
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
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
            {isSubmitting ? "Adding Instructor..." : "Add Instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
