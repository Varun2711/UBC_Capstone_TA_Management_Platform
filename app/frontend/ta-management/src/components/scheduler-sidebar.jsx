import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  CheckCircle,
  UserCheck,
  MoreVerticalIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "@/logic/scheduler-profile"; // Ensure this path is correct for your project
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/logic/auth";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/scheduler-dashboard",
    icon: Home,
  },
  {
    title: "Course Management",
    url: "/course-management",
    icon: BookOpen,
  },
  {
    title: "Instructor Management",
    url: "/instructor-management",
    icon: UserCheck,
  },
  {
    title: "Application Management",
    url: "/manage-applications",
    icon: FileText,
  },
  {
    title: "Job Posting Management",
    url: "/manage-templates",
    icon: FileText,
  },
  {
    title: "Allocations",
    url: "/ta-coordinator-allocation",
    icon: CheckCircle,
  },
];

export function AppSidebar({ activePage, ...props }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user profile for sidebar:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">TA Scheduler</span>
            <span className="text-xs text-muted-foreground">
              Scheduler Portal
            </span>
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
                    isActive={activePage === item.title}
                    onClick={() => navigate(item.url)}
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
              <DropdownMenuTrigger
                asChild
                className="h-10"
                disabled={isLoading}
              >
                <SidebarMenuButton
                  aria-label="account menu"
                  className="bg-background text-foreground hover:bg-muted"
                >
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
                        {/* Assuming no avatar URL is provided, fallback will be used */}
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </>
                  )}
                  <MoreVerticalIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/user-profile-scheduler")}
                >
                  <button>My Profile</button>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reset-password")}>
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout(navigate)}>
                  <button>Logout</button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
