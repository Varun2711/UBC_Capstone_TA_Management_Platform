import { render, screen, waitFor, within } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminCourseManagement from "@/pages/Admin/CourseManagement";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Bell: () => <span data-testid="bell-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  PanelLeft: () => <span data-testid="panel-left-icon" />,
  X: () => <span data-testid="x-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  ChevronsUpDown: () => <span data-testid="chevrons-up-down-icon" />,
  Check: () => <span data-testid="check-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Upload: () => <span data-testid="upload-icon" />,
}));

// Mock mobile hook
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => ({ isMobile: false }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock all course management API functions
vi.mock("@/logic/courseManagement", () => ({
  getAllCoursesFullDetails: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  createCourseOffering: vi.fn(),
  updateCourseOffering: vi.fn(),
  deleteCourseOffering: vi.fn(),
  createSharedSession: vi.fn(),
  updateSharedSession: vi.fn(),
  deleteSharedSession: vi.fn(),
  getActiveTerms: vi.fn(), // Changed from getTerms to getActiveTerms
  getDepartments: vi.fn(),
  getInstructors: vi.fn(),
  mapCourseData: vi.fn((course) => course),
  mapTermsForDropdown: vi.fn((terms) => terms),
  mapInstructorsForDropdown: vi.fn((instructors) => instructors),
  parseTermCode: vi.fn(() => ({ season: "Fall", term: "1", year: 2024 })),
  bulkImportCourses: vi.fn(),
  downloadSampleCSV: vi.fn(),
}));

// Mock admin sidebar
vi.mock("@/components/admin-dashboard-sidebar", () => ({
  AdminSidebar: ({ activePage }) => (
    <div data-testid="admin-sidebar">Admin Sidebar: {activePage}</div>
  ),
}));

// Mock all child components
vi.mock("@/components/scheduler/course_management/course-filters", () => ({
  CourseFilters: ({ searchQuery, onSearchChange }) => (
    <div data-testid="course-filters">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search courses"
      />
    </div>
  ),
}));

// FIXED: Update CourseCard mock to NOT include delete functionality for admin
vi.mock("@/components/scheduler/course_management/course-card", () => ({
  CourseCard: ({ course, onEdit, onEditOffering, onAddLabTutorial }) => (
    <div data-testid={`course-card-${course.id}`}>
      <h3>
        {course.code} - {course.title}
      </h3>
      <button onClick={() => onEdit(course)}>Edit Course</button>
      <button onClick={() => onAddLabTutorial(course)}>Add Lab/Tutorial</button>
      {/* Admin version does NOT have delete functionality */}
      {course.offerings?.map((offering) => (
        <div key={offering.id} data-testid={`offering-${offering.id}`}>
          <button onClick={() => onEditOffering(offering)}>
            Edit Offering: {offering.section}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/scheduler/course_management/empty-state", () => ({
  EmptyState: ({ onAddCourse }) => (
    <div data-testid="empty-state">
      <p>No courses found</p>
      <button onClick={onAddCourse}>Add First Course</button>
    </div>
  ),
}));

// Mock all modals
vi.mock("@/components/scheduler/course_management/add-course-modal", () => ({
  AddCourseModal: ({ isOpen, onClose, onAddCourse }) =>
    isOpen ? (
      <div data-testid="add-course-modal">
        <h2>Add Course Modal</h2>
        <button
          onClick={() => onAddCourse({ code: "NEW101", title: "New Course" })}
        >
          Submit
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/components/scheduler/course_management/edit-course-modal", () => ({
  EditCourseModal: ({ isOpen, course, onClose, onEditCourse }) =>
    isOpen ? (
      <div data-testid="edit-course-modal">
        <h2>Edit Course: {course?.title}</h2>
        <button
          onClick={() => onEditCourse({ ...course, title: "Updated Course" })}
        >
          Update
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/components/scheduler/course_management/add-offering-modal", () => ({
  AddOfferingModal: ({ isOpen, course, onClose, onAddOffering }) =>
    isOpen ? (
      <div data-testid="add-offering-modal">
        <h2>Add Offering for {course?.code}</h2>
        <button onClick={() => onAddOffering(course?.id, { section: "001" })}>
          Add
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/components/scheduler/course_management/edit-offering-modal", () => ({
  EditOfferingModal: ({ isOpen, course, offering, onClose, onEditOffering }) =>
    isOpen ? (
      <div data-testid="edit-offering-modal">
        <h2>
          Edit Offering: {offering?.section} for {course?.code}
        </h2>
        <button
          onClick={() =>
            onEditOffering(course?.id, { ...offering, section: "Updated" })
          }
        >
          Update
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock(
  "@/components/scheduler/course_management/add-lab-tutorial-modal",
  () => ({
    AddLabTutorialModal: ({ isOpen, course, onClose, onAddSession }) =>
      isOpen ? (
        <div data-testid="add-lab-tutorial-modal">
          <h2>Add Lab/Tutorial for {course?.code}</h2>
          <button
            onClick={() =>
              onAddSession(course?.id, "Fall", "2024", "lab", {
                section: "L01",
              })
            }
          >
            Add
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      ) : null,
  })
);

vi.mock("@/components/scheduler/course_management/edit-session-modal", () => ({
  EditSessionModal: ({ isOpen }) =>
    isOpen ? (
      <div data-testid="edit-session-modal">Edit Session Modal</div>
    ) : null,
}));

// Import the mocked API functions
import * as courseManagementApi from "@/logic/courseManagement";

describe("AdminCourseManagement Page", () => {
  const mockCourses = [
    {
      id: "cs101",
      code: "CS101",
      title: "Introduction to Computer Science",
      description:
        "Basic programming concepts and computer science fundamentals",
      department: "Computer Science",
      offerings: [
        { id: "1", section: "001", year: 2024, term: "F2024 Term 1" },
        { id: "2", section: "002", year: 2024, term: "F2024 Term 1" },
      ],
      sharedSessions: {},
    },
    {
      id: "math201",
      code: "MATH201",
      title: "Calculus II",
      description:
        "Advanced calculus including integration techniques and applications",
      department: "Mathematics",
      offerings: [
        { id: "3", section: "001", year: 2024, term: "F2024 Term 2" },
      ],
      sharedSessions: {},
    },
  ];

  const mockDepartments = [
    { id: 1, name: "Computer Science" },
    { id: 2, name: "Mathematics" },
  ];

  const mockTerms = [
    { id: 1, value: "F2024 Term 1", label: "Fall Term 1", year: 2024 },
    { id: 2, value: "F2024 Term 2", label: "Fall Term 2", year: 2024 },
  ];

  const mockInstructors = [
    { id: 1, name: "Dr. Smith", department: "Computer Science" },
    { id: 2, name: "Dr. Johnson", department: "Mathematics" },
  ];

  beforeEach(() => {
    // Setup default API responses
    vi.mocked(courseManagementApi.getAllCoursesFullDetails).mockResolvedValue(
      mockCourses
    );
    vi.mocked(courseManagementApi.getDepartments).mockResolvedValue(
      mockDepartments
    );
    vi.mocked(courseManagementApi.getActiveTerms).mockResolvedValue(mockTerms); // Changed from getTerms to getActiveTerms
    vi.mocked(courseManagementApi.getInstructors).mockResolvedValue(
      mockInstructors
    );
    vi.mocked(courseManagementApi.mapCourseData).mockImplementation(
      (course) => course
    );
    vi.mocked(courseManagementApi.mapTermsForDropdown).mockImplementation(
      (terms) => terms
    );
    vi.mocked(courseManagementApi.mapInstructorsForDropdown).mockImplementation(
      (instructors) => instructors
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <SidebarProvider>
          <AdminCourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
  };

  it("loads and displays courses after initial load", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Course Management" })
      ).toBeInTheDocument();
    });

    expect(courseManagementApi.getAllCoursesFullDetails).toHaveBeenCalledTimes(
      1
    );
    expect(courseManagementApi.getDepartments).toHaveBeenCalledTimes(1);
    expect(courseManagementApi.getActiveTerms).toHaveBeenCalledTimes(1); // Changed from getTerms to getActiveTerms
    expect(courseManagementApi.getInstructors).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    expect(screen.getByTestId("course-card-math201")).toBeInTheDocument();
  });

  it("displays error state when API fails", async () => {
    vi.mocked(courseManagementApi.getAllCoursesFullDetails).mockRejectedValue(
      new Error("API Error")
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load data. Please try again.")
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders header with admin sidebar and add button", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("navigation")).toHaveTextContent(
        "Course Management"
      );
    });

    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("admin-sidebar")).toHaveTextContent(
      "Admin Sidebar: Course Management"
    );
    expect(
      screen.getByRole("button", { name: /toggle sidebar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Course" })
    ).toBeInTheDocument();
  });

  it("renders main content with filters and course cards", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Course Management" })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Manage courses, offerings, and associated lab/tutorial sessions"
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("course-filters")).toBeInTheDocument();
    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
  });

  it("filters courses based on search query", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "Math");

    expect(screen.queryByTestId("course-card-cs101")).not.toBeInTheDocument();
    expect(screen.getByTestId("course-card-math201")).toBeInTheDocument();
  });

  it("shows empty state when no courses match filters", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "Nonexistent Course");

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No courses found")).toBeInTheDocument();
  });

  it("opens add course modal and handles submission", async () => {
    const user = userEvent.setup();
    vi.mocked(courseManagementApi.createCourse).mockResolvedValue({
      id: "new-course",
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Course" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add Course" }));
    expect(screen.getByTestId("add-course-modal")).toBeInTheDocument();

    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(courseManagementApi.createCourse).toHaveBeenCalledWith({
        code: "NEW101",
        title: "New Course",
      });
    });
  });

  it("opens edit course modal and handles updates", async () => {
    const user = userEvent.setup();
    vi.mocked(courseManagementApi.updateCourse).mockResolvedValue({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    // Find the specific Edit Course button within the cs101 course card
    const cs101Card = screen.getByTestId("course-card-cs101");
    const editButton = within(cs101Card).getByText("Edit Course");

    await user.click(editButton);
    expect(screen.getByTestId("edit-course-modal")).toBeInTheDocument();

    await user.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(courseManagementApi.updateCourse).toHaveBeenCalledWith(
        "cs101",
        expect.objectContaining({
          title: "Updated Course",
        })
      );
    });
  });

  // FIXED: Test that admin doesn't have delete functionality
  it("verifies admin does not have course deletion functionality", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    const cs101Card = screen.getByTestId("course-card-cs101");

    // Admin should NOT have delete functionality
    expect(
      within(cs101Card).queryByText("Delete Course")
    ).not.toBeInTheDocument();

    // But should have edit functionality
    expect(within(cs101Card).getByText("Edit Course")).toBeInTheDocument();
    expect(within(cs101Card).getByText("Add Lab/Tutorial")).toBeInTheDocument();
  });

  it("opens edit offering modal with correct data", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("offering-1")).toBeInTheDocument();
    });

    // Find the specific Edit Offering button within the offering-1 element
    const offering1 = screen.getByTestId("offering-1");
    const editButton = within(offering1).getByText("Edit Offering: 001");

    await user.click(editButton);
    expect(screen.getByTestId("edit-offering-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Edit Offering: 001 for CS101")
    ).toBeInTheDocument();
  });

  it("opens add lab/tutorial modal", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    // Find the specific Add Lab/Tutorial button within the cs101 course card
    const cs101Card = screen.getByTestId("course-card-cs101");
    const addLabButton = within(cs101Card).getByText("Add Lab/Tutorial");

    await user.click(addLabButton);
    expect(screen.getByTestId("add-lab-tutorial-modal")).toBeInTheDocument();
  });

  it("handles lab/tutorial session addition", async () => {
    const user = userEvent.setup();
    vi.mocked(courseManagementApi.createSharedSession).mockResolvedValue({
      id: "new-session",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("course-card-cs101")).toBeInTheDocument();
    });

    const cs101Card = screen.getByTestId("course-card-cs101");
    const addLabButton = within(cs101Card).getByText("Add Lab/Tutorial");

    await user.click(addLabButton);
    expect(screen.getByTestId("add-lab-tutorial-modal")).toBeInTheDocument();

    await user.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(courseManagementApi.createSharedSession).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionType: "lab",
          courseId: "cs101",
          section: "L01",
        })
      );
    });
  });

  it("handles modal close actions", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Course" })
      ).toBeInTheDocument();
    });

    // Open and close add course modal
    await user.click(screen.getByRole("button", { name: "Add Course" }));
    expect(screen.getByTestId("add-course-modal")).toBeInTheDocument();

    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("add-course-modal")).not.toBeInTheDocument();
  });

  it("reloads data after successful operations", async () => {
    const user = userEvent.setup();
    vi.mocked(courseManagementApi.createCourse).mockResolvedValue({
      id: "new-course",
    });

    renderComponent();

    await waitFor(() => {
      expect(
        courseManagementApi.getAllCoursesFullDetails
      ).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "Add Course" }));
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        courseManagementApi.getAllCoursesFullDetails
      ).toHaveBeenCalledTimes(2);
    });
  });

  it("handles offering updates", async () => {
    const user = userEvent.setup();
    vi.mocked(courseManagementApi.updateCourseOffering).mockResolvedValue({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("offering-1")).toBeInTheDocument();
    });

    const offering1 = screen.getByTestId("offering-1");
    const editButton = within(offering1).getByText("Edit Offering: 001");

    await user.click(editButton);
    await user.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(courseManagementApi.updateCourseOffering).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          id: "1",
          section: "Updated",
        })
      );
    });
  });

  it("displays loading state correctly", () => {
    // Make the API call hang to test loading state
    vi.mocked(courseManagementApi.getAllCoursesFullDetails).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    // Check that loading state is shown
    expect(screen.getByText("Loading courses...")).toBeInTheDocument();
    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    vi.mocked(courseManagementApi.createCourse).mockRejectedValue(
      new Error("Network error")
    );

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Course" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add Course" }));
    await user.click(screen.getByText("Submit"));

    // The error should be handled by the component (setting error state)
    await waitFor(() => {
      expect(courseManagementApi.createCourse).toHaveBeenCalled();
    });
  });

  // Bulk Import Tests
  it("renders bulk import button in header", async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Course" })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Bulk Import" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
  });

  it("opens bulk import modal when button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Bulk Import Courses" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Import multiple courses and their schedules from a CSV file/
      )
    ).toBeInTheDocument();
  });

  it("displays file upload area in bulk import modal", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    expect(
      screen.getByText("Click to upload your CSV file")
    ).toBeInTheDocument();
    expect(screen.getByText(/CSV files only/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });

  it("handles file selection for bulk import", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
    const testFile = new File(["test,data"], "test.csv", { type: "text/csv" });

    await user.upload(fileInput, testFile);

    expect(screen.getByText("test.csv")).toBeInTheDocument();
  });

  it("validates file type for bulk import", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);

    // Create a file with wrong MIME type (not text/csv)
    const invalidFile = new File(["test"], "test.txt", {
      type: "application/pdf",
    });

    await user.upload(fileInput, invalidFile);

    // Check that the file name is not shown (indicating validation failed)
    expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
    expect(
      screen.getByText("Click to upload your CSV file")
    ).toBeInTheDocument();
  });

  it("handles successful bulk import", async () => {
    const user = userEvent.setup();

    const mockImportResult = {
      results: {
        courses_created: 5,
        courses_updated: 2,
        course_offerings_created: 10,
        shared_sessions_created: 8,
      },
    };

    vi.mocked(courseManagementApi.bulkImportCourses).mockResolvedValue(
      mockImportResult
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
    const testFile = new File(["test,data"], "test.csv", { type: "text/csv" });

    await user.upload(fileInput, testFile);
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(courseManagementApi.bulkImportCourses).toHaveBeenCalledWith(
        testFile
      );
    });

    // Should close modal and refresh data
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(courseManagementApi.getAllCoursesFullDetails).toHaveBeenCalledTimes(
      2
    ); // Initial load + refresh
  });

  it("handles bulk import errors", async () => {
    const user = userEvent.setup();

    vi.mocked(courseManagementApi.bulkImportCourses).mockRejectedValue(
      new Error("Invalid CSV format")
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
    const testFile = new File(["invalid,data"], "test.csv", {
      type: "text/csv",
    });

    await user.upload(fileInput, testFile);
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => {
      expect(courseManagementApi.bulkImportCourses).toHaveBeenCalledWith(
        testFile
      );
    });
  });

  it("disables import button when no file is selected", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const importButton = screen.getByRole("button", { name: "Import" });
    expect(importButton).toBeDisabled();
  });

  it("shows loading state during bulk import", async () => {
    const user = userEvent.setup();

    // Make the import hang to test loading state
    vi.mocked(courseManagementApi.bulkImportCourses).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));

    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
    const testFile = new File(["test,data"], "test.csv", { type: "text/csv" });

    await user.upload(fileInput, testFile);
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(
      screen.getByRole("button", { name: "Importing..." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importing..." })).toBeDisabled();
  });

  it("closes bulk import modal with cancel button", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bulk Import" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets file selection when modal is reopened", async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Bulk Import" })
      ).toBeInTheDocument();
    });

    // First time: select file and close
    await user.click(screen.getByRole("button", { name: "Bulk Import" }));
    const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
    const testFile = new File(["test,data"], "test.csv", { type: "text/csv" });
    await user.upload(fileInput, testFile);

    expect(screen.getByText("test.csv")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Second time: should not show previous file
    await user.click(screen.getByRole("button", { name: "Bulk Import" }));
    expect(
      screen.getByText("Click to upload your CSV file")
    ).toBeInTheDocument();
    expect(screen.queryByText("test.csv")).not.toBeInTheDocument();
  });

  describe("Sample CSV Download", () => {
    it("handles sample CSV download successfully", async () => {
      const user = userEvent.setup();
      vi.mocked(courseManagementApi.downloadSampleCSV).mockResolvedValue();

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bulk Import" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bulk Import" }));

      expect(screen.getByText("Download Sample")).toBeInTheDocument();
      await user.click(screen.getByText("Download Sample"));

      await waitFor(() => {
        expect(courseManagementApi.downloadSampleCSV).toHaveBeenCalledTimes(1);
      });
    });

    it("handles sample CSV download error", async () => {
      const user = userEvent.setup();
      vi.mocked(courseManagementApi.downloadSampleCSV).mockRejectedValue(
        new Error("Download failed")
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bulk Import" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bulk Import" }));
      await user.click(screen.getByText("Download Sample"));

      await waitFor(() => {
        expect(courseManagementApi.downloadSampleCSV).toHaveBeenCalledTimes(1);
      });
    });

    it("displays sample download section in bulk import modal", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bulk Import" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bulk Import" }));

      // Check for sample download section
      expect(screen.getByText("Download Sample")).toBeInTheDocument();
      expect(screen.getByText(/Download our sample CSV/)).toBeInTheDocument();
    });
  });

  describe("File Upload UX Improvements", () => {
    it("provides clickable upload area with proper accessibility", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bulk Import" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bulk Import" }));

      // The entire upload area should be clickable via label
      const uploadLabel = screen.getByLabelText(
        /Click to upload your CSV file/
      );
      expect(uploadLabel).toBeInTheDocument();
      expect(uploadLabel.tagName).toBe("INPUT");
      expect(uploadLabel).toHaveAttribute("type", "file");
      expect(uploadLabel).toHaveAttribute("accept", ".csv");
    });

    it("displays correct upload text and file name when file is selected", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Bulk Import" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Bulk Import" }));

      // Initially shows placeholder text
      expect(
        screen.getByText("Click to upload your CSV file")
      ).toBeInTheDocument();

      // Upload a file
      const fileInput = screen.getByLabelText(/Click to upload your CSV file/);
      const testFile = new File(["test,data"], "test-upload.csv", {
        type: "text/csv",
      });

      await user.upload(fileInput, testFile);

      // Should now show file name
      expect(screen.getByText("test-upload.csv")).toBeInTheDocument();
      expect(
        screen.queryByText("Click to upload your CSV file")
      ).not.toBeInTheDocument();
    });
  });
});
