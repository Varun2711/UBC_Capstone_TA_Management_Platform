import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USERS } from "../test-utils/testUsers";
import { renderWithAuth } from "../test-utils/renderWithAuth";
import axios from "axios";

// This general axios mock setup is correct.
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    })),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

describe("Logout", () => {
  beforeEach(() => {
    // Keep this simple: just clear mocks and sessionStorage.
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('access_token', 'mock-access-token');

    // Mock axios.create to return the mocked instance
    axios.create.mockReturnValue({
      get: axios.get,
      post: axios.post,
      patch: axios.patch,
      put: axios.put,
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    });
  });

  it.each(USERS)(
    "logs out $type who is currently logged-in and redirects to landing page",
    async ({ type, dashboardRoute, name }) => {
      const user = userEvent.setup();
      const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear");

      // Set user type for this specific test run
      sessionStorage.setItem('user_type', type);

      axios.get.mockImplementation((url) => {
        if (url.includes('/profile') || url.includes('/me') || url.includes('/users/profile')) {
          return Promise.resolve({ data: { id: 1, name: name } });
        }
        return Promise.resolve({ data: {} }); // Fallback for other calls
      });

      renderWithAuth({ route: dashboardRoute, userType: type });

      const accountMenuButton = await screen.findByRole("button", { 
        name: /account menu/i 
      }, { timeout: 10000 });

      // Now we know the button is present and ready.
      await user.click(accountMenuButton);

      const logoutMenuItem = await screen.findByRole("menuitem", { name: /logout/i });
      await user.click(logoutMenuItem);

      // Wait for the redirect to the login/landing page.
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Teaching Assistant Application Portal/i })).toBeInTheDocument();
      });

      // Verify sessionStorage was cleared
      expect(clearStorageSpy).toHaveBeenCalled();
      clearStorageSpy.mockRestore();
    },
    { timeout: 20000 } // A single timeout for the entire test
  );
});