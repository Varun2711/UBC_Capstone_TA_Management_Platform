import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import LoginPage from "../src/pages/LoginPage"

// Mock the form submission
const mockSubmit = vi.fn()

// Wrap component with MemoryRouter for testing
const renderLoginPage = () => {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the login form correctly", () => {
    renderLoginPage()

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })

  it("toggles password visibility when the eye icon is clicked", async () => {
    renderLoginPage()

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole("button", { name: "" })

    expect(passwordInput).toHaveAttribute("type", "password")

    await userEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute("type", "text")

    await userEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("submits the form with email and password", async () => {
    const consoleSpy = vi.spyOn(console, "log")

    renderLoginPage()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /login/i })

    await userEvent.type(emailInput, "test@example.com")
    await userEvent.type(passwordInput, "password123")
    await userEvent.click(submitButton)

    expect(consoleSpy).toHaveBeenCalledWith("Login form submitted")
  })

  it("requires email and password fields", () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })
})
