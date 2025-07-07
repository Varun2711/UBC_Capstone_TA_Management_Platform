"use client";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
  Edit,
  FileText,
  GraduationCap,
  Home,
  Mail,
  Phone,
  Save,
  Settings,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "../components/student-dashboard-sidebar";
import StudentProfileForm from "@/components/student-profile-form/StudentProfileForm";

// Mock data
const studentProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@university.edu",
  studentId: "20240012",
  UBCEmployeeId: "82342316",
  password: "password123",
  major: "Computer Science",
  minor: "Data Science",
  year: "Graduate Student",
  gpa: "3.85",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=120&width=120",
  coursePreference: [
    "COSC 111",
    "MATH 101",
    "COSC 121",
    "DATA 101",
    "STAT 121",
    "PHYS 111",
  ],
  academicInfo: {
    yearStanding: "4th Year",
    degreeStart: "September 2022",
    expectedGraduation: "May 2026",
  },
  experience: [
    {
      course: "CS 111 - Introduction to Programming",
      semester: "Fall 2023",
      professor: "Dr. Smith",
      description:
        "Assisted with lab sessions, graded assignments, and held office hours for 30+ students.",
    },
    {
      course: "MATH 101 - Introduction to Calculus",
      semester: "Summer 2023",
      professor: "Dr. Brown",
      description:
        "Assisted with lecture sessions, and graded midterms and exams.",
    },
  ],
  technicalSkills: [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Git",
    "Linux",
    "Machine Learning",
    "Data Structures",
  ],
  softSkills: [
    "Communication",
    "Teamwork",
    "Problem Solving",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
  ],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(studentProfile);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <StudentProfileForm
            profile={profile}
            setProfile={setProfile}
            mode="profile"
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
