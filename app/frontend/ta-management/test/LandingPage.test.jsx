import { LandingPage} from '../src/pages/LandingPage'
import LoginPage from '../src/pages/LoginPage'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const mockNavigate = vi.fn()

// Mock react-router-dom's useNavigate to use our mockNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// utility fn. to render landing page wrapped in memory router
// memory router used to simulate routing in a test environment
const renderLandingPage = () => {
    return render(
        <MemoryRouter>
            <LandingPage />
        </MemoryRouter>
    )
}

describe('LandingPage', () => {
    //reset mocks and clear local storage at start of each test
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    it('renders the landing page correctly', () => {
        renderLandingPage()

        // headings
        expect(screen.getByRole('heading', { name: /department of computer science, mathematics, physics and statistics/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /ta application portal/i })).toBeInTheDocument()

        // buttons
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument() // i is regex for case insensitive matching
        expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument()

        // current application period info
        expect(screen.getByText(/active application period/i)).toBeInTheDocument()
        expect(screen.getByText(/positions available for/i)).toBeInTheDocument()
        expect(screen.getByText(/open date/i)).toBeInTheDocument()
        expect(screen.getByText(/close date/i)).toBeInTheDocument()
    })

    it('navigates to /login on login button clicked', async () => {
        renderLandingPage()

        const user = userEvent.setup()

        const loginBtn = screen.getByRole('button', {name: /login/i })
        await user.click(loginBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/login")
    })

    it('navigates to /register on create account button clicked', async () => {
        renderLandingPage()

        const user = userEvent.setup()

        const createAccBtn = screen.getByRole('button', {name: /create an account/i })
        await user.click(createAccBtn)

        expect(mockNavigate).toHaveBeenCalledWith("/create-account/step1")
    })
})