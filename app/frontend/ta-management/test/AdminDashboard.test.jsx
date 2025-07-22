import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AdminDashboard from "../src/pages/Admin/AdminDashboard"

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

  it("has basic admin features", () => {
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
