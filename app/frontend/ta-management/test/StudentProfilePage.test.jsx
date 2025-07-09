// ProfilePage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '@/pages/ProfilePage'
import WeeklyAvailabilityCalendar from '@/components/WeeklyAvailabilityCalendar'
import axios from 'axios'

axios.get = vi.fn();
axios.post = vi.fn();

vi.mock('@/components/WeeklyAvailabilityCalendar', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="weekly-availability-calendar">
      <div data-testid="slot-Monday-8-top">Mocked Slot</div>
    </div>
  ),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({
      data: {
        name: "Test User",
        email: "test@example.com",
        studentId: "20240012",
        fullName: "Sarah Johnson",
        skills: [
          { name: "Communication", skill_type: "soft" },
          { name: "JavaScript", skill_type: "technical" }
        ],
        course_preferences: [
          { course_code: "COSC 111" },
          { course_code: "COSC 121" }
        ],
        availability: [],
        // whatever the sidebar/profile expects
      },
    })

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

  it('enables editing mode when clicking "Edit Personal Information"', async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText(/Edit Personal Information/i))    
    expect(screen.getByRole('textbox', { name: /Full Name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/i })).toHaveValue('sarah.johnson@university.edu')
  })

  it('cancels editing and restores original profile', async () => {
    const user = userEvent.setup();
    // Wait for the button to appear
    const editButton = await screen.findByText(/Edit Personal Information/i);
    await user.click(editButton);

    const firstNameInput = screen.getByRole('textbox', { name: /First Name/i });
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Changed');

    await user.click(screen.getByText(/Cancel/i));
    expect(screen.getByText('Test')).toBeInTheDocument(); // "Test" is the original first name from your mock
  });

  it('allows editing and saving technical skills', async () => {
    const user = userEvent.setup()
    
    const editSkillsButton = await screen.findByText('Edit Skills');
    await user.click(editSkillsButton);

    // Get the section labeled "Technical Skills"
    const techSkillsSection = screen.getByText('Technical Skills').closest('div')

    // Narrow search scope to the section
    const scopedInputs = within(techSkillsSection).getAllByRole('textbox')
    expect(scopedInputs.length).toBeGreaterThan(0)

    await user.clear(scopedInputs[0])
    await user.type(scopedInputs[0], 'JavaScript')
    await user.click(screen.getByText('Save'))

    // Now search for "TypeScript" only within the technical skills section
    const updatedTechSkills = within(techSkillsSection).getByText('JavaScript')
    expect(updatedTechSkills).toBeInTheDocument()
  })

  it('renders skills', async () => {
    // Wait for the text to appear
    const skillsHeader = await screen.findByText('Skills & Qualifications');
    expect(skillsHeader).toBeInTheDocument();
    const communicationSkill = await screen.findByText('Communication');
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders course preferences', async () => {
    await waitFor(() => {
      expect(screen.getByText('Course Preferences')).toBeInTheDocument()
      expect(screen.getByText('COSC 111')).toBeInTheDocument()
  })
  })

  test('renders the availability calendar component', () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    // Find the element by test ID
    const calendar = screen.getByTestId('weekly-availability-calendar');

    // Assert that the element is in the document
    expect(calendar).toBeInTheDocument();
  })
})


describe('WeeklyAvailabilityCalendar', () => {
  beforeEach(() => {

    render(
      <MemoryRouter>
        <WeeklyAvailabilityCalendar/>
      </MemoryRouter>
    )
  })
  
  it('renders the mocked availability calendar component', () => {
    const slot = screen.getByTestId('slot-Monday-8-top');
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveTextContent('Mocked Slot');
  });
});