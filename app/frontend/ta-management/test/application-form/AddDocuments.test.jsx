/* eslint-disable import/first */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddDocuments from "@/components/application-form/AddDocuments";

/* ────────────────────────────────
 *  Mocks
 * ──────────────────────────────── */
vi.mock("lucide-react", () => ({
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  FileText: ({ className }) => (
    <div data-testid="file-text-icon" className={className}>
      FileText
    </div>
  ),
  Image: ({ className }) => (
    <div data-testid="image-icon" className={className}>
      Image
    </div>
  ),
  FileSpreadsheet: ({ className }) => (
    <div data-testid="spreadsheet-icon" className={className}>
      FileSpreadsheet
    </div>
  ),
  File: ({ className }) => (
    <div data-testid="file-icon" className={className}>
      File
    </div>
  ),
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className, title, variant, size, ...rest }) => (
    <button
      onClick={onClick}
      className={className}
      title={title}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

/* ────────────────────────────────
 *  Test helpers
 * ──────────────────────────────── */
const mockDocuments = [
  {
    id: 1,
    name: "resume.pdf",
    size: 1024 * 1024, // 1 MB
    type: "application/pdf",
    file: new File(["content"], "resume.pdf", { type: "application/pdf" }),
    uploadDate: "2025-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "transcript.jpg",
    size: 2 * 1024 * 1024, // 2 MB
    type: "image/jpeg",
    file: new File(["content"], "transcript.jpg", { type: "image/jpeg" }),
    uploadDate: "2025-01-02T00:00:00.000Z",
  },
];

const mockSetDocuments = vi.fn();

const createMockFile = (name, size, type) => {
  const f = new File(["content"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

const renderAddDocuments = (props = {}) => {
  const defaultProps = {
    documents: [],
    setDocuments: mockSetDocuments,
    maxFiles: 5,
    acceptedTypes: ".pdf,doc,docx,jpg,jpeg,png,xls,xlsx",
    maxFileSize: 10 * 1024 * 1024,
  };

  return render(<AddDocuments {...defaultProps} {...props} />);
};

/* ────────────────────────────────
 *  Tests
 * ──────────────────────────────── */
describe("AddDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
    global.window.open = vi.fn();
  });

  it("renders upload area with helper text", () => {
    renderAddDocuments();

    expect(
      screen.getByText("Drop files here or click to upload")
    ).toBeInTheDocument();
    expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
    expect(screen.getByText(/Max file size: 10 MB/)).toBeInTheDocument();
  });

  it("shows the upload icon", () => {
    renderAddDocuments();
    expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
  });

  it("shows limit-reached state", () => {
    renderAddDocuments({ documents: mockDocuments, maxFiles: 2 });
    expect(screen.getByText("Maximum 2 files reached")).toBeInTheDocument();
    const fileInput = document.getElementById("file-upload");
    expect(fileInput).toBeDisabled();
  });

  it("lists uploaded documents with counts", () => {
    renderAddDocuments({ documents: mockDocuments });
    expect(screen.getByText("Uploaded Documents (2)")).toBeInTheDocument();
    expect(screen.getByText("2/5 files")).toBeInTheDocument();
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("transcript.jpg")).toBeInTheDocument();
  });

  it("renders correct file icons", () => {
    renderAddDocuments({ documents: mockDocuments });
    expect(screen.getByTestId("file-text-icon")).toBeInTheDocument(); // PDF
    expect(screen.getByTestId("image-icon")).toBeInTheDocument(); // JPG
  });

  it("renders file sizes", () => {
    renderAddDocuments({ documents: mockDocuments });
    expect(screen.getByText(/1 MB/)).toBeInTheDocument();
    expect(screen.getByText(/2 MB/)).toBeInTheDocument();
  });

  it("removes a document", async () => {
    renderAddDocuments({ documents: mockDocuments });
    const user = userEvent.setup();
    const trashIcon = screen.getAllByTestId("trash-icon")[0];

    await user.click(trashIcon.closest("button"));
    expect(mockSetDocuments).toHaveBeenCalledWith([mockDocuments[1]]);
  });

  it("hides 'Add More Documents' when at max", () => {
    renderAddDocuments({ documents: mockDocuments, maxFiles: 2 });
    expect(screen.queryByText(/Add More Documents/)).not.toBeInTheDocument();
  });

  it("validates file input size", async () => {
    renderAddDocuments({ maxFileSize: 1024 }); // 1 KB
    const user = userEvent.setup();
    const fileInput = document.getElementById("file-upload");
    await user.upload(
      fileInput,
      createMockFile("big.pdf", 2048, "application/pdf")
    );

    await waitFor(() =>
      expect(
        screen.getByText(/File size must be less than/)
      ).toBeInTheDocument()
    );
  });

  it("prevents exceeding max files", async () => {
    const fourDocs = [
      ...mockDocuments,
      { ...mockDocuments[0], id: 3, name: "doc3.pdf" },
      { ...mockDocuments[0], id: 4, name: "doc4.pdf" },
    ];
    renderAddDocuments({ documents: fourDocs, maxFiles: 4 });

    const user = userEvent.setup();
    const fileInput = document.getElementById("file-upload");
    await user.upload(
      fileInput,
      createMockFile("extra.pdf", 512, "application/pdf")
    );

    expect(screen.getByText("Maximum 4 files reached")).toBeInTheDocument();
  });

  it("handles drag-over / drag-leave CSS", async () => {
    renderAddDocuments();
    const dropZone = screen.getByTestId("drop-zone");

    fireEvent.dragOver(dropZone);
    await waitFor(() => {
      expect(dropZone).toHaveClass("border-blue-500");
      expect(dropZone).toHaveClass("bg-blue-50");
    });

    fireEvent.dragLeave(dropZone);
    await waitFor(() => {
      expect(dropZone).not.toHaveClass("border-blue-500");
    });
  });

  it("handles dropping a file", () => {
    renderAddDocuments();
    const dropZone = screen
      .getByText("Drop files here or click to upload")
      .closest("div");

    const file = createMockFile("dropped.pdf", 1024, "application/pdf");
    const dropEvent = new Event("drop", { bubbles: true });
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: { files: [file] },
    });

    fireEvent(dropZone, dropEvent);
    expect(mockSetDocuments).toHaveBeenCalled();
  });

  it("shows supported format string correctly", () => {
    renderAddDocuments({ acceptedTypes: ".pdf,jpg,png" });
    expect(
      screen.getByText("Supported formats: PDF,JPG,PNG")
    ).toBeInTheDocument();
  });

  it("falls back to generic file icon for unknown types", () => {
    const unknownDoc = { ...mockDocuments[0], id: 999, name: "weird.xyz" };
    renderAddDocuments({ documents: [unknownDoc] });
    expect(screen.getByTestId("file-icon")).toBeInTheDocument();
  });
});
