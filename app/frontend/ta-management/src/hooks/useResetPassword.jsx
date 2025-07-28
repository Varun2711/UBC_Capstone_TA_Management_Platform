/*
Custom hook to look after api requests related to password reset operation
*/
import axios from "axios"
import { useState } from "react";

export function useResetPassword() {
    const API_URL = 'http://localhost:8080/api';
    const [accountInfo, setAccountInfo] = useState("");

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

            const userData = response.data;
            setAccountInfo(userData);

            return { 
                success: true, 
                data: userData
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

    /*
    Compare inputted id (student id or employee id, depending on user_type) to one that we have on file
    Returns object in following format:
    {
        success: true/false,
        data: message to be displayed to user based on result of comparison
    }
    */
    const verifyId = async (id) => {
        // handle edge case where we don't have their account info for some reason
        if(Object.keys(accountInfo).length === 0) {
            return {
                success: false,
                data: "Account information missing. Please restart the password reset process."
            }
        }

        // boolean: check if provided id match what's set in their account
        const inputtedIDMatchesStoredValue = accountInfo.id_number == parseInt(id);

        return {
            success: inputtedIDMatchesStoredValue,
            data: inputtedIDMatchesStoredValue
                ? "Your identity has been verified"
                : "The ID number you entered does not match our records."
        }
    }

    /*
    * Request notification service to send a password reset link to provided email address
    */
    const requestSendResetLink = async() => {
        try {    
            
            const response = await axios.post(API_URL + '/notifications/send_password_reset/', 
                { 
                    email: accountInfo.email,
                    user_type: accountInfo.user_type,
                    user_id: accountInfo.id_number
                }
            );

            return {
                success: true,
                data: response.message
            }
        } catch (error) {
            if (error.response?.status === 500) {
                return { 
                    success: false, 
                    data: "There was an error sending your password reset link. Please try again, or if the issue persists, contact the system administrator."
                }
            }

            // handle any other misc. error, so that app doesn't crash
            return {
                success: false,
                data: "Encountered unknown error sending your password reset link. Please try again, or if the issue persists, contact the system administrator."
            }
        }
    }

    /*
    Request auth service to execute a password reset
    - The reset-password-complete endpoint handles everything, including getting the notification
    service to verify the token and mark it as used, so just have to make the one request here
    */
    const requestPasswordReset = async (password, token) => {
        try {
            const response = await axios.post(API_URL + '/auth/reset-password-complete/', 
                { 
                    token: token,
                    new_password: password
                }
            );

            return {
                success: true,
                data: response.data?.message ?? "Password reset successful!"
            }
        
        } catch(error) {
            const errorMsg = error.response?.data?.error || "An unexpected error occurred when resetting your password";

            // default to error message provided by api, and adjust to be more descriptive for most commonly encountered errors
            let data = errorMsg;

            // Display user-friendly error message:
            if(errorMsg == "Student not found" || errorMsg == "Instructor not found" || errorMsg == "Scheduler not found" || errorMsg == "Admin not found") {
                data = "Unable to find your account. Please ensure that your account exists and your email address hasn't changed"
            } else if(errorMsg == "Invalid or expired token") {
                data = "Email link invalid or expired. Please return to 'Reset Password' to request a new link."
            }

            return {
                success: false,
                data: data
            }
        }
        
    }
    
    return { requestAccountLookup, verifyId, requestSendResetLink, requestPasswordReset}
}