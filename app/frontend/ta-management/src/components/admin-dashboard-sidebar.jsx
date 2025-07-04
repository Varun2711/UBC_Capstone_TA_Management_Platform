"use client"

import {
  Shield,
  Users,
  BookOpen,
  Calendar,
  Settings,
  FileText,
  UserCheck,
  BarChart3,
  Database,
  Bell,
  Home,
  Plus,
  Upload,
  Download,
  MoreVerticalIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
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

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/admin-dashboard",
  },
  {
    title: "User Management",
    icon: Users,
    url: "/user-management",
  },
  {
    title: "Course Management",
    icon: BookOpen,
    url: "/course-management",
  },
  {
    title: "TA Positions",
    icon: UserCheck,
    url: "#",
  },
  {
    title: "Applications",
    icon: FileText,
    url: "#",
  },
  {
    title: "Schedule Overview",
    icon: Calendar,
    url: "#",
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    url: "#",
  },
]

const systemItems = [
  {
    title: "System Settings",
    icon: Settings,
    url: "#",
  },
  {
    title: "Database Management",
    icon: Database,
    url: "#",
  },
  {
    title: "Notifications",
    icon: Bell,
    url: "#",
  },
]

const quickActions = [
  {
    title: "Create User",
    icon: Plus,
    url: "#",
  },
  {
    title: "Import Data",
    icon: Upload,
    url: "#",
  },
  {
    title: "Export Reports",
    icon: Download,
    url: "#",
  },
]

export function AdminSidebar({ activePage, ...props }) {
  const navigate = useNavigate()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-red-600 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin Portal</span>
            <span className="text-xs text-muted-foreground">System Administration</span>
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
                  <SidebarMenuButton asChild isActive={activePage === item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={activePage === item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
              <DropdownMenuTrigger asChild className="h-10">
                <SidebarMenuButton className="bg-background text-foreground hover:bg-muted">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg" alt="System Admin" />
                    <AvatarFallback className="bg-red-600 text-white">SA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">System Admin</span>
                    <span className="truncate text-xs text-muted-foreground">admin@university.edu</span>
                  </div>
                  <MoreVerticalIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button>Admin Profile</button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button>System Logs</button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <button>Logout</button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
