// test/components/DocumentsSection.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

// ─── Mocks ───────────────────────────────────────────────────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/logic/student-view-applications", () => ({
  fetchApplicationDocuments: vi.fn(),
  downloadDocument: vi.fn(),
}));

import {
  fetchApplicationDocuments,
  downloadDocument,
} from "@/logic/student-view-applications";

import DocumentsSection from "@/components/student-view-application/DocumentsSection";

// ─── Test Data ───────────────────────────────────────────────
const mockDocuments = [
  {
    document_id: "doc1",
    file_name: "resume.pdf",
    file_size: 2048576, // 2MB
    uploaded_at: "2025-06-12T10:30:00Z",
  },
  {
    document_id: "doc2",
    file_name: "transcript.pdf",
    file_size: 1024000, // ~1MB
    uploaded_at: "2025-06-10T14:20:00Z",
  },
];

// ─── Tests ───────────────────────────────────────────────────
describe("DocumentsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful mock
    fetchApplicationDocuments.mockResolvedValue(mockDocuments);
    downloadDocument.mockResolvedValue();
  });

  it("shows loading spinner initially", () => {
    fetchApplicationDocuments.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DocumentsSection applicationId="42" />);

    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
    expect(screen.getByText("Supporting Documents")).toBeInTheDocument();
  });

  it("displays no documents message when no documents exist", async () => {
    fetchApplicationDocuments.mockResolvedValue([]);

    render(<DocumentsSection applicationId="42" />);

    await waitFor(() => {
      expect(
        screen.getByText("No documents were submitted with this application.")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Supporting Documents")).toBeInTheDocument();
  });

  it("renders document list with correct information", async () => {
    render(<DocumentsSection applicationId="42" />);

    await waitFor(() => {
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });

    expect(screen.getByText("transcript.pdf")).toBeInTheDocument();

    // Check that download buttons are present
    const downloadButtons = screen.getAllByText("Download");
    expect(downloadButtons).toHaveLength(2);
  });

  it("handles document download successfully", async () => {
    const user = userEvent.setup();
    render(<DocumentsSection applicationId="42" />);

    await waitFor(() => {
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText("Download");
    await user.click(downloadButtons[0]);

    expect(downloadDocument).toHaveBeenCalledWith("doc1", "resume.pdf");
  });

  it("shows downloading state and disables button during download", async () => {
    const user = userEvent.setup();
    let resolveDownload;
    downloadDocument.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDownload = resolve;
        })
    );

    render(<DocumentsSection applicationId="42" />);

    await waitFor(() => {
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText("Download");
    await user.click(downloadButtons[0]);

    // Should show downloading state
    await waitFor(() => {
      expect(screen.getByText("Downloading...")).toBeInTheDocument();
    });

    // Button should be disabled
    const downloadingButton = screen
      .getByText("Downloading...")
      .closest("button");
    expect(downloadingButton).toBeDisabled();

    // Resolve the download
    resolveDownload();

    await waitFor(() => {
      expect(screen.queryByText("Downloading...")).not.toBeInTheDocument();
    });
  });

  it("handles download errors with alert", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    downloadDocument.mockRejectedValue(new Error("Download failed"));

    render(<DocumentsSection applicationId="42" />);

    await waitFor(() => {
      expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText("Download");
    await user.click(downloadButtons[0]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Failed to download document. Please try again."
      );
    });

    alertSpy.mockRestore();
  });

  it("does not fetch documents when applicationId is not provided", () => {
    render(<DocumentsSection applicationId={null} />);

    expect(fetchApplicationDocuments).not.toHaveBeenCalled();
    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
  });
});
