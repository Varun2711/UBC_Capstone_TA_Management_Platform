/* test/student-view-job-postings/ViewJobPostings.test.jsx */

/* ────────────────────────────────────────────────────────────
 *  student‑profile mock (hoist-safe)
 * ──────────────────────────────────────────────────────────── */
const fakeProfile = {
  first_name: "Jane",
  last_Name: "Doe",
  email: "jane.doe@example.com",
  avatar: "avatar.png",
};
vi.mock("@/logic/student-profile", () => ({
  getProfile: () => Promise.resolve(fakeProfile),
}));
/* ────────────────────────────────────────────────────────────
 *  axios mock (hoist-safe)
 * ──────────────────────────────────────────────────────────── */

const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

/* ────────────────────────────────────────────────────────────
 *  react-router mocks
 * ──────────────────────────────────────────────────────────── */

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ViewJobPostings from "@/pages/Student/Student_ViewJobPostings";

/* ────────────────────────────────────────────────────────────
 *  UI component stubs
 * ──────────────────────────────────────────────────────────── */

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarTrigger: () => <div data-testid="sidebar-trigger" />,
}));

vi.mock("@/components/student-dashboard-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, className }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

/* ────────────────────────────────────────────────────────────
 *  Test suite
 * ──────────────────────────────────────────────────────────── */

describe("ViewJobPostings", () => {
  const mockJobPostings = [
    {
      posting_id: 1,
      title: "Computer Science TA",
      department: { name: "Computer Science" },
      description: "Assist with CS101 course",
      term: { description: "Fall 2024" },
      post_date: "2024-01-15",
      deadline_date: "2024-02-15",
      requirements: "Must have completed CS101",
      status: "open",
    },
    {
      posting_id: 2,
      title: "Math TA",
      department: { name: "Mathematics" },
      description: "Help with calculus courses",
      term: { description: "Spring 2024" },
      post_date: "2024-01-20",
      deadline_date: "2024-02-20",
      requirements: "Strong math background",
      status: "open",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <ViewJobPostings />
      </BrowserRouter>
    );

  it("displays loading state initially", () => {
    mockAxiosInstance.get.mockImplementation(() => new Promise(() => {}));

    renderComponent();

    expect(screen.getByText("Loading job postings...")).toBeInTheDocument();
  });

  it("displays job postings when data is loaded successfully", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: mockJobPostings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Computer Science TA")).toBeInTheDocument();
      expect(screen.getByText("Math TA")).toBeInTheDocument();
    });

    expect(screen.getByText("Available TA Positions")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  it("displays error message when API call fails", async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error("API Error"));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load job postings")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("displays no positions message when no job postings exist", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No Open Positions")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "There are currently no open TA positions. Check back later!"
      )
    ).toBeInTheDocument();
  });

  it("navigates to apply page when Apply Now button is clicked", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: mockJobPostings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Computer Science TA")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Apply Now")[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/apply/jobposting/1");
  });

  it("navigates to dashboard when Back to Dashboard button is clicked", async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: mockJobPostings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back to Dashboard"));

    expect(mockNavigate).toHaveBeenCalledWith("/student-dashboard");
  });
});
