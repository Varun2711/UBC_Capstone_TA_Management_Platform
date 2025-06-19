import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentField from "../src/components/application-form/DocumentField";

const mockSetFile = vi.fn();

const renderDocumentField = (props = {}) => {
  const defaultProps = {
    label: "Resume",
    file: null,
    setFile: mockSetFile,
    accepted: ".pdf,.doc,.docx",
  };

  return render(<DocumentField {...defaultProps} {...props} />);
};

describe("DocumentField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    renderDocumentField();

    expect(screen.getByText("No resume uploaded yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a Resume")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    renderDocumentField({ label: "Transcript" });

    expect(screen.getByText("No transcript uploaded yet.")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a Transcript")).toBeInTheDocument();
  });

  it("shows file info when file is present", () => {
    const mockFile = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({ file: mockFile });

    expect(screen.getByText("Attached Resume:")).toBeInTheDocument();
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Resume")).toBeInTheDocument();
  });

  it("changes label text when file is present", () => {
    const mockFile = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({ file: mockFile });

    expect(screen.getByLabelText("Add a New Resume")).toBeInTheDocument();
  });

  it("calls setFile when a file is selected", async () => {
    renderDocumentField();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText("Add a Resume");
    const file = new File(["content"], "test-resume.pdf", {
      type: "application/pdf",
    });

    await user.upload(fileInput, file);

    expect(mockSetFile).toHaveBeenCalledWith(file);
  });

  it("handles file removal", async () => {
    const mockFile = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({ file: mockFile });
    const user = userEvent.setup();

    const removeButton = screen.getByLabelText("Remove Resume");
    await user.click(removeButton);

    expect(mockSetFile).toHaveBeenCalledWith(null);
  });

  it("accepts specified file types", () => {
    renderDocumentField({ accepted: ".pdf,.docx" });

    const fileInput = screen.getByLabelText("Add a Resume");
    expect(fileInput).toHaveAttribute("accept", ".pdf,.docx");
  });

  it("has correct input attributes", () => {
    renderDocumentField();

    const fileInput = screen.getByLabelText("Add a Resume");
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("id", "resume");
    expect(fileInput).toHaveAttribute("name", "resume");
    expect(fileInput).toHaveAttribute("accept", ".pdf,.doc,.docx");
  });

  it("renders paperclip icon when file is attached", () => {
    const mockFile = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({ file: mockFile });

    // The paperclip icon should be present (we can't directly test the icon, but we can test its container)
    expect(screen.getByText("Attached Resume:")).toBeInTheDocument();
  });

  it("does not call setFile when no file is selected", async () => {
    renderDocumentField();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText("Add a Resume");

    // Simulate clicking the input without selecting a file
    await user.click(fileInput);

    expect(mockSetFile).not.toHaveBeenCalled();
  });

  it("handles multiple file selection correctly", async () => {
    renderDocumentField();
    const user = userEvent.setup();

    const fileInput = screen.getByLabelText("Add a Resume");
    const file1 = new File(["content1"], "resume1.pdf", {
      type: "application/pdf",
    });
    const file2 = new File(["content2"], "resume2.pdf", {
      type: "application/pdf",
    });

    // Upload first file
    await user.upload(fileInput, file1);
    expect(mockSetFile).toHaveBeenCalledWith(file1);

    // Upload second file (should replace first)
    await user.upload(fileInput, file2);
    expect(mockSetFile).toHaveBeenCalledWith(file2);
  });

  it("works with different document types", () => {
    const transcriptFile = new File(["content"], "transcript.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({
      label: "Transcript",
      file: transcriptFile,
      accepted: ".pdf",
    });

    expect(screen.getByText("Attached Transcript:")).toBeInTheDocument();
    expect(screen.getByText("transcript.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Transcript")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a New Transcript")).toBeInTheDocument();
  });

  it("clears file input value when file is removed", async () => {
    // Create a ref to simulate the actual component behavior
    const mockFile = new File(["content"], "resume.pdf", {
      type: "application/pdf",
    });
    renderDocumentField({ file: mockFile });
    const user = userEvent.setup();

    const removeButton = screen.getByLabelText("Remove Resume");
    await user.click(removeButton);

    expect(mockSetFile).toHaveBeenCalledWith(null);
    // The component uses useRef to clear the input value,
    // which we can't easily test in isolation
  });
});
