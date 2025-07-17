import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditInstructorModal } from '@/components/scheduler/instructor-management/edit-instructor-modal';

// Mock the external API module
vi.mock('@/logic/instructorManagement', () => ({
  updateInstructor: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="close-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));

// Mock browser APIs
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

window.HTMLElement.prototype.scrollIntoView = vi.fn();

import { updateInstructor } from '@/logic/instructorManagement';

describe('EditInstructorModal', () => {
  const user = userEvent.setup();

  const mockInstructor = {
    instructorId: 'inst-001',
    instructorName: 'Dr. Sarah Johnson',
    email: 's.johnson@university.edu',
    departmentName: 'Computer Science',
    employeeNumber: '12345678',
  };

  const mockExistingInstructors = [
    mockInstructor,
    {
      instructorId: 'inst-002',
      instructorName: 'Dr. Michael Chen',
      email: 'm.chen@university.edu',
      departmentName: 'Mathematics',
      employeeNumber: '87654321',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onDataChange: vi.fn(),
    instructor: mockInstructor,
    existingInstructors: mockExistingInstructors,
    departments: ['Computer Science', 'Mathematics', 'Physics'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(<EditInstructorModal {...defaultProps} {...props} />);
  };

  const waitForFormToLoad = async () => {
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockInstructor.instructorName)).toBeInTheDocument();
    });
  };

  it('renders modal with instructor data populated', async () => {
    renderModal();
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Instructor')).toBeInTheDocument();
    
    await waitForFormToLoad();
    
    expect(screen.getByDisplayValue(mockInstructor.instructorName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockInstructor.email)).toBeInTheDocument();
    expect(screen.getByText(mockInstructor.employeeNumber)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update instructor/i })).toBeDisabled();
  });

  it('does not render when closed', () => {
    renderModal({ isOpen: false });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(onClose).toHaveBeenCalled();
  });

  it('enables update button when changes are made', async () => {
    renderModal();
    await waitForFormToLoad();
    
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.type(nameInput, ' Updated');
    
    expect(screen.getByRole('button', { name: /update instructor/i })).not.toBeDisabled();
  });

  it('shows validation error for empty name', async () => {
    renderModal();
    await waitForFormToLoad();
    
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.clear(nameInput);
    await user.tab();
    
    expect(screen.getByText('Instructor name is required')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderModal();
    await waitForFormToLoad();
    
    const emailInput = screen.getByDisplayValue(mockInstructor.email);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('shows validation error for duplicate email', async () => {
    renderModal();
    await waitForFormToLoad();
    
    const emailInput = screen.getByDisplayValue(mockInstructor.email);
    await user.clear(emailInput);
    await user.type(emailInput, 'm.chen@university.edu');
    await user.tab();
    
    expect(screen.getByText('An instructor with this email already exists')).toBeInTheDocument();
  });

  it('submits form successfully with updated data', async () => {
    updateInstructor.mockResolvedValue({});
    const onClose = vi.fn();
    const onDataChange = vi.fn();
    renderModal({ onClose, onDataChange });
    
    await waitForFormToLoad();
    
    // Make changes
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.clear(nameInput);
    await user.type(nameInput, 'Dr. Sarah Johnson-Smith');
    
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Mathematics' }));
    
    // Submit
    await user.click(screen.getByRole('button', { name: /update instructor/i }));
    
    // Verify API call
    expect(updateInstructor).toHaveBeenCalledWith(mockInstructor.instructorId, {
      name: 'Dr. Sarah Johnson-Smith',
      email: mockInstructor.email,
      department: 'Mathematics',
    });
    
    // Verify callbacks
    await waitFor(() => {
      expect(onDataChange).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays API error on submission failure', async () => {
    updateInstructor.mockRejectedValue({
      response: { data: { message: 'Failed to update instructor' } }
    });
    renderModal();
    
    await waitForFormToLoad();
    
    // Make a change to enable submit
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.type(nameInput, ' Updated');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /update instructor/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update instructor')).toBeInTheDocument();
    });
    
    // Button should be enabled again
    expect(screen.getByRole('button', { name: /update instructor/i })).not.toBeDisabled();
  });

  it('prevents submission with validation errors', async () => {
    renderModal();
    await waitForFormToLoad();
    
    // Make invalid changes
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.clear(nameInput);
    
    const emailInput = screen.getByDisplayValue(mockInstructor.email);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    
    // Try to submit
    await user.click(screen.getByRole('button', { name: /update instructor/i }));
    
    // Should show validation errors
    expect(screen.getByText('Instructor name is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    
    // API should not be called
    expect(updateInstructor).not.toHaveBeenCalled();
  });

  it('shows employee number as read-only', async () => {
    renderModal();
    await waitForFormToLoad();
    
    expect(screen.getByText(mockInstructor.employeeNumber)).toBeInTheDocument();
    expect(screen.getByText('Employee number cannot be changed.')).toBeInTheDocument();
    
    // Should not be an input field
    expect(screen.queryByDisplayValue(mockInstructor.employeeNumber)).not.toBeInTheDocument();
  });

  it('clears errors when user starts typing', async () => {
    renderModal();
    await waitForFormToLoad();
    
    // Trigger validation error
    const nameInput = screen.getByDisplayValue(mockInstructor.instructorName);
    await user.clear(nameInput);
    await user.tab();
    expect(screen.getByText('Instructor name is required')).toBeInTheDocument();
    
    // Start typing to clear error
    await user.type(nameInput, 'New Name');
    expect(screen.queryByText('Instructor name is required')).not.toBeInTheDocument();
  });
});