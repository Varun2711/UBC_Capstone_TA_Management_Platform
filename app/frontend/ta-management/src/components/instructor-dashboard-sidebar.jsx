"use client"

import { useState, useEffect } from "react"
import { BookOpen, GraduationCap, Home, MoreVerticalIcon, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getProfile } from "@/logic/scheduler-profile" 
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/logic/auth"

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/instructor-dashboard",
  },
  {
    title: "My Courses",
    icon: BookOpen,
    url: "/my-courses",
  },
  {
    title: "TA Requirements",
    icon: GraduationCap,
    url: "/ta-requirements",
  },
]

export function InstructorSidebar({ activePage, ...props }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetches the current user's profile data
        const data = await getProfile()
        setUser(data)
      } catch (error) {
        console.error("Failed to fetch user profile for sidebar:", error)
        // Optionally handle the error, e.g., show an error message
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [])

  // Helper function to get initials from a name string
  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">UBC CMPS</span>
            <span className="text-xs text-muted-foreground">Instructor Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={activePage === item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="h-10" disabled={isLoading}>
                <SidebarMenuButton className="bg-background text-foreground hover:bg-muted" aria-label="account menu">
                  {isLoading || !user ? (
                    <>
                      <Avatar className="h-6 w-6 bg-muted" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">Loading...</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user.name}</span>
                        <span className="truncate text-xs text-muted-foreground">Instructor</span>
                      </div>
                    </>
                  )}
                  <MoreVerticalIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/instructor-profile")}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reset-password")}>
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout(navigate)}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}