import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import CreateAccount1 from "../src/pages/CreateAccount1"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderStep1 = () => {
  return render(
    <BrowserRouter>
      <CreateAccount1 />
    </BrowserRouter>,
  )
}

describe("CreateAccount1", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("renders the step 1 form correctly", () => {
    renderStep1()

    expect(screen.getByText("Create an Account (1/3)")).toBeInTheDocument()
    expect(screen.getByText("1. About You")).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()

    const studentNumberInput = screen.getByLabelText(/ubc student number/i)
    expect(studentNumberInput).toBeInTheDocument()
    expect(studentNumberInput).toHaveAttribute("type", "number")

    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()
  })

  it("updates form data when inputs change", () => {
    renderStep1()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)

    fireEvent.change(firstNameInput, { target: { value: "John" } })
    fireEvent.change(lastNameInput, { target: { value: "Doe" } })
    fireEvent.change(studentNumberInput, { target: { value: "12345678" } })

    expect(firstNameInput.value).toBe("John")
    expect(lastNameInput.value).toBe("Doe")
    expect(studentNumberInput.value).toBe("12345678")
  })

  it("saves data to localStorage and navigates to step 2 on form submission", () => {
    renderStep1()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    fireEvent.change(firstNameInput, { target: { value: "John" } })
    fireEvent.change(lastNameInput, { target: { value: "Doe" } })
    fireEvent.change(studentNumberInput, { target: { value: "12345678" } })

    fireEvent.click(nextButton)

    const savedData = JSON.parse(localStorage.getItem("createAccount1"))
    expect(savedData).toEqual({
      firstName: "John",
      lastName: "Doe",
      ubcStudentNumber: "12345678",
    })
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step2")
  })

  it("requires all fields to be filled", () => {
    renderStep1()

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const studentNumberInput = screen.getByLabelText(/ubc student number/i)

    expect(firstNameInput).toHaveAttribute("required")
    expect(lastNameInput).toHaveAttribute("required")
    expect(studentNumberInput).toHaveAttribute("required")
  })
})
