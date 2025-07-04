import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import { renderWithAuth } from "./test-utils/renderWithAuth"
import { USER_TYPES } from "@/data/user-types"
import { ROUTES } from "@/data/routes"

/*
Basically we go through and check that each route can be accessed by everyone who's
supposed to have access, and that they cannot be accessed by anyone who's not allowed
*/
describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    // Test that, for each route, the authorized user types CAN access them
    ROUTES.forEach(({ name, path, authorizedRoles }) => {
        // start with all 4 user types and then filter based on what's listed in ROUTES
        const authorizedUsers = [USER_TYPES.student, USER_TYPES.instructor, USER_TYPES.scheduler, USER_TYPES.admin].filter(
            (user) => authorizedRoles.includes(user)
        )

        // for each user type that's unauthorized to view this page (usually only 1, but
        // eventually we might have pages that allow multiple types of users)
        authorizedUsers.forEach((userType) => {
            it(`allows ${userType} to access ${name}`, async () => {
                // render the page as if we are logged in as that user type
                renderWithAuth({
                    route: path,
                    userType
                })
                
                // we should not see the unauthorized html page, we should see the page we requested
                const unauthorizedText = screen.queryByText(/you are unauthorized to access this page/i)
                expect(unauthorizedText).not.toBeInTheDocument()
            })
        })
    })

    // Test that, for each route, the unauthorized user types CANNOT access them
    ROUTES.forEach(({ name, path, authorizedRoles }) => {
        // start with all 4 user types and then filter based on what's listed in ROUTES
        const unauthorizedUsers = [USER_TYPES.student, USER_TYPES.instructor, USER_TYPES.scheduler, USER_TYPES.admin].filter(
            (user) => !authorizedRoles.includes(user)
        )

        // for each user type that's unauthorized to view this page
        unauthorizedUsers.forEach((userType) => {
            it(`redirects ${userType} away from ${name}`, async () => {
                // render the page as if we are logged in as that user type
                renderWithAuth({
                    route: path,
                    userType
                })

                // we should see the unauthorized html page
                expect(await screen.findByText(/you are unauthorized to access this page/i)).toBeInTheDocument()
            })
        })
    })
})

