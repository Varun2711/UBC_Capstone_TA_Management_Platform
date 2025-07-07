import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { USERS } from "../test-utils/testUsers"
import { renderWithAuth } from "../test-utils/renderWithAuth"

describe("Logout", () => {
    // for each user_type
    it.each(USERS)(
        "logs out $type who is currently logged-in and redirects to landing page",
        async({ type, dashboardRoute }) => {
            // render the user-specific dashboard as if we are logged in as that user type
            renderWithAuth({
                route: dashboardRoute,
                userType: type
            })

            const user = userEvent.setup()
            // spy on sessionStorage.clear so that i can check if it was called
            const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear")

            // 1. Find the account menu dropdown and click on it
            await waitFor(() => {
                const dropdownTrigger = screen.getByLabelText(/account menu/i)
                user.click(dropdownTrigger)
            })
            
            // 2. Find the logout button (inside the dropdown) and click on it
            const logoutButton = await screen.findByRole("button", { name: /logout/i })
            await user.click(logoutButton)

            // 3. Test for redirection to landing page
            await waitFor(() => {
                expect(screen.getByText(/login/i)).toBeInTheDocument()
            })

            // 4. Test that tokens, user_type, etc. were cleared out
            expect(clearStorageSpy).toHaveBeenCalled()

            // Reset mocks so doesn't affect other tests
            clearStorageSpy.mockRestore()
        }
    )
})