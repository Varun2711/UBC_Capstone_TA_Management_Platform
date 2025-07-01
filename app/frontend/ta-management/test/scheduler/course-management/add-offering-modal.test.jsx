import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddOfferingModal } from '@/components/scheduler/course_management/add-offering-modal';
import { ChevronDown, ChevronUp, X } from 'lucide-react';


// Mock JSDOM browser APIs that are not implemented
const ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserver);

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock lucide-react icons for cleaner test output
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChevronsUpDown: () => <div data-testid="chevrons-icon" />,
  X: () => <div data-testid="x-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
    Search: () => <div data-testid="search-icon" />,
    ChevronUp: () => <div data-testid="chevron-up-icon" />,
}));

// Mock professor data to control the test environment
vi.mock('@/data/mock-professors', () => ({
  mockProfessors: [
    { id: 'prof1', name: 'Dr. Alan Turing', email: 'alan.turing@example.com', department: 'Computer Science', title: 'Professor' },
    { id: 'prof2', name: 'Dr. Grace Hopper', email: 'grace.hopper@example.com', department: 'Computer Science', title: 'Associate Professor' },
    { id: 'prof3', name: 'Dr. Albert Einstein', email: 'albert.einstein@example.com', department: 'Physics', title: 'Professor Emeritus' },
  ],
}));

// Mock data for the course and its existing offerings
const mockCourse = {
  id: 'cs101',
  code: 'CS 101',
  title: 'Introduction to Programming',
  department: 'Computer Science',
};

const mockExistingOfferings = [
  { id: 'offering1', year: '2025', term: 'Winter Term 1', section: 'Section A' },
];


describe('AddOfferingModal', () => {
  const user = userEvent.setup();
  let mockOnClose;
  let mockOnAddOffering;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnClose = vi.fn();
    mockOnAddOffering = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props) => {
    render(
      <AddOfferingModal
        isOpen={true}
        onClose={mockOnClose}
        onAddOffering={mockOnAddOffering}
        course={mockCourse}
        existingOfferings={mockExistingOfferings}
        {...props}
      />,
    );
  };

  describe('Rendering', () => {
    it('should render the modal with correct initial data', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /add course offering/i })).toBeInTheDocument();
      expect(screen.getAllByText(`${mockCourse.code} - ${mockCourse.title}`)).toHaveLength(2);
      expect(screen.getByText(mockCourse.department)).toBeInTheDocument();
      expect(screen.getByText(/1 existing offering/i)).toBeInTheDocument();

      // These queries now work because of the `id` attributes on the triggers
      expect(screen.getByRole('combobox', { name: /academic year/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /term/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /instructor/i })).toBeInTheDocument();

      expect(screen.getByRole('textbox', { name: /section/i })).toHaveValue('');
      expect(screen.queryByRole('button', { name: /suggest/i })).not.toBeInTheDocument();
    });
  });

  describe('Validation and Interaction', () => {
    it('should show required field errors when form is submitted empty', async () => {
      renderComponent();
      await user.click(screen.getByRole('button', { name: /add offering/i }));

      expect(await screen.findAllByTestId('alert-icon')).toHaveLength(5);
      expect(screen.getByText('Year is required')).toBeInTheDocument();
      expect(screen.getByText('Term is required')).toBeInTheDocument();
      expect(screen.getByText('Instructor is required')).toBeInTheDocument();
      expect(screen.getByText('Section is required')).toBeInTheDocument();
      expect(mockOnAddOffering).not.toHaveBeenCalled();
    });

    it('should filter the professor list and allow selection', async () => {
        renderComponent();
      
        // Open the professor selection popover
        await user.click(screen.getByRole('combobox', { name: /instructor/i }));
      
        const list = screen.getByRole('listbox');
        const searchInput = screen.getByPlaceholderText(/search professors.../i);
      
        // Type into the search input to trigger the internal filter
        await user.type(searchInput, 'Grace');
        
        // Use `waitFor` to allow the list to re-render after filtering
        await waitFor(() => {
          // This assertion now runs after the DOM has updated
          expect(within(list).queryByText('Dr. Alan Turing')).not.toBeInTheDocument();
        });
      
        // You can assert the positive case separately or within the same waitFor
        expect(within(list).getByText('Dr. Grace Hopper')).toBeInTheDocument();
      
        // Select the filtered professor
        await user.click(within(list).getByText('Dr. Grace Hopper'));
      
        // Assert the popover closed and the value was updated
        expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent('Dr. Grace Hopper');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

    it('should show and use the section suggestion button', async () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /suggest/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: /academic year/i }));
      await user.click(screen.getByRole('option', { name: '2025' }));

      await user.click(screen.getByRole('combobox', { name: /term/i }));
      await user.click(screen.getByRole('option', { name: 'Winter Term 1' }));

      const suggestButton = screen.getByRole('button', { name: /suggest/i });
      expect(suggestButton).toBeInTheDocument();

      await user.click(suggestButton);
      expect(screen.getByRole('textbox', { name: /section/i })).toHaveValue('Section B');
    });

    it('should show an error for a duplicate section in the same term/year', async () => {
      renderComponent();
      await user.click(screen.getByRole('combobox', { name: /academic year/i }));
      await user.click(screen.getByRole('option', { name: '2025' }));
      await user.click(screen.getByRole('combobox', { name: /term/i }));
      await user.click(screen.getByRole('option', { name: 'Winter Term 1' }));

      const sectionInput = screen.getByRole('textbox', { name: /section/i });
      await user.type(sectionInput, 'Section A');
      await user.tab();

      expect(await screen.findByText(/section "section a" already exists/i)).toBeInTheDocument();
    });
  });

  describe('Submission and Cancellation', () => {
    it('should call onAddOffering with correctly formatted data on success', async () => {
      renderComponent();

      // Fill out the form validly
      await user.click(screen.getByRole('combobox', { name: /academic year/i }));
      await user.click(screen.getByRole('option', { name: '2026' }));
      
      await user.click(screen.getByRole('combobox', { name: /term/i }));
      await user.click(screen.getByRole('option', { name: 'Winter Term 2' }));

      await user.click(screen.getByRole('combobox', { name: /instructor/i }));
      await user.click(screen.getByText('Dr. Grace Hopper'));

      await user.type(screen.getByRole('textbox', { name: /section/i }), 'Section C');
      await user.type(screen.getByRole('textbox', { name: /special requirements/i }), 'Requires lab access, PhD student preferred');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /add offering/i });
      await user.click(submitButton);

      // Check for submitting state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/adding offering.../i)).toBeInTheDocument();
      });

      // Check that callbacks were called with correct data
      await waitFor(() => {
        expect(mockOnAddOffering).toHaveBeenCalledTimes(1);
        expect(mockOnAddOffering).toHaveBeenCalledWith(mockCourse.id, 
            expect.objectContaining({
                year: '2026',
                term: 'Winter Term 2',
                instructor: 'Dr. Grace Hopper',
                section: 'Section C',
                requirements: {
                    specialRequirements: ['Requires lab access', 'PhD student preferred']
                }
            })
        );
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      renderComponent();
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnAddOffering).not.toHaveBeenCalled();
    });
  });
});