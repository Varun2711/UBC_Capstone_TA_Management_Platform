import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditOfferingModal } from '@/components/scheduler/course_management/edit-offering-modal';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';


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
  Edit: () => <div data-testid="edit-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Check: () => <div data-testid="check-icon" />,
  ChevronsUpDown: () => <div data-testid="chevrons-icon" />,
  X: () => <div data-testid="x-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Search: () => <div data-testid="search-icon" />,
}));

vi.mock('@/data/mock-professors.json', () => {
    return {
      default: [
        { id: "prof-001", name: "Dr. Sarah Johnson", department: "Computer Science", email: "s.johnson@university.edu", title: "Associate Professor" },
        { id: "prof-002", name: "Dr. Michael Chen", department: "Computer Science", email: "m.chen@university.edu", title: "Professor" },
        { id: "prof-003", name: "Prof. Lisa Anderson", department: "Mathematics", email: "l.anderson@university.edu", title: "Professor" },
        { id: "prof-004", name: "Dr. James Williams", department: "Mathematics", email: "j.williams@university.edu", title: "Assistant Professor" },
        { id: "prof-005", name: "Dr. Robert Taylor", department: "Physics", email: "r.taylor@university.edu", title: "Professor" },
        { id: "prof-006", name: "Dr. Emily Davis", department: "Computer Science", email: "e.davis@university.edu", title: "Assistant Professor" },
        { id: "prof-007", name: "Prof. David Wilson", department: "Engineering", email: "d.wilson@university.edu", title: "Professor" },
        { id: "prof-008", name: "Dr. Jennifer Brown", department: "Chemistry", email: "j.brown@university.edu", title: "Associate Professor" },
        { id: "prof-009", name: "Dr. Mark Thompson", department: "Biology", email: "m.thompson@university.edu", title: "Professor" },
        { id: "prof-010", name: "Dr. Amanda Garcia", department: "Physics", email: "a.garcia@university.edu", title: "Assistant Professor" },
        { id: "prof-011", name: "Prof. Christopher Lee", department: "Engineering", email: "c.lee@university.edu", title: "Associate Professor" },
        { id: "prof-012", name: "Dr. Michelle Rodriguez", department: "Mathematics", email: "m.rodriguez@university.edu", title: "Assistant Professor" },
        { id: "prof-013", name: "Dr. Kevin Martinez", department: "Computer Science", email: "k.martinez@university.edu", title: "Professor" },
        { id: "prof-014", name: "Prof. Rachel Kim", department: "Chemistry", email: "r.kim@university.edu", title: "Associate Professor" },
        { id: "prof-015", name: "Dr. Steven Park", department: "Biology", email: "s.park@university.edu", title: "Assistant Professor" },
      ]
    };
  });

// Mock data for the tests
const mockCourse = {
  id: 'cs101',
  code: 'CS 101',
  title: 'Introduction to Programming',
  department: 'Computer Science',
};

const mockOfferingToEdit = {
  id: 'offering1',
  year: '2025',
  term: 'Winter Term 1',
  section: 'Section A',
  instructor: 'Dr. Sarah Johnson',
  requirements: {
    specialRequirements: ['PhD student preferred'],
  },
};

const otherExistingOfferings = [
  { id: 'offering2', year: '2025', term: 'Winter Term 1', section: 'Section B' },
];



describe('EditOfferingModal', () => {
    const user = userEvent.setup();
    let mockOnClose;
    let mockOnEditOffering;
  
    beforeEach(() => {
      mockOnClose = vi.fn();
      mockOnEditOffering = vi.fn();
      vi.clearAllMocks();
    });
  
    const renderComponent = (props) => {
      render(
        <EditOfferingModal
          isOpen={true}
          onClose={mockOnClose}
          onEditOffering={mockOnEditOffering}
          course={mockCourse}
          offering={mockOfferingToEdit}
          existingOfferings={[mockOfferingToEdit, ...otherExistingOfferings]}
          {...props}
        />,
      );
    };
  
    describe('Rendering and Initialization', () => {
      it('should populate the form with the offering data when opened', async () => {
          renderComponent();
        
          expect(screen.getByRole('heading', { name: /edit course offering/i })).toBeInTheDocument();
          expect(screen.getByText(/editing: section a/i)).toBeInTheDocument();
        
          await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /academic year/i })).toHaveTextContent(mockOfferingToEdit.year);
            expect(screen.getByRole('combobox', { name: /term/i })).toHaveTextContent(mockOfferingToEdit.term);
            // This assertion will now correctly check for the updated instructor name
            expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
            expect(screen.getByRole('textbox', { name: /section/i })).toHaveValue(mockOfferingToEdit.section);
            expect(screen.getByRole('textbox', { name: /special requirements/i })).toHaveValue('PhD student preferred');
          });
        });
    });
  
    describe('Interaction and Validation', () => {
      it('should enable the "Update Offering" button when a change is made', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
        });
        const sectionInput = screen.getByRole('textbox', { name: /section/i });
        await user.type(sectionInput, 'X');
        
        expect(screen.getByRole('button', { name: /update offering/i })).not.toBeDisabled();
      });
  
      it('should disable the button again if changes are reverted', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
        });
        const sectionInput = screen.getByRole('textbox', { name: /section/i });
  
        await user.type(sectionInput, 'X');
        expect(screen.getByRole('button', { name: /update offering/i })).not.toBeDisabled();
  
        await user.clear(sectionInput);
        await user.type(sectionInput, mockOfferingToEdit.section);
        expect(screen.getByRole('button', { name: /update offering/i })).toBeDisabled();
      });
  
      it('should show an error for a duplicate section name that exists in another offering', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
        });
        const sectionInput = screen.getByRole('textbox', { name: /section/i });
  
        await user.clear(sectionInput);
        await user.type(sectionInput, 'Section B');
        await user.tab();
  
        expect(await screen.findByText(/section "section b" already exists/i)).toBeInTheDocument();
      });
  
      it('should NOT show a duplicate error for the original section name', async () => {
          renderComponent();
          await waitFor(() => {
              expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
          });
          const sectionInput = screen.getByRole('textbox', { name: /section/i });
          await user.type(sectionInput, ' ');
          await user.tab();
          
          expect(screen.queryByText(/section "section a" already exists/i)).not.toBeInTheDocument();
        });
    });
  
    describe('Submission and Cancellation', () => {
      it('should call onEditOffering with updated data on successful submission', async () => {
        renderComponent();
  
        await waitFor(() => {
            expect(screen.getByRole('combobox', { name: /instructor/i })).toHaveTextContent(mockOfferingToEdit.instructor);
        });
  
        const instructorCombobox = screen.getByRole('combobox', { name: /instructor/i });
        await user.click(instructorCombobox);
        // Update this click to use a name from the new mock data
        await user.click(screen.getByText('Dr. Michael Chen'));
  
        const sectionInput = screen.getByRole('textbox', { name: /section/i });
        await user.clear(sectionInput);
        await user.type(sectionInput, 'Section Z');
  
        const submitButton = screen.getByRole('button', { name: /update offering/i });
        await user.click(submitButton);
  
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
          expect(screen.getByText(/updating offering.../i)).toBeInTheDocument();
        });
  
        await waitFor(() => {
          expect(mockOnEditOffering).toHaveBeenCalledTimes(1);
          expect(mockOnEditOffering).toHaveBeenCalledWith(mockCourse.id, 
              expect.objectContaining({
                  id: mockOfferingToEdit.id,
                  // Update assertion to match the new selection
                  instructor: 'Dr. Michael Chen',
                  section: 'Section Z',
                  year: mockOfferingToEdit.year,
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
        expect(mockOnEditOffering).not.toHaveBeenCalled();
      });
    });
  });
  