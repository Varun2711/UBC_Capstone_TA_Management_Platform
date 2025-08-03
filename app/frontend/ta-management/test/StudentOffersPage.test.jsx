// OffersPage.test.tsx
import { describe, it, vi, beforeEach, expect } from 'vitest'
import React from 'react'
import { render, screen, waitFor, fireEvent, userEvent } from '@testing-library/react'
import OffersPage from '@/pages/StudentOffersPage'
import * as offersApi from '@/logic/student-offers-page'
import * as profileApi from '@/logic/student-profile'
import { MemoryRouter } from 'react-router-dom'
import { formatSharedSessionTime, getPriorityBadge, getStatusBadge } from '@/pages/StudentOffersPage'

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

// Mock transformBackendDataToFrontend internal: you can spy or just rely on returned structure

const mockProfile = { name: 'Jane Doe', email: 'jane@example.com', avatar: '/a.png' }
const backendProfile = { name: 'Jane Doe', email: 'jane@example.com' }

const onePending = [
  {
    offer_id: 10,
    status: 'pending',
    offer_date: '2024-01-15T00:00:00.999Z',
    response_deadline: '2024-01-20T00:00:00.999Z',
    offer_items: [
      {
        item_type: 'course_offering',
        course_offering_id: 100,
        course_number: 'COSC 101',
        course_name: 'Test Course',
        section_type_display: 'Lecture',
        section_number: '001',
        time_slot: { day: 'Mon', start_time: '09:00', end_time: '10:30' },
      },
    ],
  },
];
const courseOfferingDetails = { instructor_info: 'Dr X', term_info: 'Term A' }
const accepted = []
const rejected = []
const expired = []

beforeEach(() => {
  vi.spyOn(profileApi, 'getProfile').mockResolvedValue(backendProfile)
  vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue(onePending)
  vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue(accepted)
  vi.spyOn(offersApi, 'getRejectedOffers').mockResolvedValue(rejected)
  vi.spyOn(offersApi, 'getExpiredOffers').mockResolvedValue(expired)
  vi.spyOn(offersApi, 'getCourseOfferingDetails').mockResolvedValue(courseOfferingDetails)
  vi.spyOn(offersApi, 'getSharedSessionDetails').mockResolvedValue({ /* unused */ })
  vi.spyOn(offersApi, 'respondToOffer').mockResolvedValue({})
})

describe('OffersPage', () => {
  it('renders loading state initially', () => {
    renderWithRouter(<OffersPage />)
    expect(screen.getByText(/Loading student offers/i)).toBeInTheDocument()
  })

  it('renders profile name and avatar in sidebar', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => expect(profileApi.getProfile).toHaveBeenCalled())
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('/a.png'))
  })

  it('shows one pending offer card', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText('Offer Received'))
    expect(screen.getByText('Your TA Offers')).toBeInTheDocument()
    expect(screen.getByText('Pending Response')).toBeInTheDocument() // status badge
  })

  it('displays instructor and term fetched from API', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/Instructor:/))
    expect(screen.getByText(/Dr X/)).toBeInTheDocument()
    expect(screen.getByText(/Term A/)).toBeInTheDocument()
  })

  it('formats offer and deadline dates correctly', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/Offer Received/))
    expect(screen.getByText('15th January 2024')).toBeInTheDocument()
    expect(screen.getByText(/End of Day 20th January 2024/)).toBeInTheDocument()
  })

  it('Accept Offer button triggers API and updates lists', async () => {
    // mock after accept returns empty pending and one accepted
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue([])
    vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue([{ ...onePending[0], status: 'accepted' }])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByRole('button', { name: /Accept Offer/ }))
    fireEvent.click(screen.getByRole('button', { name: /Accept Offer/ }))
    await waitFor(() => expect(offersApi.respondToOffer).toHaveBeenCalledWith(10, 'accepted'))
    expect(screen.getByText(/Active positions/)).toBeInTheDocument()
    // Accepted count is 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('Decline Offer button triggers API and updates lists', async () => {
    // Mock the API to return a pending offer initially
    // beforeEach already sets this up, but it is good practice to be explicit
    // about the state for this specific test
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue(onePending);

    const respondToOfferSpy = vi.spyOn(offersApi, 'respondToOffer').mockResolvedValue({});
    vi.spyOn(offersApi, 'getRejectedOffers').mockResolvedValue([{ ...onePending[0], status: 'rejected' }]);

    renderWithRouter(<OffersPage />);

    // Wait for the offer card to appear
    const pendingOfferCardTitle = await screen.findByText("COSC 101 Test Course");
    expect(pendingOfferCardTitle).toBeInTheDocument();

    // Find the decline button and click it
    const declineButton = screen.getByTestId('decline-offer');
    await userEvent.click(declineButton);

    await waitFor(() => {
        // Assert that the respondToOffer API was called with the correct arguments
        expect(respondToOfferSpy).toHaveBeenCalledWith(10, 'rejected');
    });

    // Verify that the UI updates to show the "Rejected" status
    expect(await screen.findByText(/Rejected/)).toBeInTheDocument();
    
    // Optionally, you can also assert that the pending offer is no longer visible
    expect(screen.queryByText("COSC 101 Test Course")).not.toBeInTheDocument();
  });

  it('shows no pending offers empty state if none', async () => {
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue([])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/No Pending Offers/))
    expect(screen.getByText(/Check back later/)).toBeInTheDocument()
  })
/*
  it('places past accepted offers into Past Offers tab', async () => {
    vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue([{ offer_id: 20, status: 'accepted', offer_date: '2024-02-01T00:00:00.999Z', responded_at: '2024-02-05T00:00:00.999Z', offer_items: [] }])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/Past Offers/))
    fireEvent.click(screen.getByRole('tab', { name: /Past Offers/ }))
    const respondedOn = screen.getByTestId("responded-text-based-on-status");
    expect(respondedOn).toHaveTextContent(/responded on/i);
    expect(respondedOn.tagName).toBe("P");
    expect(screen.getByText('5th February 2024')).toBeInTheDocument()
  })
  */

  it('getStatusBadge shows expired icon and label', () => {
    // use directly functions
    const badge = getStatusBadge('Expired')
    expect(badge.props.children).toContain('Expired')
  })

  it('getPriorityBadge returns correct label', () => {
    const bHigh = getPriorityBadge('High')
    expect(bHigh.props.children).toContain('High Priority')
    const bOther = getPriorityBadge('Other')
    expect(bOther.props.children).toContain('Other')
  })

  it('formatSharedSessionTime returns empty when invalid', () => {
    expect(formatSharedSessionTime(null)).toBe('')
    expect(formatSharedSessionTime([])).toBe('')
  })

  it('formatSharedSessionTime merges times correctly', () => {
    const slots = [
      { day_display: 'Tuesday', start_time: '09:00', end_time: '10:00' },
      { day_display: 'Tuesday', start_time: '08:30', end_time: '11:00' }
    ]
    expect(formatSharedSessionTime(slots)).toBe('Tuesday 08:30 - 11:00')
  })
  /*
  it('transformBackendDataToFrontend splits first/last name properly', () => {
    const { transformBackendDataToFrontend } = require('@/src/pages/StudentOffersPage')
    const result = transformBackendDataToFrontend({ name: 'Alice Wonderland', email: 'a@b.com', avatar: '/x.png' })
    expect(result.firstName).toBe('Alice')
    expect(result.lastName).toBe('Wonderland')
    expect(result.email).toBe('a@b.com')
  })

  it('transformBackendDataToFrontend handles first_name field fallback', () => {
    const result = transformBackendDataToFrontend({ first_name: 'Bob Builder', email: '' })
    expect(result.firstName).toBe('Bob')
    expect(result.lastName).toBe('Builder')
  })
  */
})
