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
import * as jobLogic from "@/logic/job-management"; // add this at the top with your other imports
import userEvent from "@testing-library/user-event";

const mockJobPostings = [
  {
    posting_id: 1,
    title: "TA for CSC101",
    status: "open",
    department: { name: "Computer Science" },
    term: { code: "Fall 2025" },
    form_template_id: null,
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
    // 1) Spy on window.confirm
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    // 2) Render and wait for the card
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    const deleteButton = screen.getByTestId("delete-button-1");
    expect(deleteButton).toBeInTheDocument();

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

    // wait for the existing card to render
    await screen.findByText("TA for CSC101");

    // find and click the Create button
    const createButton = screen.getByRole("button", {
      name: /create job posting/i,
    });
    expect(createButton).toBeInTheDocument();
    fireEvent.click(createButton);

    // dialog title should appear
    expect(
      await screen.findByText("Create New Job Posting")
    ).toBeInTheDocument();
  });

  test("shows error message and retry button when initial fetch fails", async () => {
    // 1) Make fetchAllInitialData throw once
    vi.spyOn(jobLogic, "fetchAllInitialData").mockRejectedValueOnce(
      new Error("API Failure")
    );

    // 2) Render
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    // 3) Wait for the error banner
    const errorBanner = await screen.findByText(/error:/i);
    expect(errorBanner).toHaveTextContent("Error: API Failure");

    // 4) “Try Again” button is visible
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  test("displays templates in the Templates tab", async () => {
    // Override the default mock for this one render
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

    // Render
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );

    // 1) Wait for the job card to confirm initial data load
    await screen.findByText("TA for CSC101");

    // 2) Find the <div role="tablist"> and within it grab the Templates <button role="tab">
    const tablist = screen.getByRole("tablist");
    const templatesTab = within(tablist).getByRole("tab", {
      name: /templates/i,
    });

    // 3) Click it (await so Radix state updates)
    await user.click(templatesTab);

    // 4) Now wait for our mocked template's name
    expect(await screen.findByText("Default TA Form")).toBeInTheDocument();
  });
  test("filters job postings based on search term", async () => {
    const user = userEvent.setup();

    // 1) Render and wait for the card
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    // 2) Grab the search input and type something that doesn't match
    const searchInput = screen.getByPlaceholderText(/search job postings/i);
    await user.clear(searchInput);
    await user.type(searchInput, "xyz-not-found");

    // 3) Expect the original card to disappear...
    expect(screen.queryByText("TA for CSC101")).not.toBeInTheDocument();

    // 4) ...and the empty‑state message to appear
    expect(
      await screen.findByText(/no job postings found/i)
    ).toBeInTheDocument();
  });
  test("duplicates a template and refreshes the templates list", async () => {
    const user = userEvent.setup();

    // 1) Mock initial data: one job posting and one template
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

    // 2) Spy on duplicateTemplate and fetchTemplates
    const duplicateSpy = vi.spyOn(jobLogic, "duplicateTemplate");
    const fetchTemplatesSpy = vi.spyOn(jobLogic, "fetchTemplates");

    // 3) Render and wait for initial load
    render(
      <MemoryRouter>
        <JobManagementPage />
      </MemoryRouter>
    );
    await screen.findByText("TA for CSC101");

    // 4) Switch to the Templates tab
    const tablist = screen.getByRole("tablist");
    const templatesTab = within(tablist).getByRole("tab", {
      name: /templates/i,
    });
    await user.click(templatesTab);

    await screen.findByText("Default TA Form");

    const dupButton = screen.getByTestId("duplicate-button-42");
    await user.click(dupButton);

    expect(duplicateSpy).toHaveBeenCalledWith(42);

    // 8) And assert that after duplication, we re-fetch the templates
    expect(fetchTemplatesSpy).toHaveBeenCalled();

    // Cleanup spies
    duplicateSpy.mockRestore();
    fetchTemplatesSpy.mockRestore();
  });
});
