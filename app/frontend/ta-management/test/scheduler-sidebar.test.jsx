import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AppSidebar } from '@/components/scheduler-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ✅ Correct render helper with MemoryRouter + SidebarProvider
const renderSidebar = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar {...props} />
      </SidebarProvider>
    </MemoryRouter>
  );
};

// ✅ Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

// ✅ Mock icons from lucide-react
vi.mock('lucide-react', () => ({
  Home: () => <svg data-testid="home-icon" />,
  BookOpen: () => <svg data-testid="book-open-icon" />,
  UserCheck: () => <svg data-testid="user-check-icon" />,
  FileText: () => <svg data-testid="file-text-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
  Upload: () => <svg data-testid="upload-icon" />,
  Settings: () => <svg data-testid="settings-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  MoreVerticalIcon: () => <svg data-testid="more-vertical-icon" />,
}));

describe('AppSidebar', () => {
  it('renders the sidebar with header, content, and footer', () => {
    renderSidebar({ activePage: 'Dashboard' });
    expect(screen.getByText('TA Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@university.edu')).toBeInTheDocument();
  });

  it('renders all navigation items correctly', () => {
    renderSidebar({ activePage: 'Course Management' });
    const navigationItems = [
      { title: 'Dashboard', icon: 'home-icon' },
      { title: 'Course Management', icon: 'book-open-icon', isActive: true },
      { title: 'TA Positions', icon: 'user-check-icon' },
      { title: 'Applications', icon: 'file-text-icon' },
      { title: 'Appointments', icon: 'check-circle-icon' },
    ];
    const navigationGroup = screen.getByText('Navigation').closest('[data-sidebar="group"]');
    navigationItems.forEach((item) => {
      const menuItem = within(navigationGroup).getByText(item.title);
      expect(menuItem).toBeInTheDocument();
      expect(within(navigationGroup).getByTestId(item.icon)).toBeInTheDocument();
      if (item.isActive) {
        expect(menuItem.closest('[data-active="true"]')).toBeInTheDocument();
      } else {
        expect(menuItem.closest('[data-active="true"]')).not.toBeInTheDocument();
      }
    });
  });

  it('renders all quick actions correctly', () => {
    renderSidebar();
    const quickActions = [
      { title: 'Add Course', icon: 'plus-icon' },
      { title: 'Create Position', icon: 'user-check-icon' },
      { title: 'Import Data', icon: 'upload-icon' },
    ];
    const quickActionsGroup = screen.getByText('Quick Actions').closest('[data-sidebar="group"]');
    quickActions.forEach((item) => {
      const menuItem = within(quickActionsGroup).getByText(item.title);
      expect(menuItem).toBeInTheDocument();
      expect(within(quickActionsGroup).getByTestId(item.icon)).toBeInTheDocument();
    });
  });

  it('renders system items correctly', () => {
    renderSidebar({ activePage: 'Settings' });
    const systemItems = [{ title: 'Settings', icon: 'settings-icon' }];
    const systemGroup = screen.getByText('System').closest('[data-sidebar="group"]');
    systemItems.forEach((item) => {
      const menuItem = within(systemGroup).getByText(item.title);
      expect(menuItem).toBeInTheDocument();
      expect(within(systemGroup).getByTestId(item.icon)).toBeInTheDocument();
    });
  });

  it('has correct accessibility attributes', () => {
    renderSidebar({ activePage: 'Dashboard' });
    const header = screen.getByText('TA Scheduler').closest('[data-sidebar="header"]');
    expect(header).toHaveAttribute('data-sidebar', 'header');
    const navigationGroup = screen.getByText('Navigation').closest('[data-sidebar="group"]');
    const menuItems = within(navigationGroup).getAllByRole('link');
    menuItems.forEach((item) => {
      expect(item).toHaveAttribute('href', '#');
    });
    const footer = screen.getByText('Admin User').closest('[data-sidebar="footer"]');
    expect(footer).toHaveAttribute('data-sidebar', 'footer');
  });

  it('applies active state styling to the specified active page', () => {
    renderSidebar({ activePage: 'TA Positions' });
    const activeItem = screen.getByText('TA Positions').closest('[data-active="true"]');
    expect(activeItem).toHaveAttribute('data-active', 'true');
    const inactiveItem = screen.getByText('Dashboard').closest('[data-active="true"]');
    expect(inactiveItem).not.toBeInTheDocument();
  });

  it('renders avatar with correct fallback', () => {
    renderSidebar({ activePage: 'Dashboard' });
    const avatar = screen.getByText('Admin User').closest('[data-sidebar="menu-button"]');
    const avatarFallback = within(avatar).getByText('AD');
    expect(avatarFallback).toBeInTheDocument();
    expect(avatarFallback).toHaveClass('bg-muted');
  });

  it('renders the dropdown menu in the footer with correct items', async () => {
    renderSidebar({ activePage: 'Dashboard' });
    const dropdownTrigger = screen.getByRole('button');
    await userEvent.click(dropdownTrigger);
    expect(await screen.findByText('My Account')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});