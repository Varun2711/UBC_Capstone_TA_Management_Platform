import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SessionList } from '@/components/scheduler/course_management/session-list';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
}));

// Mock SessionItem component
vi.mock('@/components/scheduler/course_management/session-item', () => ({
  SessionItem: ({ session }) => (
    <div data-testid={`session-item-${session.id}`}>
      {session.section} - {session.taAssigned || 'No TA'}
    </div>
  ),
}));

describe('SessionList', () => {
  const mockSessions = [
    { id: '1', section: 'CS101-A', day: 'Monday', time: '10:00 AM', location: 'Room 101', taAssigned: 'Jane Doe' },
    { id: '2', section: 'CS101-B', day: 'Tuesday', time: '11:00 AM', location: 'Room 102', taAssigned: null },
  ];

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
      <SessionList
        type="labs"
        termKey="term1"
        sessions={mockSessions}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
        onEditSession={mockOnEditSession}
        onDeleteSession={mockOnDeleteSession}
        {...props}
      />
    );
  };

  it('renders laboratory sessions title when collapsed', () => {
    renderComponent({ type: 'labs' });

    expect(screen.getByText('Laboratory Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 labs')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('session-item-1')).not.toBeInTheDocument();
  });

  it('renders tutorial sessions title when collapsed', () => {
    renderComponent({ type: 'tutorials' });

    expect(screen.getByText('Tutorial Sessions')).toBeInTheDocument();
    expect(screen.getByText('2 tutorials')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('shows sessions when expanded', () => {
    renderComponent({
      expandedLabSections: new Set(['labs-term1'])
    });

    expect(screen.getByText('Laboratory Sessions')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    expect(screen.getByTestId('session-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('session-item-2')).toBeInTheDocument();
  });

  it('toggles expansion when header is clicked', async () => {
    renderComponent();

    const header = screen.getByText('Laboratory Sessions').closest('div');
    await userEvent.click(header);

    expect(mockOnToggleLabSection).toHaveBeenCalledWith('labs-term1');
    expect(mockOnToggleLabSection).toHaveBeenCalledTimes(1);
  });

  it('shows correct count for empty sessions', () => {
    renderComponent({ sessions: [] });

    expect(screen.getByText('0 labs')).toBeInTheDocument();
  });

  it('shows correct count for single session', () => {
    renderComponent({ 
      sessions: [mockSessions[0]],
      type: 'tutorials'
    });

    expect(screen.getByText('1 tutorials')).toBeInTheDocument();
  });

  it('renders sessions with correct props when expanded', () => {
    renderComponent({
      expandedLabSections: new Set(['labs-term1'])
    });

    expect(screen.getByText('CS101-A - Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('CS101-B - No TA')).toBeInTheDocument();
  });

  it('creates correct section key for different types', async () => {
    renderComponent({ type: 'tutorials', termKey: 'fall2024' });

    const header = screen.getByText('Tutorial Sessions').closest('div');
    await userEvent.click(header);

    expect(mockOnToggleLabSection).toHaveBeenCalledWith('tutorials-fall2024');
  });

  it('passes correct props to SessionItem components', () => {
    renderComponent({
      expandedLabSections: new Set(['labs-term1'])
    });

    // SessionItems are rendered when expanded
    expect(screen.getByTestId('session-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('session-item-2')).toBeInTheDocument();
  });
});