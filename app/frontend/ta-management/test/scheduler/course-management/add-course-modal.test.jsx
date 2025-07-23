import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { AddCourseModal } from "@/components/scheduler/course_management/add-course-modal";

describe("AddCourseModal", () => {
  const mockOnClose = vi.fn();
  const mockOnAddCourse = vi.fn();
  const existingCourses = [
    {
      code: "CS 101",
      title: "Intro to CS",
      department: "Computer Science",
      description: "Intro course",
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

  it("renders correctly when open", () => {
    render(
      <AddCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add New Course")).toBeInTheDocument();
    expect(screen.getByText(/Create a new course/)).toBeInTheDocument();
    expect(screen.getByLabelText("Course Code *")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Department \*/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Course Title *")).toBeInTheDocument();
    expect(screen.getByLabelText("Course Description *")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <AddCourseModal
        isOpen={false}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal when cancel button is clicked", async () => {
    render(
      <AddCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    await userEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays validation errors for empty required fields", async () => {
    render(
      <AddCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    await userEvent.click(screen.getByText("Add Course"));

    expect(screen.getByText("Course code is required")).toBeInTheDocument();
    expect(screen.getByText("Department is required")).toBeInTheDocument();
    expect(screen.getByText("Course title is required")).toBeInTheDocument();
    expect(
      screen.getByText("Course description is required")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please fix the errors above before submitting.")
    ).toBeInTheDocument();
  });

  it("validates course code format", async () => {
    render(
      <AddCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    const codeInput = screen.getByLabelText("Course Code *");
    await userEvent.type(codeInput, "invalid");
    fireEvent.blur(codeInput);

    expect(
      screen.getByText(
        "Course code must be in format like 'CS 101' or 'MATH 201'"
      )
    ).toBeInTheDocument();
  });

  it("validates duplicate course code", async () => {
    render(
      <AddCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onAddCourse={mockOnAddCourse}
        existingCourses={existingCourses}
      />
    );

    const codeInput = screen.getByLabelText("Course Code *");
    await userEvent.type(codeInput, "CS 101");
    fireEvent.blur(codeInput);

    expect(
      screen.getByText("A course with this code already exists")
    ).toBeInTheDocument();
  });

  // it('validates course title length', async () => {
  //   render(
  //     <AddCourseModal
  //       isOpen={true}
  //       onClose={mockOnClose}
  //       onAddCourse={mockOnAddCourse}
  //       existingCourses={existingCourses}
  //     />
  //   );

  //   const titleInput = screen.getByLabelText('Course Title *');
  //   await userEvent.type(titleInput, 'CS');
  //   fireEvent.blur(titleInput);

  //   expect(screen.getByText('Course title must be at least 3 characters')).toBeInTheDocument();

  //   await userEvent.clear(titleInput);
  //   await userEvent.type(titleInput, 'A'.repeat(101));
  //   fireEvent.blur(titleInput);

  //   expect(screen.getByText('Course title must be less than 100 characters')).toBeInTheDocument();
  // });
});
