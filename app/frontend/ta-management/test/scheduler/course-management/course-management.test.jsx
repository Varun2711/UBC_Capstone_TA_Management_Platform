import { render, screen , within} from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CourseManagement from '@/pages/Scheduler/course-management';
import { SidebarProvider } from '@/components/ui/sidebar';
import { X, ChevronDown, Edit } from 'lucide-react';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  PanelLeft: () => <svg data-testid="panel-left-icon" />,
  X: () => <X data-testid="close-icon" />,
  ChevronDown: () => <ChevronDown data-testid="chevron-down-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
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

// Mock CourseCard with minimal data-testid and props
vi.mock('@/components/scheduler/course_management/course-card', () => ({
  // The mock now gives us access to the props
  CourseCard: ({ course, onEdit }) => (
    <div data-testid={`course-card-${course.id}`}>
      {course.code} - {course.title}
      {/* Add a button to simulate the interaction */}
      <button onClick={() => onEdit(course)}>Edit</button>
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

// Mock EditCourseModal to check for its presence
vi.mock('@/components/scheduler/course_management/edit-course-modal', () => ({
  EditCourseModal: ({ isOpen, course }) =>
    isOpen ? <div data-testid="edit-course-modal">Editing: {course.title}</div> : null,
}));



// Mock AddCourseModal to check for its presence
vi.mock('@/components/scheduler/course_management/add-course-modal', () => ({
  AddCourseModal: ({ isOpen }) =>
    isOpen ? <div data-testid="add-course-modal">Add Course Modal</div> : null,
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
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Course' })).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
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
    expect(screen.getByTestId('course-card-phys301')).toBeInTheDocument();
    expect(screen.getByText('CS101 - Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('MATH201 - Calculus II')).toBeInTheDocument();
    expect(screen.getByText('PHYS301 - Quantum Mechanics')).toBeInTheDocument();
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
    expect(screen.queryByTestId('course-card-math201')).not.toBeInTheDocument();
    expect(screen.queryByTestId('course-card-phys301')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('opens the AddCourseModal when clicking the Add Course button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CourseManagement />
      </MemoryRouter>
    );
  
    // The modal should not be visible initially
    expect(screen.queryByTestId('add-course-modal')).not.toBeInTheDocument();
  
    // Click the "Add Course" button
    await user.click(screen.getByRole('button', { name: 'Add Course' }));
  
    // Assert that the modal is now visible in the document
    expect(screen.getByTestId('add-course-modal')).toBeInTheDocument();
  });

  it('opens the EditCourseModal with the correct course when an edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CourseManagement />
      </MemoryRouter>
    );
  
    // 1. Ensure the modal is not visible initially
    expect(screen.queryByTestId('edit-course-modal')).not.toBeInTheDocument();
  
    // 2. Find the specific "Edit" button for the first course within our mocked card
    const cs101Card = screen.getByTestId('course-card-cs101');
    const editButton = within(cs101Card).getByRole('button', { name: /edit/i });
  
    // 3. Click the button
    await user.click(editButton);
  
    // 4. Assert that the modal is now visible and contains the correct course title
    const editModal = screen.getByTestId('edit-course-modal');
    expect(editModal).toBeInTheDocument();
    expect(editModal).toHaveTextContent('Editing: Introduction to Computer Science');
  });
});