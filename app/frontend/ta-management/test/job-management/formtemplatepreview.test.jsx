// tests/FormTemplatePreview.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import FormTemplatePreview from "@/components/job-posting-management/FormTemplatePreview";

vi.mock("@/logic/job-management", () => ({
  fetchTemplateById: vi.fn(() =>
    Promise.resolve({
      name: "Test Template",
      description: "Preview test",
      sections: [
        {
          section_id: 1,
          name: "Section A",
          description: "Intro section",
          is_required: true,
          order: 1,
          questions: [
            {
              question_id: 101,
              question_text: "What is your name?",
              question_type: "text",
              field_name: "q1",
              is_required: true,
              help_text: "Enter full name",
              order: 1,
            },
          ],
        },
      ],
    })
  ),
  handleApiError: vi.fn(() => "Error loading template"),
}));

describe("FormTemplatePreview", () => {
  test("renders loading state", () => {
    render(<FormTemplatePreview templateId={1} />);
    expect(screen.getByText(/loading template preview/i)).toBeInTheDocument();
  });

  test("renders template content after fetch", async () => {
    render(<FormTemplatePreview templateId={1} />);
    await waitFor(() => {
      expect(screen.getAllByText("Section A")[0]).toBeInTheDocument();
      expect(screen.getByText("What is your name?")).toBeInTheDocument();
    });
  });

  test("renders error UI if fetch fails", async () => {
    const { fetchTemplateById } = await import("@/logic/job-management");
    fetchTemplateById.mockRejectedValueOnce(new Error("API failed"));
    render(<FormTemplatePreview templateId={2} />);
    await waitFor(() => {
      expect(screen.getByText(/error loading template/i)).toBeInTheDocument();
    });
  });

  test("renders custom question types correctly", async () => {
    render(<FormTemplatePreview templateId={1} />);
    expect(await screen.findByText("What is your name?")).toBeInTheDocument();
    expect(screen.getByText(/preview - text field/i)).toBeInTheDocument();
  });

  test("handles missing template prop and templateId", () => {
    render(<FormTemplatePreview />);
    expect(screen.getByText(/no template data available/i)).toBeInTheDocument();
  });
});

test("renders all custom sections passed in the template", () => {
  const mockTemplate = {
    name: "Test Template",
    sections: [
      {
        id: 1,
        name: "Section A", //
        questions: [],
      },
      {
        id: 2,
        name: "Section B",
        questions: [],
      },
    ],
  };

  render(<FormTemplatePreview template={mockTemplate} />);

  expect(screen.getAllByText("Section A")[0]).toBeInTheDocument();
  expect(screen.getAllByText("Section B")[0]).toBeInTheDocument();
});

test("renders custom question types correctly", () => {
  const mockTemplate = {
    name: "Test Template",
    sections: [
      {
        id: 1,
        name: "Basic Info",
        questions: [
          {
            question_id: 1,
            question_text: "What is your name?",
            question_type: "text",
            field_name: "name",
            is_required: true,
            help_text: "Enter your full legal name.",
            options: [],
            validation_rules: {},
          },
        ],
      },
    ],
  };

  render(<FormTemplatePreview template={mockTemplate} />);

  // Assert question text
  expect(
    screen.getByText((content) =>
      content.toLowerCase().includes("what is your name")
    )
  ).toBeInTheDocument();

  // Assert required asterisk
  expect(screen.getByText("*")).toBeInTheDocument();

  // Assert help text
  expect(screen.getByText("Enter your full legal name.")).toBeInTheDocument();

  // Assert preview badge

  expect(screen.getByText("(name)")).toBeInTheDocument();
});
