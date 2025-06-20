"use client"

import { useState } from "react"
import { Mail, Edit, Save, X, Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/scheduler-sidebar"

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Original user data
  const [originalUserData] = useState({
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@university.edu",
    employeeNumber: "EMP123456789",
    department: "Computer Science",
  })

  // Editable user data
  const [userData, setUserData] = useState({ ...originalUserData })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setUserData({ ...originalUserData })
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
    console.log("User data saved:", userData)
  }

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>User Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-6 p-4 md:p-8">
          {/* Header Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Profile</h1>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:items-start">
            {/* Profile Overview */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {userData.firstName[0]}
                      {userData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">
                  {userData.firstName} {userData.lastName}
                </CardTitle>
                <div className="flex justify-center mt-2">
                  <Badge variant="secondary">{userData.department}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{userData.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={userData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    ) : (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.firstName}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={userData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    ) : (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.lastName}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  ) : (
                    <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.email}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.employeeNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/50">{userData.department}</div>
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