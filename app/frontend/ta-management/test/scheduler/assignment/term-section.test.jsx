import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { TermSection } from "@/components/scheduler/assignment/TermSection";

// Mock the child components
vi.mock("@/components/scheduler/assignment/CourseSection", () => ({
  CourseSection: ({ courseKey, assignments }) => (
    <div data-testid={`course-section-${courseKey}`}>
      <div data-testid="course-title">{courseKey}</div>
      <div data-testid="assignments-count">{assignments.length} assignments</div>
    </div>
  ),
}));

vi.mock("@/components/scheduler/assignment/SectionItem", () => ({
  SectionItem: ({ section, type }) => (
    <div data-testid={`section-item-${section.id}`}>
      <div data-testid="section-info">{section.courseCode} {section.section}</div>
      <div data-testid="section-type">{type}</div>
    </div>
  ),
}));

describe("TermSection", () => {
  const mockStudentAssignments = [
    {
      id: 1,
      courseCode: "COSC 111",
      courseName: "Introduction to Programming",
      section: "001",
      sectionType: "Lecture",
      weekHours: 3,
      instructor: "Dr. Smith",
    },
    {
      id: 2,
      courseCode: "COSC 111",
      courseName: "Introduction to Programming",
      section: "L01",
      sectionType: "Lab",
      weekHours: 2,
      instructor: "Dr. Smith",
    },
    {
      id: 3,
      courseCode: "COSC 121",
      courseName: "Computer Systems",
      section: "001",
      sectionType: "Lecture",
      weekHours: 3,
      instructor: "Dr. Johnson",
    },
  ];

  const mockCourseSections = [
    {
      id: 1,
      courseCode: "COSC 111",
      section: "001",
      sectionType: "Lecture",
      weekHours: 3,
      studentName: "John Doe",
      studentId: "12345678",
    },
    {
      id: 2,
      courseCode: "COSC 111",
      section: "L01",
      sectionType: "Lab",
      weekHours: 2,
      studentName: "Jane Smith",
      studentId: "87654321",
    },
  ];

  describe("Term display formatting", () => {
    it("formats Winter term correctly", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      expect(screen.getByText("Winter Term 1")).toBeInTheDocument();
    });

    it("formats Summer term correctly", () => {
      render(
        <TermSection
          termKey="S2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      expect(screen.getByText("Summer Term 1")).toBeInTheDocument();
    });

    it("formats Fall term correctly", () => {
      render(
        <TermSection
          termKey="F2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      expect(screen.getByText("Fall Term 1")).toBeInTheDocument();
    });

    it("formats Both Terms correctly", () => {
      render(
        <TermSection
          termKey="W2024 Both Terms"
          data={mockStudentAssignments}
          type="student"
        />
      );

      expect(screen.getByText("Winter Both Terms")).toBeInTheDocument();
    });

    it("returns original term code for unknown formats", () => {
      render(
        <TermSection
          termKey="Unknown Format"
          data={mockStudentAssignments}
          type="student"
        />
      );

      expect(screen.getByText("Unknown Format")).toBeInTheDocument();
    });
  });

  describe("Student type rendering", () => {
    it("renders student term with correct styling", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // Look for the header container with background styling
      const headerContainer = screen.getByText("Winter Term 1").closest('[class*="bg-emerald"]');
      expect(headerContainer).toHaveClass('bg-emerald-50/60');
      
      // Also check for border styling on the same or parent element
      const borderContainer = screen.getByText("Winter Term 1").closest('[class*="border-emerald"]');
      expect(borderContainer).toHaveClass('border-emerald-200/50');
    });

    it("calculates total hours correctly for students", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // Total: 3 + 2 + 3 = 8 hrs/week
      expect(screen.getByText("8 hrs/week")).toBeInTheDocument();
    });

    it("groups assignments by course for students", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // Should group COSC 111 assignments together
      expect(screen.getByTestId("course-section-COSC 111 - Introduction to Programming")).toBeInTheDocument();
      expect(screen.getByTestId("course-section-COSC 121 - Computer Systems")).toBeInTheDocument();
    });

    it("passes correct assignments to CourseSection", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // COSC 111 should have 2 assignments (lecture + lab)
      const cosc111Section = screen.getByTestId("course-section-COSC 111 - Introduction to Programming");
      expect(cosc111Section).toHaveTextContent("2 assignments");

      // COSC 121 should have 1 assignment
      const cosc121Section = screen.getByTestId("course-section-COSC 121 - Computer Systems");
      expect(cosc121Section).toHaveTextContent("1 assignments");
    });
  });

  describe("Course type rendering", () => {
    it("renders course term with correct styling", () => {
      const { container } = render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockCourseSections}
          type="course"
        />
      );

      // Check for teal color scheme elements
      const tealBgElement = container.querySelector('[class*="bg-teal-50"]');
      expect(tealBgElement).toBeInTheDocument();
      expect(tealBgElement).toHaveClass('bg-teal-50/60');
      
      const tealBorderElement = container.querySelector('[class*="border-teal-200"]');
      expect(tealBorderElement).toBeInTheDocument();
      expect(tealBorderElement).toHaveClass('border-teal-200/50');
    });

    it("shows section count for courses", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockCourseSections}
          type="course"
        />
      );

      expect(screen.getByText("2 sections")).toBeInTheDocument();
    });

    it("shows singular section text for single section", () => {
      const singleSection = [mockCourseSections[0]];
      
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={singleSection}
          type="course"
        />
      );

      expect(screen.getByText("1 section")).toBeInTheDocument();
    });

    it("renders SectionItem components for each section", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockCourseSections}
          type="course"
        />
      );

      expect(screen.getByTestId("section-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("section-item-2")).toBeInTheDocument();
    });

    it("passes correct props to SectionItem", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockCourseSections}
          type="course"
        />
      );

      // Check that section info is displayed correctly
      expect(screen.getByText("COSC 111 001")).toBeInTheDocument();
      expect(screen.getByText("COSC 111 L01")).toBeInTheDocument();
      
      // Check that type is passed correctly
      const sectionItems = screen.getAllByTestId(/section-item-/);
      sectionItems.forEach(item => {
        expect(item).toHaveTextContent("course");
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty data for students", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={[]}
          type="student"
        />
      );

      expect(screen.getByText("Winter Term 1")).toBeInTheDocument();
      expect(screen.getByText("0 hrs/week")).toBeInTheDocument();
      expect(screen.queryByTestId(/course-section-/)).not.toBeInTheDocument();
    });

    it("handles empty data for courses", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={[]}
          type="course"
        />
      );

      expect(screen.getByText("Winter Term 1")).toBeInTheDocument();
      expect(screen.getByText("0 sections")).toBeInTheDocument();
      expect(screen.queryByTestId(/section-item-/)).not.toBeInTheDocument();
    });

    it("handles assignments with zero hours", () => {
      const zeroHourAssignments = [
        {
          ...mockStudentAssignments[0],
          weekHours: 0,
        },
      ];

      render(
        <TermSection
          termKey="W2024 Term 1"
          data={zeroHourAssignments}
          type="student"
        />
      );

      expect(screen.getByText("0 hrs/week")).toBeInTheDocument();
    });

    it("handles missing course information", () => {
      const incompleteAssignment = [
        {
          id: 1,
          courseCode: "UNKNOWN",
          courseName: "",
          section: "001",
          sectionType: "Lecture",
          weekHours: 3,
        },
      ];

      render(
        <TermSection
          termKey="W2024 Term 1"
          data={incompleteAssignment}
          type="student"
        />
      );

      // Check that the component renders without crashing
      expect(screen.getByText("Winter Term 1")).toBeInTheDocument();
      expect(screen.getByText("3 hrs/week")).toBeInTheDocument();
      
      // Check that a course section is rendered (regardless of exact formatting)
      const courseSections = screen.getAllByTestId(/course-section-/);
      expect(courseSections).toHaveLength(1);
      
      // Verify it contains the course code
      expect(courseSections[0]).toHaveTextContent("UNKNOWN");
    });
  });

  describe("Color schemes", () => {
    it("applies correct color classes for student type", () => {
      const { container } = render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // Check for emerald background
      const emeraldBgElement = container.querySelector('[class*="bg-emerald-50"]');
      expect(emeraldBgElement).toHaveClass('bg-emerald-50/60');
      
      // Check for emerald border
      const emeraldBorderElement = container.querySelector('[class*="border-emerald-200"]');
      expect(emeraldBorderElement).toHaveClass('border-emerald-200/50');
      
      // Check for emerald icon color
      const icon = container.querySelector('[class*="text-emerald-600"]');
      expect(icon).toHaveClass('text-emerald-600');
    });

    it("applies correct color classes for course type", () => {
      const { container } = render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockCourseSections}
          type="course"
        />
      );

      // Check for teal background
      const tealBgElement = container.querySelector('[class*="bg-teal-50"]');
      expect(tealBgElement).toHaveClass('bg-teal-50/60');
      
      // Check for teal border
      const tealBorderElement = container.querySelector('[class*="border-teal-200"]');
      expect(tealBorderElement).toHaveClass('border-teal-200/50');
      
      // Check for teal icon color
      const icon = container.querySelector('[class*="text-teal-600"]');
      expect(icon).toHaveClass('text-teal-600');
    });
  });

  describe("Structure and layout", () => {
    it("renders calendar icon", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      const calendarIcon = screen.getByText("Winter Term 1").closest('div').querySelector('.lucide-calendar');
      expect(calendarIcon).toBeInTheDocument();
    });

    it("renders badge with stats", () => {
      render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      const badge = screen.getByText("8 hrs/week");
      expect(badge.closest('[class*="border"]')).toHaveClass('border-emerald-300', 'text-emerald-700');
    });

    it("has proper spacing and layout structure", () => {
      const { container } = render(
        <TermSection
          termKey="W2024 Term 1"
          data={mockStudentAssignments}
          type="student"
        />
      );

      // Check for proper spacing classes
      expect(container.firstChild).toHaveClass('space-y-3');
      
      // Check for border left styling
      const borderContainer = container.querySelector('[class*="border-l-2"]');
      expect(borderContainer).toHaveClass('border-emerald-200/40');
    });
  });
});