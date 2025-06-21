import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import UserProfile from '@/pages/profile-page-scheduler';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MapPin, PanelLeft } from 'lucide-react';

// Mock the sidebar component to avoid testing its internal implementation
vi.mock('@/components/scheduler-sidebar', () => ({
  AppSidebar: () => <div data-testid="mock-sidebar">Mocked Sidebar</div>,
}));


vi.mock('lucide-react', () => ({
  Mail : () => <svg data-testid = "mail-icon" />,
  Edit : () => <svg data-testid = "edit-icon" />,
  Save : () => <svg data-testid = "save-icon" />,
  X : () => < svg data-testid = 'x-icon' />,
  Bell : () => < svg data-testid = 'bell-icon' />,
  PanelLeft : () => < svg data-testid = 'panel-left-icon' />

}));

describe('UserProfile Component', () => {
  // Sets up a user event instance to simulate user interactions
  const user = userEvent.setup();


  // Render User Profile Component before each test
  beforeEach(() => {
    render(
      <SidebarProvider>
        <UserProfile />
      </SidebarProvider>
    );
  });

  it('renders the component with sidebar and main content', () => {
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('heading' , {name : /user profile/i })).toBeInTheDocument();
    expect(screen.getByText('Manage your personal information')).toBeInTheDocument();
  });

  it('displays personal information card with all fields', () => {
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Your basic personal details')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Employee Number')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
  });

  it('starts in view mode and switches to edit mode when Edit Profile is clicked', async () => {
    // Check initial view mode (non-editable fields)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();

    // Click Edit Profile button
    await user.click(screen.getByText('Edit Profile'));

    // Check edit mode (input fields should appear)
    expect(screen.getAllByRole('textbox')).toHaveLength(3); // First Name, Last Name, Email
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows Cancel and Save buttons in edit mode and handles Cancel correctly', async () => {
    // Enter edit mode
    await user.click(screen.getByText('Edit Profile'));

    // Verify Cancel and Save buttons
    const cancelButton = screen.getByText('Cancel');
    const saveButton = screen.getByText('Save Changes');
    expect(cancelButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();

    // Click Cancel
    await user.click(cancelButton);

    // Verify back to view mode
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('handles Save button click and shows loading state', async () => {
    // Enter edit mode
    await user.click(screen.getByText('Edit Profile'));

    // Click Save
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Check loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Wait for save to complete (simulated API call)
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  it('renders sidebar trigger and notification bell', () => {
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('displays contact information with icons', () => {
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('disables buttons during saving', async () => {
    // Enter edit mode
    await user.click(screen.getByText('Edit Profile'));

    // Click Save
    const saveButton = screen.getByText('Save Changes');
    const cancelButton = screen.getByText('Cancel');
    await user.click(saveButton);

    // Check disabled state
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    // Wait for save to complete
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });
});