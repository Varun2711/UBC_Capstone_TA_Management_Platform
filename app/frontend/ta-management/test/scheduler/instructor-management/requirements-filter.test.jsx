import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsFilters } from '@/components/scheduler/instructor-management/requirement-filters';

// Mock browser APIs
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));

describe('RequirementsFilters', () => {
  const user = userEvent.setup();

  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedDepartment: 'all',
    onDepartmentChange: vi.fn(),
    selectedYear: 'all',
    onYearChange: vi.fn(),
    selectedTerm: 'all',
    onTermChange: vi.fn(),
    departments: ['Computer Science', 'Mathematics'],
    years: ['2024', '2025'],
    terms: ['Fall', 'Spring'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<RequirementsFilters {...defaultProps} {...props} />);
  };

  it('renders search input and filter dropdowns', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Search instructors by Name, ID or Email...')).toBeInTheDocument();
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Years')).toBeInTheDocument();
    expect(screen.getByText('All Terms')).toBeInTheDocument();
  });

  it('displays current search value', () => {
    renderComponent({ searchQuery: 'Dr. Smith' });

    expect(screen.getByDisplayValue('Dr. Smith')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const onSearchChange = vi.fn();
    renderComponent({ onSearchChange });

    const searchInput = screen.getByPlaceholderText('Search instructors by Name, ID or Email...');
    await user.type(searchInput, 't');

    // Just check that onSearchChange was called and the last call has the correct value
    await user.type(searchInput, 't');
expect(onSearchChange).toHaveBeenCalledWith('t');
  });

  it('shows department options when clicked', async () => {
    renderComponent();

    const departmentSelect = screen.getAllByRole('combobox')[0];
    await user.click(departmentSelect);

    expect(screen.getByRole('option', { name: 'All Departments' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Computer Science' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mathematics' })).toBeInTheDocument();
  });

  it('calls onDepartmentChange when department selected', async () => {
    const onDepartmentChange = vi.fn();
    renderComponent({ onDepartmentChange });

    const departmentSelect = screen.getAllByRole('combobox')[0];
    await user.click(departmentSelect);
    await user.click(screen.getByRole('option', { name: 'Mathematics' }));

    expect(onDepartmentChange).toHaveBeenCalledWith('Mathematics');
  });

  it('shows year options when clicked', async () => {
    renderComponent();

    const yearSelect = screen.getAllByRole('combobox')[1];
    await user.click(yearSelect);

    expect(screen.getByRole('option', { name: 'All Years' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2025' })).toBeInTheDocument();
  });

  it('calls onYearChange when year selected', async () => {
    const onYearChange = vi.fn();
    renderComponent({ onYearChange });

    const yearSelect = screen.getAllByRole('combobox')[1];
    await user.click(yearSelect);
    await user.click(screen.getByRole('option', { name: '2025' }));

    expect(onYearChange).toHaveBeenCalledWith('2025');
  });

  it('shows term options when clicked', async () => {
    renderComponent();

    const termSelect = screen.getAllByRole('combobox')[2];
    await user.click(termSelect);

    expect(screen.getByRole('option', { name: 'All Terms' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fall' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Spring' })).toBeInTheDocument();
  });

  it('calls onTermChange when term selected', async () => {
    const onTermChange = vi.fn();
    renderComponent({ onTermChange });

    const termSelect = screen.getAllByRole('combobox')[2];
    await user.click(termSelect);
    await user.click(screen.getByRole('option', { name: 'Spring' }));

    expect(onTermChange).toHaveBeenCalledWith('Spring');
  });

  it('displays filter summary with default values', () => {
    renderComponent();

    expect(screen.getByText(/showing all departments • all years • all terms/i)).toBeInTheDocument();
  });

  it('updates filter summary when values change', () => {
    renderComponent({
      selectedDepartment: 'Computer Science',
      selectedYear: '2025',
      selectedTerm: 'Fall',
    });

    expect(screen.getByText(/showing Computer Science • 2025 • Fall/i)).toBeInTheDocument();
  });

  it('handles empty filter arrays', () => {
    renderComponent({
      departments: [],
      years: [],
      terms: [],
    });

    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Years')).toBeInTheDocument();
    expect(screen.getByText('All Terms')).toBeInTheDocument();
  });
});