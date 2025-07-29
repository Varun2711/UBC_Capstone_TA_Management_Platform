import {
  BookOpen,
  Calendar,
  FileText,
  Home,
  Settings,
  Upload,
  UserCheck,
  Plus,
  CheckCircle,
  PlusCircle,
  User,
  MoreVerticalIcon,
  GraduationCap,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@/components/ui/dropdown-menu"
import { logout } from "@/logic/auth"

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/student-dashboard",
  },
  {
    title: "Apply",
    icon: PlusCircle,
    url: "/apply",
  },
  {
    title: "Schedule",
    icon: Calendar,
    url: "#",
  },
  {
    title: "Profile",
    icon: User,
    url: "/profile",
  },
]

export function AppSidebar({ name, email, avatar }) {
  // Using useNavigate from react-router-dom to handle navigation
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (url) => {
    navigate(url);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-semibold">Student</span>
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
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <button
                      onClick={() => handleNav(item.url)}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
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
                <SidebarMenuButton className="bg-background text-foreground hover:bg-muted" aria-label="account menu">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt={name}/>
                    <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                  <MoreVerticalIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {" "}
                  <button>My Profile</button>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reset-password")}>
                  <button>Change Password</button>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout(navigate)}>
                  <button>Logout </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
