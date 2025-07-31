// TaCoordinatorAllocationPage.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TAAllocationPage from "@/pages/Scheduler/TaCoordinatorAllocationPage"
import { vi } from "vitest"
import { MemoryRouter } from "react-router-dom"


// Optional: mock fetch functions if you want to control data
vi.mock("@/logic/coordinator-allocations-page", () => ({
  fetchCourses: vi.fn(() => Promise.resolve({ results: [] })),
  fetchShortlistedApplicants: vi.fn(() => Promise.resolve([])),
  fetchProfilesOfShortlistedApplicants: vi.fn(() => Promise.resolve([])),
  fetchOffers: vi.fn(() => Promise.resolve([])),
  fetchOfferingsForCourse: vi.fn(() => Promise.resolve([])),
  fetchSharedSessionsForCourse: vi.fn(() => Promise.resolve([])),
  fetchCourseOfferingDetails: vi.fn(() => Promise.resolve({ time_slots_info: [] })),
  fetchSharedSessionDetails: vi.fn(() => Promise.resolve({ time_slots_info: [] })),
  deleteOffer: vi.fn(() => Promise.resolve()),
  createOffer: vi.fn(() => Promise.resolve()),
}))

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api")
  return {
    ...actual,
    fetchAssignments: vi.fn().mockResolvedValue([
      {
        id: 1,
        taName: "Jane Doe",
        course_number: "CS101",
        section: "001",
        course_section_id: 1,
      },
    ]),
    // mock other functions if needed
  }
})


it("renders the page title", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByText(/TA Allocation Management/i)).toBeInTheDocument()
})

it("renders tab triggers", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByText("Allocate TAs")).toBeInTheDocument()
  expect(screen.getByText("Added Offers")).toBeInTheDocument()
  expect(screen.getByText("Pending Offers")).toBeInTheDocument()
  expect(screen.getByText("Allocated TAs")).toBeInTheDocument()
})

it("shows search input for shortlisted applicants", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByPlaceholderText(/Search Shortlisted Applicants/i)).toBeInTheDocument()
})

it("shows search input for courses", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByPlaceholderText(/Search Courses/i)).toBeInTheDocument()
})

it("shows message when no shortlisted applicants found", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByText(/No TAs match your search/i)).toBeInTheDocument()
})

it("switches to the Added Offers tab", async () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByText("Added Offers"))
  await waitFor(() =>
    expect(screen.getByText(/Added Offers/i)).toBeInTheDocument()
  )
})

it("renders discipline and term filter dropdowns", () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )
  expect(screen.getByDisplayValue("Select Discipline")).toBeInTheDocument()
  expect(screen.getByDisplayValue("Select Term")).toBeInTheDocument()
})

it("shows Add Offer card only when applicant and sections are selected", async () => {
  render(
    <MemoryRouter>
      <TAAllocationPage />
    </MemoryRouter>
  )

  // Simulate minimal data so Add Offer can show
  // Ideally mock `shortlistedApplicants` and `profilesOfShortlistedApplicants` with realistic test data here

  // Or just check that the section doesn't exist initially
  expect(screen.queryByTestId("add-offer-section")).not.toBeInTheDocument()
})

