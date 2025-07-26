// test/student-dashboard/ApplicationDetail.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ applicationId: "42" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }) => <div>{children}</div>,
  SidebarTrigger: () => <button>Toggle Sidebar</button>,
}));
vi.mock("@/components/student-dashboard-sidebar", () => ({
  AppSidebar: ({ name }) => <div>Sidebar: {name}</div>,
}));

vi.mock("@/logic/student-applications", () => ({
  fetchAppBarProfile: vi.fn(() =>
    Promise.resolve({
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "avatar.jpg",
    })
  ),
}));

vi.mock("@/logic/student-view-applications", () => ({
  fetchApplicationDetail: vi.fn(() =>
    Promise.resolve({
      application_id: 42,
      applied_at: "2025-06-12T00:00:00Z",
      status: "submitted",
      termSelection: { description: "Fall 2025" },
      posting: {
        title: "CPSC 110 TA",
        department: { name: "Computer Science" },
        description: "Teach recursion and loops.",
        requirements: "Must have passed CPSC 110.",
      },
    })
  ),
  getApplicationWithFormData: vi.fn((app) =>
    Promise.resolve({
      application: app,
      sections: [
        {
          section_id: "sec1",
          name: "Personal Info",
          questions: [
            {
              question_id: "q1",
              question_text: "Why do you want this role?",
              hasResponse: true,
              response: "Because I love teaching!",
              is_required: true,
            },
          ],
        },
      ],
    })
  ),
  formatResponseForDisplay: (response) => response,
  getStatusDisplayInfo: (status) => ({
    label: "Submitted",
    color: "blue",
    description: "Your application has been submitted.",
  }),
}));

import ApplicationDetail from "@/pages/Student/ApplicationDetail";

// ─── Tests ───────────────────────────────────────────────────
describe("ApplicationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    render(<ApplicationDetail />);
    expect(
      screen.getByText("Loading your applications...")
    ).toBeInTheDocument();
  });

  it("displays sidebar and header after load", async () => {
    render(<ApplicationDetail />);
    await screen.findByText("Sidebar: Jane Smith");
    expect(await screen.findByText("CPSC 110 TA")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("renders job posting details", async () => {
    render(<ApplicationDetail />);
    await screen.findByText("Position Details");
    expect(screen.getByText("Teach recursion and loops.")).toBeInTheDocument();
    expect(screen.getByText("Must have passed CPSC 110.")).toBeInTheDocument();
  });

  it("renders application form responses", async () => {
    render(<ApplicationDetail />);
    expect(
      await screen.findByText("Why do you want this role?")
    ).toBeInTheDocument();
    expect(screen.getByText("Because I love teaching!")).toBeInTheDocument();
  });

  it("navigates back to My Applications on button click", async () => {
    render(<ApplicationDetail />);
    const backBtn = await screen.findByRole("button", {
      name: /Back to Applications/i,
    });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/my-applications");
  });
});
