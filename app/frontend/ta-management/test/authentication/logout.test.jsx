import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USERS } from "../test-utils/testUsers";
import { renderWithAuth } from "../test-utils/renderWithAuth";
import { getProfile } from "@/logic/scheduler-profile";

// Mock the module that contains the API call
vi.mock("@/logic/scheduler-profile", () => ({
  getProfile: vi.fn(),
}));

describe("Logout", () => {
  beforeEach(() => {
    // Provide a successful mock response for the API call
    getProfile.mockResolvedValue({ name: 'Test User', email: 'test@user.com' });
  });

  it.each(USERS)(
    "logs out $type who is currently logged-in and redirects to landing page",
    async ({ type, dashboardRoute }) => {
      renderWithAuth({
        route: dashboardRoute,
        userType: type,
      });

      const user = userEvent.setup();
      const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear");

      // 1. Wait for the account menu dropdown to appear and then click it.
      // `findBy*` queries wait for the element to be in the DOM.
      const dropdownTrigger = await screen.findByLabelText(/account menu/i);
      
      // `user.click` will also wait for the element to be enabled.
      await user.click(dropdownTrigger);
      
      // 2. Find the logout button (menuitem) and click it
      const logoutButton = await screen.findByRole("menuitem", { name: /logout/i });
      await user.click(logoutButton);

      // 3. Test for redirection and storage clearing
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });
      expect(clearStorageSpy).toHaveBeenCalled();

      clearStorageSpy.mockRestore();
    }
  );
});