import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import InstructorProfile from '@/pages/Instructor/instructor-profile';

// --- MOCKS ---

vi.mock('@/logic/scheduler-profile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mocked Sidebar</div>,
}));

// --- IMPORTS ---

import { getProfile, updateProfile } from '@/logic/scheduler-profile';

// --- TEST DATA ---

const mockProfileData = {
  name: 'Naman Arora',
  email: 'naman.arora@gmail.com',
  employee_number: '87654321',
  department: '',
};

// --- TESTS ---

describe('InstructorProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Renders loading state and then displays profile information
  it('should render loading state initially and then display profile information', async () => {
    getProfile.mockResolvedValue(mockProfileData);

    render(
      <BrowserRouter>
        <InstructorProfile />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-sidebar')).toBeInTheDocument();

    // After loading, displays the profile data
    expect(await screen.findByText('Naman Arora')).toBeInTheDocument();
    
    
    const emailElements = screen.getAllByText('naman.arora@gmail.com');
    expect(emailElements).toHaveLength(2); // Assert that both email elements are present

    expect(screen.getByText('87654321')).toBeInTheDocument();
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  // Test 2: Handles API error on initial fetch
  it('should display an error message if the profile fetch fails', async () => {
    getProfile.mockRejectedValue(new Error('API Error'));
    render(
      <BrowserRouter>
        <InstructorProfile />
      </BrowserRouter>
    );

    const errorMessage = await screen.findByText('Could not load your profile. Please try again later.');
    expect(errorMessage).toBeInTheDocument();
  });

  // Test 3: Enters and exits editing mode
  it('should allow the user to enter and cancel editing mode', async () => {
    const user = userEvent.setup();
    getProfile.mockResolvedValue(mockProfileData);
    render(
      <BrowserRouter>
        <InstructorProfile />
      </BrowserRouter>
    );

    const editButton = await screen.findByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Naman');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.getByText('Naman Arora')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  // Test 4: Allows editing and saving the profile
  it('should update the profile information on save', async () => {
    const user = userEvent.setup();
    getProfile.mockResolvedValue(mockProfileData);
    updateProfile.mockResolvedValue({});
    
    render(
      <BrowserRouter>
        <InstructorProfile />
      </BrowserRouter>
    );
    
    const editButton = await screen.findByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'John');
    
    await user.clear(emailInput);
    await user.type(emailInput, 'john.arora@test.com');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        name: 'John Arora',
        email: 'john.arora@test.com',
      });
    });

    expect(await screen.findByText('John Arora')).toBeInTheDocument();
    
    const updatedEmailElements = await screen.findAllByText('john.arora@test.com');
    expect(updatedEmailElements).toHaveLength(2);

    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  // Test 5: Displays validation errors
  it('should display validation errors for invalid input', async () => {
    const user = userEvent.setup();
    getProfile.mockResolvedValue(mockProfileData);
    render(
      <BrowserRouter>
        <InstructorProfile />
      </BrowserRouter>
    );

    const editButton = await screen.findByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const emailInput = screen.getByLabelText(/email address/i);

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'A');
    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();

    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });
});