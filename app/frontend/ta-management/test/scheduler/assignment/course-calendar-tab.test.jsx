import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { CourseCalendarTab } from "@/components/scheduler/assignment/CourseCalendarTab";

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ events }) => (
    <div data-testid="calendar">
      Calendar with {events.length} events
    </div>
  ),
  momentLocalizer: () => ({})
}));

// Mock moment
vi.mock('moment', () => {
  const moment = vi.fn(() => ({
    startOf: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    hour: vi.fn().mockReturnThis(),
    minute: vi.fn().mockReturnThis(),
    second: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date('2024-01-01T09:00:00')),
    format: vi.fn(() => 'Monday 9:00 AM')
  }));
  return { default: moment };
});

// Mock assignment management logic
vi.mock("@/logic/assignmentManagement", () => ({
  parseTermCode: vi.fn((termKey) => {
    if (termKey === "2024W1") return { season: "Winter", term: "1" };
    if (termKey === "2024W2") return { season: "Winter", term: "2" };
    return null;
  }),
}));

describe("CourseCalendarTab", () => {
  const mockCourses = [
    {
      id: 1,
      code: "COSC 111",
      name: "Introduction to Programming",
      department: "Computer Science",
      instructor: "Dr. Smith",
      yearlyOfferings: {
        "2024": {
          "2024W1": [
            {
              id: 1,
              section: "001",
              sectionType: "Lecture",
              weekHours: 3,
              assignedTA: "John Doe",
              studentId: "12345678",
              timeSlots: [
                {
                  day: "Monday",
                  startTime: "9:00 AM",
                  endTime: "10:00 AM",
                },
              ],
            },
          ],
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with initial state", () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    expect(screen.getByText("Course Schedule Calendar")).toBeInTheDocument();
    expect(screen.getByText("Select Course")).toBeInTheDocument();
    expect(screen.getByText("Academic Year")).toBeInTheDocument();
    expect(screen.getByText("Term")).toBeInTheDocument();
  });

  it("shows placeholder when no course is selected", () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    expect(screen.getByText("Select Course, Year, and Term")).toBeInTheDocument();
    expect(screen.getByText("Choose a course, academic year, and term to view its weekly schedule.")).toBeInTheDocument();
  });

  it("opens course search popover when clicked", async () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    const searchButton = screen.getByText("Search courses...");
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search courses...")).toBeInTheDocument();
    });
  });

  it("displays course info when course is selected", async () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    const searchButton = screen.getByText("Search courses...");
    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("COSC 111 - Introduction to Programming")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("COSC 111 - Introduction to Programming"));

    await waitFor(() => {
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
    });
  });

  it("handles empty courses array", () => {
    render(<CourseCalendarTab courses={[]} />);

    expect(screen.getByText("Course Schedule Calendar")).toBeInTheDocument();
    expect(screen.getByText("Select Course, Year, and Term")).toBeInTheDocument();
  });

  it("year select is initially disabled", () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    // Look for the text "Select year" which should be in the placeholder
    const yearSelectText = screen.getByText("Select year");
    expect(yearSelectText).toBeInTheDocument();
    
    // Find the button containing this text and check if it's disabled
    const yearSelectButton = yearSelectText.closest("button");
    expect(yearSelectButton).toHaveAttribute("data-disabled");
  });

  it("term select is initially disabled", () => {
    render(<CourseCalendarTab courses={mockCourses} />);

    // Look for the text "Select term" which should be in the placeholder
    const termSelectText = screen.getByText("Select term");
    expect(termSelectText).toBeInTheDocument();
    
    // Find the button containing this text and check if it's disabled
    const termSelectButton = termSelectText.closest("button");
    expect(termSelectButton).toHaveAttribute("data-disabled");
  });
});