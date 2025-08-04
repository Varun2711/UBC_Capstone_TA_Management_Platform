import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { YearSection } from "@/components/scheduler/assignment/YearSection";

// Mock the TermSection component
vi.mock("@/components/scheduler/assignment/TermSection", () => ({
  TermSection: ({ termKey, data, type }) => (
    <div data-testid={`term-section-${termKey}`}>
      <div data-testid="term-key">{termKey}</div>
      <div data-testid="term-data-length">{data.length} items</div>
      <div data-testid="term-type">{type}</div>
    </div>
  ),
}));

describe("YearSection", () => {
  const mockStudentYearData = {
    "W2024 Term 1": [
      {
        id: 1,
        courseCode: "COSC 111",
        courseName: "Introduction to Programming",
        section: "001",
        sectionType: "Lecture",
        weekHours: 3,
      },
      {
        id: 2,
        courseCode: "COSC 111",
        courseName: "Introduction to Programming",
        section: "L01",
        sectionType: "Lab",
        weekHours: 2,
      },
    ],
    "W2024 Term 2": [
      {
        id: 3,
        courseCode: "COSC 121",
        courseName: "Computer Systems",
        section: "001",
        sectionType: "Lecture",
        weekHours: 3,
      },
    ],
    "S2024 Both Terms": [
      {
        id: 4,
        courseCode: "COSC 499",
        courseName: "Capstone Project",
        section: "001",
        sectionType: "Seminar",
        weekHours: 4,
      },
    ],
  };

  const mockCourseYearData = {
    "W2024 Term 1": [
      {
        id: 1,
        courseCode: "COSC 111",
        section: "001",
        sectionType: "Lecture",
        studentName: "John Doe",
        studentId: "12345678",
      },
      {
        id: 2,
        courseCode: "COSC 111",
        section: "L01",
        sectionType: "Lab",
        studentName: "Jane Smith",
        studentId: "87654321",
      },
    ],
    "W2024 Term 2": [
      {
        id: 3,
        courseCode: "COSC 111",
        section: "002",
        sectionType: "Lecture",
        studentName: "Bob Johnson",
        studentId: "11111111",
      },
    ],
  };

  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("renders year title correctly", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("Academic Year 2024")).toBeInTheDocument();
    });

    it("renders graduation cap icon", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      const graduationIcon = container.querySelector('.lucide-graduation-cap');
      expect(graduationIcon).toBeInTheDocument();
    });

    it("renders term count badge", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("3 terms")).toBeInTheDocument();
    });

    it("renders singular term text for single term", () => {
      const singleTermData = {
        "W2024 Term 1": mockStudentYearData["W2024 Term 1"],
      };

      render(
        <YearSection
          year="2024"
          yearData={singleTermData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("1 term")).toBeInTheDocument();
    });
  });

  describe("Student type functionality", () => {
    it("calculates total hours correctly for student type", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Total: (3+2) + (3) + (4) = 12 hrs/week
      expect(screen.getByText("12 hrs/week")).toBeInTheDocument();
    });

    it("applies student color scheme", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Check for blue color scheme (student)
      const blueElement = container.querySelector('[class*="bg-blue-50"]');
      expect(blueElement).toHaveClass('bg-blue-50/70');
      
      const borderElement = container.querySelector('[class*="border-blue-200"]');
      expect(borderElement).toHaveClass('border-blue-200/60');
    });

    it("handles zero hours correctly", () => {
      const zeroHoursData = {
        "W2024 Term 1": [
          {
            id: 1,
            courseCode: "COSC 111",
            section: "001",
            weekHours: 0,
          },
        ],
      };

      render(
        <YearSection
          year="2024"
          yearData={zeroHoursData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("0 hrs/week")).toBeInTheDocument();
    });
  });

  describe("Course type functionality", () => {
    it("calculates total sections correctly for course type", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockCourseYearData}
          type="course"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Total: 2 + 1 = 3 sections
      expect(screen.getByText("3 sections")).toBeInTheDocument();
    });

    it("applies course color scheme", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockCourseYearData}
          type="course"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Check for violet color scheme (course)
      const violetElement = container.querySelector('[class*="bg-violet-50"]');
      expect(violetElement).toHaveClass('bg-violet-50/70');
      
      const borderElement = container.querySelector('[class*="border-violet-200"]');
      expect(borderElement).toHaveClass('border-violet-200/60');
    });

    it("shows singular section text for single section", () => {
      const singleSectionData = {
        "W2024 Term 1": [mockCourseYearData["W2024 Term 1"][0]],
      };

      render(
        <YearSection
          year="2024"
          yearData={singleSectionData}
          type="course"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("1 section")).toBeInTheDocument();
    });
  });

  describe("Expansion/Collapse functionality", () => {
    it("shows chevron right when collapsed", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      const chevronRight = container.querySelector('.lucide-chevron-right');
      expect(chevronRight).toBeInTheDocument();
      
      const chevronDown = container.querySelector('.lucide-chevron-down');
      expect(chevronDown).not.toBeInTheDocument();
    });

    it("shows chevron down when expanded", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      const chevronDown = container.querySelector('.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
      
      const chevronRight = container.querySelector('.lucide-chevron-right');
      expect(chevronRight).not.toBeInTheDocument();
    });

    it("calls onToggle when clicked", async () => {
      const user = userEvent.setup();
      
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      const trigger = screen.getByText("Academic Year 2024").closest('div');
      await user.click(trigger);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("shows term sections when expanded", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByTestId("term-section-W2024 Term 1")).toBeInTheDocument();
      expect(screen.getByTestId("term-section-W2024 Term 2")).toBeInTheDocument();
      expect(screen.getByTestId("term-section-S2024 Both Terms")).toBeInTheDocument();
    });

    it("hides term sections when collapsed", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByTestId("term-section-W2024 Term 1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("term-section-W2024 Term 2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("term-section-S2024 Both Terms")).not.toBeInTheDocument();
    });
  });

  describe("Term sorting", () => {
    it("sorts terms in correct order", () => {
      const unsortedTermData = {
        "W2024 Term 2": mockStudentYearData["W2024 Term 2"],
        "S2024 Both Terms": mockStudentYearData["S2024 Both Terms"],
        "W2024 Term 1": mockStudentYearData["W2024 Term 1"],
      };

      render(
        <YearSection
          year="2024"
          yearData={unsortedTermData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      const termSections = screen.getAllByTestId(/term-section-/);
      
      // Should be sorted: S2024 Both Terms, W2024 Term 1, W2024 Term 2
      expect(termSections[0]).toHaveAttribute('data-testid', 'term-section-S2024 Both Terms');
      expect(termSections[1]).toHaveAttribute('data-testid', 'term-section-W2024 Term 1');
      expect(termSections[2]).toHaveAttribute('data-testid', 'term-section-W2024 Term 2');
    });

    it("handles complex term sorting across years", () => {
      const complexTermData = {
        "W2025 Term 1": [{ id: 1, weekHours: 1 }],
        "F2024 Term 2": [{ id: 2, weekHours: 2 }],
        "S2024 Term 1": [{ id: 3, weekHours: 3 }],
        "W2024 Term 1": [{ id: 4, weekHours: 4 }],
      };

      render(
        <YearSection
          year="2024-2025"
          yearData={complexTermData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      const termSections = screen.getAllByTestId(/term-section-/);
      
      // Should be sorted by year (desc), then season, then term
      expect(termSections[0]).toHaveAttribute('data-testid', 'term-section-W2025 Term 1');
      expect(termSections[1]).toHaveAttribute('data-testid', 'term-section-S2024 Term 1');
      expect(termSections[2]).toHaveAttribute('data-testid', 'term-section-F2024 Term 2');
      expect(termSections[3]).toHaveAttribute('data-testid', 'term-section-W2024 Term 1');
    });
  });

  describe("Term section integration", () => {
    it("passes correct props to TermSection components", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      // Check that type is passed correctly
      const termTypes = screen.getAllByTestId("term-type");
      termTypes.forEach(typeElement => {
        expect(typeElement).toHaveTextContent("student");
      });

      // Check that data is passed correctly
      expect(screen.getByTestId("term-section-W2024 Term 1")).toHaveTextContent("2 items");
      expect(screen.getByTestId("term-section-W2024 Term 2")).toHaveTextContent("1 items");
      expect(screen.getByTestId("term-section-S2024 Both Terms")).toHaveTextContent("1 items");
    });
  });

  describe("Edge cases", () => {
    it("handles empty year data", () => {
      render(
        <YearSection
          year="2024"
          yearData={{}}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText("Academic Year 2024")).toBeInTheDocument();
      expect(screen.getByText("0 terms")).toBeInTheDocument();
      expect(screen.getByText("0 hrs/week")).toBeInTheDocument();
    });

    it("handles missing weekHours in assignments", () => {
      const incompleteData = {
        "W2024 Term 1": [
          {
            id: 1,
            courseCode: "COSC 111",
            // missing weekHours
          },
        ],
      };

      render(
        <YearSection
          year="2024"
          yearData={incompleteData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Should handle missing weekHours gracefully (NaN should become 0)
      expect(screen.getByText(/hrs\/week/)).toBeInTheDocument();
    });

    it("handles invalid term codes in sorting", () => {
      const invalidTermData = {
        "InvalidTerm": [{ id: 1, weekHours: 1 }],
        "W2024 Term 1": [{ id: 2, weekHours: 2 }],
        "AnotherInvalid": [{ id: 3, weekHours: 3 }],
      };

      render(
        <YearSection
          year="2024"
          yearData={invalidTermData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      // Should still render all terms without crashing
      expect(screen.getByTestId("term-section-W2024 Term 1")).toBeInTheDocument();
      expect(screen.getByTestId("term-section-InvalidTerm")).toBeInTheDocument();
      expect(screen.getByTestId("term-section-AnotherInvalid")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes for collapsible", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Check for proper ARIA attributes
      const trigger = screen.getByText("Academic Year 2024").closest('[aria-expanded]');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it("updates ARIA attributes when expanded", () => {
      render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      // Check for proper ARIA attributes when expanded
      const trigger = screen.getByText("Academic Year 2024").closest('[aria-expanded]');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-state', 'open');
    });
  });

  describe("Visual styling", () => {
    it("applies hover effects correctly", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      const trigger = container.querySelector('[class*="hover:bg-blue-100"]');
      expect(trigger).toHaveClass('hover:bg-blue-100/50');
    });

    it("applies correct border left styling when expanded", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={true}
          onToggle={mockOnToggle}
        />
      );

      const borderLeft = container.querySelector('[class*="border-l-2"]');
      expect(borderLeft).toHaveClass('border-blue-200/50');
    });

    it("applies correct badge styling", () => {
      const { container } = render(
        <YearSection
          year="2024"
          yearData={mockStudentYearData}
          type="student"
          isExpanded={false}
          onToggle={mockOnToggle}
        />
      );

      // Check outline badge styling (the terms badge)
      const outlineBadge = screen.getByText("3 terms");
      expect(outlineBadge).toHaveClass('border-blue-300', 'text-blue-700');
      
      // Check secondary badge styling (the hours badge)
      const secondaryBadge = screen.getByText("12 hrs/week");
      expect(secondaryBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });
});