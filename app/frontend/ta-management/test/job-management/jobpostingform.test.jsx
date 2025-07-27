// tests/jobpostingform.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import JobPostingForm from "@/components/job-posting-management/JobPostingForm";
import * as jobLogic from "@/logic/job-management";

// Mock logic layer functions
vi.mock("@/logic/job-management", () => ({
  createJobPosting: vi.fn(() => Promise.resolve({ id: "new-id" })),
  updateJobPosting: vi.fn(() => Promise.resolve({ id: "updated-id" })),
  validateJobPostingData: vi.fn(() => ({ isValid: true, errors: {} })),
  handleApiError: vi.fn(() => "Error"),
  fetchSchedulerProfile: vi.fn(() => Promise.resolve({ id: "u1" })),
}));

describe("JobPostingForm", () => {
  const defaultProps = {
    departments: [{ id: 1, name: "Dept1" }],
    terms: [{ id: 2, code: "Term1", description: "Desc1" }],
    templates: [{ template_id: 3, name: "Template1", is_active: true }],
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders form fields and buttons", () => {
    render(<JobPostingForm {...defaultProps} />);
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create job posting/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  test("calls onCancel when Cancel clicked", () => {
    render(<JobPostingForm {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  test("displays validation errors when form is invalid", async () => {
    jobLogic.validateJobPostingData.mockReturnValueOnce({
      isValid: false,
      errors: {
        title: "Required",
        description: "Required",
        department_id: "Required",
        term_id: "Required",
        deadline_date: "Required",
      },
    });
    render(<JobPostingForm {...defaultProps} />);
    fireEvent.click(
      screen.getByRole("button", { name: /create job posting/i })
    );
    expect(await screen.findAllByText("Required")).toHaveLength(5);
  });

  test("submits create job posting and calls onSave", async () => {
    render(<JobPostingForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/job title/i), {
      target: { value: "My Job" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Desc" },
    });
    fireEvent.change(screen.getByLabelText(/department/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/term/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/application deadline/i), {
      target: { value: "2025-07-25" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /create job posting/i })
    );
    await waitFor(() => {
      expect(jobLogic.createJobPosting).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Job",
          description: "Desc",
          department_id: "1",
          term_id: "2",
          deadline_date: "2025-07-25",
        })
      );
      expect(defaultProps.onSave).toHaveBeenCalledWith({ id: "new-id" });
    });
  });

  test("populates fields and updates job posting when jobPosting prop is provided", async () => {
    const jobPosting = {
      posting_id: 5,
      title: "Up Job",
      description: "Desc",
      requirements: "Req",
      department: { id: 1, name: "Dept1" },
      term: { id: 2, code: "Term1" },
      form_template_id: "3",
      post_date: "2025-07-17",
      deadline_date: "2025-07-20",
      status: "open",
      created_by_id: "u2",
    };
    render(<JobPostingForm {...defaultProps} jobPosting={jobPosting} />);

    // Check fields are populated
    expect(await screen.findByDisplayValue("Up Job")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Req")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dept1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Term1 - Desc1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Template1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2025-07-17")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2025-07-20")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update job posting/i })
    ).toBeInTheDocument();

    // Submit update
    fireEvent.click(
      screen.getByRole("button", { name: /update job posting/i })
    );
    await waitFor(() => {
      expect(jobLogic.updateJobPosting).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          title: "Up Job",
        })
      );
      expect(defaultProps.onSave).toHaveBeenCalledWith({ id: "updated-id" });
    });
  });

  // New tests
  test("disables Open status option when no application form template is selected", () => {
    render(<JobPostingForm {...defaultProps} />);
    const statusSelect = screen.getByLabelText(/status/i);
    const openOption = statusSelect.querySelector('option[value="open"]');
    expect(openOption).toBeDisabled();
  });

  test("shows Post Job button text and warning when changing status to open on draft job posting", async () => {
    const jobPostingDraft = {
      posting_id: 1,
      title: "",
      description: "",
      requirements: "",
      department: { id: 1, name: "Dept1" },
      term: { id: 2, code: "Term1" },
      form_template_id: "3",
      post_date: "2025-07-17",
      deadline_date: "2025-07-20",
      status: "draft",
      created_by_id: "u1",
    };
    render(<JobPostingForm {...defaultProps} jobPosting={jobPostingDraft} />);
    const statusSelect = await screen.findByLabelText(/status/i);
    await waitFor(() => {
      const openOption = statusSelect.querySelector('option[value="open"]');
      expect(openOption).not.toBeDisabled();
    });
    fireEvent.change(statusSelect, { target: { value: "open" } });
    expect(
      screen.getByRole("button", { name: /post job/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This will make the job visible to applicants\./i)
    ).toBeInTheDocument();
  });

  test("shows Close Job button text and warning when changing status to closed on open job posting", async () => {
    const jobPostingOpen = {
      posting_id: 2,
      title: "",
      description: "",
      requirements: "",
      department: { id: 1, name: "Dept1" },
      term: { id: 2, code: "Term1" },
      form_template_id: "3",
      post_date: "2025-07-17",
      deadline_date: "2025-07-20",
      status: "open",
      created_by_id: "u1",
    };
    render(<JobPostingForm {...defaultProps} jobPosting={jobPostingOpen} />);
    const statusSelect = await screen.findByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: "closed" } });
    expect(
      screen.getByRole("button", { name: /close job/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This job post will not accept any further applications\./i
      )
    ).toBeInTheDocument();
  });

  test("displays caution message when changing application form template on open job posting", async () => {
    const templatesMultiple = [
      { template_id: 3, name: "Template1", is_active: true },
      { template_id: 4, name: "Template2", is_active: true },
    ];
    const jobPostingOpen = {
      posting_id: 3,
      title: "",
      description: "",
      requirements: "",
      department: { id: 1, name: "Dept1" },
      term: { id: 2, code: "Term1" },
      form_template_id: "3",
      post_date: "2025-07-17",
      deadline_date: "2025-07-20",
      status: "open",
      created_by_id: "u1",
    };
    render(
      <JobPostingForm
        {...defaultProps}
        templates={templatesMultiple}
        jobPosting={jobPostingOpen}
      />
    );
    // wait for second template option to appear
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /Template2/i })
      ).toBeInTheDocument();
    });
    const templateSelect = screen.getByLabelText(/application form template/i);
    fireEvent.change(templateSelect, { target: { value: "4" } });
    expect(
      screen.getByText(/Caution: Changing Application Form Template/i)
    ).toBeInTheDocument();
  });
});
