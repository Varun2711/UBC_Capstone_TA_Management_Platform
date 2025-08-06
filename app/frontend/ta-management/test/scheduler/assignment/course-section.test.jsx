import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { CourseSection } from "@/components/scheduler/assignment/CourseSection";

// Mock the SectionItem component
vi.mock("@/components/scheduler/assignment/SectionItem", () => ({
  SectionItem: ({ section, type }) => (
    <div data-testid={`section-item-${section.id}`}>
      Section {section.section} - {section.sectionType} - {type}
      {section.assignedTA && <span data-testid="assigned-ta">{section.assignedTA}</span>}
    </div>
  ),
}));

describe("CourseSection", () => {
  const mockAssignments = [
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
    {
      id: 2,
      section: "L01",
      sectionType: "Lab",
      weekHours: 2,
      assignedTA: "Jane Smith",
      studentId: "87654321",
      timeSlots: [
        {
          day: "Tuesday",
          startTime: "2:00 PM",
          endTime: "4:00 PM",
        },
      ],
    },
    {
      id: 3,
      section: "T01",
      sectionType: "Tutorial",
      weekHours: 1,
      assignedTA: null,
      studentId: null,
      timeSlots: [
        {
          day: "Wednesday",
          startTime: "1:00 PM",
          endTime: "2:00 PM",
        },
      ],
    },
  ];

  it("renders course key correctly", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    expect(screen.getByText("COSC 111")).toBeInTheDocument();
  });

  it("displays BookOpen icon", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    // Check for the icon by looking for its container
    const iconElement = screen.getByText("COSC 111").previousElementSibling;
    expect(iconElement).toBeInTheDocument();
  });

  it("shows correct section count with plural form", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    expect(screen.getByText("3 sections")).toBeInTheDocument();
  });

  it("shows correct section count with singular form", () => {
    const singleAssignment = [mockAssignments[0]];
    
    render(<CourseSection courseKey="COSC 111" assignments={singleAssignment} />);

    expect(screen.getByText("1 section")).toBeInTheDocument();
  });

  it("renders all section items", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    expect(screen.getByTestId("section-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-2")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-3")).toBeInTheDocument();
  });

  it("passes correct props to SectionItem components", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    // Check that SectionItem receives correct props
    expect(screen.getByTestId("section-item-1")).toHaveTextContent("Section 001 - Lecture - student");
    expect(screen.getByTestId("section-item-2")).toHaveTextContent("Section L01 - Lab - student");
    expect(screen.getByTestId("section-item-3")).toHaveTextContent("Section T01 - Tutorial - student");
  });

  it("passes type as 'student' to all SectionItem components", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const sectionItems = screen.getAllByTestId(/section-item-/);
    sectionItems.forEach(item => {
      expect(item).toHaveTextContent("student");
    });
  });

  it("handles empty assignments array", () => {
    render(<CourseSection courseKey="COSC 111" assignments={[]} />);

    // Course key should still be displayed
    expect(screen.getByText("COSC 111")).toBeInTheDocument();
    
    // Should show 0 sections
    expect(screen.getByText("0 sections")).toBeInTheDocument();
    
    // No section items should be rendered
    expect(screen.queryByTestId(/section-item-/)).not.toBeInTheDocument();
  });

  it("renders with correct card styling classes", () => {
    const { container } = render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const cardElement = container.querySelector('[class*="shadow-sm"]');
    expect(cardElement).toBeInTheDocument();
    
    // Check for specific styling classes
    expect(cardElement).toHaveClass("border-l-4", "border-l-slate-300", "bg-slate-50/30");
  });

  it("handles different course keys", () => {
    render(<CourseSection courseKey="MATH 200 - Advanced Calculus" assignments={mockAssignments} />);

    expect(screen.getByText("MATH 200 - Advanced Calculus")).toBeInTheDocument();
  });

  it("handles course key with special characters", () => {
    render(<CourseSection courseKey="COSC-499A (Capstone)" assignments={mockAssignments} />);

    expect(screen.getByText("COSC-499A (Capstone)")).toBeInTheDocument();
  });

  it("maintains consistent section item order", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const sectionItems = screen.getAllByTestId(/section-item-/);
    
    // Should maintain the order from the assignments array
    expect(sectionItems[0]).toHaveAttribute("data-testid", "section-item-1");
    expect(sectionItems[1]).toHaveAttribute("data-testid", "section-item-2");
    expect(sectionItems[2]).toHaveAttribute("data-testid", "section-item-3");
  });

  it("handles assignments with missing optional fields", () => {
    const assignmentsWithMissingFields = [
      {
        id: 1,
        section: "001",
        sectionType: "Lecture",
        weekHours: 3,
        // missing assignedTA and studentId
        timeSlots: [],
      },
      {
        id: 2,
        section: "L01",
        sectionType: "Lab",
        weekHours: 2,
        assignedTA: null,
        studentId: null,
        timeSlots: [],
      },
    ];

    render(<CourseSection courseKey="COSC 111" assignments={assignmentsWithMissingFields} />);

    expect(screen.getByText("2 sections")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-2")).toBeInTheDocument();
  });

  it("renders badge with correct styling", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const badge = screen.getByText("3 sections");
    expect(badge).toBeInTheDocument();
    
    // Check that it exists (the element itself is the badge)
    expect(badge).toHaveClass("text-xs", "border-slate-300", "text-slate-600");
  });

  it("uses correct key for each section item", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    // Each section item should have a unique key based on assignment id
    mockAssignments.forEach(assignment => {
      expect(screen.getByTestId(`section-item-${assignment.id}`)).toBeInTheDocument();
    });
  });

  it("handles large number of assignments", () => {
    const manyAssignments = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      section: `00${index + 1}`,
      sectionType: "Lecture",
      weekHours: 3,
      assignedTA: `TA ${index + 1}`,
      studentId: `1234567${index}`,
      timeSlots: [],
    }));

    render(<CourseSection courseKey="COSC 111" assignments={manyAssignments} />);

    expect(screen.getByText("10 sections")).toBeInTheDocument();
    
    // All section items should be rendered
    manyAssignments.forEach(assignment => {
      expect(screen.getByTestId(`section-item-${assignment.id}`)).toBeInTheDocument();
    });
  });

  it("handles assignments with duplicate section numbers", () => {
    const assignmentsWithDuplicates = [
      {
        id: 1,
        section: "001",
        sectionType: "Lecture",
        weekHours: 3,
        assignedTA: "John Doe",
        studentId: "12345678",
        timeSlots: [],
      },
      {
        id: 2,
        section: "001", // Duplicate section number but different id
        sectionType: "Lab",
        weekHours: 2,
        assignedTA: "Jane Smith",
        studentId: "87654321",
        timeSlots: [],
      },
    ];

    render(<CourseSection courseKey="COSC 111" assignments={assignmentsWithDuplicates} />);

    expect(screen.getByText("2 sections")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-item-2")).toBeInTheDocument();
  });

  it("maintains proper spacing between section items", () => {
    render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    // Check that the container has the space-y-2 class for proper spacing
    const sectionItemsContainer = screen.getByTestId("section-item-1").parentElement;
    expect(sectionItemsContainer).toHaveClass("space-y-2");
  });

  it("renders card header with correct padding", () => {
    const { container } = render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const cardHeader = container.querySelector('[class*="py-3"]');
    expect(cardHeader).toBeInTheDocument();
  });

  it("renders card content with correct padding", () => {
    const { container } = render(<CourseSection courseKey="COSC 111" assignments={mockAssignments} />);

    const cardContent = container.querySelector('[class*="pt-0"]');
    expect(cardContent).toBeInTheDocument();
  });
});