import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsFilters } from '@/components/scheduler/instructor-management/requirement-filters';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';




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
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronDown   : () => <div data-testid="chevron-down-icon" />,
  ChevronUp     : () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));



// Mock data for the filters
const mockDepartments = ["Computer Science", "Mathematics", "Physics"];
const mockYears = ["2024", "2025"];
const mockTerms = ["Fall", "Spring"];

describe('RequirementsFilters Component', () => {
  const user = userEvent.setup();
  let onSearchChange, onDepartmentChange, onYearChange, onTermChange;

  // Setup mock functions before each test
  beforeEach(() => {
    onSearchChange = vi.fn();
    onDepartmentChange = vi.fn();
    onYearChange = vi.fn();
    onTermChange = vi.fn();
  });

  const renderComponent = (props) => {
    render(
      <RequirementsFilters
        searchQuery=""
        onSearchChange={onSearchChange}
        selectedDepartment="all"
        onDepartmentChange={onDepartmentChange}
        selectedYear="all"
        onYearChange={onYearChange}
        selectedTerm="all"
        onTermChange={onTermChange}
        departments={mockDepartments}
        years={mockYears}
        terms={mockTerms}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render all inputs and selects with default values', () => {
      renderComponent();

      // Check for the search input
      expect(screen.getByPlaceholderText('Search instructors or courses...')).toBeInTheDocument();

      // Check that all select dropdowns are rendered with their default "All" value
      expect(screen.getByRole('combobox', { name: /department/i })).toHaveTextContent('All Departments');
      expect(screen.getByRole('combobox', { name: /year/i })).toHaveTextContent('All Years');
      expect(screen.getByRole('combobox', { name: /term/i })).toHaveTextContent('All Terms');
    });

    it('should display the default active filters summary', () => {
      renderComponent();
      const summary = screen.getByText(/showing/i);
      
      expect(summary).toHaveTextContent('Showing all departments');
      expect(summary).toHaveTextContent('all years');
      expect(summary).toHaveTextContent('all terms');
    });

    it('should display the specific active filters summary when props are provided', () => {
      renderComponent({
        selectedDepartment: 'Computer Science',
        selectedYear: '2025',
        selectedTerm: 'Fall',
      });

      const summary = screen.getByText(/showing/i);
      
      expect(summary).toHaveTextContent('Showing Computer Science');
      expect(summary).toHaveTextContent('2025');
      expect(summary).toHaveTextContent('Fall');
    });
  });

  describe('User Interaction', () => {
    it('should call onSearchChange when the user types in the search input', async () => {
      renderComponent();
      const searchInput = screen.getByPlaceholderText('Search instructors or courses...');
      
      await user.type(searchInput, 'Dr. Turing');
      
      expect(onSearchChange).toHaveBeenCalled();
      // userEvent.type calls the handler for each character typed
      expect(onSearchChange).toHaveBeenCalledTimes('Dr. Turing'.length);
    });

    it('should call onDepartmentChange when a new department is selected', async () => {
      renderComponent();
      
      // Open the department dropdown
      await user.click(screen.getByRole('combobox', { name: /department/i }));
      
      // Click on the "Mathematics" option
      await user.click(screen.getByRole('option', { name: 'Mathematics' }));
      
      // Check that the callback was called with the correct value
      expect(onDepartmentChange).toHaveBeenCalledTimes(1);
      expect(onDepartmentChange).toHaveBeenCalledWith('Mathematics');
    });

    it('should call onYearChange when a new year is selected', async () => {
      renderComponent();
      
      await user.click(screen.getByRole('combobox', { name: /year/i }));
      await user.click(screen.getByRole('option', { name: '2025' }));
      
      expect(onYearChange).toHaveBeenCalledTimes(1);
      expect(onYearChange).toHaveBeenCalledWith('2025');
    });

    it('should call onTermChange when a new term is selected', async () => {
      renderComponent();
      
      await user.click(screen.getByRole('combobox', { name: /term/i }));
      await user.click(screen.getByRole('option', { name: 'Spring' }));
      
      expect(onTermChange).toHaveBeenCalledTimes(1);
      expect(onTermChange).toHaveBeenCalledWith('Spring');
    });
  });
});
