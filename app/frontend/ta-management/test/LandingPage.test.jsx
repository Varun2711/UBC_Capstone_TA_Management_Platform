import { LandingPage} from '../src/pages/LandingPage'
import LoginPage from '../src/pages/LoginPage'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const renderLandingPage = () => {
    return render(
        <MemoryRouter>
            <LandingPage />
        </MemoryRouter>
    )
}

describe('LandingPage', () => {
    it('renders the page heading', () => {
        renderLandingPage()
        expect(screen.getByRole('heading', { name: /ta application portal/i })).toBeInTheDocument()
    })

    it('renders a login button', () => {
        renderLandingPage()
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument() // i is regex for case insensitive matching
    })

    it('renders a create account button', () => {
        renderLandingPage()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
})

// these are hardcoded for now, eventually will be dynamically generated values
describe('Important dates section', () => {
    it('displays that applications are open', () => {
        renderLandingPage()
        expect(screen.getByText(/applications are open/i)).toBeInTheDocument()
    })

    it('displays the closing date', () => {
        renderLandingPage()
        expect(screen.getByText(/closing date: April 30, 2025/i)).toBeInTheDocument()
    })
})

describe('Navigation', () => {
    it('navigates to /login on login button clicked', async () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>
        )

        const loginBtn = screen.getByRole('button', {name: /login/i })

        const user = userEvent.setup()
        await user.click(loginBtn)
        expect(await screen.getByText("Login Page")).toBeInTheDocument()
    })

    // it('navigates to /register on create account button clicked', async () => {
    //     // todo once register page implemented
    // })
    
})