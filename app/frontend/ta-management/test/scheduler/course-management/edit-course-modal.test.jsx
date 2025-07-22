import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditCourseModal } from '@/components/scheduler/course_management/edit-course-modal';

// Mock lucide-react icons - use span to avoid nesting issues
vi.mock('lucide-react', () => ({
  Edit: () => <span data-testid="edit-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  X: () => <span data-testid="close-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronUp: () => <span data-testid="chevron-up-icon" />,
  Check: () => <span data-testid="check-icon" />,
}));

describe('EditCourseModal', () => {
  const mockCourse = {
    id: 'cs101',
    code: 'CS 101',
    title: 'Introduction to Programming',
    department: 'Computer Science',
    description: 'A foundational course on programming principles.',
    offerings: [{ id: '1', term: 'Fall', year: '2024' }],
  };

  const mockDepartments = [
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Mathematics' },
  ];

  const mockExistingCourses = [
    { id: 'math201', code: 'MATH 201', title: 'Calculus II' },
    { id: 'phys301', code: 'PHYS 301', title: 'Quantum Mechanics' },
  ];

  let mockOnClose;
  let mockOnEditCourse;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnEditCourse = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <EditCourseModal
        isOpen={true}
        onClose={mockOnClose}
        onEditCourse={mockOnEditCourse}
        course={mockCourse}
        departments={mockDepartments}
        existingCourses={mockExistingCourses}
        {...props}
      />
    );
  };

  it('renders form with course data', () => {
    renderComponent();

    expect(screen.getByText('Edit Course: CS 101')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CS 101')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A foundational course on programming principles.')).toBeInTheDocument();
    expect(screen.getByText('Update Course')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByText('Edit Course')).not.toBeInTheDocument();
  });

  it('enables update button when form changes', async () => {
    renderComponent();

    // The button might already be enabled with existing data
    // Let's test that making changes keeps it enabled or enables it
    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.type(titleInput, ' - Updated');

    const updateButton = screen.getByText('Update Course');
    expect(updateButton).not.toBeDisabled();
  });

  it('validates required fields', async () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.clear(titleInput);
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('Course title is required')).toBeInTheDocument();
    });
  });

  it('validates course code format', async () => {
    renderComponent();

    const codeInput = screen.getByDisplayValue('CS 101');
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'invalid');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText(/Course code must be in format/)).toBeInTheDocument();
    });
  });

  it('validates duplicate course codes', async () => {
    renderComponent();

    const codeInput = screen.getByDisplayValue('CS 101');
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'MATH 201');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('A course with this code already exists')).toBeInTheDocument();
    });
  });

  it('calls onEditCourse when form is submitted', async () => {
    mockOnEditCourse.mockResolvedValue();
    renderComponent();

    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Advanced Programming');

    const updateButton = screen.getByText('Update Course');
    await userEvent.click(updateButton);

    expect(mockOnEditCourse).toHaveBeenCalledWith({
      code: 'CS 101',
      title: 'Advanced Programming',
      departmentId: 1,
      description: 'A foundational course on programming principles.',
      level: '100',
    });
  });

  it('shows loading state during submission', async () => {
    mockOnEditCourse.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderComponent();

    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.type(titleInput, ' - Updated');

    const updateButton = screen.getByText('Update Course');
    await userEvent.click(updateButton);

    expect(screen.getByText('Updating Course...')).toBeInTheDocument();
    expect(updateButton).toBeDisabled();
  });

  it('calls onClose when cancel is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents submission with invalid form', async () => {
    renderComponent();

    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.clear(titleInput);

    const updateButton = screen.getByText('Update Course');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Please fix the errors above before submitting.')).toBeInTheDocument();
    });

    expect(mockOnEditCourse).not.toHaveBeenCalled();
  });

  it('shows course level calculation', () => {
    renderComponent();
    expect(screen.getByText(/course level: \(automatically calculated\)/i)).toBeInTheDocument();
  });

  it('handles department selection', async () => {
    renderComponent();

    // Find the department select by role
    const departmentSelect = screen.getByRole('combobox');
    fireEvent.click(departmentSelect);

    // Find Mathematics option in the dropdown list
    const mathsOptions = screen.getAllByText('Mathematics');
    const mathsOption = mathsOptions.find(el => 
      el.closest('[role="option"]') || el.getAttribute('role') === 'option'
    );
    
    fireEvent.click(mathsOption);
    
    // Enable the update button by making a change
    const titleInput = screen.getByDisplayValue('Introduction to Programming');
    await userEvent.type(titleInput, ' - Updated');
    
    expect(screen.getByText('Update Course')).not.toBeDisabled();
  });
});