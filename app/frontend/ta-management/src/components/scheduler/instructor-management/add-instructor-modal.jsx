"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addInstructor } from "@/logic/instructorManagement";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function AddInstructorModal({ isOpen, onClose, onDataChange, existingInstructors, departments }) {
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newInstructor, setNewInstructor] = useState(null);

  const resetForm = () => {
    setName("");
    setEmployeeNumber("");
    setEmail("");
    setDepartment("");
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setNewInstructor(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !department || !employeeNumber) {
      setError("Please fill in all required fields.");
      return;
    }
    if (existingInstructors.some(inst => inst.email === email)) {
      setError("An instructor with this email already exists.");
      return;
    }
    if (employeeNumber && existingInstructors.some(inst => inst.employeeNumber === employeeNumber)) {
      setError("An instructor with this employee number already exists.");
      return;
    }

    setIsLoading(true);
    try {
      const instructorData = { name, email, department, employee_number: employeeNumber };
      const response = await addInstructor(instructorData);
      setNewInstructor(response);
      setIsSuccess(true);
      onDataChange();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
              Instructor Added
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{newInstructor?.name}</strong> has been successfully added.
            </p>
            <p className="mt-2 text-muted-foreground">
              An email with their account details and a temporary password has been sent to <strong>{newInstructor?.email}</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Instructor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="flex items-center bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employee Number *</Label>
            <Input id="employeeNumber" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select onValueChange={setDepartment} value={department}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Instructor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}