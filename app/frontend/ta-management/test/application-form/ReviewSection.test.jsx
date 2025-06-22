import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewSection from "@/components/application-form/ReviewSection";

// Mock student data
const mockStudent = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  studentId: "12345678",
  major: "Computer Science",
  studyLevel: "MSc",
  gpa: "3.85",
  faculty: "Faculty of Science",
  degreeStart: "2024",
  phone: "+1 (555) 123-4567",
  resume: new File(["content"], "resume.pdf", { type: "application/pdf" }),
  transcript: new File(["content"], "transcript.pdf", {
    type: "application/pdf",
  }),
};

// Mock selections data
const mockSelections = {
  citizenshipStatus: "Canadian Citizen",
  residingInKelowna: "Yes",
  fullTimeEnrollment: "Yes",
  hasOtherPositions: "No",
  otherPositionHours: "",
  positionType: "Undergraduate Teaching Assistant",
  winterTerm: "W2025 both terms",
  workload: "6 hours",
  disciplineRanking: {
    rank1: "COSC",
    rank2: "MATH",
    rank3: "PHYS",
  },

  resume: "resume.pdf",
  transcript: "transcript.pdf",
};

const renderReviewSection = (
  student = mockStudent,
  selections = mockSelections
) => {
  return render(<ReviewSection student={student} selections={selections} />);
};

describe("ReviewSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the review section title", () => {
    renderReviewSection();
    expect(screen.getByText("Review Your Application")).toBeInTheDocument();
  });

  it("displays all personal information correctly", () => {
    renderReviewSection();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.getByText("MSc")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("3.85")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("Faculty of Science")).toBeInTheDocument();
  });

  it("displays all application details correctly", () => {
    renderReviewSection();

    expect(screen.getByText("Canadian Citizen")).toBeInTheDocument();
    expect(screen.getAllByText("Yes")).toHaveLength(2); // Multiple Yes answers
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(
      screen.getByText("Undergraduate Teaching Assistant")
    ).toBeInTheDocument();
    expect(screen.getByText("W2025 both terms")).toBeInTheDocument();
    expect(screen.getByText("6 hours")).toBeInTheDocument();
  });

  it("displays discipline ranking correctly", () => {
    renderReviewSection();

    expect(screen.getByText("COSC")).toBeInTheDocument();
    expect(screen.getByText("MATH")).toBeInTheDocument();
    expect(screen.getByText("PHYS")).toBeInTheDocument();
  });

  it("displays supporting documents", () => {
    renderReviewSection();

    expect(screen.getByText(/resume\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/transcript\.pdf/)).toBeInTheDocument();
  });

  it("shows 'Not uploaded' for missing documents", () => {
    const studentWithoutDocs = {
      ...mockStudent,
      resume: null,
      transcript: null,
    };
    renderReviewSection(studentWithoutDocs);

    expect(screen.getAllByText(/Not uploaded/)).toHaveLength(2);
  });

  it("shows international student note when applicable", () => {
    const selectionsWithIntlStudent = {
      ...mockSelections,
      citizenshipStatus: "International Student",
    };
    renderReviewSection(mockStudent, selectionsWithIntlStudent);

    expect(screen.getByText("International Student")).toBeInTheDocument();
    expect(
      screen.getByText(/valid study permit when requested/i)
    ).toBeInTheDocument();
  });

  it("shows other position hours when applicable", () => {
    const selectionsWithOtherPositions = {
      ...mockSelections,
      hasOtherPositions: "Yes",
      otherPositionHours: "10",
    };
    renderReviewSection(mockStudent, selectionsWithOtherPositions);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(
      screen.getByText(/number of hours per week for other positions/i)
    ).toBeInTheDocument();
  });

  it("renders confirmation checkbox", () => {
    renderReviewSection();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    const confirmationText = screen.getByText(
      /I confirm that the information I have provided/i
    );
    expect(confirmationText).toBeInTheDocument();
  });

  it("allows user to check/uncheck confirmation checkbox", async () => {
    renderReviewSection();
    const user = userEvent.setup();

    const checkbox = screen.getByRole("checkbox");

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click to check
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click to uncheck
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("renders all section headings", () => {
    renderReviewSection();

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Application Details")).toBeInTheDocument();
    expect(screen.getByText("Supporting Documents")).toBeInTheDocument();
  });
});
