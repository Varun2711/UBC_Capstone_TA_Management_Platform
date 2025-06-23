import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import InstructorDashboard from "../src/pages/InstructorDashboard"

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

const renderInstructorDashboard = () => {
  return render(
    <MemoryRouter>
      <InstructorDashboard />
    </MemoryRouter>,
  )
}

describe("InstructorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the instructor dashboard correctly", () => {
    renderInstructorDashboard()

    // Check stats cards
    expect(screen.getByText("Active Courses")).toBeInTheDocument()
    expect(screen.getByText("Total TAs")).toBeInTheDocument()
    expect(screen.getByText("This Week's Classes")).toBeInTheDocument()
    expect(screen.getByText("Pending Requests")).toBeInTheDocument()

    // Check quick info section
    expect(screen.getByText("Quick Info")).toBeInTheDocument()
    expect(screen.getByText(/The TAs for your courses have not been assigned yet/)).toBeInTheDocument()

    // Check courses are displayed
    expect(screen.getByText("COSC 101")).toBeInTheDocument()
    expect(screen.getByText("COSC 221")).toBeInTheDocument()
    expect(screen.getByText("DATA 101")).toBeInTheDocument()
  })

  it("displays course details when a course is selected", async () => {
    const user = userEvent.setup()
    renderInstructorDashboard()

    // Click on COSC 221 course card
    const cosc221Card = screen.getByText("COSC 221").closest(".cursor-pointer")
    await user.click(cosc221Card)

    // Should show course detail view
    expect(screen.getByText("Assigned TAs")).toBeInTheDocument()
    expect(screen.getByText("Harry Potter")).toBeInTheDocument()
    expect(screen.getByText("Virat Kohli")).toBeInTheDocument()
    expect(screen.getByText("Cristiano Ronaldo")).toBeInTheDocument()

    // Should show schedule
    expect(screen.getByText("Lab and Schedule Details")).toBeInTheDocument()
    expect(screen.getByText("Monday")).toBeInTheDocument()
    expect(screen.getByText("Tuesday")).toBeInTheDocument()
  })

  it("allows navigation back to course overview", async () => {
    const user = userEvent.setup()
    renderInstructorDashboard()

    // Select a course first
    const courseCard = screen.getByText("COSC 101").closest(".cursor-pointer")
    await user.click(courseCard)

    // Should be in detail view
    expect(screen.getByText("Assigned TAs")).toBeInTheDocument()

    // Click back button
    const backButton = screen.getByText("Back to Courses")
    await user.click(backButton)

    // Should be back to overview
    expect(screen.getByText("View Assigned Courses")).toBeInTheDocument()
    expect(screen.getByText("Quick Info")).toBeInTheDocument()
  })

  it("handles course request submission", async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})

    renderInstructorDashboard()

    // Fill out the request form
    const courseSelect = screen.getByLabelText(/Select the course you want to request/i)
    const requestInput = screen.getByLabelText(/Enter your request/i)
    const submitButton = screen.getByRole("button", { name: /submit/i })

    await user.selectOptions(courseSelect, "COSC 101 - Digital Citizenship")
    await user.type(requestInput, "Need additional lab equipment")

    await user.click(submitButton)

    // Should show success message
    expect(alertSpy).toHaveBeenCalledWith("Request submitted successfully!")

    // Form should be cleared
    expect(courseSelect).toHaveValue("")
    expect(requestInput).toHaveValue("")
  })

  it("requires both course selection and request text", async () => {
    const user = userEvent.setup()
    renderInstructorDashboard()

    const submitButton = screen.getByRole("button", { name: /submit/i })

    // Try to submit without filling fields
    await user.click(submitButton)

    // Form validation should prevent submission
    const courseSelect = screen.getByLabelText(/Select the course you want to request/i)
    const requestInput = screen.getByLabelText(/Enter your request/i)

    expect(courseSelect).toHaveAttribute("required")
    expect(requestInput).toHaveAttribute("required")
  })

  it("displays schedule information correctly in course detail view", async () => {
    const user = userEvent.setup()
    renderInstructorDashboard()

    // Select COSC 221 to see schedule
    const cosc221Card = screen.getByText("COSC 221").closest(".cursor-pointer")
    await user.click(cosc221Card)

    // Check schedule table headers
    expect(screen.getByText("Monday")).toBeInTheDocument()
    expect(screen.getByText("Tuesday")).toBeInTheDocument()
    expect(screen.getByText("Wednesday")).toBeInTheDocument()
    expect(screen.getByText("Thursday")).toBeInTheDocument()
    expect(screen.getByText("Friday")).toBeInTheDocument()

    // Check time slots
    expect(screen.getByText("8:00 AM")).toBeInTheDocument()
    expect(screen.getByText("9:00 AM")).toBeInTheDocument()
    expect(screen.getByText("11:00 AM")).toBeInTheDocument()

    // Check specific schedule entries
    expect(screen.getByText(/COSC 221 - DH1 LAB 01/)).toBeInTheDocument()
  })

  it("shows correct course information in cards", () => {
    renderInstructorDashboard()

    // Check course cards content
    expect(screen.getByText("Digital Citizenship")).toBeInTheDocument()
    expect(screen.getByText("Discrete Structures")).toBeInTheDocument()
    expect(screen.getByText("Mining procedures with data")).toBeInTheDocument()

    // Check all courses have "View Assigned TAs" buttons
    const viewTAButtons = screen.getAllByText("View Assigned TAs")
    expect(viewTAButtons).toHaveLength(3)
  })

  it("displays stats correctly", () => {
    renderInstructorDashboard()

    // Check stats values
    expect(screen.getByText("3")).toBeInTheDocument() // Active Courses
    expect(screen.getByText("7")).toBeInTheDocument() // Total TAs
    expect(screen.getByText("12")).toBeInTheDocument() // This Week's Classes
    expect(screen.getByText("2")).toBeInTheDocument() // Pending Requests
  })

  it("shows course information in detail view", async () => {
    const user = userEvent.setup()
    renderInstructorDashboard()

    // Select a course
    const courseCard = screen.getByText("COSC 221").closest(".cursor-pointer")
    await user.click(courseCard)

    // Check course information card
    expect(screen.getByText("Course Information")).toBeInTheDocument()
    expect(screen.getByText("Total TAs:")).toBeInTheDocument()
    expect(screen.getByText("Status:")).toBeInTheDocument()
    expect(screen.getByText("Weekly Hours:")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("has proper accessibility attributes", () => {
    renderInstructorDashboard()

    // Check form labels
    expect(screen.getByLabelText(/Select the course you want to request/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Enter your request/i)).toBeInTheDocument()

    // Check required fields
    const courseSelect = screen.getByLabelText(/Select the course you want to request/i)
    const requestInput = screen.getByLabelText(/Enter your request/i)

    expect(courseSelect).toHaveAttribute("required")
    expect(requestInput).toHaveAttribute("required")
  })

  it("renders sidebar navigation correctly", () => {
    renderInstructorDashboard()

    // Check sidebar elements
    expect(screen.getByText("UBC CMPS")).toBeInTheDocument()
    expect(screen.getByText("Instructor Portal")).toBeInTheDocument()
    expect(screen.getByText("Navigation")).toBeInTheDocument()
  })

})
