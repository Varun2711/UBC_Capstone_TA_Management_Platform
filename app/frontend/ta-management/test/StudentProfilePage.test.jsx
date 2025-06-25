// ProfilePage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '@/pages/ProfilePage'
import WeeklyAvailabilityCalendar from '@/components/WeeklyAvailabilityCalendar'


vi.mock('@/components/student-dashboard-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mock Sidebar</div>,
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
    expect(screen.getByText('20240012')).toBeInTheDocument()
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

  it('allows editing and saving technical skills', async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText('Edit Skills'))

    // Get the section labeled "Technical Skills"
    const techSkillsSection = screen.getByText('Technical Skills').closest('div')

    // Narrow search scope to the section
    const scopedInputs = within(techSkillsSection).getAllByRole('textbox')
    expect(scopedInputs.length).toBeGreaterThan(0)

    await user.clear(scopedInputs[0])
    await user.type(scopedInputs[0], 'TypeScript')
    await user.click(screen.getByText('Save'))

    // Now search for "TypeScript" only within the technical skills section
    const updatedTechSkills = within(techSkillsSection).getByText('TypeScript')
    expect(updatedTechSkills).toBeInTheDocument()
  })

  it('renders skills', () => {
    expect(screen.getByText('Skills & Qualifications')).toBeInTheDocument()
    expect(screen.getByText('Communication')).toBeInTheDocument()
  })

  it('renders course preferences', () => {
    expect(screen.getByText('Course Preferences')).toBeInTheDocument()
    expect(screen.getByText('COSC 111')).toBeInTheDocument()
  })

  it('renders the mocked availability calendar component', () => {
    const slot = screen.getByTestId('slot-Monday-8-top')
    expect(slot).toBeInTheDocument()
  })

  it('renders the mocked sidebar', () => {
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument()
  })
})

describe('WeeklyAvailabilityCalendar', () => {
  it('highlights a time slot when clicked', async () => {
    const user = userEvent.setup()
    const mockSetAvailability = vi.fn()

    render(
      <WeeklyAvailabilityCalendar
        editable={true}
        availability={[]} // start with no slots selected
        setAvailability={mockSetAvailability}
      />
    )

    const slot = screen.getByTestId('slot-Monday-8-top')

    // Initially should NOT have bg-blue-400
    expect(slot).not.toHaveClass('bg-blue-400')

    // Click to select
    await user.click(slot)

    // Should now be selected
    expect(slot).toHaveClass('bg-blue-400')

    // setAvailability should have been called with ["Monday-8-top"]
    expect(mockSetAvailability).toHaveBeenCalledWith(["Monday-8-top"])
  })
})
