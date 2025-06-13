import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MockDashboard from "@/pages/MockDashboard";

describe("MockDashboard", () => {
  it("renders the welcome message", () => {
    render(<MockDashboard />);
    const heading = screen.getByText(/welcome to the dashboard/i);
    expect(heading).toBeInTheDocument();
  });
});