import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import CreateAccount2 from "../src/pages/CreateAccount2"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderStep2 = () => {
  return render(
    <BrowserRouter>
      <CreateAccount2 />
    </BrowserRouter>,
  )
}

describe("CreateAccount2", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Set up step 1 data
    localStorage.setItem(
      "createAccount1",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        ubcStudentNumber: "12345678",
      }),
    )
  })

  it("renders the step 2 form correctly", () => {
    renderStep2()

    expect(screen.getByText("Create an Account (2/3)")).toBeInTheDocument()
    expect(screen.getByText("2. About Your Degree")).toBeInTheDocument()
    expect(screen.getByLabelText(/degree program/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year of degree/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/major program of study/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minor program of study/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()
  })

  it("redirects to step 1 if no step 1 data exists", () => {
    localStorage.clear()
    renderStep2()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  it("updates form data when selects change", () => {
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree program/i)
    const yearSelect = screen.getByLabelText(/year of degree/i)

    fireEvent.change(degreeProgramSelect, { target: { value: "Bachelor of Science" } })
    fireEvent.change(yearSelect, { target: { value: "3rd Year" } })

    expect(degreeProgramSelect.value).toBe("Bachelor of Science")
    expect(yearSelect.value).toBe("3rd Year")
  })

  it("navigates to step 1 when prev button is clicked", () => {
    renderStep2()

    const prevButton = screen.getByRole("button", { name: /prev/i })
    fireEvent.click(prevButton)

    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  it("saves data and navigates to step 3 on form submission", () => {
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree program/i)
    const yearSelect = screen.getByLabelText(/year of degree/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    fireEvent.change(degreeProgramSelect, { target: { value: "Bachelor of Science" } })
    fireEvent.change(yearSelect, { target: { value: "3rd Year" } })
    fireEvent.change(majorSelect, { target: { value: "Computer Science" } })

    fireEvent.click(nextButton)

    const savedData = JSON.parse(localStorage.getItem("createAccountStep2"))
    expect(savedData.degreeProgram).toBe("Bachelor of Science")
    expect(savedData.yearOfDegree).toBe("3rd Year")
    expect(savedData.majorProgram).toBe("Computer Science")
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step3")
  })

  it("shows error when major and minor programs are the same", () => {
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree program/i)
    const yearSelect = screen.getByLabelText(/year of degree/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    fireEvent.change(degreeProgramSelect, { target: { value: "Bachelor of Science" } })
    fireEvent.change(yearSelect, { target: { value: "3rd Year" } })
    fireEvent.change(majorSelect, { target: { value: "Computer Science" } })
    fireEvent.change(minorSelect, { target: { value: "Computer Science" } })

    fireEvent.click(nextButton)

    expect(screen.getByText("Major and minor programs cannot be the same")).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith("/create-account/step3")
  })

  it("clears error when form data changes", () => {
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree program/i)
    const yearSelect = screen.getByLabelText(/year of degree/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    // First create the error
    fireEvent.change(degreeProgramSelect, { target: { value: "Bachelor of Science" } })
    fireEvent.change(yearSelect, { target: { value: "3rd Year" } })
    fireEvent.change(majorSelect, { target: { value: "Computer Science" } })
    fireEvent.change(minorSelect, { target: { value: "Computer Science" } })
    fireEvent.click(nextButton)

    expect(screen.getByText("Major and minor programs cannot be the same")).toBeInTheDocument()

    // Then change the minor to clear the error
    fireEvent.change(minorSelect, { target: { value: "Mathematics" } })
    expect(screen.queryByText("Major and minor programs cannot be the same")).not.toBeInTheDocument()
  })

  it("allows form submission when major and minor are different", () => {
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree program/i)
    const yearSelect = screen.getByLabelText(/year of degree/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    fireEvent.change(degreeProgramSelect, { target: { value: "Bachelor of Science" } })
    fireEvent.change(yearSelect, { target: { value: "3rd Year" } })
    fireEvent.change(majorSelect, { target: { value: "Computer Science" } })
    fireEvent.change(minorSelect, { target: { value: "Mathematics" } })

    fireEvent.click(nextButton)

    expect(screen.queryByText("Major and minor programs cannot be the same")).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step3")
  })
})
