import { vi, beforeAll, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TASchedulerDashboard from "@/pages/Scheduler_Dashboard";
import { MemoryRouter } from "react-router-dom";

// --- MOCKS ---

// Mock the profile API call to prevent a real network request
vi.mock('@/logic/scheduler-profile', () => ({
  getProfile: vi.fn(),
}));

// Import the mocked function after setting up the mock
import { getProfile } from '@/logic/scheduler-profile';

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

describe("TASchedulerDashboard", () => {
  // Set up a mock user and reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue({ name: 'Admin User', email: 'admin@test.com' });
  });
  
  // 🎯 FIX: Changed test to be async
  it("renders dashboard header and welcome message", async () => {
    renderWithRouter();
    
    
    await screen.findByText('Admin User');

    expect(screen.getByText('Dashboard', {

      selector: 'span[role="link"][aria-disabled="true"][aria-current="page"]'
      
      })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /welcome back, admin/i })).toBeInTheDocument();
  });


  
  it("renders upcoming tasks with task names", async () => {
    renderWithRouter();
    
    
    await screen.findByText('Admin User');

    expect(screen.getByText("Review pending applications")).toBeInTheDocument();
    expect(screen.getByText("Assign instructors to new courses")).toBeInTheDocument();
  });

  // 🎯 FIX: Changed test to be async
  it("renders department overview", async () => {
    renderWithRouter();
    
    await screen.findByText('Admin User');

    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  // 🎯 FIX: Changed test to be async
  it("renders system status section", async () => {
    renderWithRouter();
    
    await screen.findByText('Admin User');

    expect(screen.getByText("System Status & Management Tools")).toBeInTheDocument();
    expect(screen.getByText("Application Period")).toBeInTheDocument();
  });
});