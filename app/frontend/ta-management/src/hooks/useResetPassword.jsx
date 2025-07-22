/*
Custom hook to look after api requests related to password reset operation
*/
import axios from "axios"

export function useResetPassword() {
    const API_URL = 'http://localhost:8080/api';

    /*
    Check if provided email address belongs to a user account
    Returns object in following format:
    {
        success: true/false,
        data: if success=true, this is response.data, which consists of: email, user_type, id_number
        if success=false, this is a user-friendly error message
    }
    */
    const requestAccountLookup = async (email) => {
        try {             
            const response = await axios.post(API_URL + '/auth/reset-password/lookup/', 
                { 
                    email: email
                }
            );

            return { 
                success: true, 
                data: response.data 
            };

        } catch (error) {
            if (error.response?.status === 404) {
                return { 
                    success: false, 
                    data: "An account with that email address does not exist."
                }
            } else {
                return {
                    success: false,
                    data: "An unexpected error occurred while looking up your account. Please try again."
                }
            }
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