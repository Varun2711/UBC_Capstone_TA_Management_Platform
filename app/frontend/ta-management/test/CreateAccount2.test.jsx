import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import CreateAccount2 from "../src/pages/CreateAccount2"

// Mock navigate function to track route changes
const mockNavigate = vi.fn()

// Mock react-router-dom's useNavigate hook to use our mockNavigate function
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper to render the component wrapped with MemoryRouter for routing context
const renderStep2 = () => {
  return render(
    <MemoryRouter>
      <CreateAccount2 />
    </MemoryRouter>,
  )
}

describe("CreateAccount2", () => {
  // Reset mocks and set up localStorage before each test
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Simulate Step 1 data presence in localStorage
    localStorage.setItem(
      "createAccountStep1",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        ubcStudentNumber: "12345678",
      }),
    )
  })

  // Verify that Step 2 form renders expected texts and fields
  it("renders the step 2 form correctly", () => {
    renderStep2()

    expect(screen.getByText("Create an Account (2/3)")).toBeInTheDocument()
    expect(screen.getByText("2. About Your Degree")).toBeInTheDocument()
    expect(screen.getByLabelText(/degree currently in progress/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year of degree start/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/major program of study/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minor program of study/i)).toBeInTheDocument()

    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument()
  })

  // Redirect to step 1 if Step 1 data is missing
  it("redirects to step 1 if no step 1 data exists", () => {
    localStorage.clear()
    renderStep2()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  // Test that select inputs update their values on user interaction
  it("updates form data when selects change", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)

    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    await user.selectOptions(yearSelect, "2023")

    expect(degreeProgramSelect).toHaveValue("BSc or BA")
    expect(yearSelect).toHaveValue("2023")
  })

  // Show the "Other degree" input field when user selects 'Other' option
  it("shows other degree input when 'Other' is selected", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)

    // Confirm other degree input is not initially present
    expect(screen.queryByLabelText(/please specify your degree/i)).not.toBeInTheDocument()

    await user.selectOptions(degreeProgramSelect, "Other (please specify)")

    // Other degree input should now appear
    expect(screen.getByLabelText(/please specify your degree/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your degree program/i)).toBeInTheDocument()
  })

  // Hide "Other degree" input when user switches away from 'Other' option
  it("hides other degree input when different option is selected", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)

    await user.selectOptions(degreeProgramSelect, "Other (please specify)")
    expect(screen.getByLabelText(/please specify your degree/i)).toBeInTheDocument()

    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    expect(screen.queryByLabelText(/please specify your degree/i)).not.toBeInTheDocument()
  })

  // Navigate to step 1 when "Prev" button is clicked
  it("navigates to step 1 when prev button is clicked", async () => {
    const user = userEvent.setup()
    renderStep2()

    const prevButton = screen.getByRole("button", { name: /prev/i })
    await user.click(prevButton)

    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
  })

  // Save form data and navigate to step 3 when form is submitted with valid data
  it("saves data and navigates to step 3 on form submission", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    await user.selectOptions(yearSelect, "2023")
    await user.selectOptions(majorSelect, "Computer Science")

    await user.click(nextButton)

    const savedData = JSON.parse(localStorage.getItem("createAccount2"))
    expect(savedData.degreeProgram).toBe("BSc or BA")
    expect(savedData.yearOfDegreeStart).toBe("2023")
    expect(savedData.majorProgram).toBe("Computer Science")
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step3")
  })

  // Save the "Other" degree input when user specifies it and submits the form
  it("saves custom degree when 'Other' is selected and specified", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    await user.selectOptions(degreeProgramSelect, "Other (please specify)")

    const otherDegreeInput = screen.getByLabelText(/please specify your degree/i)
    await user.type(otherDegreeInput, "Bachelor of Fine Arts")

    await user.selectOptions(yearSelect, "2022")
    await user.selectOptions(majorSelect, "Computer Science")

    await user.click(nextButton)

    const savedData = JSON.parse(localStorage.getItem("createAccount2"))
    expect(savedData.degreeProgram).toBe("Other (please specify)")
    expect(savedData.otherDegreeProgram).toBe("Bachelor of Fine Arts")
    expect(savedData.yearOfDegreeStart).toBe("2022")
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step3")
  })

  // Show error when major and minor programs are the same and prevent navigation
  it("shows error when major and minor programs are the same", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    await user.selectOptions(yearSelect, "2023")
    await user.selectOptions(majorSelect, "Computer Science")
    await user.selectOptions(minorSelect, "Computer Science")

    await user.click(nextButton)

    expect(screen.getByText("Major and minor programs cannot be the same")).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalledWith("/create-account/step3")
  })

  // Clear error when user changes form data to valid input
  it("clears error when form data changes", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    // Create the error first
    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    await user.selectOptions(yearSelect, "2023")
    await user.selectOptions(majorSelect, "Computer Science")
    await user.selectOptions(minorSelect, "Computer Science")
    await user.click(nextButton)

    expect(screen.getByText("Major and minor programs cannot be the same")).toBeInTheDocument()

    // Change minor program to clear the error
    await user.selectOptions(minorSelect, "Mathematics")

    expect(screen.queryByText("Major and minor programs cannot be the same")).not.toBeInTheDocument()
  })

  // Allow form submission when major and minor programs differ
  it("allows form submission when major and minor are different", async () => {
    const user = userEvent.setup()
    renderStep2()

    const degreeProgramSelect = screen.getByLabelText(/degree currently in progress/i)
    const yearSelect = screen.getByLabelText(/year of degree start/i)
    const majorSelect = screen.getByLabelText(/major program of study/i)
    const minorSelect = screen.getByLabelText(/minor program of study/i)
    const nextButton = screen.getByRole("button", { name: /next/i })

    await user.selectOptions(degreeProgramSelect, "BSc or BA")
    await user.selectOptions(yearSelect, "2023")
    await user.selectOptions(majorSelect, "Computer Science")
    await user.selectOptions(minorSelect, "Mathematics")

    await user.click(nextButton)

    expect(screen.queryByText("Major and minor programs cannot be the same")).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith("/create-account/step3")
  })
})
