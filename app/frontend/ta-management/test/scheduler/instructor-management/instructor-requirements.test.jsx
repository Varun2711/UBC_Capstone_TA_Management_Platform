import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InstructorRequirements from '@/pages/Scheduler/instructor-requirements';

// =================================================================
// SETUP & MOCKS
// =================================================================

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  Users: () => <div data-testid="users-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  PanelLeft: () => <div data-testid="panel-left-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  X: () => <div data-testid="close-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
}));

// Mock components
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle Sidebar</button>,
  SidebarInset: ({ children }) => <div data-testid="sidebar-inset">{children}</div>,
}));

// Mock data
const mockInstructors = [
  {
    id: 1,
    employee_number: 'EMP001',
    name: 'Dr. Sarah Johnson',
    email: 's.johnson@university.edu',
    department: 1,
  },
  {
    id: 2,
    employee_number: 'EMP002',
    name: 'Prof. Lisa Anderson',
    email: 'l.anderson@university.edu',
    department: 2,
  },
];

const mockDepartments = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Mathematics' },
];

const mockRequests = [
  {
    request_id: 'req-001',
    instructor_id: 1,
    course_offering_id: 'off-001',
    request_date: '2025-05-15',
    request_description: ['Knows Python', 'Good communication'],
  },
  {
    request_id: 'req-002',
    instructor_id: 2,
    course_offering_id: 'off-002',
    request_date: '2025-05-16',
    request_description: ['Data structures mastery'],
  },
];

const mockCourseOfferings = [
  {
    course_offering_id: 'off-001',
    course_info: 'COSC 101 Introduction to Programming',
    term_info: 'Winter 2025 Term 1',
    section_number: 'A',
  },
  {
    course_offering_id: 'off-002',
    course_info: 'MATH 201 Calculus II',
    term_info: 'Summer 2024 Term 1',
    section_number: 'B',
  },
];

vi.mock('@/logic/instructorManagement', () => ({
  getInstructors: vi.fn(),
  getDepartments: vi.fn(),
  getInstructorRequests: vi.fn(),
  getCourseOfferings: vi.fn(),
  deleteInstructor: vi.fn(),
}));

// Mock child components
vi.mock('@/components/scheduler/instructor-management/instructor-requirement-card', () => ({
  InstructorRequirementsCard: ({ instructor, onToggle, onEdit, onDelete, filteredOfferings }) => (
    <div data-testid={`instructor-card-${instructor.instructorId}`}>
      <span data-testid="instructor-name">{instructor.instructorName}</span>
      <span data-testid="instructor-department">{instructor.departmentName}</span>
      <span data-testid="offerings-count">{filteredOfferings.length} offerings</span>
      <button onClick={onToggle}>Toggle {instructor.instructorName}</button>
      <button onClick={() => onEdit(instructor)}>Edit {instructor.instructorName}</button>
      <button onClick={() => onDelete(instructor.instructorId)}>Delete {instructor.instructorName}</button>
    </div>
  ),
}));

vi.mock('@/components/scheduler/instructor-management/requirement-filters', () => ({
  RequirementsFilters: ({ 
    searchQuery, 
    onSearchChange, 
    onDepartmentChange, 
    onYearChange, 
    onTermChange,
    departments,
    years,
    terms
  }) => (
    <div data-testid="requirements-filters">
      <input 
        aria-label="Search" 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)} 
      />
      <select aria-label="Department" onChange={(e) => onDepartmentChange(e.target.value)}>
        <option value="all">All Departments</option>
        {departments.map(dept => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
      <select aria-label="Year" onChange={(e) => onYearChange(e.target.value)}>
        <option value="all">All Years</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <select aria-label="Term" onChange={(e) => onTermChange(e.target.value)}>
        <option value="all">All Terms</option>
        {terms.map(term => (
          <option key={term} value={term}>{term}</option>
        ))}
      </select>
    </div>
  ),
}));

// =================================================================
// TEST SUITE
// =================================================================

describe('InstructorRequirements Page - Backend Integration', () => {
  const user = userEvent.setup();
  
  let getInstructors, getDepartments, getInstructorRequests, getCourseOfferings, deleteInstructor;

  beforeEach(async () => {
    const instructorManagement = await import('@/logic/instructorManagement');
    getInstructors = instructorManagement.getInstructors;
    getDepartments = instructorManagement.getDepartments;
    getInstructorRequests = instructorManagement.getInstructorRequests;
    getCourseOfferings = instructorManagement.getCourseOfferings;
    deleteInstructor = instructorManagement.deleteInstructor;

    vi.clearAllMocks();
    getInstructors.mockResolvedValue(mockInstructors);
    getDepartments.mockResolvedValue(mockDepartments);
    getInstructorRequests.mockResolvedValue(mockRequests);
    getCourseOfferings.mockResolvedValue(mockCourseOfferings);
    deleteInstructor.mockResolvedValue();

    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderPage = async () => {
    let result;
    await act(async () => {
      result = render(
        <MemoryRouter>
          <InstructorRequirements />
        </MemoryRouter>
      );
    });
    return result;
  };

  describe('Data Loading', () => {
    it('shows loading state initially when APIs are slow', async () => {
      // Make APIs slow to test loading state
      getInstructors.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve(mockInstructors), 100)
      ));
      
      await renderPage();
      
      // Should show loading initially
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('loads and displays data from backend APIs', async () => {
      await renderPage();

      // Wait for any async operations to complete
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /instructor management/i })).toBeInTheDocument();
      });

      // Verify API calls were made
      expect(getInstructors).toHaveBeenCalledTimes(1);
      expect(getDepartments).toHaveBeenCalledTimes(1);
      expect(getInstructorRequests).toHaveBeenCalledTimes(1);
      expect(getCourseOfferings).toHaveBeenCalledTimes(1);

      // Verify UI displays the loaded data
      expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();
      
      // Check that instructor data is properly mapped using getAllByTestId
      const instructorNames = screen.getAllByTestId('instructor-name');
      expect(instructorNames[0]).toHaveTextContent('Dr. Sarah Johnson');
      expect(instructorNames[1]).toHaveTextContent('Prof. Lisa Anderson');
      
      // Use more specific selectors for department names within instructor cards
      const sarahCard = screen.getByTestId('instructor-card-EMP001');
      const lisaCard = screen.getByTestId('instructor-card-EMP002');
      
      expect(within(sarahCard).getByTestId('instructor-department')).toHaveTextContent('Computer Science');
      expect(within(lisaCard).getByTestId('instructor-department')).toHaveTextContent('Mathematics');
    });

    it('shows error state when API calls fail', async () => {
      getInstructors.mockRejectedValue(new Error('API Error'));
      
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      });

      expect(screen.getByText('Could not load data. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Data Processing and Filtering', () => {
    it('processes course offerings and maps them correctly to instructors', async () => {
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      });

      // Check that offerings are correctly mapped to instructors
      const sarahCard = screen.getByTestId('instructor-card-EMP001');
      expect(within(sarahCard).getByTestId('offerings-count')).toHaveTextContent('1 offerings');

      const lisaCard = screen.getByTestId('instructor-card-EMP002');
      expect(within(lisaCard).getByTestId('offerings-count')).toHaveTextContent('1 offerings');
    });

    it('filters instructors by search query using backend data', async () => {
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      });

      // Initially both instructors should be visible
      expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();

      // Search for "Lisa" - wrap in act since it causes state updates
      const searchInput = screen.getByLabelText('Search');
      await act(async () => {
        await user.type(searchInput, 'Lisa');
      });

      // Only Lisa should be visible
      expect(screen.queryByTestId('instructor-card-EMP001')).not.toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();
    });

    it('filters by department using backend department data', async () => {
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      });

      const departmentSelect = screen.getByLabelText('Department');
      await act(async () => {
        await user.selectOptions(departmentSelect, 'Mathematics');
      });

      expect(screen.queryByTestId('instructor-card-EMP001')).not.toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();
    });

    it('shows empty state when no instructors match filters', async () => {
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP001')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Search');
      await act(async () => {
        await user.type(searchInput, 'NonExistentName');
      });

      expect(screen.getByText('No instructors match the current filters.')).toBeInTheDocument();
    });
  });

  describe('Backend Operations', () => {
    it('calls delete API and refreshes data when instructor is deleted', async () => {
      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();
      });

      // Clear the initial API calls
      vi.clearAllMocks();
      
      // Reset the mocks for the refresh call
      getInstructors.mockResolvedValue(mockInstructors.filter(i => i.employee_number !== 'EMP002'));
      getDepartments.mockResolvedValue(mockDepartments);
      getInstructorRequests.mockResolvedValue(mockRequests.filter(r => r.instructor_id !== 2));
      getCourseOfferings.mockResolvedValue(mockCourseOfferings);

      const lisaCard = screen.getByTestId('instructor-card-EMP002');
      const deleteButton = within(lisaCard).getByRole('button', { name: /delete prof. lisa anderson/i });
      
      // Wrap delete action in act since it triggers state updates
      await act(async () => {
        await user.click(deleteButton);
      });

      // Verify confirm dialog and delete API call
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete Prof. Lisa Anderson?');
      expect(deleteInstructor).toHaveBeenCalledWith('EMP002');

      // Verify data refresh after delete
      await waitFor(() => {
        expect(getInstructors).toHaveBeenCalledTimes(1);
        expect(getDepartments).toHaveBeenCalledTimes(1);
        expect(getInstructorRequests).toHaveBeenCalledTimes(1);
        expect(getCourseOfferings).toHaveBeenCalledTimes(1);
      });
    });

    it('handles delete API errors gracefully', async () => {
      // Mock delete to fail
      deleteInstructor.mockRejectedValue(new Error('Delete failed'));

      await renderPage();

      await waitFor(() => {
        expect(screen.getByTestId('instructor-card-EMP002')).toBeInTheDocument();
      });

      const lisaCard = screen.getByTestId('instructor-card-EMP002');
      const deleteButton = within(lisaCard).getByRole('button', { name: /delete prof. lisa anderson/i });
      
      // Wrap in act since it triggers state updates (even error handling)
      await act(async () => {
        await user.click(deleteButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Error: Could not delete Prof. Lisa Anderson.');
      });
    });
  });
});