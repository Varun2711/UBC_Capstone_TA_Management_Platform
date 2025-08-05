// SupportingDocuments.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SupportingDocuments from "@/components/application-form/SupportingDocuments";

// Mock AddDocuments to inspect props and simulate callback
vi.mock("@/components/application-form/AddDocuments", () => ({
  default: ({
    documents,
    setDocuments,
    maxFiles,
    acceptedTypes,
    maxFileSize,
  }) => (
    <div data-testid="add-docs-mock">
      <p data-testid="docs-prop">{JSON.stringify(documents)}</p>
      <p data-testid="maxfiles-prop">{maxFiles}</p>
      <p data-testid="acceptedtypes-prop">{acceptedTypes}</p>
      <p data-testid="maxfilesize-prop">{maxFileSize}</p>
      <button
        data-testid="trigger-setdocs"
        onClick={() => setDocuments([{ id: 2 }])}
      >
        Trigger setDocuments
      </button>
    </div>
  ),
}));

describe("SupportingDocuments Component", () => {
  const mockDocs = [
    {
      id: 1,
      name: "file.pdf",
      size: 1024,
      type: "application/pdf",
      uploadDate: "2025-07-22T00:00:00Z",
      file: new File([""], "file.pdf", { type: "application/pdf" }),
    },
  ];
  const setDocsMock = vi.fn();

  beforeEach(() => {
    setDocsMock.mockClear();
  });

  it("renders the section header", () => {
    render(<SupportingDocuments documents={[]} setDocuments={setDocsMock} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Add Supporting Documents"
    );
  });

  it("renders the descriptive paragraph", () => {
    render(<SupportingDocuments documents={[]} setDocuments={setDocsMock} />);
    expect(
      screen.getByText(
        /Upload relevant documents such as transcripts, certificates, or other supporting materials\./
      )
    ).toBeInTheDocument();
  });

  it("passes maxFiles, acceptedTypes, and maxFileSize to AddDocuments", () => {
    render(<SupportingDocuments documents={[]} setDocuments={setDocsMock} />);
    expect(screen.getByTestId("maxfiles-prop")).toHaveTextContent("3");
    expect(screen.getByTestId("acceptedtypes-prop")).toHaveTextContent(
      ".pdf, .doc, .docx, .jpg, .jpeg, .png"
    );
    expect(screen.getByTestId("maxfilesize-prop")).toHaveTextContent(
      (10 * 1024 * 1024).toString()
    );
  });

  it("forwards documents prop to AddDocuments", () => {
    render(
      <SupportingDocuments documents={mockDocs} setDocuments={setDocsMock} />
    );
    expect(screen.getByTestId("docs-prop")).toHaveTextContent(
      JSON.stringify(mockDocs)
    );
  });

  it("invokes setDocuments when AddDocuments triggers callback", () => {
    render(<SupportingDocuments documents={[]} setDocuments={setDocsMock} />);
    fireEvent.click(screen.getByTestId("trigger-setdocs"));
    expect(setDocsMock).toHaveBeenCalledWith([{ id: 2 }]);
  });
});
