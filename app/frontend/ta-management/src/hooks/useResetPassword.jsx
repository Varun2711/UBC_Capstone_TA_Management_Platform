/*
Custom hook to look after api requests related to password reset operation
*/
import axios from "axios"

export function useResetPassword() {
    /*
    Check that provided email address belongs to a user account
    */
    const requestAccountLookup = async (email) => {
        try { 
            // const response = await axios.post('/auth/request-password-reset', { email });
            // return response.data.valid;
            console.log("request account lookup")
            return true;
        } catch {
            return false
        }
    }

    const verifyId = async (id) => {
        // todo: check that id inputted matches what is stored in their account
        console.log("verify id")
        return true;
    }

    const requestPasswordReset = async (password, confirm) => {
        // todo: check that passwords match
        // then set user's password as "password" in the db
        console.log("request password reset")
        return true;
    }
    
    return { requestAccountLookup, verifyId, requestPasswordReset }
}