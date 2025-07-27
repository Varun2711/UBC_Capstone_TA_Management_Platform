// test/application-form/ApplicationForm.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { act } from "react";

// silence the console log during tests
vi.spyOn(console, "log").mockImplementation(() => {});

// ─── Mocks ───────────────────────────────────────────────────
// react-router-dom hooks
vi.mock("react-router-dom", () => ({
  useParams: () => ({ postingId: "123" }),
  useNavigate: () => vi.fn(),
}));

// UI component mocks
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }) => <div>{children}</div>,
  SidebarTrigger: () => <button>Toggle Sidebar</button>,
}));
vi.mock("@/components/student-dashboard-sidebar", () => ({
  AppSidebar: ({ name }) => <div>AppSidebar {name}</div>,
}));
vi.mock("@/components/application-form/PersonalDetails", () => ({
  __esModule: true,
  default: () => <div>Personal Details Component</div>,
}));
vi.mock("@/components/application-form/ReviewSection", () => ({
  __esModule: true,
  default: () => <div>Review Section Component</div>,
}));
vi.mock("@/components/application-form/SupportingDocuments", () => ({
  __esModule: true,
  default: () => <div>Supporting Documents Component</div>,
}));
vi.mock("@/components/application-form/DynamicFormRenderer", () => ({
  __esModule: true,
  default: () => <div>Dynamic Form Renderer Component</div>,
}));
vi.mock("@/components/ProgressBar", () => ({
  __esModule: true,
  default: ({ step, totalSteps, stepLabel }) => (
    <div>
      ProgressBar: {step}/{totalSteps} - {stepLabel}
    </div>
  ),
}));

// Application logic spies all declared _inside_ the factory:
vi.mock("@/logic/student-applications", () => {
  return {
    fetchStudentProfile: vi.fn(() =>
      Promise.resolve({
        name: "John Doe",
        email: "john@example.com",
        avatar: "avatar.png",
      })
    ),
    fetchJobPostingDetails: vi.fn(() =>
      Promise.resolve({
        title: "TA Position",
        form_template_id: null,
        term_id: null,
      })
    ),
    fetchTemplateDetails: vi.fn(() => Promise.resolve({ sections: [] })),
    checkApplicationFields: vi.fn(() => ({})),
    fetchTermDetails: vi.fn(() => Promise.resolve([])),
    handleNextStep: vi.fn(),
    handlePreviousStep: vi.fn(),
    handleFormSubmission: vi.fn(() => Promise.resolve()),
  };
});

// now import _after_ your mocks:
import * as studentAppLogic from "@/logic/student-applications";
import ApplicationForm from "@/pages/Student/ApplicationForm";

// ─── Test Suite ───────────────────────────────────────────────
describe("ApplicationForm", () => {
  it("shows loading spinner initially", async () => {
    act(() => {
      render(<ApplicationForm />);
    });

    await waitFor(() =>
      expect(
        screen.getByText("Loading application form...")
      ).toBeInTheDocument()
    );
  });

  it("renders form heading and progress bar after data loads", async () => {
    act(() => {
      render(<ApplicationForm />);
    });
    expect(screen.getByText("Loading application form...")).toBeInTheDocument();

    const heading = await screen.findByRole("heading", {
      name: /TA Application/i,
    });
    expect(heading).toHaveTextContent("TA Application");
    expect(screen.getByText(/ProgressBar: 1\/5 /)).toBeInTheDocument();
  });

  it("renders dynamic section when a template is provided", async () => {
    studentAppLogic.fetchJobPostingDetails.mockResolvedValueOnce({
      title: "TA Position",
      form_template_id: "tpl1",
      term_id: null,
    });
    studentAppLogic.fetchTemplateDetails.mockResolvedValueOnce({
      sections: [{ section_id: "sec1", name: "Custom Section", order: 1 }],
    });

    render(<ApplicationForm />);
    expect(
      await screen.findByText("Dynamic Form Renderer Component")
    ).toBeInTheDocument();
  });

  it("calls handleNextStep and handlePreviousStep on navigation", async () => {
    studentAppLogic.handleNextStep.mockImplementation(
      (currentStep, setCurrentStep) => {
        setCurrentStep(2);
        return true;
      }
    );
    studentAppLogic.handlePreviousStep.mockImplementation(
      (currentStep, setCurrentStep, resetValidation) => {
        setCurrentStep(2);
        resetValidation();
        return true;
      }
    );

    render(<ApplicationForm />);
    await screen.findByRole("heading", { name: /TA Application/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(studentAppLogic.handleNextStep).toHaveBeenCalled();

    const backBtn = await screen.findByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);
    expect(studentAppLogic.handlePreviousStep).toHaveBeenCalled();
  });

  it("calls handleFormSubmission on submit and shows success modal", async () => {
    studentAppLogic.handleNextStep.mockImplementation(
      (currentStep, setCurrentStep) => {
        setCurrentStep((prev) => prev + 1);
        return true;
      }
    );
    studentAppLogic.handleFormSubmission.mockImplementation(
      ({ setSubmissionStatus }) => {
        setSubmissionStatus("success");
        return Promise.resolve();
      }
    );

    render(<ApplicationForm />);
    await screen.findByRole("heading", { name: /TA Application/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    fireEvent.click(
      screen.getByRole("button", { name: /Submit Application/i })
    );
    expect(studentAppLogic.handleFormSubmission).toHaveBeenCalled();
    expect(
      await screen.findByText(/Application Submitted Successfully!/i)
    ).toBeInTheDocument();
  });

  it("shows error modal when submission fails", async () => {
    // 1) Make Next actually advance the step by 1 each time
    studentAppLogic.handleNextStep.mockImplementation(
      (currentStep, setCurrentStep) => {
        setCurrentStep((prev) => prev + 1);
        return true;
      }
    );

    // 2) Mock a failing submission
    studentAppLogic.handleFormSubmission.mockImplementation(
      ({ setSubmissionStatus }) => {
        setSubmissionStatus("error");
        return Promise.resolve();
      }
    );

    render(<ApplicationForm />);
    await screen.findByRole("heading", { name: /TA Application/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await screen.findByRole("button", { name: /Next/i });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    fireEvent.click(
      screen.getByRole("button", { name: /Submit Application/i })
    );
    // your assertions
    expect(studentAppLogic.handleFormSubmission).toHaveBeenCalled();
    expect(await screen.findByText(/Submission Failed/i)).toBeInTheDocument();
  });
});
