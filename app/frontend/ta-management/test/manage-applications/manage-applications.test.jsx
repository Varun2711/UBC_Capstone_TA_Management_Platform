// Coordinator_ManageApplications.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ManageApplications from "@/pages/Scheduler/Scheduler_ManageApplications_old";
import axios, { getMock } from "axios";

// Mock axios.create to return an instance with our getMock
vi.mock("axios", () => {
  const getMock = vi.fn();
  return {
    __esModule: true,
    default: {
      create: () => ({ get: getMock }),
    },
    getMock,
  };
});

// Mock react-router-dom before component uses it
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Stub out child/layout modules
vi.mock("@/components/application-management/SearchFilters", () => ({
  default: () => <div data-testid="search-filters" />,
}));
vi.mock("@/components/ui/breadcrumb", () => ({
  Breadcrumb: ({ children }) => <div>{children}</div>,
  BreadcrumbList: ({ children }) => <div>{children}</div>,
  BreadcrumbItem: ({ children }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/separator", () => ({ Separator: () => <div /> }));
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }) => <div>{children}</div>,
  SidebarInset: ({ children }) => <div>{children}</div>,
  SidebarTrigger: () => <div />,
  Sidebar: ({ children, ...props }) => <div {...props}>{children}</div>,
  SidebarContent: ({ children }) => <div>{children}</div>,
  SidebarFooter: ({ children }) => <div>{children}</div>,
  SidebarGroup: ({ children }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }) => <div>{children}</div>,
  SidebarHeader: ({ children }) => <div>{children}</div>,
  SidebarMenu: ({ children }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }) => <li>{children}</li>,
  SidebarMenuButton: ({ children }) => <button>{children}</button>,
  SidebarRail: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock("../components/scheduler-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

describe("ManageApplications", () => {
  beforeEach(() => {
    // Clear previous calls
    getMock.mockReset();
    window.open = vi.fn();
  });

  test("shows loading state initially", () => {
    // simulate a never-resolving fetch
    getMock.mockImplementation(() => new Promise(() => {}));
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
        status: "accepted",
      },
    ];
    getMock.mockResolvedValue({ data: apps });

    render(<ManageApplications />);
    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    expect(screen.getByText("Applications (1)")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Undergraduate TA")).toBeInTheDocument();
  });

  test("renders no-results message when API returns empty array", async () => {
    getMock.mockResolvedValue({ data: [] });
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
      },
    ];
    getMock.mockResolvedValue({ data: apps });

    render(<ManageApplications />);
    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );

    const btn = screen.getByRole("button", { name: /view/i });
    fireEvent.click(btn);
    expect(window.open).toHaveBeenCalledWith(
      "/manage-applications/view/42",
      "_blank"
    );
  });

  test("falls back to no-results state when the fetch errors", async () => {
    getMock.mockRejectedValue(new Error("Network error"));
    render(<ManageApplications />);
    await waitFor(() =>
      expect(screen.queryByText(/Loading applications/)).not.toBeInTheDocument()
    );
    expect(
      screen.getByText(/No applications found matching your criteria/)
    ).toBeInTheDocument();
  });
});
