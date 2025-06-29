import { render, screen , within} from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CourseManagement from '@/pages/Scheduler/course-management';
import { SidebarProvider } from '@/components/ui/sidebar';
import { X, ChevronDown, Edit, ChevronsUpDown, Check, Calendar, AlertCircle } from 'lucide-react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  PanelLeft: () => <svg data-testid="panel-left-icon" />,
  X: () => <X data-testid="close-icon" />,
  ChevronDown: () => <ChevronDown data-testid="chevron-down-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  ChevronsUpDown: () => <ChevronsUpDown data-testid="chevrons-up-down-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  Calendar: () => <Calendar data-testid="calendar-icon" />,
  AlertCircle: () => <AlertCircle data-testid="alert-circle-icon" />,
}));

// Mock useMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => ({ isMobile: false }),
}));


// Mock mockCourses to match HTML
vi.mock('@/data/mock-courses', () => ({
  mockCourses: [
    {
      id: 'cs101',
      code: 'CS101',
      title: 'Introduction to Computer Science',
      department: 'Computer Science',
      description: 'A foundational course in programming.',
      offerings: [
        { id: '1', term: 'Fall', year: '2025', section: 'A' },
        { id: '2', term: 'Spring', year: '2025', section: 'B' },
        { id: '3', term: 'Winter', year: '2025', section: 'C' },
      ],
      sharedSessions: {
        'Fall-2025': { labs: [], tutorials: [] },
        'Spring-2025': { labs: [], tutorials: [] },
        'Winter-2025': { labs: [], tutorials: [] },
      },
    },
    {
      id: 'math201',
      code: 'MATH201',
      title: 'Calculus II',
      department: 'Mathematics',
      description: 'Advanced calculus concepts.',
      offerings: [
        { id: '4', term: 'Fall', year: '2024', section: 'A' },
        { id: '5', term: 'Spring', year: '2024', section: 'B' },
      ],
      sharedSessions: {
        'Fall-2024': { labs: [], tutorials: [] },
        'Spring-2024': { labs: [], tutorials: [] },
      },
    },
    {
      id: 'phys301',
      code: 'PHYS301',
      title: 'Quantum Mechanics',
      department: 'Physics',
      description: 'An introductory quantum mechanics course.',
      offerings: [{ id: '6', term: 'Fall', year: '2024', section: 'A' }],
      sharedSessions: {
        'Fall-2024': { labs: [], tutorials: [] },
      },
    },
  ],
}));

// Mock CourseCard with props to simulate all interactions
vi.mock('@/components/scheduler/course_management/course-card', () => ({
  CourseCard: ({ course, onEdit, onEditOffering, onAddLabTutorial }) => (
    <div data-testid={`course-card-${course.id}`}>
      {course.code} - {course.title}
      <button onClick={() => onEdit(course)}>Edit Course</button>
      {course.offerings.map(offering => (
        <div key={offering.id} data-testid={`offering-${offering.id}`}>
            <button onClick={() => onEditOffering(offering)}>Edit Offering: {offering.section}</button>
            <button onClick={() => onAddLabTutorial(offering)}>Add Lab/Tutorial to {offering.section}</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock CourseFilters with minimal data-testid
vi.mock('@/components/scheduler/course_management/course-filters', () => ({
  CourseFilters: ({ searchQuery, onSearchChange }) => (
    <div data-testid="course-filters">
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  ),
}));

// Mock all modals to check for their presence
vi.mock('@/components/scheduler/course_management/edit-course-modal', () => ({
  EditCourseModal: ({ isOpen, course }) =>
    isOpen ? <div data-testid="edit-course-modal">Editing Course: {course.title}</div> : null,
}));

vi.mock('@/components/scheduler/course_management/add-course-modal', () => ({
  AddCourseModal: ({ isOpen }) =>
    isOpen ? <div data-testid="add-course-modal">Add Course Modal</div> : null,
}));

vi.mock('@/components/scheduler/course_management/edit-offering-modal', () => ({
  EditOfferingModal: ({ isOpen, course, offering }) =>
    isOpen ? <div data-testid="edit-offering-modal">Editing Offering: {offering.section} for {course.code}</div> : null,
}));

vi.mock('@/components/scheduler/course_management/add-lab-tutorial-modal', () => ({
    AddLabTutorialModal: ({ isOpen, course, offering }) =>
        isOpen ? <div data-testid="add-lab-tutorial-modal">Adding Lab/Tutorial for: {offering.section}</div> : null,
}));


// Mock EmptyState with minimal data-testid
vi.mock('@/components/scheduler/course_management/empty-state', () => ({
  EmptyState: () => <div data-testid="empty-state">No courses found</div>,
}));

// Mock AppSidebar with minimal data-testid
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar"></div>,
}));

describe('CourseManagement Page', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header with SidebarTrigger, Breadcrumb, and action buttons', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toHaveTextContent('Course Management');
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
  });

  it('renders main content with title and description', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Course Management' })).toBeInTheDocument();
    expect(screen.getByText('Manage courses, offerings, and associated lab/tutorial sessions')).toBeInTheDocument();
  });

  it('renders AppSidebar and CourseFilters', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('course-filters')).toBeInTheDocument();
  });

  it('renders CourseCards for non-empty course list', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('course-card-cs101')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-math201')).toBeInTheDocument();
  });

  it('renders EmptyState when no courses match filters', async () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    await user.type(screen.getByTestId('search-input'), 'Nonexistent');
    expect(screen.queryByTestId('course-card-cs101')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('opens the AddCourseModal when clicking the Add Course button', async () => {
    render(
      <MemoryRouter>
        <CourseManagement />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('add-course-modal')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Course' }));
    expect(screen.getByTestId('add-course-modal')).toBeInTheDocument();
  });

  it('opens the EditCourseModal with the correct course when a course edit button is clicked', async () => {
    render(
      <MemoryRouter>
        <CourseManagement />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('edit-course-modal')).not.toBeInTheDocument();
    const cs101Card = screen.getByTestId('course-card-cs101');
    const editButton = within(cs101Card).getByRole('button', { name: /edit course/i });
    await user.click(editButton);
    const editModal = screen.getByTestId('edit-course-modal');
    expect(editModal).toBeInTheDocument();
    expect(editModal).toHaveTextContent('Editing Course: Introduction to Computer Science');
  });

  it('opens the EditOfferingModal with correct data when an offering edit button is clicked', async () => {
    render(
        <MemoryRouter>
          <CourseManagement />
        </MemoryRouter>
      );
    expect(screen.queryByTestId('edit-offering-modal')).not.toBeInTheDocument();
    const offeringB_Card = screen.getByTestId('offering-2');
    const editOfferingButton = within(offeringB_Card).getByRole('button', { name: /edit offering: b/i });
    await user.click(editOfferingButton);
    const editOfferingModal = screen.getByTestId('edit-offering-modal');
    expect(editOfferingModal).toBeInTheDocument();
    expect(editOfferingModal).toHaveTextContent('Editing Offering: B for CS101');
  });

  it('opens the AddLabTutorialModal with correct data when button is clicked', async () => {
    render(
      <MemoryRouter>
        <CourseManagement />
      </MemoryRouter>
    );
    // Ensure modal is not visible initially
    expect(screen.queryByTestId('add-lab-tutorial-modal')).not.toBeInTheDocument();

    // Find the button to add a lab/tutorial to section 'C'
    const offeringC_Card = screen.getByTestId('offering-3');
    const addLabButton = within(offeringC_Card).getByRole('button', { name: /add lab\/tutorial to c/i });

    // Click the button
    await user.click(addLabButton);

    // Assert that the modal is now visible
    const addLabModal = screen.getByTestId('add-lab-tutorial-modal');
    expect(addLabModal).toBeInTheDocument();

    // Assert that the modal received the correct offering data
    expect(addLabModal).toHaveTextContent('Adding Lab/Tutorial for: C');
  });
});
