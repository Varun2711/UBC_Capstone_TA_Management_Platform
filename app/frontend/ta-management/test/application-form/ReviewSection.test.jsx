// ReviewSection.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewSection from "@/components/application-form/ReviewSection";

describe("ReviewSection", () => {
  const baseProps = {
    student: {},
    selections: {},
    dynamicResponses: {},
    dynamicSections: [],
    fieldMapping: {},
    confirmation: false,
    setConfirmation: vi.fn(),
    documents: [],
    errors: {},
  };

  it("renders a dynamic text response", () => {
    const props = {
      ...baseProps,
      dynamicSections: [
        {
          section_id: "sec1",
          name: "Section 1",
          order: 1,
          questions: [
            {
              field_name: "foo",
              question_text: "Foo?",
              question_type: "text",
              is_required: true,
            },
          ],
        },
      ],
      dynamicResponses: { foo: "Bar" },
      fieldMapping: { foo: false },
    };

    render(<ReviewSection {...props} />);
    // Header
    expect(screen.getByText("Section 1")).toBeTruthy();
    // Question text
    expect(screen.getByText("Foo?")).toBeTruthy();
    // Required asterisk
    expect(screen.getByText("*")).toBeTruthy();
    // Response rendered
    expect(screen.getByText("Bar")).toBeTruthy();
  });

  it("renders a radio response with the correct label", () => {
    const props = {
      ...baseProps,
      dynamicSections: [
        {
          section_id: "sec2",
          name: "Choices",
          order: 1,
          questions: [
            {
              field_name: "choice",
              question_text: "Pick one:",
              question_type: "radio",
              is_required: false,
              options: [{ value: "a", label: "Option A" }],
            },
          ],
        },
      ],
      dynamicResponses: { choice: "a" },
      fieldMapping: { choice: false },
    };

    render(<ReviewSection {...props} />);
    expect(screen.getByText("Pick one:")).toBeTruthy();
    expect(screen.getByText("Option A")).toBeTruthy();
  });

  it("displays the study-permit note for international citizenship", () => {
    const props = {
      ...baseProps,
      dynamicSections: [
        {
          section_id: "sec3",
          name: "Citizenship",
          order: 1,
          questions: [
            {
              field_name: "citizenshipStatus",
              question_text: "Citizenship?",
              question_type: "text",
              is_required: false,
            },
          ],
        },
      ],
      dynamicResponses: { citizenshipStatus: "international" },
      fieldMapping: { citizenshipStatus: false },
    };

    render(<ReviewSection {...props} />);
    expect(
      screen.getByText(
        /Note: You must submit a valid study permit when requested./
      )
    ).toBeTruthy();
  });

  it("renders supporting documents list when provided", () => {
    const props = {
      ...baseProps,
      documents: [{ id: 1, name: "doc.pdf", size: 1 * 1024 * 1024 }],
    };

    render(<ReviewSection {...props} />);
    expect(screen.getByText("doc.pdf")).toBeTruthy();
    // size formatted to 1.00 MB
    expect(screen.getByText("(1.00 MB)")).toBeTruthy();
  });

  it("calls setConfirmation on checkbox change and shows error", () => {
    const setConfirm = vi.fn();
    const props = {
      ...baseProps,
      setConfirmation: setConfirm,
      errors: { confirmation: "You must confirm." },
    };

    render(<ReviewSection {...props} />);
    // Error message shown
    expect(screen.getByText("You must confirm.")).toBeTruthy();

    // Click the checkbox
    const checkbox = screen.getByRole("checkbox", {
      name: /I confirm that the information/,
    });
    fireEvent.click(checkbox);
    expect(setConfirm).toHaveBeenCalledWith(true);
  });
});
