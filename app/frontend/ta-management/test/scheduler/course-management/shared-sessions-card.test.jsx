import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SharedSessionsCard } from '@/components/scheduler/course_management/shared-sessions-card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
}));


// Mock SessionList component
vi.mock('@/components/scheduler/course_management/session-list', () => ({
    SessionList: ({ type, termKey, sessions }) => (
      <div data-testid={`session-list-${type}`}>
        {type} - {termKey} - {sessions.length} sessions
      </div>
    ),
  }));

describe('SharedSessionsCard Component', () => {
  const user = userEvent.setup();
  const mockTermOfferings = [
    { section: 'CS101' },
    { section: 'CS102' },
  ];
  const mockSharedSessions = {
    labs: [
      { id: '1', section: 'CS101-A', day: 'Monday', time: '10:00 AM', location: 'Room 101', taAssigned: 'Jane Doe' },
    ],
    tutorials: [
      { id: '2', section: 'CS101-B', day: 'Tuesday', time: '11:00 AM', location: 'Room 102', taAssigned: null },
    ],
  };
  const mockOnToggleLabSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, badges, and collapsed state correctly', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    screen.logTestingPlaygroundURL();
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('CS101, CS102')).toBeInTheDocument();
    expect(screen.getByText('2 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-list-labs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-list-tutorials')).not.toBeInTheDocument();
    expect(screen.getByTestId('card')).toHaveClass('border-dashed');
  });

  it('renders SessionList components when expanded', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set(['shared-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('CS101, CS102')).toBeInTheDocument();
    expect(screen.getByText('2 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-right-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('session-list-labs')).toHaveTextContent('labs - term1 - 1 sessions');
    expect(screen.getByTestId('session-list-tutorials')).toHaveTextContent('tutorials - term1 - 1 sessions');
  });

  it('toggles collapsible state and calls onToggleLabSection when clicking header', async () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const header = screen.getByText('Shared Sessions for Fall 2025').closest('div[aria-expanded]');
    await user.click(header);
    expect(mockOnToggleLabSection).toHaveBeenCalledWith('shared-term1');
    expect(mockOnToggleLabSection).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles to collapsible trigger', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const header = screen.getByText('Shared Sessions for Fall 2025').closest('div[aria-expanded]');
    expect(header).toHaveClass('hover:bg-muted/50');
  });

  it('renders only labs SessionList when tutorials is empty', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={{ labs: mockSharedSessions.labs, tutorials: [] }}
        expandedLabSections={new Set(['shared-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('1 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-labs')).toHaveTextContent('labs - term1 - 1 sessions');
    expect(screen.queryByTestId('session-list-tutorials')).not.toBeInTheDocument();
  });

  it('renders only tutorials SessionList when labs is empty', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={{ labs: [], tutorials: mockSharedSessions.tutorials }}
        expandedLabSections={new Set(['shared-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('1 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-tutorials')).toHaveTextContent('tutorials - term1 - 1 sessions');
    expect(screen.queryByTestId('session-list-labs')).not.toBeInTheDocument();
  });

  it('renders no SessionList components when both labs and tutorials are empty', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={mockTermOfferings}
        sharedSessions={{ labs: [], tutorials: [] }}
        expandedLabSections={new Set(['shared-term1'])}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('0 sessions')).toBeInTheDocument();
    expect(screen.queryByTestId('session-list-labs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-list-tutorials')).not.toBeInTheDocument();
  });

  it('renders no sections badge when termOfferings is empty', () => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={[]}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Shared Sessions for Fall 2025')).toBeInTheDocument();
    expect(screen.getByText('2 sessions')).toBeInTheDocument();
    expect(screen.queryByText(/CS101/)).not.toBeInTheDocument();
  });
});