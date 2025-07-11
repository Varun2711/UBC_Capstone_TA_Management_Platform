import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TARequirementsModal } from '@/components/instructor/ta-requirements-modal';

// Mock lucide-react icons for cleaner test output
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
}));

// Mock data for the tests
const mockCourse = {
  id: 'cs101-offering-1',
  courseCode: 'CS101',
  courseTitle: 'Introduction to Programming',
  section: 'A',
  term: 'Fall',
  year: '2025',
};

const mockCourseWithRequirements = {
  ...mockCourse,
  requirements: {
    generalRequirements: ['Knows Python', 'Good communication'],
  },
};

describe('TARequirementsModal', () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnSubmit;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSubmit = vi.fn();
  });

  describe('"Add" Mode (isEditing = false)', () => {
    const renderAddComponent = (props) => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourse}
          isEditing={false}
          {...props}
        />,
      );
    };

    it('should render the correct title and initial state', () => {
      renderAddComponent();
      expect(screen.getByRole('heading', { name: /submit ta requirements/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/strong python programming skills/i)).toBeInTheDocument();
      expect(screen.getByText('Please add at least one TA requirement before submitting.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit requirements/i })).toBeDisabled();
    });

    it('should allow adding and removing requirements', async () => {
        renderAddComponent();
        const input = screen.getByRole('textbox', { name: /add requirement/i });
        
        // Find the add button by its icon's test ID and then find the parent button
        const addButton = screen.getByTestId('plus-icon').closest('button');
  
        // Add a requirement by clicking the button
        await user.type(input, 'First requirement');
        await user.click(addButton);
        expect(await screen.findByText('First requirement')).toBeInTheDocument();
        expect(input).toHaveValue(''); // Input should clear
  
        // Add another requirement by pressing Enter
        await user.type(input, 'Second requirement');
        await user.keyboard('{enter}');
        expect(await screen.findByText('Second requirement')).toBeInTheDocument();
  
        // Submit button should now be enabled
        expect(screen.getByRole('button', { name: /submit requirements/i })).not.toBeDisabled();
  
        // Find remove buttons by their icon's test ID
        const removeIcons = screen.getAllByTestId('x-icon');
        const removeButtons = removeIcons.map(icon => icon.closest('button'));
        
        // Remove the first requirement
        await user.click(removeButtons[0]);
        expect(screen.queryByText('First requirement')).not.toBeInTheDocument();
        expect(screen.getByText('Second requirement')).toBeInTheDocument(); // Second should remain
      });
  

    it('should call onSubmit with the new list of requirements', async () => {
      renderAddComponent();
      const input = screen.getByRole('textbox', { name: /add requirement/i });

      await user.type(input, 'Must be available on Mondays');
      await user.keyboard('{enter}');
      await user.type(input, 'Experience with Git');
      await user.keyboard('{enter}');

      const submitButton = screen.getByRole('button', { name: /submit requirements/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/submitting.../i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(mockCourse.id, ['Must be available on Mondays', 'Experience with Git']);
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('"Edit" Mode (isEditing = true)', () => {
    const renderEditComponent = (props) => {
      render(
        <TARequirementsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          course={mockCourseWithRequirements}
          isEditing={true}
          {...props}
        />,
      );
    };

    it('should render the correct title and pre-populate existing requirements', async () => {
      renderEditComponent();
      expect(screen.getByRole('heading', { name: /edit ta requirements/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Knows Python')).toBeInTheDocument();
        expect(screen.getByText('Good communication')).toBeInTheDocument();
      });
      
      // Submit button should be enabled as there are existing requirements
      expect(screen.getByRole('button', { name: /update requirements/i })).not.toBeDisabled();
    });

    it('should allow editing the list and call onSubmit with the updated list', async () => {
        renderEditComponent();
        await waitFor(() => {
            expect(screen.getByText('Knows Python')).toBeInTheDocument();
        });

        const removeIcons = screen.getAllByTestId('x-icon');
        const removeButtons = removeIcons.map(icon => icon.closest('button'));
        await user.click(removeButtons[0]);
        expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();

        const input = screen.getByRole('textbox', { name: /add requirement/i });
        await user.type(input, 'Familiar with Agile');
        await user.keyboard('{enter}');
        expect(await screen.findByText('Familiar with Agile')).toBeInTheDocument();

        const updateButton = screen.getByRole('button', { name: /update requirements/i });
        await user.click(updateButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            expect(mockOnSubmit).toHaveBeenCalledWith(mockCourse.id, ['Good communication', 'Familiar with Agile']);
        });

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });
  });
});
