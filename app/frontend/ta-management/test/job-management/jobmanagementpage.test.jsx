import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import JobManagementPage from "@/components/job-posting-management/JobManagementPage";

// Mock navigation
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock logic
const mockJobs = [
  {
    id: 1,
    title: "TA for CSC101",
    department: { name: "Computer Science" },
    term: { name: "Fall 2025" },
    status: "Open",
    template: { name: "General Template" },
  },
];

vi.mock("@/logic/job-management", () => ({
  fetchAllInitialData: vi.fn(() =>
    Promise.resolve({
      jobPostings: [
        {
          id: 1,
          title: "TA for CSC101",
          status: "Open",
          department: { name: "Computer Science" },
          term: { name: "Fall 2025" },
          template: { name: "Standard TA Form" },
        },
      ],
      templates: [],
      departments: [],
      terms: [],
    })
  ),
  deleteJobPosting: vi.fn(() => Promise.resolve({ success: true })),
  handleApiError: vi.fn(() => "Error loading data"),
}));

describe("JobManagementPage", () => {
  test("renders correctly with title and button", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Manage job postings/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("TA for CSC101")).toBeInTheDocument();
    });
  });

  test("fetches and displays job postings", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TA for CSC101")).toBeInTheDocument();
      expect(screen.getByText("Fall 2025")).toBeInTheDocument();
      expect(screen.getByText("Computer Science")).toBeInTheDocument();
    });
  });

  test("shows error state when API fails", async () => {
    const { fetchAllJobs } = await import("@/logic/job-management");
    fetchAllJobs.mockRejectedValueOnce(new Error("API failed"));

    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading job postings/i)
      ).toBeInTheDocument();
    });
  });

  test("clicking New Posting navigates to form", async () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/New Posting/i));
    expect(navigate).toHaveBeenCalledWith("/jobs/new");
  });

  test("opens delete confirmation dialog", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TA for CSC101")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete posting");
    fireEvent.click(deleteButtons[0]);

    expect(
      screen.getByText(/Are you sure you want to delete/i)
    ).toBeInTheDocument();
  });

  test("confirms delete and removes job", async () => {
    const { deleteJobPosting } = await import("@/logic/job-management");

    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TA for CSC101")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle("Delete posting")[0]);

    const confirmButton = await screen.findByText(/Confirm Delete/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteJobPosting).toHaveBeenCalledWith(1);
    });
  });
});
