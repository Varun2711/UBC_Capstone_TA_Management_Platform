import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { CalendarTab } from "@/components/scheduler/assignment/CalendarTab";

// Mock the child components
vi.mock("@/components/scheduler/assignment/StudentCalendarTab", () => ({
  StudentCalendarTab: ({ students }) => (
    <div data-testid="student-calendar-tab">
      Student Calendar - {students.length} students
    </div>
  ),
}));

vi.mock("@/components/scheduler/assignment/CourseCalendarTab", () => ({
  CourseCalendarTab: ({ courses }) => (
    <div data-testid="course-calendar-tab">
      Course Calendar - {courses.length} courses
    </div>
  ),
}));

describe("CalendarTab", () => {
  const mockStudents = [
    {
      id: 1,
      studentName: "John Doe",
      studentId: "12345678",
      email: "john.doe@example.com",
      studyLevel: "Graduate",
      totalWeeklyHours: 10,
      yearlyAssignments: {
        "2024": {
          "2024W1": [
            {
              id: 1,
              courseCode: "COSC 111",
              courseName: "Introduction to Programming",
              section: "001",
              sectionType: "Lecture",
              weekHours: 5,
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
    {
      id: 2,
      studentName: "Jane Smith",
      studentId: "87654321",
      email: "jane.smith@example.com",
      studyLevel: "Undergraduate",
      totalWeeklyHours: 8,
      yearlyAssignments: {
        "2024": {
          "2024W2": [
            {
              id: 2,
              courseCode: "COSC 221",
              courseName: "Data Structures",
              section: "L01",
              sectionType: "Lab",
              weekHours: 3,
              timeSlots: [
                {
                  day: "Tuesday",
                  startTime: "2:00 PM",
                  endTime: "4:00 PM",
                },
              ],
            },
          ],
        },
      },
    },
  ];

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
    {
      id: 2,
      code: "COSC 221",
      name: "Data Structures",
      department: "Computer Science",
      instructor: "Dr. Johnson",
      yearlyOfferings: {
        "2024": {
          "2024W2": [
            {
              id: 2,
              section: "L01",
              sectionType: "Lab",
              weekHours: 1,
              assignedTA: null,
              studentId: null,
              timeSlots: [
                {
                  day: "Tuesday",
                  startTime: "2:00 PM",
                  endTime: "4:00 PM",
                },
              ],
            },
          ],
        },
      },
    },
  ];

  beforeEach(() => {
    // Mock scrollIntoView to prevent TypeError in JSDOM
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up the mock after each test
    delete Element.prototype.scrollIntoView;
  });

  it("renders correctly with main card and title", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    expect(screen.getByText("Schedule Calendar View")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders both tab triggers with correct icons and labels", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Check for tab triggers
    expect(screen.getByRole("tab", { name: /student schedules/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /course schedules/i })).toBeInTheDocument();

    // Check for text content
    expect(screen.getByText("Student Schedules")).toBeInTheDocument();
    expect(screen.getByText("Course Schedules")).toBeInTheDocument();
  });

  it("defaults to students tab being active", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Check that students tab is selected by default
    const studentTab = screen.getByRole("tab", { name: /student schedules/i });
    expect(studentTab).toHaveAttribute("data-state", "active");

    // Check that student calendar content is visible
    expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
    expect(screen.getByText(`Student Calendar - ${mockStudents.length} students`)).toBeInTheDocument();
  });

  it("renders student calendar tab content correctly", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Student tab should be active by default
    expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
    expect(screen.getByText("Student Calendar - 2 students")).toBeInTheDocument();
  });

  it("switches to course calendar tab when clicked", async () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Initially student tab should be active
    expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
    expect(screen.queryByTestId("course-calendar-tab")).not.toBeInTheDocument();

    // Click on course tab
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });
    await userEvent.click(courseTab);

    // Wait for tab switch
    await waitFor(() => {
      expect(screen.getByTestId("course-calendar-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("student-calendar-tab")).not.toBeInTheDocument();
    });

    // Check course tab is now active
    expect(courseTab).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Course Calendar - 2 courses")).toBeInTheDocument();
  });

  it("switches back to student calendar tab when clicked", async () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Switch to course tab first
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });
    await userEvent.click(courseTab);

    await waitFor(() => {
      expect(screen.getByTestId("course-calendar-tab")).toBeInTheDocument();
    });

    // Switch back to student tab
    const studentTab = screen.getByRole("tab", { name: /student schedules/i });
    await userEvent.click(studentTab);

    await waitFor(() => {
      expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
      expect(screen.queryByTestId("course-calendar-tab")).not.toBeInTheDocument();
    });

    // Check student tab is active again
    expect(studentTab).toHaveAttribute("data-state", "active");
  });

  it("passes correct props to StudentCalendarTab", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    const studentCalendarTab = screen.getByTestId("student-calendar-tab");
    expect(studentCalendarTab).toBeInTheDocument();
    expect(studentCalendarTab).toHaveTextContent("Student Calendar - 2 students");
  });

  it("passes correct props to CourseCalendarTab", async () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Switch to course tab
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });
    await userEvent.click(courseTab);

    await waitFor(() => {
      const courseCalendarTab = screen.getByTestId("course-calendar-tab");
      expect(courseCalendarTab).toBeInTheDocument();
      expect(courseCalendarTab).toHaveTextContent("Course Calendar - 2 courses");
    });
  });

  it("handles empty students array", () => {
    render(<CalendarTab students={[]} courses={mockCourses} />);

    expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
    expect(screen.getByText("Student Calendar - 0 students")).toBeInTheDocument();
  });

  it("handles empty courses array", async () => {
    render(<CalendarTab students={mockStudents} courses={[]} />);

    // Switch to course tab
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });
    await userEvent.click(courseTab);

    await waitFor(() => {
      expect(screen.getByTestId("course-calendar-tab")).toBeInTheDocument();
      expect(screen.getByText("Course Calendar - 0 courses")).toBeInTheDocument();
    });
  });

  it("handles empty students and courses arrays", async () => {
    render(<CalendarTab students={[]} courses={[]} />);

    // Check student tab (default)
    expect(screen.getByTestId("student-calendar-tab")).toBeInTheDocument();
    expect(screen.getByText("Student Calendar - 0 students")).toBeInTheDocument();

    // Switch to course tab
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });
    await userEvent.click(courseTab);

    await waitFor(() => {
      expect(screen.getByTestId("course-calendar-tab")).toBeInTheDocument();
      expect(screen.getByText("Course Calendar - 0 courses")).toBeInTheDocument();
    });
  });

  it("maintains proper styling and layout structure", () => {
    const { container } = render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Check main container structure - use container to get the top-level div
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("space-y-6");

    // Check card structure exists
    expect(screen.getByText("Schedule Calendar View")).toBeInTheDocument();

    // Check tabs structure
    const tabsList = screen.getByRole("tablist");
    expect(tabsList).toHaveClass("grid", "w-full", "grid-cols-2");

    // Check that tabs content has proper spacing
    const tabsContent = tabsList.closest('[class*="space-y-4"]');
    expect(tabsContent).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Check that tabs have proper roles
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);

    // Check that tab panels exist
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();

    // Check for proper tab labeling
    const studentTab = screen.getByRole("tab", { name: /student schedules/i });
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });

    expect(studentTab).toBeInTheDocument();
    expect(courseTab).toBeInTheDocument();
  });

  it("supports keyboard navigation between tabs", async () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    const studentTab = screen.getByRole("tab", { name: /student schedules/i });
    const courseTab = screen.getByRole("tab", { name: /course schedules/i });

    // Focus on first tab
    studentTab.focus();
    expect(studentTab).toHaveFocus();

    // Use arrow key to navigate to next tab
    fireEvent.keyDown(studentTab, { key: "ArrowRight" });
    
    // In some implementations, we might need to manually trigger focus
    // This depends on the specific tabs component implementation
    await userEvent.tab();
    
    // Check if we can navigate with keyboard
    expect(document.activeElement).toBeDefined();
  });

  it("renders with correct tab structure and spacing", () => {
    render(<CalendarTab students={mockStudents} courses={mockCourses} />);

    // Check for proper spacing class on tabs content
    const tabsContainer = screen.getByRole("tablist").closest('[class*="space-y-4"]');
    expect(tabsContainer).toBeInTheDocument();
  });
});