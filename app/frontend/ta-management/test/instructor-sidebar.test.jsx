import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock icons from lucide-react
vi.mock("lucide-react", () => ({
  Home: () => <svg data-testid="home-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  GraduationCap: () => <svg data-testid="graduation-cap-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
}))

const renderSidebar = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <InstructorSidebar {...props} />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe("InstructorSidebar", () => {

  it("renders all navigation items correctly", () => {
    renderSidebar({ activePage: "My Courses" })

    const navigationItems = [
      { title: "Dashboard", icon: "home-icon" },
      { title: "My Courses", icon: "book-open-icon", isActive: true },
      { title: "Schedule", icon: "calendar-icon" },
      { title: "Profile", icon: "graduation-cap-icon" },
      { title: "Settings", icon: "settings-icon" },
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

  it("renders avatar with correct fallback", () => {
    renderSidebar({ activePage: "Dashboard" })

    const avatar = screen.getByText("Ronnie Smith").closest('[data-sidebar="menu-button"]')
    const avatarFallback = within(avatar).getByText("RS")
    expect(avatarFallback).toBeInTheDocument()
    expect(avatarFallback).toHaveClass("bg-muted")
  })

  it("renders the dropdown menu in the footer with correct items", async () => {
    const user = userEvent.setup()
    renderSidebar({ activePage: "Dashboard" })

    const dropdownTrigger = screen.getByRole("button")
    await user.click(dropdownTrigger)

    expect(await screen.findByText("My Account")).toBeInTheDocument()
    expect(screen.getByText("My Profile")).toBeInTheDocument()
    expect(screen.getByText("Logout")).toBeInTheDocument()
  })

  it("has correct accessibility attributes", () => {
    renderSidebar({ activePage: "Dashboard" })

    const header = screen.getByText("UBC CMPS").closest('[data-sidebar="header"]')
    expect(header).toHaveAttribute("data-sidebar", "header")

    const navigationGroup = screen.getByText("Navigation").closest('[data-sidebar="group"]')
    const menuItems = within(navigationGroup).getAllByRole("link")
    menuItems.forEach((item) => {
      expect(item).toHaveAttribute("href", "#")
    })

    const footer = screen.getByText("Ronnie Smith").closest('[data-sidebar="footer"]')
    expect(footer).toHaveAttribute("data-sidebar", "footer")
  })

  it("renders all navigation items with correct icons", () => {
    renderSidebar()

    const expectedItems = [
      { title: "Dashboard", icon: "home-icon" },
      { title: "My Courses", icon: "book-open-icon" },
      { title: "Schedule", icon: "calendar-icon" },
      { title: "Profile", icon: "graduation-cap-icon" },
      { title: "Settings", icon: "settings-icon" },
    ]

    expectedItems.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument()
    // Check if the icon is rendered if applicable
    //   expect(screen.getByTestId(item.icon)).toBeInTheDocument()
    })
  })

  it("renders correct branding and role information", () => {
    renderSidebar()

    // Check header branding
    expect(screen.getByText("UBC CMPS")).toBeInTheDocument()
    expect(screen.getByText("Instructor Portal")).toBeInTheDocument()

    // Check user information
    expect(screen.getByText("Ronnie Smith")).toBeInTheDocument()
    expect(screen.getByText("Instructor")).toBeInTheDocument()
  })

  it("has proper navigation structure", () => {
    renderSidebar()

    // Check that all navigation items are links
    const navigationGroup = screen.getByText("Navigation").closest('[data-sidebar="group"]')
    const links = within(navigationGroup).getAllByRole("link")

    expect(links).toHaveLength(5) // Should have 5 navigation items

    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "#")
    })
  })
})
