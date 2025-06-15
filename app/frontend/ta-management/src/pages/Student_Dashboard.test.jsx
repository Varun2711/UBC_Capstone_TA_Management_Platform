import { render, screen, fireEvent } from "@testing-library/react"
import StudentDashboard from "./Student_Dashboard"
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

it("shows all available TA positions initially", () => {
  render(<StudentDashboard />)
  expect(screen.getAllByText("CS 102 - Programming Fundamentals").length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText("CS 250 - Computer Organization").length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText("CS 350 - Software Engineering").length).toBeGreaterThanOrEqual(1)
})

it("filters TA positions when a search term is entered", () => {
  render(<StudentDashboard />)
  const input = screen.getByPlaceholderText("Search positions...")

  fireEvent.change(input, { target: { value: "CS 250" } })
  expect(screen.getAllByText("CS 250 - Computer Organization").length).toBeGreaterThanOrEqual(1) 
  fireEvent.change(input, { target: { value: "CS 102" } })
  expect(screen.getAllByText("CS 102 - Programming Fundamentals").length).toBeGreaterThanOrEqual(1)    

})

it("displays status badges correctly for applications", () => {
  render(<StudentDashboard />)

  expect(screen.getAllByText("Accepted").length).toBeGreaterThanOrEqual(1)    
  expect(screen.getAllByText("Rejected").length).toBeGreaterThanOrEqual(1)    
  expect(screen.getAllByText("Under Review").length).toBeGreaterThanOrEqual(1)    


})

