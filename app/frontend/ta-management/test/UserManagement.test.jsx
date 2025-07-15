import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import UserManagement from "../src/pages/UserManagement"

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}))

let user

const renderUserMgmtPage = () => {
  return render(
    <MemoryRouter>
      <UserManagement />
    </MemoryRouter>
  )
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
  })


  it("renders user statistics cards", () => {
    renderUserMgmtPage()
    expect(screen.getByText("Total Users")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Instructors")).toBeInTheDocument()
    expect(screen.getByText("Admins")).toBeInTheDocument()
    expect(screen.getByText("1,247")).toBeInTheDocument()
  })

  it("renders and filters users based on search query", async () => {
    renderUserMgmtPage()
    const searchInput = screen.getByPlaceholderText("Search users by name or email...")
    await user.type(searchInput, "Sarah")
    expect(searchInput).toHaveValue("Sarah")
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
  })


  it("displays role and status badges correctly", () => {
    renderUserMgmtPage()
    expect(screen.getAllByText("Admin")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Student")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Instructor")[0]).toBeInTheDocument()
    expect(screen.getAllByText("TA Scheduler")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0)
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("handles export button click", async () => {
    global.alert = vi.fn()
    renderUserMgmtPage()
    const exportBtn = screen.getByText("Export")
    await user.click(exportBtn)
  })

  it("supports basic keyboard navigation", async () => {
    renderUserMgmtPage()
    const searchInput = screen.getByPlaceholderText("Search users by name or email...")
    await user.click(searchInput)
    await user.keyboard("{Tab}")
    await user.keyboard("{Enter}")
    await user.keyboard("{Escape}")
  })
})
