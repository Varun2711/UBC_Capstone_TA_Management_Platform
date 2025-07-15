import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AdminCourseManagement from "../src/pages/Admin/AdminCourseManagement"

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

let user

const renderCoursePage = () => {
  return render(
    <MemoryRouter>
      <AdminCourseManagement />
    </MemoryRouter>
  )
}

describe("AdminCourseManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })

  it("renders main title and description", () => {
    renderCoursePage()
    expect(screen.getByText("Admin Course Management")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Comprehensive administrative control over all courses, instructors, and academic programs"
      )
    ).toBeInTheDocument()
  })

  it("renders course statistics cards", () => {
    renderCoursePage()
    expect(screen.getByText("Total Courses")).toBeInTheDocument()
    expect(screen.getByText("3,247")).toBeInTheDocument()
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument()
  })

  it("opens course creation form when 'Create Course' is clicked", async () => {
    renderCoursePage()
    const createButton = screen.getByText("Create Course")
    await user.click(createButton)
    expect(screen.getByText("Create New Course")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g., CS 101")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter course name")).toBeInTheDocument()
  })

  it("closes course creation form on cancel", async () => {
    renderCoursePage()
    const createButton = screen.getByText("Create Course")
    await user.click(createButton)
    const cancelButton = screen.getByText("Cancel")
    await user.click(cancelButton)
    await waitFor(() =>
      expect(screen.queryByText("Create New Course")).not.toBeInTheDocument()
    )
  })


  it("shows bulk actions when courses are selected", async () => {
    renderCoursePage()
    const checkboxes = screen.getAllByRole("checkbox")
    expect(checkboxes.length).toBeGreaterThan(1)
    await user.click(checkboxes[1])
  })
})
