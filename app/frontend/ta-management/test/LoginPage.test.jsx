import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import LoginPage from "../src/pages/LoginPage"
import axios from "axios"

// Test logn credentials for student (todo: probably put these somewhere else as we have more of them)
const validEmail = "asmith@capstone.ca"
const validPassword = "password123"
const invalidEmail = "zendaya@gmail.com"
const invalidPassword = "cupcake"

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
    localStorage.clear()
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

  it("requires email and password fields", () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })

  describe("login with valid credentials", () => {    
    // todo: add test cases for other user groups once we are able to test them
    // currently, just tests student

    beforeEach(() => {
      vi.clearAllMocks()
      localStorage.clear()
    })

    it("if student account, stores access tokens and navigates to student dashboard", async () => {
      renderLoginPage()
      const user = userEvent.setup()

      // mock a normal response from /auth
      axios.post.mockResolvedValue({
        data: {
          access: 'ACCESS_TOKEN',
          refresh: 'REFRESH_TOKEN',
        },
      })
      
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole("button", { name: /login/i })

      await user.type(emailInput, validEmail)
      await user.type(passwordInput, validPassword)
      await user.click(submitButton)
    
      // check that tokens were stored
      expect(localStorage.getItem('accessToken')).toBe('ACCESS_TOKEN')
      expect(localStorage.getItem('refreshToken')).toBe('REFRESH_TOKEN')

      // check that navigated to correct dashboard
      expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard")
    })

  })

  describe("login with invalid credentials", () => {
    it("displays an error message and does not store access tokens", async () => {
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

      await user.type(emailInput, invalidEmail)
      await user.type(passwordInput, invalidPassword)
      await user.click(submitButton)

      // check for error message
      expect(screen.getByRole("alert")).toHaveTextContent(/login failed/i);

      // check that does not have access tokens
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
    })
  })
})
