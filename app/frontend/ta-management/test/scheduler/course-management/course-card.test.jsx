import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CourseCard } from '@/components/scheduler/course_management/course-card';
import { BookOpen, ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="book-open-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <svg data-testid="more-horizontal-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
}));

// Mock TermSection component
vi.mock('@/components/scheduler/course_management/term-section', () => ({
  TermSection: ({ termKey, termOfferings }) => (
    <div data-testid={`term-section-${termKey}`}>
      Term {termKey} - {termOfferings.length} offerings
    </div>
  ),
}));

describe('CourseCard Component', () => {
  const user = userEvent.setup();
  const mockCourse = {
    id: 'course1',
    code: 'CS101',
    title: 'Introduction to Computer Science',
    department: 'Computer Science',
    description: 'A foundational course in programming.',
    offerings: [
      { id: '1', term: 'Fall', year: '2025', section: 'A' },
      { id: '2', term: 'Spring', year: '2025', section: 'B' },
    ],
    sharedSessions: {},
  };
  const mockOnToggle = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleOffering = vi.fn();
  const mockOnToggleLabSection = vi.fn();
  const mockOnAddOffering = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course header with code, title, department, and icons when collapsed', () => {
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
      />
    );
    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
    expect(screen.queryByText('A foundational course in programming.')).not.toBeInTheDocument();
    expect(screen.queryByTestId('term-section-Fall-2025')).not.toBeInTheDocument();
  });

  it('renders course description and TermSection components when expanded', () => {
    render(
      <CourseCard
        course={mockCourse}
        isExpanded={true}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddOffering={mockOnAddOffering}
        expandedOfferings={new Set(['1'])}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
        visibleOfferingsCount={2}
      />
    );
    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    expect(screen.getByText('A foundational course in programming.')).toBeInTheDocument();
    expect(screen.getByTestId('term-section-Fall-2025')).toHaveTextContent('Term Fall-2025 - 1 offerings');
    expect(screen.getByTestId('term-section-Spring-2025')).toHaveTextContent('Term Spring-2025 - 1 offerings');
  });

  it('toggles collapsible state when clicking header', async () => {
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
      />
    );
    const header = screen.getByText('CS101 - Introduction to Computer Science').closest('div[aria-expanded]');
    await user.click(header);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when Edit Course is clicked in dropdown', async () => {
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
      />
    );
    await user.click(screen.getByTestId('more-horizontal-icon'));
    await user.click(screen.getByText('Edit Course'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when Delete Course is clicked in dropdown', async () => {
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
      />
    );
    await user.click(screen.getByTestId('more-horizontal-icon'));
    await user.click(screen.getByText('Delete Course'));
    expect(mockOnDelete).toHaveBeenCalledWith('course1');
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles to collapsible trigger', () => {
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
      />
    );
    const header = screen.getByText('CS101 - Introduction to Computer Science').closest('div[aria-expanded]');
    expect(header).toHaveClass('hover:bg-muted/50');
  });

  it('renders no TermSection components when offerings is empty', () => {
    const emptyCourse = { ...mockCourse, offerings: [] };
    render(
      <CourseCard
        course={emptyCourse}
        isExpanded={true}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddOffering={mockOnAddOffering}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
        visibleOfferingsCount={0}
      />
    );
    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('A foundational course in programming.')).toBeInTheDocument();
    expect(screen.queryByTestId(/term-section-/)).not.toBeInTheDocument();
  });

  it('renders without description when course.description is empty', () => {
    const noDescCourse = { ...mockCourse, description: '' };
    render(
      <CourseCard
        course={noDescCourse}
        isExpanded={true}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddOffering={mockOnAddOffering}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
        visibleOfferingsCount={2}
      />
    );
    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.queryByText('A foundational course in programming.')).not.toBeInTheDocument();
    expect(screen.getByTestId('term-section-Fall-2025')).toBeInTheDocument();
  });

  it('displays the visible offerings count from props', () => {
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
        // Pass a different number than the total offerings to test this specifically
        visibleOfferingsCount={1} 
      />
    );

    // The mockCourse has 2 offerings, but we passed visibleOfferingsCount={1}
    // This simulates a filter being applied on the parent page.
    expect(screen.getByText('1 Offering')).toBeInTheDocument();
  });

  it('calls onAddOffering when "Add Offering" is clicked in dropdown', async () => {
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
      />,
    );

    // Open the dropdown menu
    await user.click(screen.getByTestId('more-horizontal-icon'));

    // Click the "Add Offering" menu item
    await user.click(screen.getByRole('menuitem', { name: /add offering/i }));

    // Assert that the callback was called with the correct course data
    expect(mockOnAddOffering).toHaveBeenCalledWith(mockCourse);
    expect(mockOnAddOffering).toHaveBeenCalledTimes(1);
  });

  it('shows "Add First Offering" button and calls onAddOffering on click when course has no offerings', async () => {
    // Create a version of the mock course with an empty offerings array
    const courseWithNoOfferings = { ...mockCourse, offerings: [] };

    render(
      <CourseCard
        course={courseWithNoOfferings}
        isExpanded={true} // The card must be expanded to see this button
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddOffering={mockOnAddOffering}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
        visibleOfferingsCount={0}
      />,
    );

    // Check that the empty state message and button are visible
    expect(screen.getByText('This course currently has no offerings.')).toBeInTheDocument();
    const addFirstButton = screen.getByRole('button', { name: /add first offering/i });
    expect(addFirstButton).toBeInTheDocument();

    // Click the button
    await user.click(addFirstButton);

    // Assert that the callback was called with the correct course data
    expect(mockOnAddOffering).toHaveBeenCalledWith(courseWithNoOfferings);
    expect(mockOnAddOffering).toHaveBeenCalledTimes(1);
  });


});