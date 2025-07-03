import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SessionList } from '@/components/scheduler/course_management/session-list';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
}));


describe('SessionList Component', () => {
  const user = userEvent.setup();
  const mockSessions = [
    { id: '1', section: 'CS101-A', day: 'Monday', time: '10:00 AM', location: 'Room 101', taAssigned: 'Jane Doe' },
    { id: '2', section: 'CS101-B', day: 'Tuesday', time: '11:00 AM', location: 'Room 102', taAssigned: null },
  ];
  const mockOnToggleLabSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Laboratory Sessions title and count for labs type when collapsed', () => {
    render(
      <SessionList
        type="labs"
        termKey="term1"
        sessions={mockSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Laboratory Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 labs')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-item-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-item-2')).not.toBeInTheDocument();
  });

  it('renders Tutorial Sessions title and count for tutorials type when collapsed', () => {
    render(
      <SessionList
        type="tutorials"
        termKey="term2"
        sessions={mockSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Tutorial Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 tutorials')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-item-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-item-2')).not.toBeInTheDocument();
  });

  it('renders SessionItem components when expanded', () => {
    render(
      <SessionList
        type="labs"
        termKey="term1"
        sessions={mockSessions}
        expandedLabSections={new Set(['labs-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Laboratory Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 labs')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    const sessionItems = screen.getAllByTestId('container');
    expect(sessionItems).toHaveLength(2);
    expect(sessionItems[0]).toHaveTextContent('CS101-A');
    expect(sessionItems[0]).toHaveTextContent('Monday 10:00 AM • Room 101');
    expect(screen.getByTestId('badge-default')).toHaveTextContent('Jane Doe');
    expect(sessionItems[1]).toHaveTextContent('CS101-B');
    expect(sessionItems[1]).toHaveTextContent('Tuesday 11:00 AM • Room 102');
    expect(screen.getByTestId('badge-destructive')).toHaveTextContent('No TA');
  });
  it('toggles collapsible state and calls onToggleLabSection when clicking header', async () => {
    render(
      <SessionList
        type="labs"
        termKey="term1"
        sessions={mockSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const header = screen.getByText('Laboratory Sessions').closest('div[aria-expanded]');
    await user.click(header);
    expect(mockOnToggleLabSection).toHaveBeenCalledWith('labs-term1');
    expect(mockOnToggleLabSection).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles to collapsible trigger', () => {
    render(
      <SessionList
        type="labs"
        termKey="term1"
        sessions={mockSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const header = screen.getByText('Laboratory Sessions').closest('div[aria-expanded]');
    expect(header).toHaveClass('hover:bg-muted/25');
  });

  it('renders no SessionItem components when sessions array is empty', () => {
    render(
      <SessionList
        type="labs"
        termKey="term1"
        sessions={[]}
        expandedLabSections={new Set(['labs-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Laboratory Sessions')).toBeInTheDocument();
    expect(screen.getByText('0 labs')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('session-item-1')).not.toBeInTheDocument();
  });

  it('renders correct count badge for single session', () => {
    render(
      <SessionList
        type="tutorials"
        termKey="term2"
        sessions={[mockSessions[0]]}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('1 tutorials')).toBeInTheDocument();
  });
});