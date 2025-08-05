import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { render, screen, waitFor, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import UserManagement from "../src/pages/Admin/UserManagement"

// Mock the mobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

// Mock the AdminSidebar component
vi.mock("../../components/admin-dashboard-sidebar", () => ({
  AdminSidebar: ({ activePage }) => <div data-testid="admin-sidebar">{activePage}</div>
}))

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

// Mock fetch globally
global.fetch = vi.fn()

// Sample test data
const mockUsers = [
  {
    id: "12345",
    name: "John Doe",
    email: "john.doe@university.edu",
    type: "student",
    is_active: true,
    department: "Computer Science"
  },
  {
    id: "67890",
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    type: "instructor",
    is_active: true,
    department: "Mathematics"
  },
  {
    id: "11111",
    name: "Mike Wilson",
    email: "mike.wilson@university.edu",
    type: "scheduler",
    is_active: true,
    department: "Physics"
  },
  {
    id: "22222",
    name: "Admin User",
    email: "admin@university.edu",
    type: "admin",
    is_active: true,
    department: null
  },
  {
    id: "33333",
    name: "Inactive Student",
    email: "inactive@university.edu",
    type: "student",
    is_active: false,
    department: "Data Science"
  }
]

const mockApiResponse = {
  success: true,
  data: {
    users: mockUsers
  }
}

let user

const renderUserMgmtPage = () => {
  return render(
    <MemoryRouter>
      <UserManagement />
    </MemoryRouter>
  )
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    
    // Mock successful API response by default
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    })
    
    // Mock sessionStorage to return a token
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'mock-token'
      return null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial Rendering", () => {
    it("displays loading state initially", () => {
      // Mock a delayed response
      fetch.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        }), 100)
      ))

      renderUserMgmtPage()
      
      expect(screen.getByText("Loading users...")).toBeInTheDocument()
    })
  })

  describe("User Table", () => {
    it("renders all users in the table", async () => {
      renderUserMgmtPage()
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
        expect(screen.getByText("Mike Wilson")).toBeInTheDocument()
        expect(screen.getByText("Admin User")).toBeInTheDocument()
        expect(screen.getByText("Inactive Student")).toBeInTheDocument()
      })
    })

    it("displays correct status badges", async () => {
      renderUserMgmtPage()
      
      await waitFor(() => {
        const activeElements = screen.getAllByText("Active")
        const inactiveElements = screen.getAllByText("Inactive")
        
        expect(activeElements.length).toBe(4) // 4 active users
        expect(inactiveElements.length).toBe(1) // 1 inactive user
      })
    })
  })

  describe("Search and Filtering", () => {
    it("filters users based on search query", async () => {
      renderUserMgmtPage()
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText("Search users by name, email, or ID...")
      await user.type(searchInput, "Sarah")
      
      await waitFor(() => {
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument()
      })
    })

    it("shows no users message when filters return empty results", async () => {
      renderUserMgmtPage()
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText("Search users by name, email, or ID...")
      await user.type(searchInput, "nonexistent user")
      
      await waitFor(() => {
        expect(screen.getByText("No users found matching your criteria")).toBeInTheDocument()
      })
    })
  })

  describe("User Actions", () => {
    it("shows promote option for instructors", async () => {
      renderUserMgmtPage()

      await waitFor(() => {
        expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
      })

      // Find Sarah Johnson's row and click the action menu
      const sarahRow = screen.getByText("Sarah Johnson").closest("tr")
      const actionButton = within(sarahRow).getByRole("button")
      await user.click(actionButton)

      await waitFor(() => {
        expect(screen.getByText("Promote to TA Coordinator")).toBeInTheDocument()
      })
    })
  })

      // Mock successful deactivation response
      fetch.mockImplementation((url, options) => {
        if (options?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: "User deactivated successfully"
            })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponse)
        })
      })
      
      renderUserMgmtPage()
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument()
      })
      
      // Find John Doe's row and click the action menu
      const johnRow = screen.getByText("John Doe").closest("tr")
      const actionButton = within(johnRow).getByRole("button")
      await user.click(actionButton)
      
      await waitFor(() => {
        expect(screen.getByText("Deactivate User")).toBeInTheDocument()
      })
      
      // Click deactivate
      await user.click(screen.getByText("Deactivate User"))
      
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining("Are you sure you want to deactivate John Doe?")
      )
    })
  })

  describe("Error Handling", () => {

    it("handles API response errors", async () => {
      // Mock API error response
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server error")
      })

      renderUserMgmtPage()
    })

    it("handles missing authentication token", async () => {
      // Mock no token in sessionStorage
      mockSessionStorage.getItem.mockReturnValue(null)
      
      renderUserMgmtPage()
      
      // Should still attempt to fetch but with empty headers
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/users/"),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        )
      })
    })
  })
})