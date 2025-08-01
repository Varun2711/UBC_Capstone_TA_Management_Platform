import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
    Calendar: ({ events, components, onSelectEvent }) => (
      <div data-testid="stub-calendar">
        {events.map((evt) => (
          <div
            key={evt.id}
            onClick={() => onSelectEvent && onSelectEvent(evt)}
            style={{ cursor: "pointer" }}
          >
            {React.createElement(components.event, {
              event: evt,
            })}
          </div>
        ))}
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

  test("shows loading state initially", async () => {
    // Mock the functions to avoid actual API calls
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

    // Check loading state initially
    expect(
      screen.getByText(/Loading your assignments.../i)
    ).toBeInTheDocument();

    // Wait for loading to complete to avoid act() warnings
    await waitFor(() => {
      expect(
        screen.queryByText(/Loading your assignments.../i)
      ).not.toBeInTheDocument();
    });
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

  test("shows dialog when calendar event is clicked", async () => {
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
        title: "CISC200 - 001", // This needs to match what you're testing for
        sessionType: "Lab",
        start: new Date("2025-05-02T10:00:00"),
        end: new Date("2025-05-02T12:00:00"),
        resource: {
          assignment: mockAssignment,
          timeSlot: {
            day: "friday",
          },
          role: "ta",
          hours: 3,
          location: "Room 101",
        },
      },
    ];
    transformAssignmentsToCalendarEvents.mockReturnValue(calendarEvents);

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    //Switch to Calendar Tab
    const calendarTab = await screen.findByText(/Calendar View/i);
    await user.click(calendarTab);
    await screen.findByText(/Weekly Schedule/i);
    //click on the event box
    const eventBox = await screen.findByText((content) =>
      content.includes("CISC200")
    );
    await user.click(eventBox);

    // screen.debug();
    //const modal = screen.getByRole("dialog");
    //screen.debug(modal);
    //dialog bos should show on screen
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  test("dialog displays correct event details and can be closed", async () => {
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
      course: {
        course_name: "Data Structures and Algorithms",
      },
      course_offering: {
        instructor: "Dr. Jane Smith",
      },
      notes: "Remember to review sorting algorithms before lab sessions.",
      offer_details: { offer_items: [] },
    };

    fetchStudentAssignments.mockResolvedValue({
      assignments: [mockAssignment],
      summary: {},
    });

    const calendarEvents = [
      {
        id: "evt1",
        title: "CISC320 - L01",
        sessionType: "Lab",
        start: new Date("2025-05-02T14:00:00"),
        end: new Date("2025-05-02T17:00:00"),
        resource: {
          assignment: mockAssignment,
          timeSlot: {
            day: "friday",
          },
          role: "ta",
          hours: 3,
          location: "STE 3-51",
        },
      },
    ];

    transformAssignmentsToCalendarEvents.mockReturnValue(calendarEvents);

    render(
      <MemoryRouter>
        <ViewStudentSchedule />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    // Switch to Calendar Tab
    const calendarTab = await screen.findByText(/Calendar View/i);
    await user.click(calendarTab);
    await screen.findByText(/Weekly Schedule/i);

    // Click on the event
    const eventBox = await screen.findByText("CISC320 - L01");
    await user.click(eventBox);

    // Verify dialog is open and displays correct information
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Check dialog title and description
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(
      "CISC320 - L01"
    );
    expect(screen.getByTestId("dialog-description")).toHaveTextContent("Lab");

    // Check schedule details
    expect(screen.getByText("May 2nd, 2025")).toBeInTheDocument();
    expect(screen.getByText("2:00 PM - 5:00 PM")).toBeInTheDocument();

    // Check location
    expect(screen.getByText("STE 3-51")).toBeInTheDocument();

    // Check course details
    expect(screen.getByText("Course Details")).toBeInTheDocument();
    expect(
      screen.getByText("Data Structures and Algorithms")
    ).toBeInTheDocument();
    expect(screen.getByText("Dr. Jane Smith")).toBeInTheDocument();

    // Check notes
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(
      screen.getByText(/Remember to review sorting algorithms/i)
    ).toBeInTheDocument();

    // Check close button
    const closeButton = screen.getByTestId("dialog-close");
    expect(closeButton).toBeInTheDocument();

    // Test closing the dialog
    await user.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
