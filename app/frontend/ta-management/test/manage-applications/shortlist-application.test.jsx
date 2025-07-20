// test/manage-applications/shortlist-application.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ViewStudentApplication from "@/pages/Scheduler/Scheduler_ViewApplication";

// --- Mock out react‑router params/navigation ---
vi.mock("react-router-dom", () => ({
  useParams: () => ({ applicationid: "1" }),
  useNavigate: () => vi.fn(),
}));

// --- Mock the logic layer ---
import {
  fetchApplicationById,
  checkApplicationShortlisted,
  addToShortlist,
  removeFromShortlist,
  getStatusConfig,
  getPositionTypeConfig,
  formatDateTime,
  handleApiError,
} from "@/logic/application-management";

vi.mock("@/logic/application-management", () => ({
  fetchApplicationById: vi.fn(),
  checkApplicationShortlisted: vi.fn(),
  addToShortlist: vi.fn(),
  removeFromShortlist: vi.fn(),
  getStatusConfig: () => ({ className: "", label: "" }),
  getPositionTypeConfig: () => ({ className: "", label: "" }),
  formatDateTime: () => "Jun 12, 2025",
  handleApiError: (e) => e.message,
}));

// --- Minimal mock data to get the component fully through render ---
const applicationData = {
  application_id: "1",
  applied_at: "2025-06-12T00:00:00Z",
  updated_at: "2025-06-12T00:00:00Z",
  student: { id: 2, name: "Alice Johnson", student_number: "A123" },
  posting: { department: { name: "CMPS" } },
  positionType: "UTA",
  status: "submitted",
  termSelection: { description: "Fall 2025" },
  workload: 8,
  disciplineRankings: {},
  citizenshipStatus: "citizen",
  residingInKelowna: "yes",
  fullTimeEnrollment: "yes",
  hasOtherPositions: "no",
  responses: [],
};

describe("Shortlist / Remove‑from‑Shortlist in ViewStudentApplication", () => {
  beforeEach(() => {
    fetchApplicationById.mockResolvedValue(applicationData);
  });

  test("renders 'Shortlist Application' button when not shortlisted", async () => {
    checkApplicationShortlisted.mockResolvedValueOnce(false);

    render(<ViewStudentApplication />);

    const btn = await screen.findByRole("button", {
      name: /Shortlist Application/i,
    });
    expect(btn).toBeInTheDocument();
  });

  test("clicking 'Shortlist Application' calls addToShortlist and shows 'Shortlisted'", async () => {
    checkApplicationShortlisted.mockResolvedValueOnce(false);
    addToShortlist.mockResolvedValueOnce();

    render(<ViewStudentApplication />);

    const shortlistBtn = await screen.findByRole("button", {
      name: /Shortlist Application/i,
    });
    fireEvent.click(shortlistBtn);

    expect(addToShortlist).toHaveBeenCalledWith("1");
    expect(await screen.findByText(/Shortlisted/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Remove from Shortlist/i })
    ).toBeVisible();
  });

  test("clicking 'Remove from Shortlist' calls removeFromShortlist and reverts button", async () => {
    checkApplicationShortlisted.mockResolvedValueOnce(true);
    removeFromShortlist.mockResolvedValueOnce();

    render(<ViewStudentApplication />);

    const removeBtn = await screen.findByRole("button", {
      name: /Remove from Shortlist/i,
    });
    fireEvent.click(removeBtn);

    expect(removeFromShortlist).toHaveBeenCalledWith("1");
    expect(
      await screen.findByRole("button", { name: /Shortlist Application/i })
    ).toBeVisible();
  });
});
