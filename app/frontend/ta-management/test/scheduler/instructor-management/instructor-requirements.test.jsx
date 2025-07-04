import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InstructorRequirements from '@/pages/Scheduler/instructor-requirements';

// =================================================================
// SETUP & MOCKS
// =================================================================

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  Users: () => <div data-testid="users-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  PanelLeft: () => <div data-testid="panel-left-icon" />,
}));

// Mock the AppSidebar component
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

// Mock the data file by defining the data directly inside the factory function
vi.mock('@/data/mock-instructor-requirements', () => ({
  mockInstructorRequirements: [
    {
      instructorId: 'inst-001',
      instructorName: 'Dr. Sarah Johnson',
      email: 's.johnson@university.edu',
      department: 'Computer Science',
      courseOfferings: [
        { offeringId: 'off-001', courseCode: 'CS101', courseTitle: 'Intro to Programming', year: '2025', term: 'Fall' },
      ],
    },
    {
      instructorId: 'inst-002',
      instructorName: 'Prof. Lisa Anderson',
      email: 'l.anderson@university.edu',
      department: 'Mathematics',
      courseOfferings: [
        { offeringId: 'off-002', courseCode: 'MATH201', courseTitle: 'Calculus II', year: '2024', term: 'Spring' },
      ],
    },
  ]
}));

// Mock the child components to test the integration logic of the page
vi.mock('@/components/scheduler/instructor-management/instructor-requirement-card', () => ({
  InstructorRequirementsCard: ({ instructor, onToggle, onEdit, onDelete }) => (
    <div data-testid={`instructor-card-${instructor.instructorId}`}>
      <button onClick={onToggle}>Toggle {instructor.instructorName}</button>
      <button onClick={() => onEdit(instructor)}>Edit {instructor.instructorName}</button>
      <button onClick={() => onDelete(instructor.instructorId)}>Delete {instructor.instructorName}</button>
    </div>
  ),
}));

vi.mock('@/components/scheduler/instructor-management/requirement-filters', () => ({
  RequirementsFilters: ({ onSearchChange, onDepartmentChange, onYearChange, onTermChange }) => (
    <div>
      <input aria-label="Search" onChange={(e) => onSearchChange(e.target.value)} />
      <select aria-label="Department" onChange={(e) => onDepartmentChange(e.target.value)}>
        <option value="all">All Departments</option>
        <option value="Computer Science">Computer Science</option>
        <option value="Mathematics">Mathematics</option>
      </select>
      <select aria-label="Year" onChange={(e) => onYearChange(e.target.value)}>
        <option value="all">All Years</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
      </select>
      <select aria-label="Term" onChange={(e) => onTermChange(e.target.value)}>
        <option value="all">All Terms</option>
        <option value="Fall">Fall</option>
        <option value="Spring">Spring</option>
      </select>
    </div>
  ),
}));

vi.mock('@/components/scheduler/instructor-management/add-instructor-modal', () => ({
  AddInstructorModal: ({ isOpen }) => (isOpen ? <div data-testid="add-instructor-modal" /> : null),
}));

vi.mock('@/components/scheduler/instructor-management/edit-instructor-modal', () => ({
  EditInstructorModal: ({ isOpen, instructor }) => (isOpen ? <div data-testid="edit-instructor-modal">{instructor.instructorName}</div> : null),
}));


// =================================================================
// TEST SUITE
// =================================================================

describe('InstructorRequirements Page', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock window.confirm for the delete action
    window.confirm = vi.fn(() => true);
  });

  const renderPage = () => {
    render(
      <MemoryRouter>
        <InstructorRequirements />
      </MemoryRouter>
    );
  };

  describe('Initial Rendering', () => {
    it('should render the header, stats, filters, and initial list of instructors', () => {
        renderPage();
        
        // Header
        expect(screen.getByRole('heading', { name: /instructor requirements/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add instructor/i })).toBeInTheDocument();
  
        // Stats
        // Find the parent card for each stat to avoid ambiguity
        const instructorsCard = screen.getByText(/total instructors/i).closest('.rounded-lg');
        const requirementsCard = screen.getByText(/total requirements/i).closest('.rounded-lg');
  
        // Assert the values within their specific cards
        expect(within(instructorsCard).getByText('2')).toBeInTheDocument();
        expect(within(instructorsCard).getByText(/of 2 total instructors/i)).toBeInTheDocument();
        
        expect(within(requirementsCard).getByText('2')).toBeInTheDocument();
        expect(within(requirementsCard).getByText(/of 2 total requirements/i)).toBeInTheDocument();
  
        // Instructor Cards
        expect(screen.getByTestId('instructor-card-inst-001')).toBeInTheDocument();
        expect(screen.getByTestId('instructor-card-inst-002')).toBeInTheDocument();
      });
  });

  describe('Filtering and Searching', () => {
    it('should filter instructors by search query', async () => {
      renderPage();
      
      expect(screen.getByTestId('instructor-card-inst-001')).toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-inst-002')).toBeInTheDocument();

      const searchInput = screen.getByLabelText('Search');
      await user.type(searchInput, 'Lisa');

      expect(screen.queryByTestId('instructor-card-inst-001')).not.toBeInTheDocument();
      expect(screen.getByTestId('instructor-card-inst-002')).toBeInTheDocument();
    });

    it('should filter instructors by department', async () => {
        renderPage();
        const departmentSelect = screen.getByLabelText('Department');
        await user.selectOptions(departmentSelect, 'Mathematics');
  
        expect(screen.queryByTestId('instructor-card-inst-001')).not.toBeInTheDocument();
        expect(screen.getByTestId('instructor-card-inst-002')).toBeInTheDocument();
    });

    it('should filter instructors by year', async () => {
        renderPage();
        const yearSelect = screen.getByLabelText('Year');
        await user.selectOptions(yearSelect, '2025');
  
        expect(screen.getByTestId('instructor-card-inst-001')).toBeInTheDocument();
        expect(screen.queryByTestId('instructor-card-inst-002')).not.toBeInTheDocument();
    });

    it('should display an empty state when no instructors match filters', async () => {
        renderPage();
        const searchInput = screen.getByLabelText('Search');
        await user.type(searchInput, 'NonExistentName');

        // The empty state is now a Card, so we query for its content
        expect(screen.getByText('No instructors found')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should open the AddInstructorModal when the "Add Instructor" button is clicked', async () => {
      renderPage();
      
      expect(screen.queryByTestId('add-instructor-modal')).not.toBeInTheDocument();
      
      const addButton = screen.getByRole('button', { name: /add instructor/i });
      await user.click(addButton);

      expect(screen.getByTestId('add-instructor-modal')).toBeInTheDocument();
    });

    it('should open the EditInstructorModal with correct data when an edit button is clicked', async () => {
        renderPage();
        
        expect(screen.queryByTestId('edit-instructor-modal')).not.toBeInTheDocument();
        
        // Find the edit button within the specific instructor's card mock
        const card = screen.getByTestId('instructor-card-inst-001');
        const editButton = within(card).getByRole('button', { name: /edit dr. sarah johnson/i });
        await user.click(editButton);
  
        const modal = screen.getByTestId('edit-instructor-modal');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveTextContent('Dr. Sarah Johnson');
    });
  });

  describe('State Management', () => {
    it('should call the delete handler when a delete button is clicked', async () => {
        renderPage();
        const card = screen.getByTestId('instructor-card-inst-002');
        const deleteButton = within(card).getByRole('button', { name: /delete prof. lisa anderson/i });
        
        await user.click(deleteButton);

        // Check that window.confirm was called
        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure you want to delete Prof. Lisa Anderson?'));

        // Since we mocked confirm to return true, the instructor should be removed
        expect(screen.queryByTestId('instructor-card-inst-002')).not.toBeInTheDocument();
    });
  });
});
