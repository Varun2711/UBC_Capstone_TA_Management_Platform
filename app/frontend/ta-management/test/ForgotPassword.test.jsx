import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import ForgotPassword from "../src/pages/ForgotPassword"

// Wrap component with BrowserRouter for Link components
const renderForgotPassword = () => {
  return render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>,
  )
}

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the forgot password form correctly", () => {
    renderForgotPassword()

    // Check if the heading and description are rendered
    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument()
    expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument()

    // Check if email input is rendered
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument()

    // Check if the submit button is rendered
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()

    // Check if the back to login link is rendered
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it("updates email input when user types", () => {
    renderForgotPassword()

    const emailInput = screen.getByLabelText(/email address/i)

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })

    expect(emailInput.value).toBe("test@example.com")
  })

  it("shows loading state when form is submitted", async () => {
    renderForgotPassword()

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole("button", { name: /send reset link/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.click(submitButton)

    // Check if loading state is shown
    expect(screen.getByRole("button", { name: /sending.../i })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it("requires email field to be filled", () => {
    renderForgotPassword()

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("required")
    expect(emailInput).toHaveAttribute("type", "email")
  })

  it("has proper accessibility attributes", () => {
    renderForgotPassword()

    // Check if form has proper role
    const form = screen.getByRole("form")
    expect(form).toBeInTheDocument()

    // Check if email input has proper labeling
    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("id", "email")
    expect(emailInput).toHaveAttribute("name", "email")
  })
})