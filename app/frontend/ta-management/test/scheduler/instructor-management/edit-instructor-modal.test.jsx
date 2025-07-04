import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditInstructorModal } from '@/components/scheduler/instructor-management/edit-instructor-modal';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

// Mock lucide-react icons for cleaner test output
vi.mock('lucide-react', () => ({
  Edit: () => <div data-testid="edit-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  X: () => <div data-testid="close-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp : () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
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
const mockInstructorToEdit = {
  instructorId: 'inst-001',
  instructorName: 'Dr. Sarah Johnson',
  email: 's.johnson@university.edu',
  department: 'Computer Science',
  title: 'Associate Professor',
};

const mockExistingInstructors = [
  mockInstructorToEdit,
  {
    instructorId: 'inst-002',
    instructorName: 'Dr. Michael Chen',
    email: 'm.chen@university.edu',
    department: 'Computer Science',
    title: 'Professor',
  },
];

describe('EditInstructorModal', () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnEditInstructor;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnEditInstructor = vi.fn();
  });

  const renderComponent = (props) => {
    render(
      <EditInstructorModal
        isOpen={true}
        onClose={mockOnClose}
        onEditInstructor={mockOnEditInstructor}
        instructor={mockInstructorToEdit}
        existingInstructors={mockExistingInstructors}
        {...props}
      />,
    );
  };

  describe('Rendering and Initialization', () => {
    it('should populate the form with instructor data when opened', async () => {
      renderComponent();

      // Use waitFor to allow the useEffect hook to populate the form
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue(mockInstructorToEdit.instructorName);
        expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue(mockInstructorToEdit.email);
        expect(screen.getByRole('combobox', { name: /department/i })).toHaveTextContent(mockInstructorToEdit.department);
        expect(screen.getByRole('combobox', { name: /title/i })).toHaveTextContent(mockInstructorToEdit.title);
      });
    });

    it('should have the "Update Instructor" button disabled initially', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /update instructor/i })).toBeDisabled();
    });
  });

  describe('Interaction and Validation', () => {
    it('should enable the "Update" button when a change is made', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue(mockInstructorToEdit.instructorName);
      });
      
      const nameInput = screen.getByRole('textbox', { name: /full name/i });
      await user.type(nameInput, '!');
      
      expect(screen.getByRole('button', { name: /update instructor/i })).not.toBeDisabled();
    });

    it('should show an error for a duplicate email address', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue(mockInstructorToEdit.email);
        });

        const emailInput = screen.getByRole('textbox', { name: /email address/i });
        await user.clear(emailInput);
        await user.type(emailInput, 'm.chen@university.edu'); // This email already exists
        await user.tab(); // Trigger blur validation

        expect(await screen.findByText('An instructor with this email already exists')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update instructor/i })).toBeDisabled();
    });

    it('should show an error for an invalid email format', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: /email address/i })).toHaveValue(mockInstructorToEdit.email);
        });

        const emailInput = screen.getByRole('textbox', { name: /email address/i });
        await user.clear(emailInput);
        await user.type(emailInput, 'invalid-email');
        await user.tab();

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  describe('Submission and Cancellation', () => {
    it('should call onEditInstructor with updated data on successful submission', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /full name/i })).toHaveValue(mockInstructorToEdit.instructorName);
      });

      // Make changes to the form
      const nameInput = screen.getByRole('textbox', { name: /full name/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Dr. Sarah Johnson-Smith');

      const departmentSelect = screen.getByRole('combobox', { name: /department/i });
      await user.click(departmentSelect);
      await user.click(screen.getByRole('option', { name: 'Mathematics' }));

      // Click the submit button
      const submitButton = screen.getByRole('button', { name: /update instructor/i });
      await user.click(submitButton);

      // Check for submitting state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/updating instructor.../i)).toBeInTheDocument();
      });

      // Check that the callback was called with the correct data
      await waitFor(() => {
        expect(mockOnEditInstructor).toHaveBeenCalledTimes(1);
        expect(mockOnEditInstructor).toHaveBeenCalledWith(
          expect.objectContaining({
            instructorId: mockInstructorToEdit.instructorId, // ID should be preserved
            instructorName: 'Dr. Sarah Johnson-Smith', // New name
            department: 'Mathematics', // New department
            email: mockInstructorToEdit.email, // Unchanged
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
      expect(mockOnEditInstructor).not.toHaveBeenCalled();
    });
  });
});
