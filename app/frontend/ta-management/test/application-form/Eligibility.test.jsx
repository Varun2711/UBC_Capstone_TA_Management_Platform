import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Eligibility from "@/components/application-form/Eligibility";

// Mock responses object for testing
const mockResponses = {
  citizenshipStatus: "",
  residingInKelowna: "",
  fullTimeEnrollment: "",
  hasOtherPositions: "",
  otherPositionHours: "",
};

const mockSetResponses = vi.fn();

// Helper function to render Eligibility component with props
const renderEligibility = (responses = mockResponses, errors = {}) => {
  return render(
    <Eligibility
      responses={responses}
      setResponses={mockSetResponses}
      errors={errors}
    />
  );
};

describe("Eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all eligibility questions", () => {
    renderEligibility();

    expect(
      screen.getByText(/canadian citizen or permanent resident/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/residing in kelowna/i)).toBeInTheDocument();
    expect(
      screen.getByText(/enrolled as a full-time student/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/other student positions/i)).toBeInTheDocument();
  });

  it("displays citizenship options correctly", () => {
    renderEligibility();

    expect(
      screen.getByLabelText(/yes - canadian citizen/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/yes - permanent resident/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/no - international student/i)
    ).toBeInTheDocument();
  });

  it("calls setResponses when citizenship status is selected", async () => {
    renderEligibility();
    const user = userEvent.setup();

    const canadianCitizenOption = screen.getByLabelText(
      /yes - canadian citizen/i
    );
    await user.click(canadianCitizenOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...mockResponses,
      citizenshipStatus: "Canadian Citizen",
    });
  });

  it("shows international student note when international is selected", () => {
    const responsesWithIntl = {
      ...mockResponses,
      citizenshipStatus: "International Student",
    };
    renderEligibility(responsesWithIntl);

    expect(
      screen.getByText(/valid study permit when requested/i)
    ).toBeInTheDocument();
  });

  it("shows hours input when other positions is Yes", () => {
    const responsesWithOtherPositions = {
      ...mockResponses,
      hasOtherPositions: "Yes",
    };
    renderEligibility(responsesWithOtherPositions);

    expect(
      screen.getByLabelText(/how many hours per week/i)
    ).toBeInTheDocument();
  });

  it("hides hours input when other positions is No", () => {
    const responsesWithNoOtherPositions = {
      ...mockResponses,
      hasOtherPositions: "No",
    };
    renderEligibility(responsesWithNoOtherPositions);

    expect(
      screen.queryByLabelText(/how many hours per week/i)
    ).not.toBeInTheDocument();
  });

  it("displays validation errors when provided", () => {
    const errors = {
      citizenshipStatus: "Please select your citizenship status",
      residingInKelowna: "Please indicate if you're residing in Kelowna",
    };
    renderEligibility(mockResponses, errors);

    expect(
      screen.getByText("Please select your citizenship status")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please indicate if you're residing in Kelowna")
    ).toBeInTheDocument();
  });

  it("resets hours when switching from Yes to No for other positions", async () => {
    const responsesWithHours = {
      ...mockResponses,
      hasOtherPositions: "Yes",
      otherPositionHours: "10",
    };
    renderEligibility(responsesWithHours);
    const user = userEvent.setup();

    const noOption = document.getElementById("other-no");
    await user.click(noOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...responsesWithHours,
      hasOtherPositions: "No",
      otherPositionHours: "",
    });
  });
});
