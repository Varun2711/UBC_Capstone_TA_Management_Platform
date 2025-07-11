import MyCourses from "@/pages/Instructor_MyCourses"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

const renderMyCoursesPage = () => {
  return render(
    <MemoryRouter initialEntries={["/my-courses"]}>
      <MyCourses />
    </MemoryRouter>,
  )
}

// Mock custom hooks so i know what i'm expecting and
// tests don't rely on backend containers
vi.mock("@/hooks/useCurrentAcademicSession", () => ({
    useCurrentAcademicSession: () => ({
        data: {
            term_type: "Winter",
            academic_year: "2025/26"
        },
        loading: false
    })
}))

vi.mock("@/hooks/useMyCourses", () => ({
    useMyCourses: () => ({    
        data: {
            "courses": [
                {
                    "id": 1,
                    "course_number": "COSC101",
                    "title": "Digital Citizenship",
                    "section": "001",
                    "term_number": 1
                },
                {
                    "id": 2,
                    "course_number": "COSC111",
                    "title": "Computer Programming I",
                    "section": "001",
                    "term_number": 1
                },
                {
                    "id": 3,
                    "course_number": "COSC211",
                    "title": "Machine Architecture",
                    "section": "002",
                    "term_number": 1
                },
                {
                    "id": 4,
                    "course_number": "COSC121",
                    "title": "Computer Programming II",
                    "section": "002",
                    "term_number": 2
                },
                {
                    "id": 5,
                    "course_number": "COSC315",
                    "title": "Operating Systems",
                    "section": "001",
                    "term_number": 2
                }
            ]
        },
        loading: false
    })
}));

// Start of tests
describe("Instructor/My Courses", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the 'My Courses' page correctly", () => {
        renderMyCoursesPage()

        // main page headers
        expect(screen.getByRole('heading', { level: 1, name: "My Courses" })).toBeInTheDocument();
        expect(screen.getByText("Current Session: 2025/26 Winter")).toBeInTheDocument();

        expect(screen.getByText("Term 1")).toBeInTheDocument();
        expect(screen.getByText("Term 2")).toBeInTheDocument();

        // course cards

    })
})