/*
 * Test file for rendering and behavior of Reset Password components
 */

// mock useResetPassword hook so that doesn't rely on docker containers for testing (have to do this at top of file before imports)
vi.mock('@/hooks/useResetPassword', () => {
  return {
    useResetPassword: () => ({
      requestAccountLookup: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: 'johncena@wwe.com',
          user_type: 'student',
          id_number: 63847593,
        },
      }),

      // todo, works for now, will adjust as i write the actual backend logic
      verifyId: vi.fn().mockResolvedValue(true),
      requestPasswordReset: vi.fn().mockResolvedValue(true),
    }),
  };
});

import { describe, it, expect, vi, beforeEach } from "vitest"
import EmailStep from "@/pages/ResetPassword/EmailStep"
import userEvent from "@testing-library/user-event"
import { getAllByRole, render, screen, waitFor } from "@testing-library/react"
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

  // test input validation error handling
  it('displays error message when email address not provided', async () => {
    renderStep1();

    // Click "next" button without inputting anything
    let nextButton = screen.getByRole("button", {name: /next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("alert"), {name: /email address is required/i });
    })
  })
  
  it('displays error message when inputted email address invalid', async () => {
    renderStep1();
    const user = userEvent.setup()

    // Type invalid email into input field
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, "spaghetti@");

    // Click "next" button
    let nextButton = screen.getByRole("button", {name: /next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("alert"), {name: /email address must be in valid format: name@example.com/i });
    })
  })

  it('displays error message when student/employee number not provided', async () => {
    renderStep2();

    // Click "next" button without inputting anything
    let nextButton = screen.getByRole("button", {name: /next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("alert"), {name: /student\/employee id is required/i });
    })
  })

  it('displays error message when inputted student/employee number invalid', async () => {
    renderStep2();
    const user = userEvent.setup()

    // Type invalid email into input field
      const idInput = screen.getByLabelText(/student or employee id/i);
      await user.type(idInput, "123"); // not enough digits

    // Click "next" button
    let nextButton = screen.getByRole("button", {name: /next/i });
    await userEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByRole("alert"), {name: /student\/employee id must be an 8 digit number/i });
    })
  })

  it('displays error messages when password/confirm password not provided', async () => {
    renderStep3();

    // Click "reset passsword" button without inputting anything
    let nextButton = screen.getByRole("button", {name: /reset password/i });
    await userEvent.click(nextButton);

    // Test that both error messages have correct role and display text
    const errorAlerts = await screen.findAllByRole("alert");
    expect(errorAlerts).toHaveLength(2)

    expect(screen.getByText("Password is required")).toBeInTheDocument()
    expect(screen.getByText("Confirm password is required")).toBeInTheDocument()
  })

  it('displays error message when password does not satisfy minimum requirements', async () => {
    // for now, this is just length >= 8
    renderStep3();
    const user = userEvent.setup()

    // Type new password and confirm password that do not meet password requirements (too short) into input fields
    const passInput = screen.getByLabelText(/new password/i);
    const confirmPassInput = screen.getByLabelText(/confirm password/i);

    await user.type(passInput, "123");
    await user.type(confirmPassInput, "123");

    // Click "reset passsword" button
    let nextButton = screen.getByRole("button", {name: /reset password/i });
    await userEvent.click(nextButton);

    expect(screen.getByRole("alert"), {name: /password must be at least 8 characters in length/i}).toBeInTheDocument();
  })

  it('displays error message when inputted passwords do not match', async () => {
    renderStep3();
    const user = userEvent.setup()

    // Type non-matching password and confirm password into input fields
    const passInput = screen.getByLabelText(/new password/i);
    const confirmPassInput = screen.getByLabelText(/confirm password/i);

    await user.type(passInput, "Orange#1");
    await user.type(confirmPassInput, "Banana#1");

    // Click "reset passsword" button
    let nextButton = screen.getByRole("button", {name: /reset password/i });
    await userEvent.click(nextButton);

    expect(screen.getByRole("alert"), {name: /passwords must match/i}).toBeInTheDocument();
  })

})