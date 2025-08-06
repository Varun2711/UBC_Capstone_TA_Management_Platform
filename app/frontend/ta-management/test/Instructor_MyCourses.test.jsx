import MyCourses from "@/pages/Instructor_MyCourses";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// helper fn. to render page
const renderMyCoursesPage = () => {
  return render(
    <MemoryRouter initialEntries={["/my-courses"]}>
      <MyCourses />
    </MemoryRouter>
  );
};

// Mock terms data
const mockTerms = {
  results: [
    {
      id: 1,
      code: "W2025 Term 1",
      description: "Winter Term 1 2024/2025",
      academicYear: "2024/25",
      term_type: "winter",
      is_active: true,
    },
    {
      id: 2,
      code: "W2025 Term 2",
      description: "Winter Term 2 2024/2025",
      academicYear: "2024/25",
      term_type: "winter",
      is_active: true,
    },
    {
      id: 3,
      code: "S2025 Term 1",
      description: "Summer Term 1 2025",
      academicYear: "2024/25",
      term_type: "summer",
      is_active: true,
    },
  ],
};

// Mock instructor profile
const mockProfile = {
  id: 1,
  name: "Dr. Test Instructor",
};

// Mock course offerings data
const mockCourseOfferings = [
  {
    course_offering_id: "1",
    course_info: "COSC 111 Computer Programming I",
    course_description:
      "Fundamental concepts of programming using Python. Variables, control structures, functions, and basic data structures.",
    course_id: 1,
    section_number: "001",
    term_info: "W2025 Term 1",
    academic_term: 1,
    instructor_info: "Dr. Test Instructor",
    instructor_id_read: 1,
    is_active: true,
  },
  {
    course_offering_id: "2",
    course_info: "COSC 121 Computer Programming II",
    course_description:
      "Object-oriented programming with classes, inheritance, polymorphism, and exception handling using Java or C++.",
    course_id: 2,
    section_number: "002",
    term_info: "W2025 Term 2",
    academic_term: 2,
    instructor_info: "Dr. Test Instructor",
    instructor_id_read: 1,
    is_active: true,
  },
  {
    course_offering_id: "3",
    course_info: "COSC 211 Machine Architecture",
    course_description:
      "Computer organization, assembly language programming, processor design, and memory systems.",
    course_id: 3,
    section_number: "001",
    term_info: "S2025 Term 1",
    academic_term: 3,
    instructor_info: "Dr. Test Instructor",
    instructor_id_read: 1,
    is_active: true,
  },
  {
    course_offering_id: "4",
    course_info: "COSC 301 Advanced Programming",
    course_description:
      "Advanced programming concepts and software engineering practices.",
    course_id: 4,
    section_number: "001",
    term_info: "W2025 Term 1",
    academic_term: 1,
    instructor_info: "Dr. Test Instructor",
    instructor_id_read: 1,
    is_active: false,
  },
];

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: vi.fn(() => "mock-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Start of tests
describe("Instructor/My Courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup axios mocks
    axios.get.mockImplementation((url) => {
      if (url === "/api/course-term-service/terms/") {
        return Promise.resolve({ data: mockTerms });
      }
      if (
        url === "/api/profile/me/" ||
        url === "http://localhost:8080/api/profile/me/"
      ) {
        return Promise.resolve({ data: mockProfile });
      }
      if (
        url.includes("/api/course-term-service/course-offerings/by_instructor/")
      ) {
        return Promise.resolve({ data: mockCourseOfferings });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });
  });

  it("renders the 'My Courses' page correctly", async () => {
    renderMyCoursesPage();

    // check that main page headers are rendered
    expect(
      screen.getByRole("heading", { level: 1, name: "My Courses" })
    ).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Current Academic Session:/)).toBeInTheDocument();
    });

    // Check that all filter dropdowns are present
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(4); // Year, Term Type, Term, Status

    // Check that search bar is present
    expect(
      screen.getByPlaceholderText(
        /Search by course title, course number, or section/
      )
    ).toBeInTheDocument();

    // Check that clear filters button is present
    expect(
      screen.getByRole("button", { name: "Clear Filters" })
    ).toBeInTheDocument();

    // Check that course offerings are displayed (only winter courses due to default filter)
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
      expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
      // Machine Architecture is summer, so it should not be visible with default winter filter
      expect(
        screen.queryByText("Machine Architecture")
      ).not.toBeInTheDocument();
    });

    // Check course codes and sections (only winter courses)
    expect(screen.getByText("COSC 111 - 001")).toBeInTheDocument();
    expect(screen.getByText("COSC 121 - 002")).toBeInTheDocument();
    // COSC 211 is summer course, should not be visible with winter filter
    expect(screen.queryByText("COSC 211 - 001")).not.toBeInTheDocument();

    // Check course descriptions are displayed (only winter courses)
    expect(
      screen.getByText(/Fundamental concepts of programming using Python/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Object-oriented programming with classes/)
    ).toBeInTheDocument();
    // Machine Architecture description should not be visible with winter filter
    expect(
      screen.queryByText(/Computer organization, assembly language programming/)
    ).not.toBeInTheDocument();
  });

  it("filters courses by term correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the term filter dropdown (fourth dropdown)
    const selects = screen.getAllByRole("combobox");
    const termSelect = selects[2]; // Year, Term Type, Term, Status

    // Initially should show "All Terms"
    expect(termSelect.value).toBe("all");

    // Should show only winter courses initially (since termType defaults to "winter")
    expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
    // Machine Architecture is summer, so it should not be visible with winter filter
    expect(screen.queryByText("Machine Architecture")).not.toBeInTheDocument();
  });

  it("filters courses by term type correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the term type filter dropdown (second dropdown)
    const selects = screen.getAllByRole("combobox");
    const termTypeSelect = selects[1]; // Year, Term Type, Term, Status

    // Initially should show "winter"
    expect(termTypeSelect.value).toBe("winter");

    // Should show only winter courses initially
    expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
    // Machine Architecture is summer, so it should not be visible with winter filter
    expect(screen.queryByText("Machine Architecture")).not.toBeInTheDocument();
  });

  it("filters courses by academic year correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the year filter dropdown (first dropdown)
    const selects = screen.getAllByRole("combobox");
    const yearSelect = selects[0]; // Year, Term Type, Term, Status

    // Initially should show "all"
    expect(yearSelect.value).toBe("all");

    // Check that year options are populated from mock data
    await waitFor(() => {
      expect(screen.getByDisplayValue("All Years")).toBeInTheDocument();
    });
  });

  it("search functionality works correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the search input
    const searchInput = screen.getByPlaceholderText(
      /Search by course title, course number, or section/
    );

    // Test searching by course number
    fireEvent.change(searchInput, { target: { value: "111" } });

    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
      expect(
        screen.queryByText("Computer Programming II")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Machine Architecture")
      ).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
      expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
    });

    // Test searching by course title
    // First switch to summer term type to be able to see Machine Architecture
    const selects = screen.getAllByRole("combobox");
    const termTypeSelect = selects[1]; // Year, Term Type, Term, Status
    fireEvent.change(termTypeSelect, { target: { value: "summer" } });

    // Wait for filter to apply
    await waitFor(() => {
      expect(screen.getByText("Machine Architecture")).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "Architecture" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Computer Programming I")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Computer Programming II")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Machine Architecture")).toBeInTheDocument();
    });
  });

  it("clear filters button works correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get filter elements
    const selects = screen.getAllByRole("combobox");
    const yearSelect = selects[0];
    const termTypeSelect = selects[1];
    const termSelect = selects[2];
    const statusSelect = selects[3];
    const searchInput = screen.getByPlaceholderText(
      /Search by course title, course number, or section/
    );
    const clearButton = screen.getByRole("button", { name: "Clear Filters" });

    // Set some filters and search
    fireEvent.change(searchInput, { target: { value: "test search" } });

    // Click clear filters
    fireEvent.click(clearButton);

    // Check that all filters are reset
    await waitFor(() => {
      expect(yearSelect.value).toBe("all");
      expect(termTypeSelect.value).toBe("winter");
      expect(termSelect.value).toBe("all");
      expect(statusSelect.value).toBe("all");
      expect(searchInput.value).toBe("");
    });
  });

  it("displays session year information correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load and check default session display
    await waitFor(() => {
      expect(screen.getByText(/Current Academic Session:/)).toBeInTheDocument();
      expect(
        screen.getByText(/All Years Winter - All Terms/)
      ).toBeInTheDocument();
    });
  });

  it("filters courses by status (active/inactive) correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the status filter dropdown (fourth dropdown)
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[3]; // Year, Term Type, Term, Status

    // Initially should show "all"
    expect(statusSelect.value).toBe("all");

    // Should show active courses by default (including the inactive one since filter is "all")
    // But we need to check the count - by default winter filter is active, so we should see 2 active winter courses + 1 inactive winter course
    expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
    expect(screen.getByText("Advanced Programming")).toBeInTheDocument();

    // Filter to show only active courses
    fireEvent.change(statusSelect, { target: { value: "active" } });

    await waitFor(() => {
      // Should show only active courses
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
      expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
      // Inactive course should not be visible
      expect(
        screen.queryByText("Advanced Programming")
      ).not.toBeInTheDocument();
    });

    // Filter to show only inactive courses
    fireEvent.change(statusSelect, { target: { value: "inactive" } });

    await waitFor(() => {
      // Should show only inactive courses
      expect(
        screen.queryByText("Computer Programming I")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Computer Programming II")
      ).not.toBeInTheDocument();
      // Inactive course should be visible
      expect(screen.getByText("Advanced Programming")).toBeInTheDocument();
    });

    // Reset to show all courses
    fireEvent.change(statusSelect, { target: { value: "all" } });

    await waitFor(() => {
      // Should show all courses again
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
      expect(screen.getByText("Computer Programming II")).toBeInTheDocument();
      expect(screen.getByText("Advanced Programming")).toBeInTheDocument();
    });
  });

  it("displays status indicators on course cards correctly", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Check that active course shows "Active" badge
    const activeBadges = screen.getAllByText("Active");
    expect(activeBadges.length).toBeGreaterThan(0);

    // Check that inactive course shows "Inactive" badge
    const inactiveBadges = screen.getAllByText("Inactive");
    expect(inactiveBadges.length).toBeGreaterThan(0);
  });

  it("displays status filter information in session summary", async () => {
    renderMyCoursesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Computer Programming I")).toBeInTheDocument();
    });

    // Get the status filter dropdown
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[3];

    // Filter to show only active courses
    fireEvent.change(statusSelect, { target: { value: "active" } });

    await waitFor(() => {
      // Should show status filter information in the summary
      expect(
        screen.getByText(/Showing active courses only/)
      ).toBeInTheDocument();
    });

    // Filter to show only inactive courses
    fireEvent.change(statusSelect, { target: { value: "inactive" } });

    await waitFor(() => {
      // Should show status filter information in the summary
      expect(
        screen.getByText(/Showing inactive courses only/)
      ).toBeInTheDocument();
    });
  });

  it("displays 'no courses' message when no courses are available", async () => {
    // Mock empty course offerings
    axios.get.mockImplementation((url) => {
      if (url === "/api/course-term-service/terms/") {
        return Promise.resolve({ data: mockTerms });
      }
      if (url === "/api/profile/me/") {
        return Promise.resolve({ data: mockProfile });
      }
      if (
        url.includes("/api/course-term-service/course-offerings/by_instructor/")
      ) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    renderMyCoursesPage();

    await waitFor(() => {
      expect(
        screen.getByText(
          "You are not teaching any courses for the selected term"
        )
      ).toBeInTheDocument();
    });
  });
});
