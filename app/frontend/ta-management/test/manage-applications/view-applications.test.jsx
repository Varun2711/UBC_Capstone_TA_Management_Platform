// Coordinator_ViewApplication.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ViewStudentApplication from "@/pages/Scheduler/Scheduler_ViewApplication";
import axios, { getMock } from "axios";

// Create a mockNavigate and mock axios
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ applicationid: "1" }),
  useNavigate: () => mockNavigate,
}));
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

// Stub UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock("@/components/ui/separator", () => ({ Separator: () => <div /> }));
vi.mock("@/components/ui/breadcrumb", () => ({
  Breadcrumb: ({ children }) => <div>{children}</div>,
  BreadcrumbList: ({ children }) => <div>{children}</div>,
  BreadcrumbItem: ({ children }) => <div>{children}</div>,
  BreadcrumbPage: ({ children }) => <div>{children}</div>,
}));
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
vi.mock("../components/scheduler-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

describe("ViewStudentApplication", () => {
  beforeEach(() => {
    getMock.mockReset();
    mockNavigate.mockReset();
  });

  test("shows loading state initially", () => {
    getMock.mockImplementation(() => new Promise(() => {}));
    render(<ViewStudentApplication />);
    expect(screen.getByText(/Loading application/)).toBeInTheDocument();
  });

  test("renders error on fetch failure", async () => {
    getMock.mockRejectedValue(new Error("Load fail"));
    render(<ViewStudentApplication />);
    await waitFor(() =>
      expect(screen.queryByText(/Loading application/)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Load fail/)).toBeInTheDocument();
  });

  test("renders student information", async () => {
    const data = {
      application_id: 1,
      applied_at: "2025-06-12",
      student: { id: 2, name: "Alice Johnson", student_number: "A123" },
      posting: {
        title: "TA for CMPS101",
        department: {
          name: "CMPS",
        },
      },
      positionType: "ta", // ✅ Use a valid value
      termSelection: {
        description: "Winter 2025",
      },
      status: "submitted", // if needed for StatusBadge
    };
    getMock.mockResolvedValue({ data });
    render(<ViewStudentApplication />);

    await waitFor(() => {
      expect(screen.getByText("TA for CMPS101")).toBeInTheDocument();
    });
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("A123")).toBeInTheDocument();
  });

  test("renders position details", async () => {
    const data = {
      application_id: 1,
      applied_at: "2025-06-12",
      student: { id: 2 },
      posting: {
        title: "Chemistry TA",
        description: "Lab help",
        department: {
          name: "CMPS",
        },
      },
      positionType: "UTA",
    };
    getMock.mockResolvedValue({ data });
    render(<ViewStudentApplication />);
    await waitFor(() =>
      expect(screen.getByText("Chemistry TA")).toBeInTheDocument()
    );
    expect(screen.getByText("Lab help")).toBeInTheDocument();
  });

  test("back button navigates to manage applications", async () => {
    const data = {
      application_id: 1,
      applied_at: "2025-06-12",
      student: { id: 2 },
      posting: {
        department: {
          name: "CMPS",
        },
      },
      positionType: "",
    };
    getMock.mockResolvedValue({ data });
    render(<ViewStudentApplication />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /back to applications/i })
      ).toBeInTheDocument()
    );
    fireEvent.click(
      screen.getByRole("button", { name: /back to applications/i })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/manage-applications");
  });
});
