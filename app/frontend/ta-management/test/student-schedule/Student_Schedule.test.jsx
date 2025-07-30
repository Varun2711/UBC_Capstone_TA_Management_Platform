import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ViewStudentSchedule from "@/pages/Student/Student_Schedule";
import { EventComponent } from "@/pages/Student/Student_Schedule"; // fixed import path
import { getProfile } from "@/logic/student-profile";
import {
  fetchStudentAssignments,
  transformAssignmentsToCalendarEvents,
  getAssignmentStatus,
  formatAssignmentDisplay,
} from "@/logic/student-schedule";

vi.mock("react-big-calendar", () => {
  const React = require("react");
  return {
    // mocking Big Calendar to help with testing
    Calendar: ({ events, components }) => (
      <div data-testid="stub-calendar">
        {events.map((evt) =>
          React.createElement(components.event, { key: evt.id, event: evt })
        )}
      </div>
    ),
    momentLocalizer: () => {}, // no-op
  };
});

// Mock the logic modules
vi.mock("@/logic/student-profile", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/logic/student-schedule", () => ({
  fetchStudentAssignments: vi.fn(),
  transformAssignmentsToCalendarEvents: vi.fn(),
  getAssignmentStatus: vi.fn(),
  formatAssignmentDisplay: vi.fn(),
}));

describe("ViewStudentSchedule Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading state initially", () => {
    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Loading your assignments.../i)
    ).toBeInTheDocument();
  });

  test("displays no assignments message when assignments list is empty", async () => {
    getProfile.mockResolvedValue({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      avatar: "avatar.png",
    });
    fetchStudentAssignments.mockResolvedValue({ assignments: [], summary: {} });
    transformAssignmentsToCalendarEvents.mockReturnValue([]);

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    expect(await screen.findByText(/No Assignments Yet/i)).toBeInTheDocument();
  });

  test("displays empty calendar message when no events", async () => {
    getProfile.mockResolvedValue({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      avatar: "avatar.png",
    });
    fetchStudentAssignments.mockResolvedValue({ assignments: [], summary: {} });
    transformAssignmentsToCalendarEvents.mockReturnValue([]);

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    await screen.findByText(/No Assignments Yet/i);

    // Try to Switch to calendar view
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Calendar View/i }));

    expect(
      await screen.findByText(
        /No scheduled assignments to display on calendar/i
      )
    ).toBeInTheDocument();
  });

  test("displays error message when fetch fails", async () => {
    getProfile.mockResolvedValue({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      avatar: "avatar.png",
    });
    fetchStudentAssignments.mockRejectedValue(new Error("Network Error"));

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Failed to load assignments. Please try again./i)
    ).toBeInTheDocument();
  });

  test("renders assignment cards when assignments are present", async () => {
    getProfile.mockResolvedValue({
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      avatar: "avatar2.png",
    });

    const mockAssignment = {
      assignment_id: "1",
      is_active: true,
      assigned_date: "2025-01-01",
      offer_details: { offer_items: [] },
    };

    fetchStudentAssignments.mockResolvedValue({
      assignments: [mockAssignment],
      summary: {},
    });
    transformAssignmentsToCalendarEvents.mockReturnValue([]);
    formatAssignmentDisplay.mockReturnValue({
      courseCode: "CISC123",
      courseName: "Algorithms",
      sectionNumber: "001",
      sessionType: "Course",
      offerItems: [],
      timeSlots: [],
      instructor: "",
      weeklyHours: 0,
      role: "ta",
      assignedDate: "2025-01-01",
      notes: "",
    });
    getAssignmentStatus.mockReturnValue({
      status: "Active",
      variant: "default",
    });

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    expect(await screen.findByText("CISC123 - Algorithms")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("renders calendar events when assignments are present", async () => {
    getProfile.mockResolvedValue({
      first_name: "Alice",
      last_name: "Brown",
      email: "alice@example.com",
      avatar: "avatar3.png",
    });
    const mockAssignment = {
      assignment_id: "2",
      is_active: true,
      assigned_date: "2025-05-01",
      offer_details: { offer_items: [] },
    };
    fetchStudentAssignments.mockResolvedValue({
      assignments: [mockAssignment],
      summary: {},
    });
    const calendarEvents = [
      {
        id: "evt1",
        title: "CISC200 Assignment",
        sessionType: "Session",
        start: new Date("2025-05-02T10:00:00"),
        end: new Date("2025-05-02T12:00:00"),
      },
    ];
    transformAssignmentsToCalendarEvents.mockReturnValue(calendarEvents);

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    //Try to switch to Calendar Tab
    const calendarTab = await screen.findByText(/Calendar View/i);
    await user.click(calendarTab);
    await screen.findByText(/Weekly Schedule/i);

    expect(
      await screen.findByText((content) => content.includes("CISC200"))
    ).toBeInTheDocument();
  });
});
