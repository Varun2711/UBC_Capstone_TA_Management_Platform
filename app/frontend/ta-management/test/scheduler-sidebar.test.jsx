import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppSidebar } from "@/components/scheduler-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
// Import the mocked functions after setting up mocks
import { getProfile } from "@/logic/scheduler-profile";
import { logout } from "@/logic/auth";

// --- MOCKS ---

// Mock the profile logic module
vi.mock("@/logic/scheduler-profile", () => ({
  getProfile: vi.fn(),
}));

// Mock the auth logic module
vi.mock("@/logic/auth", () => ({
  logout: vi.fn(),
}));

// Mock the navigate function from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock lucide-react icons for simplicity
vi.mock("lucide-react", () => ({
  Home: () => <svg data-testid="home-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  UserCheck: () => <svg data-testid="user-check-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
}));

// --- TEST SETUP ---

const renderSidebar = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar {...props} />
      </SidebarProvider>
    </MemoryRouter>
  );
};

describe("AppSidebar", () => {
  const mockUser = {
    name: "Jane Doe",
    email: "jane.doe@university.edu",
  };

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks();
    // Default mock implementation for a successful data fetch
    getProfile.mockResolvedValue(mockUser);
  });

  // --- TESTS ---

  it("should render the header and initial loading state, then display user data", async () => {
    renderSidebar();

    // Assert the static header content is present
    expect(screen.getByText("TA Scheduler")).toBeInTheDocument();

    // Assert the initial loading state is visible before data fetch completes
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for the asynchronous operation to complete and the UI to update
    // `findBy` queries are async and perfect for this purpose
    await screen.findByText("Jane Doe");

    // Assert that the loading text is gone and user data is now displayed
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("jane.doe@university.edu")).toBeInTheDocument();
  });

  it("should display the correct avatar fallback from user initials", async () => {
    renderSidebar();
    // Wait for the user data to be loaded before checking for the avatar
    await screen.findByText("Jane Doe");
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should render all navigation items and apply the active state correctly", async () => {
    renderSidebar({ activePage: "Course Management" });

    // Wait for loading to finish before interacting
    await screen.findByText("Jane Doe");

    const navItems = [
      "Dashboard",
      "Course Management",
      "Instructor Management",
      "Application Management",
      "Allocations",
    ];
    navItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });

    // Check for active state based on the `data-active` attribute
    const activeItem = screen.getByText("Course Management").closest("button");
    expect(activeItem).toHaveAttribute("data-active", "true");

    const inactiveItem = screen.getByText("Dashboard").closest("button");
    expect(inactiveItem).toHaveAttribute("data-active", "false");
  });

  it("should navigate to the correct URL when a navigation item is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar();

    // Wait for loading to finish
    await screen.findByText("Jane Doe");

    // Click and assert navigation for each item
    await user.click(screen.getByText("Dashboard"));
    expect(mockNavigate).toHaveBeenCalledWith("/scheduler-dashboard");

    await user.click(screen.getByText("Allocations"));
    expect(mockNavigate).toHaveBeenCalledWith("/ta-coordinator-allocation");
  });

  it('should open the dropdown and navigate when "My Profile" is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    // Wait for the component to be ready
    await screen.findByText("Jane Doe");

    const dropdownTrigger = screen.getByLabelText("account menu");
    await user.click(dropdownTrigger);

    // Find and click the profile menu item
    const profileButton = await screen.findByRole("menuitem", {
      name: /my profile/i,
    });
    await user.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith("/user-profile-scheduler");
  });

  it('should call the logout function when "Logout" is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await screen.findByText("Jane Doe");

    const dropdownTrigger = screen.getByLabelText("account menu");
    await user.click(dropdownTrigger);

    const logoutButton = await screen.findByRole("menuitem", {
      name: /logout/i,
    });
    await user.click(logoutButton);

    // Assert that our mocked logout function was called with the navigate function
    expect(logout).toHaveBeenCalledWith(mockNavigate);
  });

  it("should handle API failure gracefully", async () => {
    // Override the default mock to simulate a network error for this test
    getProfile.mockRejectedValue(new Error("API Error"));
    renderSidebar();

    // Wait for the loading to complete (the `finally` block in the component)
    // The dropdown trigger becomes enabled after loading, making it a good element to wait for.
    await waitFor(() => {
      expect(screen.getByLabelText("account menu")).not.toBeDisabled();
    });

    // After a failed API call, the user is null, so it should still show "Loading..."
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });
});
