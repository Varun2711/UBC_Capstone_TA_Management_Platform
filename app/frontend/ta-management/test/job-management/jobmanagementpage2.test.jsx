// tests/jobmanagementpage.test.jsx
import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import JobManagementPage from "@/components/job-posting-management/JobManagementPage";
import * as jobLogic from "@/logic/job-management";
import userEvent from "@testing-library/user-event";

const mockJobPostings = [
  {
    posting_id: 1,
    title: "TA for CSC101",
    status: "open",
    department: { name: "Computer Science" },
    term: { code: "Fall 2025" },
    form_template_id: 11,
    deadline_date: "2025-09-01T00:00:00Z",
  },
];

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("@/logic/job-management", () => ({
  fetchAllInitialData: vi.fn(() =>
    Promise.resolve({
      jobPostings: mockJobPostings,
      templates: [],
      departments: [],
      terms: [],
    })
  ),
  deleteJobPosting: vi.fn(() => Promise.resolve({ success: true })),
  handleApiError: vi.fn((e) => e?.message || "Error loading data"),
  fetchJobPostings: vi.fn(() => Promise.resolve(mockJobPostings)),
  fetchTemplates: vi.fn(() => Promise.resolve([])),
  duplicateTemplate: vi.fn(() => Promise.resolve({})),
}));

describe("JobManagementPage", () => {
  test("renders job postings correctly", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    // Wait for job title to show
    expect(await screen.findByText("TA for CSC101")).toBeInTheDocument();
  });

  test("opens job posting dialog when clicking Create Job Posting", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    // Wait for initial render
    await screen.findByText("TA for CSC101");

    const button = screen.getByRole("button", { name: /create job posting/i });
    expect(button).toBeInTheDocument();

    button.click();

    // Check for dialog title
    expect(
      await screen.findByText("Create New Job Posting")
    ).toBeInTheDocument();
  });

  test("deletes job posting when delete is confirmed", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    const deleteButton = screen.getByTestId("delete-button-1");
    fireEvent.click(deleteButton);
    expect(confirmSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test("opens job posting dialog when clicking Create Job Posting", async () => {
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await screen.findByText("TA for CSC101");

    const createButton = screen.getByRole("button", {
      name: /create job posting/i,
    });
    fireEvent.click(createButton);
    expect(
      await screen.findByText("Create New Job Posting")
    ).toBeInTheDocument();
  });

  test("shows error message and retry button when initial fetch fails", async () => {
    vi.spyOn(jobLogic, "fetchAllInitialData").mockRejectedValueOnce(
      new Error("API Failure")
    );

    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    const errorBanner = await screen.findByText(/error:/i);
    expect(errorBanner).toHaveTextContent("Error: API Failure");
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  test("displays templates in the Templates tab", async () => {
    jobLogic.fetchAllInitialData.mockResolvedValueOnce({
      jobPostings: mockJobPostings,
      templates: [
        {
          template_id: 42,
          name: "Default TA Form",
          description: "The campus‑wide default template",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
      ],
      departments: [],
      terms: [],
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await screen.findByText("TA for CSC101");
    const tablist = screen.getByRole("tablist");
    const templatesTab = within(tablist).getByRole("tab", {
      name: /templates/i,
    });
    await user.click(templatesTab);
    expect(await screen.findByText("Default TA Form")).toBeInTheDocument();
  });

  test("filters job postings based on search term", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    const searchInput = screen.getByPlaceholderText(/search job postings/i);
    await user.clear(searchInput);
    await user.type(searchInput, "xyz-not-found");

    expect(screen.queryByText("TA for CSC101")).not.toBeInTheDocument();
    expect(
      await screen.findByText(/no job postings found/i)
    ).toBeInTheDocument();
  });

  test("duplicates a template and refreshes the templates list", async () => {
    jobLogic.fetchAllInitialData.mockResolvedValueOnce({
      jobPostings: mockJobPostings,
      templates: [
        {
          template_id: 42,
          name: "Default TA Form",
          description: "The campus‑wide default template",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
      ],
      departments: [],
      terms: [],
    });

    const duplicateSpy = vi.spyOn(jobLogic, "duplicateTemplate");
    const fetchTemplatesSpy = vi.spyOn(jobLogic, "fetchTemplates");

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    const tablist = screen.getByRole("tablist");
    const templatesTab = within(tablist).getByRole("tab", {
      name: /templates/i,
    });
    await user.click(templatesTab);
    await screen.findByText("Default TA Form");

    const dupButton = screen.getByTestId("duplicate-button-42");
    await user.click(dupButton);
    expect(duplicateSpy).toHaveBeenCalledWith(42);
    expect(fetchTemplatesSpy).toHaveBeenCalled();

    duplicateSpy.mockRestore();
    fetchTemplatesSpy.mockRestore();
  });

  // New tests:
  test("opens edit job posting dialog when clicking edit button", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");
    const editButton = screen.getByTitle("Edit Job Posting");
    await user.click(editButton);
    expect(await screen.findByText("Edit Job Posting")).toBeInTheDocument();
  });

  test("shows confirmation dialog when assigning template to open job posting", async () => {
    // Mock scrollIntoView to avoid JSDOM issues
    Element.prototype.scrollIntoView = vi.fn();

    jobLogic.fetchAllInitialData.mockResolvedValueOnce({
      jobPostings: mockJobPostings,
      templates: [
        {
          template_id: 10,
          name: "Temp1",
          description: "",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
        {
          template_id: 11,
          name: "Temp2",
          description: "",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
      ],
      departments: [],
      terms: [],
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await screen.findByText("TA for CSC101");

    // Find the template select trigger within the job posting card
    const jobCard = screen
      .getByText("TA for CSC101")
      .closest('[class*="hover:shadow-md"]');
    const selectTrigger = within(jobCard).getByRole("combobox");
    await user.click(selectTrigger);

    // Wait for dropdown to open and select a different template (Temp1)
    const option = await screen.findByRole("option", { name: "Temp1" });
    await user.click(option);

    // Check that confirmation dialog appears
    expect(
      await screen.findByText(/Confirm Template Change/i)
    ).toBeInTheDocument();
  });

  test("closes confirmation dialog when canceling template assignment", async () => {
    // Mock scrollIntoView to avoid JSDOM issues
    Element.prototype.scrollIntoView = vi.fn();

    jobLogic.fetchAllInitialData.mockResolvedValueOnce({
      jobPostings: mockJobPostings,
      templates: [
        {
          template_id: 10,
          name: "Temp1",
          description: "",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
        {
          template_id: 11,
          name: "Temp2",
          description: "",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
          created_by: { name: "System" },
        },
      ],
      departments: [],
      terms: [],
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    await screen.findByText("TA for CSC101");

    // Find the template select trigger within the job posting card
    const jobCard = screen
      .getByText("TA for CSC101")
      .closest('[class*="hover:shadow-md"]');
    const selectTrigger = within(jobCard).getByRole("combobox");
    await user.click(selectTrigger);

    // Wait for dropdown to open and find the option
    const option = await screen.findByRole("option", { name: "Temp1" });
    await user.click(option);

    // Check that confirmation dialog appears
    expect(
      await screen.findByText(/Confirm Template Change/i)
    ).toBeInTheDocument();

    // Click cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Verify dialog is closed
    await waitFor(() =>
      expect(
        screen.queryByText(/Confirm Template Change/i)
      ).not.toBeInTheDocument()
    );
  });

  test("shows 'Create Your First Job Posting' button in empty state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");
    const searchInput = screen.getByPlaceholderText(/search job postings/i);
    await user.clear(searchInput);
    await user.type(searchInput, "none");
    expect(
      await screen.findByText(/No job postings found/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Create Your First Job Posting/i,
      })
    ).toBeInTheDocument();
  });
});
