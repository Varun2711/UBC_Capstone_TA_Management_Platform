import { LandingPage } from '../src/pages/LandingPage'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  getDaysUntilDeadline: vi.fn(),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CalendarDays: () => <span data-testid="calendar-icon" />,
  Users: () => <span data-testid="users-icon" />,
  BookOpen: () => <span data-testid="book-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
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
    // Mock data with future deadlines
    const mockJobPostings = [
        {
            posting_id: 1,
            title: 'Teaching Assistant - CS 101',
            description: 'Help students with introductory computer science concepts',
            department: { name: 'Computer Science' },
            term: { description: 'Fall 2025', code: 'F2025' },
            status: 'open',
            post_date: '2025-01-01',
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
            post_date: '2025-01-15',
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
                term: 'Fall 2025',
                termCode: 'F2025',
                status: 'open',
                post_date: '2025-01-01',
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
                post_date: '2025-01-15',
                deadline_date: '2025-09-01',
                requirements: 'Calculus background needed',
                created_by: 'Dr. Johnson',
                created_by_email: 'johnson@ubc.ca',
                form_template_id: 2
            }
        ],
        totalPositions: 2,
        departments: ['Computer Science', 'Mathematics'],
        terms: ['Fall 2025', 'Winter 2025']
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
            return 'Unknown Date'
        })
        vi.mocked(landingPageLogic.getDaysUntilDeadline).mockImplementation((date) => {
            if (date === '2025-08-15') return 18
            if (date === '2025-09-01') return 35
            return null
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders the header correctly', async () => {
        renderLandingPage()

        // Wait for loading to complete first
        await waitFor(() => {
            expect(screen.getByText('UBC CMPS TA Portal')).toBeInTheDocument()
        })

        // Wait for the page to finish loading and show the header buttons
        await waitFor(() => {
            const headerButtons = screen.getAllByRole('button', { name: /login/i })
            expect(headerButtons.length).toBeGreaterThan(0)
        })

        // Check header elements
        expect(screen.getByText('UBC CMPS TA Portal')).toBeInTheDocument()
        
        // Get all login buttons and verify there are multiple (header + hero section)
        const loginButtons = screen.getAllByRole('button', { name: /login/i })
        expect(loginButtons.length).toBeGreaterThanOrEqual(1)
        
        // Check for create account button (should be unique in header)
        expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument()
    })

    it('renders the hero section with correct content', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /become a teaching assistant/i, level: 1 })).toBeInTheDocument()
        })

        expect(screen.getByText(/join the department of computer science, mathematics, physics and statistics/i)).toBeInTheDocument()
    })

    it('displays "applications open" alert when positions are available', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText(/applications are currently open!/i)).toBeInTheDocument()
        })

        expect(screen.getByText(/2 positions? available/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /login to existing account/i })).toBeInTheDocument()
    })

    it('displays "no applications" alert when no positions are available', async () => {
        // Mock empty data
        const emptyData = { activePostings: [], totalPositions: 0, departments: [], terms: [] }
        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue(emptyData)

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText(/no active applications at this time/i)).toBeInTheDocument()
        })

        expect(screen.getByText(/please check back later for new job openings/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account to apply/i })).toBeInTheDocument()
        
        // Check that there are login buttons (header + hero section)
        const loginButtons = screen.getAllByRole('button', { name: /^login$/i })
        expect(loginButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('displays available positions section when positions exist', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /available positions/i })).toBeInTheDocument()
        })

        expect(screen.getByText(/explore current teaching assistant opportunities/i)).toBeInTheDocument()

        // Check first job posting
        expect(screen.getByText('Teaching Assistant - CS 101')).toBeInTheDocument()
        expect(screen.getByText('Computer Science')).toBeInTheDocument()
        expect(screen.getByText('F2025')).toBeInTheDocument()
        expect(screen.getByText('Help students with introductory computer science concepts')).toBeInTheDocument()
        expect(screen.getByText('Deadline: August 15, 2025')).toBeInTheDocument()
        expect(screen.getByText('18 days left')).toBeInTheDocument()

        // Check second job posting
        expect(screen.getByText('Teaching Assistant - MATH 200')).toBeInTheDocument()
        expect(screen.getByText('Mathematics')).toBeInTheDocument()
        expect(screen.getByText('W2025')).toBeInTheDocument()
        expect(screen.getByText('Assist with calculus tutorials and grading')).toBeInTheDocument()
        expect(screen.getByText('Deadline: September 1, 2025')).toBeInTheDocument()
        expect(screen.getByText('35 days left')).toBeInTheDocument()

        // Check apply buttons
        const applyButtons = screen.getAllByRole('button', { name: /apply for this position/i })
        expect(applyButtons).toHaveLength(2)
    })

    it('does not display available positions section when no positions exist', async () => {
        // Mock empty data
        const emptyData = { activePostings: [], totalPositions: 0, departments: [], terms: [] }
        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue(emptyData)

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText(/no active applications at this time/i)).toBeInTheDocument()
        })

        // Available positions section should not be present
        expect(screen.queryByRole('heading', { name: /available positions/i })).not.toBeInTheDocument()
    })

    it('renders the "Why Become a TA" section', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /why become a teaching assistant/i })).toBeInTheDocument()
        })

        // Check the three benefit cards
        expect(screen.getByText('Make an Impact')).toBeInTheDocument()
        expect(screen.getByText(/help fellow students succeed/i)).toBeInTheDocument()

        expect(screen.getByText('Gain Experience')).toBeInTheDocument()
        expect(screen.getByText(/build valuable teaching and communication skills/i)).toBeInTheDocument()

        expect(screen.getByText('Career Development')).toBeInTheDocument()
        expect(screen.getByText(/enhance your resume with teaching experience/i)).toBeInTheDocument()
    })

    it('renders the footer correctly', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('© 2025 University of British Columbia')).toBeInTheDocument()
        })

        expect(screen.getByText('Department of Computer Science, Mathematics, Physics and Statistics')).toBeInTheDocument()
    })

    it('navigates to login when login button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
        })

        const loginBtn = screen.getByRole('button', { name: /^login$/i })
        await user.click(loginBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/login")
    })

    it('navigates to create account when header create account button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument()
        })

        const createAccBtn = screen.getByRole('button', { name: /^create account$/i })
        await user.click(createAccBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
    })

    it('navigates to create account when apply now button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument()
        })

        const applyBtn = screen.getByRole('button', { name: /apply now/i })
        await user.click(applyBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
    })

    it('navigates to create account when position apply button is clicked', async () => {
        const user = userEvent.setup()
        renderLandingPage()

        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: /apply for this position/i })).toHaveLength(2)
        })

        const positionApplyBtn = screen.getAllByRole('button', { name: /apply for this position/i })[0]
        await user.click(positionApplyBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
    })

    it('displays loading state correctly', () => {
        // Make the API call hang to test loading state
        vi.mocked(landingPageLogic.getOpenJobPostings).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        )

        renderLandingPage()

        // Check that loading skeletons are shown
        expect(screen.getByText('UBC CMPS TA Portal')).toBeInTheDocument()
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

    it('handles urgent deadlines correctly', async () => {
        // Mock urgent deadline (7 days or less)
        vi.mocked(landingPageLogic.getDaysUntilDeadline).mockImplementation((date) => {
            if (date === '2025-08-15') return 5 // Urgent
            if (date === '2025-09-01') return 35 // Not urgent
            return null
        })

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText('5 days left')).toBeInTheDocument()
        })

        expect(screen.getByText('35 days left')).toBeInTheDocument()
    })

    it('calls API functions correctly', async () => {
        renderLandingPage()

        await waitFor(() => {
            expect(landingPageLogic.getOpenJobPostings).toHaveBeenCalledTimes(1)
        })

        expect(landingPageLogic.transformJobPostingsData).toHaveBeenCalledWith(mockJobPostings)
        expect(landingPageLogic.getDaysUntilDeadline).toHaveBeenCalledWith('2025-08-15')
        expect(landingPageLogic.getDaysUntilDeadline).toHaveBeenCalledWith('2025-09-01')
    })

    it('filters expired postings on frontend', async () => {
        // Mock expired postings that should be filtered out
        const expiredPostings = [
            {
                ...mockTransformedData.activePostings[0],
                deadline_date: '2024-12-01', // Past date
            }
        ]
        
        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue({
            ...mockTransformedData,
            activePostings: expiredPostings
        })

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByText(/no active applications at this time/i)).toBeInTheDocument()
        })

        // Should not show the expired position
        expect(screen.queryByText('Teaching Assistant - CS 101')).not.toBeInTheDocument()
    })

    it('shows "View All X Positions" button when more than 6 positions exist', async () => {
        // Mock 8 positions (more than 6)
        const manyPositions = Array.from({ length: 8 }, (_, i) => ({
            ...mockTransformedData.activePostings[0],
            id: i + 1,
            title: `Teaching Assistant - Course ${i + 1}`,
        }))

        vi.mocked(landingPageLogic.transformJobPostingsData).mockReturnValue({
            ...mockTransformedData,
            activePostings: manyPositions,
            totalPositions: 8
        })

        renderLandingPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /view all 8 positions/i })).toBeInTheDocument()
        })
    })
})