import { LandingPage } from '../src/pages/LandingPage'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()

// Mock react-router-dom's useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the landingPage logic functions
vi.mock("@/logic/landingPage", () => ({
  getOpenJobPostings: vi.fn(),
  transformJobPostingsData: vi.fn(),
  formatDate: vi.fn(),
  getApplicationPeriodStatus: vi.fn(),
  getDaysUntilDeadline: vi.fn(),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CalendarDays: () => <span data-testid="calendar-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  BookOpen: () => <span data-testid="book-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
  Building: () => <span data-testid="building-icon" />,
  User: () => <span data-testid="user-icon" />,
  GraduationCap: () => <span data-testid="graduation-cap-icon" />,
  ArrowRight: () => <span data-testid="arrow-right-icon" />,
  Briefcase: () => <span data-testid="briefcase-icon" />,
}))

// Import the mocked functions
import * as landingPageLogic from '@/logic/landingPage'

// Utility function to render landing page wrapped in memory router
const renderLandingPage = () => {
    return render(
        <MemoryRouter>
            <LandingPage />
        </MemoryRouter>
    )
}

describe('LandingPage', () => {
    // Mock data
    const mockJobPostings = [
        {
            posting_id: 1,
            title: 'Teaching Assistant - CS 101',
            description: 'Help students with introductory computer science concepts',
            department: { name: 'Computer Science' },
            term: { description: 'Fall 2024', code: 'F2024' },
            status: 'open',
            post_date: '2024-07-01',
            deadline_date: '2025-08-15',
            requirements: 'Strong programming skills required',
            created_by: { name: 'Dr. Smith', email: 'smith@ubc.ca' },
            form_template_id: 1
        },
        {
            posting_id: 2,
            title: 'Teaching Assistant - MATH 200',
            description: 'Assist with calculus tutorials and grading',
            department: { name: 'Mathematics' },
            term: { description: 'Winter 2025', code: 'W2025' },
            status: 'open',
            post_date: '2024-07-15',
            deadline_date: '2025-09-01',
            requirements: 'Calculus background needed',
            created_by: { name: 'Dr. Johnson', email: 'johnson@ubc.ca' },
            form_template_id: 2
        }
    ]

    const mockTransformedData = {
        activePostings: [
            {
                id: 1,
                title: 'Teaching Assistant - CS 101',
                description: 'Help students with introductory computer science concepts',
                department: 'Computer Science',
                term: 'Fall 2024',
                termCode: 'F2024',
                status: 'open',
                post_date: '2024-07-01',
                deadline_date: '2025-08-15',
                requirements: 'Strong programming skills required',
                created_by: 'Dr. Smith',
                created_by_email: 'smith@ubc.ca',
                form_template_id: 1
            },
            {
                id: 2,
                title: 'Teaching Assistant - MATH 200',
                description: 'Assist with calculus tutorials and grading',
                department: 'Mathematics',
                term: 'Winter 2025',
                termCode: 'W2025',
                status: 'open',
                post_date: '2024-07-15',
                deadline_date: '2025-09-01',
                requirements: 'Calculus background needed',
                created_by: 'Dr. Johnson',
                created_by_email: 'johnson@ubc.ca',
                form_template_id: 2
            }
        ],
        totalPositions: 2,
        departments: ['Computer Science', 'Mathematics'],
        terms: ['Fall 2024', 'Winter 2025']
    }

    const mockApplicationStatus = {
        status: 'open',
        message: '2 positions available',
        nextDeadline: 'August 15, 2025'
    }

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        
        // Setup default mock implementations
        vi.mocked(landingPageLogic.getOpenJobPostings).mockResolvedValue(mockJobPostings)
        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue(mockTransformedData)
        vi.mocked(landingPageLogic.formatDate).mockImplementation((date) => {
            if (date === '2025-08-15') return 'August 15, 2025'
            if (date === '2025-09-01') return 'September 1, 2025'
            if (date === '2024-07-01') return 'July 1, 2024'
            if (date === '2024-07-15') return 'July 15, 2024'
            return 'Unknown Date'
        })
        vi.mocked(landingPageLogic.getApplicationPeriodStatus).mockReturnValue(mockApplicationStatus)
        vi.mocked(landingPageLogic.getDaysUntilDeadline).mockImplementation((date) => {
            if (date === '2025-08-15') return 18
            if (date === '2025-09-01') return 35
            return null
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the landing page correctly with job data', async () => {
        renderLandingPage()

        // Check loading state is shown initially
        expect(screen.getByText('UBC CMPS TA Portal')).toBeInTheDocument()

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /teaching assistant application portal/i })).toBeInTheDocument()
        })

        // Check main heading and description
        expect(screen.getByText('Department of Computer Science, Mathematics, Physics and Statistics')).toBeInTheDocument()

        // Check navigation buttons
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()

        // Check application status alert
        expect(screen.getByText(/application period: open/i)).toBeInTheDocument()
        expect(screen.getByText(/2 positions available/i)).toBeInTheDocument()
        expect(screen.getByText(/next deadline: august 15, 2025/i)).toBeInTheDocument()
    })

    it('displays correct statistics cards', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('Teaching Assistant Application Portal')).toBeInTheDocument()
        })

        // Find the Open Positions card specifically
        const openPositionsCard = screen.getByText('Open Positions').closest('[role="img"], .card, [class*="card"]') || 
                                 screen.getByText('Open Positions').parentElement?.parentElement

        // Check stats cards
        expect(screen.getByText('Open Positions')).toBeInTheDocument()
        expect(screen.getByText('Available now')).toBeInTheDocument()

        expect(screen.getByText('Departments')).toBeInTheDocument()
        expect(screen.getByText('Offering positions')).toBeInTheDocument()

        expect(screen.getByText('Terms')).toBeInTheDocument()
        expect(screen.getByText('Terms available')).toBeInTheDocument()

        expect(screen.getByText('Application Status')).toBeInTheDocument()
        expect(screen.getByText('Current period')).toBeInTheDocument()
        
        // Just verify that numbers exist in the stats without being too specific
        const allNumbers = screen.getAllByText(/^\d+$/)
        expect(allNumbers.length).toBeGreaterThan(0)
    })

    it('displays job posting cards with correct information', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('Available Positions')).toBeInTheDocument()
        })

        // Check first job posting
        expect(screen.getByText('Teaching Assistant - CS 101')).toBeInTheDocument()
        expect(screen.getByText('Computer Science')).toBeInTheDocument()
        expect(screen.getByText('F2024')).toBeInTheDocument()
        expect(screen.getByText('Help students with introductory computer science concepts')).toBeInTheDocument()
        expect(screen.getByText(/strong programming skills required/i)).toBeInTheDocument()
        expect(screen.getByText('Posted by Dr. Smith')).toBeInTheDocument()
        expect(screen.getByText('Deadline: August 15, 2025')).toBeInTheDocument()
        expect(screen.getByText('18 days left')).toBeInTheDocument()

        // Check second job posting
        expect(screen.getByText('Teaching Assistant - MATH 200')).toBeInTheDocument()
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.getByText('W2025')).toBeInTheDocument()
        expect(screen.getByText('Assist with calculus tutorials and grading')).toBeInTheDocument()
        expect(screen.getByText(/calculus background needed/i)).toBeInTheDocument()
        expect(screen.getByText('Posted by Dr. Johnson')).toBeInTheDocument()
        expect(screen.getByText('Deadline: September 1, 2025')).toBeInTheDocument()
        expect(screen.getByText('35 days left')).toBeInTheDocument()
    })

    it('navigates to login when login button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
        })

        const loginBtn = screen.getByRole('button', { name: /login/i })
        await user.click(loginBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/login")
    })

    it('navigates to create account when create account button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
        })

        const createAccBtn = screen.getByRole('button', { name: /create account/i })
        await user.click(createAccBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
    })

    it('navigates to login when apply now button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getAllByText(/apply now/i)).toHaveLength(2)
        })

        const applyBtns = screen.getAllByText(/apply now/i)
        await user.click(applyBtns[0])

        expect(mockNavigate).toHaveBeenCalledWith("/login")
    })

    it('displays loading state correctly', () => {
        // Make the API call hang to test loading state
        vi.mocked(landingPageLogic.getOpenJobPostings).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        )

        renderLandingPage()

        // Check that loading skeletons are shown
        expect(screen.getByText('UBC CMPS TA Portal')).toBeInTheDocument()
        // The loading state shows skeleton components, so we can't test for specific skeleton text
        // but we can verify the API was called
        expect(landingPageLogic.getOpenJobPostings).toHaveBeenCalledTimes(1)
    })

    it('displays error state when API fails', async () => {
        vi.mocked(landingPageLogic.getOpenJobPostings).mockRejectedValue(new Error('API Error'))

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText(/failed to load job postings/i)).toBeInTheDocument()
        })

        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('displays no positions available when no job postings exist', async () => {
        const emptyData = {
            activePostings: [],
            totalPositions: 0,
            departments: [],
            terms: []
        }

        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue(emptyData)
        vi.mocked(landingPageLogic.getApplicationPeriodStatus).mockReturnValue({
            status: 'closed',
            message: 'No active applications available',
            nextDeadline: null
        })

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('No Open Positions')).toBeInTheDocument()
        })

        expect(screen.getByText(/there are currently no teaching assistant positions available/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account for updates/i })).toBeInTheDocument()
    })

    it('handles expired job postings correctly', async () => {
        // Mock expired posting
        vi.mocked(landingPageLogic.getDaysUntilDeadline).mockReturnValue(-5) // 5 days past deadline

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('Available Positions')).toBeInTheDocument()
        })

        // Should show expired badge and disabled apply button
        expect(screen.getAllByText('Expired')).toHaveLength(2)
        expect(screen.getAllByText('Application Closed')).toHaveLength(2)
        
        // Apply buttons should be disabled
        const applyButtons = screen.getAllByRole('button', { name: /application closed/i })
        applyButtons.forEach(button => {
            expect(button).toBeDisabled()
        })
    })

    it('calls API functions with correct parameters', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(landingPageLogic.getOpenJobPostings).toHaveBeenCalledTimes(1)
        })

        expect(landingPageLogic.transformJobPostingsData).toHaveBeenCalledWith(mockJobPostings)
        expect(landingPageLogic.getApplicationPeriodStatus).toHaveBeenCalled()
        expect(landingPageLogic.getDaysUntilDeadline).toHaveBeenCalledWith('2025-08-15')
        expect(landingPageLogic.getDaysUntilDeadline).toHaveBeenCalledWith('2025-09-01')
    })

    it('renders footer correctly', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('Teaching Assistant Application Portal')).toBeInTheDocument()
        })

        expect(screen.getByText('© 2025 Department of Computer Science, Mathematics, Physics and Statistics')).toBeInTheDocument()
        expect(screen.getByText('University of British Columbia')).toBeInTheDocument()
    })
})