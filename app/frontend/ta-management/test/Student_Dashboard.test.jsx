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
        studentId: "SJ2024001",
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

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              application_id: 1,
              termSelection: { code: "2025 Term 1" },
              status: "submitted",
              applied_at: "2024-01-15",
              posting: { title: "TA Position", posting_id: 101 },
            },
          ],
        })
      ),
    }),
  },
}));


describe("StudentDashboard", () => {

  // ✅ Set a fake token so second useEffect runs correctly
  beforeEach(() => {
    sessionStorage.setItem("accessToken", "mock-token");
  });

  it("renders student dashboard with user info", async () => {
    render(
      <MemoryRouter> {/* 🔄 Wrapping here is ESSENTIAL */}
        <StudentDashboard />
      </MemoryRouter>
    );

    // ✅ Wait for the loading spinner to disappear
    await waitFor(() =>
      expect(
        screen.queryByText(/Loading dashboard.../i)
      ).not.toBeInTheDocument()
    );

    // ✅ Now check for user data
    expect(screen.getByText(/Welcome back, Sarah!/i)).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("GPA: 3.85")).toBeInTheDocument();
  });
});
