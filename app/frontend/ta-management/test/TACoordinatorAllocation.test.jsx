import { render, screen, fireEvent, within } from "@testing-library/react"
import TAAllocationPage from "@/pages/TaCoordinatorAllocationPage"
import { describe, it, expect, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("TAAllocationPage", () => {

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

    // Find the h4 element for COSC 101
    const cosc101TitleElement = screen.getByText(/COSC 101 - Introduction to Programming/);
    
    // Get the parent of the h4 (the div with flex items-center justify-between mb-2)
    // Then get the parent of that div (the main course container)
    const cosc101CourseElement = cosc101TitleElement.parentElement.parentElement;
    
    // Assert that the COSC 101 course element exists
    expect(cosc101CourseElement).toBeInTheDocument();

    // Now, search for "Lecture - Section 001" specifically within the COSC 101 course element
    expect(within(cosc101CourseElement).getByText(/Lecture - Section 001/)).toBeInTheDocument();
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
      node?.textContent?.trim() === "Send Offer"
    )

    expect(confirmButton).toBeInTheDocument()
    expect(
      screen.getByText((content, node) =>
        node?.tagName === "P" &&
        node.textContent?.includes("Send offer to Abraham Lincoln for")
      )
    ).toBeInTheDocument()

})

  it("shows allocated TAs with assignments in the Allocated tab", async () => {
    const user = userEvent.setup()
    renderWithRouter(<TAAllocationPage />)

    await userEvent.click(screen.getByText("Abraham Lincoln"))
    await userEvent.click(screen.getByText(/Lab - Section L01/))
    await userEvent.click(screen.getByRole("button", { name: "Send Offer" }))

    await userEvent.click(screen.getByText("Allocated TAs"))

    expect(screen.getByText("Abraham Lincoln")).toBeInTheDocument()
    const courses = screen.getAllByText(/CS 101 - Introduction to Programming/);
    expect(courses.length).toBeGreaterThan(0);
    const sections = screen.getAllByText(/L01/);
    expect(sections.length).toBeGreaterThan(0);
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
