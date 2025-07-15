"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DEPARTMENTS = ["Computer Science", "Mathematics", "Physics", "Engineering", "Chemistry", "Biology"]

export function EditCourseModal({ isOpen, onClose, onEditCourse, course, existingCourses = [] }) {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    department: "",
    description: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when course changes or modal opens
  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        code: course.code || "",
        title: course.title || "",
        department: course.department || "",
        description: course.description || "",
      })
      setErrors({})
    }
  }, [course, isOpen])

  const validateField = (name, value) => {
    switch (name) {
      case "code":
        if (!value.trim()) return "Course code is required"
        if (!/^[A-Z]{2,4}\s?\d{3,4}$/i.test(value.trim())) {
          return "Course code must be in format like 'CS 101' or 'MATH 201'"
        }
        // Check for duplicate course codes (excluding current course)
        const normalizedCode = value.trim().toUpperCase().replace(/\s+/g, " ")
        const duplicateCourse = existingCourses.find(
          (c) => c.id !== course?.id && c.code.toUpperCase().replace(/\s+/g, " ") === normalizedCode,
        )
        if (duplicateCourse) {
          return "A course with this code already exists"
        }
        return ""

      case "title":
        if (!value.trim()) return "Course title is required"
        if (value.trim().length < 3) return "Course title must be at least 3 characters"
        if (value.trim().length > 100) return "Course title must be less than 100 characters"
        return ""

      case "department":
        if (!value) return "Department is required"
        return ""

      case "description":
        if (!value.trim()) return "Course description is required"
        if (value.trim().length < 10) return "Description must be at least 10 characters"
        if (value.trim().length > 500) return "Description must be less than 500 characters"
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
      code: "",
      title: "",
      department: "",
      description: "",
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

      // Create updated course object
      const updatedCourse = {
        ...course,
        code: formData.code.trim().toUpperCase().replace(/\s+/g, " "),
        title: formData.title.trim(),
        department: formData.department,
        description: formData.description.trim(),
      }

      onEditCourse(updatedCourse)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error updating course:", error)
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
    course &&
    (formData.code !== course.code ||
      formData.title !== course.title ||
      formData.department !== course.department ||
      formData.description !== course.description)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Course
          </DialogTitle>
          <DialogDescription>
            Update the course information. Note that changing the course code may affect existing references.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Course Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Course Code *</Label>
                <Input
                  id="edit-code"
                  placeholder="e.g., CS 101"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  onBlur={(e) => handleBlur("code", e.target.value)}
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.code}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger className={errors.department ? "border-red-500" : ""}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Course Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Introduction to Computer Science"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                onBlur={(e) => handleBlur("title", e.target.value)}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Course Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the course content and objectives..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                onBlur={(e) => handleBlur("description", e.target.value)}
                className={errors.description ? "border-red-500" : ""}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {Object.keys(errors).some((key) => errors[key]) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the errors above before submitting.</AlertDescription>
            </Alert>
          )}

          {course && course.offerings && course.offerings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This course has {course.offerings.length} existing offering(s). Changes to the course code may affect
                references in the system.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? "Updating Course..." : "Update Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
