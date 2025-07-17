import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddInstructorModal } from '@/components/scheduler/instructor-management/add-instructor-modal';

// Mock the external API module
vi.mock('@/logic/instructorManagement', () => ({
  addInstructor: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
}));

// Mock browser APIs
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

// Mock scrollIntoView for Radix Select
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Create a proper spy for clipboard
const mockWriteText = vi.fn().mockResolvedValue();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

import { addInstructor } from '@/logic/instructorManagement';

describe('AddInstructorModal', () => {
  const user = userEvent.setup();
  
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onDataChange: vi.fn(),
    existingInstructors: [],
    departments: ['Computer Science', 'Physics'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
  });

  const renderModal = (props = {}) => {
    return render(<AddInstructorModal {...defaultProps} {...props} />);
  };

  const fillValidForm = async () => {
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/employee number/i), '12345678');
    await user.type(screen.getByLabelText(/email address/i), 'john@test.com');
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Physics' }));
  };

  it('renders modal when open', () => {
    renderModal();
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add New Instructor')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add instructor/i })).toBeInTheDocument();
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

  it('shows validation errors for empty fields', async () => {
    renderModal();
    
    await user.click(screen.getByRole('button', { name: /add instructor/i }));
    
    expect(screen.getByText('Instructor name is required')).toBeInTheDocument();
    expect(screen.getByText('Employee number is required')).toBeInTheDocument();
    expect(screen.getByText('Email address is required')).toBeInTheDocument();
    expect(screen.getByText('Department is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderModal();
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('validates employee number format', async () => {
    renderModal();
    
    const employeeInput = screen.getByLabelText(/employee number/i);
    await user.type(employeeInput, '123');
    await user.tab();
    
    expect(screen.getByText('Employee number must be exactly 8 digits')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    addInstructor.mockResolvedValue({ temporary_password: 'TempPass123!' });
    renderModal();
    
    await fillValidForm();
    await user.click(screen.getByRole('button', { name: /add instructor/i }));
    
    expect(addInstructor).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@test.com',
      department: 'Physics',
      employee_number: '12345678',
    });
    
    await waitFor(() => {
      expect(screen.getByText('Instructor Added')).toBeInTheDocument();
    });
  });

  it('displays API errors', async () => {
    addInstructor.mockRejectedValue({
      response: { data: { message: 'Server error' } }
    });
    renderModal();
    
    await fillValidForm();
    await user.click(screen.getByRole('button', { name: /add instructor/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows password in success modal', async () => {
    addInstructor.mockResolvedValue({ temporary_password: 'TempPass123!' });
    renderModal();
    
    await fillValidForm();
    await user.click(screen.getByRole('button', { name: /add instructor/i }));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('TempPass123!')).toBeInTheDocument();
    });
  });

  it('calls callbacks when done', async () => {
    const onClose = vi.fn();
    const onDataChange = vi.fn();
    addInstructor.mockResolvedValue({ temporary_password: 'TempPass123!' });
    renderModal({ onClose, onDataChange });
    
    await fillValidForm();
    await user.click(screen.getByRole('button', { name: /add instructor/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Instructor Added')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /done/i }));
    
    expect(onDataChange).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});