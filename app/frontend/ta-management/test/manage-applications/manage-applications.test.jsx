// Coordinator_ManageApplications.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ManageApplications from "@/pages/Scheduler/Scheduler_ManageApplications";
import * as logic from "@/logic/application-management";

// Mock the entire logic module
vi.mock("@/logic/application-management", () => ({
  fetchApplicationManagementData: vi.fn(),
  enrichApplicationsWithShortlistStatus: vi.fn(),
  addToShortlist: vi.fn(),
  removeFromShortlist: vi.fn(),
  getStatusConfig: vi.fn(),
  getPositionTypeConfig: vi.fn(),
  formatDate: vi.fn(),
  handleApiError: vi.fn(),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock UI components
vi.mock("@/components/application-management/SearchFilters", () => ({
  default: ({ searchQuery, setSearchQuery, clearFilters }) => (
    <div data-testid="search-filters">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button data-testid="clear-filters" onClick={clearFilters}>
        Clear
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/breadcrumb", () => ({
  Breadcrumb: ({ children }) => <div>{children}</div>,
  BreadcrumbList: ({ children }) => <div>{children}</div>,
  BreadcrumbItem: ({ children }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <div />,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }) => <div>{children}</div>,
  SidebarInset: ({ children }) => <div>{children}</div>,
  SidebarTrigger: () => <div />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/scheduler-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

describe("ManageApplications", () => {
  // Setup default mock implementations
  const mockDefaults = () => {
    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: [],
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockImplementation((apps) =>
      Promise.resolve(apps)
    );
    logic.getStatusConfig.mockReturnValue({
      label: "Submitted",
      className: "bg-yellow-100 text-yellow-800",
    });
    logic.getPositionTypeConfig.mockReturnValue({
      label: "Undergraduate TA",
      className: "border-blue-200 text-blue-800",
    });
    logic.formatDate.mockReturnValue("Jan 15, 2024");
    logic.handleApiError.mockReturnValue("An error occurred");
    logic.addToShortlist.mockResolvedValue();
    logic.removeFromShortlist.mockResolvedValue();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    mockDefaults();
  });

  test("shows loading state initially", () => {
    // Make fetchApplicationManagementData never resolve
    logic.fetchApplicationManagementData.mockImplementation(
      () => new Promise(() => {})
    );

    render(<ManageApplications />);
    expect(screen.getByText(/Loading applications/)).toBeInTheDocument();
  });

  test("renders table with one application", async () => {
    const apps = [
      {
        application_id: 1,
        student: { name: "John Doe", student_number: "12345" },
        posting: { title: "Physics TA", department: { name: "Physics Dept" } },
        positionType: "UTA",
        status: "submitted",
        applied_at: "2024-01-15T10:00:00Z",
        isShortlisted: false,
      },
    ];

    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: apps,
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockResolvedValue(apps);

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    expect(screen.getByText("Applications (1)")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("Physics TA")).toBeInTheDocument();
  });

  test("renders no-results message when API returns empty array", async () => {
    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: [],
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockResolvedValue([]);

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    expect(
      screen.getByText(/No applications found matching your criteria/)
    ).toBeInTheDocument();
  });

  test("opens application view in new tab when View button clicked", async () => {
    const apps = [
      {
        application_id: 42,
        student: { name: "Jane Smith", student_number: "67890" },
        posting: { title: "Math TA", department: { name: "Math Dept" } },
        positionType: "UTA",
        status: "submitted",
        applied_at: "2024-01-15T10:00:00Z",
        isShortlisted: false,
      },
    ];

    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: apps,
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockResolvedValue(apps);

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    const viewBtn = screen.getByTitle("View Application");
    fireEvent.click(viewBtn);

    expect(window.open).toHaveBeenCalledWith(
      "/manage-applications/view/42",
      "_blank"
    );
  });

  test("falls back to no-results state when the fetch errors", async () => {
    logic.fetchApplicationManagementData.mockRejectedValue(
      new Error("Network error")
    );

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    expect(
      screen.getByText(/No applications found matching your criteria/)
    ).toBeInTheDocument();
  });

  test("shortlists an application when Quick Shortlist clicked", async () => {
    const apps = [
      {
        application_id: 1,
        student: { name: "Emily Davis", student_number: "67890" },
        posting: { title: "Biology TA", department: { name: "Biology Dept" } },
        positionType: "UTA",
        status: "submitted",
        applied_at: "2024-01-15T10:00:00Z",
        isShortlisted: false,
      },
    ];

    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: apps,
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockResolvedValue(apps);

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    const quickBtn = screen.getByTestId("quick-shortlist-btn");
    fireEvent.click(quickBtn);

    expect(logic.addToShortlist).toHaveBeenCalledWith(1);

    // Wait for the component state to update
    await waitFor(() => {
      expect(screen.getByText(/Shortlisted/)).toBeInTheDocument();
    });

    expect(screen.getByText("1 shortlisted")).toBeInTheDocument();
  });

  test("removes application from shortlist when Remove from Shortlist clicked", async () => {
    // Create application that is already shortlisted
    const apps = [
      {
        application_id: 2,
        student: { name: "Liam Brown", student_number: "54321" },
        posting: {
          title: "Chemistry TA",
          department: { name: "Chemistry Dept" },
        },
        positionType: "UTA",
        status: "submitted",
        applied_at: "2024-01-15T10:00:00Z",
        isShortlisted: true, // Already shortlisted
      },
    ];

    logic.fetchApplicationManagementData.mockResolvedValue({
      applications: apps,
      shortlists: [],
    });
    logic.enrichApplicationsWithShortlistStatus.mockResolvedValue(apps);

    render(<ManageApplications />);

    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    // Verify the shortlisted badge is shown
    expect(screen.getByText(/Shortlisted/)).toBeInTheDocument();
    expect(screen.getByText("1 shortlisted")).toBeInTheDocument();

    // Find and click the remove shortlist button
    const removeBtn = screen.getByTestId("remove-shortlist-btn");
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);

    expect(logic.removeFromShortlist).toHaveBeenCalledWith(2);

    // Wait for the component state to update after removal
    await waitFor(() => {
      expect(screen.queryByText(/Shortlisted/)).not.toBeInTheDocument();
    });

    // Should now show the quick shortlist button instead
    expect(screen.getByTestId("quick-shortlist-btn")).toBeInTheDocument();
    expect(screen.getByTitle("Quick Shortlist")).toBeInTheDocument();
  });
});
