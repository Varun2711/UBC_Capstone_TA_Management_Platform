import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfferingCard } from '@/components/scheduler/course_management/offering-card';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  ChevronRight: () => <span data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <span data-testid="more-horizontal-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
}));

describe('OfferingCard', () => {
  const mockOffering = {
    id: 'offering1',
    section: '001',
    instructorName: 'Dr. Smith',
    time_slots: [
      { day: 'monday', time: '02:00 PM - 04:00 PM' }
    ]
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
      <OfferingCard
        offering={mockOffering}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        {...props}
      />
    );
  };

  it('renders offering information', () => {
    renderComponent();

    expect(screen.getByText('Section 001')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Monday 02:00 PM - 04:00 PM')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('shows unassigned when no instructor', () => {
    renderComponent({
      offering: { ...mockOffering, instructorName: null }
    });

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows no schedule when no time slots', () => {
    renderComponent({
      offering: { ...mockOffering, time_slots: [] }
    });

    expect(screen.getByText('No schedule set')).toBeInTheDocument();
  });

  it('formats multiple time slots correctly', () => {
    renderComponent({
      offering: {
        ...mockOffering,
        time_slots: [
          { day: 'monday', time: '02:00 PM - 04:00 PM' },
          { day: 'wednesday', time: '10:00 AM - 12:00 PM' }
        ]
      }
    });

    expect(screen.getByText(/Monday 02:00 PM - 04:00 PM, Wednesday 10:00 AM - 12:00 PM/)).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    expect(screen.getByText('Edit Offering')).toBeInTheDocument();
    expect(screen.getByText('Delete Offering')).toBeInTheDocument();
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    const editButton = screen.getByText('Edit Offering');
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockOffering);
  });

  it('calls onDelete when delete is clicked', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    const deleteButton = screen.getByText('Delete Offering');
    await userEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockOffering);
  });

  it('shows delete option in red', async () => {
    renderComponent();

    const dropdownTrigger = screen.getByTestId('more-horizontal-icon').closest('button');
    await userEvent.click(dropdownTrigger);

    const deleteButton = screen.getByText('Delete Offering').closest('div');
    expect(deleteButton).toHaveClass('text-red-600');
  });

  it('handles empty offering data gracefully', () => {
    renderComponent({
      offering: {
        id: 'empty',
        section: '002',
        instructorName: null,
        time_slots: null
      }
    });

    expect(screen.getByText('Section 002')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('No schedule set')).toBeInTheDocument();
  });

  it('capitalizes day names correctly', () => {
    renderComponent({
      offering: {
        ...mockOffering,
        time_slots: [
          { day: 'tuesday', time: '01:00 PM - 03:00 PM' }
        ]
      }
    });

    expect(screen.getByText('Tuesday 01:00 PM - 03:00 PM')).toBeInTheDocument();
  });
});