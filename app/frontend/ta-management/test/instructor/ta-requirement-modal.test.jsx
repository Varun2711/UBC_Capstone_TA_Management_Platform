import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TARequirementsModal } from '@/components/instructor/ta-requirements-modal';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

// Mock course data matching the new backend integration format
const mockCourse = {
  id: '550e8400-e29b-41d4-a716-446655440101',
  courseCode: 'COSC 121',
  courseTitle: 'Computer Programming II',
  section: '001',
  term: 'Winter Term 1',
  year: 2025,
  hasSubmittedRequirements: false,
  requirements: {
    generalRequirements: []
  }
};

const mockCourseWithRequirements = {
  ...mockCourse,
  hasSubmittedRequirements: true,
  requirements: {
    generalRequirements: [
      'Strong Java programming skills',
      'Experience with debugging concepts'
    ]
  }
};

describe('TARequirementsModal', () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnSubmit;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSubmit = vi.fn();
  });

  describe('Submit new requirements', () => {
    it('renders correctly and allows adding requirements', async () => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourse}
          isEditing={false}
          isSubmitting={false}
        />
      );

      // Check modal title and course info
      expect(screen.getByText('Submit TA Requirements')).toBeInTheDocument();
      expect(screen.getByText('COSC 121 - Computer Programming II')).toBeInTheDocument();
      expect(screen.getByText('001 • Winter Term 1 2025')).toBeInTheDocument();

      // Should show validation message initially
      expect(screen.getByText('Please add at least one TA requirement before submitting.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit requirements/i })).toBeDisabled();

      // Add a requirement
      const input = screen.getByPlaceholderText(/strong python programming skills/i);
      await user.type(input, 'Strong Java programming skills');
      
      const addButton = screen.getByTestId('plus-icon').closest('button');
      await user.click(addButton);

      // Requirement should appear and submit button should be enabled
      expect(screen.getByText('Strong Java programming skills')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit requirements/i })).not.toBeDisabled();
    });

    it('submits requirements correctly', async () => {
      mockOnSubmit.mockResolvedValue();

      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourse}
          isEditing={false}
          isSubmitting={false}
        />
      );

      // Add two requirements
      const input = screen.getByPlaceholderText(/strong python programming skills/i);
      
      await user.type(input, 'Java programming experience');
      await user.keyboard('{enter}');
      
      await user.type(input, 'Good communication skills');
      await user.keyboard('{enter}');

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit requirements/i });
      await user.click(submitButton);

      // Check that onSubmit was called with correct data
      expect(mockOnSubmit).toHaveBeenCalledWith(
        mockCourse.id,
        ['Java programming experience', 'Good communication skills']
      );
    });
  });

  describe('Edit existing requirements', () => {
    it('renders with existing requirements and allows editing', async () => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourseWithRequirements}
          isEditing={true}
          isSubmitting={false}
        />
      );

      // Check modal title
      expect(screen.getByText('Edit TA Requirements')).toBeInTheDocument();

      // Existing requirements should be pre-populated
      expect(screen.getByText('Strong Java programming skills')).toBeInTheDocument();
      expect(screen.getByText('Experience with debugging concepts')).toBeInTheDocument();

      // Update button should be enabled
      expect(screen.getByRole('button', { name: /update requirements/i })).not.toBeDisabled();
    });

    it('allows removing and adding requirements', async () => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourseWithRequirements}
          isEditing={true}
          isSubmitting={false}
        />
      );

      // Remove first requirement
      const removeButtons = screen.getAllByTestId('x-icon').map(icon => icon.closest('button'));
      await user.click(removeButtons[0]);

      expect(screen.queryByText('Strong Java programming skills')).not.toBeInTheDocument();
      expect(screen.getByText('Experience with debugging concepts')).toBeInTheDocument();

      // Add new requirement
      const input = screen.getByPlaceholderText(/strong python programming skills/i);
      await user.type(input, 'Available for evening lab sessions');
      await user.keyboard('{enter}');

      expect(screen.getByText('Available for evening lab sessions')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading state when submitting', () => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourse}
          isEditing={false}
          isSubmitting={true}
        />
      );

      // Should show loading spinner and disabled state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText(/submitting.../i)).toBeInTheDocument();
      
      // Input and buttons should be disabled
      const input = screen.getByPlaceholderText(/strong python programming skills/i);
      expect(input).toBeDisabled();
      
      const submitButton = screen.getByRole('button', { name: /submitting.../i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Modal controls', () => {
    it('closes modal when cancel is clicked', async () => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourse}
          isEditing={false}
          isSubmitting={false}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('returns null when no course is provided', () => {
      const { container } = render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={null}
          isEditing={false}
          isSubmitting={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
