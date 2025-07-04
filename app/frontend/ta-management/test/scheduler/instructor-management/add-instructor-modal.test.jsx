import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddInstructorModal } from '@/components/scheduler/instructor-management/add-instructor-modal';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

// Mock lucide-react icons for cleaner test output
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="close-icon" />,
  Check: () => <div data-testid="check-icon" />,  
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp   : () => <div data-testid="chevron-up-icon" />,
}));



// Mock JSDOM browser APIs that are not implemented
const ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  vi.stubGlobal('ResizeObserver', ResizeObserver);
  
  window.HTMLElement.prototype.scrollIntoView = vi.fn();


// Mock data for the tests
const mockExistingInstructors = [
  {
    instructorId: 'inst-001',
    instructorName: 'Dr. Sarah Johnson',
    email: 's.johnson@university.edu',
    department: 'Computer Science',
    title: 'Associate Professor',
  },
];

describe('AddInstructorModal', () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnAddInstructor;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnAddInstructor = vi.fn();
  });

  const renderComponent = (props) => {
    render(
      <AddInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onAddInstructor={mockOnAddInstructor}
        existingInstructors={mockExistingInstructors}
        {...props}
      />,
    );
  };

  describe('Rendering', () => {
    it('should render the modal with all fields empty', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /add new instructor/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue('');
      expect(screen.getByRole('combobox', { name: /department/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add instructor/i })).not.toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should show required field errors when form is submitted empty', async () => {
      renderComponent();
      await user.click(screen.getByRole('button', { name: /add instructor/i }));

      // 4 field errors + 1 general error alert
      expect(await screen.findAllByTestId('alert-icon')).toHaveLength(5);
      expect(screen.getByText('Instructor name is required')).toBeInTheDocument();
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Department is required')).toBeInTheDocument();
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(mockOnAddInstructor).not.toHaveBeenCalled();
    });

    it('should show an error for a duplicate email address', async () => {
      renderComponent();
      const emailInput = screen.getByRole('textbox', { name: /email address/i });

      await user.type(emailInput, 's.johnson@university.edu'); // This email already exists
      await user.tab(); // Trigger blur validation

      expect(await screen.findByText('An instructor with this email already exists')).toBeInTheDocument();
    });

    it('should show an error for an invalid email format', async () => {
      renderComponent();
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      
      await user.type(emailInput, 'not-an-email');
      await user.tab();

      expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  describe('Submission and Cancellation', () => {
    it('should call onAddInstructor with correctly formatted data on success', async () => {
      renderComponent();

      // Fill out the form
      await user.type(screen.getByRole('textbox', { name: /full name/i }), 'Dr. Michael Chen');
      await user.type(screen.getByRole('textbox', { name: /email address/i }), 'm.chen@university.edu');
      
      await user.click(screen.getByRole('combobox', { name: /department/i }));
      await user.click(screen.getByRole('option', { name: 'Physics' }));

      await user.click(screen.getByRole('combobox', { name: /title/i }));
      await user.click(screen.getByRole('option', { name: 'Professor' }));

      // Click the submit button
      const submitButton = screen.getByRole('button', { name: /add instructor/i });
      await user.click(submitButton);

      // Check for submitting state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/adding instructor.../i)).toBeInTheDocument();
      });

      // Check that the callback was called with the correct data
      await waitFor(() => {
        expect(mockOnAddInstructor).toHaveBeenCalledTimes(1);
        expect(mockOnAddInstructor).toHaveBeenCalledWith(
          expect.objectContaining({
            instructorName: 'Dr. Michael Chen',
            email: 'm.chen@university.edu',
            department: 'Physics',
            title: 'Professor',
            courseOfferings: [],
          })
        );
      });

      // Check that the modal was closed
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      renderComponent();
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnAddInstructor).not.toHaveBeenCalled();
    });
  });
});
