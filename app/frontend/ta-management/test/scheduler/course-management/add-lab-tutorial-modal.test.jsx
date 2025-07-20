import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddLabTutorialModal } from "@/components/scheduler/course_management/add-lab-tutorial-modal";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";

// Mock JSDOM browser APIs that are not implemented
const ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal("ResizeObserver", ResizeObserver);

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock lucide-react icons for cleaner test output
vi.mock("lucide-react", () => ({
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  X: () => <div data-testid="close-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));

// Mock data for the tests
const mockCourse = {
  id: "cs101",
  code: "CS 101",
  title: "Introduction to Programming",
};

const mockOffering = {
  id: "offering-cs101-a",
  section: "Section A",
  term: "Fall",
  year: "2025",
  instructor: "Dr. Turing",
};

const mockExistingSessions = {
  labs: [
    {
      id: "lab1",
      section: "Lab 01",
      day: "Monday",
      time: "10:00 AM - 12:00 PM",
      location: "CS Lab 101",
    },
  ],
  tutorials: [],
};

describe("AddLabTutorialModal", () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnAddSession;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnAddSession = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props) => {
    render(
      <AddLabTutorialModal
        isOpen={true}
        onClose={mockOnClose}
        onAddSession={mockOnAddSession}
        course={mockCourse}
        offering={mockOffering}
        existingSessions={mockExistingSessions}
        {...props}
      />
    );
  };

  describe("Rendering and Initialization", () => {
    it("should render the modal with correct initial data and empty fields", () => {
      renderComponent();

      expect(
        screen.getByRole("heading", { name: /add lab\/tutorial session/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/add a new lab or tutorial session for/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${mockCourse.code} - ${mockOffering.section}`)
      ).toBeInTheDocument();
      expect(screen.getByText(/1 existing sessions/i)).toBeInTheDocument();

      // Check that all fields are present using their accessible names
      expect(
        screen.getByRole("combobox", { name: /session type/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /section name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /day/i })
      ).toBeInTheDocument();
      // Corrected queries for time inputs, assuming aria-labels are added to the component
      expect(
        screen.getByRole("combobox", { name: /hour/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /minute/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /am\/pm/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /duration/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /location/i })
      ).toBeInTheDocument();

      // Dynamic elements should be hidden initially
      expect(
        screen.queryByRole("button", { name: /suggest/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("clock-icon")).not.toBeInTheDocument();
    });
  });

  describe("Validation and Interaction", () => {
    it("should show required field errors when form is submitted empty", async () => {
      renderComponent();
      await user.click(screen.getByRole("button", { name: /add session/i }));

      expect(await screen.findAllByTestId("alert-icon")).toHaveLength(7);
      expect(screen.getByText("Session type is required")).toBeInTheDocument();
      expect(screen.getByText("Section name is required")).toBeInTheDocument();
      expect(screen.getByText("Day is required")).toBeInTheDocument();
      // The time error is consolidated, so we check for one of the messages
      expect(screen.getByText("Start hour is required")).toBeInTheDocument();
      expect(screen.getByText("Location is required")).toBeInTheDocument();

      expect(mockOnAddSession).not.toHaveBeenCalled();
    });

    it("should show the Suggest button and update placeholders after selecting a session type", async () => {
      renderComponent();

      await user.click(screen.getByRole("combobox", { name: /session type/i }));
      await user.click(screen.getByText("Laboratory Session"));

      // Suggest button should now be visible
      expect(
        screen.getByRole("button", { name: /suggest/i })
      ).toBeInTheDocument();
      // Placeholder should be updated
      expect(screen.getByPlaceholderText("e.g., Lab 01")).toBeInTheDocument();
    });

    it("should suggest the next available section name", async () => {
      renderComponent({
        existingSessions: { labs: [{ section: "Lab 01" }], tutorials: [] },
      });

      await user.click(screen.getByRole("combobox", { name: /session type/i }));
      await user.click(screen.getByText("Laboratory Session"));

      // Click suggest button
      await user.click(screen.getByRole("button", { name: /suggest/i }));

      // Since "Lab 01" exists, the next suggestion should be "Lab 02"
      expect(
        screen.getByRole("textbox", { name: /section name/i })
      ).toHaveValue("Lab 02");
    });

    it("should show formatted time range after selecting time components", async () => {
      renderComponent();

      await user.click(screen.getByRole("combobox", { name: /hour/i }));
      await user.click(screen.getByRole("option", { name: "9" }));

      await user.click(screen.getByRole("combobox", { name: /minute/i }));
      await user.click(screen.getByRole("option", { name: "30" }));

      await user.click(screen.getByRole("combobox", { name: /am\/pm/i }));
      await user.click(screen.getByRole("option", { name: "AM" }));

      await user.click(screen.getByRole("combobox", { name: /duration/i }));
      await user.click(screen.getByRole("option", { name: "2 hours" }));

      // The formatted time should now be visible
      const timeDisplay = await screen.findByText("9:30 AM - 11:30 AM");
      expect(timeDisplay).toBeInTheDocument();
      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });
  });

  describe("Submission and Cancellation", () => {
    // it('should call onAddSession with correctly formatted data on success', async () => {
    //   renderComponent();

    //   // Fill out the form
    //   await user.click(screen.getByRole('combobox', { name: /session type/i }));
    //   await user.click(screen.getByText('Tutorial Session'));

    //   await user.type(screen.getByRole('textbox', { name: /section name/i }), 'Tutorial 01');

    //   await user.click(screen.getByRole('combobox', { name: /day/i }));
    //   await user.click(screen.getByRole('option', { name: 'Wednesday' }));

    //   await user.click(screen.getByRole('combobox', { name: 'Hour' }));
    //   await user.click(screen.getByRole('option', { name: '2' }));
    //   await user.click(screen.getByRole('combobox', { name: /minute/i }));
    //   await user.click(screen.getByRole('option', { name: '00' }));
    //   await user.click(screen.getByRole('combobox', { name: /am\/pm/i }));
    //   await user.click(screen.getByRole('option', { name: 'PM' }));
    //   await user.click(screen.getByRole('combobox', { name: /duration/i }));
    //   await user.click(screen.getByRole('option', { name: '1.5 hours' }));

    //   await user.type(screen.getByRole('textbox', { name: /location/i }), 'Room 303');

    //   // Submit form
    //   const submitButton = screen.getByRole('button', { name: /add tutorial session/i });
    //   await user.click(submitButton);

    //   await waitFor(() => {
    //     expect(submitButton).toBeDisabled();
    //     expect(screen.getByText(/adding tutorial session.../i)).toBeInTheDocument();
    //   });

    //   await waitFor(() => {
    //     expect(mockOnAddSession).toHaveBeenCalledTimes(1);
    //     expect(mockOnAddSession).toHaveBeenCalledWith(
    //       mockCourse.id,
    //       mockOffering.term,
    //       mockOffering.year,
    //       'tutorial', // The session type
    //       expect.objectContaining({
    //         section: 'Tutorial 01',
    //         day: 'Wednesday',
    //         location: 'Room 303',
    //         time: '2:00 PM - 3:30 PM', // Check the formatted time
    //         forOfferings: [mockOffering.id],
    //         taAssigned: null,
    //       })
    //     );
    //   });

    //   await waitFor(() => {
    //     expect(mockOnClose).toHaveBeenCalledTimes(1);
    //   });
    // });

    it("should call onClose when cancel button is clicked", async () => {
      renderComponent();
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnAddSession).not.toHaveBeenCalled();
    });
  });
});
