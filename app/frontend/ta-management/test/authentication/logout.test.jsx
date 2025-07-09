import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { USERS } from "../test-utils/testUsers"
import { renderWithAuth } from "../test-utils/renderWithAuth"

describe("Logout", () => {
    it.each(USERS)(
        "logs out $type who is currently logged-in and redirects to landing page",
        async({ type, dashboardRoute, name }) => { // <--- Pass 'name' from USERS
            renderWithAuth({
                route: dashboardRoute,
                userType: type
            })

            const user = userEvent.setup()
            const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear")

            // IMPORTANT: Wait for a specific element that signifies the dashboard is fully loaded.
            // Use the user's name from your USERS data, as it's present in the SidebarMenuButton's children.
            // This ensures the entire SidebarFooter (including the account menu) is mounted.
            await waitFor(() => {
                expect(screen.getByText(name)).toBeInTheDocument();
            }, { timeout: 5000 }); // Increase timeout if needed, default is 1000ms

            // Now that we've waited for the dashboard to render the user's name,
            // the 'account menu' button should definitely be in the document.
            const dropdownTrigger = screen.getByRole('button', { name: /account menu/i });
            await user.click(dropdownTrigger);
            
            // 2. Find the logout button (inside the dropdown) and click on it
            const logoutButton = await screen.findByRole("button", { name: /logout/i });
            await user.click(logoutButton);

            // 3. Test for redirection to landing page
            await waitFor(() => {
                expect(screen.getByText(/login/i)).toBeInTheDocument();
            });

            // 4. Test that tokens, user_type, etc. were cleared out
            expect(clearStorageSpy).toHaveBeenCalled();

            clearStorageSpy.mockRestore();
        }
    )
})