// tests/FormBuilder.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import FormBuilder from "@/components/job-posting-management/FormBuilder";

// Mock dependencies
vi.mock("@/components/job-posting-management/QuestionDialog", () => ({
  __esModule: true,
  default: () => <div data-testid="question-dialog" />,
}));

vi.mock("@/logic/job-management", () => ({
  fetchTemplateById: vi.fn(() =>
    Promise.resolve({
      name: "Sample Template",
      description: "For testing",
      sections: [],
    })
  ),
  createTemplate: vi.fn(() => Promise.resolve({ id: 1 })),
  updateTemplate: vi.fn(() => Promise.resolve({ id: 1 })),
  validateTemplateData: vi.fn(() => ({ isValid: true, errors: {} })),
  handleApiError: vi.fn(() => "Mocked error"),
}));

describe("FormBuilder", () => {
  test("renders template creation UI", () => {
    render(<FormBuilder />);
    expect(
      screen.getByText("Create Application Form Template")
    ).toBeInTheDocument();
  });

  test("renders edit mode when templateId is passed", async () => {
    render(<FormBuilder templateId={1} />);
    expect(await screen.findByDisplayValue("Sample Template")).toBeDefined();
  });

  test("adds a new section on button click", () => {
    render(<FormBuilder />);
    const button = screen.getByRole("button", { name: /add section/i });
    fireEvent.click(button);
    expect(screen.getByDisplayValue("New Section")).toBeInTheDocument();
  });

  test("opens question dialog when add question is triggered", () => {
    render(<FormBuilder />);
    const addBtn = screen.getByRole("button", { name: /add section/i });
    fireEvent.click(addBtn);
    const addQBtn = screen.getByRole("button", { name: /add question/i });
    fireEvent.click(addQBtn);
    expect(screen.getByTestId("question-dialog")).toBeInTheDocument();
  });

  test("handles reorder section logic when move up is clicked", () => {
    render(<FormBuilder />);
    const addBtn = screen.getByRole("button", { name: /add section/i });
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    const upButtons = screen.getAllByRole("button", {
      name: /move section up/i,
    });
    fireEvent.click(upButtons[1]);
    expect(screen.getAllByDisplayValue("New Section").length).toBe(2);
  });
});

test("shows dialog when adding a question to a section", () => {
  render(<FormBuilder />);

  // First add a section
  fireEvent.click(screen.getByRole("button", { name: /add section/i }));

  // Now find the Add Question button inside that section
  const addQuestionBtn = screen.getByRole("button", { name: /add question/i });
  fireEvent.click(addQuestionBtn);

  // Expect dialog to appear
  expect(screen.getByTestId("question-dialog")).toBeInTheDocument();
});

test("saves template and triggers onSave", async () => {
  const onSave = vi.fn();

  render(<FormBuilder onSave={onSave} />);

  // Fill in the template name (required)
  fireEvent.change(screen.getByLabelText(/template name/i), {
    target: { value: "Test Template" },
  });

  // Add one section
  fireEvent.click(screen.getByRole("button", { name: /add section/i }));

  // Save the template
  fireEvent.click(screen.getByRole("button", { name: /save template/i }));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalled();
  });
});
