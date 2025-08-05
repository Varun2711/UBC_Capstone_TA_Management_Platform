import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { CourseCard } from "@/components/scheduler/assignment/CourseCard";

// Mock the YearSection component
vi.mock("@/components/scheduler/assignment/YearSection", () => ({
  YearSection: ({ year, yearData, type, isExpanded, onToggle }) => (
    <div data-testid={`year-section-${year}`}>
      <button onClick={onToggle} data-testid={`toggle-${year}`}>
        {isExpanded ? "Collapse" : "Expand"} {year}
      </button>
      <div data-testid={`year-data-${year}`}>
        Year {year} - {type} - {Object.keys(yearData).length} terms
      </div>
    </div>
  ),
}));

describe("CourseCard", () => {
  const mockCourse = {
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
        "2024W2": [
          {
            id: 2,
            section: "002",
            sectionType: "Lecture",
            weekHours: 3,
            assignedTA: "Jane Smith",
            studentId: "87654321",
            timeSlots: [
              {
                day: "Tuesday",
                startTime: "11:00 AM",
                endTime: "12:00 PM",
              },
            ],
          },
        ],
      },
      "2023": {
        "2023W1": [
          {
            id: 3,
            section: "001",
            sectionType: "Lecture",
            weekHours: 3,
            assignedTA: "Previous TA",
            studentId: "11111111",
            timeSlots: [
              {
                day: "Wednesday",
                startTime: "10:00 AM",
                endTime: "11:00 AM",
              },
            ],
          },
        ],
      },
    },
  };

  const mockExpandedYears = new Set(["1-2024"]);
  const mockOnToggleYear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders course basic information correctly", () => {
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Check course title
    expect(screen.getByText("COSC 111 - Introduction to Programming")).toBeInTheDocument();
    
    // Check instructor and department
    expect(screen.getByText("Instructor: Dr. Smith • Computer Science")).toBeInTheDocument();
    
    // Check department badge
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  it("displays years in descending order", () => {
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Check that year sections are rendered
    expect(screen.getByTestId("year-section-2024")).toBeInTheDocument();
    expect(screen.getByTestId("year-section-2023")).toBeInTheDocument();

    // Check they appear in descending order (2024 before 2023)
    const yearSections = screen.getAllByTestId(/year-section-/);
    expect(yearSections[0]).toHaveAttribute("data-testid", "year-section-2024");
    expect(yearSections[1]).toHaveAttribute("data-testid", "year-section-2023");
  });

  it("passes correct props to YearSection components", () => {
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Check that YearSection receives correct data
    expect(screen.getByTestId("year-data-2024")).toHaveTextContent("Year 2024 - course - 2 terms");
    expect(screen.getByTestId("year-data-2023")).toHaveTextContent("Year 2023 - course - 1 terms");
  });

  it("shows expanded state correctly for years", () => {
    const expandedYears = new Set(["1-2024"]);
    
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={expandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // 2024 should be expanded (course id 1)
    expect(screen.getByTestId("toggle-2024")).toHaveTextContent("Collapse 2024");
    
    // 2023 should not be expanded
    expect(screen.getByTestId("toggle-2023")).toHaveTextContent("Expand 2023");
  });

  it("calls onToggleYear with correct parameters when year is toggled", async () => {
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Click on 2024 toggle
    await userEvent.click(screen.getByTestId("toggle-2024"));
    expect(mockOnToggleYear).toHaveBeenCalledWith(1, "2024");

    // Click on 2023 toggle
    await userEvent.click(screen.getByTestId("toggle-2023"));
    expect(mockOnToggleYear).toHaveBeenCalledWith(1, "2023");

    expect(mockOnToggleYear).toHaveBeenCalledTimes(2);
  });

  it("handles course with no yearly offerings", () => {
    const courseWithNoOfferings = {
      ...mockCourse,
      yearlyOfferings: {},
    };

    render(
      <CourseCard
        course={courseWithNoOfferings}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Course info should still be displayed
    expect(screen.getByText("COSC 111 - Introduction to Programming")).toBeInTheDocument();
    expect(screen.getByText("Instructor: Dr. Smith • Computer Science")).toBeInTheDocument();

    // No year sections should be rendered
    expect(screen.queryByTestId(/year-section-/)).not.toBeInTheDocument();
  });

  it("handles course with single year offering", () => {
    const courseWithSingleYear = {
      ...mockCourse,
      yearlyOfferings: {
        "2024": {
          "2024W1": [
            {
              id: 1,
              section: "001",
              sectionType: "Lecture",
              weekHours: 3,
              assignedTA: "Test TA",
              studentId: "12345678",
              timeSlots: [],
            },
          ],
        },
      },
    };

    render(
      <CourseCard
        course={courseWithSingleYear}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Only one year section should be rendered
    expect(screen.getByTestId("year-section-2024")).toBeInTheDocument();
    expect(screen.queryByTestId("year-section-2023")).not.toBeInTheDocument();
  });

  it("handles empty expandedYears set", () => {
    const emptyExpandedYears = new Set();

    render(
      <CourseCard
        course={mockCourse}
        expandedYears={emptyExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // All years should show as collapsed
    expect(screen.getByTestId("toggle-2024")).toHaveTextContent("Expand 2024");
    expect(screen.getByTestId("toggle-2023")).toHaveTextContent("Expand 2023");
  });

  it("handles multiple expanded years", () => {
    const multipleExpandedYears = new Set(["1-2024", "1-2023"]);

    render(
      <CourseCard
        course={mockCourse}
        expandedYears={multipleExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Both years should show as expanded
    expect(screen.getByTestId("toggle-2024")).toHaveTextContent("Collapse 2024");
    expect(screen.getByTestId("toggle-2023")).toHaveTextContent("Collapse 2023");
  });

  it("renders with correct card structure", () => {
    render(
      <CourseCard
        course={mockCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    // Check that it renders as a card
    const cardElement = screen.getByText("COSC 111 - Introduction to Programming").closest('[class*="card"]');
    expect(cardElement).toBeInTheDocument();

    // Check layout structure
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
  });

  it("handles course with different department", () => {
    const mathCourse = {
      ...mockCourse,
      code: "MATH 101",
      name: "Calculus I",
      department: "Mathematics",
      instructor: "Dr. Johnson",
    };

    render(
      <CourseCard
        course={mathCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    expect(screen.getByText("MATH 101 - Calculus I")).toBeInTheDocument();
    expect(screen.getByText("Instructor: Dr. Johnson • Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  it("sorts years correctly with multiple years", () => {
    const courseWithManyYears = {
      ...mockCourse,
      yearlyOfferings: {
        "2022": { "2022W1": [] },
        "2024": { "2024W1": [] },
        "2023": { "2023W1": [] },
        "2021": { "2021W1": [] },
      },
    };

    render(
      <CourseCard
        course={courseWithManyYears}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    const yearSections = screen.getAllByTestId(/year-section-/);
    expect(yearSections[0]).toHaveAttribute("data-testid", "year-section-2024");
    expect(yearSections[1]).toHaveAttribute("data-testid", "year-section-2023");
    expect(yearSections[2]).toHaveAttribute("data-testid", "year-section-2022");
    expect(yearSections[3]).toHaveAttribute("data-testid", "year-section-2021");
  });

  it("handles course code and name with special characters", () => {
    const specialCourse = {
      ...mockCourse,
      code: "COSC-499A",
      name: "Capstone Project (Part I)",
      instructor: "Dr. O'Connor",
    };

    render(
      <CourseCard
        course={specialCourse}
        expandedYears={mockExpandedYears}
        onToggleYear={mockOnToggleYear}
      />
    );

    expect(screen.getByText("COSC-499A - Capstone Project (Part I)")).toBeInTheDocument();
    expect(screen.getByText("Instructor: Dr. O'Connor • Computer Science")).toBeInTheDocument();
  });
});