import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseCard } from '@/components/scheduler/course_management/course-card';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="book-open-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
}));

// Mock TermSection component
vi.mock('@/components/scheduler/course_management/term-section', () => ({
  TermSection: ({ termKey, termOfferings }) => (
    <div data-testid={`term-section-${termKey}`}>
      Term {termKey} - {termOfferings.length} offerings
    </div>
  ),
}));

describe('CourseCard', () => {
  const mockCourse = {
    id: 'course1',
    code: 'CS101',
    title: 'Introduction to Computer Science',
    department: 'Computer Science',
    description: 'A foundational course in programming.',
    offerings: [
      { id: '1', term: 'Fall 2025', year: '2025', section: 'A01' },
      { id: '2', term: 'Winter 2025', year: '2025', section: 'B01' },
    ],
    sharedSessions: {},
  };

  let mockOnToggle;
  let mockOnEdit;
  let mockOnDelete;
  let mockOnAddOffering;
  let mockOnToggleOffering;
  let mockOnToggleLabSection;

  beforeEach(() => {
    mockOnToggle = vi.fn();
    mockOnEdit = vi.fn();
    mockOnDelete = vi.fn();
    mockOnAddOffering = vi.fn();
    mockOnToggleOffering = vi.fn();
    mockOnToggleLabSection = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <CourseCard
        course={mockCourse}
        isExpanded={false}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddOffering={mockOnAddOffering}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
        visibleOfferingsCount={2}
        selectedYear="all"
        {...props}
      />
    );
  };

  it('renders course header when collapsed', () => {
    renderComponent();

    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('2 Offerings')).toBeInTheDocument();
    expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
    
    // Should not show expanded content
    expect(screen.queryByText('A foundational course in programming.')).not.toBeInTheDocument();
    expect(screen.queryByTestId('term-section-Fall 2025')).not.toBeInTheDocument();
  });

  it('renders course content when expanded', () => {
    renderComponent({ isExpanded: true });

    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    
    // Should show expanded content
    expect(screen.getByText('A foundational course in programming.')).toBeInTheDocument();
    expect(screen.getByText('Course Terms')).toBeInTheDocument();
    expect(screen.getByTestId('term-section-Fall 2025')).toBeInTheDocument();
    expect(screen.getByTestId('term-section-Winter 2025')).toBeInTheDocument();
  });

  it('toggles expansion when header is clicked', async () => {
    renderComponent();

    const header = screen.getByText('CS101 - Introduction to Computer Science').closest('div[data-state]');
    await userEvent.click(header);
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('shows dropdown menu options', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('more-horizontal-icon'));
    
    expect(screen.getByText('Edit Course')).toBeInTheDocument();
    expect(screen.getByText('Add Offering')).toBeInTheDocument();
    expect(screen.getByText('Add Lab/Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Delete Course')).toBeInTheDocument();
  });

  it('calls onEdit when Edit Course is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('more-horizontal-icon'));
    await userEvent.click(screen.getByText('Edit Course'));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onAddOffering when Add Offering is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('more-horizontal-icon'));
    await userEvent.click(screen.getByText('Add Offering'));
    
    expect(mockOnAddOffering).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onDelete when Delete Course is clicked', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('more-horizontal-icon'));
    await userEvent.click(screen.getByText('Delete Course'));
    
    expect(mockOnDelete).toHaveBeenCalledWith('course1');
  });

  it('displays correct offerings count', () => {
    renderComponent({ visibleOfferingsCount: 1 });
    
    expect(screen.getByText('1 Offering')).toBeInTheDocument();
  });

  it('shows empty state when no offerings', () => {
    const emptyCourse = { ...mockCourse, offerings: [] };
    renderComponent({ course: emptyCourse, isExpanded: true, visibleOfferingsCount: 0 });

    expect(screen.getByText('No terms match the current filters.')).toBeInTheDocument();
    expect(screen.getByText('Add First Offering')).toBeInTheDocument();
  });

  it('calls onAddOffering when Add First Offering is clicked', async () => {
    const emptyCourse = { ...mockCourse, offerings: [] };
    renderComponent({ course: emptyCourse, isExpanded: true, visibleOfferingsCount: 0 });

    await userEvent.click(screen.getByText('Add First Offering'));
    
    expect(mockOnAddOffering).toHaveBeenCalledWith(emptyCourse);
  });

  it('does not render description when empty', () => {
    const noDescCourse = { ...mockCourse, description: '' };
    renderComponent({ course: noDescCourse, isExpanded: true });

    expect(screen.queryByText('A foundational course in programming.')).not.toBeInTheDocument();
    expect(screen.getByText('Course Terms')).toBeInTheDocument();
  });

  it('shows all offerings when selectedYear is "all"', () => {
    const courseWithMultipleYears = {
      ...mockCourse,
      offerings: [
        { id: '1', term: 'Fall 2025', year: '2025', section: 'A01' },
        { id: '2', term: 'Fall 2024', year: '2024', section: 'A01' },
      ]
    };
    
    renderComponent({ 
      course: courseWithMultipleYears, 
      isExpanded: true, 
      selectedYear: 'all' 
    });

    // Should show both terms
    expect(screen.getByText(/Fall 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Fall 2024/)).toBeInTheDocument();
  });
});