import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SharedSessionsCard } from '@/components/scheduler/course_management/shared-sessions-card';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
}));

// Mock SessionList component
vi.mock('@/components/scheduler/course_management/session-list', () => ({
  SessionList: ({ type, sessions }) => (
    <div data-testid={`session-list-${type}`}>
      {type} - {sessions.length} sessions
    </div>
  ),
}));

describe('SharedSessionsCard', () => {
  const mockSharedSessions = {
    labs: [
      { id: '1', section: 'CS101-A', day: 'Monday', time: '10:00 AM' },
    ],
    tutorials: [
      { id: '2', section: 'CS101-B', day: 'Tuesday', time: '11:00 AM' },
    ],
  };

  let mockOnToggleLabSection;
  let mockOnEditSession;
  let mockOnDeleteSession;

  beforeEach(() => {
    mockOnToggleLabSection = vi.fn();
    mockOnEditSession = vi.fn();
    mockOnDeleteSession = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <SharedSessionsCard
        termKey="term1"
        term="Fall"
        year="2025"
        termOfferings={[]}
        sharedSessions={mockSharedSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
        onEditSession={mockOnEditSession}
        onDeleteSession={mockOnDeleteSession}
        {...props}
      />
    );
  };

  it('renders collapsed state correctly', () => {
    renderComponent();

    expect(screen.getByText('Shared Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('session-list-labs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('session-list-tutorials')).not.toBeInTheDocument();
  });

  it('renders expanded state correctly', () => {
    renderComponent({
      expandedLabSections: new Set(['shared-term1'])
    });

    expect(screen.getByText('Shared Sessions')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-labs')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-tutorials')).toBeInTheDocument();
  });

  it('toggles expansion when header is clicked', async () => {
    renderComponent();

    const header = screen.getByText('Shared Sessions').closest('div');
    await userEvent.click(header);

    expect(mockOnToggleLabSection).toHaveBeenCalledWith('shared-term1');
    expect(mockOnToggleLabSection).toHaveBeenCalledTimes(1);
  });

  it('shows correct session count', () => {
    renderComponent({
      sharedSessions: {
        labs: [{ id: '1' }, { id: '2' }],
        tutorials: [{ id: '3' }],
      }
    });

    expect(screen.getByText('3 sessions')).toBeInTheDocument();
  });

  it('renders only labs when tutorials are empty', () => {
    renderComponent({
      sharedSessions: {
        labs: mockSharedSessions.labs,
        tutorials: []
      },
      expandedLabSections: new Set(['shared-term1'])
    });

    expect(screen.getByText('1 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-labs')).toBeInTheDocument();
    expect(screen.queryByTestId('session-list-tutorials')).not.toBeInTheDocument();
  });

  it('renders only tutorials when labs are empty', () => {
    renderComponent({
      sharedSessions: {
        labs: [],
        tutorials: mockSharedSessions.tutorials
      },
      expandedLabSections: new Set(['shared-term1'])
    });

    expect(screen.getByText('1 sessions')).toBeInTheDocument();
    expect(screen.getByTestId('session-list-tutorials')).toBeInTheDocument();
    expect(screen.queryByTestId('session-list-labs')).not.toBeInTheDocument();
  });

  it('shows zero sessions when both are empty', () => {
    renderComponent({
      sharedSessions: {
        labs: [],
        tutorials: []
      }
    });

    expect(screen.getByText('0 sessions')).toBeInTheDocument();
  });

  it('renders with different term keys', async () => {
    renderComponent({ termKey: 'winter2025' });

    const header = screen.getByText('Shared Sessions').closest('div');
    await userEvent.click(header);

    expect(mockOnToggleLabSection).toHaveBeenCalledWith('shared-winter2025');
  });

  it('has correct styling classes', () => {
    renderComponent();

    const card = screen.getByText('Shared Sessions').closest('.border-dashed');
    expect(card).toBeInTheDocument();
  });
});