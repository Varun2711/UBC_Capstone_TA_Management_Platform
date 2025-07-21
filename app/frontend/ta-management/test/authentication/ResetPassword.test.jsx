import { describe, it, expect, vi, beforeEach } from "vitest"
import EmailStep from "@/pages/ResetPassword/EmailStep"
import userEvent from "@testing-library/user-event"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import VerifyIdStep from "@/pages/ResetPassword/VerifyIdStep"
import NewPasswordStep from "@/pages/ResetPassword/NewPasswordStep"
import SuccessStep from "@/pages/ResetPassword/SuccessStep"
import ResetPasswordController from "@/pages/ResetPassword/ResetPasswordController"

// helper functions to render pages wrapped in memoryrouter

// master page that /forgot-password routes to in the actual application
const renderResetPassword = () => {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ResetPasswordController />
    </MemoryRouter>
  )
}

// individual pages to test each step of the process
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

// mock api requests
vi.mock("@hooks/useResetPassword", () => ({
    requestPasswordReset: vi.fn().mockResolvedValue({ valid: true }),
}))

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

  // test program flow/behavior with good input --------------------------------------

  it('executes each step of reset password flow in sequence when valid user input provided', async () => {
      // Set up
      renderResetPassword();
      const user = userEvent.setup()

      // STEP 1:
      // Type email into input field
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "johncena@wwe.com");

      // Click "next" button
      let nextButton = screen.getByRole("button", {name: /next/i });
      await userEvent.click(nextButton);
      
      // Ensure that step 2 renders
      await waitFor(() => {
        expect(screen.getByRole("heading"), { name: /confirm your identity/i }).toBeInTheDocument();
      })

      // STEP 2:
      // Type id into input field
      const idInput = screen.getByLabelText(/student or employee id/i);
      await user.type(idInput, "12345678");

      // Click "next" button
      nextButton = screen.getByRole("button", {name: /next/i });
      await userEvent.click(nextButton);

      // Ensure that step 3 renders
      await waitFor(() => {
        expect(screen.getByRole("heading"), { name: /set new password/i }).toBeInTheDocument();
      })

      // STEP 3:
      // Type new password and confirm password into input fields
      const passInput = screen.getByLabelText(/new password/i);
      const confirmPassInput = screen.getByLabelText(/confirm password/i);

      // password must be at least 8 characters
      await user.type(passInput, "Banana#1");
      await user.type(confirmPassInput, "Banana#1");

      // Click "next" button
      const resetPassButton = screen.getByRole("button", { name: /reset password/i });
      await userEvent.click(resetPassButton);

      // Ensure that step 4 (success) renders
      await waitFor(() => {
        expect(screen.getByRole("heading"), { name: /success!/i }).toBeInTheDocument();
      })
  })
})