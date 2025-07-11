import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewSection from "@/components/application-form/ReviewSection";

// Mock the label mapping functions
vi.mock("@/components/application-form/labelMappings", () => ({
  getPositionTypeLabel: vi.fn((value) => {
    const mappings = {
      UTA: "Undergraduate Teaching Assistant",
      GTA2: "Graduate Teaching Assistant 2 (Masters)",
      GTA1: "Graduate Teaching Assistant 1 (Ph.D)",
    };
    return mappings[value] || value;
  }),
  getWorkloadLabel: vi.fn((value) => {
    const mappings = {
      6: "6 hours",
      12: "12 hours",
    };
    return mappings[value] || value;
  }),
  getCitizenshipLabel: vi.fn((value) => {
    const mappings = {
      citizen: "Yes - Canadian Citizen",
      pr: "Yes - Permanent Resident",
      international: "No - International Student",
    };
    return mappings[value] || value;
  }),
  getYesNoLabel: vi.fn((value) => {
    const mappings = {
      yes: "Yes",
      no: "No",
    };
    return mappings[value] || value;
  }),
}));

// Mock student data (no longer used in current component but kept for compatibility)
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
};

// Mock selections data
const mockSelections = {
  citizenshipStatus: "citizen",
  residingInKelowna: "yes",
  fullTimeEnrollment: "yes",
  hasOtherPositions: "no",
  otherPositionHours: "",
  positionType: "UTA",
  winterTerm: "W2025 both terms",
  workload: "6",
  disciplineRanking: {
    rank1: "COSC",
    rank2: "MATH",
    rank3: "PHYS",
  },
};

// Mock documents
const mockDocuments = [
  {
    id: 1,
    name: "resume.pdf",
    size: 1024 * 1024, // 1MB in bytes
  },
  {
    id: 2,
    name: "transcript.pdf",
    size: 2 * 1024 * 1024, // 2MB in bytes
  },
];

const mockSetConfirmation = vi.fn();

const renderReviewSection = (
  student = mockStudent,
  selections = mockSelections,
  confirmation = false,
  documents = mockDocuments,
  errors = {}
) => {
  return render(
    <ReviewSection
      student={student}
      selections={selections}
      confirmation={confirmation}
      setConfirmation={mockSetConfirmation}
      documents={documents}
      errors={errors}
    />
  );
};

describe("ReviewSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the review section title", () => {
    renderReviewSection();
    expect(
      screen.getByText("Review Your Application Responses")
    ).toBeInTheDocument();
  });

  it("displays citizenship status correctly", () => {
    renderReviewSection();
    expect(screen.getByText("Yes - Canadian Citizen")).toBeInTheDocument();
  });

  it("displays full-time enrollment status correctly", () => {
    renderReviewSection();
    expect(
      screen.getByText(/enrolled as a full-time student/i)
    ).toBeInTheDocument();
  });

  it("displays other positions status correctly", () => {
    renderReviewSection();
    expect(screen.getByText(/other student positions/i)).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("displays position type correctly", () => {
    renderReviewSection();
    expect(
      screen.getByText(/which position are you applying for/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Undergraduate Teaching Assistant")
    ).toBeInTheDocument();
  });

  it("displays winter term selection correctly", () => {
    renderReviewSection();
    expect(
      screen.getByText(/W2025 applications, which of the following terms/i)
    ).toBeInTheDocument();
    expect(screen.getByText("W2025 both terms")).toBeInTheDocument();
  });

  it("displays workload preference correctly", () => {
    renderReviewSection();
    expect(
      screen.getByText(/preferred maximum average hourly workload/i)
    ).toBeInTheDocument();
    expect(screen.getByText("6 hours")).toBeInTheDocument();
  });

  it("displays discipline ranking correctly", () => {
    renderReviewSection();
    expect(
      screen.getByText(/rank your top 3 preferred disciplines/i)
    ).toBeInTheDocument();
    expect(screen.getByText("1st Discipline:")).toBeInTheDocument();
    expect(screen.getByText("COSC")).toBeInTheDocument();
    expect(screen.getByText("2nd Discipline:")).toBeInTheDocument();
    expect(screen.getByText("MATH")).toBeInTheDocument();
    expect(screen.getByText("3rd Discipline:")).toBeInTheDocument();
    expect(screen.getByText("PHYS")).toBeInTheDocument();
  });

  it("displays supporting documents section", () => {
    renderReviewSection();
    expect(screen.getByText("Supporting Documents")).toBeInTheDocument();
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("(1.00 MB)")).toBeInTheDocument();
    expect(screen.getByText("transcript.pdf")).toBeInTheDocument();
    expect(screen.getByText("(2.00 MB)")).toBeInTheDocument();
  });

  it("shows 'No documents uploaded' when documents array is empty", () => {
    renderReviewSection(mockStudent, mockSelections, false, []);
    expect(screen.getByText("No documents uploaded")).toBeInTheDocument();
  });

  it("shows 'No documents uploaded' when documents is null", () => {
    renderReviewSection(mockStudent, mockSelections, false, null);
    expect(screen.getByText("No documents uploaded")).toBeInTheDocument();
  });

  it("shows international student note when applicable", () => {
    const selectionsWithIntlStudent = {
      ...mockSelections,
      citizenshipStatus: "international",
    };
    renderReviewSection(mockStudent, selectionsWithIntlStudent);

    expect(screen.getByText("No - International Student")).toBeInTheDocument();
    expect(
      screen.getByText(/valid study permit when requested/i)
    ).toBeInTheDocument();
  });

  it("shows other position hours when applicable", () => {
    const selectionsWithOtherPositions = {
      ...mockSelections,
      hasOtherPositions: "yes",
      otherPositionHours: "10",
    };
    renderReviewSection(mockStudent, selectionsWithOtherPositions);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(
      screen.getByText(/number of hours per week for other positions/i)
    ).toBeInTheDocument();
  });

  it("does not show other position hours section when hasOtherPositions is no", () => {
    const selectionsWithNoOtherPositions = {
      ...mockSelections,
      hasOtherPositions: "no",
    };
    renderReviewSection(mockStudent, selectionsWithNoOtherPositions);

    expect(
      screen.queryByText(/number of hours per week for other positions/i)
    ).not.toBeInTheDocument();
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

  it("displays confirmation error when provided", () => {
    const errors = {
      confirmation: "You must confirm the information is accurate",
    };
    renderReviewSection(
      mockStudent,
      mockSelections,
      false,
      mockDocuments,
      errors
    );

    expect(
      screen.getByText("You must confirm the information is accurate")
    ).toBeInTheDocument();
  });

  it("displays all citizenship options correctly with mapped labels", () => {
    // Test Canadian Citizen
    const citizenSelections = {
      ...mockSelections,
      citizenshipStatus: "citizen",
    };
    renderReviewSection(mockStudent, citizenSelections);
    expect(screen.getByText("Yes - Canadian Citizen")).toBeInTheDocument();

    // Test Permanent Resident
    const prSelections = { ...mockSelections, citizenshipStatus: "pr" };
    renderReviewSection(mockStudent, prSelections);
    expect(screen.getByText("Yes - Permanent Resident")).toBeInTheDocument();
  });

  it("displays all position types correctly with mapped labels", () => {
    // Test UTA
    const utaSelections = { ...mockSelections, positionType: "UTA" };
    renderReviewSection(mockStudent, utaSelections);
    expect(
      screen.getByText("Undergraduate Teaching Assistant")
    ).toBeInTheDocument();

    // Test GTA2
    const gta2Selections = { ...mockSelections, positionType: "GTA2" };
    renderReviewSection(mockStudent, gta2Selections);
    expect(
      screen.getByText("Graduate Teaching Assistant 2 (Masters)")
    ).toBeInTheDocument();

    // Test GTA1
    const gta1Selections = { ...mockSelections, positionType: "GTA1" };
    renderReviewSection(mockStudent, gta1Selections);
    expect(
      screen.getByText("Graduate Teaching Assistant 1 (Ph.D)")
    ).toBeInTheDocument();
  });

  it("displays workload options correctly with mapped labels", () => {
    // Test 6 hours
    const sixHourSelections = { ...mockSelections, workload: "6" };
    renderReviewSection(mockStudent, sixHourSelections);
    expect(screen.getByText("6 hours")).toBeInTheDocument();

    // Test 12 hours
    const twelveHourSelections = { ...mockSelections, workload: "12" };
    renderReviewSection(mockStudent, twelveHourSelections);
    expect(screen.getByText("12 hours")).toBeInTheDocument();
  });

  it("renders current application year correctly", () => {
    renderReviewSection();
    expect(screen.getByText(/For W2025 applications/i)).toBeInTheDocument();
  });

  it("handles missing discipline ranking gracefully", () => {
    const selectionsWithoutRanking = {
      ...mockSelections,
      disciplineRanking: {
        rank1: "",
        rank2: "MATH",
        rank3: "PHYS",
      },
    };
    renderReviewSection(mockStudent, selectionsWithoutRanking);

    expect(screen.getByText("1st Discipline:")).toBeInTheDocument();
    expect(screen.getByText("2nd Discipline:")).toBeInTheDocument();
    expect(screen.getByText("3rd Discipline:")).toBeInTheDocument();
    // Empty rank1 should still render but be empty
    expect(screen.getByText("MATH")).toBeInTheDocument();
    expect(screen.getByText("PHYS")).toBeInTheDocument();
  });

  it("formats document file sizes correctly", () => {
    const documentsWithVariousSizes = [
      {
        id: 1,
        name: "small_file.pdf",
        size: 500, // 500 bytes
      },
      {
        id: 2,
        name: "medium_file.pdf",
        size: 1500000, // ~1.5 MB
      },
    ];

    renderReviewSection(
      mockStudent,
      mockSelections,
      false,
      documentsWithVariousSizes
    );

    expect(screen.getByText("(0.00 MB)")).toBeInTheDocument(); // 500 bytes
    expect(screen.getByText("(1.43 MB)")).toBeInTheDocument(); // ~1.5 MB
  });
});
