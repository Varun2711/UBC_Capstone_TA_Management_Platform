import { vi, beforeAll, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TASchedulerDashboard from "@/pages/Scheduler_Dashboard";
import { MemoryRouter } from "react-router-dom";

// --- MOCKS ---

// Mock all API functions from scheduler-dashboard
vi.mock('@/logic/scheduler-dashboard', () => ({
  getProfile: vi.fn(),
  getCourses: vi.fn(),
  getApplications: vi.fn(),
  getCourseOfferings: vi.fn(),
  getSharedSessions: vi.fn(),
  getAssignments: vi.fn(),
  getShortlistedApplicants: vi.fn(),
  getOffers: vi.fn(),
  getPendingOffers: vi.fn(),
  getAcceptedOffers: vi.fn(),
  getRejectedOffers: vi.fn(),
}));

// Import the mocked functions
import * as schedulerDashboard from '@/logic/scheduler-dashboard';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

beforeAll(() => {
  // Mock for responsive UI components
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
});

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <TASchedulerDashboard />
    </MemoryRouter>
  );
};

// Mock data
const mockCourses = {
  results: [
    { id: 1, course_number: 'COSC 111', course_name: 'Programming I', is_active: true },
    { id: 2, course_number: 'MATH 101', course_name: 'Calculus I', is_active: true },
    { id: 3, course_number: 'STAT 200', course_name: 'Statistics', is_active: false },
  ]
};

const mockApplications = [
  { id: 1, student_name: 'John Doe' },
  { id: 2, student_name: 'Jane Smith' },
  { id: 3, student_name: 'Bob Johnson' },
];

const mockCourseOfferings = {
  results: [
    {
      course_offering_id: '1',
      course_info: 'COSC 111 Programming I',
      time_slots_info: [
        { slot_id: 'slot1' },
        { slot_id: 'slot2' }
      ]
    },
    {
      course_offering_id: '2',
      course_info: 'MATH 101 Calculus I',
      time_slots_info: [
        { slot_id: 'slot3' }
      ]
    }
  ]
};

const mockSharedSessions = {
  results: [
    {
      shared_session_id: '1',
      course_info: 'DATA 301 Data Science',
      time_slots_info: [
        { slot_id: 'slot4' }
      ]
    }
  ]
};

const mockAssignments = [];

const mockShortlistedApplicants = [
  { id: 1, student_name: 'John Doe' },
  { id: 2, student_name: 'Jane Smith' }
];

const mockPendingOffers = [
  { id: 1, status: 'pending' },
  { id: 2, status: 'draft' }
];

const mockAcceptedOffers = [
  { id: 3, status: 'accepted' }
];

const mockRejectedOffers = [
  { id: 4, status: 'rejected' }
];

describe("TASchedulerDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage to return a valid token
    mockSessionStorage.getItem.mockReturnValue('mock-token');
    
    // Setup default mock responses
    schedulerDashboard.getCourses.mockResolvedValue(mockCourses);
    schedulerDashboard.getApplications.mockResolvedValue(mockApplications);
    schedulerDashboard.getCourseOfferings.mockResolvedValue(mockCourseOfferings);
    schedulerDashboard.getSharedSessions.mockResolvedValue(mockSharedSessions);
    schedulerDashboard.getAssignments.mockResolvedValue(mockAssignments);
    schedulerDashboard.getShortlistedApplicants.mockResolvedValue(mockShortlistedApplicants);
    schedulerDashboard.getPendingOffers.mockResolvedValue(mockPendingOffers);
    schedulerDashboard.getAcceptedOffers.mockResolvedValue(mockAcceptedOffers);
    schedulerDashboard.getRejectedOffers.mockResolvedValue(mockRejectedOffers);
  });

  it("renders dashboard header and welcome message", async () => {
    renderWithRouter();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Use getAllByText since "Dashboard" appears in both sidebar and breadcrumb
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /welcome back, ta coordinator/i })).toBeInTheDocument();
  });

  it("displays correct stats after loading", async () => {
    renderWithRouter();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Check if stats are displayed correctly
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
    expect(screen.getByText('Available time slots')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
    
    // Check if the numbers are correct using getAllByText
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // 2 active courses (appears multiple times)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // 3 applications (appears multiple times)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0); // 4 available time slots (appears multiple times)
  });

  it("displays application status correctly", async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Application Status')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
    expect(screen.getByText('Offers Sent')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it("displays department overview", async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText("Department Overview")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Data Science")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderWithRouter();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    // Mock API calls to reject
    schedulerDashboard.getCourses.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getApplications.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getCourseOfferings.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getSharedSessions.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getAssignments.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getShortlistedApplicants.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getPendingOffers.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getAcceptedOffers.mockRejectedValue(new Error('API Error'));
    schedulerDashboard.getRejectedOffers.mockRejectedValue(new Error('API Error'));

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
  });

  it("calls all required API endpoints", async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Verify all API calls were made
    expect(schedulerDashboard.getCourses).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getApplications).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getCourseOfferings).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getSharedSessions).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getAssignments).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getShortlistedApplicants).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getPendingOffers).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getAcceptedOffers).toHaveBeenCalledTimes(1);
    expect(schedulerDashboard.getRejectedOffers).toHaveBeenCalledTimes(1);
  });
});