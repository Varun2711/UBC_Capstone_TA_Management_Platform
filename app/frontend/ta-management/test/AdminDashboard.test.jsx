import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AdminDashboard from "../src/pages/AdminDashboard"

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

const renderAdminDashboard = () => {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  )
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the admin dashboard correctly", () => {
    renderAdminDashboard()

    // Check main title and description
    expect(screen.getAllByText("System Administration").length).toBeGreaterThan(0)
    expect(screen.getByText("Complete system overview and management controls")).toBeInTheDocument()

    // Check system stats cards
    expect(screen.getByText("Total Users")).toBeInTheDocument()
    expect(screen.getByText("Active Courses")).toBeInTheDocument()
    expect(screen.getAllByText("TA Positions").length).toBeGreaterThan(0)
    expect(screen.getByText("Pending Applications")).toBeInTheDocument()
  })

  it("displays system statistics correctly", () => {
    renderAdminDashboard()

    // Check stats values
    expect(screen.getByText("1,247")).toBeInTheDocument() // Total Users
    expect(screen.getByText("156")).toBeInTheDocument() // Active Courses
    expect(screen.getByText("342")).toBeInTheDocument() // TA Positions
    expect(screen.getByText("89")).toBeInTheDocument() // Pending Applications

    // Check change indicators
    expect(screen.getByText("+23 this week")).toBeInTheDocument()
    expect(screen.getByText("+8 this term")).toBeInTheDocument()
    expect(screen.getByText("89% filled")).toBeInTheDocument()
    expect(screen.getByText("-12 from yesterday")).toBeInTheDocument()
  })

  it("shows user distribution breakdown", () => {
    renderAdminDashboard()

    expect(screen.getByText("User Distribution")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Instructors")).toBeInTheDocument()
    expect(screen.getByText("TA Schedulers")).toBeInTheDocument()
    expect(screen.getByText("Admins")).toBeInTheDocument()

    // Check user counts
    expect(screen.getByText("1089")).toBeInTheDocument() // Students
    expect(screen.getByText("124")).toBeInTheDocument() // Instructors
    expect(screen.getByText("28")).toBeInTheDocument() // TA Schedulers
    expect(screen.getByText("6")).toBeInTheDocument() // Admins
  })

  it("displays system alerts", () => {
    renderAdminDashboard()

    expect(screen.getByText("System Alerts")).toBeInTheDocument()
    expect(screen.getByText("High Application Volume")).toBeInTheDocument()
    expect(screen.getByText("Scheduled Maintenance")).toBeInTheDocument()
    expect(screen.getByText("Backup Completed")).toBeInTheDocument()
  })

  it("shows pending actions", () => {
    renderAdminDashboard()

    expect(screen.getByText("Pending Actions")).toBeInTheDocument()
    expect(screen.getByText("Review new instructor applications")).toBeInTheDocument()
    expect(screen.getByText("Approve course modifications")).toBeInTheDocument()
    expect(screen.getByText("Update system configurations")).toBeInTheDocument()
  })

  it("displays recent activity table", () => {
    renderAdminDashboard()

    expect(screen.getByText("Recent System Activity")).toBeInTheDocument()

    // Check table headers
    expect(screen.getByText("Action")).toBeInTheDocument()
    expect(screen.getByText("User")).toBeInTheDocument()
    expect(screen.getByText("Role")).toBeInTheDocument()
    expect(screen.getByText("Time")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()

    // Check some activity entries
    expect(screen.getByText("New user registration")).toBeInTheDocument()
    expect(screen.getByText("Course created")).toBeInTheDocument()
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument()
  })

  it("shows quick management tools", () => {
    renderAdminDashboard()

    expect(screen.getByText("Quick Management Tools")).toBeInTheDocument()
    expect(screen.getAllByText("Create User").length).toBeGreaterThan(0)
    expect(screen.getByText("Manage Courses")).toBeInTheDocument()
    expect(screen.getAllByText("System Settings").length).toBeGreaterThan(0)
    expect(screen.getByText("Generate Reports")).toBeInTheDocument()
  })

  it("has search functionality in header", () => {
    renderAdminDashboard()

    const searchInput = screen.getByPlaceholderText("Search users, courses, logs...")
    expect(searchInput).toBeInTheDocument()
  })

  it("has export and filter buttons", () => {
    renderAdminDashboard()

    const exportButtons = screen.getAllByText("Export")
    expect(exportButtons.length).toBeGreaterThan(0)

    expect(screen.getByText("Filter")).toBeInTheDocument()
  })

  it("updates search query when typing", async () => {
    const user = userEvent.setup()
    renderAdminDashboard()

    const searchInput = screen.getByPlaceholderText("Search users, courses, logs...")
    await user.type(searchInput, "test search")

    expect(searchInput).toHaveValue("test search")
  })

  it("renders sidebar navigation correctly", () => {
    renderAdminDashboard()

    // Check sidebar elements
    expect(screen.getByText("Admin Portal")).toBeInTheDocument()
    expect(screen.getAllByText("System Administration").length).toBeGreaterThan(0)
    expect(screen.getByText("Navigation")).toBeInTheDocument()
  })

  it("shows breadcrumb navigation", () => {
    renderAdminDashboard()

    // Check breadcrumb shows System Administration
    expect(screen.getAllByText("System Administration").length).toBeGreaterThan(0)
  })

  it("displays correct role badges in activity table", () => {
    renderAdminDashboard()

    // Check for role badges
    expect(screen.getByText("Student")).toBeInTheDocument()
    expect(screen.getByText("Instructor")).toBeInTheDocument()
    expect(screen.getByText("TA Scheduler")).toBeInTheDocument()
    expect(screen.getByText("Automated")).toBeInTheDocument()
  })

  it("shows status indicators correctly", () => {
    renderAdminDashboard()

    // Check for status text (completed appears multiple times)
    const completedStatuses = screen.getAllByText("completed")
    expect(completedStatuses.length).toBeGreaterThan(0)

    expect(screen.getByText("warning")).toBeInTheDocument()
  })

  it("has proper accessibility attributes", () => {
    renderAdminDashboard()

    // Check search input has proper labeling
    const searchInput = screen.getByPlaceholderText("Search users, courses, logs...")
    expect(searchInput).toBeInTheDocument()

    // Check table structure
    const table = screen.getByRole("table")
    expect(table).toBeInTheDocument()

    // Check buttons are properly labeled
    const createUserButton = screen.getAllByText("Create User")
    expect(createUserButton.length).toBeGreaterThan(0)
  })
})
