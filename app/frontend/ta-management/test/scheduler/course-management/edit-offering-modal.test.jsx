import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditOfferingModal } from '@/components/scheduler/course_management/edit-offering-modal';

// Mock JSDOM browser APIs
const ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserver);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock lucide-react icons - use span to avoid nesting issues
vi.mock('lucide-react', () => ({
  Edit: () => <span data-testid="edit-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  Check: () => <span data-testid="check-icon" />,
  ChevronsUpDown: () => <span data-testid="chevrons-icon" />,
  X: () => <span data-testid="x-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronUp: () => <span data-testid="chevron-up-icon" />,
  Search: () => <span data-testid="search-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
}));

describe('EditOfferingModal', () => {
  const mockCourse = {
    id: 'cs101',
    code: 'CS 101',
    title: 'Introduction to Programming',
    department: 'Computer Science',
    departmentId: 1,
  };

  const mockOfferingToEdit = {
    id: 'offering1',
    year: 2025,
    term: 'Winter Term 1',
    section: '001',
    instructor_id: 1,
    instructor: 'Dr. Sarah Johnson',
    time_slots: [
      { day: 'Monday', time: '02:00 PM - 04:00 PM' }
    ]
  };

  const mockTerms = [
    { id: 1, value: 'Winter Term 1', label: 'Winter Term 1', year: 2025 },
    { id: 2, value: 'Spring Term 1', label: 'Spring Term 1', year: 2025 },
  ];

  const mockInstructors = [
    { id: 1, name: 'Dr. Sarah Johnson', department: 'Computer Science', departmentId: 1, email: 's.johnson@university.edu' },
    { id: 2, name: 'Dr. Michael Chen', department: 'Computer Science', departmentId: 1, email: 'm.chen@university.edu' },
  ];

  const mockExistingOfferings = [
    mockOfferingToEdit,
    { id: 'offering2', year: 2025, term: 'Winter Term 1', section: '002' },
  ];

  let mockOnClose;
  let mockOnEditOffering;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnEditOffering = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <EditOfferingModal
        isOpen={true}
        onClose={mockOnClose}
        onEditOffering={mockOnEditOffering}
        course={mockCourse}
        offering={mockOfferingToEdit}
        existingOfferings={mockExistingOfferings}
        terms={mockTerms}
        instructors={mockInstructors}
        {...props}
      />
    );
  };

  it('renders form with offering data', async () => {
    renderComponent();

    expect(screen.getByText('Edit Course Offering')).toBeInTheDocument();
    expect(screen.getByText(/CS 101 - Introduction to Programming/)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
      expect(screen.getAllByText('2025').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Winter Term 1').length).toBeGreaterThan(0);
    });
  });

  it('does not render when closed', () => {
    renderComponent({ isOpen: false });
    expect(screen.queryByText('Edit Course Offering')).not.toBeInTheDocument();
  });

  it('enables update button when form changes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.clear(sectionInput);
    await userEvent.type(sectionInput, '003');

    expect(screen.getByText('Update Offering')).not.toBeDisabled();
  });

  it('validates section format', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.clear(sectionInput);
    await userEvent.type(sectionInput, 'invalid');
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText('Section must be 3 digits (e.g., 001, 002)')).toBeInTheDocument();
    });
  });

  it('validates duplicate sections', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.clear(sectionInput);
    await userEvent.type(sectionInput, '002'); // This exists in mockExistingOfferings
    await userEvent.tab();

    await waitFor(() => {
      expect(screen.getByText(/section with this number already exists/)).toBeInTheDocument();
    });
  });


  it('adds and removes time slots', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    // Initially one time slot
    expect(screen.getAllByText('Day *')).toHaveLength(1);

    // Add time slot
    await userEvent.click(screen.getByText('Add Time Slot'));
    expect(screen.getAllByText('Day *')).toHaveLength(2);

    // Remove time slot
    const removeButtons = screen.getAllByTestId('x-icon');
    await userEvent.click(removeButtons[0]);
    expect(screen.getAllByText('Day *')).toHaveLength(1);
  });

  it('calls onEditOffering when form is submitted', async () => {
    mockOnEditOffering.mockResolvedValue();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.clear(sectionInput);
    await userEvent.type(sectionInput, '003');

    const submitButton = screen.getByText('Update Offering');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnEditOffering).toHaveBeenCalledWith(
        mockCourse.id,
        expect.objectContaining({
          id: mockOfferingToEdit.id,
          section: '003',
        })
      );
    });
  });

  it('shows loading state during submission', async () => {
    mockOnEditOffering.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.type(sectionInput, '3');

    const submitButton = screen.getByText('Update Offering');
    await userEvent.click(submitButton);

    expect(screen.getByText('Updating Offering...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls onClose when cancel is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents submission with invalid form', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    });

    const sectionInput = screen.getByDisplayValue('001');
    await userEvent.clear(sectionInput);

    const submitButton = screen.getByText('Update Offering');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fix the errors above before submitting.')).toBeInTheDocument();
    });

    expect(mockOnEditOffering).not.toHaveBeenCalled();
  });

  it('shows instructor selection', async () => {
    renderComponent();


    const comboboxes = screen.getAllByRole('combobox');
    const instructorButton = comboboxes[2]; // Third combobox is likely the instructor selector
    
    await userEvent.click(instructorButton);

    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Dr. Michael Chen')).toBeInTheDocument();
  });

  it('shows existing offerings reference', () => {
    renderComponent();

    expect(screen.getByText('Other Offerings:')).toBeInTheDocument();
    expect(screen.getByText(/CS 101-002/)).toBeInTheDocument();
  });
});
