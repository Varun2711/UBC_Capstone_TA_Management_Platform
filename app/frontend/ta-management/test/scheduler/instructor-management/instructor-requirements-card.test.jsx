import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstructorRequirementsCard } from '@/components/scheduler/instructor-management/instructor-requirement-card';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  User: () => <div data-testid="user-icon" />,
}));

// Mock UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }) => <img src={src} alt={alt} data-testid="avatar-image" />,
  AvatarFallback: ({ children }) => <div data-testid="avatar-fallback">{children}</div>,
}));

describe('InstructorRequirementsCard', () => {
  const user = userEvent.setup();

  const mockInstructor = {
    instructorId: 'inst-001',
    instructorName: 'Dr. Sarah Johnson',
    email: 's.johnson@university.edu',
    departmentName: 'Computer Science',
    employeeNumber: '12345678',
  };

  // Update the mockOfferings to reflect the new data structure where offerings without requests show hasRequest: false
  const mockOfferings = [
    {
      offeringId: 'off-001',
      courseCode: 'CS101',
      courseTitle: 'Introduction to Programming',
      section: 'A',
      term: 'Fall',
      year: '2025',
      requirements: {
        submittedAt: '2025-05-15',
        generalRequirements: ['Knows Python', 'Good communication'],
        hasRequest: true,
        requestId: 'req-001',
      },
    },
    {
      offeringId: 'off-002',
      courseCode: 'CS303',
      courseTitle: 'Advanced Algorithms',
      section: 'B',
      term: 'Fall',
      year: '2025',
      requirements: {
        submittedAt: '2025-05-16',
        generalRequirements: ['Data structures mastery', 'Algorithm analysis'],
        hasRequest: true,
        requestId: 'req-002',
      },
    },
  ];

  const defaultProps = {
    instructor: mockInstructor,
    isExpanded: false,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    visibleOfferingsCount: mockOfferings.length,
    filteredOfferings: mockOfferings,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<InstructorRequirementsCard {...defaultProps} {...props} />);
  };

  describe('Basic Rendering', () => {
    it('renders instructor information when collapsed', () => {
      renderComponent();

      expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('s.johnson@university.edu')).toBeInTheDocument();
      expect(screen.getByText('Employee #12345678')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('2 Courses')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('DSJ');
    });

    it('shows singular "Course" when count is 1', () => {
      renderComponent({ visibleOfferingsCount: 1 });
      
      expect(screen.getByText('1 Course')).toBeInTheDocument();
    });

    it('hides course details when collapsed', () => {
      renderComponent();
      
      expect(screen.queryByText('Course Requirements')).not.toBeInTheDocument();
      expect(screen.queryByText('CS101 - A')).not.toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    it('shows course offerings when expanded', () => {
      renderComponent({ isExpanded: true });

      expect(screen.getByText('Course Requirements')).toBeInTheDocument();
      expect(screen.getByText('CS101 - A')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
      expect(screen.getByText('CS303 - B')).toBeInTheDocument();
      expect(screen.getByText('Advanced Algorithms')).toBeInTheDocument();
      expect(screen.getAllByText('Fall 2025')).toHaveLength(2);
    });

    it('shows empty state when no offerings match filters', () => {
      renderComponent({ 
        isExpanded: true, 
        filteredOfferings: [], 
        visibleOfferingsCount: 0 
      });

      expect(screen.getByText('No course offerings match the current filters.')).toBeInTheDocument();
    });

    it('shows submission dates for offerings', () => {
      renderComponent({ isExpanded: true });

      expect(screen.getByText('Submitted: May 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('Submitted: May 16, 2025')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onToggle when header is clicked', async () => {
      const onToggle = vi.fn();
      renderComponent({ onToggle });

      // Find the clickable header div (not button)
      const chevronIcon = screen.getByTestId('chevron-right-icon');
      const headerDiv = chevronIcon.closest('div[class*="cursor-pointer"]');
      
      await user.click(headerDiv);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('opens dropdown menu and calls onEdit', async () => {
      const onEdit = vi.fn();
      renderComponent({ onEdit });

      // Open dropdown menu
      const moreButton = screen.getByTestId('more-horizontal-icon').closest('button');
      await user.click(moreButton);

      // Click edit option
      await user.click(screen.getByRole('menuitem', { name: /edit instructor/i }));

      expect(onEdit).toHaveBeenCalledWith(mockInstructor);
    });

    it('opens dropdown menu and calls onDelete', async () => {
      const onDelete = vi.fn();
      renderComponent({ onDelete });

      // Open dropdown menu
      const moreButton = screen.getByTestId('more-horizontal-icon').closest('button');
      await user.click(moreButton);

      // Click delete option
      await user.click(screen.getByRole('menuitem', { name: /delete instructor/i }));

      expect(onDelete).toHaveBeenCalledWith(mockInstructor.instructorId);
    });
  });

  describe('Course Offering Expansion', () => {
    // Update the test for expanding and showing course requirements
    it('expands and shows course requirements', async () => {
      renderComponent({ isExpanded: true });

      // Initially requirements are hidden
      expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();

      // Find the course offering header by finding the CS101 text and getting its clickable parent
      const courseText = screen.getByText('CS101 - A');
      const offeringHeader = courseText.closest('div[class*="cursor-pointer"]');
      
      await user.click(offeringHeader);

      // Requirements should now be visible
      expect(screen.getByText('Knows Python')).toBeInTheDocument();
      expect(screen.getByText('Good communication')).toBeInTheDocument();
      expect(screen.getByText('Requirements')).toBeInTheDocument();
    });

    // Update the test for collapsing course requirements
    it('collapses course requirements when clicked again', async () => {
      renderComponent({ isExpanded: true });

      const courseText = screen.getByText('CS101 - A');
      const offeringHeader = courseText.closest('div[class*="cursor-pointer"]');
      
      // Expand
      await user.click(offeringHeader);
      expect(screen.getByText('Knows Python')).toBeInTheDocument();

      // Collapse
      await user.click(offeringHeader);
      expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();
    });

    // Update the test for handling multiple offerings independently
    it('handles multiple offerings independently', async () => {
      renderComponent({ isExpanded: true });

      const course1Text = screen.getByText('CS101 - A');
      const offering1Header = course1Text.closest('div[class*="cursor-pointer"]');
      
      const course2Text = screen.getByText('CS303 - B');
      const offering2Header = course2Text.closest('div[class*="cursor-pointer"]');

      // Expand first offering
      await user.click(offering1Header);
      expect(screen.getByText('Knows Python')).toBeInTheDocument();
      expect(screen.queryByText('Data structures mastery')).not.toBeInTheDocument();

      // Expand second offering
      await user.click(offering2Header);
      expect(screen.getByText('Knows Python')).toBeInTheDocument();
      expect(screen.getByText('Data structures mastery')).toBeInTheDocument();
      expect(screen.getByText('Algorithm analysis')).toBeInTheDocument();

      // Collapse first offering
      await user.click(offering1Header);
      expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();
      expect(screen.getByText('Data structures mastery')).toBeInTheDocument();
    });
  });

  describe('Avatar Initials', () => {
    it('generates correct initials for instructor name', () => {
      renderComponent();
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('DSJ');
    });

    it('handles single name correctly', () => {
      renderComponent({
        instructor: { ...mockInstructor, instructorName: 'Cher' }
      });
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('C');
    });

    it('handles multiple middle names', () => {
      renderComponent({
        instructor: { ...mockInstructor, instructorName: 'Dr. Mary Jane Watson Smith' }
      });
      
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('DMJWS');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty offerings array', () => {
      renderComponent({ 
        isExpanded: true,
        filteredOfferings: [],
        visibleOfferingsCount: 0
      });

      expect(screen.getByText('0 Courses')).toBeInTheDocument();
      expect(screen.getByText('No course offerings match the current filters.')).toBeInTheDocument();
    });

    it('handles offerings without requirements', async () => {
      const offeringsWithoutReqs = [{
        ...mockOfferings[0],
        requirements: {
          submittedAt: '2025-05-15',
          generalRequirements: []
        }
      }];

      renderComponent({ 
        isExpanded: true,
        filteredOfferings: offeringsWithoutReqs,
        visibleOfferingsCount: 1
      });

      const courseText = screen.getByText('CS101 - A');
      const offeringHeader = courseText.closest('div[class*="cursor-pointer"]');
      
      await user.click(offeringHeader);

      expect(screen.getByText('Requirements')).toBeInTheDocument();
      // Should not crash when there are no requirements to display
    });
  });
});