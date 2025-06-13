import { LandingPage} from '../src/pages/LandingPage'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

const renderLandingPage = () => {
    return render(
        <LandingPage />
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