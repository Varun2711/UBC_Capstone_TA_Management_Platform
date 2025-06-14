import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import CreateAccount1 from "../src/pages/CreateAccount1"

// Mock navigate function to test navigation without actually changing routes
const mockNavigate = vi.fn()

// Mock react-router-dom's useNavigate to use our mockNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Utility function to render the CreateAccount1 component wrapped in MemoryRouter
// MemoryRouter simulates routing context for the test environment
const renderStep1 = () => {
  return render(
    <MemoryRouter>
      <CreateAccount1 />
    </MemoryRouter>
  )
}

describe("CreateAccount1", () => {
  // Reset mocks and clear localStorage before each test to avoid test interference
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // Test to verify that the form renders all expected elements
  it("renders the step 1 form correctly", () => {
    renderStep1()

    expect(screen.getByText("Create an Account (1/3)")).toBeInTheDocument()
    expect(screen.getByText("1. About You")).toBeInTheDocument()

    // Check presence of inputs with labels for accessibility
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()

    const studentNumberInput = screen.getByLabelText(/ubc student number/i)
    expect(studentNumberInput).toBeInTheDocument()
    expect(studentNumberInput).toHaveAttribute("type", "number") // Ensure correct input type

    // Check that the "Next" button is present
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()
  })

  // Test that typing in inputs updates their values correctly
  it("updates form data when inputs change", async () => {
    renderStep1()
    const user = userEvent.setup()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)

    // Use userEvent.type to simulate realistic typing
    await user.type(firstNameInput, "John")
    await user.type(lastNameInput, "Doe")
    await user.type(studentNumberInput, "12345678")

    // Validate that the input values have been updated
    expect(firstNameInput).toHaveValue("John")
    expect(lastNameInput).toHaveValue("Doe")
    expect(studentNumberInput).toHaveValue(12345678)
  })

  // Test form submission: data saved to localStorage and navigation occurs
  it("saves data to localStorage and navigates to step 2 on form submission", async () => {
    renderStep1()
    const user = userEvent.setup()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    // Fill out the form fields
    await user.type(firstNameInput, "John")
    await user.type(lastNameInput, "Doe")
    await user.type(studentNumberInput, "12345678")

    // Click the "Next" button to submit
    await user.click(nextButton)

    // Verify localStorage has the expected saved data
    const savedData = JSON.parse(localStorage.getItem("createAccount1"))
    expect(savedData).toEqual({
      firstName: "John",
      lastName: "Doe",
      ubcStudentNumber: "12345678",
    })

    // Verify navigation to step 2 was triggered
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step2")
  })

  // Test that all form inputs have the 'required' attribute set
  it("requires all fields to be filled", () => {
    renderStep1()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)

    expect(firstNameInput).toHaveAttribute("required")
    expect(lastNameInput).toHaveAttribute("required")
    expect(studentNumberInput).toHaveAttribute("required")
  })
})
