import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import LoginPage from "../../src/pages/LoginPage"
import axios from "axios"
import { USERS } from "../test-utils/testUsers"

// Mocking
const mockNavigate = vi.fn()
vi.mock('axios')

// Mock react-router-dom's useNavigate to use our mockNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Constants to mock access tokens
const ACCESS_TOKEN = "ACCESS_TOKEN"
const REFERSH_TOKEN = "REFRESH_TOKEN"

// Set up helper fn. that wraps component with MemoryRouter (for testing)
const renderLoginPage = () => {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginPage />
    </MemoryRouter>,
  )
}

// Start of tests
describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  // Basic form behavior

  it("renders the login form correctly", () => {
    renderLoginPage()

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument()
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

  it("requires email and password fields", () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })

  // Valid login for each user type
  it.each(USERS)(
    "logs in $type with valid credentials and navigates to $type dashboard",
    async ({ type, email, password, dashboardRoute }) => {
      // mock a normal response from /auth
      axios.post.mockResolvedValue({
        data: {
          access: ACCESS_TOKEN,
          refresh: REFERSH_TOKEN,
          user_type: type
        },
      })
      
      renderLoginPage()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole("button", { name: /sign in/i })

      await user.type(emailInput, email)
      await user.type(passwordInput, password)
      await user.click(submitButton)
    
      // check that tokens were stored
      expect(sessionStorage.getItem('accessToken')).toBe(ACCESS_TOKEN)
      expect(sessionStorage.getItem('refreshToken')).toBe(REFERSH_TOKEN)

      // check that navigated to correct dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(dashboardRoute)
      })
    }
  )

  // Bad login credentials
  it("displays error on login with invalid credentials", async () => {
    renderLoginPage()
      const user = userEvent.setup()
      
      // mock an error response from /auth
      axios.post.mockRejectedValueOnce({
        response: {
          status: '404',
          data: {error: 'User not found'},
        },
      })

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole("button", { name: /sign in/i })

      await user.type(emailInput, "notanemail@gmail.com")
      await user.type(passwordInput, "unicorn")
      await user.click(submitButton)

      // check for error message
      expect(screen.getByRole("alert")).toHaveTextContent(/login failed/i);

      // check that does NOT have access tokens
      expect(sessionStorage.getItem("accessToken")).toBeNull();
      expect(sessionStorage.getItem("refreshToken")).toBeNull();
  })

  // Already logged-in user should not be permitted to login again
  it.each(USERS)(
    "redirects $type to $type dashboard if already logged in",
    async ({ type, email, name, user_id, dashboardRoute }) => {
      // mock a normal response from /validate
      axios.get.mockResolvedValue({
        data: {
          valid: "true",
          user_id: user_id,
          user_type: type,
          name: name,
          email: email
        },
      })

      // simulate user already logged in
      sessionStorage.setItem("accessToken", ACCESS_TOKEN)
      sessionStorage.setItem("refreshToken", REFERSH_TOKEN)
      sessionStorage.setItem("user_type", type)
      
      renderLoginPage()
      
      // expect redirect since already logged in and cannot login again
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(dashboardRoute)
      })
    }
  )

})