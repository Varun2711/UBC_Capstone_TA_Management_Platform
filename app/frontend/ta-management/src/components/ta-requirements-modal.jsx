"use client"

import { useState, useEffect } from "react"
import { FileText, Plus, X, AlertCircle } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TARequirementsModal({ isOpen, onClose, onSubmit, course, isEditing = false }) {
  const [requirements, setRequirements] = useState([])
  const [newRequirement, setNewRequirement] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate requirements when editing
  useEffect(() => {
    if (isOpen && course) {
      if (isEditing && course.requirements?.generalRequirements) {
        setRequirements([...course.requirements.generalRequirements])
      } else {
        setRequirements([])
      }
      setNewRequirement("")
    }
  }, [isOpen, course, isEditing])

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements((prev) => [...prev, newRequirement.trim()])
      setNewRequirement("")
    }
  }

  const handleRemoveRequirement = (index) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && newRequirement.trim()) {
      e.preventDefault()
      handleAddRequirement()
    }
  }

  const handleSubmit = async () => {
    if (requirements.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSubmit(course.id, requirements)
      handleClose()
    } catch (error) {
      console.error("Error submitting requirements:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRequirements([])
    setNewRequirement("")
    setIsSubmitting(false)
    onClose()
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? "Edit TA Requirements" : "Submit TA Requirements"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the TA requirements for" : "Define the TA requirements for"}{" "}
            <strong>
              {course.courseCode} - {course.section}
            </strong>{" "}
            ({course.term} {course.year})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {course.courseCode} - {course.courseTitle}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {course.section} • {course.term} {course.year}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="requirement-input" className="text-base font-medium">
                TA Requirements
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Specify the qualifications, skills, and responsibilities you expect from TAs for this course.
              </p>
            </div>

            {/* Add New Requirement */}
            <div className="space-y-2">
              <Label htmlFor="requirement-input">Add Requirement</Label>
              <div className="flex gap-2">
                <Input
                  id="requirement-input"
                  placeholder="e.g., Strong Python programming skills, Experience with data structures..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddRequirement}
                  disabled={!newRequirement.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Current Requirements List */}
            {requirements.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Requirements ({requirements.length})</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {requirements.map((requirement, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-start space-x-2 flex-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm">{requirement}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRequirement(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Message */}
            {requirements.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please add at least one TA requirement before submitting.</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Example Requirements */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Example Requirements:</Label>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Strong programming skills in [language]</p>
              <p>• Experience with [specific tools/technologies]</p>
              <p>• Good communication and teaching abilities</p>
              <p>• Available for evening lab sessions</p>
              <p>• Previous TA or tutoring experience preferred</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={requirements.length === 0 || isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Submitting..."
              : isEditing
                ? "Update Requirements"
                : "Submit Requirements"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
