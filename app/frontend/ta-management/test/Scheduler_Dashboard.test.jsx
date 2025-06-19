import { vi, beforeAll, describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import TASchedulerDashboard from "@/pages/Scheduler_Dashboard"
import { MemoryRouter } from "react-router-dom"

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <TASchedulerDashboard />
    </MemoryRouter>
  )
}

describe("TASchedulerDashboard", () => {
  it("renders dashboard header and welcome message", () => {
    renderWithRouter()

    expect(screen.getByText('Dashboard', {
      selector: 'span[role="link"][aria-disabled="true"][aria-current="page"]'
    })).toBeInTheDocument()

    expect(screen.getByRole("heading", { name: /welcome back, admin/i })).toBeInTheDocument()
    expect(
      screen.getByText(/here's what's happening with your ta scheduling system today\./i)
    ).toBeInTheDocument()
  })


  it("renders upcoming tasks with task names", () => {
    renderWithRouter()

    expect(screen.getByText("Review pending applications")).toBeInTheDocument()
    expect(screen.getByText("Assign instructors to new courses")).toBeInTheDocument()
    expect(screen.getByText("Post remaining TA positions")).toBeInTheDocument()
  })

  it("renders department overview", () => {
    renderWithRouter()

    expect(screen.getByText("Computer Science")).toBeInTheDocument()
    expect(screen.getByText("Mathematics")).toBeInTheDocument()
    expect(screen.getByText("Physics")).toBeInTheDocument()
    expect(screen.getByText("Engineering")).toBeInTheDocument()
  })

  it("renders system status section", () => {
    renderWithRouter()

    expect(screen.getByText("System Status & Management Tools")).toBeInTheDocument()
    expect(screen.getByText("Application Period")).toBeInTheDocument()
    expect(screen.getByText("Current Term")).toBeInTheDocument()
    expect(screen.getByText("Active Users")).toBeInTheDocument()
    expect(screen.getByText("Data Last Updated")).toBeInTheDocument()
  })
})
