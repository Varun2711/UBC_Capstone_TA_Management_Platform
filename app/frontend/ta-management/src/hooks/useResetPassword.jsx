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
    * Compare inputted id (student id or employee id, depending on user_type) to one that we have on file
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

        // boolean: does provided id match what is set in their account?
        const inputtedIDMatchesStoredValue = accountInfo.id_number == parseInt(id);

        // todo: implement set # of attempts to verify identity (security)
        return {
            success: inputtedIDMatchesStoredValue,
            data: inputtedIDMatchesStoredValue
                ? "Your identity has been verified"
                : "The ID number you entered does not match our records. X attempts remain."
        }
    }

    const requestPasswordReset = async (password, confirm) => {
        // todo: check that passwords match
        // then set user's password as "password" in the db
        console.log("request password reset")
        return true;
    }
    
    return { requestAccountLookup, verifyId, requestPasswordReset }
}