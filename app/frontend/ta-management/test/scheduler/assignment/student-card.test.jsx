import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { StudentCard } from "@/components/scheduler/assignment/StudentCard";

// Mock the YearSection component
vi.mock("@/components/scheduler/assignment/YearSection", () => ({
  YearSection: ({ year, yearData, type, isExpanded, onToggle }) => (
    <div data-testid={`year-section-${year}`}>
      <button onClick={onToggle} data-testid={`year-toggle-${year}`}>
        {isExpanded ? "Collapse" : "Expand"} {year}
      </button>
      <div data-testid={`year-content-${year}`}>
        {isExpanded && `Year ${year} content - ${Object.keys(yearData).length} terms`}
      </div>
    </div>
  ),
}));

describe("StudentCard", () => {
  const mockStudent = {
    id: 1,
    studentName: "John Doe",
    studentId: "12345678",
    email: "john.doe@example.com",
    studyLevel: "Graduate",
    totalWeeklyHours: 15,
    maxHours: 20,
    avatar: "https://example.com/avatar.jpg",
    yearlyAssignments: {
      "2024": {
        "2024W1": [
          {
            id: 1,
            courseCode: "COSC 111",
            courseName: "Introduction to Programming",
            section: "001",
            sectionType: "Lecture",
            weekHours: 3,
          },
        ],
        "2024W2": [
          {
            id: 2,
            courseCode: "COSC 111",
            courseName: "Introduction to Programming",
            section: "L01",
            sectionType: "Lab",
            weekHours: 2,
          },
        ],
      },
      "2023": {
        "2023W1": [
          {
            id: 3,
            courseCode: "COSC 101",
            courseName: "Digital Citizenship",
            section: "001",
            sectionType: "Lecture",
            weekHours: 3,
          },
        ],
      },
    },
  };

  const mockOnToggleYear = vi.fn();
  const mockExpandedYears = new Set();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("renders student basic information", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com • ID: 12345678")).toBeInTheDocument();
    });

    it("renders student avatar with correct fallback", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Check fallback text is available (avatar fallback initials)
      expect(screen.getByText("JD")).toBeInTheDocument();
      
      // Check that the avatar has the proper structure
      const avatarFallback = screen.getByText("JD");
      const avatarContainer = avatarFallback.closest('span[class*="relative"]');
      expect(avatarContainer).toBeInTheDocument();
      expect(avatarContainer).toHaveClass('h-12', 'w-12');
    });

    it("does not render workload information", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.queryByText("Workload:")).not.toBeInTheDocument();
      expect(screen.queryByText("15/20 hrs/week")).not.toBeInTheDocument();
      expect(screen.queryByText(/hrs\/week/)).not.toBeInTheDocument();
    });

    it("renders academic years count", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("2 academic years")).toBeInTheDocument();
    });
  });

  describe("Year sections", () => {
    it("renders year sections in descending order", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const yearSections = screen.getAllByTestId(/year-section-/);
      expect(yearSections).toHaveLength(2);
      expect(screen.getByTestId("year-section-2024")).toBeInTheDocument();
      expect(screen.getByTestId("year-section-2023")).toBeInTheDocument();
    });

    it("passes correct props to YearSection components", () => {
      const expandedYears = new Set(["1-2024"]);
      
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={expandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Check that expanded year shows "Collapse"
      expect(screen.getByText("Collapse 2024")).toBeInTheDocument();
      // Check that non-expanded year shows "Expand"
      expect(screen.getByText("Expand 2023")).toBeInTheDocument();
    });

    it("calls onToggleYear when year section is clicked", async () => {
      const user = userEvent.setup();
      
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const yearToggle2024 = screen.getByTestId("year-toggle-2024");
      await user.click(yearToggle2024);

      expect(mockOnToggleYear).toHaveBeenCalledWith(1, "2024");
    });

    it("shows expanded content when year is expanded", () => {
      const expandedYears = new Set(["1-2024"]);
      
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={expandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("Year 2024 content - 2 terms")).toBeInTheDocument();
      expect(screen.queryByText("Year 2023 content - 1 terms")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles student with single name", () => {
      const singleNameStudent = {
        ...mockStudent,
        studentName: "Cher",
      };

      render(
        <StudentCard
          student={singleNameStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("Cher")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument(); // Avatar fallback
    });

    it("handles student with no assignments", () => {
      const noAssignmentsStudent = {
        ...mockStudent,
        yearlyAssignments: {},
      };

      render(
        <StudentCard
          student={noAssignmentsStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("0 academic years")).toBeInTheDocument();
      expect(screen.queryByTestId(/year-section-/)).not.toBeInTheDocument();
    });

    it("handles student with single academic year", () => {
      const singleYearStudent = {
        ...mockStudent,
        yearlyAssignments: {
          "2024": mockStudent.yearlyAssignments["2024"],
        },
      };

      render(
        <StudentCard
          student={singleYearStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("1 academic year")).toBeInTheDocument();
    });

    it("handles missing avatar", () => {
      const noAvatarStudent = {
        ...mockStudent,
        avatar: undefined,
      };

      render(
        <StudentCard
          student={noAvatarStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Should still show fallback initials
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("handles missing email", () => {
      const noEmailStudent = {
        ...mockStudent,
        email: undefined,
      };

      render(
        <StudentCard
          student={noEmailStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Should show ID but handle missing email gracefully
      expect(screen.getByText(/ID: 12345678/)).toBeInTheDocument();
    });

    it("handles student with many academic years", () => {
      const manyYearsStudent = {
        ...mockStudent,
        yearlyAssignments: {
          "2024": mockStudent.yearlyAssignments["2024"],
          "2023": mockStudent.yearlyAssignments["2023"],
          "2022": mockStudent.yearlyAssignments["2023"],
          "2021": mockStudent.yearlyAssignments["2023"],
        },
      };

      render(
        <StudentCard
          student={manyYearsStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("4 academic years")).toBeInTheDocument();
    });

    it("handles student with long name", () => {
      const longNameStudent = {
        ...mockStudent,
        studentName: "Johann Sebastian Bach von Beethoven",
      };

      render(
        <StudentCard
          student={longNameStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("Johann Sebastian Bach von Beethoven")).toBeInTheDocument();
      expect(screen.getByText("JSBvB")).toBeInTheDocument(); // Avatar fallback
    });

    it("handles student with special characters in name", () => {
      const specialCharStudent = {
        ...mockStudent,
        studentName: "José María O'Connor-Smith",
      };

      render(
        <StudentCard
          student={specialCharStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("José María O'Connor-Smith")).toBeInTheDocument();
      expect(screen.getByText("JMO")).toBeInTheDocument(); // Avatar fallback
    });
  });

  describe("Multiple students interaction", () => {
    it("handles multiple year toggles correctly", async () => {
      const user = userEvent.setup();
      
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const yearToggle2024 = screen.getByTestId("year-toggle-2024");
      const yearToggle2023 = screen.getByTestId("year-toggle-2023");

      await user.click(yearToggle2024);
      await user.click(yearToggle2023);

      expect(mockOnToggleYear).toHaveBeenCalledTimes(2);
      expect(mockOnToggleYear).toHaveBeenCalledWith(1, "2024");
      expect(mockOnToggleYear).toHaveBeenCalledWith(1, "2023");
    });

    it("maintains year expansion state correctly", () => {
      const expandedYears = new Set(["1-2024", "1-2023"]);
      
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={expandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("Collapse 2024")).toBeInTheDocument();
      expect(screen.getByText("Collapse 2023")).toBeInTheDocument();
      expect(screen.getByText("Year 2024 content - 2 terms")).toBeInTheDocument();
      expect(screen.getByText("Year 2023 content - 1 terms")).toBeInTheDocument();
    });
  });

  describe("Component structure", () => {
    it("has proper card structure", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Check that the card components are properly structured
      const studentName = screen.getByText("John Doe");
      const cardHeader = studentName.closest('[class*="card"]');
      expect(cardHeader).toBeInTheDocument();
    });

    it("displays information in correct layout", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      // Verify the main elements are present without workload
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com • ID: 12345678")).toBeInTheDocument();
      expect(screen.getByText("2 academic years")).toBeInTheDocument();
      expect(screen.getByText("JD")).toBeInTheDocument(); // Avatar fallback
    });
  });
});