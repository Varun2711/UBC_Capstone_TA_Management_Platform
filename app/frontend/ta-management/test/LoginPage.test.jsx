import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import LoginPage from "../src/pages/LoginPage"

// Mock the form submission
const mockSubmit = vi.fn()

// Wrap component with BrowserRouter for Link components
const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>,
  )
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the login form correctly", () => {
    renderLoginPage()

    // Check if the heading is rendered
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument()

    // Check if email and password inputs are rendered
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

    // Check if the login button is rendered
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument()

    // Check if the links are rendered
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })

  it("toggles password visibility when the eye icon is clicked", () => {
    renderLoginPage()

    // Get the password input and eye button
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole("button", { name: "" })

    // Password should be hidden initially
    expect(passwordInput).toHaveAttribute("type", "password")

    // Click the eye icon to show password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute("type", "text")

    // Click again to hide password
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("submits the form with email and password", () => {
    // Override the console.log to check if it's called
    const consoleSpy = vi.spyOn(console, "log")

    renderLoginPage()

    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /login/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })

    // Submit the form
    fireEvent.click(submitButton)

    // Check if console.log was called with the expected message
    expect(consoleSpy).toHaveBeenCalledWith("Login form submitted")
  })

  it("requires email and password fields", () => {
    renderLoginPage()

    // Check if email and password inputs have the required attribute
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })
})
