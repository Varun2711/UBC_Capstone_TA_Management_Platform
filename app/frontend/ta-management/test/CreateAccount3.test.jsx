import { describe, it, expect, vi, beforeEach } from "vitest"
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    patch: vi.fn(),
  }
}))
import axios from "axios"          // now gets the mocked version
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import CreateAccount3 from "../src/pages/CreateAccount3"

// mockNavigate stays the same
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// helper and describe blocks follow…


// Helper function to render CreateAccount3 wrapped in MemoryRouter for routing context
const renderStep3 = () => {
  return render(
    <MemoryRouter>
      <CreateAccount3 />
    </MemoryRouter>
  )
}

describe("CreateAccount3", () => {
  // Reset mocks and clear/set sessionStorage before each test
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    // Set up session Storage to simulate previous steps' data
    sessionStorage.setItem(
      "createAccount1",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        ubcStudentNumber: "12345678",
      }),
    )
    sessionStorage.setItem(
      "createAccount2",
      JSON.stringify({
        degreeProgram: "Bachelor of Science",
        yearOfDegreeStart: "2021", // ✅ FIX: Changed from "yearOfDegree: '3rd Year'" to actual year
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
    sessionStorage.clear() // Clear all sessionStorage data to simulate missing data
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
  // ...existing code...

  // Test error message shows if passwords don't match when submitting the form
  it("shows error when passwords don't match", async () => {
    renderStep3()
    const user = userEvent.setup()

    // Get inputs and done button
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    // Fill out email and mismatching passwords
    await user.type(emailInput, "john@example.com")
    await user.type(passwordInput, "ValidPass1!")
    await user.type(confirmPasswordInput, "DifferentPass1!")

    // Click done button to submit form
    await user.click(doneButton)

    // Wait for the error message to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match!")).toBeInTheDocument()
    })
  })

  // Test successful account creation flow with valid data (mock the API calls)
  it("completes account creation when form is valid", async () => {
    // configure your two sequential post calls
    axios.post
      .mockResolvedValueOnce({
        data: { message: "Account created successfully" },
      }) // register call
      .mockResolvedValueOnce({ data: { access: "mock-token" } }) // login call
    axios.patch.mockResolvedValue({ data: {} }) // profile update call

    renderStep3()
    const user = userEvent.setup()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    // Fill out email and matching, valid passwords
    const validPassword = "Password123!"
    await user.type(emailInput, "john@example.com")
    await user.type(passwordInput, validPassword)
    await user.type(confirmPasswordInput, validPassword)

    // Submit the form
    await user.click(doneButton)

    // Wait for navigation to student dashboard
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard")
    )

    // ✅ FIX: Test the actual calls that are made
    expect(axios.post).toHaveBeenCalledTimes(2)
    
    // First call should be register
    expect(axios.post).toHaveBeenNthCalledWith(1,
      "http://localhost:8080/api/auth/register/",
      expect.objectContaining({
        student_number: "12345678",
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!", // Corrected password value
        study_level: "Bachelor of Science",
        program: "Computer Science",
        minor: "",
        year_degree_start: 2021
      })
    )
    
    // Second call should be login
    expect(axios.post).toHaveBeenNthCalledWith(2,
      "http://localhost:8080/api/auth/login/",
      {
        email: "john@example.com",
        password: "Password123!" // Corrected password value
      }
    )

    // ✅ FIX: Also verify the profile patch call
    expect(axios.patch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile/me/update/",
      {
        student_profile: {
          minor: "",
          year_degree_start: 2021,
        }
      },
      {
        headers: { Authorization: "Bearer mock-token" }
      }
    )
  })
})