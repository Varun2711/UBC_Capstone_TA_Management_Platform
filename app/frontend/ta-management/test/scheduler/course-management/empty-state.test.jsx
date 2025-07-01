import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/scheduler/course_management/empty-state';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="book-open-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
}));

describe('EmptyState Component', () => {
  const user = userEvent.setup();
  const mockOnAddCourse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    render(<EmptyState onAddCourse={mockOnAddCourse} />);
  });

  it('renders the card with correct text and icons', () => {
    expect(screen.getByText('No courses found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria or add a new course.')).toBeInTheDocument();
    expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('renders the Add Course button and triggers onAddCourse when clicked', async () => {
    const button = screen.getByRole('button', { name: /Add Course/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex'); // Button component class
    await user.click(button);
    expect(mockOnAddCourse).toHaveBeenCalled();
    expect(mockOnAddCourse).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling to the card content', () => {
    const cardContent = screen.getByText('No courses found').closest('div');
    expect(cardContent).toHaveClass('text-center', 'py-8');
  });

  it('renders heading with correct styling', () => {
    const heading = screen.getByText('No courses found');
    expect(heading).toHaveClass('text-lg', 'font-medium', 'mb-2');
  });

  it('renders description with muted foreground', () => {
    const description = screen.getByText('Try adjusting your search criteria or add a new course.');
    expect(description).toHaveClass('text-muted-foreground', 'mb-4');
  });
});