import { render, screen, fireEvent } from "@testing-library/react"
import StudentDashboard from "@/pages/Student_Dashboard"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"

it("renders the welcome message with the student's name", () => {
  render(<StudentDashboard />)
  expect(screen.getByText(/Welcome back, Sarah Johnson!/i)).toBeInTheDocument()
})

it("displays the correct number of total applications", () => {
  render(<StudentDashboard />)
  const elements = screen.getAllByText("3")
  expect(elements.length).toBeGreaterThanOrEqual(1) // 3 total applications
})


it("displays status badges correctly for applications", () => {
  render(<StudentDashboard />)

  expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(1)    
  expect(screen.getAllByText("Under Review").length).toBeGreaterThanOrEqual(1)    


})

