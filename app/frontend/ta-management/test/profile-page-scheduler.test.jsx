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
  Phone : () => <svg data-testid = "phone-icon" />,
  MapPin : () => <svg data-testid = "map-pin-icon" />,
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
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Employee ID')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
  });

  it('starts in view mode and switches to edit mode when Edit Profile is clicked', async () => {
    // Check initial view mode (non-editable fields)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();

    // Click Edit Profile button
    await user.click(screen.getByText('Edit Profile'));

    // Check edit mode (input fields should appear)
    expect(screen.getAllByRole('textbox')).toHaveLength(7); // First Name, Last Name, Email, Phone, Address, Department, Position
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

});