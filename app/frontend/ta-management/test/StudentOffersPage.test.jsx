// OffersPage.test.tsx
import { describe, it, vi, beforeEach, expect } from 'vitest'
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
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

  it('shows one pending offer card', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText('Offer Received'))
    expect(screen.getByText('Your TA Offers')).toBeInTheDocument()
    expect(screen.getByText('Pending Response')).toBeInTheDocument() // status badge
  })

  it('displays "No instructor found" when instructor details are missing', async () => {
    const courseOfferingDetailsNoInstructor = { instructor_info: null, term_info: 'Term A' };
    vi.spyOn(offersApi, 'getCourseOfferingDetails').mockResolvedValue(courseOfferingDetailsNoInstructor);
    renderWithRouter(<OffersPage />);
    
    // Now look for the full text "Instructor: No instructor assigned"
    await waitFor(() => screen.getByText(/Instructor: No instructor assigned/));

    // This assertion can be removed if the one above is successful
    // expect(screen.getByText(/No instructor assigned/)).toBeInTheDocument();
  });

  
  it('formats offer and deadline dates correctly', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/Offer Received/))
    expect(screen.getByText('15th January 2024')).toBeInTheDocument()
    expect(screen.getByText(/End of Day 20th January 2024/)).toBeInTheDocument()
  })

  it('getStatusBadge shows expired icon and label', () => {
    // use directly functions
    const badge = getStatusBadge('Expired')
    expect(badge.props.children).toContain('Expired')
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

  it('calls respondToOffer with "accepted" when Accept button is clicked', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText('Accept Offer'))
    const acceptBtn = screen.getByText(/Accept Offer/)
    fireEvent.click(acceptBtn)
    await waitFor(() =>
      expect(offersApi.respondToOffer).toHaveBeenCalledWith(10, 'accepted')
    )
  })

  it('displays message when no offers are present', async () => {
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue([])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/No Pending Offers/i))
    expect(screen.getByText(/No Pending Offers/i)).toBeInTheDocument()
  })

  it('shows accepted offers if available', async () => {
    vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue([
      { ...onePending[0], status: 'accepted' }
    ])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText(/Accepted/i))
    expect(screen.getByText(/Accepted/i)).toBeInTheDocument()
  })

  it('shows rejected offers if available', async () => {

    const user = userEvent.setup()

    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue([])
    vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue([])
    vi.spyOn(offersApi, 'getRejectedOffers').mockResolvedValue([
      {
        ...onePending[0],
        status: 'rejected',
        offer_items: onePending[0].offer_items
      }
    ])
    vi.spyOn(offersApi, 'getExpiredOffers').mockResolvedValue([])

    renderWithRouter(<OffersPage />)

    // Click the "Past Offers" tab to view rejected offers
    const pastTab = await screen.findByRole('tab', { name: /Past Offers/i })
    await user.click(pastTab)

    // Wait for rejected status to be visible
    await waitFor(() => {
      expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
    })
  })

  it('does not show Accept/Decline if offer is already accepted', async () => {
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue([])
    vi.spyOn(offersApi, 'getAcceptedOffers').mockResolvedValue([
      { ...onePending[0], status: 'accepted' }
    ])
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.queryByText(/Accept Offer/))
    expect(screen.queryByText(/Accept Offer/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Decline Offer/)).not.toBeInTheDocument()
  })

})
