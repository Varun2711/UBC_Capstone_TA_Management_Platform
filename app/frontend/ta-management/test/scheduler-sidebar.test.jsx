import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppSidebar } from '@/components/scheduler-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';

// Mock the profile logic module
vi.mock('@/logic/scheduler-profile', () => ({
  getProfile: vi.fn(),
}));

// Mock the navigate function from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: () => <svg data-testid="home-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  UserCheck: () => <svg data-testid="user-check-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
}));

// Import the mocked getProfile after setting up the mock
import { getProfile } from '@/logic/scheduler-profile';

const renderSidebar = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar {...props} />
      </SidebarProvider>
    </MemoryRouter>
  );
};

describe('AppSidebar', () => {
  const mockUser = {
    name: 'Jane Doe',
    email: 'jane.doe@university.edu',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue(mockUser);
  });

  it('renders header and shows loading state initially in the footer', () => {
    renderSidebar();
    expect(screen.getByText('TA Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Scheduler Portal')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });

  it('fetches and displays user data in the footer', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@university.edu')).toBeInTheDocument();
    });
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders all navigation items and applies active state', () => {
    renderSidebar({ activePage: 'Course Management' });

    const navigationItems = [
      { title: 'Dashboard', icon: 'home-icon' },
      { title: 'Course Management', icon: 'book-open-icon' },
      { title: 'Instructor Management', icon: 'user-check-icon' },
      { title: 'Applications', icon: 'file-text-icon' },
      { title: 'Allocations', icon: 'check-circle-icon' },
    ];

    navigationItems.forEach((item) => {
      const menuItem = screen.getByText(item.title);
      expect(menuItem).toBeInTheDocument();
      expect(
        within(menuItem.closest('button')).getByTestId(item.icon)
      ).toBeInTheDocument();
    });

    const activeItem = screen
      .getByText('Course Management')
      .closest('button');
    expect(activeItem).toHaveAttribute('data-active', 'true');

    const inactiveItem = screen.getByText('Dashboard').closest('button');
    expect(inactiveItem).toHaveAttribute('data-active', 'false');
  });

  it('navigates to the correct URL when a navigation item is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    await user.click(dashboardButton);
    expect(mockNavigate).toHaveBeenCalledWith('/scheduler-dashboard');
  });

  it('has correct accessibility attributes', () => {
    renderSidebar({ activePage: 'Dashboard' });

    const header = screen
      .getByText('TA Scheduler')
      .closest('[data-sidebar="header"]');
    expect(header).toHaveAttribute('data-sidebar', 'header');

    const navigationGroup = screen
      .getByText('Navigation')
      .closest('[data-sidebar="group"]');
    const menuItems = within(navigationGroup).getAllByRole('button');
    menuItems.forEach((item) => {
      expect(item).toHaveAttribute('data-sidebar', 'menu-button');
    });

    // Fix: Wait for user data to load and use the correct user name
    return waitFor(() => {
      const footer = screen
        .getByText('Jane Doe') // Changed from 'Admin User' to 'Jane Doe'
        .closest('[data-sidebar="footer"]');
      expect(footer).toHaveAttribute('data-sidebar', 'footer');
    });

  });
  
  it('applies active state styling to the specified active page', () => {
    renderSidebar({ activePage: 'Instructor Management' });
    const activeButton = screen
      .getByText('Instructor Management')
      .closest('button[data-active="true"]');
    expect(activeButton).toBeInTheDocument();
    expect(
      screen.queryByText('Dashboard').closest('button[data-active="true"]')
    ).not.toBeInTheDocument();
  });

  it('navigates to root when "Logout" is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    await waitFor(() =>
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    );

    const dropdownTrigger = screen.getByLabelText('account menu');
    await user.click(dropdownTrigger);
    const logoutItem = await screen.findByRole('menuitem', {
      name: /logout/i,
    });
    await user.click(logoutItem);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles API failure gracefully', async () => {
    getProfile.mockRejectedValue(new Error('API Error'));
    renderSidebar();

    await waitFor(() => {
      const dropdownTrigger = screen.getByLabelText('account menu');
      expect(dropdownTrigger).not.toBeDisabled();
    });

    // because user is still null, footer stays in loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(
      screen.queryByText('jane.doe@university.edu')
    ).not.toBeInTheDocument();
  });
});
