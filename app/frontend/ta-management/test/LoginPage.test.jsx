import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import LoginPage from "../src/pages/LoginPage"
import axios from "axios"
import { user_types, USERS } from "./test-utils/testUsers"

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
    localStorage.clear()
  })

  // Basic form behavior

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

  it("requires email and password fields", () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })

  // Valid login for each user type
  it.each(user_types)(
    "logs in $name with valid credentials and navigates to user-specific dashboard",
    async ({ name, email, password, dashboardRoute }) => {
      // mock a normal response from /auth
      axios.post.mockResolvedValue({
        data: {
          access: ACCESS_TOKEN,
          refresh: REFERSH_TOKEN,
          user_type: name
        },
      })
      
      renderLoginPage()
      const user = userEvent.setup()

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole("button", { name: /login/i })

      await user.type(emailInput, email)
      await user.type(passwordInput, password)
      await user.click(submitButton)
    
      // check that tokens were stored
      expect(localStorage.getItem('accessToken')).toBe(ACCESS_TOKEN)
      expect(localStorage.getItem('refreshToken')).toBe(REFERSH_TOKEN)

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
      const submitButton = screen.getByRole("button", { name: /login/i })

      await user.type(emailInput, "notanemail@gmail.com")
      await user.type(passwordInput, "unicorn")
      await user.click(submitButton)

      // check for error message
      expect(screen.getByRole("alert")).toHaveTextContent(/login failed/i);

      // check that does NOT have access tokens
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
  })

  // Login persistence
  it("redirects user to correct dashboard if access token exists in localStorage", async () => {
    // simulate student already logged in
    localStorage.setItem("accessToken", ACCESS_TOKEN)
    localStorage.setItem("user_type", user_types[USERS.student].name)

    renderLoginPage()

    // expect redirect since already logged in
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(user_types[USERS.student].dashboardRoute)
    })
  })
})