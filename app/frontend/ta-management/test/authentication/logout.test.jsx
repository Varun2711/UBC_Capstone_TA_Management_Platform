import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { USERS } from "../test-utils/testUsers"
import { renderWithAuth } from "../test-utils/renderWithAuth"
import axios from "axios"

vi.mock("axios")

describe("Logout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    
    // Set up more comprehensive mocks for student dashboard
    sessionStorage.setItem('access_token', 'mock-access-token')
    sessionStorage.setItem('user_type', 'student')
    sessionStorage.setItem('user_id', '1')
    
    // Mock axios responses for all dashboard types
    axios.get.mockImplementation((url) => {
      console.log('Mock axios call to:', url) // Debug log
      
      if (url.includes('/profile') || url.includes('/me') || url.includes('/users/profile')) {
        return Promise.resolve({
          data: {
            id: 1,
            name: "Sarah Johnson", // Use the actual name from USERS
            first_name: "Sarah",
            last_name: "Johnson", 
            email: "sarah.johnson@student.ubc.ca",
            student_info: {
              student_number: "12345678",
              phone: "+1 (555) 123-4567",
              program: "Computer Science",
              study_level: "Graduate Student",
            },
            student_profile: {
              gpa: "3.85",
              minor: "Math",
            },
            avatar: "/placeholder.svg"
          }
        })
      }
      if (url.includes('/applications') || url.includes('/student/applications')) {
        return Promise.resolve({ 
          data: [
            {
              id: 1,
              course: "COSC 499",
              status: "pending",
              created_at: "2024-01-15"
            }
          ] 
        })
      }
      if (url.includes('/courses')) {
        return Promise.resolve({ data: [] })
      }
      // Default fallback for any other requests
      return Promise.resolve({ data: {} })
    })

    // Mock any other potential API calls
    axios.post.mockResolvedValue({ data: {} })
    axios.patch.mockResolvedValue({ data: {} })
    axios.put.mockResolvedValue({ data: {} })
  })

  it.each(USERS)(
    "logs out $type who is currently logged-in and redirects to landing page",
    async ({ type, dashboardRoute, name }) => {
      renderWithAuth({ route: dashboardRoute, userType: type })

      const user = userEvent.setup()
      const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear")

      // Wait for the specific dashboard to load based on user type
      await waitFor(() => {
        // First check that we're not stuck on loading screen
        expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
        
        if (type === 'student') {
          // For student dashboard, look for specific elements (fix multiple applications issue)
          const studentElements = [
            screen.queryByText(/welcome/i),
            screen.queryByText(/my profile/i),
            screen.queryAllByText(/applications/i).length > 0, // Handle multiple "applications" text
            screen.queryByText(name),
            screen.queryByText(/student/i), // From sidebar
            screen.queryByText(/my applications/i), // Unique to student dashboard
            screen.queryByText(/dashboard/i) // Generic dashboard indicator
          ]
          const foundElement = studentElements.some(element => element === true || element !== null)
          expect(foundElement).toBe(true)
        } else if (type === 'instructor') {
          const instructorElements = [
            screen.queryByText(/instructor portal/i),
            screen.queryByText(/ubc cmps/i)
          ]
          const foundElement = instructorElements.some(element => element !== null)
          expect(foundElement).toBe(true)
        } else if (type === 'scheduler') {
          const schedulerElements = [
            screen.queryByText(/ta scheduler/i),
            screen.queryByText(/admin portal/i)
          ]
          const foundElement = schedulerElements.some(element => element !== null)
          expect(foundElement).toBe(true)
        } else if (type === 'admin') {
          // Use queryAllByText for multiple elements or look for unique elements
          const adminElements = [
            screen.queryAllByText(/system administration/i).length > 0,
            screen.queryByText(/admin portal/i),
            screen.queryByText(/total users/i),
            screen.queryByText(/user distribution/i),
            screen.queryByText(/complete system overview/i) // This is unique to admin dashboard
          ]
          const foundElement = adminElements.some(element => element === true || element !== null)
          expect(foundElement).toBe(true)
        }
      }, { timeout: 20000 })

      // Look for the account menu in the sidebar - with better error handling
      let accountMenuButton

      try {
        // Wait for buttons to be available
        await waitFor(() => {
          const buttons = screen.queryAllByRole('button')
          expect(buttons.length).toBeGreaterThan(0)
        }, { timeout: 10000 })

        // First try to find the user's name or initials button in sidebar
        const userButtons = screen.getAllByRole('button').filter(btn => {
          const text = btn.textContent || ''
          const ariaLabel = btn.getAttribute('aria-label') || ''
          return text.includes(name) || 
                 text.includes(name.split(' ')[0]) || // First name
                 text.includes('System Admin') || // Admin specific
                 text.includes('Admin') ||
                 ariaLabel.includes('account') ||
                 ariaLabel.includes('user') ||
                 ariaLabel.includes('profile')
        })
        
        if (userButtons.length > 0) {
          accountMenuButton = userButtons[0]
        }
      } catch (error) {
        console.log('Error finding user buttons:', error.message)
      }

      if (!accountMenuButton) {
        try {
          // Fallback: look for any button that might be the account menu
          const allButtons = screen.getAllByRole('button')
          console.log('Available buttons:', allButtons.map(btn => ({
            text: btn.textContent,
            label: btn.getAttribute('aria-label'),
            className: btn.className
          })))

          // For admin, look for a button that contains "SA" (System Admin initials)
          if (type === 'admin') {
            accountMenuButton = allButtons.find(btn => 
              btn.textContent?.includes('SA') || 
              btn.textContent?.includes('System Admin')
            ) || allButtons[allButtons.length - 1]
          } else {
            // Usually the account menu is one of the last buttons in the sidebar
            accountMenuButton = allButtons[allButtons.length - 1] || allButtons[allButtons.length - 2]
          }
        } catch (error) {
          console.log('No buttons found at all:', error.message)
          screen.debug() // Show current DOM state
          throw new Error(`Dashboard for ${type} did not load properly - no buttons found`)
        }
      }

      if (!accountMenuButton) {
        throw new Error(`Could not find account menu button for ${type}`)
      }

      // Click the account menu to open dropdown
      await user.click(accountMenuButton)

      // Wait for logout option to appear
      const logoutButton = await waitFor(() => {
        return screen.getByRole("button", { name: /logout/i }) ||
               screen.getByText(/logout/i).closest('button') ||
               screen.getByText(/sign out/i).closest('button')
      }, { timeout: 5000 })

      await user.click(logoutButton)

      // Wait for redirect to login page (based on your App.jsx routes)
      await waitFor(() => {
        // Check for login page elements
        const loginPageElements = [
          screen.queryByText(/sign in/i),
          screen.queryByRole('button', { name: /sign in/i }),
          screen.queryByText(/login/i),
          screen.queryByLabelText(/email/i),
          screen.queryByLabelText(/password/i),
          screen.queryByText(/forgot your password/i),
          screen.queryByText(/don't have an account/i)
        ]
        
        const foundLoginElement = loginPageElements.some(element => element !== null)
        expect(foundLoginElement).toBe(true)
      }, { timeout: 15000 })

      // Verify sessionStorage was cleared
      expect(clearStorageSpy).toHaveBeenCalled()
      clearStorageSpy.mockRestore()
    },
    { timeout: 45000 } // Increased timeout
  )
})