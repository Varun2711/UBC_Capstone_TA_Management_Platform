import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import UserProfile from '@/pages/profile-page-scheduler'; 
import { getProfile, updateProfile } from '../src/logic/scheduler-profile';

// Mock the logic module for API calls
vi.mock('../src/logic/scheduler-profile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

// Mock child components to isolate the UserProfile component
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mocked Sidebar</div>,
}));

vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    SidebarProvider: ({ children }) => <div>{children}</div>, // Simple wrapper
    SidebarInset: ({ children }) => <div>{children}</div>,
    SidebarTrigger: () => <button aria-label="Toggle sidebar"><svg /></button>,
  };
});

vi.mock('lucide-react', () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Save: () => <svg data-testid="save-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Bell: () => <svg data-testid="bell-icon" />,
}));


// Mock profile data for our tests
const mockUserProfile = {
  name: 'John Doe',
  email: 'john.doe@university.edu',
  employee_number: 'EMP123',
  department_name: 'Computer Science',
};


describe('UserProfile Component with API Integration', () => {
  const user = userEvent.setup();

  // Reset mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while fetching the profile', () => {
    // Mock getProfile to be in a pending state
    vi.mocked(getProfile).mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><UserProfile /></MemoryRouter>);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('displays an error message if fetching the profile fails', async () => {
    // Mock getProfile to reject with an error
    vi.mocked(getProfile).mockRejectedValue(new Error('Network Error'));
    render(<MemoryRouter><UserProfile /></MemoryRouter>);
    expect(await screen.findByText('Could not load your profile. Please try again later.')).toBeInTheDocument();
  });

  it('fetches and displays user data correctly', async () => {
    // Mock getProfile to return successful data
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    render(<MemoryRouter><UserProfile /></MemoryRouter>);
    

    // Wait for the loading to finish and check for the user's data
  // The full name 'John Doe' appears in the card title
  expect(await screen.findByText('John Doe')).toBeInTheDocument(); 

  // The first name 'John' appears in the details section
  expect(screen.getByText('John')).toBeInTheDocument(); 
  
  // Use getAllByText for data that appears in multiple places
  const emailElements = screen.getAllByText('john.doe@university.edu');
  expect(emailElements.length).toBeGreaterThan(0); // Asserts the email is found at least once
  
  const departmentElements = screen.getAllByText('Computer Science');
  expect(departmentElements.length).toBeGreaterThan(0); // Asserts department is found at least once

  // Employee number appears only once, so getByText is fine
  expect(screen.getByText('EMP123')).toBeInTheDocument();
  });

  it('switches to edit mode, allows changes, and cancels them', async () => {
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    render(<MemoryRouter><UserProfile /></MemoryRouter>);
    
    // Wait for profile to load
    const editButton = await screen.findByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    // Change first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    // Check that name has changed in the input
    expect(firstNameInput).toHaveValue('Jane');

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify the data reverted to the original fetched data
    expect(screen.getByText('John')).toBeInTheDocument(); // Displayed value after canceling
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument(); // Back to view mode
  });

  it('saves updated user data successfully', async () => {
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    vi.mocked(updateProfile).mockResolvedValue({ success: true }); // Mock successful update
    render(<MemoryRouter><UserProfile /></MemoryRouter>);

    // Enter edit mode
    const editButton = await screen.findByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    // Update fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    // Click save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Wait for the save operation to complete
    await waitFor(() => {
      // Check that the update function was called with the correct data
      expect(updateProfile).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'john.doe@university.edu',
      });
      // The component should switch back to view mode and display the new name
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('displays a backend validation error on save failure', async () => {
    const user = userEvent.setup();
    // This is the error the backend will "return"
    const backendError = {
      response: {
        status: 400,
        data: { email: ['This email address is already in use.'] },
      },
    };

    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    vi.mocked(updateProfile).mockRejectedValue(backendError);

    render(<MemoryRouter><UserProfile /></MemoryRouter>);

    // 1. Enter edit mode
    await user.click(await screen.findByRole('button', { name: /edit profile/i }));

    // 2. Click save immediately. The data is valid according to client-side rules,
    //    so validateForm() will pass and the API call will be made.
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // 3. Now, wait for the backend error message to appear.
    //    `findByText` is a great shortcut that combines `getByText` with `waitFor`.
    const errorMessage = await screen.findByText('This email address is already in use.');
    expect(errorMessage).toBeInTheDocument();
    
    // 4. Verify the component is still in edit mode and not stuck on "Saving..."
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
});

  it('displays a generic API error on other save failures', async () => {
  
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    vi.mocked(updateProfile).mockRejectedValue(new Error('Server blew up')); // Generic error
    render(<MemoryRouter><UserProfile /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Wait for the generic error message to appear
    expect(await screen.findByText('Failed to save changes. Please try again.')).toBeInTheDocument();
  

  });

  it('shows client-side validation errors for invalid input', async () => {
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    render(<MemoryRouter><UserProfile /></MemoryRouter>);

    await user.click(await screen.findByRole('button', { name: /edit profile/i }));

    const firstNameInput = screen.getByLabelText(/first name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Test first name validation
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'J');
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Correct first name
    await user.type(firstNameInput, 'ane');
    expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();

    // Test email validation
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    
    // Correct email
    await user.clear(emailInput);
    await user.type(emailInput, 'jane.doe@valid.com');
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();

    // Form should now be valid and save button enabled
    expect(saveButton).not.toBeDisabled();
  });
  
});