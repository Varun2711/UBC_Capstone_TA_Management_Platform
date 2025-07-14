"use client";

import { useState } from "react";
import { Plus, AlertCircle, Eye, EyeOff, Copy, Check } from "lucide-react";
import { addInstructor } from "@/logic/instructorManagement";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AddInstructorModal({ isOpen, onClose, onAddInstructor, existingInstructors = [], departments = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    employeeNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Instructor name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email address is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return "Please enter a valid email address";
        if (existingInstructors.find((i) => i.email.toLowerCase() === value.trim().toLowerCase())) {
          return "An instructor with this email already exists";
        }
        return "";
      case "department":
        if (!value) return "Department is required";
        return "";
      case "employeeNumber":
        if (!value.trim()) return "Employee number is required";
        if (!/^\d{8}$/.test(value.trim())) return "Employee number must be exactly 8 digits";
        if (existingInstructors.find((i) => i.employeeNumber === value.trim())) {
          return "An instructor with this employee number already exists";
        }
        return "";
      default:
        return "";
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
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      newErrors[key] = validateField(key, formData[key]);
    });
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", department: "", employeeNumber: "" });
    setErrors({});
    setIsSubmitting(false);
    setShowSuccess(false);
    setApiError("");
    setTempPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
        employee_number: formData.employeeNumber.trim(),
      };
      
      const newInstructorData = await addInstructor(payload);

      setTempPassword(newInstructorData.temporary_password);
      onAddInstructor(newInstructorData);
      setShowSuccess(true);

    } catch (error) {
      console.error("Error adding instructor:", error);
      const errorMsg = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(" ")
        : (error.response?.data?.message || "An unknown error occurred. Please try again.");
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

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" /> Instructor Added
            </DialogTitle>
            <DialogDescription>
              Please share the temporary password with the instructor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Temporary Password</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input type={showPassword ? "text" : "password"} value={tempPassword} readOnly className="pr-10 font-mono" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleCopyPassword} className={passwordCopied ? "text-green-600" : ""}>
                  {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">The instructor should change this password upon first login.</p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Securely share this password. It will not be shown again.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add New Instructor</DialogTitle>
          <DialogDescription>Fill in the details for the new instructor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} onBlur={(e) => handleBlur("name", e.target.value)} className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employee Number *</Label>
            <Input id="employeeNumber" value={formData.employeeNumber} onChange={(e) => handleInputChange("employeeNumber", e.target.value)} onBlur={(e) => handleBlur("employeeNumber", e.target.value)} className={errors.employeeNumber ? "border-red-500" : ""} maxLength={8} />
            {errors.employeeNumber && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.employeeNumber}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} onBlur={(e) => handleBlur("email", e.target.value)} className={errors.email ? "border-red-500" : ""} />
            {errors.email && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
              <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.department && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.department}</p>}
          </div>
          {apiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}