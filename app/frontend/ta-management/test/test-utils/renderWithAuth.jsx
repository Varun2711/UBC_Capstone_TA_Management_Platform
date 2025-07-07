/*
Utility component to simulate a logged-in state and load a particular page
in that state. Mocks all required api responses so you don't need to
worry about doing that. 
Params (optional): 
- route (EX: "/student-dashboard")
- userType (EX: USER_TYPES.student)
Note: to simulate a non-logged-in state, just don't pass a userType
*/
import App from "@/App"
import * as auth from "@/logic/auth"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

// Constants to mock access tokens
const ACCESS_TOKEN = "ACCESS_TOKEN"
const REFERSH_TOKEN = "REFRESH_TOKEN"

export function renderWithAuth({
    route = "/",
    userType = null,
} = {}) {
    // if user_type given, simulate logged-in user
    if(userType) {
        sessionStorage.setItem("accessToken", ACCESS_TOKEN)
        sessionStorage.setItem("refreshToken", REFERSH_TOKEN)
        sessionStorage.setItem("user_type", userType)
    // if no user_type, simulate non-logged-in user
    } else {
        sessionStorage.clear()
    }

    // mock request to validate token
    // if there's a userType, give a successful response,
    // if not, unsuccessful response
    vi.spyOn(auth, "requestTokenValidation").mockResolvedValue(
        userType
            ? {
                valid: "true",  
                user_id: "123",
                user_type: userType,
                email: "test@test.com",
                name: "Test"
            }
            : {
                valid: "false"
            }

    )

    // mock request to refresh token
    // if there's a userType, give a successful response,
    // if not, unsuccessful response
    vi.spyOn(auth, "requestTokenRefresh").mockResolvedValue(
        userType
            ? {
                access: ACCESS_TOKEN,
                refresh: REFERSH_TOKEN,
                user_id: "123",
                user_type: userType,
                name: "Test"
            }
            : {
                error: "Invalid or expired refresh token"
            }
    )

    // send to specified page
    return render(
        <MemoryRouter initialEntries={[route]}>
            < App />
        </MemoryRouter>
    )
}