import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { USERS } from "../test-utils/testUsers";
import { renderWithAuth } from "../test-utils/renderWithAuth";
import axios from "axios";

// Mock axios
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

    // Enhanced axios.get mock to handle all dashboard API calls
    axios.get.mockImplementation((url) => {
      // Profile/user endpoints
      if (url.includes('/profile') || url.includes('/me') || url.includes('/users/profile')) {
        return Promise.resolve({ data: { id: 1, name: 'Test User', email: 'test@example.com' } });
      }
      
      // Scheduler dashboard endpoints
      if (url.includes('/courses/')) {
        return Promise.resolve({ data: { results: [] } });
      }
      
      if (url.includes('/applications/')) {
        return Promise.resolve({ data: [] });
      }
      
      if (url.includes('/course-offerings/')) {
        return Promise.resolve({ data: { results: [] } });
      }
      
      if (url.includes('/shared-sessions/')) {
        return Promise.resolve({ data: { results: [] } });
      }
      
      if (url.includes('/assignments/')) {
        return Promise.resolve({ data: [] });
      }
      
      if (url.includes('/shortlisted-applicants/')) {
        return Promise.resolve({ data: [] });
      }
      
      if (url.includes('/offers/')) {
        return Promise.resolve({ data: [] });
      }

      // Default fallback
      return Promise.resolve({ data: {} });
    });
  });

  it.each(USERS)(
    "logs out $type who is currently logged-in and redirects to landing page",
    async ({ type, dashboardRoute, name }) => {
      const user = userEvent.setup();
      const clearStorageSpy = vi.spyOn(window.sessionStorage.__proto__, "clear");

      // Set user type for this specific test run
      sessionStorage.setItem('user_type', type);

      renderWithAuth({ route: dashboardRoute, userType: type });

      // Wait for the page to load and any API calls to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
      }, { timeout: 10000 });

      const accountMenuButton = await screen.findByRole("button", { 
        name: /account menu/i 
      }, { timeout: 10000 });

      // Now we know the button is present and ready.
      await user.click(accountMenuButton);

      const logoutMenuItem = await screen.findByRole("menuitem", { name: /logout/i });
      await user.click(logoutMenuItem);

      // Wait for the redirect to the landing page
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Become a Teaching Assistant/i, level: 1 })).toBeInTheDocument();
      });

      // Verify sessionStorage was cleared
      expect(clearStorageSpy).toHaveBeenCalled();
      clearStorageSpy.mockRestore();
    },
    { timeout: 20000 }
  );
});