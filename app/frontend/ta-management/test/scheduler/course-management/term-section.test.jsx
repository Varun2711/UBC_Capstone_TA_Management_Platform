import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TermSection } from '@/components/scheduler/course_management/term-section';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock lucide-react icon
vi.mock('lucide-react', () => ({
  Calendar: () => <svg data-testid="calendar-icon" />,
}));

// Mock OfferingCard component
vi.mock('@/components/scheduler/course_management/offering-card', () => ({
  OfferingCard: ({ offering, isExpanded, onToggle }) => (
    <div data-testid={`offering-card-${offering.id}`}>
      Offering {offering.section} - {isExpanded ? 'Expanded' : 'Collapsed'}
      <button data-testid={`toggle-offering-${offering.id}`} onClick={onToggle}>
        Toggle
      </button>
    </div>
  ),
}));

// Mock SharedSessionsCard component
vi.mock('@/components/scheduler/course_management/shared-sessions-card', () => ({
  SharedSessionsCard: ({ termKey, term, year, termOfferings, sharedSessions }) => (
    <div data-testid="shared-sessions-card">
      Shared Sessions - {term} {year} - {termOfferings.length} offerings - {sharedSessions.labs.length + sharedSessions.tutorials.length} sessions
    </div>
  ),
}));

describe('TermSection Component', () => {
  const user = userEvent.setup();
  const mockTermOfferings = [
    { id: '1', section: 'CS101' },
    { id: '2', section: 'CS102' },
  ];
  const mockCourse = {
    sharedSessions: {
      'Fall-2025': {
        labs: [{ id: '1', section: 'CS101-A', day: 'Monday', time: '10:00 AM', location: 'Room 101', taAssigned: 'Jane Doe' }],
        tutorials: [{ id: '2', section: 'CS101-B', day: 'Tuesday', time: '11:00 AM', location: 'Room 102', taAssigned: null }],
      },
    },
  };
  const mockOnToggleOffering = vi.fn();
  const mockOnToggleLabSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders term header with term, year, and calendar icon', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Fall 2025')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
  });

  it('renders Multiple Sections badge when termOfferings has multiple items', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Multiple Sections')).toBeInTheDocument();
  });

  it('does not render Multiple Sections badge when termOfferings has one item', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={[mockTermOfferings[0]]}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.queryByText('Multiple Sections')).not.toBeInTheDocument();
  });

  it('renders OfferingCard components for each offering', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set(['1'])}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const offeringCards = screen.getAllByTestId(/offering-card-/);
    expect(offeringCards).toHaveLength(2);
    expect(screen.getByTestId('offering-card-1')).toHaveTextContent('Offering CS101 - Expanded');
    expect(screen.getByTestId('offering-card-2')).toHaveTextContent('Offering CS102 - Collapsed');
  });

  it('calls onToggleOffering when an OfferingCard toggle button is clicked', async () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    await user.click(screen.getByTestId('toggle-offering-1'));
    expect(mockOnToggleOffering).toHaveBeenCalledWith('1');
    expect(mockOnToggleOffering).toHaveBeenCalledTimes(1);
  });

  it('renders SharedSessionsCard when sharedSessions has labs or tutorials', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByTestId('shared-sessions-card')).toHaveTextContent('Shared Sessions - Fall 2025 - 2 offerings - 2 sessions');
  });

  it('does not render SharedSessionsCard when sharedSessions is empty', () => {
    const emptyCourse = {
      sharedSessions: { 'Fall-2025': { labs: [], tutorials: [] } },
    };
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={emptyCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.queryByTestId('shared-sessions-card')).not.toBeInTheDocument();
  });

  it('passes correct props to SharedSessionsCard', () => {
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={mockCourse}
        expandedOfferings={new Set()}
        expandedLabSections={new Set(['shared-Fall-2025'])}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    const sharedSessionsCard = screen.getByTestId('shared-sessions-card');
    expect(sharedSessionsCard).toHaveTextContent('Shared Sessions - Fall 2025 - 2 offerings - 2 sessions');
  });

  it('handles missing sharedSessions for termKey gracefully', () => {
    const courseNoSharedSessions = { sharedSessions: {} };
    render(
      <TermSection
        termKey="Fall-2025"
        termOfferings={mockTermOfferings}
        course={courseNoSharedSessions}
        expandedOfferings={new Set()}
        expandedLabSections={new Set()}
        onToggleOffering={mockOnToggleOffering}
        onToggleLabSection={mockOnToggleLabSection}
      />
    );
    expect(screen.getByText('Fall 2025')).toBeInTheDocument();
    expect(screen.queryByTestId('shared-sessions-card')).not.toBeInTheDocument();
  });
});