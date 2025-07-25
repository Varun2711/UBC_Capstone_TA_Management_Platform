import { render, screen, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CourseDetails from '@/pages/Instructor/CourseDetails';
import { SidebarProvider } from '@/components/ui/sidebar';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Bell: () => <span data-testid="bell-icon" />,
  ArrowLeft: () => <span data-testid="arrow-left-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  MapPin: () => <span data-testid="map-pin-icon" />,
  User: () => <span data-testid="user-icon" />,
  PanelLeft: () => <span data-testid="panel-left-icon" />,
}));

// Mock mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => ({ isMobile: false }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ courseId: 'CS101', term: 'F2024_T1' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: ({ events, localizer, ...props }) => (
    <div data-testid="big-calendar">
      <div data-testid="calendar-events">
        {events?.map((event, index) => (
          <div key={index} data-testid={`calendar-event-${index}`}>
            {event.title} - {event.resource?.section}
          </div>
        ))}
      </div>
    </div>
  ),
  momentLocalizer: () => ({ format: vi.fn() }),
}));

// Mock moment
vi.mock('moment', () => ({
  default: vi.fn(() => ({
    format: vi.fn((format) => {
      if (format === 'dddd') return 'Monday';
      return '2024-01-15';
    }),
  })),
}));

// Mock course details logic functions
vi.mock('@/logic/courseDetails', () => ({
  fetchCourseDetailsData: vi.fn(),
  transformCourseData: vi.fn(),
  generateCalendarEvents: vi.fn(),
  getEventStyle: vi.fn(() => ({ style: { backgroundColor: '#blue' } })),
  getSessionTypeColor: vi.fn((type) => {
    const colors = {
      lecture: 'bg-blue-100 text-blue-800',
      lab: 'bg-green-100 text-green-800',
      tutorial: 'bg-purple-100 text-purple-800',
      seminar: 'bg-orange-100 text-orange-800',
      workshop: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }),
}));

// Mock sidebar component
vi.mock('@/components/instructor-dashboard-sidebar', () => ({
  InstructorSidebar: ({ activePage }) => (
    <div data-testid="instructor-sidebar">Sidebar: {activePage}</div>
  ),
}));

// Import the mocked functions
import * as courseDetailsLogic from '@/logic/courseDetails';
import { PanelLeft } from 'lucide-react';

describe('CourseDetails Page', () => {
  const mockCourseData = {
    course_number: 'CS101',
    title: 'Introduction to Computer Science',
    term: 'Fall 2024 Term 1',
    description: 'Basic programming concepts and computer science fundamentals',
    stats: {
      total_tas: 8,
      lecture_sections: 2,
      lab_sections: 4,
      tutorial_sections: 2,
    },
    offerings: [
      {
        id: 'offering-1',
        section: '001',
        type: 'lecture',
        schedule_days: [
          {
            days: 'Monday, Wednesday, Friday',
            time: '10:00 AM - 11:00 AM',
            tas_assigned: [
              { name: 'John Doe', student_number: '12345678' },
              { name: 'Jane Smith', student_number: '87654321' },
            ],
          },
        ],
      },
      {
        id: 'offering-2',
        section: '002',
        type: 'lecture',
        schedule_days: [
          {
            days: 'Tuesday, Thursday',
            time: '2:00 PM - 3:30 PM',
            tas_assigned: [
              { name: 'Bob Wilson', student_number: '11223344' },
            ],
          },
        ],
      },
    ],
    shared_sessions: [
      {
        id: 'lab-1',
        section: 'L01',
        type: 'lab',
        schedule: 'Monday 2:00 PM - 4:00 PM',
        tas_assigned: [
          { name: 'Alice Johnson', student_number: '55667788' },
        ],
      },
      {
        id: 'tutorial-1',
        section: 'T01',
        type: 'tutorial',
        schedule: 'Wednesday 4:00 PM - 5:00 PM',
        tas_assigned: [
          { name: 'Charlie Brown', student_number: '99887766' },
        ],
      },
    ],
  };

  const mockApiResponse = {
    courseFullDetails: { id: 'CS101', code: 'CS101', title: 'Introduction to Computer Science' },
    offeringsWithTAs: [],
    sharedSessionsWithTAs: [],
  };

  const mockCalendarEvents = [
    {
      id: 'event-1',
      title: 'CS101 - L01',
      start: new Date(2024, 0, 15, 14, 0),
      end: new Date(2024, 0, 15, 16, 0),
      resource: { section: 'L01', tas: 'Alice Johnson' },
    },
  ];

  beforeEach(() => {
    // Setup default API responses
    vi.mocked(courseDetailsLogic.fetchCourseDetailsData).mockResolvedValue(mockApiResponse);
    vi.mocked(courseDetailsLogic.transformCourseData).mockReturnValue(mockCourseData);
    vi.mocked(courseDetailsLogic.generateCalendarEvents).mockReturnValue(mockCalendarEvents);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (params = { courseId: 'CS101', term: 'F2024_T1' }) => {
    return render(
      <MemoryRouter initialEntries={[`/course-details/${params.courseId}/${params.term}`]}>
        <SidebarProvider>
          <CourseDetails />
        </SidebarProvider>
      </MemoryRouter>
    );
  };

  it('loads and displays course details after initial load', async () => {
    renderComponent();

    // Wait for the component to load by checking for unique content
    await waitFor(() => {
      expect(screen.getByText('Fall 2024 Term 1')).toBeInTheDocument();
    });

    // Verify the API calls were made correctly
    expect(courseDetailsLogic.fetchCourseDetailsData).toHaveBeenCalledWith('CS101', 'F2024_T1');
    expect(courseDetailsLogic.transformCourseData).toHaveBeenCalledWith(
      mockApiResponse.courseFullDetails,
      mockApiResponse.offeringsWithTAs,
      mockApiResponse.sharedSessionsWithTAs,
      'F2024_T1'
    );

    // Check for unique content that proves the component loaded correctly
    expect(screen.getByText('Fall 2024 Term 1')).toBeInTheDocument();
    expect(screen.getByText('Basic programming concepts and computer science fundamentals')).toBeInTheDocument();
    
    // Check for course number and title using getAllByText for elements that appear multiple times
    const cs101Elements = screen.getAllByText(/CS101/);
    expect(cs101Elements).toHaveLength(2); // One in breadcrumb, one in main heading
    
    const introElements = screen.getAllByText(/Introduction to Computer Science/);
    expect(introElements).toHaveLength(2); // One in breadcrumb, one in main heading
    
    // Verify main content is loaded by checking for the main heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check that loading state is no longer present
    expect(screen.queryByText('Loading course details...')).not.toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderComponent();

    expect(screen.getByText('Loading course details...')).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    vi.mocked(courseDetailsLogic.fetchCourseDetailsData).mockRejectedValue(new Error('API Error'));
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  it('renders header with navigation and breadcrumbs', async () => {
    renderComponent();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Fall 2024 Term 1')).toBeInTheDocument();
    });

    // Check for sidebar trigger button
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    
    // Check for bell icon
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    
    // Check for breadcrumb text directly (since the link doesn't have an accessible name)
    expect(screen.getByText('My Courses')).toBeInTheDocument();
    
    // Verify we have the course title somewhere (check that we have at least 1)
    const courseTitleElements = screen.getAllByText(/CS101 - Introduction to Computer Science/);
    expect(courseTitleElements.length).toBeGreaterThan(0);
    
    // Check for the Back to My Courses button as an alternative navigation element
    expect(screen.getByText('Back to My Courses')).toBeInTheDocument();
  });

  it('renders course statistics cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // Total TAs (unique)
    });

    // Check for card titles
    expect(screen.getByText('Total TAs')).toBeInTheDocument();
    expect(screen.getByText('Lectures')).toBeInTheDocument();
    expect(screen.getByText('Labs')).toBeInTheDocument();
    expect(screen.getByText('Tutorials')).toBeInTheDocument();
    
    // Check for unique values
    expect(screen.getByText('8')).toBeInTheDocument(); // Total TAs
    expect(screen.getByText('4')).toBeInTheDocument(); // Lab sections
    
    // For the "2" values that appear twice, use getAllByText
    const twoValues = screen.getAllByText('2');
    expect(twoValues).toHaveLength(2); // Should be exactly 2 elements with "2"
    
    // Verify the structure by checking that cards contain both title and value
    const lecturesCard = screen.getByText('Lectures').closest('.rounded-lg');
    expect(within(lecturesCard).getByText('2')).toBeInTheDocument();
    
    const tutorialsCard = screen.getByText('Tutorials').closest('.rounded-lg');
    expect(within(tutorialsCard).getByText('2')).toBeInTheDocument();
  });

  it('renders tabs and switches between them', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'My Sections' })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: 'Labs & Tutorials' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Weekly Schedule' })).toBeInTheDocument();

    // Switch to Labs & Tutorials tab
    await user.click(screen.getByRole('tab', { name: 'Labs & Tutorials' }));
    expect(screen.getByText('Lab sessions associated with your course sections')).toBeInTheDocument();

    // Switch to Weekly Schedule tab
    await user.click(screen.getByRole('tab', { name: 'Weekly Schedule' }));
    expect(screen.getByText('All course activities and TA assignments')).toBeInTheDocument();
  });

  it('displays course offerings in My Sections tab', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Section 001')).toBeInTheDocument();
    });

    expect(screen.getByText('Section 002')).toBeInTheDocument();
    expect(screen.getByText('Monday, Wednesday, Friday')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays shared sessions in Labs & Tutorials tab', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Labs & Tutorials' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Labs & Tutorials' }));

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.getByText('Monday 2:00 PM - 4:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Wednesday 4:00 PM - 5:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('displays calendar in Weekly Schedule tab', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Weekly Schedule' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Weekly Schedule' }));

    expect(screen.getByTestId('big-calendar')).toBeInTheDocument();
    expect(courseDetailsLogic.generateCalendarEvents).toHaveBeenCalledWith(mockCourseData);
    
    
    // Check calendar legend - be more specific by looking within the legend section
    expect(screen.getByText('Legend')).toBeInTheDocument();
    
    // Find the legend section and check for items within it
    const legendSection = screen.getByText('Legend').closest('.pt-4');
    expect(within(legendSection).getByText('Lectures')).toBeInTheDocument();
    expect(within(legendSection).getByText('Labs')).toBeInTheDocument();
    expect(within(legendSection).getByText('Tutorials')).toBeInTheDocument();
    expect(within(legendSection).getByText('Seminars')).toBeInTheDocument();
    expect(within(legendSection).getByText('Workshops')).toBeInTheDocument();
  });

  it('handles back navigation', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Back to My Courses')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Back to My Courses'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-courses');

    // Test breadcrumb navigation
    await user.click(screen.getByText('My Courses'));
    expect(mockNavigate).toHaveBeenCalledWith('/my-courses');
  });

  it('displays empty states when no data is available', async () => {
    const emptyData = {
      ...mockCourseData,
      offerings: [],
      shared_sessions: [],
    };
    
    vi.mocked(courseDetailsLogic.transformCourseData).mockReturnValue(emptyData);
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No course sections found for this term.')).toBeInTheDocument();
    });
  });

  it('filters shared sessions by type correctly', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Labs & Tutorials' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Labs & Tutorials' }));
    
    // Get the active tab panel to scope our searches
    const activeTabPanel = screen.getByRole('tabpanel', { name: /labs & tutorials/i });
    
    // Look for the "Labs" and "Tutorials" section titles (they're divs, not headings)
    // Based on the HTML, they have class "text-2xl font-semibold leading-none tracking-tight"
    expect(within(activeTabPanel).getByText('Labs')).toBeInTheDocument();
    expect(within(activeTabPanel).getByText('Tutorials')).toBeInTheDocument();
    
    // Verify the lab and tutorial sections contain their respective content
    expect(within(activeTabPanel).getByText('L01')).toBeInTheDocument();
    expect(within(activeTabPanel).getByText('T01')).toBeInTheDocument();
    
    // Check for the LAB and TUTORIAL badges
    expect(within(activeTabPanel).getByText('LAB')).toBeInTheDocument();
    expect(within(activeTabPanel).getByText('TUTORIAL')).toBeInTheDocument();
    
    // Check for specific TA assignments
    expect(within(activeTabPanel).getByText('Alice Johnson')).toBeInTheDocument();
    expect(within(activeTabPanel).getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('displays TA assignments with student numbers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check for student numbers that are visible in the default "My Sections" tab
    expect(screen.getByText('(12345678)')).toBeInTheDocument(); // John Doe
    expect(screen.getByText('(87654321)')).toBeInTheDocument(); // Jane Smith  
    expect(screen.getByText('(11223344)')).toBeInTheDocument(); // Bob Wilson

    // Verify that all TAs have their student numbers displayed
    expect(screen.getByText('John Doe').closest('.bg-muted')).toHaveTextContent('(12345678)');
    expect(screen.getByText('Jane Smith').closest('.bg-muted')).toHaveTextContent('(87654321)');
    expect(screen.getByText('Bob Wilson').closest('.bg-muted')).toHaveTextContent('(11223344)');
  });

  it('handles missing TA assignments gracefully', async () => {
    const dataWithoutTAs = {
      ...mockCourseData,
      offerings: [
        {
          ...mockCourseData.offerings[0],
          schedule_days: [
            {
              ...mockCourseData.offerings[0].schedule_days[0],
              tas_assigned: [],
            },
          ],
        },
      ],
    };
    
    vi.mocked(courseDetailsLogic.transformCourseData).mockReturnValue(dataWithoutTAs);
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No TAs assigned')).toBeInTheDocument();
    });
  });

  it('displays course not found when courseData is null', async () => {
    vi.mocked(courseDetailsLogic.transformCourseData).mockReturnValue(null);
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Course not found')).toBeInTheDocument();
    });
  });

  it('renders sidebar with correct active page', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('instructor-sidebar')).toBeInTheDocument();
    });

    expect(screen.getByText('Sidebar: My Courses')).toBeInTheDocument();
  });
});