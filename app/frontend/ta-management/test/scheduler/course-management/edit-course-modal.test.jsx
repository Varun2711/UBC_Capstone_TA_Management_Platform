import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditCourseModal } from '@/components/scheduler/course_management/edit-course-modal'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'

// Mock lucide-react icons to simplify test output
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="close-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
}))

// Mock course data for testing
const mockCourse = {
  id: 'cs101',
  code: 'CS 101',
  title: 'Introduction to Programming',
  department: 'Computer Science',
  description: 'A foundational course on programming principles.',
  offerings: [{ id: '1', term: 'Fall', year: '2024' }],
}

const mockExistingCourses = [
  { id: 'math201', code: 'MATH 201', title: 'Calculus II' },
  { id: 'phys301', code: 'PHYS 301', title: 'Quantum Mechanics' },
]

describe('EditCourseModal', () => {
  const user = userEvent.setup()
  let mockOnClose
  let mockOnEditCourse

  beforeEach(() => {
    // Reset mocks before each test
    mockOnClose = vi.fn()
    mockOnEditCourse = vi.fn()
  })

  const renderComponent = (props) => {
    render(
      <EditCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onEditCourse={mockOnEditCourse}
        course={mockCourse}
        existingCourses={mockExistingCourses}
        {...props}
      />,
    )
  }

  it('should render and populate the form with initial course data', () => {
    renderComponent()

    expect(screen.getByRole('heading', { name: /edit course/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/course code/i)).toHaveValue(mockCourse.code)
    expect(screen.getByLabelText(/course title/i)).toHaveValue(mockCourse.title)
    expect(screen.getByLabelText(/course description/i)).toHaveValue(mockCourse.description)
    const departmentSelect = screen.getByRole('combobox')
    expect(departmentSelect).toHaveTextContent(mockCourse.department)
  })

  it('should show an alert if the course has existing offerings', () => {
    renderComponent()
    expect(screen.getByText(/This course has 1 existing offering\(s\)/)).toBeInTheDocument()
  })

  it('should have the "Update Course" button disabled initially', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /update course/i })).toBeDisabled()
  })

  it('should enable the "Update Course" button when the form data changes', async () => {
    renderComponent()
    const titleInput = screen.getByLabelText(/course title/i)
    await user.type(titleInput, ' - Updated')
    expect(screen.getByRole('button', { name: /update course/i })).not.toBeDisabled()
  })

  describe('Validation', () => {
    it('should show an error for an empty required field when it loses focus', async () => {
      renderComponent()
      const titleInput = screen.getByLabelText(/course title/i)
      await user.clear(titleInput)
      await user.tab() // Simulate tabbing away to trigger blur

      await waitFor(() => {
        expect(screen.getByText('Course title is required')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /update course/i })).toBeDisabled()
    })

    it('should show an error for an invalid course code format', async () => {
      renderComponent()
      const codeInput = screen.getByLabelText(/course code/i)
      await user.clear(codeInput)
      await user.type(codeInput, 'InvalidCode')
      await user.tab() // Simulate tabbing away to trigger blur

      await waitFor(() => {
        expect(screen.getByText(/Course code must be in format like 'CS 101'/)).toBeInTheDocument()
      })
    })

    it('should show an error for a duplicate course code', async () => {
      renderComponent()
      const codeInput = screen.getByLabelText(/course code/i)
      await user.clear(codeInput)
      await user.type(codeInput, 'MATH 201') // This code exists in mockExistingCourses
      await user.tab() // Simulate tabbing away to trigger blur

      await waitFor(() => {
        expect(screen.getByText('A course with this code already exists')).toBeInTheDocument()
      })
    })

    it('should prevent submission if the form is invalid', async () => {
      renderComponent()
      const titleInput = screen.getByLabelText(/course title/i)
      await user.clear(titleInput) // Make the form invalid

      // Try to submit even though the button is disabled
      await user.click(screen.getByRole('button', { name: /update course/i }))

      expect(mockOnEditCourse).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
      expect(screen.getByText('Course title is required')).toBeInTheDocument()
      expect(screen.getByText(/Please fix the errors above before submitting/)).toBeInTheDocument()
    })
  })

  describe('Form Submission and Cancellation', () => {
    it('should call onEditCourse with updated data on successful submission', async () => {
      renderComponent()
      const titleInput = screen.getByLabelText(/course title/i)
      const newTitle = 'Introduction to Awesome Programming'
      await user.clear(titleInput)
      await user.type(titleInput, newTitle)

      const submitButton = screen.getByRole('button', { name: /update course/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled() // Button is disabled during submission
        expect(screen.getByText(/updating course/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(mockOnEditCourse).toHaveBeenCalledTimes(1)
        expect(mockOnEditCourse).toHaveBeenCalledWith({
          ...mockCourse,
          title: newTitle, // The only change
        })
      })

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onClose and not onEditCourse when the cancel button is clicked', async () => {
      renderComponent()
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnEditCourse).not.toHaveBeenCalled()
    })

    it('should call onClose when the dialog is closed via its close button', async () => {
      renderComponent()
      // shadcn/ui dialogs have a close button with the default accessible name "Close"
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnEditCourse).not.toHaveBeenCalled()
    })
  })
})