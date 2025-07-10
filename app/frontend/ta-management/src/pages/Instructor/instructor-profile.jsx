"use client"

import { useState, useEffect } from "react";
import { Mail, Edit, Save, X, Bell, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar";

import { getProfile, updateProfile } from "@/logic/scheduler-profile";

export default function InstructorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProfile();
        
        const [firstName, ...lastNameParts] = data.name.split(' ');
        
        const profile = {
          firstName: firstName || '',
          lastName: lastNameParts.join(' ') || '',
          email: data.email,
          instructorId: data.employee_number, 
          department: data.department_name || '', 
        };

        setOriginalUserData(profile);
        setUserData(profile);
      } catch (error) {
        setFetchError("Could not load your profile. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setErrors({});

    try {
      const updatedData = {
        name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
        email: userData.email,
      };

      await updateProfile(updatedData);
      setOriginalUserData({ ...userData });
      setIsEditing(false);

    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};
        for (const field in backendErrors) {
          formattedErrors[field] = backendErrors[field][0]; 
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ api: "Failed to save changes. Please try again." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };
  
  const validateField = (field, value) => {
    if ((field === "firstName" || field === "lastName") && (!value || value.trim().length < 2)) {
      return "Name must be at least 2 characters";
    }
    if (field === "email" && (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))) {
      return "Invalid email address";
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ["firstName", "lastName", "email"];
    fields.forEach((field) => {
      const error = validateField(field, userData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setUserData({ ...originalUserData });
    setErrors({});
    setIsEditing(false);
  };

  const isFormValid = () => {
    if (!userData) return false;
    return (
      userData.firstName?.trim().length >= 2 &&
      userData.lastName?.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email?.trim() || '')
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  if (fetchError) {
    return <div className="flex justify-center items-center h-screen text-red-500">{fetchError}</div>;
  }
  
  if (!userData) return null;

  return (
    <SidebarProvider>
      <InstructorSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbPage>Instructor Profile</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center space-x-4">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving || !isFormValid()}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="h-5 w-5" /></Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Instructor Profile</h1>
            <p className="text-muted-foreground">Manage your personal and professional information.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:items-start">
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {userData.firstName?.[0]}{userData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{userData.firstName} {userData.lastName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{userData.email}</span>
                </div>
                 {userData.department && (
                    <div className="flex items-center space-x-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{userData.department}</span>
                    </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.api && <p className="text-destructive text-sm">{errors.api}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <div>
                        <Input id="firstName" value={userData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} className={errors.firstName ? "border-destructive" : ""} />
                        {errors.firstName && (<p className="text-destructive text-sm mt-1">{errors.firstName}</p>)}
                      </div>
                    ) : (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.firstName}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <div>
                        <Input id="lastName" value={userData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} className={errors.lastName ? "border-destructive" : ""} />
                        {errors.lastName && (<p className="text-destructive text-sm mt-1">{errors.lastName}</p>)}
                      </div>
                    ) : (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.lastName}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <div>
                      <Input id="email" type="email" value={userData.email} onChange={(e) => handleInputChange("email", e.target.value)} className={errors.email ? "border-destructive" : ""} />
                      {errors.email && (<p className="text-destructive text-sm mt-1">{errors.email}</p>)}
                    </div>
                  ) : (
                    <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.email}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructorId">Instructor ID</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.instructorId}</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                     {/* This field is ready for when the backend provides the data */}
                    <div className="px-3 py-2 border rounded-md bg-muted/50 h-10">
                      {userData.department || <span className="text-muted-foreground">Not specified</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}