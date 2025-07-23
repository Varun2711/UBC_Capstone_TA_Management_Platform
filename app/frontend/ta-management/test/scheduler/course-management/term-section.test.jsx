import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TermSection } from '@/components/scheduler/course_management/term-section';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }) => (
    <span data-testid="badge" className={`badge-${variant}`}>
      {children}
    </span>
  ),
}));

// Mock OfferingCard component
vi.mock('@/components/scheduler/course_management/offering-card', () => ({
  OfferingCard: ({ offering }) => (
    <div data-testid={`offering-card-${offering.id}`}>
      Offering {offering.section}
    </div>
  ),
}));

// Mock SharedSessionsCard component
vi.mock('@/components/scheduler/course_management/shared-sessions-card', () => ({
  SharedSessionsCard: ({ termKey, sharedSessions }) => (
    <div data-testid="shared-sessions-card">
      Shared Sessions for {termKey} - {sharedSessions.labs.length + sharedSessions.tutorials.length} sessions
    </div>
  ),
}));

describe('TermSection', () => {
  const mockTermOfferings = [
    { id: '1', section: 'CS101-001' },
    { id: '2', section: 'CS101-002' },
  ];

  const mockCourse = {
    sharedSessions: {
      'W2025 Term 1': {
        labs: [{ id: '1' }],
        tutorials: [{ id: '2' }],
        seminars: [],
        workshops: []
      },
    },
  };

  let mockOnToggleLabSection;
  let mockOnEditOffering;
  let mockOnDeleteOffering;
  let mockOnEditSession;
  let mockOnDeleteSession;

  beforeEach(() => {
    mockOnToggleLabSection = vi.fn();
    mockOnEditOffering = vi.fn();
    mockOnDeleteOffering = vi.fn();
    mockOnEditSession = vi.fn();
    mockOnDeleteSession = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <TermSection
        termKey="W2025 Term 1"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedLabSections={new Set()}
        onToggleLabSection={mockOnToggleLabSection}
        onEditOffering={mockOnEditOffering}
        onDeleteOffering={mockOnDeleteOffering}
        onEditSession={mockOnEditSession}
        onDeleteSession={mockOnDeleteSession}
        {...props}
      />
    );
  };

  it('renders term header with formatted display name', () => {
    renderComponent();

    expect(screen.getByText('Winter Term 1, 2025')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
  });

  it('shows Multiple Sections badge when there are multiple offerings', () => {
    renderComponent();

    expect(screen.getByText('Multiple Sections')).toBeInTheDocument();
  });

  it('does not show Multiple Sections badge for single offering', () => {
    renderComponent({
      termOfferings: [mockTermOfferings[0]]
    });

    expect(screen.queryByText('Multiple Sections')).not.toBeInTheDocument();
  });

  it('renders all offering cards', () => {
    renderComponent();

    expect(screen.getByTestId('offering-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('offering-card-2')).toBeInTheDocument();
    expect(screen.getByText('Offering CS101-001')).toBeInTheDocument();
    expect(screen.getByText('Offering CS101-002')).toBeInTheDocument();
  });

  it('renders shared sessions card when shared sessions exist', () => {
    renderComponent();

    expect(screen.getByTestId('shared-sessions-card')).toBeInTheDocument();
    expect(screen.getByText(/Shared Sessions for W2025 Term 1 - 2 sessions/)).toBeInTheDocument();
  });

  it('does not render shared sessions card when no shared sessions', () => {
    renderComponent({
      course: {
        sharedSessions: {
          'W2025 Term 1': { labs: [], tutorials: [], seminars: [], workshops: [] }
        }
      }
    });

    expect(screen.queryByTestId('shared-sessions-card')).not.toBeInTheDocument();
  });

  it('shows Shared Sessions Only badge when no offerings but has shared sessions', () => {
    renderComponent({
      termOfferings: []
    });

    expect(screen.getByText('Shared Sessions Only')).toBeInTheDocument();
    expect(screen.getByText(/No course offerings for this term, but shared sessions are available/)).toBeInTheDocument();
  });

  it('handles missing shared sessions gracefully', () => {
    renderComponent({
      course: { sharedSessions: {} }
    });

    expect(screen.getByText('Winter Term 1, 2025')).toBeInTheDocument();
    expect(screen.queryByTestId('shared-sessions-card')).not.toBeInTheDocument();
  });

  it('formats different term keys correctly', () => {
    renderComponent({
      termKey: 'F2024 Both Terms'
    });

    expect(screen.getByText('Fall Both Terms, 2024')).toBeInTheDocument();
  });

  it('handles unknown term format gracefully', () => {
    renderComponent({
      termKey: 'Unknown Format'
    });

    expect(screen.getByText('Unknown Format')).toBeInTheDocument();
  });

  it('renders empty state when no offerings and no shared sessions', () => {
    renderComponent({
      termOfferings: [],
      course: { sharedSessions: {} }
    });

    expect(screen.getByText('Winter Term 1, 2025')).toBeInTheDocument();
    expect(screen.queryByTestId('offering-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('shared-sessions-card')).not.toBeInTheDocument();
  });
});