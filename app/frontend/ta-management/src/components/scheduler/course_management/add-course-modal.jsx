"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AddCourseModal({ isOpen, onClose, onAddCourse, existingCourses = [], departments = [] }) {
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    departmentId: "",
    description: "",
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Function to calculate course level from course code
  const calculateCourseLevel = (courseCode) => {
    if (!courseCode.trim()) return "100"

    // Extract the number part from course code (e.g., "COSC 111" -> "111")
    const match = courseCode.match(/(\d+)/)
    if (match) {
      const number = match[1]
      const firstDigit = number.charAt(0)
      return firstDigit + "00" // Convert 1 to 100, 2 to 200, etc.
    }
    return "100" // Default
  }

  const validateField = (name, value) => {
    switch (name) {
      case "code":
        if (!value.trim()) return "Course code is required"
        if (!/^[A-Z]{2,4}\s?\d{3,4}$/i.test(value.trim())) {
          return "Course code must be in format like 'CS 101' or 'MATH 201'"
        }
        // Check for duplicate course codes
        const normalizedCode = value.trim().toUpperCase().replace(/\s+/g, " ")
        if (existingCourses.some((course) => course.code.toUpperCase().replace(/\s+/g, " ") === normalizedCode)) {
          return "A course with this code already exists"
        }
        return ""

      case "title":
        if (!value.trim()) return "Course title is required"
        if (value.trim().length < 3) return "Course title must be at least 3 characters"
        if (value.trim().length > 100) return "Course title must be less than 100 characters"
        return ""

      case "departmentId":
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
      newErrors[key] = error
    })

    setErrors(newErrors)
    return !Object.keys(newErrors).some((key) => newErrors[key])
  }

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      departmentId: "",
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
      // Calculate course level from course code
      const calculatedLevel = calculateCourseLevel(formData.code)

      await onAddCourse({
        code: formData.code.trim().toUpperCase().replace(/\s+/g, " "),
        title: formData.title.trim(),
        departmentId: parseInt(formData.departmentId),
        description: formData.description.trim(),
        level: calculatedLevel,
      })

      resetForm()
      onClose()
    } catch (error) {
      console.error("Error adding course:", error)
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

  // Get the calculated level for display
  const calculatedLevel = calculateCourseLevel(formData.code)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Course
          </DialogTitle>
          <DialogDescription>
            Create a new course. You can add course offerings later from the course management page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Course Information</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
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
                {formData.code && (
                  <p className="text-sm text-muted-foreground">
                    Course Level: <strong>{calculatedLevel}</strong> (automatically calculated)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select value={formData.departmentId} onValueChange={(value) => handleInputChange("departmentId", value)}>
                <SelectTrigger className={errors.departmentId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.departmentId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
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
              <Label htmlFor="description">Course Description *</Label>
              <Textarea
                id="description"
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
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding Course..." : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
