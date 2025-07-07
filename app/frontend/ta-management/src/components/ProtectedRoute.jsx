/*
Wrapper component to be used in route definitions to protect
against unauthorized users gaining access to role-specific pages
Takes "authorizedRoles" as parameter so you can specify which
role(s) is/are allowed to access a particular page

Example usage:
<ProtectedRoute allowedRoles={[USER_TYPES.student]}>
    <StudentDashboard />
</ProtectedRoute>
*/

import { useState, useEffect } from "react";
import { requestTokenValidation, requestTokenRefresh } from "@/logic/auth";
import UnauthorizedPage from "@/pages/UnauthorizedPage";

function ProtectedRoute({ children, authorizedRoles }) {
    const [isAuthorized, setIsAuthorized] = useState(null)

    // whenever protected route is loaded, attempt to authenticate
    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
    }, [])
    
    /*
    Helper function that checks for an auth token, then is that token valid?,
    and then, is this type of user allowed access to this page?
    Also handles refreshing the token in case it's expired
    */
    const auth = async () => {
        // do we have a token? if so, check if it's expired or not
        const token = sessionStorage.getItem("accessToken")

        // no token = unauthorized
        if(!token) {
            setIsAuthorized(false)
            return
        }

        // has token, let's check if it's valid (api call to auth/validate)
        const response = await requestTokenValidation(token)
        const isValid = response.valid 

        if(isValid) {
            // check if this user is on the list of authorized roles
            if(authorizedRoles && authorizedRoles.includes(response.user_type)) {
                setIsAuthorized(true)
            } else { // valid user logged in, but not allowed to view this page
                setIsAuthorized(false)
            }

        } else {
            // not valid, need to check why
            const error = response.error
            // if token = expired, refresh it
            if(error === "Token has expired") {
                await refresh()
            } else {
                // any other error = unauthorized access
                setIsAuthorized(false)
            }
        }
    }

    /*
    Helper function that handles token refresh, used by the auth()
    function above.
    */
    const refresh = async () => {
        const token = sessionStorage.getItem("refreshToken")
        try {
            // attempt to get a new token (api call to auth/token/refresh)
            const response = await requestTokenRefresh(token)

            if(response.data.access) {            
                // successful request that contains access token,
                // store the new token and say they are authorized
                sessionStorage.setItem("accessToken", response.data.access)
                setIsAuthorized(true)
            } else {
                // some sort of error, did not get an access token = unauthorized
                setIsAuthorized(false)
            }
        } catch (error) {
            setIsAuthorized(false)
        }
    }

    
    // in case of authorization taking time, show loading to inform user that stuff is happening
    if(isAuthorized === null) {
        return <div> Loading... </div>
    }

    // if authorized to view the page, display the page. Otherwise, render the unauthorized access page
    return isAuthorized ? children : < UnauthorizedPage />
}

export default ProtectedRoute