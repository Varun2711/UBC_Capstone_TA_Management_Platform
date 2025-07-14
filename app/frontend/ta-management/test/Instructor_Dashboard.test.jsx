import { vi, describe, it, expect, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import InstructorDashboard from "@/pages/InstructorDashboard"

// --- MOCKS ---

// 🎯 FIX 1: Mock the child component to prevent its async useEffect from running.
// This isolates the dashboard and is the primary fix for the unhandled rejection.
vi.mock("@/components/instructor-dashboard-sidebar", () => ({
  InstructorSidebar: vi.fn(() => {
    return <div data-testid="mock-sidebar">Mocked Instructor Sidebar</div>
  }),
}))

// 🎯 FIX 2: Mock window.matchMedia for any responsive UI components.
// This is a standard fix for "window is not defined" errors from UI libraries.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <InstructorDashboard />
    </MemoryRouter>
  )
}

describe("InstructorDashboard", () => {
  it("renders the dashboard overview with stats and course list", () => {
    renderWithRouter()

    // Check that the mocked sidebar is present
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument()

    // Check for the welcome message and stats
    expect(screen.getByRole("heading", { name: /ronnie smith/i })).toBeInTheDocument()
    expect(screen.getByText("Active Courses")).toBeInTheDocument()
    expect(screen.getByText("Total TAs")).toBeInTheDocument()

    // Check that course cards are rendered
    expect(screen.getByText("COSC 101")).toBeInTheDocument()
    expect(screen.getByText("COSC 221")).toBeInTheDocument()
  })

  it("renders the TA qualifications request form correctly", () => {
    renderWithRouter()

    // Check for the form card and its elements
    expect(screen.getByText("Request TA Preferred Qualifications")).toBeInTheDocument()
    expect(screen.getByLabelText(/select the course/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/enter your request/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument()
  })

  it("navigates to the course detail view when a course card is clicked", async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // Find and click a course card
    const courseCard = screen.getByText("COSC 221").closest("div")
    await user.click(courseCard)

    // Check that the view has updated to the course detail page
    expect(screen.getByRole("heading", { name: /cosc 221/i })).toBeInTheDocument()
    expect(screen.getByText("Discrete Structures")).toBeInTheDocument()
    expect(screen.getByText("Assigned TAs")).toBeInTheDocument()
    expect(screen.getByText("Harry Potter")).toBeInTheDocument()

    // Check that the main dashboard content is gone
    expect(screen.queryByRole("heading", { name: /ronnie smith/i })).not.toBeInTheDocument()
  })

  it("navigates back to the dashboard from the course detail view", async () => {
    const user = userEvent.setup()
    renderWithRouter()

    // First, navigate to the detail view
    const courseCard = screen.getByText("COSC 221").closest("div")
    await user.click(courseCard)

    // Now, find the "Back to Courses" button and click it
    const backButton = screen.getByRole("button", { name: /back to courses/i })
    await user.click(backButton)

    // Check that we are back on the main dashboard
    expect(screen.getByRole("heading", { name: /ronnie smith/i })).toBeInTheDocument()
    expect(screen.getByText("Active Courses")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /cosc 221/i })).not.toBeInTheDocument()
  })
})