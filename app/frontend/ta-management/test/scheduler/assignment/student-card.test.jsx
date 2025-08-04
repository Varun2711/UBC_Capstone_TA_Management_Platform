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

    it("renders workload information", () => {
      render(
        <StudentCard
          student={mockStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("Workload:")).toBeInTheDocument();
      expect(screen.getByText("15/20 hrs/week")).toBeInTheDocument();
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

  describe("Workload color coding", () => {
    it("shows green color for low utilization", () => {
      const lowUtilizationStudent = {
        ...mockStudent,
        totalWeeklyHours: 10,
        maxHours: 20, // 50% utilization
      };

      render(
        <StudentCard
          student={lowUtilizationStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const workloadText = screen.getByText("10/20 hrs/week");
      expect(workloadText).toHaveClass("text-green-600");
    });

    it("shows yellow color for medium utilization", () => {
      const mediumUtilizationStudent = {
        ...mockStudent,
        totalWeeklyHours: 16,
        maxHours: 20, // 80% utilization
      };

      render(
        <StudentCard
          student={mediumUtilizationStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const workloadText = screen.getByText("16/20 hrs/week");
      expect(workloadText).toHaveClass("text-yellow-600");
    });

    it("shows red color for high utilization", () => {
      const highUtilizationStudent = {
        ...mockStudent,
        totalWeeklyHours: 19,
        maxHours: 20, // 95% utilization
      };

      render(
        <StudentCard
          student={highUtilizationStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      const workloadText = screen.getByText("19/20 hrs/week");
      expect(workloadText).toHaveClass("text-red-600");
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

    it("handles zero max hours", () => {
      const zeroMaxHoursStudent = {
        ...mockStudent,
        maxHours: 0,
      };

      render(
        <StudentCard
          student={zeroMaxHoursStudent}
          expandedYears={mockExpandedYears}
          onToggleYear={mockOnToggleYear}
        />
      );

      expect(screen.getByText("15/0 hrs/week")).toBeInTheDocument();
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
  });
});