import { render, screen, fireEvent} from '@testing-library/react';
import { expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { OfferingCard } from '@/components/scheduler/course_management/offering-card';
import { ChevronDown, ChevronRight, MoreHorizontal, FileText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <svg data-testid="more-horizontal-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
}));

// Mock the sidebar component (kept from UserProfile tests)
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mocked Sidebar</div>,
}));

describe('OfferingCard Component', () => {
  const user = userEvent.setup();
  const mockOffering = {
    section: 'CS101',
    instructor: 'Dr. Smith',
    requirements: {
      specialRequirements: ['Python', 'Database'],
    },
  };
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    render(
      <OfferingCard
        offering={mockOffering}
        isExpanded={false}
        onToggle={mockOnToggle}
      />
    );
  });
  
  it('renders the card with section and instructor', () => {
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('renders collapsed state with ChevronRight icon by default', () => {
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.queryByText('TA Requirements - CS101')).not.toBeInTheDocument();
  });

  it('renders expanded state with ChevronDown icon and requirements', () => {
    render(
      <OfferingCard
        offering={mockOffering}
        isExpanded={true}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.getByText('TA Requirements - CS101')).toBeInTheDocument();
    expect(screen.getByTestId('file-text-icon')).toBeInTheDocument();
    expect(screen.getAllByText(/Python|Database/)).toHaveLength(2); // Two badges for requirements
  });

  it('toggles collapsible state and calls onToggle when clicking header', async () => {
    const header = screen.getByTestId('collapsible-header');
    await user.click(header);
    expect(mockOnToggle).toHaveBeenCalledWith(true);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('renders dropdown menu with correct items', async () => {
    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    expect(dropdownTrigger).toBeInTheDocument();
    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();

    // Simulate opening dropdown
    await user.click(dropdownTrigger);
    expect(screen.getByText('Edit Offering')).toBeInTheDocument();
    expect(screen.getByText('Add Lab/Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Delete Offering')).toBeInTheDocument();
    expect(screen.getByText('Delete Offering').closest('div')).toHaveClass('text-red-600');
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    
  });

  it('does not render requirements badges when specialRequirements is empty', () => {
    render(
      <OfferingCard
        offering={{
          ...mockOffering,
          requirements: { specialRequirements: [] },
        }}
        isExpanded={true}
        onToggle={mockOnToggle}
      />
    );
    expect(screen.getByText('TA Requirements - CS101')).toBeInTheDocument();
    expect(screen.queryAllByText(/Python|Database/)).toHaveLength(0);
  });

  it('applies hover styles to card header', () => {
    const header = screen.getByTestId('collapsible-header');
    expect(header).toHaveClass('hover:bg-muted/50');
  });
});