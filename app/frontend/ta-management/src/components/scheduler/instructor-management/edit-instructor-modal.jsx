"use client";

import { useState, useEffect } from "react";
import { Edit, AlertCircle } from "lucide-react";
import { updateInstructor } from "@/logic/instructorManagement";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EditInstructorModal({ isOpen, onClose, onDataChange, instructor, existingInstructors = [], departments = [] }) {
  const [formData, setFormData] = useState({ name: "", email: "", department: "", employeeNumber: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (instructor && isOpen) {
      setFormData({
        name: instructor.instructorName || "",
        email: instructor.email || "",
        department: instructor.departmentName || "",
        employeeNumber: instructor.employeeNumber || "",
      });
      setErrors({});
      setApiError("");
    }
  }, [instructor, isOpen]);

  const validateField = (name, value) => {
    switch (name) {
      case "name": if (!value.trim()) return "Instructor name is required"; return "";
      case "email": if (!value.trim()) return "Email address is required"; const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(value.trim())) return "Please enter a valid email address"; if (existingInstructors.find((i) => i.instructorId !== instructor?.instructorId && i.email.toLowerCase() === value.trim().toLowerCase())) { return "An instructor with this email already exists"; } return "";
      case "department": if (!value) return "Department is required"; return "";
      default: return "";
    }
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || apiError) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
      setApiError("");
    }
  };

  const handleBlur = (name, value) => {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      department: validateField("department", formData.department),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", department: "", employeeNumber: "" });
    setErrors({});
    setIsSubmitting(false);
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !instructor) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
      };

      await updateInstructor(instructor.instructorId, payload);

      onDataChange();
      onClose();

    } catch (error) {
      console.error("Error updating instructor:", error);
      const errorMsg = error.response?.data?.message || "An unknown error occurred.";
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const hasChanges = instructor && (
    formData.name !== instructor.instructorName ||
    formData.email !== instructor.email ||
    formData.department !== instructor.departmentName
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md"><DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />Edit Instructor
        </DialogTitle><
          DialogDescription>Update the instructor's details.
        </DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} onBlur={(e) => handleBlur("name", e.target.value)} className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />{errors.name}</p>}
          </div><div className="space-y-2"><Label>Employee Number
          </Label><div className="px-3 py-2 border rounded-md bg-muted/50 text-muted-foreground">{formData.employeeNumber}</div><p className="text-xs text-muted-foreground">Employee number cannot be changed.</p></div><div className="space-y-2"><Label htmlFor="edit-email">Email Address *</Label><Input id="edit-email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} onBlur={(e) => handleBlur("email", e.target.value)} className={errors.email ? "border-red-500" : ""} />{errors.email && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}</div><div className="space-y-2"><Label htmlFor="edit-department">Department *</Label><Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}><SelectTrigger className={errors.department ? "border-red-500" : ""}><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((deptName) => <SelectItem key={deptName} value={deptName}>{deptName}</SelectItem>)}</SelectContent></Select>{errors.department && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.department}</p>}</div>{apiError && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{apiError}</AlertDescription></Alert>)}</form><DialogFooter><Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>{isSubmitting ? "Updating..." : "Update Instructor"}</Button></DialogFooter></DialogContent>
    </Dialog>
  );
}