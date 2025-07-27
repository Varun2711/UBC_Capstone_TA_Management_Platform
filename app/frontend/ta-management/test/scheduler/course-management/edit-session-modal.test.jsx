import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EditSessionModal } from '@/components/scheduler/course_management/edit-session-modal';
import { ChevronDown } from 'lucide-react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Edit: () => <span data-testid="edit-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  X: () => <span data-testid="x-icon" />,
  FlaskConical: () => <span data-testid="flask-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
    ChevronUp: () => <span data-testid="chevron-up-icon" />,
    Check: () => <span data-testid="check-icon" />,
}));

describe('EditSessionModal', () => {
  const mockCourse = {
    id: 'cs101',
    code: 'CS101',
    title: 'Introduction to Computer Science',
  };

  const mockLabSession = {
    id: 'session1',
    section: 'L01',
    sessionType: 'lab',
    session_type: 'lab',
    term: 'F2024 Term 1',
    day: 'monday',
    time: '02:00 PM - 04:00 PM',
  };

  const mockTutorialSession = {
    id: 'session2',
    section: 'T01',
    sessionType: 'tutorial',
    session_type: 'tutorial',
    term: 'F2024 Term 1',
    time_slots: [
      { day: 'wednesday', start_time: '10:00', end_time: '12:00' }
    ],
  };

  const mockTerms = [
    { id: 1, value: 'F2024 Term 1', label: 'Fall Term 1', year: 2024 },
    { id: 2, value: 'F2024 Term 2', label: 'Fall Term 2', year: 2024 },
  ];

  let mockOnClose;
  let mockOnEditSession;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnEditSession = vi.fn().mockResolvedValue({});
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    render(
      <EditSessionModal
        isOpen={true}
        course={mockCourse}
        session={mockLabSession}
        terms={mockTerms}
        onClose={mockOnClose}
        onEditSession={mockOnEditSession}
        {...props}
      />
    );
  };

  it('renders when open with lab session', () => {
    renderComponent();

    expect(screen.getByText('Edit Laboratory Session')).toBeInTheDocument();
    expect(screen.getByTestId('flask-icon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('L01')).toBeInTheDocument();
  });

  it('renders when open with tutorial session', () => {
    renderComponent({ session: mockTutorialSession });

    expect(screen.getByText('Edit Tutorial Session')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('T01')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent({ isOpen: false });

    expect(screen.queryByText('Edit Laboratory Session')).not.toBeInTheDocument();
  });


  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Clear the section field
    const sectionInput = screen.getByDisplayValue('L01');
    await user.clear(sectionInput);
    await user.click(screen.getByText('Update Session'));

    expect(screen.getByText('Section is required')).toBeInTheDocument();
  });

  it('validates time slot fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Clear start time
    const startTimeInput = screen.getByDisplayValue('14:00');
    await user.clear(startTimeInput);
    await user.click(screen.getByText('Update Session'));

    expect(screen.getByText('Start time is required')).toBeInTheDocument();
  });

  it('validates end time is after start time', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Set end time before start time
    const endTimeInput = screen.getByDisplayValue('16:00');
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '13:00');
    await user.click(screen.getByText('Update Session'));

    expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
  });

  it('adds new time slot when add button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addButton = screen.getByText('Add Time Slot');
    await user.click(addButton);

    const daySelects = screen.getAllByText('Select day');
    expect(daySelects).toHaveLength(1); 
  });

  it('removes time slot when remove button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Add a second time slot first
    await user.click(screen.getByText('Add Time Slot'));
    
    // Now remove it
    const removeButtons = screen.getAllByTestId('x-icon');
    await user.click(removeButtons[0]);

    const daySelects = screen.getAllByText('Select day');
    expect(daySelects).toHaveLength(1);
  });

  it('calls onEditSession when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Update Session'));

    await waitFor(() => {
      expect(mockOnEditSession).toHaveBeenCalledWith('session1', {
        sessionType: 'lab',
        courseId: 'cs101',
        section: 'L01',
        termId: 1,
        timeSlots: [
          {
            day: 'monday',
            start_time: '14:00:00',
            end_time: '16:00:00'
          }
        ]
      });
    });
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when form is successfully submitted', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Update Session'));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('updates section field when typed', async () => {
    const user = userEvent.setup();
    renderComponent();

    const sectionInput = screen.getByDisplayValue('L01');
    await user.clear(sectionInput);
    await user.type(sectionInput, 'L02');

    expect(screen.getByDisplayValue('L02')).toBeInTheDocument();
  });


  it('handles session with missing time data gracefully', () => {
    const sessionWithNoTime = {
      id: 'session3',
      section: 'L03',
      sessionType: 'lab',
      term: 'F2024 Term 1',
    };

    renderComponent({ session: sessionWithNoTime });

    expect(screen.getByDisplayValue('L03')).toBeInTheDocument();
    expect(screen.getByText('Select day')).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    mockOnEditSession.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderComponent();

    await user.click(screen.getByText('Update Session'));

    expect(screen.getByText('Updating Session...')).toBeInTheDocument();
  });

  it('determines session type from section when not provided', () => {
    const sessionWithoutType = {
      id: 'session4',
      section: 'T05',
      term: 'F2024 Term 1',
      day: 'tuesday',
      time: '10:00 AM - 12:00 PM',
    };

    renderComponent({ session: sessionWithoutType });

    expect(screen.getByText('Edit Tutorial Session')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });
});