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
  default: ({ label, rankKey, onRankChange, currentRankings, options }) => (
    <div data-testid={`rank-select-${rankKey}`}>
      <label>{label}</label>
      <select
        value={currentRankings[rankKey] || ""}
        onChange={(e) => onRankChange(rankKey, e.target.value)}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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
      positionType: "UTA",
    });
  });

  it("calls setSelections when graduate position types are selected", async () => {
    renderSelections();
    const user = userEvent.setup();

    const gta2Option = screen.getByLabelText(/graduate teaching assistant 2/i);
    await user.click(gta2Option);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      positionType: "GTA2",
    });

    const gta1Option = screen.getByLabelText(/graduate teaching assistant 1/i);
    await user.click(gta1Option);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      positionType: "GTA1",
    });
  });

  it("displays term selection options for W2025", () => {
    renderSelections();

    expect(screen.getByLabelText(/W2025 both terms/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        /W2025 Term 1 only.*September 01 - December 31 2025/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/W2025 Term 2 only.*January 1 - April 30.*2026/i)
    ).toBeInTheDocument();
  });

  it("calls setSelections when winter term is selected", async () => {
    renderSelections();
    const user = userEvent.setup();

    const bothTermsOption = screen.getByLabelText(/W2025 both terms/i);
    await user.click(bothTermsOption);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      winterTerm: "W2025 both terms",
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
      workload: "6",
    });

    const twelveHoursOption = screen.getByLabelText("12 hours");
    await user.click(twelveHoursOption);

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      workload: "12",
    });
  });

  it("renders rank select components with correct props", () => {
    renderSelections();

    expect(screen.getByTestId("rank-select-rank1")).toBeInTheDocument();
    expect(screen.getByTestId("rank-select-rank2")).toBeInTheDocument();
    expect(screen.getByTestId("rank-select-rank3")).toBeInTheDocument();

    // Check labels
    expect(screen.getByText("1st Choice")).toBeInTheDocument();
    expect(screen.getByText("2nd Choice")).toBeInTheDocument();
    expect(screen.getByText("3rd Choice")).toBeInTheDocument();
  });

  it("calls setSelections when discipline ranking is updated", async () => {
    renderSelections();
    const user = userEvent.setup();

    const rank1Select = screen
      .getByTestId("rank-select-rank1")
      .querySelector("select");
    await user.selectOptions(rank1Select, "COSC");

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...mockSelections,
      disciplineRanking: {
        ...mockSelections.disciplineRanking,
        rank1: "COSC",
      },
    });
  });

  it("displays validation errors when provided", () => {
    const errors = {
      positionType: "Please select the position you're applying for",
      winterTerm: "Please select which term(s) you're applying for",
      workload: "Please select your preferred workload",
      disciplineRanking: "Please choose a discipline for all three ranks",
    };
    renderSelections(mockSelections, errors);

    expect(
      screen.getByText("Please select the position you're applying for")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please select which term(s) you're applying for")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please select your preferred workload")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please choose a discipline for all three ranks")
    ).toBeInTheDocument();
  });

  it("preserves existing selections when updating discipline ranking", async () => {
    const selectionsWithData = {
      ...mockSelections,
      positionType: "UTA",
      workload: "6",
      disciplineRanking: {
        rank1: "COSC",
        rank2: "",
        rank3: "",
      },
    };

    renderSelections(selectionsWithData);
    const user = userEvent.setup();

    const rank2Select = screen
      .getByTestId("rank-select-rank2")
      .querySelector("select");
    await user.selectOptions(rank2Select, "MATH");

    expect(mockSetSelections).toHaveBeenCalledWith({
      ...selectionsWithData,
      disciplineRanking: {
        rank1: "COSC",
        rank2: "MATH",
        rank3: "",
      },
    });
  });
});

describe("validateSelections", () => {
  it("returns error when ranks are missing", () => {
    const incompleteRanking = { rank1: "COSC", rank2: "", rank3: "" };
    const result = validateSelections(incompleteRanking);

    expect(result).toBe("Please choose a discipline for all three ranks.");
  });

  it("returns error when all ranks are empty", () => {
    const emptyRanking = { rank1: "", rank2: "", rank3: "" };
    const result = validateSelections(emptyRanking);

    expect(result).toBe("Please choose a discipline for all three ranks.");
  });

  it("returns error when ranks are duplicated", () => {
    const duplicateRanking = { rank1: "COSC", rank2: "COSC", rank3: "MATH" };
    const result = validateSelections(duplicateRanking);

    expect(result).toBe("Each rank must be a different discipline.");
  });

  it("returns error when all ranks are the same", () => {
    const allSameRanking = { rank1: "COSC", rank2: "COSC", rank3: "COSC" };
    const result = validateSelections(allSameRanking);

    expect(result).toBe("Each rank must be a different discipline.");
  });

  it("returns null when ranking is valid", () => {
    const validRanking = { rank1: "COSC", rank2: "MATH", rank3: "PHYS" };
    const result = validateSelections(validRanking);

    expect(result).toBeNull();
  });

  it("returns null when ranking uses all available disciplines", () => {
    const validRanking = { rank1: "ASTR", rank2: "DATA", rank3: "STAT" };
    const result = validateSelections(validRanking);

    expect(result).toBeNull();
  });

  it("handles undefined ranking object", () => {
    const result = validateSelections(undefined);
    expect(result).toBe("Please choose a discipline for all three ranks.");
  });

  it("handles null ranking object", () => {
    const result = validateSelections(null);
    expect(result).toBe("Please choose a discipline for all three ranks.");
  });
});
