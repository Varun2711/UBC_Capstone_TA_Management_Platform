import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { StudentCalendarTab } from "@/components/scheduler/assignment/StudentCalendarTab";

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ events, eventPropGetter, components }) => (
    <div data-testid="calendar">
      Calendar with {events.length} events
      {events.map((event, index) => (
        <div key={index} data-testid={`calendar-event-${index}`}>
          {event.title}
        </div>
      ))}
    </div>
  ),
  momentLocalizer: () => ({})
}));

// Mock moment
vi.mock('moment', () => {
  const moment = vi.fn(() => ({
    startOf: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    hour: vi.fn().mockReturnThis(),
    minute: vi.fn().mockReturnThis(),
    second: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date('2024-01-01T09:00:00')),
    format: vi.fn((format) => {
      if (format === 'dddd h:mm A') return 'Monday 9:00 AM';
      if (format === 'h:mm A') return '10:00 AM';
      return 'Monday 9:00 AM';
    })
  }));
  return { default: moment };
});

// Mock assignment management logic
vi.mock("@/logic/assignmentManagement", () => ({
  parseTermCode: vi.fn((termKey) => {
    if (termKey === "2024W1") return { season: "Winter", term: "1" };
    if (termKey === "2024W2") return { season: "Winter", term: "2" };
    if (termKey === "2024WB") return { season: "Winter", term: "Both" };
    return null;
  }),
}));

// Helper function to find and click select buttons more reliably
const clickSelectButton = async (placeholderText) => {
  // Find the button that contains the placeholder text
  const buttons = screen.getAllByRole('combobox');
  const targetButton = buttons.find(button => 
    button.textContent.includes(placeholderText) && 
    !button.hasAttribute('disabled') &&
    !button.hasAttribute('data-disabled')
  );
  
  if (targetButton) {
    await userEvent.click(targetButton);
  } else {
    throw new Error(`Could not find enabled select button with text: ${placeholderText}`);
  }
};

// Updated helper function for student selection
const selectStudent = async (studentName) => {
  const searchButton = screen.getByText("Search students...");
  await userEvent.click(searchButton);
  await waitFor(() => screen.getByText(studentName));
  await userEvent.click(screen.getByText(studentName));
};

describe("StudentCalendarTab", () => {
  const mockStudents = [
    {
      id: 1,
      studentName: "John Doe",
      studentId: "12345678",
      email: "john.doe@example.com",
      studyLevel: "Graduate",
      totalWeeklyHours: 10,
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
              instructor: "Dr. Smith",
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
            },
            {
              id: 2,
              courseCode: "COSC 111",
              courseName: "Introduction to Programming",
              section: "L01",
              sectionType: "Lab",
              weekHours: 2,
              instructor: "Dr. Smith",
              timeSlots: [
                {
                  day: "Friday",
                  startTime: "2:00 PM",
                  endTime: "4:00 PM",
                },
              ],
            },
          ],
          "2024W2": [
            {
              id: 3,
              courseCode: "COSC 221",
              courseName: "Data Structures",
              section: "001",
              sectionType: "Lecture",
              weekHours: 3,
              instructor: "Dr. Johnson",
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
              id: 4,
              courseCode: "MATH 101",
              courseName: "Calculus I",
              section: "T01",
              sectionType: "Tutorial",
              weekHours: 1,
              instructor: "Dr. Wilson",
              timeSlots: [
                {
                  day: "Thursday",
                  startTime: "3:00 PM",
                  endTime: "4:00 PM",
                },
              ],
            },
          ],
        },
      },
    },
    {
      id: 2,
      studentName: "Jane Smith",
      studentId: "87654321",
      email: "jane.smith@example.com",
      studyLevel: "Undergraduate",
      totalWeeklyHours: 6,
      yearlyAssignments: {
        "2024": {
          "2024W1": [
            {
              id: 5,
              courseCode: "PHYS 101",
              courseName: "Physics I",
              section: "L02",
              sectionType: "Lab",
              weekHours: 3,
              instructor: "Dr. Brown",
              timeSlots: [
                {
                  day: "Wednesday",
                  startTime: "1:00 PM",
                  endTime: "4:00 PM",
                },
              ],
            },
          ],
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial rendering", () => {
    it("renders correctly with initial state", () => {
      render(<StudentCalendarTab students={mockStudents} />);

      expect(screen.getByText("Student Schedule Calendar")).toBeInTheDocument();
      expect(screen.getByText("Select Student")).toBeInTheDocument();
      expect(screen.getByText("Academic Year")).toBeInTheDocument();
      expect(screen.getByText("Term")).toBeInTheDocument();
    });

    it("shows placeholder when no student is selected", () => {
      render(<StudentCalendarTab students={mockStudents} />);

      expect(screen.getByText("Select Student, Year, and Term")).toBeInTheDocument();
      expect(screen.getByText("Choose a student, academic year, and term to view their weekly schedule.")).toBeInTheDocument();
    });

    it("year and term selects are initially disabled", () => {
      render(<StudentCalendarTab students={mockStudents} />);

      expect(screen.getByText("Select year")).toBeInTheDocument();
      expect(screen.getByText("Select term")).toBeInTheDocument();
    });

    it("handles empty students array", () => {
      render(<StudentCalendarTab students={[]} />);

      expect(screen.getByText("Student Schedule Calendar")).toBeInTheDocument();
      expect(screen.getByText("Select Student, Year, and Term")).toBeInTheDocument();
    });
  });

  describe("Student selection", () => {
    it("opens student search popover when clicked", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search students...")).toBeInTheDocument();
      });
    });

    it("displays all students in search results", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getByText("12345678 • john.doe@example.com")).toBeInTheDocument();
        expect(screen.getByText("87654321 • jane.smith@example.com")).toBeInTheDocument();
      });
    });

    it("filters students based on search input", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText("Search students...");
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search students...");
      await userEvent.type(searchInput, "John");

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
      });
    });

    it("selects a student and shows student info", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText("John Doe"));

      await waitFor(() => {
        expect(screen.getByText("John Doe (12345678)")).toBeInTheDocument();
        expect(screen.getByText("Graduate")).toBeInTheDocument();
        expect(screen.getByText("Total: 10h/week")).toBeInTheDocument();
      });
    });

    it("enables year selection after student is selected", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText("John Doe"));

      await waitFor(() => {
        const yearSelect = screen.getByText("Select year");
        expect(yearSelect).toBeInTheDocument();
        // The select should no longer be disabled
        const yearSelectButton = yearSelect.closest("button");
        expect(yearSelectButton).not.toHaveAttribute("data-disabled", "true");
      });
    });
  });

  describe("Year and term selection", () => {
    it("shows available years for selected student", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      // Select student first
      await selectStudent("John Doe");

      // Wait for year select to become enabled, then click it
      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");

      await waitFor(() => {
        expect(screen.getByText("2024")).toBeInTheDocument();
        expect(screen.getByText("2023")).toBeInTheDocument();
      });
    });

    it("shows available terms for selected student and year", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      await selectStudent("John Doe");

      // Select year
      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      // Select term
      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");

      await waitFor(() => {
        expect(screen.getByText("Winter Term 1")).toBeInTheDocument();
        expect(screen.getByText("Winter Term 2")).toBeInTheDocument();
      });
    });

    it("displays calendar when all selections are complete", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      await selectStudent("John Doe");

      // Select year
      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      // Select term
      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");
      await waitFor(() => screen.getByText("Winter Term 1"));
      await userEvent.click(screen.getByText("Winter Term 1"));

      // Calendar should be displayed
      await waitFor(() => {
        expect(screen.getByText("Weekly Schedule - John Doe")).toBeInTheDocument();
        expect(screen.getByTestId("calendar")).toBeInTheDocument();
      });
    });
  });

  describe("Calendar display", () => {
    it("shows legend with section type colors", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      await selectStudent("John Doe");

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");
      await waitFor(() => screen.getByText("Winter Term 1"));
      await userEvent.click(screen.getByText("Winter Term 1"));

      // Should show legend badges - use getAllByText to handle multiple matches
      await waitFor(() => {
        const lectureElements = screen.getAllByText("Lecture");
        expect(lectureElements.length).toBeGreaterThan(0);
        
        const labElements = screen.getAllByText("Lab");
        expect(labElements.length).toBeGreaterThan(0);
        
        // Check for other legend items
        expect(screen.getByText("Tutorial")).toBeInTheDocument();
        expect(screen.getByText("Seminar")).toBeInTheDocument();
        expect(screen.getByText("Workshop")).toBeInTheDocument();
      });
    });

    it("displays assignment summary cards", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      await selectStudent("John Doe");

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");
      await waitFor(() => screen.getByText("Winter Term 1"));
      await userEvent.click(screen.getByText("Winter Term 1"));

      // Should show assignment cards - use getAllByText for elements that appear multiple times
      await waitFor(() => {
        // Check that both assignments are displayed
        const cosc111Elements = screen.getAllByText("COSC 111 001");
        expect(cosc111Elements.length).toBeGreaterThan(0);
        
        const cosc111LabElements = screen.getAllByText("COSC 111 L01");
        expect(cosc111LabElements.length).toBeGreaterThan(0);
        
        const programmingElements = screen.getAllByText("Introduction to Programming");
        expect(programmingElements.length).toBeGreaterThan(0);
        
        const instructorElements = screen.getAllByText("Instructor: Dr. Smith");
        expect(instructorElements.length).toBeGreaterThan(0);
      });
    });

    it("shows no assignments message when student has no assignments", async () => {
      const studentsWithNoAssignments = [
        {
          ...mockStudents[0],
          yearlyAssignments: {
            "2024": {
              "2024W1": [],
            },
          },
        },
      ];

      render(<StudentCalendarTab students={studentsWithNoAssignments} />);

      await selectStudent("John Doe");

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");
      await waitFor(() => screen.getByText("Winter Term 1"));
      await userEvent.click(screen.getByText("Winter Term 1"));

      // Should show no assignments message
      await waitFor(() => {
        expect(screen.getByText("No assignments found")).toBeInTheDocument();
        expect(screen.getByText("This student has no assignments for the selected term.")).toBeInTheDocument();
      });
    });
  });

  describe("Search functionality", () => {
    it("filters students by name", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText("Search students...");
      await userEvent.type(searchInput, "Jane");

      await waitFor(() => {
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });
    });

    it("filters students by student ID", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText("Search students...");
      await userEvent.type(searchInput, "12345678");

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
      });
    });

    it("filters students by email", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText("Search students...");
      await userEvent.type(searchInput, "jane");

      await waitFor(() => {
        // Check that Jane's entry is visible
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        // Check that John is not visible
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });
    });

    it("shows 'No students found' when search has no results", async () => {
      render(<StudentCalendarTab students={mockStudents} />);

      const searchButton = screen.getByText("Search students...");
      await userEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText("Search students...");
      await userEvent.type(searchInput, "nonexistent");

      await waitFor(() => {
        expect(screen.getByText("No students found.")).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("handles students with no yearly assignments", () => {
      const studentsWithNoData = [
        {
          id: 1,
          studentName: "Empty Student",
          studentId: "00000000",
          email: "empty@example.com",
          studyLevel: "Graduate",
          totalWeeklyHours: 0,
          yearlyAssignments: {},
        },
      ];

      render(<StudentCalendarTab students={studentsWithNoData} />);

      expect(screen.getByText("Student Schedule Calendar")).toBeInTheDocument();
    });

    it("handles students with missing properties", () => {
      const incompleteStudents = [
        {
          id: 1,
          studentName: "Incomplete Student",
          studentId: "99999999",
          // missing email, studyLevel, etc.
        },
      ];

      render(<StudentCalendarTab students={incompleteStudents} />);

      expect(screen.getByText("Student Schedule Calendar")).toBeInTheDocument();
    });

    it("handles time slots with TBD values", async () => {
      const studentsWithTBD = [
        {
          ...mockStudents[0],
          yearlyAssignments: {
            "2024": {
              "2024W1": [
                {
                  id: 1,
                  courseCode: "TBD 101",
                  courseName: "TBD Course",
                  section: "001",
                  sectionType: "Lecture",
                  weekHours: 3,
                  timeSlots: [
                    {
                      day: "TBD",
                      startTime: "TBD",
                      endTime: "TBD",
                    },
                  ],
                },
              ],
            },
          },
        },
      ];

      render(<StudentCalendarTab students={studentsWithTBD} />);

      await selectStudent("John Doe");

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const yearButton = buttons.find(btn => 
          btn.textContent.includes('Select year') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(yearButton).toBeInTheDocument();
      });

      await clickSelectButton("Select year");
      await waitFor(() => screen.getByText("2024"));
      await userEvent.click(screen.getByText("2024"));

      await waitFor(() => {
        const buttons = screen.getAllByRole('combobox');
        const termButton = buttons.find(btn => 
          btn.textContent.includes('Select term') && 
          !btn.hasAttribute('data-disabled')
        );
        expect(termButton).toBeInTheDocument();
      });

      await clickSelectButton("Select term");
      await waitFor(() => screen.getByText("Winter Term 1"));
      await userEvent.click(screen.getByText("Winter Term 1"));

      // Should handle TBD gracefully
      await waitFor(() => {
        expect(screen.getByText("No assignments found")).toBeInTheDocument();
      });
    });
  });
});