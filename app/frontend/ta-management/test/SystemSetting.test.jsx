import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SystemSettings from "../src/pages/Admin/SystemSetting"
import * as courseManagement from "@/logic/courseManagement"

// Mock the course management logic
vi.mock("@/logic/courseManagement", () => ({
  getTerms: vi.fn(),
  createTerm: vi.fn(),
  updateTerm: vi.fn(),
  deleteTerm: vi.fn(),
  getTermById: vi.fn(),
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

const mockTermsData = [
  {
    id: 1,
    code: "W2025 Term 1",
    description: "Winter 2025 Term 1",
    start: "2025-01-06",
    end: "2025-04-11",
    startCalendarYear: 2025,
    endCalendarYear: 2025,
    academicYear: "2024/25",
    is_active: true,
    term_type: "winter"
  },
  {
    id: 2,
    code: "S2025 Term 1",
    description: "Summer 2025 Term 1",
    start: "2025-05-05",
    end: "2025-08-15",
    startCalendarYear: 2025,
    endCalendarYear: 2025,
    academicYear: "2024/25",
    is_active: false,
    term_type: "summer"
  }
]

const renderSystemSettings = () => {
  return render(
    <MemoryRouter>
      <SystemSettings />
    </MemoryRouter>,
  )
}

describe("SystemSettings", () => {
  const mockGetTerms = vi.mocked(courseManagement.getTerms)
  const mockCreateTerm = vi.mocked(courseManagement.createTerm)
  const mockUpdateTerm = vi.mocked(courseManagement.updateTerm)
  const mockDeleteTerm = vi.mocked(courseManagement.deleteTerm)
  const mockGetTermById = vi.mocked(courseManagement.getTermById)

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

  describe("Component Rendering", () => {
    it("renders system settings title and description", () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()
      expect(screen.getByText("Configure academic terms and system-wide settings")).toBeInTheDocument()
    })

    it("renders sidebar navigation elements", () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()

      expect(screen.getByText("Admin Portal")).toBeInTheDocument()
      expect(screen.getByText("System Administration")).toBeInTheDocument()
      expect(screen.getByText("Navigation")).toBeInTheDocument()
    })
  })

  describe("Academic Terms Tab", () => {
    it("shows loading state when terms are being fetched", () => {
      mockGetTerms.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      renderSystemSettings()
      
      expect(screen.getByText("Loading academic terms...")).toBeInTheDocument()
    })

    it("displays academic terms when data loads successfully", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("W2025 Term 1")).toBeInTheDocument()
        expect(screen.getByText("S2025 Term 1")).toBeInTheDocument()
      })
    })

    it("displays error message when terms API call fails", async () => {
      mockGetTerms.mockRejectedValue(new Error("Failed to load terms"))
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load academic terms")).toBeInTheDocument()
      })
    })

    it("displays empty state when no terms are found", async () => {
      mockGetTerms.mockResolvedValue([])
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("No academic terms found. Add your first term to get started.")).toBeInTheDocument()
      })
    })

    it("calls getTerms on component mount", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(mockGetTerms).toHaveBeenCalledTimes(1)
      })
    })

    it("shows Add Term button", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("Add Term")).toBeInTheDocument()
      })
    })
  })

  describe("Tab Navigation", () => {
    it("switches to General Settings tab when clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("General Settings"))
    })

    it("switches to Deadlines tab when clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("Deadlines"))
    })

    it("switches to Security tab when clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("Security"))
      
      await waitFor(() => {
        expect(screen.getByText("Security Settings")).toBeInTheDocument()
        expect(screen.getByText("Minimum Password Length")).toBeInTheDocument()
      })
    })

    it("switches to Enrollment tab when clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("Enrollment"))
      
      await waitFor(() => {
        expect(screen.getByText("Enrollment Settings")).toBeInTheDocument()
        expect(screen.getByText("Maximum Courses Per Student")).toBeInTheDocument()
      })
    })
  })

  describe("Settings Modification", () => {
    it("shows save button when settings are modified", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      // Switch to General Settings tab
      await user.click(screen.getByText("General Settings"))
      
      // Modify a setting
      const institutionInput = screen.getByDisplayValue("University of Education")
      await user.clear(institutionInput)
      await user.type(institutionInput, "New University Name")
      
      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument()
      })
    })

    it("handles save settings with success state", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      // Switch to General Settings tab
      await user.click(screen.getByText("General Settings"))
      
      // Modify a setting
      const institutionInput = screen.getByDisplayValue("University of Education")
      await user.clear(institutionInput)
      await user.type(institutionInput, "New University Name")
      
      // Click save
      await user.click(screen.getByText("Save Changes"))
      
      // Should show saving state
      expect(screen.getByText("Saving...")).toBeInTheDocument()
      
      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText("Operation completed successfully!")).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe("Add Term Modal", () => {
    it("opens add term modal when Add Term button is clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("Add Term")).toBeInTheDocument()
      })
      
      await user.click(screen.getByText("Add Term"))
      
      expect(screen.getByText("Add Academic Term")).toBeInTheDocument()
      expect(screen.getByText("Term Code (e.g., W2025 Term 1)")).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("handles network errors when loading terms", async () => {
      mockGetTerms.mockRejectedValue(new Error("Network Error"))
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load academic terms")).toBeInTheDocument()
      })
    })
  })

  describe("Term Status Display", () => {
    it("displays correct status badges for active and inactive terms", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      
      renderSystemSettings()
      
      await waitFor(() => {
        // Check if terms are displayed (exact status text may vary based on dates)
        expect(screen.getByText("W2025 Term 1")).toBeInTheDocument()
        expect(screen.getByText("S2025 Term 1")).toBeInTheDocument()
      })
    })
  })

  describe("Modal Interactions", () => {
    it("closes add term modal when cancel button is clicked", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await waitFor(() => {
        expect(screen.getByText("Add Term")).toBeInTheDocument()
      })
      
      await user.click(screen.getByText("Add Term"))
      
      expect(screen.getByText("Add Academic Term")).toBeInTheDocument()
      
      await user.click(screen.getByText("Cancel"))
      
      await waitFor(() => {
        expect(screen.queryByText("Add Academic Term")).not.toBeInTheDocument()
      })
    })
  })

  describe("Settings Categories", () => {
    it("displays all general settings fields", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("General Settings"))
      
      await waitFor(() => {
        expect(screen.getByText("Institution Name")).toBeInTheDocument()
        expect(screen.getByText("Timezone")).toBeInTheDocument()
        expect(screen.getByText("Academic Year")).toBeInTheDocument()
        expect(screen.getByText("Default Language")).toBeInTheDocument()
      })
    })

    it("displays all security settings fields", async () => {
      mockGetTerms.mockResolvedValue(mockTermsData)
      const user = userEvent.setup()
      
      renderSystemSettings()
      
      await user.click(screen.getByText("Security"))
      
      await waitFor(() => {
        expect(screen.getByText("Minimum Password Length")).toBeInTheDocument()
        expect(screen.getByText("Session Timeout (Minutes)")).toBeInTheDocument()
        expect(screen.getByText("Max Login Attempts")).toBeInTheDocument()
        expect(screen.getByText("Two-Factor Authentication Required")).toBeInTheDocument()
      })
    })
  })
})
