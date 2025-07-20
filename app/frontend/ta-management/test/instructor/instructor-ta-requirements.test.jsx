import { render, screen, waitFor , within} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { MemoryRouter } from "react-router-dom"

// Mock window.matchMedia BEFORE importing components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import InstructorTARequirements from "@/pages/Instructor/instructor-ta-requirements"

vi.mock("@/components/instructor/ta-requirements-modal", () => ({
  TARequirementsModal: (props) => (
    props.isOpen ? (
      <div data-testid="modal">
        <button onClick={props.onClose}>Close Modal</button>
        <button onClick={() => props.onSubmit(props.course?.id, { generalRequirements: ["Test requirement"] })}>
          Submit Requirements
        </button>
      </div>
    ) : null
  )
}))


// Mock logic functions
vi.mock("@/logic/instructor-ta-requirements", async () => {
  return {
    getInstructorCourseOfferings: vi.fn(),
    submitTARequirements: vi.fn(),
    updateTARequirements: vi.fn(),
  }
})

import {
  getInstructorCourseOfferings,
  submitTARequirements,
  updateTARequirements,
} from "@/logic/instructor-ta-requirements"

describe("InstructorTARequirements", () => {
  const mockCourses = [
    {
      id: 1,
      courseCode: "COSC123",
      courseTitle: "Intro to Testing",
      section: "001",
      year: 2025,
      term: "Fall",
      hasSubmittedRequirements: false,
      requirements: { generalRequirements: [] },
      submittedAt: null,
    },
    {
      id: 2,
      courseCode: "COSC456",
      courseTitle: "Advanced React",
      section: "002",
      year: 2025,
      term: "Fall",
      hasSubmittedRequirements: true,
      requirements: { generalRequirements: ["Must know React"] },
      submittedAt: "2025-06-01T00:00:00Z",
      requestId: 12
    }
  ]

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <InstructorTARequirements />
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.resetAllMocks()
    // Reset the window.matchMedia mock for each test
    window.matchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it("renders courses after loading", async () => {
    getInstructorCourseOfferings.mockResolvedValueOnce(mockCourses)
    renderComponent()

    // Use a more specific selector for the main heading
    expect(await screen.findByRole('heading', { name: /TA Requirements/i })).toBeInTheDocument()
    expect(screen.getByText(/COSC123/)).toBeInTheDocument()
    expect(screen.getByText(/COSC456/)).toBeInTheDocument()
  })

  it("shows error on API failure", async () => {
    getInstructorCourseOfferings.mockRejectedValueOnce(new Error("API failed"))
    renderComponent()

    expect(await screen.findByText(/failed to load course offerings/i)).toBeInTheDocument()
  })

  it("filters courses by search", async () => {
    getInstructorCourseOfferings.mockResolvedValueOnce(mockCourses)
    renderComponent()

    // Wait for the component to load first
    await screen.findByRole('heading', { name: /TA Requirements/i })
    
    const input = await screen.findByPlaceholderText(/course code, title, or section/i)
    await userEvent.type(input, "456")

    expect(screen.queryByText(/COSC123/)).not.toBeInTheDocument()
    expect(screen.getByText(/COSC456/)).toBeInTheDocument()
  })

  it("opens modal to submit requirements", async () => {
    getInstructorCourseOfferings.mockResolvedValueOnce(mockCourses)
    renderComponent()

    // Wait for loading to complete first
    await screen.findByRole('heading', { name: /TA Requirements/i })
    
    const submitBtn = await screen.findByRole("button", { name: /submit requirements/i })
    await userEvent.click(submitBtn)

    expect(await screen.findByTestId("modal")).toBeInTheDocument()
  })

  it("opens modal to edit requirements", async () => {
    getInstructorCourseOfferings.mockResolvedValueOnce(mockCourses)
    renderComponent()

    // Wait for loading to complete first
    await screen.findByRole('heading', { name: /TA Requirements/i })
    
    const editBtn = await screen.findByRole("button", { name: /edit requirements/i })
    await userEvent.click(editBtn)

    expect(await screen.findByTestId("modal")).toBeInTheDocument()
  })

  it("submits new requirements", async () => {
    getInstructorCourseOfferings.mockResolvedValue(mockCourses)
    renderComponent()

    // Wait for loading to complete first
    await screen.findByRole('heading', { name: /TA Requirements/i })
    
    const submitBtn = await screen.findByRole("button", { name: /submit requirements/i })
    await userEvent.click(submitBtn)

    const modal = await screen.findByTestId("modal")
    // Use within() to scope the search to the modal
    const modalSubmit = within(modal).getByText("Submit Requirements")

    await userEvent.click(modalSubmit)

    await waitFor(() => {
      expect(submitTARequirements).toHaveBeenCalledWith(1, { generalRequirements: ["Test requirement"] })
    })
  })

  it("updates existing requirements", async () => {
    getInstructorCourseOfferings.mockResolvedValue(mockCourses)
    renderComponent()

    // Wait for loading to complete first
    await screen.findByRole('heading', { name: /TA Requirements/i })
    
    const editBtn = await screen.findByRole("button", { name: /edit requirements/i })
    await userEvent.click(editBtn)

    const modal = await screen.findByTestId("modal")
    // Use within() to scope the search to the modal
    const modalSubmit = within(modal).getByText("Submit Requirements")
    await userEvent.click(modalSubmit)

    await waitFor(() => {
      expect(updateTARequirements).toHaveBeenCalledWith(12, 2, { generalRequirements: ["Test requirement"] })
    })
  })
})
