import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AdminSidebar } from "@/components/admin-dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock icons from lucide-react
vi.mock("lucide-react", () => ({
  Shield: () => <svg data-testid="shield-icon" />,
  Home: () => <svg data-testid="home-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  UserCheck: () => <svg data-testid="user-check-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  Database: () => <svg data-testid="database-icon" />,
  Bell: () => <svg data-testid="bell-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  Upload: () => <svg data-testid="upload-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
}))

const renderSidebar = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AdminSidebar {...props} />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe("AdminSidebar", () => {
  it("renders the sidebar with header, content, and footer", () => {
    renderSidebar({ activePage: "Dashboard" })

    expect(screen.getByText("Admin Portal")).toBeInTheDocument()
    expect(screen.getByText("System Administration")).toBeInTheDocument()
    expect(screen.getByTestId("shield-icon")).toBeInTheDocument()
    expect(screen.getByText("Navigation")).toBeInTheDocument()
    expect(screen.getByText("Quick Actions")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
    expect(screen.getByText("System Admin")).toBeInTheDocument()
    expect(screen.getByText("admin@university.edu")).toBeInTheDocument()
  })

  it("renders all navigation items correctly", () => {
    renderSidebar({ activePage: "User Management" })

    const navigationItems = [
      { title: "Dashboard", icon: "home-icon" },
      { title: "User Management", icon: "users-icon", isActive: true },
      { title: "Course Management", icon: "book-open-icon" },
      { title: "TA Positions", icon: "user-check-icon" },
      { title: "Applications", icon: "file-text-icon" },
      { title: "Reports & Analytics", icon: "bar-chart-icon" },
    ]

    const navigationGroup = screen.getByText("Navigation").closest('[data-sidebar="group"]')

    navigationItems.forEach((item) => {
      const menuItem = within(navigationGroup).getByText(item.title)
      expect(menuItem).toBeInTheDocument()
      expect(within(navigationGroup).getByTestId(item.icon)).toBeInTheDocument()

      if (item.isActive) {
        expect(menuItem.closest('[data-active="true"]')).toBeInTheDocument()
      } else {
        expect(menuItem.closest('[data-active="true"]')).not.toBeInTheDocument()
      }
    })
  })

  it("renders all quick actions correctly", () => {
    renderSidebar()

    const quickActions = [
      { title: "Create User", icon: "plus-icon" },
      { title: "Import Data", icon: "upload-icon" },
      { title: "Export Reports", icon: "download-icon" },
    ]

    const quickActionsGroup = screen.getByText("Quick Actions").closest('[data-sidebar="group"]')

    quickActions.forEach((item) => {
      const menuItem = within(quickActionsGroup).getByText(item.title)
      expect(menuItem).toBeInTheDocument()
      expect(within(quickActionsGroup).getByTestId(item.icon)).toBeInTheDocument()
    })
  })


  it("applies active state styling to the specified active page", () => {
    renderSidebar({ activePage: "Reports & Analytics" })

    const activeItem = screen.getByText("Reports & Analytics").closest('[data-active="true"]')
    expect(activeItem).toHaveAttribute("data-active", "true")

    const inactiveItem = screen.getByText("Dashboard").closest('[data-active="true"]')
    expect(inactiveItem).not.toBeInTheDocument()
  })

  it("renders avatar with correct fallback and styling", () => {
    renderSidebar({ activePage: "Dashboard" })

    const avatar = screen.getByText("System Admin").closest('[data-sidebar="menu-button"]')
    const avatarFallback = within(avatar).getByText("SA")
    expect(avatarFallback).toBeInTheDocument()
    expect(avatarFallback).toHaveClass("bg-red-600", "text-white")
  })

  it("renders the dropdown menu in the footer with correct items", async () => {
    const user = userEvent.setup()
    renderSidebar({ activePage: "Dashboard" })

    const dropdownTrigger = screen.getByRole("button")
    await user.click(dropdownTrigger)

    expect(await screen.findByText("Admin Account")).toBeInTheDocument()
    expect(screen.getByText("System Logs")).toBeInTheDocument()
    expect(screen.getByText("Logout")).toBeInTheDocument()
  })

  it("renders correct branding and role information", () => {
    renderSidebar()

    // Check header branding
    expect(screen.getByText("Admin Portal")).toBeInTheDocument()
    expect(screen.getByText("System Administration")).toBeInTheDocument()

    // Check user information
    expect(screen.getByText("System Admin")).toBeInTheDocument()
    expect(screen.getByText("admin@university.edu")).toBeInTheDocument()
  })

  it("shows admin-specific styling with red shield icon", () => {
    renderSidebar()

    // Check that the shield icon is present (admin-specific)
    expect(screen.getByTestId("shield-icon")).toBeInTheDocument()

    // The shield icon should be in a red background container
    const iconContainer = screen.getByTestId("shield-icon").closest("div")
    expect(iconContainer).toHaveClass("bg-red-600")
  })

  it("includes all expected menu sections", () => {
    renderSidebar()

    // Check all three main sections exist
    expect(screen.getByText("Navigation")).toBeInTheDocument()
    expect(screen.getByText("Quick Actions")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
  })
})
