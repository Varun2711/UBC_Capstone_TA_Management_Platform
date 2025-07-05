/*
Set of helper functions related to authentication/logging in
This takes care of any heavy lifting related to sending api
requests and receiving responses, along with other auth-related
tasks. Uses axios library for easy formatting of requests
*/

import { USER_TYPES, DASHBOARD_ROUTES } from "@/data/user-types"
import axios from "axios"

const API_URL = 'http://localhost:8080/api'

/*
Send POST request to auth/login/
- Request params: email, password
- Response keys: access, refresh, user_id, user_type, name
*/
export const requestLogin = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login/`, {
        email,
        password
    })

    return response.data
}

/*
Send GET request to auth/validate/
- Request params: access_token
- Response keys: valid (boolean), user_id, user_type, name, email
*/
export const requestTokenValidation = async(access_token) => {
    if (access_token) {
        const response = await axios.get(`${API_URL}/auth/validate/`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        
        return response.data
    }

    return null
}

/*
Send POST request to auth/token/refresh/
- Request params: refresh_token
- Response keys: access, refresh, user_id, user_type, name
*/
export const requestTokenRefresh = async(refresh_token) => {
    if(refresh_token) {
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh_token
        })

        return response.data
    }

    return null
}

/*
Utility function to check if logged in
Returns true if user is currently logged in AND has been given
a user type. Returns false otherwise.
*/
export async function isAlreadyLoggedIn() {
    const token = sessionStorage.getItem('accessToken')
    const response = await requestTokenValidation(token)

    if(response) {
        return (response.valid && response.user_type)
    }

    return false
}

/*
Utility function to send user to the correct dashboard
based on what type of user they are.
(Just performs a repetitive task, doesn't return anything)
*/
export function navigateToUserDashboard(user_type, navigate) {
    if(user_type === USER_TYPES.student) {
        navigate(DASHBOARD_ROUTES.student)
    } else if(user_type === USER_TYPES.instructor) {
        navigate(DASHBOARD_ROUTES.instructor)
    } else if(user_type === USER_TYPES.scheduler) {
        navigate(DASHBOARD_ROUTES.scheduler)
    } else if(user_type === USER_TYPES.admin) {
        navigate(DASHBOARD_ROUTES.admin)
    }
}

/*
Utility function to execute logout operation, which consists of
1) clear all stored tokens/other session info and 2) redirect user 
to landing page
*/
export function logout(navigate) {
    sessionStorage.clear()
    navigate("/") // navigate to dashboard
}