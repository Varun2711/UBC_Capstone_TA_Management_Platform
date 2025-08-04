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

  it('shows one pending offer card', async () => {
    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText('Offer Received'))
    expect(screen.getByText('Your TA Offers')).toBeInTheDocument()
    expect(screen.getByText('Pending Response')).toBeInTheDocument() // status badge
  })


   it('displays instructor and term fetched from API', async () => {
      renderWithRouter(<OffersPage />)
      // Wait for a text element that contains the full string "Instructor: Dr X"
      await waitFor(() => screen.getByText(/Instructor: Dr X/i))

      // You can also still test for "Term A" separately
      expect(screen.getByText(/Term A/i)).toBeInTheDocument()
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

  it('renders an offer with shared session details', async () => {
    const oneSharedSession = [{
      ...onePending[0],
      offer_id: 50,
      offer_items: [
        {
          item_type: 'shared_session',
          shared_session_id: 200,
          course_number: 'COSC 200',
          course_name: 'Shared Session Course',
          section_type_display: 'Tutorial',
          section_number: '002',
        },
      ],
    }]
    const sharedSessionDetails = {
      instructor_info: 'Dr Y',
      academic_term_info: 'Term B',
      time_slots_info: [
        { day_display: 'Wednesday', start_time: '14:00', end_time: '15:30' }
      ]
    }
    vi.spyOn(offersApi, 'getPendingOffers').mockResolvedValue(oneSharedSession)
    vi.spyOn(offersApi, 'getSharedSessionDetails').mockResolvedValue(sharedSessionDetails)

    renderWithRouter(<OffersPage />)
    await waitFor(() => screen.getByText('COSC 200 Shared Session Course'))
    
    expect(screen.getByText(/Dr Y/)).toBeInTheDocument()
    expect(screen.getByText(/Term B/)).toBeInTheDocument()
    expect(screen.getByText('Wednesday 14:00 - 15:30')).toBeInTheDocument()
  })
  
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
})
