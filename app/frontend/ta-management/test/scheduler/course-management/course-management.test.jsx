import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CourseManagement from '@/pages/Scheduler/course-management';
import { SidebarProvider } from '@/components/ui/sidebar';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  PanelLeft: () => <svg data-testid="panel-left-icon" />,
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

// Mock CourseCard with minimal data-testid
vi.mock('@/components/scheduler/course_management/course-card', () => ({
  CourseCard: ({ course }) => (
    <div data-testid={`course-card-${course.id}`}>
      {course.code} - {course.title}
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

  it('calls handleAddCourse when clicking Add Course button in header', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <SidebarProvider>
          <CourseManagement />
        </SidebarProvider>
      </MemoryRouter>
    );
    await user.click(screen.getByRole('button', { name: 'Add Course' }));
    expect(consoleLogSpy).toHaveBeenCalledWith('Add course clicked');
    consoleLogSpy.mockRestore();
  });
});