import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Selections from "@/components/application-form/Selections";
import { validateSelections } from "@/components/application-form/Selections";

// Mock selections object for testing
const mockSelections = {
  positionType: "",
  winterTerm: "",
  workload: "",
  disciplineRanking: {
    rank1: "",
    rank2: "",
    rank3: "",
  },
};

const mockSetSelections = vi.fn();

// Mock RankSelect component since it's not the focus of this test
vi.mock("@/components/ui/RankSelect", () => ({
  default: ({ label, rankKey, onRankChange }) => (
    <div data-testid={`rank-select-${rankKey}`}>
      <label>{label}</label>
      <select onChange={(e) => onRankChange(rankKey, e.target.value)}>
        <option value="">Select...</option>
        <option value="COSC">COSC</option>
        <option value="MATH">MATH</option>
        <option value="PHYS">PHYS</option>
      </select>
    </div>
  ),
}));

const renderSelections = (selections = mockSelections, errors = {}) => {
  return render(
    <Selections
      selections={selections}
      setSelections={mockSetSelections}
      errors={errors}
    />
  );
};

describe("Selections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all selection fields", () => {
    renderSelections();

    expect(
      screen.getByText(/which position are you applying for/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/which of the following terms/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preferred maximum average hourly workload/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/rank your top 3 preferred disciplines/i)
    ).toBeInTheDocument();
  });

  it("displays all position type options", () => {
    renderSelections();

    expect(
      screen.getByLabelText(/undergraduate teaching assistant/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/graduate teaching assistant 2/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/graduate teaching assistant 1/i)
    ).toBeInTheDocument();
  });

  it("calls setSelections when position type is selected", async () => {
    renderSelections();
    const user = userEvent.setup();

    const undergradOption = screen.getByLabelText(
      /undergraduate teaching assistant/i
    );
    await user.click(undergradOption);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      positionType: "Undergraduate Teaching Assistant",
    });
  });

  it("displays workload options", () => {
    renderSelections();

    expect(screen.getByLabelText("6 hours")).toBeInTheDocument();
    expect(screen.getByLabelText("12 hours")).toBeInTheDocument();
  });

  it("calls setSelections when workload is selected", async () => {
    renderSelections();
    const user = userEvent.setup();

    const sixHoursOption = screen.getByLabelText("6 hours");
    await user.click(sixHoursOption);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      workload: "6 hours",
    });
  });

  it("renders rank select components", () => {
    renderSelections();

    expect(screen.getByTestId("rank-select-rank1")).toBeInTheDocument();
    expect(screen.getByTestId("rank-select-rank2")).toBeInTheDocument();
    expect(screen.getByTestId("rank-select-rank3")).toBeInTheDocument();
  });

  it("displays validation errors when provided", () => {
    const errors = {
      positionType: "Please select the position you're applying for",
      workload: "Please select your preferred workload",
    };
    renderSelections(mockSelections, errors);

    expect(
      screen.getByText("Please select the position you're applying for")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please select your preferred workload")
    ).toBeInTheDocument();
  });
});

describe("validateSelections", () => {
  it("returns error when ranks are missing", () => {
    const incompleteRanking = { rank1: "COSC", rank2: "", rank3: "" };
    const result = validateSelections(incompleteRanking);

    expect(result).toBe("Please choose a discipline for all three ranks.");
  });

  it("returns error when ranks are duplicated", () => {
    const duplicateRanking = { rank1: "COSC", rank2: "COSC", rank3: "MATH" };
    const result = validateSelections(duplicateRanking);

    expect(result).toBe("Each rank must be a different discipline.");
  });

  it("returns null when ranking is valid", () => {
    const validRanking = { rank1: "COSC", rank2: "MATH", rank3: "PHYS" };
    const result = validateSelections(validRanking);

    expect(result).toBeNull();
  });
});
