import { render, screen, fireEvent, within } from "@testing-library/react"
import TAAllocationPage from "@/pages/TaCoordinatorAllocationPage"
import { describe, it, expect, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("TAAllocationPage", () => {

  it("renders the TA Allocation Management page with overview cards", () => {
    renderWithRouter(<TAAllocationPage />)

    expect(screen.getByText("TA Allocation Management")).toBeInTheDocument()
    expect(screen.getByText("Total TAs")).toBeInTheDocument()
    expect(screen.getByText("Courses")).toBeInTheDocument()
    expect(screen.getByText("Total Hours Allocated")).toBeInTheDocument()
    expect(screen.getByText("Allocation Status")).toBeInTheDocument()
  })

  it("shows the list of available TAs by default in Allocate tab", () => {
    renderWithRouter(<TAAllocationPage />)

    expect(screen.getByText("Select TA")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search TAs/i)).toBeInTheDocument()
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument()
    expect(screen.getByText("Michael Chen")).toBeInTheDocument()
    expect(screen.getByText("Abraham Lincoln")).toBeInTheDocument()
    expect(screen.queryByText("Emily Rodriguez")).not.toBeInTheDocument() // Fully Allocated
  })

  it("filters TAs when a search term is entered", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    const input = screen.getByPlaceholderText(/Search TAs/i)
    await userEvent.type(input, "michael")

    expect(screen.getByText("Michael Chen")).toBeInTheDocument()
    expect(screen.queryByText("Sarah Johnson")).not.toBeInTheDocument()
  })

  it("shows TA details when a TA is selected", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    await userEvent.click(screen.getByText("Michael Chen"))

    expect(screen.getByText("Michael Chen")).toBeInTheDocument()
    expect(screen.getByText(/C\+\+/)).toBeInTheDocument()
    expect(screen.getByText(/Machine Learning/)).toBeInTheDocument()
    expect(screen.getByText("Email: michael.chen@university.edu")).toBeInTheDocument()
  })

  it("displays course sections and allows course selection", () => {
    renderWithRouter(<TAAllocationPage />)

    expect(screen.getByText("Select Course Section")).toBeInTheDocument()
    expect(screen.getByText(/CS 101 - Introduction to Programming/)).toBeInTheDocument()
    expect(screen.getByText(/Lecture - Section 001/)).toBeInTheDocument()
  })

  it("allows assigning a TA to a course section and shows confirmation", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    // Select TA
    await userEvent.click(screen.getByText("Abraham Lincoln"))
    // Select Course
    await userEvent.click(screen.getByText(/Lab - Section L01/))

    const confirmButton = screen.getByText((_, node) =>
      node?.tagName === "BUTTON" &&
      node?.textContent?.trim() === "Confirm Assignment"
    )

    expect(confirmButton).toBeInTheDocument()
    expect(
      screen.getByText((content, node) =>
        node?.tagName === "P" &&
        node.textContent?.includes("Assign Abraham Lincoln to")
      )
    ).toBeInTheDocument()

})

  it("shows allocated TAs with assignments in the Allocated tab", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    await userEvent.click(screen.getByText("Abraham Lincoln"))
    await userEvent.click(screen.getByText(/Lab - Section L01/))
    await userEvent.click(screen.getByRole("button", { name: "Confirm Assignment" }))

    await userEvent.click(screen.getByText("Allocated TAs"))

    expect(screen.getByText("Abraham Lincoln")).toBeInTheDocument()
    expect(screen.getByText(/CS 101 - Introduction to Programming/)).toBeInTheDocument()
    expect(screen.getByText(/L01/)).toBeInTheDocument()
  })

  it("cancels TA assignment on Cancel button click", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    await user.click(screen.getByText("Abraham Lincoln"))
    await user.click(screen.getByText(/Lab - Section L01/))

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    await user.click(cancelButton)

    expect(
      screen.queryByText((_, node) =>
        node?.textContent?.includes("Assign Abraham Lincoln to")
      )
    ).not.toBeInTheDocument()
  })

})
