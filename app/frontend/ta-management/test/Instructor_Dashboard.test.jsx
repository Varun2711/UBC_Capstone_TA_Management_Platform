import { vi, describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InstructorDashboard from "@/pages/InstructorDashboard";

// --- MOCKS ---

// 🎯 FIX 1: Mock the child component to prevent its async useEffect from running.
// This isolates the dashboard and is the primary fix for the unhandled rejection.
vi.mock("@/components/instructor-dashboard-sidebar", () => ({
  InstructorSidebar: vi.fn(() => {
    return <div data-testid="mock-sidebar">Mocked Instructor Sidebar</div>;
  }),
}));

// 🎯 FIX 2: Mock the fetchInstructorDashboardData function to prevent real API calls
vi.mock("@/logic/instructorDashboard", () => ({
  fetchInstructorDashboardData: vi.fn().mockResolvedValue({
    instructor: {
      id: 1,
      name: "Dr. John Smith",
      role: "Instructor",
      department: "Computer Science",
    },
    courses: [
      {
        id: 1,
        course_id: 101,
        code: "COSC 101",
        name: "Introduction to Programming",
        section: "001",
        term: "2025W1",
        term_info: "2025W1-Term 1",
        status: "active",
        timeSlots: [
          {
            day_display: "Monday",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
          {
            day_display: "Wednesday",
            start_time: "09:00:00",
            end_time: "10:00:00",
          },
        ],
      },
      {
        id: 2,
        course_id: 221,
        code: "COSC 221",
        name: "Discrete Structures",
        section: "002",
        term: "2025W2",
        term_info: "2025W2-Term 2",
        status: "active",
        timeSlots: [
          {
            day_display: "Tuesday",
            start_time: "14:00:00",
            end_time: "15:30:00",
          },
          {
            day_display: "Thursday",
            start_time: "14:00:00",
            end_time: "15:30:00",
          },
        ],
      },
    ],
    stats: {
      activeCourses: 2,
      totalTAs: 5,
      totalCourses: 2,
      pendingRequests: 3,
    },
  }),
}));

// 🎯 FIX 3: Mock window.matchMedia for any responsive UI components.
// This is a standard fix for "window is not defined" errors from UI libraries.
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <InstructorDashboard />
    </MemoryRouter>
  );
};

describe("InstructorDashboard", () => {
  it("renders the dashboard overview with stats and course list", async () => {
    renderWithRouter();

    // Check that the mocked sidebar is present
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();

    // Wait for the component to load data
    await screen.findByText("Dr. John Smith");

    // Check for the welcome message and stats
    expect(
      screen.getByRole("heading", { name: /dr\. john smith/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Instructor")).toBeInTheDocument();

    // Check for stats cards
    expect(screen.getByText("Active Courses")).toBeInTheDocument();
    expect(screen.getByText("Total TAs")).toBeInTheDocument();
    expect(screen.getByText("Total Courses")).toBeInTheDocument();
    expect(screen.getByText("Pending Requests")).toBeInTheDocument();

    // Check stats values by finding them within their respective cards
    const activeCourseCard = screen
      .getByText("Active Courses")
      .closest(".rounded-lg");
    expect(activeCourseCard).toHaveTextContent("2");

    const totalTAsCard = screen.getByText("Total TAs").closest(".rounded-lg");
    expect(totalTAsCard).toHaveTextContent("5");

    const pendingRequestsCard = screen
      .getByText("Pending Requests")
      .closest(".rounded-lg");
    expect(pendingRequestsCard).toHaveTextContent("3");

    // Check that course cards are rendered
    expect(screen.getByText("COSC 101")).toBeInTheDocument();
    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("COSC 221")).toBeInTheDocument();
    expect(screen.getByText("Discrete Structures")).toBeInTheDocument();

    // Check for "View Course Details" buttons
    const viewDetailsButtons = screen.getAllByText("View Course Details");
    expect(viewDetailsButtons).toHaveLength(2);
  });

  it("renders course cards with correct information", async () => {
    renderWithRouter();

    // Wait for the component to load data
    await screen.findByText("Dr. John Smith");

    // Check first course card details
    expect(screen.getByText("COSC 101")).toBeInTheDocument();
    expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("Section: 001")).toBeInTheDocument();
    expect(screen.getByText("2025W1")).toBeInTheDocument();

    // Check second course card details
    expect(screen.getByText("COSC 221")).toBeInTheDocument();
    expect(screen.getByText("Discrete Structures")).toBeInTheDocument();
    expect(screen.getByText("Section: 002")).toBeInTheDocument();
    expect(screen.getByText("2025W2")).toBeInTheDocument();
  });

  it("renders Quick Info section", async () => {
    renderWithRouter();

    // Wait for the component to load data
    await screen.findByText("Dr. John Smith");

    // Check for Quick Info section
    expect(screen.getByText("Quick Info")).toBeInTheDocument();
    expect(screen.getByText("View Assigned Courses")).toBeInTheDocument();
    expect(
      screen.getByText(/The TAs for your courses have not been assigned yet/i)
    ).toBeInTheDocument();
  });
});
