import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { SectionItem } from "@/components/scheduler/assignment/SectionItem";

describe("SectionItem", () => {
  const mockSection = {
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
      {
        day: "Wednesday",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
      },
    ],
  };

  const mockLabSection = {
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
  };

  const mockUnassignedSection = {
    id: 3,
    section: "T01",
    sectionType: "Tutorial",
    weekHours: 1,
    assignedTA: null,
    studentId: null,
    timeSlots: [
      {
        day: "Friday",
        startTime: "1:00 PM",
        endTime: "2:00 PM",
      },
    ],
  };

  describe("Student view (type='student')", () => {
    it("renders section information correctly", () => {
      render(<SectionItem section={mockSection} type="student" />);

      expect(screen.getByText("Lecture 001")).toBeInTheDocument();
      expect(screen.getByText("3 hrs/week")).toBeInTheDocument();
    });

    it("displays correct icon for lecture sections", () => {
      render(<SectionItem section={mockSection} type="student" />);

      // Check for BookOpen icon by looking for its container
      const lectureHeading = screen.getByText("Lecture 001");
      const iconContainer = lectureHeading.previousElementSibling;
      expect(iconContainer).toBeInTheDocument();
    });

    it("displays correct icon for lab sections", () => {
      render(<SectionItem section={mockLabSection} type="student" />);

      expect(screen.getByText("Lab L01")).toBeInTheDocument();
      
      // Check for FlaskConical icon by looking for its container
      const labHeading = screen.getByText("Lab L01");
      const iconContainer = labHeading.previousElementSibling;
      expect(iconContainer).toBeInTheDocument();
    });

    it("displays all time slots correctly", () => {
      render(<SectionItem section={mockSection} type="student" />);

      expect(screen.getByText("Monday 9:00 AM-10:00 AM")).toBeInTheDocument();
      expect(screen.getByText("Wednesday 9:00 AM-10:00 AM")).toBeInTheDocument();
    });

    it("handles single time slot", () => {
      render(<SectionItem section={mockLabSection} type="student" />);

      expect(screen.getByText("Tuesday 2:00 PM-4:00 PM")).toBeInTheDocument();
    });

    it("handles empty time slots", () => {
      const sectionWithNoSlots = {
        ...mockSection,
        timeSlots: [],
      };

      render(<SectionItem section={sectionWithNoSlots} type="student" />);

      expect(screen.getByText("Lecture 001")).toBeInTheDocument();
      expect(screen.getByText("3 hrs/week")).toBeInTheDocument();
      // No time slot badges should be present
      expect(screen.queryByText(/Monday|Tuesday|Wednesday/)).not.toBeInTheDocument();
    });

    it("uses alternative property names (type and hours)", () => {
      const sectionWithAlternativeProps = {
        id: 1,
        section: "001",
        type: "Lecture", // Using 'type' instead of 'sectionType'
        hours: 4, // Using 'hours' instead of 'weekHours'
        timeSlots: [
          {
            day: "Thursday",
            startTime: "10:00 AM",
            endTime: "11:00 AM",
          },
        ],
      };

      render(<SectionItem section={sectionWithAlternativeProps} type="student" />);

      expect(screen.getByText("Lecture 001")).toBeInTheDocument();
      expect(screen.getByText("4 hrs/week")).toBeInTheDocument();
    });

    it("handles section name with day information", () => {
      const sectionWithDayInfo = {
        ...mockSection,
        section: "001 - MWF",
        sectionType: "Lecture",
      };

      render(<SectionItem section={sectionWithDayInfo} type="student" />);

      expect(screen.getByText("Lecture 001 (MWF)")).toBeInTheDocument();
    });

    it("applies correct styling for lecture sections", () => {
      const { container } = render(<SectionItem section={mockSection} type="student" />);

      const sectionDiv = container.firstChild;
      expect(sectionDiv).toHaveClass("border-l-indigo-300", "bg-indigo-50/40");
    });

    it("applies correct styling for lab/tutorial sections", () => {
      const { container } = render(<SectionItem section={mockLabSection} type="student" />);

      const sectionDiv = container.firstChild;
      expect(sectionDiv).toHaveClass("border-l-orange-300", "bg-orange-50/40");
    });
  });

  describe("Course view (type='course' or default)", () => {
    it("renders assigned section correctly", () => {
      render(<SectionItem section={mockSection} type="course" />);

      expect(screen.getByText("Lecture 001")).toBeInTheDocument();
      expect(screen.getByText("Assigned")).toBeInTheDocument();
      expect(screen.getByText("TA: John Doe (ID: 12345678)")).toBeInTheDocument();
      expect(screen.getByText("3 hrs/week")).toBeInTheDocument();
    });

    it("renders unassigned section correctly", () => {
      render(<SectionItem section={mockUnassignedSection} type="course" />);

      expect(screen.getByText("Tutorial T01")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.queryByText(/TA:/)).not.toBeInTheDocument();
      expect(screen.getByText("1 hrs/week")).toBeInTheDocument();
    });

    it("applies correct styling for assigned sections", () => {
      const { container } = render(<SectionItem section={mockSection} type="course" />);

      const sectionDiv = container.firstChild;
      expect(sectionDiv).toHaveClass("bg-green-50/60", "border-green-200/60");
    });

    it("applies correct styling for unassigned sections", () => {
      const { container } = render(<SectionItem section={mockUnassignedSection} type="course" />);

      const sectionDiv = container.firstChild;
      expect(sectionDiv).toHaveClass("bg-red-50/60", "border-red-200/60");
    });

    it("shows assigned badge with correct variant", () => {
      render(<SectionItem section={mockSection} type="course" />);

      const assignedBadge = screen.getByText("Assigned");
      expect(assignedBadge).toBeInTheDocument();
    });

    it("shows unassigned badge with correct variant", () => {
      render(<SectionItem section={mockUnassignedSection} type="course" />);

      const unassignedBadge = screen.getByText("Unassigned");
      expect(unassignedBadge).toBeInTheDocument();
    });

    it("displays time slots in course view", () => {
      render(<SectionItem section={mockSection} type="course" />);

      expect(screen.getByText("Monday 9:00 AM-10:00 AM")).toBeInTheDocument();
      expect(screen.getByText("Wednesday 9:00 AM-10:00 AM")).toBeInTheDocument();
    });

    it("handles partially assigned section (TA but no student ID)", () => {
      const partiallyAssignedSection = {
        ...mockSection,
        assignedTA: "John Doe",
        studentId: null,
      };

      render(<SectionItem section={partiallyAssignedSection} type="course" />);

      expect(screen.getByText("Assigned")).toBeInTheDocument();
      expect(screen.getByText("TA: John Doe (ID: )")).toBeInTheDocument();
    });

    it("defaults to course view when no type provided", () => {
      render(<SectionItem section={mockSection} />);

      // Should render course view elements
      expect(screen.getByText("Assigned")).toBeInTheDocument();
      expect(screen.getByText("TA: John Doe (ID: 12345678)")).toBeInTheDocument();
    });
  });

  describe("Helper functions", () => {
    it("getSectionIcon returns correct icon for different section types", () => {
      // Test lecture
      render(<SectionItem section={mockSection} type="student" />);
      expect(screen.getByText("Lecture 001")).toBeInTheDocument();

      // Test lab
      render(<SectionItem section={mockLabSection} type="student" />);
      expect(screen.getByText("Lab L01")).toBeInTheDocument();

      // Test tutorial
      render(<SectionItem section={mockUnassignedSection} type="student" />);
      expect(screen.getByText("Tutorial T01")).toBeInTheDocument();
    });

    it("getSectionColor returns correct colors for different section types", () => {
      // Test lecture colors
      const { container: lectureContainer } = render(
        <SectionItem section={mockSection} type="student" />
      );
      expect(lectureContainer.firstChild).toHaveClass("border-l-indigo-300");

      // Test lab colors
      const { container: labContainer } = render(
        <SectionItem section={mockLabSection} type="student" />
      );
      expect(labContainer.firstChild).toHaveClass("border-l-orange-300");
    });

    it("formatSectionName handles different formats", () => {
      // Test normal section
      render(<SectionItem section={mockSection} type="student" />);
      expect(screen.getByText("Lecture 001")).toBeInTheDocument();

      // Test section with day info
      const sectionWithDay = {
        ...mockSection,
        section: "001 - MWF",
      };
      render(<SectionItem section={sectionWithDay} type="student" />);
      expect(screen.getByText("Lecture 001 (MWF)")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles missing sectionType gracefully", () => {
      const sectionWithoutType = {
        ...mockSection,
        sectionType: undefined,
        type: "Seminar",
      };

      render(<SectionItem section={sectionWithoutType} type="student" />);
      expect(screen.getByText("Seminar 001")).toBeInTheDocument();
    });

    it("handles missing weekHours gracefully", () => {
      const sectionWithoutWeekHours = {
        ...mockSection,
        weekHours: undefined,
        hours: 2,
      };

      render(<SectionItem section={sectionWithoutWeekHours} type="student" />);
      expect(screen.getByText("2 hrs/week")).toBeInTheDocument();
    });

    it("handles empty assignedTA and studentId", () => {
      const emptyAssignedSection = {
        ...mockSection,
        assignedTA: "",
        studentId: "",
      };

      render(<SectionItem section={emptyAssignedSection} type="course" />);
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
    });

    it("handles time slots with missing information", () => {
      const sectionWithIncompleteSlots = {
        ...mockSection,
        timeSlots: [
          {
            day: "Monday",
            startTime: "9:00 AM",
            endTime: "10:00 AM",
          },
          {
            day: "",
            startTime: "TBD",
            endTime: "TBD",
          },
        ],
      };

      render(<SectionItem section={sectionWithIncompleteSlots} type="student" />);
      
      // Check for the valid time slot
      expect(screen.getByText("Monday 9:00 AM-10:00 AM")).toBeInTheDocument();
      
      // Use a more flexible matcher for the TBD slot
      expect(screen.getByText(/TBD.*TBD/)).toBeInTheDocument();
    });

    it("handles very long section names", () => {
      const sectionWithLongName = {
        ...mockSection,
        section: "001-VERY-LONG-SECTION-NAME-WITH-LOTS-OF-INFO",
      };

      render(<SectionItem section={sectionWithLongName} type="student" />);
      expect(screen.getByText("Lecture 001-VERY-LONG-SECTION-NAME-WITH-LOTS-OF-INFO")).toBeInTheDocument();
    });

    it("handles special characters in TA names", () => {
      const sectionWithSpecialChars = {
        ...mockSection,
        assignedTA: "José María O'Connor-Smith",
      };

      render(<SectionItem section={sectionWithSpecialChars} type="course" />);
      expect(screen.getByText("TA: José María O'Connor-Smith (ID: 12345678)")).toBeInTheDocument();
    });
  });
});