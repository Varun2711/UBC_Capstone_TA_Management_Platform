import { render, screen } from "@testing-library/react";
import StudentDashboard from "@/pages/Student_Dashboard";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, BrowserRouter } from "react-router-dom";
import App from "@/App";

// ✅ Mock profile module
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

beforeEach(() => {
  localStorage.clear();
});

describe("StudentDashboard", () => {
  test("logs in and redirects to student dashboard", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), "sarahj@mail.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/Welcome back, Sarah!/i)).toBeInTheDocument()
    );
  });

  it("displays status badges correctly for applications", () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(0);
    expect(screen.getAllByText("Under Review").length).toBeGreaterThanOrEqual(
      0
    );
  });
});
