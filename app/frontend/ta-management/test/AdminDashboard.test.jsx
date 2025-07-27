import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AdminDashboard from "../src/pages/Admin/AdminDashboard"
import * as adminLogic from "@/logic/admin"

// Mock the admin logic
vi.mock("@/logic/admin", () => ({
  getAdminDashboard: vi.fn(),
}))

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock the sidebar component
vi.mock("../../components/admin-dashboard-sidebar", () => ({
  AdminSidebar: vi.fn(({ activePage }) => (
    <div data-testid="admin-sidebar">
      <div>Admin Portal</div>
      <div>System Administration</div>
      <div>Navigation</div>
      <div>Active: {activePage}</div>
    </div>
  )),
}))

const mockDashboardData = {
  success: true,
  message: "Admin dashboard data",
  data: {
    user_id: "11111111",
    user_type: "admin",
    statistics: {
      total_students: 10,
      total_instructors: 11,
      total_schedulers: 1,
      total_admins: 1,
      total_users: 23
    }
  }
}

const renderAdminDashboard = () => {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>,
  )
}

describe("AdminDashboard", () => {
  const mockGetAdminDashboard = vi.mocked(adminLogic.getAdminDashboard)

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders admin dashboard title", () => {
    mockGetAdminDashboard.mockResolvedValue(mockDashboardData)
    
    renderAdminDashboard()
    
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
  })

  it("shows loading skeletons initially", () => {
    mockGetAdminDashboard.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    renderAdminDashboard()
    
    // Should show 5 skeleton loaders for the 5 stat cards
    const skeletons = screen.getAllByTestId("skeleton")
    expect(skeletons).toHaveLength(5)
  })

  it("displays statistics cards when data loads successfully", async () => {
    mockGetAdminDashboard.mockResolvedValue(mockDashboardData)
    
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument()
      expect(screen.getByText("23")).toBeInTheDocument()
    })
    // Check values by finding them within their respective cards
    const totalUsersCard = screen.getByText("Total Users").closest('.shadow-md')
    expect(totalUsersCard).toHaveTextContent("23")
    
    const adminsCard = screen.getByText("Admins").closest('.shadow-md')
    expect(adminsCard).toHaveTextContent("1")
    
    const schedulersCard = screen.getByText("Schedulers").closest('.shadow-md')
    expect(schedulersCard).toHaveTextContent("1")
    
    const instructorsCard = screen.getByText("Instructors").closest('.shadow-md')
    expect(instructorsCard).toHaveTextContent("11")
    
    const studentsCard = screen.getByText("Students").closest('.shadow-md')
    expect(studentsCard).toHaveTextContent("10")
  })

  it("displays error message when API call fails", async () => {
    const errorMessage = "Failed to load dashboard data"
    mockGetAdminDashboard.mockRejectedValue(new Error(errorMessage))
    
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard data.")).toBeInTheDocument()
    })
  })

  it("displays authentication error when API returns invalid data", async () => {
    mockGetAdminDashboard.mockResolvedValue({
      success: false,
      message: "Invalid data format"
    })
    
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard data.")).toBeInTheDocument()
    })
  })

  it("calls getAdminDashboard on component mount", async () => {
    mockGetAdminDashboard.mockResolvedValue(mockDashboardData)
    
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(mockGetAdminDashboard).toHaveBeenCalledTimes(1)
    })
  })

  it("renders sidebar navigation elements", () => {
    mockGetAdminDashboard.mockResolvedValue(mockDashboardData)
    
    renderAdminDashboard()

    expect(screen.getByText("Admin Portal")).toBeInTheDocument()
    expect(screen.getByText("System Administration")).toBeInTheDocument()
    expect(screen.getByText("Navigation")).toBeInTheDocument()
  })

  it("handles network errors gracefully", async () => {
    mockGetAdminDashboard.mockRejectedValue(new Error("Network Error"))
    
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard data.")).toBeInTheDocument()
    })
  })
})