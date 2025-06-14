import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import ForgotPassword from "../src/pages/ForgotPassword"

// Helper to render component with router context for Link
const renderForgotPassword = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>,
  )

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Check if form elements render properly
  it("renders the forgot password form correctly", () => {
    renderForgotPassword()

    // Heading and description text
    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument()
    expect(
      screen.getByText(/enter your email address and we'll send you a link/i),
    ).toBeInTheDocument()

    // Email input and placeholder
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument()

    // Submit button
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()

    // Back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  // Verify user can type in the email input
  it("updates email input when user types", async () => {
    renderForgotPassword()
    const user = userEvent.setup()

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, "test@example.com")

    expect(emailInput).toHaveValue("test@example.com")
  })

  // Simulate form submission and check loading state
  it("shows loading state when form is submitted", async () => {
    renderForgotPassword()
    const user = userEvent.setup()

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole("button", { name: /send reset link/i })

    await user.type(emailInput, "test@example.com")
    await user.click(submitButton)

    // Wait for loading text to appear
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /sending.../i })).toBeInTheDocument(),
    )
    expect(submitButton).toBeDisabled()
  })

  // Ensure email input has required attribute and correct input type
  it("requires email field to be filled", () => {
    renderForgotPassword()

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("required")
    expect(emailInput).toHaveAttribute("type", "email")
  })

  // Check accessibility-related attributes on form and inputs
  it("has proper accessibility attributes", () => {
    renderForgotPassword()

    // Form should have role="form"
    const form = screen.getByRole("form")
    expect(form).toBeInTheDocument()

    // Email input should have correct id and name
    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute("id", "email")
    expect(emailInput).toHaveAttribute("name", "email")
  })
})
