const fakeProfile = {
  first_name: "Jane",
  last_Name: "Doe",
  email: "jane.doe@example.com",
  avatar: "avatar.png",
};
vi.mock("@/logic/student-profile", () => ({
  getProfile: () => Promise.resolve(fakeProfile),
}));

const applications = [{ posting_id: 1, application_id: 101 }];

vi.mock("@/logic/student-applications", () => ({
  fetchAppBarProfile: () =>
    Promise.resolve({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      avatar: "avatar.png",
    }),
}));

vi.mock("@/logic/student-view-applications", () => ({
  fetchStudentApplications: () => Promise.resolve(applications),
}));

const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

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
  Button: ({ children, onClick, variant, size, className, disabled }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
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

describe("ViewJobPostings", () => {
  const mockJobPostings = [
    {
      posting_id: 1,
      title: "Computer Science TA",
      department: { name: "Computer Science" },
      description: "Assist with CS101 course",
      term: { description: "Fall 2024" },
      post_date: "2024-01-15",
      deadline_date: "2024-12-31",
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
      deadline_date: "2024-12-31",
      requirements: "Strong math background",
      status: "open",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
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
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockJobPostings });
    // .mockResolvedValueOnce({ data: fakeProfile })
    // .mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Computer Science TA")).toBeInTheDocument();
      expect(screen.getByText("Math TA")).toBeInTheDocument();
    });
  });

  it("displays no positions message when no job postings exist", async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
    // .mockResolvedValueOnce({ data: fakeProfile })
    // .mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No Open Positions")).toBeInTheDocument();
    });
  });

  it("shows 'View Application' button when student has already applied", async () => {
    const applications = [{ posting_id: 1, application_id: 101 }];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockJobPostings });
    // .mockResolvedValueOnce({ data: fakeProfile })
    // .mockResolvedValueOnce({ data: applications });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("View Application")).toBeInTheDocument();
      expect(screen.getByText("Application Submitted")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Application"));
    expect(mockNavigate).toHaveBeenCalledWith("/my-applications/detail/101");
  });

  it("disables apply button and shows 'Application Closed' for closed jobs", async () => {
    const closedPosting = {
      ...mockJobPostings[1],
      status: "closed",
      deadline_date: "2023-01-01",
    };

    mockAxiosInstance.get
      .mockResolvedValueOnce({ data: [closedPosting] }) // job postings
      .mockResolvedValueOnce({ data: fakeProfile }) // app bar/profile
      .mockResolvedValueOnce({ data: [] }); // student’s existing apps

    renderComponent();

    // find the *button* by its accessible name
    const closedBtn = await screen.findByRole("button", {
      name: /Application Closed/i,
    });

    // assert it’s disabled
    expect(closedBtn).toBeDisabled();
  });
});
