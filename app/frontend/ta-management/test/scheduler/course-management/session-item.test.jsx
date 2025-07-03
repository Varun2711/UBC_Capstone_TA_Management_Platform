import { render, screen, cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import { SessionItem } from '@/components/scheduler/course_management/session-item';



describe('SessionItem Component', () => {
    const mockSession = {
      section: 'CS101-A',
      day: 'Monday',
      time: '10:00 AM',
      location: 'Room 101',
      taAssigned: 'Jane Doe',
    };
  
    beforeEach(() => {
      vi.clearAllMocks();
      cleanup();
    });
  
    afterEach(() => {
      cleanup();
    });
  
    it('renders session details correctly', () => {
      render(<SessionItem session={mockSession} type="labs" />);
      expect(screen.getByText('CS101-A')).toBeInTheDocument();
      expect(screen.getByText('Monday 10:00 AM • Room 101')).toBeInTheDocument();
    });
  
    it('applies correct styles for type="labs"', () => {
        render(<SessionItem session={mockSession} type="labs" />);
        const container = screen.getByTestId('container');
        expect(container).toHaveClass('bg-blue-50/50');
        const dot = screen.getByTestId('dot');
        expect(dot).toHaveClass('bg-blue-500');
      });

    it('renders Badge with default variant and TA name when taAssigned is truthy', () => {
      render(<SessionItem session={mockSession} type="labs" />);
      const badge = screen.getByTestId('badge-default');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Jane Doe');
    });
  
    it('renders Badge with destructive variant and "No TA" when taAssigned is falsy', () => {
      render(<SessionItem session={{ ...mockSession, taAssigned: null }} type="labs" />);
      const badge = screen.getByTestId('badge-destructive');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('No TA');
    });
  
    it('applies correct flex styling to the container', () => {
      render(<SessionItem session={mockSession} type="labs" />);
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('flex', 'items-center', 'justify-between', 'p-3', 'border', 'rounded-lg');
    });
  });