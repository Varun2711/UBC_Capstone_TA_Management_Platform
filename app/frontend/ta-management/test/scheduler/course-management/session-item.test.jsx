import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionItem } from '@/components/scheduler/course_management/session-item';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <span data-testid="more-horizontal-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
}));

describe('SessionItem', () => {
  const mockSession = {
    section: 'CS101-A',
    day: 'Monday',
    time: '10:00 AM',
    location: 'Room 101',
    taAssigned: 'Jane Doe',
  };

  let mockOnEdit;
  let mockOnDelete;

  beforeEach(() => {
    mockOnEdit = vi.fn();
    mockOnDelete = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <SessionItem
        session={mockSession}
        type="labs"
        termKey="fall2025"
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        {...props}
      />
    );
  };

  it('renders session details correctly', () => {
    renderComponent();

    expect(screen.getByText('CS101-A')).toBeInTheDocument();
    expect(screen.getByText('Monday 10:00 AM • Room 101')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows "No TA" when no TA assigned', () => {
    renderComponent({
      session: { ...mockSession, taAssigned: null }
    });

    expect(screen.getByText('No TA')).toBeInTheDocument();
  });

  it('shows "TBD" when no location provided', () => {
    renderComponent({
      session: { ...mockSession, location: null }
    });

    expect(screen.getByText('Monday 10:00 AM • TBD')).toBeInTheDocument();
  });

  it('renders tutorials type correctly', () => {
    renderComponent({ type: 'tutorials' });
    expect(screen.getByText('CS101-A')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    expect(screen.getByText('Edit Session')).toBeInTheDocument();
    expect(screen.getByText('Delete Session')).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    const editButton = screen.getByText('Edit Session');
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockSession,
        sessionType: 'lab',
        session_type: 'lab',
        term: 'fall2025'
      }),
      'lab',
      'fall2025'
    );
  });

  it('calls onDelete when delete is clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    const deleteButton = screen.getByText('Delete Session');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockSession, 'lab', 'fall2025');
  });

  it('handles different TA field names', () => {
    renderComponent({
      session: {
        ...mockSession,
        taAssigned: null,
        student_name: 'John Smith'
      }
    });

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('handles missing optional props gracefully', () => {
    render(
      <SessionItem
        session={mockSession}
        type="labs"
      />
    );

    expect(screen.getByText('CS101-A')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});