// ProfilePage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '@/pages/ProfilePage'

vi.mock('@/components/student-dashboard-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mock Sidebar</div>,
}))

vi.mock('@/components/WeeklyAvailabilityCalendar', () => ({
  default: ({ editable }) => (
    <div data-testid="mock-calendar">{editable ? 'Editable Calendar' : 'Static Calendar'}</div>
  ),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )
  })

  it('renders the profile header', () => {
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText(/Manage your personal information/i)).toBeInTheDocument()
  })

  it('displays basic information fields', () => {
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('Student ID')).toBeInTheDocument()
    expect(screen.getByText('SJ2024001')).toBeInTheDocument()
  })

  it('enables editing mode when clicking "Edit Profile"', async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText(/Edit Profile/i))    
    expect(screen.getByRole('textbox', { name: /Full Name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/i })).toHaveValue('sarah.johnson@university.edu')
  })

  it('cancels editing and restores original profile', async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText(/Edit Profile/i))

    const nameInput = screen.getByRole('textbox', { name: /Full Name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Changed Name')

    await user.click(screen.getByText(/Cancel/i))
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
  })

  it('renders skills and course preferences', () => {
    expect(screen.getByText('Skills & Qualifications')).toBeInTheDocument()
    expect(screen.getByText('Course Preference')).toBeInTheDocument()
    expect(screen.getByText('COSC 111')).toBeInTheDocument()
    expect(screen.getByText('Communication')).toBeInTheDocument()
  })

  it('renders the mocked calendar component', () => {
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument()
  })

  it('renders the mocked sidebar', () => {
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
  })
})
