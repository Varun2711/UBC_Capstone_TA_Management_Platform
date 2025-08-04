import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionItem } from '@/components/scheduler/course_management/session-item';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }) => (
    <div role="menuitem" onClick={onClick} className={className}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild }) => asChild ? children : <div>{children}</div>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <span data-testid="more-horizontal-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
}));

describe('SessionItem', () => {
  const mockSession = {
    section: 'L01',
    day: 'Monday',
    time: '10:00 AM - 12:00 PM',
    location: 'Room 101', // This will be ignored since location is no longer displayed
    taAssigned: 'Jane Doe', // This will be ignored since TA is no longer displayed
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

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('Monday 10:00 AM - 12:00 PM')).toBeInTheDocument();
  });

  it('does not display location information', () => {
    renderComponent();

    expect(screen.queryByText('Room 101')).not.toBeInTheDocument();
    expect(screen.queryByText(/TBD/)).not.toBeInTheDocument();
  });

  it('does not display TA assignment information', () => {
    renderComponent();

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByText(/No TA/)).not.toBeInTheDocument();
  });

 


  it('displays dropdown menu trigger', () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon');
    expect(dropdownTrigger).toBeInTheDocument();
  });

  it('shows edit and delete options in dropdown', () => {
    renderComponent();

    expect(screen.getByText('Edit Session')).toBeInTheDocument();
    expect(screen.getByText('Delete Session')).toBeInTheDocument();
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', async () => {
    renderComponent();

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

    const deleteButton = screen.getByText('Delete Session');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockSession, 'lab', 'fall2025');
  });

  it('converts type correctly for tutorials', async () => {
    renderComponent({ type: 'tutorials' });

    const editButton = screen.getByText('Edit Session');
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionType: 'tutorial',
        session_type: 'tutorial',
        term: 'fall2025'
      }),
      'tutorial',
      'fall2025'
    );
  });

  it('handles missing termKey gracefully', () => {
    render(
      <SessionItem
        session={mockSession}
        type="labs"
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('Monday 10:00 AM - 12:00 PM')).toBeInTheDocument();
  });

  it('handles missing callbacks gracefully', () => {
    render(
      <SessionItem
        session={mockSession}
        type="labs"
        termKey="fall2025"
      />
    );

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('Monday 10:00 AM - 12:00 PM')).toBeInTheDocument();
  });

  it('handles error in edit handler', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorOnEdit = vi.fn(() => { throw new Error('Edit failed'); });
    
    render(
      <SessionItem
        session={mockSession}
        type="labs"
        termKey="fall2025"
        onEdit={errorOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByText('Edit Session');
    await userEvent.click(editButton);

    expect(consoleSpy).toHaveBeenCalledWith('Error in SessionItem handleEdit:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles error in delete handler', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errorOnDelete = vi.fn(() => { throw new Error('Delete failed'); });
    
    render(
      <SessionItem
        session={mockSession}
        type="labs"
        termKey="fall2025"
        onEdit={mockOnEdit}
        onDelete={errorOnDelete}
      />
    );

    const deleteButton = screen.getByText('Delete Session');
    await userEvent.click(deleteButton);

    expect(consoleSpy).toHaveBeenCalledWith('Error in SessionItem handleDelete:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('displays different session sections correctly', () => {
    const sessions = [
      { ...mockSession, section: 'L01' },
      { ...mockSession, section: 'L02' },
      { ...mockSession, section: 'T01' },
      { ...mockSession, section: 'T02' },
    ];

    sessions.forEach((session, index) => {
      const { unmount } = render(
        <SessionItem
          session={session}
          type={session.section.startsWith('L') ? 'labs' : 'tutorials'}
          termKey="fall2025"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(session.section)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays time information correctly', () => {
    const timesessions = [
      { ...mockSession, time: '9:00 AM - 11:00 AM' },
      { ...mockSession, time: '2:00 PM - 4:00 PM' },
      { ...mockSession, time: '6:00 PM - 8:00 PM' },
    ];

    timesessions.forEach((session) => {
      const { unmount } = render(
        <SessionItem
          session={session}
          type="labs"
          termKey="fall2025"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(`Monday ${session.time}`)).toBeInTheDocument();
      unmount();
    });
  });
});