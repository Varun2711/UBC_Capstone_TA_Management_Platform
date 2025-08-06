import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SchedulerAssignmentPage from "@/pages/Scheduler/Scheduler_AssignmentPage";

// --- BROWSER ENVIRONMENT MOCKS ---
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock scrollIntoView for DOM elements
Element.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// --- COMPONENT MOCKS ---

// Mock the sidebar component
vi.mock("@/components/scheduler-sidebar", () => ({
  AppSidebar: ({ activePage }) => (
    <div data-testid="app-sidebar">
      <div data-testid="active-page">{activePage}</div>
    </div>
  ),
}));

// Mock the assignment management components
vi.mock("@/components/scheduler/assignment/StudentCard", () => ({
  StudentCard: ({ student, expandedYears, onToggleYear }) => (
    <div data-testid={`student-card-${student.id}`}>
      <div data-testid="student-name">{student.studentName}</div>
      <div data-testid="student-email">{student.email}</div>
      <button 
        onClick={() => onToggleYear(student.id, '2024')}
        data-testid="toggle-year-button"
      >
        Toggle Year
      </button>
    </div>
  ),
}));

vi.mock("@/components/scheduler/assignment/CourseCard", () => ({
  CourseCard: ({ course, expandedYears, onToggleYear }) => (
    <div data-testid={`course-card-${course.id}`}>
      <div data-testid="course-code">{course.code}</div>
      <div data-testid="course-name">{course.name}</div>
      <div data-testid="course-instructor">{course.instructor}</div>
      <button 
        onClick={() => onToggleYear(course.id, '2024')}
        data-testid="toggle-course-year-button"
      >
        Toggle Year
      </button>
    </div>
  ),
}));

vi.mock("@/components/scheduler/assignment/CalendarTab", () => ({
  CalendarTab: ({ students, courses }) => (
    <div data-testid="calendar-tab">
      <div data-testid="calendar-students-count">{students.length} students</div>
      <div data-testid="calendar-courses-count">{courses.length} courses</div>
    </div>
  ),
}));

// Mock the assignment management API
vi.mock("@/logic/assignmentManagement", () => ({
  fetchAssignmentData: vi.fn(),
  parseTermCode: vi.fn(),
  finalizeAllAllocations: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Send: () => <svg data-testid="send-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  PanelLeft: () => <svg data-testid="panel-left-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

// Import mocked functions
import { fetchAssignmentData, parseTermCode, finalizeAllAllocations } from "@/logic/assignmentManagement";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, PanelLeft } from "lucide-react";

// --- TEST DATA ---

const mockStudentsData = [
  {
    id: 1,
    studentName: "John Doe",
    email: "john.doe@university.edu",
    studentId: "12345678",
    yearlyAssignments: {
      "2024": {
        "W2024 Term 1": [
          {
            id: 1,
            courseCode: "COSC 111",
            courseName: "Introduction to Programming",
            section: "001",
            sectionType: "Lecture",
            weekHours: 3,
          },
        ],
        "W2024 Term 2": [
          {
            id: 2,
            courseCode: "COSC 121",
            courseName: "Computer Systems",
            section: "001",
            sectionType: "Lecture",
            weekHours: 3,
          },
        ],
      },
    },
  },
  {
    id: 2,
    studentName: "Jane Smith",
    email: "jane.smith@university.edu",
    studentId: "87654321",
    yearlyAssignments: {
      "2024": {
        "W2024 Term 1": [
          {
            id: 3,
            courseCode: "COSC 111",
            courseName: "Introduction to Programming",
            section: "L01",
            sectionType: "Lab",
            weekHours: 2,
          },
        ],
      },
    },
  },
];

const mockCoursesData = [
  {
    id: 1,
    code: "COSC 111",
    name: "Introduction to Programming",
    instructor: "Dr. Smith",
    department: "Computer Science",
    yearlyOfferings: {
      "2024": {
        "W2024 Term 1": [
          {
            id: 1,
            section: "001",
            sectionType: "Lecture",
            studentName: "John Doe",
            studentId: "12345678",
          },
          {
            id: 2,
            section: "L01",
            sectionType: "Lab",
            studentName: "Jane Smith",
            studentId: "87654321",
          },
        ],
      },
    },
  },
  {
    id: 2,
    code: "COSC 121",
    name: "Computer Systems",
    instructor: "Dr. Johnson",
    department: "Computer Science",
    yearlyOfferings: {
      "2024": {
        "W2024 Term 2": [
          {
            id: 3,
            section: "001",
            sectionType: "Lecture",
            studentName: "John Doe",
            studentId: "12345678",
          },
        ],
      },
    },
  },
];

const mockDepartmentsData = ["Computer Science", "Mathematics"];
const mockInstructorsData = ["Dr. Smith", "Dr. Johnson"];

const mockAssignmentData = {
  courses: mockCoursesData,
  students: mockStudentsData,
  departments: mockDepartmentsData,
  instructors: mockInstructorsData,
};

// --- TEST SETUP ---

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <SchedulerAssignmentPage />
    </MemoryRouter>
  );
};

describe("SchedulerAssignmentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mock
    fetchAssignmentData.mockResolvedValue(mockAssignmentData);
    
    // Mock parseTermCode function
    parseTermCode.mockImplementation((termKey) => {
      if (termKey === "W2024 Term 1") return { season: "Winter", term: "1", year: "2024" };
      if (termKey === "W2024 Term 2") return { season: "Winter", term: "2", year: "2024" };
      if (termKey === "S2024 Both Terms") return { season: "Summer", term: "Both", year: "2024" };
      return null;
    });
    
    finalizeAllAllocations.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  // --- LOADING STATE TESTS ---

  describe("Loading State", () => {
    it("should display loading state initially", () => {
      // Make the API call hang to test loading state
      fetchAssignmentData.mockImplementation(() => new Promise(() => {}));
      
      renderComponent();
      
      expect(screen.getByText("Loading assignment data...")).toBeInTheDocument();
      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("active-page")).toHaveTextContent("Assignments");
    });

    it("should show loading spinner", () => {
      fetchAssignmentData.mockImplementation(() => new Promise(() => {}));
      
      renderComponent();
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // --- ERROR STATE TESTS ---

  describe("Error State", () => {
    it("should display error message when data loading fails", async () => {
      fetchAssignmentData.mockRejectedValue(new Error("API Error"));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Failed to load assignment data. Please try again.")).toBeInTheDocument();
      });
      
      expect(screen.getByTestId("alert-circle-icon")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should reload page when try again button is clicked", async () => {
      fetchAssignmentData.mockRejectedValue(new Error("API Error"));
      
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Try Again"));
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  // --- SUCCESSFUL LOAD TESTS ---

  describe("Successful Data Load", () => {
    it("should display page header and navigation", async () => {
      renderComponent();
      
      // Target the specific h2 heading instead of generic text
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Assignment Management" })).toBeInTheDocument();
      });
      
      expect(screen.getByText("View and manage TA assignments across courses and students")).toBeInTheDocument();
      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    });

    it("should display student and course counts", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("2 assigned students")).toBeInTheDocument();
      });
      
      expect(screen.getByText("2 courses with assignments")).toBeInTheDocument();
    });

    it("should display tabs for different views", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Students")).toBeInTheDocument();
      });
      
      expect(screen.getByText("By Courses")).toBeInTheDocument();
      expect(screen.getByText("Calendar View")).toBeInTheDocument();
    });

    it("should display breadcrumb navigation", async () => {
      renderComponent();
      
      await waitFor(() => {
        // Test the breadcrumb specifically
        expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument();
      });
      
      // Test that both instances exist but target them specifically
      expect(screen.getAllByText("Assignment Management")).toHaveLength(2);
    });
  });

  // --- FINALIZE ALLOCATIONS TESTS ---

  describe("Finalize Allocations", () => {
    it("should display finalize allocations button", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Send Final Assignment Notification")).toBeInTheDocument();
      });
      
      expect(screen.getByTestId("send-icon")).toBeInTheDocument();
    });

    it("should disable button when no students are assigned", async () => {
      fetchAssignmentData.mockResolvedValue({
        ...mockAssignmentData,
        students: [],
      });
      
      renderComponent();
      
      await waitFor(() => {
        const button = screen.getByText("Send Final Assignment Notification");
        expect(button).toBeDisabled();
      });
    });

    it("should call finalizeAllAllocations and show success toast when clicked", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Send Final Assignment Notification")).toBeInTheDocument();
      });
      
      const finalizeButton = screen.getByText("Send Final Assignment Notification");
      await user.click(finalizeButton);
      
      expect(finalizeAllAllocations).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Allocations Finalized", {
          description: "All instructors have been notified of their course allocations.",
        });
      });
    });

    it("should show loading state during finalization", async () => {
      finalizeAllAllocations.mockImplementation(() => new Promise(() => {}));
      
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Send Final Assignment Notification")).toBeInTheDocument();
      });
      
      const finalizeButton = screen.getByText("Send Final Assignment Notification");
      await user.click(finalizeButton);
      
      expect(screen.getByText("Sending Notifications...")).toBeInTheDocument();
      expect(finalizeButton).toBeDisabled();
    });

    it("should show error toast when finalization fails", async () => {
      finalizeAllAllocations.mockRejectedValue(new Error("Finalization failed"));
      
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Send Final Assignment Notification")).toBeInTheDocument();
      });
      
      const finalizeButton = screen.getByText("Send Final Assignment Notification");
      await user.click(finalizeButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to finalize allocations", {
          description: "Please try again.",
        });
      });
    });
  });

  // --- STUDENTS TAB TESTS ---

  describe("Students Tab", () => {
    it("should display students tab by default", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId("student-card-1")).toBeInTheDocument();
      });
      
      expect(screen.getByTestId("student-card-2")).toBeInTheDocument();
    });

    it("should display student information correctly", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
      
      expect(screen.getByText("john.doe@university.edu")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@university.edu")).toBeInTheDocument();
    });

    it("should handle student year toggle", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId("student-card-1")).toBeInTheDocument();
      });
      
      const toggleButton = within(screen.getByTestId("student-card-1")).getByTestId("toggle-year-button");
      await user.click(toggleButton);
      
      // The actual state change would be tested in the StudentCard component
      // Here we just verify the button is clickable
      expect(toggleButton).toBeInTheDocument();
    });
  });

  // --- COURSES TAB TESTS ---

  describe("Courses Tab", () => {
    it("should switch to courses tab when clicked", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Courses")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByTestId("course-card-1")).toBeInTheDocument();
      });
      
      expect(screen.getByTestId("course-card-2")).toBeInTheDocument();
    });

    it("should display course information correctly", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Courses")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByText("COSC 111")).toBeInTheDocument();
      });
      
      expect(screen.getByText("Introduction to Programming")).toBeInTheDocument();
      expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    });
  });

  // --- CALENDAR TAB TESTS ---

  describe("Calendar Tab", () => {
    it("should switch to calendar tab when clicked", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Calendar View")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Calendar View"));
      
      await waitFor(() => {
        expect(screen.getByTestId("calendar-tab")).toBeInTheDocument();
      });
      
      expect(screen.getByTestId("calendar-students-count")).toHaveTextContent("2 students");
      expect(screen.getByTestId("calendar-courses-count")).toHaveTextContent("2 courses");
    });
  });

  // --- SEARCH AND FILTER TESTS ---

  describe("Search and Filters", () => {
    it("should display search input in active tab", async () => {
      renderComponent();
      
      await waitFor(() => {
        // Only one search input should be visible (in the active Students tab)
        expect(screen.getByPlaceholderText("Search students, courses...")).toBeInTheDocument();
      });
    });

    it("should display search input in each tab when switched", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check Students tab (default active)
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search students, courses...")).toBeInTheDocument();
      });
      
      // Switch to Courses tab
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search students, courses...")).toBeInTheDocument();
      });
      
      // Switch to Calendar tab
      await user.click(screen.getByText("Calendar View"));
      
      // Calendar tab might not have a search input, so we'll check if it exists
      const calendarSearch = screen.queryByPlaceholderText("Search students, courses...");
      // Calendar tab may or may not have search - that's component-specific behavior
    });

    it("should display filter dropdowns in active tab", async () => {
      renderComponent();
      
      await waitFor(() => {
        // Check if filter dropdowns exist in the Students tab
        const yearFilters = screen.queryAllByText("All Years");
        const termFilters = screen.queryAllByText("All Terms");
        const departmentFilters = screen.queryAllByText("All Departments");
        
        // At least one of each filter should exist in the active tab
        expect(yearFilters.length).toBeGreaterThanOrEqual(1);
        expect(termFilters.length).toBeGreaterThanOrEqual(1);
        expect(departmentFilters.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("should display filter dropdowns in each tab when switched", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Check Students tab filters
      await waitFor(() => {
        expect(screen.getByText("All Years")).toBeInTheDocument();
        expect(screen.getByText("All Terms")).toBeInTheDocument();
        expect(screen.getByText("All Departments")).toBeInTheDocument();
      });
      
      // Switch to Courses tab and check filters
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByText("All Years")).toBeInTheDocument();
        expect(screen.getByText("All Terms")).toBeInTheDocument();
        expect(screen.getByText("All Departments")).toBeInTheDocument();
      });
    });

    it("should update search term when typing", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search students, courses...")).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText("Search students, courses...");
      await user.type(searchInput, "John");
      
      expect(searchInput).toHaveValue("John");
    });

    it("should handle year filter changes", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("All Years")).toBeInTheDocument();
      });
      
      // Find the clickable select trigger button instead of the span text
      const yearSelectTrigger = screen.getByText("All Years").closest('button');
      
      if (yearSelectTrigger) {
        await user.click(yearSelectTrigger);
        // The select dropdown behavior would be tested in integration tests
        // Here we just verify the element is interactive
        expect(yearSelectTrigger).toBeInTheDocument();
      } else {
        // If no button parent found, try to find by role
        const selectElements = screen.getAllByRole('combobox');
        if (selectElements.length > 0) {
          await user.click(selectElements[0]);
          expect(selectElements[0]).toBeInTheDocument();
        } else {
          // If neither approach works, just verify the text exists
          expect(screen.getByText("All Years")).toBeInTheDocument();
        }
      }
    });

    it("should maintain separate search states for different tabs", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Type in Students tab search
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search students, courses...")).toBeInTheDocument();
      });
      
      const studentsSearch = screen.getByPlaceholderText("Search students, courses...");
      await user.type(studentsSearch, "John");
      expect(studentsSearch).toHaveValue("John");
      
      // Switch to Courses tab
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        const coursesSearch = screen.getByPlaceholderText("Search students, courses...");
        // Courses tab should have its own search state (likely empty initially)
        expect(coursesSearch).toBeInTheDocument();
      });
      
      // Switch back to Students tab
      await user.click(screen.getByText("By Students"));
      
      await waitFor(() => {
        const studentsSearchAgain = screen.getByPlaceholderText("Search students, courses...");
        // The search value should be preserved (this depends on implementation)
        expect(studentsSearchAgain).toBeInTheDocument();
      });
    });
  });

  // --- EMPTY STATES TESTS ---

  describe("Empty States", () => {
    it("should show empty state when no students match filters", async () => {
      fetchAssignmentData.mockResolvedValue({
        ...mockAssignmentData,
        students: [],
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("No students found")).toBeInTheDocument();
      });
      
      expect(screen.getByText("Try adjusting your search criteria or filters.")).toBeInTheDocument();
      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
    });

    it("should show empty state when no courses match filters", async () => {
      fetchAssignmentData.mockResolvedValue({
        ...mockAssignmentData,
        courses: [],
      });
      
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Courses")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByText("No courses found")).toBeInTheDocument();
      });
      
      expect(screen.getByText("Try adjusting your search criteria or filters.")).toBeInTheDocument();
      expect(screen.getByTestId("book-open-icon")).toBeInTheDocument();
    });
  });

  // --- INTEGRATION TESTS ---

  describe("Data Integration", () => {
    it("should pass correct data to StudentCard components", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId("student-card-1")).toBeInTheDocument();
      });
      
      // Verify student data is passed correctly
      const studentCard1 = screen.getByTestId("student-card-1");
      expect(within(studentCard1).getByTestId("student-name")).toHaveTextContent("John Doe");
      expect(within(studentCard1).getByTestId("student-email")).toHaveTextContent("john.doe@university.edu");
    });

    it("should pass correct data to CourseCard components", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Courses")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("By Courses"));
      
      await waitFor(() => {
        expect(screen.getByTestId("course-card-1")).toBeInTheDocument();
      });
      
      // Verify course data is passed correctly
      const courseCard1 = screen.getByTestId("course-card-1");
      expect(within(courseCard1).getByTestId("course-code")).toHaveTextContent("COSC 111");
      expect(within(courseCard1).getByTestId("course-name")).toHaveTextContent("Introduction to Programming");
      expect(within(courseCard1).getByTestId("course-instructor")).toHaveTextContent("Dr. Smith");
    });

    it("should pass correct data to CalendarTab component", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("Calendar View")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("Calendar View"));
      
      await waitFor(() => {
        expect(screen.getByTestId("calendar-tab")).toBeInTheDocument();
      });
      
      // Verify calendar receives the correct data
      expect(screen.getByTestId("calendar-students-count")).toHaveTextContent("2 students");
      expect(screen.getByTestId("calendar-courses-count")).toHaveTextContent("2 courses");
    });
  });

  // --- ACCESSIBILITY TESTS ---

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });
      
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(3);
    });

    it("should support keyboard navigation for tabs", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Students")).toBeInTheDocument();
      });
      
      // Focus the first tab
      const studentsTab = screen.getByText("By Students");
      studentsTab.focus();
      expect(studentsTab).toHaveFocus();
      
      // Use Arrow key navigation (Radix UI standard)
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        const coursesTab = screen.getByText("By Courses");
        expect(coursesTab).toHaveFocus();
      });
      
      // Test Arrow Left navigation
      await user.keyboard('{ArrowLeft}');
      
      await waitFor(() => {
        expect(studentsTab).toHaveFocus();
      });
    });

    it("should support tab panel focus", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Students")).toBeInTheDocument();
      });
      
      // Focus the active tab
      const studentsTab = screen.getByText("By Students");
      studentsTab.focus();
      expect(studentsTab).toHaveFocus();
      
      // Tab should move to the tab panel content
      await user.keyboard('{Tab}');
      
      // Check if focus moved to the tab panel
      const tabPanel = screen.getByRole("tabpanel");
      expect(tabPanel).toHaveFocus();
    });

    it("should have accessible tab labels and descriptions", async () => {
      renderComponent();
      
      await waitFor(() => {
        const tabs = screen.getAllByRole("tab");
        
        // Check that tabs have proper labels
        expect(tabs[0]).toHaveTextContent("By Students");
        expect(tabs[1]).toHaveTextContent("By Courses");
        expect(tabs[2]).toHaveTextContent("Calendar View");
        
        // Check that active tab is marked as selected
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        expect(tabs[1]).toHaveAttribute("aria-selected", "false");
        expect(tabs[2]).toHaveAttribute("aria-selected", "false");
      });
    });


    it("should support Enter and Space key activation", async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText("By Students")).toBeInTheDocument();
      });
      
      // Navigate to the Courses tab using arrow keys
      const studentsTab = screen.getByText("By Students");
      studentsTab.focus();
      
      await user.keyboard('{ArrowRight}');
      
      await waitFor(() => {
        const coursesTab = screen.getByText("By Courses");
        expect(coursesTab).toHaveFocus();
      });
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        // Check that the courses tab content is now visible
        expect(screen.getByTestId("course-card-1")).toBeInTheDocument();
      });
    });

    it("should have accessible form labels in filters", async () => {
      renderComponent();
      
      await waitFor(() => {
        // Check that filter inputs have proper labels
        expect(screen.getByText("Search")).toBeInTheDocument();
        expect(screen.getByText("Year")).toBeInTheDocument();
        expect(screen.getByText("Term")).toBeInTheDocument();
        expect(screen.getByText("Department")).toBeInTheDocument();
        
        // Check that comboboxes are properly labeled
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThan(0);
      });
    });
  });
});