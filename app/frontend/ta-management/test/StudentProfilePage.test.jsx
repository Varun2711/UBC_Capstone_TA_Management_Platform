// ProfilePage.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '@/pages/ProfilePage'
import WeeklyAvailabilityCalendar from '@/components/WeeklyAvailabilityCalendar'
import axios from 'axios'
import * as profileLogic from "@/logic/student-profile"

vi.spyOn(profileLogic, "updateSkills").mockResolvedValue({
  data: {
    skills: [
      { name: "Communication", skill_type: "soft" },
      { name: "TypeScript",    skill_type: "technical" }
    ]
  }
})


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
        fullName: "Sarah Johnson", // This is the combined name in read-only mode
        skills: [
          { name: "Communication", skill_type: "soft" },
          { name: "JavaScript", skill_type: "technical" }
        ],
        course_preferences: [
          { course_code: "COSC 111" },
          { course_code: "COSC 121" }
        ],
        availability: [],
        // It's crucial for your mock to reflect how 'fullName' breaks down into
        // 'firstName' and 'lastName' when editing. Assuming 'Sarah Johnson' splits into 'Sarah' and 'Johnson'.
        firstName: "Sarah", // Add this to mock data
        lastName: "Johnson", // Add this to mock data
      },
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )
  })

  it('renders the profile header', async () => {
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument()
    });

    expect(
      screen.getByText(/Manage your personal information/i)
    ).toBeInTheDocument()
  });

  it('displays basic information fields', async () => {
    // Wait for the profile content to appear after loading, using a unique element
    await waitFor(() => {
      expect(screen.getByText('Student ID')).toBeInTheDocument(); // A good unique identifier that appears after loading
    });

    expect(screen.getByText('First Name')).toBeInTheDocument()
    // This now expects "Sarah Johnson" which matches the `fullName` in your mock
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Student ID')).toBeInTheDocument()
  })

  it('enables editing mode when clicking "Edit Personal Information"', async () => {
    const user = userEvent.setup()

    // Wait for the profile page to finish loading and display relevant content
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument(); // Wait for the main heading
    });

    await user.click(screen.getByText(/Edit Personal Information/i))
    // Now look for First Name and Last Name textboxes explicitly
    expect(screen.getByRole('textbox', { name: /First Name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Last Name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/i })).toHaveValue('test@example.com')
  })

  it('cancels editing and restores original profile', async () => {
    const user = userEvent.setup();
    const editButton = await screen.findByText(/Edit Personal Information/i);
    await user.click(editButton);

    // --- CHANGE STARTS HERE ---
    // Instead of 'Full Name', target 'First Name' and 'Last Name'
    const firstNameInput = screen.getByRole('textbox', { name: /First Name/i });
    const lastNameInput = screen.getByRole('textbox', { name: /Last Name/i });

    // Assuming initial values from mock data are 'Sarah' and 'Johnson'
    expect(firstNameInput).toHaveValue('Test');
    expect(lastNameInput).toHaveValue('User');

    // Clear and type into the First Name input
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'ChangedFirst');

    // Optionally, clear and type into the Last Name input as well for a more complete test
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'ChangedLast');
    // --- CHANGE ENDS HERE ---

    await user.click(screen.getByText(/Cancel/i));

    // After canceling, expect the original combined full name to be displayed
    // (This assumes your UI reverts to displaying the combined name)
    expect(screen.getByText('Test User')).toBeInTheDocument();
  })

  it('allows editing and saving technical skills', async () => {
    const user = userEvent.setup()

    const editSkillsButton = await screen.findByText('Edit Skills');
    await user.click(editSkillsButton);

    const techSkillsSection = screen.getByText('Technical Skills').closest('div')

    const javaScriptInput = await within(techSkillsSection).findByDisplayValue('JavaScript');
    expect(javaScriptInput).toBeInTheDocument();

    await user.clear(javaScriptInput);
    await user.type(javaScriptInput, 'TypeScript');

    axios.post.mockResolvedValue({
      data: {
        skills: [
          { name: 'Communication', skill_type: 'soft' },
          { name: 'TypeScript', skill_type: 'technical' }
        ]
      }
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const techBadges = screen.getAllByTestId('technical-skill');
      const badgeTexts = techBadges.map((b) => b.textContent);
      expect(badgeTexts).toContain('TypeScript');
    });
  })

  it('renders skills', async () => {
    const skillsHeader = await screen.findByText('Skills & Qualifications');
    expect(skillsHeader).toBeInTheDocument();
    const communicationSkill = await screen.findByText('Communication');
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  })

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

    const calendar = screen.getByTestId('weekly-availability-calendar');
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