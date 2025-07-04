import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstructorRequirementsCard } from '@/components/scheduler/instructor-management/instructor-requirement-card';

// Mock lucide-react icons for cleaner test output
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// Mock the Avatar component as it might have its own complexities
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }) => <img src={src} alt={alt} data-testid="avatar-image" />,
  AvatarFallback: ({ children }) => <div data-testid="avatar-fallback">{children}</div>,
}));

// Mock data for the tests
const mockInstructor = {
  instructorId: 'inst-001',
  instructorName: 'Dr. Sarah Johnson',
  email: 's.johnson@university.edu',
  department: 'Computer Science',
};

const mockOfferings = [
  {
    offeringId: 'off-001',
    courseCode: 'CS101',
    courseTitle: 'Introduction to Programming',
    section: 'A',
    term: 'Fall',
    year: '2025',
    requirements: {
      submittedAt: '2025-05-15T10:00:00Z',
      generalRequirements: ['Knows Python', 'Good communication'],
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
      submittedAt: '2025-05-16T11:30:00Z',
      generalRequirements: ['Data structures mastery'],
    },
  },
];

describe('InstructorRequirementsCard Component', () => {
  const user = userEvent.setup();
  let onToggle, onEdit, onDelete;

  beforeEach(() => {
    onToggle = vi.fn();
    onEdit = vi.fn();
    onDelete = vi.fn();
  });

  const renderComponent = (props) => {
    render(
      <InstructorRequirementsCard
        instructor={mockInstructor}
        isExpanded={false}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        visibleOfferingsCount={mockOfferings.length}
        filteredOfferings={mockOfferings}
        {...props}
      />
    );
  };

  describe('Rendering (Collapsed State)', () => {
    it('should render instructor details correctly when collapsed', () => {
      renderComponent();

      // Check instructor info
      expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('s.johnson@university.edu')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('DSJ');
      
      // Check badges
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('2 Courses')).toBeInTheDocument();

      // Ensure details are hidden
      expect(screen.queryByText('Course Requirements')).not.toBeInTheDocument();
      expect(screen.queryByText('CS101 - A')).not.toBeInTheDocument();
    });

    it('should display singular "Course" when count is 1', () => {
        renderComponent({ visibleOfferingsCount: 1 });
        expect(screen.getByText('1 Course')).toBeInTheDocument();
    });
  });

  describe('Rendering (Expanded State)', () => {
    it('should render course offerings when expanded', () => {
      renderComponent({ isExpanded: true });

      // Details should now be visible
      expect(screen.getByText('Course Requirements')).toBeInTheDocument();
      expect(screen.getByText('CS101 - A')).toBeInTheDocument();
      expect(screen.getByText('CS303 - B')).toBeInTheDocument();
      
      // Check for one of the requirements to ensure nested content is rendered
      expect(screen.queryByText('Knows Python')).not.toBeInTheDocument(); // Nested offering is collapsed by default
    });

    it('should display an empty state message when filteredOfferings is empty', () => {
      renderComponent({ isExpanded: true, filteredOfferings: [], visibleOfferingsCount: 0 });

      expect(screen.getByText('No course offerings match the current filters.')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onToggle when the main header is clicked', async () => {
        renderComponent();
        // Find the text and then click its parent that has the `type="button"` attribute.
        const headerText = screen.getByText(/dr. sarah johnson/i);
        await user.click(headerText.closest('[type="button"]'));
        expect(onToggle).toHaveBeenCalledTimes(1);
      });
  

      it('should call onEdit when "Edit Instructor" is clicked', async () => {
        renderComponent();
        // Find the icon by its test ID and click its parent button
        const moreOptionsIcon = screen.getByTestId('more-horizontal-icon');
        await user.click(moreOptionsIcon.closest('button'));
        
        // Now click the menu item
        await user.click(screen.getByRole('menuitem', { name: /edit instructor/i }));
        
        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit).toHaveBeenCalledWith(mockInstructor);
      });
      it('should call onDelete when "Delete Instructor" is clicked', async () => {
        renderComponent();
        // Find the icon by its test ID and click its parent button
        const moreOptionsIcon = screen.getByTestId('more-horizontal-icon');
        await user.click(moreOptionsIcon.closest('button'));
  
        // Now click the menu item
        await user.click(screen.getByRole('menuitem', { name: /delete instructor/i }));
        
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith(mockInstructor.instructorId);
      });

      it('should expand and collapse a nested offering when its header is clicked', async () => {
        renderComponent({ isExpanded: true });
  
        // Find the nested offering header by its text and then find its clickable parent
        const offeringHeaderText = screen.getByText(/cs101 - a/i);
        const offeringHeader = offeringHeaderText.closest('[type="button"]');
        
        // Initially, requirements are not visible
        expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();
  
        // Expand the offering
        await user.click(offeringHeader);
        expect(await screen.findByText('Knows Python')).toBeInTheDocument();
        expect(screen.getByText('Good communication')).toBeInTheDocument();
  
        // Collapse the offering
        await user.click(offeringHeader);
        expect(screen.queryByText('Knows Python')).not.toBeInTheDocument();
      });
  });
});
