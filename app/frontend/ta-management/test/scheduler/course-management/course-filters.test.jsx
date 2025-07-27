import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseFilters } from '@/components/scheduler/course_management/course-filters';
import { ChevronUp } from 'lucide-react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  Check: () => <span data-testid="check-icon" />,
  ChevronUp: () => <span data-testid="chevron-up-icon" />,
}));

describe('CourseFilters', () => {
  let mockOnSearchChange;
  let mockOnDepartmentChange;
  let mockOnYearChange;
  let mockOnTermChange;

  beforeEach(() => {
    mockOnSearchChange = vi.fn();
    mockOnDepartmentChange = vi.fn();
    mockOnYearChange = vi.fn();
    mockOnTermChange = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <CourseFilters
        searchQuery=""
        selectedDepartment="all"
        selectedYear="all"
        selectedTerm="all"
        departments={['Computer Science', 'Mathematics']}
        years={['2024', '2025']}
        terms={['Fall', 'Winter']}
        onSearchChange={mockOnSearchChange}
        onDepartmentChange={mockOnDepartmentChange}
        onYearChange={mockOnYearChange}
        onTermChange={mockOnTermChange}
        {...props}
      />
    );
  };

  it('renders search input and filter dropdowns', () => {
    renderComponent();

    expect(screen.getByPlaceholderText(/Search courses/)).toBeInTheDocument();
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Years')).toBeInTheDocument();
    expect(screen.getByText('All Terms')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search courses/);
    fireEvent.change(searchInput, { target: { value: 'CS' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('CS');
  });

  it('displays current search value', () => {
    renderComponent({ searchQuery: 'Math' });

    expect(screen.getByDisplayValue('Math')).toBeInTheDocument();
  });

  it('opens department dropdown and selects option', async () => {
    renderComponent();

    // Click dropdown trigger
    fireEvent.click(screen.getByText('All Departments'));

    // Should show options
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();

    // Select option
    fireEvent.click(screen.getByText('Computer Science'));
    expect(mockOnDepartmentChange).toHaveBeenCalledWith('Computer Science');
  });

  it('opens year dropdown and selects option', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('All Years'));
    expect(screen.getByText('2024')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('2024'));
    expect(mockOnYearChange).toHaveBeenCalledWith('2024');
  });

  it('opens term dropdown and selects option', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('All Terms'));
    expect(screen.getByText('Fall')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Fall'));
    expect(mockOnTermChange).toHaveBeenCalledWith('Fall');
  });

  it('displays selected values', () => {
    renderComponent({
      selectedDepartment: 'Computer Science',
      selectedYear: '2024',
      selectedTerm: 'Fall'
    });

    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('Fall')).toBeInTheDocument();
  });

  it('shows filter summary', () => {
    renderComponent();
    expect(screen.getByText(/Showing all departments/)).toBeInTheDocument();
  });

  it('handles empty arrays', () => {
    renderComponent({
      departments: [],
      years: [],
      terms: []
    });

    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Years')).toBeInTheDocument();
    expect(screen.getByText('All Terms')).toBeInTheDocument();
  });
});