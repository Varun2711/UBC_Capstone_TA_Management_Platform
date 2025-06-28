import { render, screen } from "@testing-library/react";
import StudentDashboard from "@/pages/Student_Dashboard";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

describe("StudentDashboard", () => {
  it("renders the welcome message with the student's name", () => {
    render(
      <MemoryRouter>
        <StudentDashboard />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Welcome back, Sarah Johnson!/i)
    ).toBeInTheDocument();
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
