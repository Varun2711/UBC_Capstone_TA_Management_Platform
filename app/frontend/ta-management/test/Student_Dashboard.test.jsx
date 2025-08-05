import { render, screen, waitFor } from "@testing-library/react";
import StudentDashboard from "@/pages/Student_Dashboard";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ✅ Mock getProfile() to resolve immediately
vi.mock("@/logic/student-profile", () => ({
  getProfile: vi.fn(() =>
    Promise.resolve({
      id: 1,
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarahj@mail.com",
      student_info: {
        student_number: "SJ2024001",
        phone: "+1 (555) 123-4567",
        program: "Computer Science",
        study_level: "Graduate Student",
      },
      student_profile: {
        gpa: "3.85",
        minor: "Math",
      },
      avatar: "/placeholder.svg",
    })
  ),
}));

// ✅ Mock fetchStudentApplications
vi.mock("@/logic/student-applications", () => ({
  fetchStudentApplications: vi.fn(() =>
    Promise.resolve([
      {
        application_id: 1,
        termSelection: { code: "2025 Term 1" },
        status: "submitted",
        applied_at: "2024-01-15",
        posting: { 
          title: "Teaching Assistant - CMPS Summer 2025", 
          posting_id: 101,
          description: "TA position for Computer Science",
          department: { name: "Computer Science" }
        },
      },
      {
        application_id: 2,
        termSelection: { code: "2025 Term 1" },
        status: "under_review",
        applied_at: "2024-01-10",
        posting: { 
          title: "Teaching Assistant - MATH 2025", 
          posting_id: 102,
          description: "TA position for Mathematics",
          department: { name: "Mathematics" }
        },
      },
    ])
  ),
}));

// ✅ Mock axios for the new API endpoints
vi.mock("axios", () => ({
  default: {
    get: vi.fn((url) => {
      // Mock different responses based on URL
      if (url.includes("/api/ajp/jobpostings/active/")) {
        return Promise.resolve({
          data: [
            {
              posting_id: 1,
              title: "TA - Computer Science 101",
              department: { name: "Computer Science" },
              deadline_date: "2024-02-15",
            },
            {
              posting_id: 2,
              title: "TA - Mathematics 201",
              department: { name: "Mathematics" },
              deadline_date: "2024-02-20",
            },
          ],
        });
      }
      
      if (url.includes("/api/allocations/offers/pending_offers/")) {
        return Promise.resolve({
          data: [
            {
              offer_id: 1,
              position_summary: "TA Position for CMPS 101",
              response_deadline: "2024-02-01",
            },
          ],
        });
      }
      
      if (url.includes("/api/allocations/assignments/my_assignments/")) {
        return Promise.resolve({
          data: [
            {
              assignment_id: 1,
              is_active: true,
              course: {
                course_number: "CMPS 101",
                course_name: "Introduction to Computer Science",
              },
              weekly_hours: 10,
              assigned_date: "2024-01-01",
            },
          ],
        });
      }
      
      // Default response
      return Promise.resolve({ data: [] });
    }),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: [] })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

describe("StudentDashboard", () => {
  beforeEach(() => {
    // ✅ Set a fake token so API calls work
    sessionStorage.setItem("accessToken", "mock-token");
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders student dashboard with user info", async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // ✅ Wait for the loading spinner to disappear
    await waitFor(() =>
      expect(
        screen.queryByText(/Loading your dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Check for welcome message and user data
    expect(screen.getByText(/Welcome back, Sarah!/i)).toBeInTheDocument();
    // Use getAllByText for potentially non-unique text
    expect(screen.getAllByText("Computer Science").length).toBeGreaterThan(0);
    expect(screen.getByText("GPA: 3.85")).toBeInTheDocument();
    expect(screen.getByText("Graduate Student")).toBeInTheDocument();
  });

  it("displays the correct quick stats cards", async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/Loading your dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Check for the three stats cards
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Pending Offers")).toBeInTheDocument();
    expect(screen.getByText("Open Postings")).toBeInTheDocument();
    
    // ✅ Verify Active Positions card is NOT present
    expect(screen.queryByText("Active Positions")).not.toBeInTheDocument();
  });

  it("shows recent activity with applications and offers", async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/Loading your dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Check for Recent Activity section using getAllByText
    const recentActivityElements = screen.getAllByText("Recent Activity");
    expect(recentActivityElements.length).toBeGreaterThan(0);

    // ✅ Check for pending offers using a flexible matcher
    const pendingOffersText = screen.getByText((content, element) => {
      const hasText = (node) =>
        node.textContent?.match(/You have.*pending offer/i);
      const nodeHasText = hasText(element);
      const childrenDontHaveText = Array.from(element?.children || []).every(
        (child) => !hasText(child)
      );
      return nodeHasText && childrenDontHaveText;
    });
    expect(pendingOffersText).toBeInTheDocument();

    // ✅ Check for specific pending offer details
    expect(screen.getByText("TA Position for CMPS 101")).toBeInTheDocument();

    // ✅ Check for recent applications
    expect(screen.getByText("Recent Applications")).toBeInTheDocument();
    expect(screen.getByText("Teaching Assistant - CMPS Summer 2025")).toBeInTheDocument();
    expect(screen.getByText("Teaching Assistant - MATH 2025")).toBeInTheDocument();

    // ✅ Check for current positions (active assignments)
    expect(screen.getByText("Current Positions")).toBeInTheDocument();
    expect(screen.getByText("CMPS 101 Introduction to Computer Science")).toBeInTheDocument();
  });

  it("displays latest job postings section", async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/Loading your dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Check for Latest Job Postings section
    expect(screen.getAllByText("Latest Job Postings").length).toBeGreaterThan(0);
    expect(screen.getByText("TA - Computer Science 101")).toBeInTheDocument();
    expect(screen.getByText("TA - Mathematics 201")).toBeInTheDocument();
  });

  it("shows profile completion progress", async () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/Loading your dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Check for profile overview section
    expect(screen.getAllByText("Profile Overview").length).toBeGreaterThan(0);
    expect(screen.getByText("Profile Completion")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument(); // Should be 100% with all fields filled
  });

  it("handles error state correctly", async () => {
    // ✅ Import the module to get a handle on the mocked function
    const { getProfile } = await import("@/logic/student-profile");

    // ✅ Mock getProfile to reject for this specific test
    vi.mocked(getProfile).mockRejectedValue(new Error("Network error"));

    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    // ✅ Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/Could not load your profile/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });
});