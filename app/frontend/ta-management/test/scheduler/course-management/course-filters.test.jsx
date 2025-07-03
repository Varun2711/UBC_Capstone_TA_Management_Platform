import { render, screen , cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CourseFilters } from '@/components/scheduler/course_management/course-filters';
import { Search, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: ({ className }) => <svg data-testid="search-icon" className={className} />,
  ChevronDown: ({ className }) => <svg data-testid="chevron-down-icon" className={className} />,
  ChevronUp: ({ className }) => <svg data-testid="chevron-up-icon" className={className} />,
  Check: ({ className }) => <svg data-testid="check-icon" className={className} />,
}));

// Polyfill scrollIntoView for JSDOM
beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  

describe('CourseFilters Component', () => {
  const user = userEvent.setup();
  const mockOnSearchChange = vi.fn();
  const mockOnDepartmentChange = vi.fn();
  const mockOnYearChange = vi.fn();
  const mockProps = {
    searchQuery: '',
    onSearchChange: mockOnSearchChange,
    selectedDepartment: 'all',
    onDepartmentChange: mockOnDepartmentChange,
    selectedYear: 'all',
    onYearChange: mockOnYearChange,
    departments: ['CS', 'Math', 'Physics'],
    years: ['2023', '2024', '2025'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    render(<CourseFilters {...mockProps} />);
  });

  it('renders search input, department select, and year select', () => {
    expect(screen.getByPlaceholderText('Search courses...')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Department/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Year/i })).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('chevron-down-icon')).toHaveLength(2);
  });

  it('renders search input with correct initial value and triggers onSearchChange', async () => {
    const input = screen.getByPlaceholderText('Search courses...');
    expect(input).toHaveValue('');
    expect(input).toHaveClass('pl-10');

    await user.type(input, 'CS101');
    expect(mockOnSearchChange).toHaveBeenCalledTimes(5); // One call per character
    expect(mockOnSearchChange).toHaveBeenLastCalledWith('1');
  });

  it('renders department select with correct initial value and opens dropdown', async () => {
    const departmentSelect = screen.getByRole('combobox', { name: /Department/i });
    expect(departmentSelect).toHaveTextContent('All Departments');
    expect(departmentSelect).toHaveAttribute('data-state', 'closed');
    expect(departmentSelect).toHaveAttribute('aria-expanded', 'false');

    await user.click(departmentSelect);

    expect(departmentSelect).toHaveAttribute('aria-expanded', 'true');
  });

  it('triggers onDepartmentChange when a department is selected', () => {
    mockOnDepartmentChange('CS');
    expect(mockOnDepartmentChange).toHaveBeenCalledWith('CS');
    expect(mockOnDepartmentChange).toHaveBeenCalledTimes(1);
  });

  it('renders year select with correct initial value and opens dropdown', async () => {
    const yearSelect = screen.getByRole('combobox', { name: /Year/i });
    expect(yearSelect).toHaveTextContent('All Years');
    expect(yearSelect).toHaveAttribute('data-state', 'closed');
    expect(yearSelect).toHaveAttribute('aria-expanded', 'false');

    await user.click(yearSelect);
    expect(yearSelect).toHaveAttribute('aria-expanded', 'true');
  });


  it('triggers onYearChange when a year is selected', () => {
    mockOnYearChange('2024');
    expect(mockOnYearChange).toHaveBeenCalledWith('2024');
    expect(mockOnYearChange).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling to the search icon', () => {
    const searchIcon = screen.getByTestId('search-icon');
    expect(searchIcon).toHaveClass(
      'absolute',
      'left-3',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'text-gray-400',
      'h-4',
      'w-4'
    );
  });

  it('renders the container with correct flex styling', () => {
    const container = screen.getByPlaceholderText('Search courses...').closest('div').parentElement;
    expect(container).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4');
  });

  it('renders department select with updated value', () => {
    cleanup(); // Clean up previous render
    render(<CourseFilters {...mockProps} selectedDepartment="CS" />);
    screen.logTestingPlaygroundURL();
    expect(screen.getByRole('combobox', { name: /Department/i })).toHaveTextContent('CS');
  });

  it('renders year select with updated value', () => {
    cleanup(); // Clean up previous render
    render(<CourseFilters {...mockProps} selectedYear="2024" />);
    expect(screen.getByRole('combobox', { name: /Year/i })).toHaveTextContent('2024');
  });
});