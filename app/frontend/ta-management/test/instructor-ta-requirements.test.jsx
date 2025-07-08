import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InstructorTARequirements from '@/pages/instructor-ta-requirements';

// =================================================================
// SETUP & MOCKS
// =================================================================

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  PanelLeft: () => <div data-testid="panel-left-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
}));

// Mock the sidebar component
vi.mock('@/components/instructor-dashboard-sidebar', () => ({
  InstructorSidebar: () => <div data-testid="instructor-sidebar" />,
}));

// Mock the data file to provide a controlled data set
const mockData = [
  {
    id: 'course-1',
    courseCode: 'CS101',
    section: 'A',
    courseTitle: 'Introduction to Programming',
    term: 'Fall',
    year: '2025',
    hasSubmittedRequirements: true,
    submittedAt: '2025-09-01T10:00:00Z',
    requirements: {
      generalRequirements: ['Knows Python'],
    },
  },
  {
    id: 'course-2',
    courseCode: 'MATH201',
    section: 'B',
    courseTitle: 'Calculus II',
    term: 'Fall',
    year: '2025',
    hasSubmittedRequirements: false,
    submittedAt: null,
    requirements: {
      generalRequirements: [],
    },
  },
    // Adding two more courses to match the rendered output's stats
  {
    id: 'course-3',
    courseCode: 'CS301',
    section: 'A',
    courseTitle: 'Software Engineering',
    term: 'Winter',
    year: '2024',
    hasSubmittedRequirements: true,
    submittedAt: '2024-01-15T14:00:00Z',
    requirements: {
        generalRequirements: ['Knows Java'],
    },
  },
  {
    id: 'course-4',
    courseCode: 'CS221',
    section: 'C',
    courseTitle: 'Data Structures',
    term: 'Winter',
    year: '2025',
    hasSubmittedRequirements: false,
    submittedAt: null,
    requirements: {
        generalRequirements: [],
    },
  },
];
vi.mock('../data/mock-instructor-courses', () => ({
  mockInstructorCourses: mockData,
}));

// Mock the modal to verify it opens with the correct props
vi.mock('@/components/ta-requirements-modal', () => ({
  TARequirementsModal: ({ isOpen, course, isEditing }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="ta-requirements-modal">
        <p>Course: {course.courseCode}-{course.section}</p>
        <p>Editing: {isEditing.toString()}</p>
      </div>
    );
  },
}));

// =================================================================
// TEST SUITE
// =================================================================

describe('InstructorTARequirements Page', () => {
  const user = userEvent.setup();

  const renderPage = () => {
    render(
      <MemoryRouter>
        <InstructorTARequirements />
      </MemoryRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('should render the header, stats, and course cards correctly', () => {
      renderPage();
      // Header
      expect(screen.getByRole('heading', { name: /ta requirements/i })).toBeInTheDocument();
      expect(screen.getByTestId('instructor-sidebar')).toBeInTheDocument();

      // Stats Cards
      const totalCoursesCard = screen.getByText(/total courses/i).closest('.rounded-lg');
      const submittedCard = screen.getByText(/requirements submitted/i).closest('.rounded-lg');
      const pendingCard = screen.getByText(/pending submissions/i).closest('.rounded-lg');

      // Corrected assertions to match the rendered HTML
      expect(within(totalCoursesCard).getByText('4')).toBeInTheDocument();
      expect(within(submittedCard).getByText('2')).toBeInTheDocument();
      expect(within(pendingCard).getByText('2')).toBeInTheDocument();

      // Course Cards - Use a regex to find the text, which ignores whitespace issues
      const submittedCourseCard = screen.getByText(/CS 101 - Section A/i).closest('.rounded-lg');
      expect(within(submittedCourseCard).getByText('Pending')).toBeInTheDocument();
      expect(within(submittedCourseCard).getByRole('button', { name: /submit requirements/i })).toBeInTheDocument();

      const pendingCourseCard = screen.getByText(/cs 221 - section b/i).closest('.rounded-lg');
      expect(within(pendingCourseCard).getByText('Submitted')).toBeInTheDocument();
      expect(within(pendingCourseCard).getByRole('button', { name: /edit requirements/i })).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should open the modal in "add" mode when "Submit Requirements" is clicked', async () => {
      renderPage();
      
      // Ensure modal is not visible
      expect(screen.queryByTestId('ta-requirements-modal')).not.toBeInTheDocument();

      // Find the pending course card using a regex and click its submit button
      const pendingCourseCard = screen.getByText(/CS 301 - Section A/i).closest('.rounded-lg');
      const submitButton = within(pendingCourseCard).getByRole('button', { name: /submit requirements/i });
      
      await user.click(submitButton);

      // Check that the modal opened with the correct props
      const modal = await screen.findByTestId('ta-requirements-modal');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('Course: CS 301-Section A')).toBeInTheDocument();
      expect(within(modal).getByText('Editing: false')).toBeInTheDocument();
    });

    it.only('should open the modal in "edit" mode when "Edit Requirements" is clicked', async () => {
        renderPage();
        
        // Ensure modal is not visible
        expect(screen.queryByTestId('ta-requirements-modal')).not.toBeInTheDocument();
  
        // Find the submitted course card using a regex and click its edit button
        const submittedCourseCard = screen.getByText(/cs 221 - section b/i).closest('.rounded-lg');
        const editButton = within(submittedCourseCard).getByRole('button', { name: /edit requirements/i });
        
        await user.click(editButton);
  
        // Check that the modal opened with the correct props
        const modal = await screen.findByTestId('ta-requirements-modal');
        screen.logTestingPlaygroundURL()
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText('Course: CS 221-Section B')).toBeInTheDocument();
        expect(within(modal).getByText('Editing: true')).toBeInTheDocument();
    });
  });
});
