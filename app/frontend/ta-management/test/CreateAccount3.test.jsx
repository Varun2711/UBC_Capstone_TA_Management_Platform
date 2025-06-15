import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import CreateAccount3 from "../src/pages/CreateAccount3"

// Mock the navigate function to intercept navigation calls
const mockNavigate = vi.fn()

// Mock react-router-dom's useNavigate hook to use our mockNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper function to render CreateAccount3 wrapped in MemoryRouter for routing context
const renderStep3 = () => {
  return render(
    <MemoryRouter>
      <CreateAccount3 />
    </MemoryRouter>
  )
}

describe("CreateAccount3", () => {
  // Reset mocks and clear/set localStorage before each test
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Set up localStorage to simulate previous steps' data
    localStorage.setItem(
      "createAccount1",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        ubcStudentNumber: "12345678",
      }),
    )
    localStorage.setItem(
      "createAccount2",
      JSON.stringify({
        degreeProgram: "Bachelor of Science",
        yearOfDegree: "3rd Year",
        majorProgram: "Computer Science",
        minorProgram: "",
      }),
    )
  })

  // Test to verify the Step 3 form renders all expected elements
  it("renders the step 3 form correctly", () => {
    renderStep3()

    expect(screen.getByText("Create an Account (3/3)")).toBeInTheDocument()
    expect(screen.getByText("3. Account Details")).toBeInTheDocument()

    // Check presence of input fields with appropriate labels
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    // Check that "Prev" and "Done" buttons exist
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument()
  })

  // Test that user is redirected to step 1 if previous steps data is missing
  it("redirects to step 1 if previous steps data is missing", () => {
    localStorage.clear() // Clear all localStorage data to simulate missing data
    renderStep3()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  // Test password visibility toggling via the toggle buttons
  it("toggles password visibility", async () => {
    renderStep3()
    const user = userEvent.setup()

    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const toggleButtons = screen.getAllByRole("button", { name: "" }) // Toggle buttons have empty accessible name

    // Initially, both password fields should be masked
    expect(passwordInput).toHaveAttribute("type", "password")
    expect(confirmPasswordInput).toHaveAttribute("type", "password")

    // Click the first toggle button to show password
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute("type", "text")

    // Click the second toggle button to show confirm password
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput).toHaveAttribute("type", "text")
  })

  // Test alert shows if passwords don't match when submitting the form
  it("shows alert when passwords don't match", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
    renderStep3()
    const user = userEvent.setup()

    // Get inputs and done button
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    // Fill out email and mismatching passwords
    await user.type(emailInput, "john@example.com")
    await user.type(passwordInput, "password123")
    await user.type(confirmPasswordInput, "password456")

    // Click done button to submit form
    await user.click(doneButton)

    // Verify alert was called with the correct message
    expect(alertSpy).toHaveBeenCalledWith("Passwords don't match!")
  })

  // Test successful account creation flow with valid data
  it("completes account creation when form is valid", async () => {
    const consoleSpy = vi.spyOn(console, "log")
    renderStep3()
    const user = userEvent.setup()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    // Fill out email and matching passwords
    await user.type(emailInput, "john@example.com")
    await user.type(passwordInput, "password123")
    await user.type(confirmPasswordInput, "password123")

    // Submit the form
    await user.click(doneButton)

    // Verify console log contains expected data (partial check)
    expect(consoleSpy).toHaveBeenCalledWith(
      "Account creation completed:",
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
        ubcStudentNumber: "12345678",
        degreeProgram: "Bachelor of Science",
        email: "john@example.com",
      }),
    )

    // Verify navigation to login page
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  // Test navigation to step 2 when "Prev" button is clicked
  it("navigates to step 2 when prev button is clicked", async () => {
    renderStep3()
    const user = userEvent.setup()

    const prevButton = screen.getByRole("button", { name: /prev/i })
    await user.click(prevButton)

    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step2")
  })
})
