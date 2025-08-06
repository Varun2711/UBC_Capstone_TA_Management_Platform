import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AdminDashboard from "../src/pages/Admin/AdminDashboard"
import * as adminLogic from "@/logic/admin"

// Mock the admin logic
vi.mock("@/logic/admin", () => ({
  getAdminDashboard: vi.fn(),
  getNotificationStats: vi.fn(),
  getSystemHealth: vi.fn(),
}))

// Mock recharts components to avoid SVG rendering issues in tests
vi.mock("recharts", () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, label }) => <div data-testid="pie" data-label={label}>{JSON.stringify(data)}</div>,
  Cell: ({ fill }) => <div data-testid="cell" data-fill={fill}></div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }) => <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Bar: ({ dataKey, fill, name }) => <div data-testid="bar" data-key={dataKey} data-fill={fill} data-name={name}></div>,
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey}></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: ({ strokeDasharray }) => <div data-testid="cartesian-grid" data-stroke={strokeDasharray}></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey, stroke }) => <div data-testid="line" data-key={dataKey} data-stroke={stroke}></div>,
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
      total_students: 150,
      total_instructors: 25,
      total_schedulers: 5,
      total_admins: 3,
      total_users: 183,
      active_students: 140,
      active_instructors: 24,
      active_schedulers: 5,
      active_admins: 3,
      total_active_users: 172,
      inactive_users: 11,
      user_activity_rate: 94.0,
      total_departments: 6,
      department_distribution: {
        "Computer Science": {
          students: 80,
          instructors: 12,
          schedulers: 2,
          total: 94
        },
        "Mathematics": {
          students: 45,
          instructors: 8,
          schedulers: 1,
          total: 54
        },
        "Physics": {
          students: 25,
          instructors: 5,
          schedulers: 2,
          total: 32
        }
      },
      recent_activity: {
        new_admins_30d: 1
      },
      user_type_distribution: {
        students: 150,
        instructors: 25,
        schedulers: 5,
        admins: 3
      },
      activity_status: {
        active: 172,
        inactive: 11
      }
    }
  }
}

const mockNotificationStats = {
  total_notifications: 1250,
  pending_notifications: 15,
  sent_notifications: 1180,
  failed_notifications: 55,
  stats_by_type: {
    "offer_created": 450,
    "application_received": 300,
    "password_reset": 125,
    "account_creation": 375
  }
}

const mockSystemHealth = {
  overall_health: "healthy",
  services: [
    { name: "User Profile Service", status: "healthy" },
    { name: "Notification Service", status: "healthy" },
    { name: "Allocations Service", status: "healthy" },
    { name: "Auth Service", status: "healthy" }
  ]
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
  const mockGetNotificationStats = vi.mocked(adminLogic.getNotificationStats)
  const mockGetSystemHealth = vi.mocked(adminLogic.getSystemHealth)

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
    
    // Setup default successful mocks
    mockGetAdminDashboard.mockResolvedValue(mockDashboardData)
    mockGetNotificationStats.mockResolvedValue(mockNotificationStats)
    mockGetSystemHealth.mockResolvedValue(mockSystemHealth)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders admin dashboard title and description", () => {
    renderAdminDashboard()
    
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
    expect(screen.getByText("System overview and statistics")).toBeInTheDocument()
  })

  it("shows loading skeletons initially", () => {
    mockGetAdminDashboard.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    renderAdminDashboard()
    
    // Should show multiple skeleton loaders
    const skeletons = screen.getAllByTestId("skeleton")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("displays enhanced statistics cards when data loads successfully", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument()
      expect(screen.getByText("183")).toBeInTheDocument()
    })

    // Check for new enhanced stat cards
    expect(screen.getByText("Active Users")).toBeInTheDocument()
    expect(screen.getByText("172")).toBeInTheDocument()
    expect(screen.getByText("healthy")).toBeInTheDocument()
  })

  it("displays user type distribution chart", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("User Type Distribution")).toBeInTheDocument()
      expect(screen.getByText("Breakdown of users by role")).toBeInTheDocument()
    })
  })

  it("displays activity status chart", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("User Activity Status")).toBeInTheDocument()
      expect(screen.getByText("Active vs inactive users")).toBeInTheDocument()
    })
  })

  it("displays notification statistics", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Notification Statistics")).toBeInTheDocument()
      expect(screen.getByText("Email notification status overview")).toBeInTheDocument()
      expect(screen.getByText("Success Rate")).toBeInTheDocument()
    })
  })

  it("switches between tabs correctly", async () => {
    const user = userEvent.setup()
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument()
    })
    
    // Click on User Analytics tab
    await user.click(screen.getByText("User Analytics"))
    
    await waitFor(() => {
      expect(screen.getByText("User Growth Overview")).toBeInTheDocument()
      expect(screen.getByText("Activity Metrics")).toBeInTheDocument()
    })
  })

  it("handles notification service failure gracefully", async () => {
    mockGetNotificationStats.mockRejectedValue(new Error("Notification service unavailable"))
    
    renderAdminDashboard()
    
    await waitFor(() => {
      // Should still render dashboard but with default notification stats
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Notifications")).toBeInTheDocument()
    })
  })

  it("calculates and displays activity rate correctly", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(screen.getByText("94% active")).toBeInTheDocument() // Based on mock data
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

  it("calls all API endpoints on component mount", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      expect(mockGetAdminDashboard).toHaveBeenCalledTimes(1)
      expect(mockGetNotificationStats).toHaveBeenCalledTimes(1)
      expect(mockGetSystemHealth).toHaveBeenCalledTimes(1)
    })
  })

  it("renders sidebar navigation elements", () => {
    renderAdminDashboard()

    expect(screen.getByText("Admin Portal")).toBeInTheDocument()
    expect(screen.getByText("System Administration")).toBeInTheDocument()
    expect(screen.getByText("Navigation")).toBeInTheDocument()
  })

  it("displays progress bars for activity metrics", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      // Progress components should be rendered (they have role="progressbar")
      const progressBars = screen.getAllByRole("progressbar")
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  it("handles partial service failures gracefully", async () => {
    // User stats succeed, but other services fail
    mockGetNotificationStats.mockRejectedValue(new Error("Service down"))
    mockGetSystemHealth.mockRejectedValue(new Error("Health check failed"))
    
    renderAdminDashboard()
    
    await waitFor(() => {
      // Main dashboard should still load
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Total Users")).toBeInTheDocument()
      expect(screen.getByText("183")).toBeInTheDocument()
    })
  })

  it("displays trend indicators correctly", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      // Should show activity rate as description
      expect(screen.getByText("94% active")).toBeInTheDocument()
      expect(screen.getByText("11 inactive")).toBeInTheDocument()
    })
  })

  it("calculates notification success rate correctly", async () => {
    renderAdminDashboard()
    
    await waitFor(() => {
      // Based on mock data: 1180 sent / 1250 total = 94%
      expect(screen.getByText("94%")).toBeInTheDocument()
    })
  })
})