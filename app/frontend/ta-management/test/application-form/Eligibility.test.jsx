import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Eligbility from "@/components/application-form/Eligibility";

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
    <Eligbility
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
      citizenshipStatus: "citizen",
    });
  });

  it("calls setResponses when permanent resident is selected", async () => {
    renderEligibility();
    const user = userEvent.setup();

    const permanentResidentOption = screen.getByLabelText(
      /yes - permanent resident/i
    );
    await user.click(permanentResidentOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...mockResponses,
      citizenshipStatus: "pr",
    });
  });

  it("calls setResponses when international student is selected", async () => {
    renderEligibility();
    const user = userEvent.setup();

    const internationalOption = screen.getByLabelText(
      /no - international student/i
    );
    await user.click(internationalOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...mockResponses,
      citizenshipStatus: "international",
    });
  });

  it("shows international student note when international is selected", () => {
    const responsesWithIntl = {
      ...mockResponses,
      citizenshipStatus: "international",
    };
    renderEligibility(responsesWithIntl);

    expect(
      screen.getByText(/valid study permit when requested/i)
    ).toBeInTheDocument();
  });

  it("does not show international student note for other citizenship options", () => {
    const responsesWithCitizen = {
      ...mockResponses,
      citizenshipStatus: "citizen",
    };
    renderEligibility(responsesWithCitizen);

    expect(
      screen.queryByText(/valid study permit when requested/i)
    ).not.toBeInTheDocument();
  });

  it("displays Kelowna residency question with Yes/No options", () => {
    renderEligibility();

    expect(
      screen.getByText(/residing in kelowna during the terms/i)
    ).toBeInTheDocument();

    // Check for Yes and No radio buttons for Kelowna question
    const kelownaYes = screen.getByLabelText("Yes", {
      selector: "#kelowna-yes",
    });
    const kelownaNo = screen.getByLabelText("No", { selector: "#kelowna-no" });

    expect(kelownaYes).toBeInTheDocument();
    expect(kelownaNo).toBeInTheDocument();
  });

  it("calls setResponses when Kelowna residency is selected", async () => {
    renderEligibility();
    const user = userEvent.setup();

    const kelownaYes = screen.getByLabelText("Yes", {
      selector: "#kelowna-yes",
    });
    await user.click(kelownaYes);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...mockResponses,
      residingInKelowna: "yes",
    });
  });

  it("displays full-time enrollment question with credit requirements", () => {
    renderEligibility();

    expect(
      screen.getByText(/enrolled as a full-time student/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Summer 2025: minimum 9 credits/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Winter 2025: minimum 18 credits/i)
    ).toBeInTheDocument();
  });

  it("calls setResponses when full-time enrollment is selected", async () => {
    renderEligibility();
    const user = userEvent.setup();

    const fullTimeYes = screen.getByLabelText("Yes", {
      selector: "#fulltime-yes",
    });
    await user.click(fullTimeYes);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...mockResponses,
      fullTimeEnrollment: "yes",
    });
  });

  it("displays other student positions question with examples", () => {
    renderEligibility();

    expect(screen.getByText(/other student positions/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Co-Op, Research Assistant, SL Leader/i)
    ).toBeInTheDocument();
  });

  it("shows hours input when other positions is Yes", () => {
    const responsesWithOtherPositions = {
      ...mockResponses,
      hasOtherPositions: "yes",
    };
    renderEligibility(responsesWithOtherPositions);

    expect(
      screen.getByLabelText(/how many hours per week/i)
    ).toBeInTheDocument();

    const hoursInput = screen.getByPlaceholderText("e.g., 10");
    expect(hoursInput).toBeInTheDocument();
    expect(hoursInput).toHaveAttribute("type", "number");
    expect(hoursInput).toHaveAttribute("min", "0");
  });

  it("hides hours input when other positions is No", () => {
    const responsesWithNoOtherPositions = {
      ...mockResponses,
      hasOtherPositions: "no",
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
      fullTimeEnrollment: "Please confirm your enrollment status",
      hasOtherPositions: "Please indicate if you have other positions",
      otherPositionHours: "Please specify hours for other positions",
    };
    renderEligibility(mockResponses, errors);

    expect(
      screen.getByText("Please select your citizenship status")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please indicate if you're residing in Kelowna")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please confirm your enrollment status")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please indicate if you have other positions")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please specify hours for other positions")
    ).toBeInTheDocument();
  });

  it("resets hours when switching from Yes to No for other positions", async () => {
    const responsesWithHours = {
      ...mockResponses,
      hasOtherPositions: "yes",
      otherPositionHours: "10",
    };
    renderEligibility(responsesWithHours);
    const user = userEvent.setup();

    const noOption = screen.getByLabelText("No", { selector: "#other-no" });
    await user.click(noOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...responsesWithHours,
      hasOtherPositions: "no",
      otherPositionHours: "",
    });
  });

  it("preserves hours when switching from No to Yes for other positions", async () => {
    const responsesWithoutOtherPositions = {
      ...mockResponses,
      hasOtherPositions: "no",
      otherPositionHours: "",
    };
    renderEligibility(responsesWithoutOtherPositions);
    const user = userEvent.setup();

    const yesOption = screen.getByLabelText("Yes", { selector: "#other-yes" });
    await user.click(yesOption);

    expect(mockSetResponses).toHaveBeenCalledWith({
      ...responsesWithoutOtherPositions,
      hasOtherPositions: "yes",
      otherPositionHours: "",
    });
  });

  it("renders with proper accessibility labels and IDs", () => {
    renderEligibility();

    // Check that radio buttons have proper IDs
    expect(
      screen.getByRole("radio", { name: /yes - canadian citizen/i })
    ).toHaveAttribute("value", "citizen");
    expect(
      screen.getByRole("radio", { name: /yes - permanent resident/i })
    ).toHaveAttribute("value", "pr");
    expect(
      screen.getByRole("radio", { name: /no - international student/i })
    ).toHaveAttribute("value", "international");
  });
});
