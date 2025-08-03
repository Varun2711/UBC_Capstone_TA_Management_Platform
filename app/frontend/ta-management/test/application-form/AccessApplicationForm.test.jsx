// test/application-form/ApplicationFormAccess.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import ApplicationForm from "@/pages/Student/ApplicationForm";
import * as studentAppLogic from "@/logic/student-applications";

// Partially mock react-router-dom, preserving other exports
vi.mock("react-router-dom", () => {
  const actual = vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ postingId: "123" }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/apply/123", search: "", state: null }),
  };
});

// Mock student application logic module
vi.mock("@/logic/student-applications", () => ({
  fetchStudentProfile: vi.fn(() =>
    Promise.resolve({
      name: "John Doe",
      email: "john@example.com",
      avatar: "avatar.png",
      studentId: "12345678",
      major: "Computer Science",
      year: "Undergraduate",
      academicInfo: {
        expectedGraduation: "May 2025",
        degreeStart: "2021",
        yearStanding: "4",
      },
      experience: [],
      technicalSkills: [],
      softSkills: [],
      coursePreference: [],
      availability: [],
    })
  ),
  fetchJobPostingDetails: vi.fn(() =>
    Promise.resolve({
      title: "TA Position",
      form_template_id: null,
      term_id: null,
      status: "open",
      deadline_date: "2099-12-31",
    })
  ),
  fetchTemplateDetails: vi.fn(() => Promise.resolve({ sections: [] })),
  checkApplicationFields: vi.fn(() => ({})),
  fetchTermDetails: vi.fn(() => Promise.resolve([])),
  handleNextStep: vi.fn(),
  handlePreviousStep: vi.fn(),
  handleFormSubmission: vi.fn(() => Promise.resolve()),
  validateApplicationFormAccess: vi.fn(), // Overridden per test
}));

describe("ApplicationForm Access Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Access Denied when job posting not found", async () => {
    studentAppLogic.validateApplicationFormAccess.mockResolvedValueOnce({
      canAccess: false,
      reason: "Job posting not found",
      message: "The job posting you're trying to access does not exist.",
    });

    await act(async () => {
      render(<ApplicationForm />);
    });

    const heading = await screen.findByText("Access Denied");
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText(
        "The job posting you're trying to access does not exist."
      )
    ).toBeInTheDocument();
  });

  it("shows Access Denied when job posting is not open", async () => {
    studentAppLogic.validateApplicationFormAccess.mockResolvedValueOnce({
      canAccess: false,
      reason: "Job posting is not open",
      message: "This job posting is no longer accepting applications.",
    });

    await act(async () => {
      render(<ApplicationForm />);
    });

    const heading = await screen.findByText("Access Denied");
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("This job posting is no longer accepting applications.")
    ).toBeInTheDocument();
  });

  it("shows Access Denied when application deadline has passed", async () => {
    studentAppLogic.validateApplicationFormAccess.mockResolvedValueOnce({
      canAccess: false,
      reason: "Application deadline has passed",
      message: "The application deadline for this position has passed.",
    });

    await act(async () => {
      render(<ApplicationForm />);
    });

    const heading = await screen.findByText("Access Denied");
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("The application deadline for this position has passed.")
    ).toBeInTheDocument();
  });

  it("shows Access Denied when user has already applied", async () => {
    studentAppLogic.validateApplicationFormAccess.mockResolvedValueOnce({
      canAccess: false,
      reason: "Already applied",
      message: "You have already submitted an application for this position.",
      existingApplication: { application_id: 42 },
    });

    await act(async () => {
      render(<ApplicationForm />);
    });

    const heading = await screen.findByText("Access Denied");
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText(
        "You have already submitted an application for this position."
      )
    ).toBeInTheDocument();
  });

  it("renders the application form when access is granted", async () => {
    studentAppLogic.validateApplicationFormAccess.mockResolvedValueOnce({
      canAccess: true,
      jobPosting: { title: "TA Position" },
    });

    await act(async () => {
      render(<ApplicationForm />);
    });

    const heading = await screen.findByRole("heading", {
      name: /TA Application/i,
    });
    expect(heading).toBeInTheDocument();
    expect(studentAppLogic.validateApplicationFormAccess).toHaveBeenCalledWith(
      "123"
    );
  });
});
