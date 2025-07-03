/*
Wrapper component to be used in route definitions to protect
against unauthorized users gaining access to role-specific pages
Takes "authorizedRoles" as parameter so you can specify which
role(s) is/are allowed to access a particular page

Example usage:
<ProtectedRoute allowedRoles={["student"]}>
    <StudentDashboard />
</ProtectedRoute>
*/

import { useState, useEffect } from "react";
import { requestTokenValidation, requestTokenRefresh } from "@/logic/auth";

// Helper function to show a simple page w link back to landing page
// when unauthorized user attempts to access a protected route
function renderUnauthorizedPage() {
    return <div>You are unauthorized to access this page. <a href="/" className="text-blue-600 dark:text-blue-500 hover:underline">Return to landing page</a></div>
}

// Bulk of the protected route logic found here:
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
        const token = localStorage.getItem("accessToken")

        // no token = unauthorized
        if(!token) {
            setIsAuthorized(false)
            return
        }

        // has token, let's check if it's valid (api call to auth/validate)
        const response = await requestTokenValidation(token)
        const isValid = response.valid 

        if(isValid) {
            console.log("A valid " + response.user_type + " user is logged in!!!!")
            
            if(authorizedRoles && authorizedRoles.includes(response.user_type)) {
                setIsAuthorized(true)
                console.log("And you are allowed to go to this page!")
            } else {
                setIsAuthorized(false)
                console.log("But you're NOT allowed to see this page bye!")
            }

        } else {
            // not valid, need to check why
            const error = response.error
            // if token = expired, refresh it
            if(error === "Token has expired") {
                console.log("Refreshing your token!")
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
        const token = localStorage.getItem("refreshToken")
        try {
            // attempt to get a new token (api call to auth/token/refresh)
            console.log("Attempting to refresh token")
            const response = await requestTokenRefresh(token)

            if(response.status === 200) {            
                // successful request that contains access token,
                // store the new token and set is author
                localStorage.setItem("accessToken", response.data.access)
                setIsAuthorized(true)
                console.log("Refreshed token!")
            } else {
                // some sort of error, did not get an access token
                console.log("response: " + response.status)
                setIsAuthorized(false)
            }
        } catch (error) {
            console.log(error)
            setIsAuthorized(false)
        }
    }

    
    // in case of authorization taking time, show loading to inform user that stuff is happening
    if(isAuthorized === null) {
        return <div> Loading... </div>
    }

    // if authorized to view the page, display the page. Otherwise, render the unauthorized access page
    return isAuthorized ? children : renderUnauthorizedPage()
}

export default ProtectedRoute