import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar"
import * as profileLogic from "@/logic/scheduler-profile"
import { SidebarProvider } from "@/components/ui/sidebar"

// --- Mocks Setup ---

// Mock the API call for getProfile
const getProfileSpy = vi.spyOn(profileLogic, "getProfile")

// Mock react-router-dom's useNavigate
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Home: () => <svg data-testid="home-icon" />,
    BookOpen: () => <svg data-testid="book-open-icon" />,
    GraduationCap: () => <svg data-testid="graduation-cap-icon" />,
    MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
  }
})

// --- Test Suite ---

describe("InstructorSidebar", () => {
  const mockNavigate = vi.fn()
  const mockUser = {
    name: "Jane Doe",
    email: "jane.doe@example.com",
  }

  // Reset mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(mockNavigate)
  })

  // Helper function for rendering
  const renderSidebar = (props = {}) => {
    return render(
      <MemoryRouter>
        <SidebarProvider>
          <InstructorSidebar {...props} />
        </SidebarProvider>
      </MemoryRouter>,
    )
  }

  it("should render static content and initial loading state correctly", () => {
    getProfileSpy.mockImplementationOnce(() => new Promise(() => {})) // Prevent promise from resolving

    renderSidebar()

    // Check for static branding
    expect(screen.getByText("UBC CMPS")).toBeInTheDocument()
    expect(screen.getByText("Instructor Portal")).toBeInTheDocument()

    // Check that navigation items are rendered
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("My Courses")).toBeInTheDocument()
    expect(screen.getByText("TA Requirements")).toBeInTheDocument()

    // Check for the loading state in the footer
    expect(screen.getByText("Loading...")).toBeInTheDocument()
    // The dropdown trigger button should be disabled while loading
    const dropdownTrigger = screen.getByRole("button", { name: /account menu/i })
    expect(dropdownTrigger).toBeDisabled()
  })

  it("should display user information after successful data fetching", async () => {
    // Mock a successful API response
    getProfileSpy.mockResolvedValue(mockUser)

    renderSidebar()

    // Wait for the user's name to appear, which indicates the loading is complete
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("JD")).toBeInTheDocument() // Checks for correct initials
    expect(screen.getByText("Instructor")).toBeInTheDocument()

    // The "Loading..." text should no longer be present
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()

    // The dropdown trigger should now be enabled
    const dropdownTrigger = screen.getByRole("button", { name: /account menu/i })
    expect(dropdownTrigger).toBeEnabled()
  })

  it("should navigate to the correct URL when a navigation item is clicked", async () => {
    getProfileSpy.mockResolvedValue(mockUser) // Resolve promise to enable clicks
    const user = userEvent.setup()

    renderSidebar()

    // Wait for loading to finish
    await screen.findByText("Jane Doe")

    // Find and click the "My Courses" button
    const myCoursesButton = screen.getByRole("button", { name: /my courses/i })
    await user.click(myCoursesButton)

    // Assert that navigate was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith("/my-courses")
  })

  it("should open the dropdown menu and handle profile clicks", async () => {
    getProfileSpy.mockResolvedValue(mockUser)
    const user = userEvent.setup()

    renderSidebar()

    // Wait for loading to complete and click the dropdown trigger
    const dropdownTrigger = await screen.findByRole("button", { name: /account menu/i })
    await user.click(dropdownTrigger)

    // Check that the profile dropdown item is visible
    const profileButton = await screen.findByRole("menuitem", { name: /my profile/i })
    expect(profileButton).toBeInTheDocument()

    // Click "My Profile" and check navigation
    await user.click(profileButton)
    expect(mockNavigate).toHaveBeenCalledWith("/instructor-profile")
  })

  it("should correctly identify and style the active page", async () => {
    getProfileSpy.mockResolvedValue(mockUser)

    renderSidebar({ activePage: "Dashboard" })
    await screen.findByText("Jane Doe")

    const dashboardButton = screen.getByRole("button", { name: /dashboard/i })
    const coursesButton = screen.getByRole("button", { name: /my courses/i })

    // The active button should have the 'data-active="true"' attribute
    expect(dashboardButton).toHaveAttribute("data-active", "true")
    // The inactive button should not
    expect(coursesButton).not.toHaveAttribute("data-active", "true")
  })
})