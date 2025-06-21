import { render, screen, fireEvent } from "@testing-library/react"
import ProfilePage from "@/pages/ProfilePage"
import { vi } from "vitest"

// Mock AppSidebar to avoid rendering its internals
vi.mock("../components/student-dashboard-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}))

describe("ProfilePage", () => {
  it("renders the profile header", () => {
    render(<ProfilePage />)
    expect(screen.getByText("My Profile")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Manage your personal information and TA application details"
      )
    ).toBeInTheDocument()
  })

  it("renders student name and email", () => {
    render(<ProfilePage />)
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
    expect(screen.getByText("sarah.johnson@university.edu")).toBeInTheDocument()
  })

  it("enters edit mode when Edit button is clicked", () => {
    render(<ProfilePage />)
    const editButton = screen.getByRole("button", { name: /edit profile/i })
    fireEvent.click(editButton)
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  it("updates the name input when edited", () => {
    render(<ProfilePage />)
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }))
    const nameInput = screen.getByLabelText("Full Name")
    fireEvent.change(nameInput, { target: { value: "John Doe" } })
    expect(nameInput.value).toBe("John Doe")
  })

  it("cancels changes and reverts to original profile", () => {
    render(<ProfilePage />)
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }))
    const nameInput = screen.getByLabelText("Full Name")
    fireEvent.change(nameInput, { target: { value: "John Doe" } })
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
  })

  it("saves changes and exits edit mode", () => {
    render(<ProfilePage />)
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }))
    const nameInput = screen.getByLabelText("Full Name")
    fireEvent.change(nameInput, { target: { value: "John Doe" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument()
  })
})
