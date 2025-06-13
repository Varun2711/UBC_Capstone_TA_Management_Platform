import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import CreateAccount3 from "../src/pages/CreateAccount3"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderStep3 = () => {
  return render(
    <BrowserRouter>
      <CreateAccount3 />
    </BrowserRouter>,
  )
}

describe("CreateAccount3", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Set up previous steps data
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

  it("renders the step 3 form correctly", () => {
    renderStep3()

    expect(screen.getByText("Create an Account (3/3)")).toBeInTheDocument()
    expect(screen.getByText("3. Account Details")).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument()
  })

  it("redirects to step 1 if previous steps data is missing", () => {
    localStorage.clear()
    renderStep3()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  it("toggles password visibility", () => {
    renderStep3()

    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const toggleButtons = screen.getAllByRole("button", { name: "" })

    expect(passwordInput).toHaveAttribute("type", "password")
    expect(confirmPasswordInput).toHaveAttribute("type", "password")

    // Click first toggle button (password)
    fireEvent.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute("type", "text")

    // Click second toggle button (confirm password)
    fireEvent.click(toggleButtons[1])
    expect(confirmPasswordInput).toHaveAttribute("type", "text")
  })

  it("shows alert when passwords don't match", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
    renderStep3()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    fireEvent.change(emailInput, { target: { value: "john@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })
    fireEvent.change(confirmPasswordInput, { target: { value: "password456" } })

    fireEvent.click(doneButton)

    expect(alertSpy).toHaveBeenCalledWith("Passwords don't match!")
  })

  it("completes account creation when form is valid", () => {
    const consoleSpy = vi.spyOn(console, "log")
    renderStep3()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const doneButton = screen.getByRole("button", { name: /done/i })

    fireEvent.change(emailInput, { target: { value: "john@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } })

    fireEvent.click(doneButton)

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
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("navigates to step 2 when prev button is clicked", () => {
    renderStep3()

    const prevButton = screen.getByRole("button", { name: /prev/i })
    fireEvent.click(prevButton)

    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step2")
  })
})
