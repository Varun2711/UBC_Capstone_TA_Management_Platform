import { describe, it, expect, vi, beforeEach } from "vitest"
import EmailStep from "@/pages/ResetPassword/EmailStep"
import userEvent from "@testing-library/user-event"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import VerifyIdStep from "@/pages/ResetPassword/VerifyIdStep"
import NewPasswordStep from "@/pages/ResetPassword/NewPasswordStep"
import SuccessStep from "@/pages/ResetPassword/SuccessStep"

// helper functions to render the pages wrapped in memoryrouter
const renderStep1 = () => {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <EmailStep />
    </MemoryRouter>
  )
}

const renderStep2 = () => {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <VerifyIdStep />
    </MemoryRouter>
  )
}

const renderStep3 = () => {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <NewPasswordStep />
    </MemoryRouter>
  )
}

const renderStep4 = () => {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <SuccessStep />
    </MemoryRouter>
  )
}

// begin tests
describe('Reset Password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // test basic page rendering --------------------------------------------------
  it('renders step 1 - email lookup correctly', () => {
    renderStep1();

    // breadcrumb
    const homeLink = screen.getByRole("link", { name: "Home" })
    expect(homeLink).toHaveAttribute("href", "/")

    const loginLink = screen.getByRole("link", { name: "Login" })
    expect(loginLink).toHaveAttribute("href", "/login")

    expect(screen.getByRole("link", {name: "Forgot Password"})).toBeInTheDocument()

    // heading and page description
    expect(screen.getByRole("heading"), { name: /forgot password/i }).toBeInTheDocument();
    expect(screen.getByText(/enter the email address associated with your account/i)).toBeInTheDocument();

    // email input field
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument()

    // "next" button
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()

    // Back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('renders step 2 - verify identity correctly', () => {
    renderStep2();

    // breadcrumb
    const homeLink = screen.getByRole("link", { name: "Home" })
    expect(homeLink).toHaveAttribute("href", "/")

    const loginLink = screen.getByRole("link", { name: "Login" })
    expect(loginLink).toHaveAttribute("href", "/login")

    expect(screen.getByRole("link", {name: "Forgot Password"})).toBeInTheDocument()

    // heading and page description
    expect(screen.getByRole("heading"), { name: /confirm your identity/i }).toBeInTheDocument();
    expect(screen.getByText(/verify your identity by entering the student or employee number associated with your account/i)).toBeInTheDocument();

    // student/employee id field
    expect(screen.getByLabelText(/student or employee id/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your student or employee id/i)).toBeInTheDocument()

    // "next" button
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()

    // Back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('renders step 3 - set new password correclty', () => {
    renderStep3();

    // breadcrumb
    const homeLink = screen.getByRole("link", { name: "Home" })
    expect(homeLink).toHaveAttribute("href", "/")

    const loginLink = screen.getByRole("link", { name: "Login" })
    expect(loginLink).toHaveAttribute("href", "/login")

    expect(screen.getByRole("link", {name: "Forgot Password"})).toBeInTheDocument()

    // heading and page description
    expect(screen.getByRole("heading"), { name: /set new password/i }).toBeInTheDocument();
    expect(screen.getByText(/enter a new password to be used for your account./i)).toBeInTheDocument();
    expect(screen.getByText(/password requirements:/i)).toBeInTheDocument();
    expect(screen.getByText(/≥ 8 characters in length/i)).toBeInTheDocument();

    // new password input field
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter a new password/i)).toBeInTheDocument()

    // confirm password input field
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument()

    // "reset password" button
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument()

    // Back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('renders step 4 - success correctly', () => {
    renderStep4();

    // breadcrumb
    const homeLink = screen.getByRole("link", { name: "Home" })
    expect(homeLink).toHaveAttribute("href", "/")

    const loginLink = screen.getByRole("link", { name: "Login" })
    expect(loginLink).toHaveAttribute("href", "/login")

    expect(screen.getByRole("link", {name: "Forgot Password"})).toBeInTheDocument()

    // heading and page description
    expect(screen.getByRole("heading"), { name: /success!/i }).toBeInTheDocument();
    expect(screen.getByText(/your password has been reset and you may now/i)).toBeInTheDocument();
    expect(screen.getByRole("link", {name: "login"})).toBeInTheDocument()
  })
})