/*
* Summary *
Component to handle flow of password reset operation, store data, keep track of 
which step user is on, and display correct page

* Params *
- initialStep: specify what step of the password reset process you want rendered
(defaults to step 0 (enter email) if none provided)
- fromSession: specify whether the password reset is initiated by user who is
already authenticated (logged in)

* Detailed Description *
Our password reset has 5 steps as follows (unauthenticated user):
1. Enter email: user enters email associated with their account and we look it up
in the db
2. Verify id: if that email is tied to an account, we ask the user to enter their
student/employee number and then verify that with what's in the db to confirm
their identity as the account owner
3. Send reset password link: if their id matches up, user is emailed a link to 
reset their password
4. Set new password: when user clicks link sent to their email address, they are
navigated to the frontend page to set a new password. we prompt them to set a new 
password and then confirm that new password (enter it a second time, passwords 
must match)
5. Success: new password is hashed and stored in the database, user is informed
that password reset was successful, and user is prompted to login

For an authenticated user wanting to change password, the process is quicker, as
they begin at Step 4:
4. Set new password: User re-enters current password for security purposes, then
new password and confirm new password. We check that their inputted password
matches what's on file, then update their password in the db
5. Success: same as above except user is prompted to go to dashboard
*/

import { useEffect, useState } from "react";
import EmailStep from "./EmailStep";
import VerifyIdStep from "./VerifyIdStep";
import NewPasswordStep from "./NewPasswordStep";
import SuccessStep from "./SuccessStep";
import { useResetPassword } from "@/hooks/useResetPassword";
import LinkSentStep from "./LinkSentStep";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { requestTokenValidation } from "@/logic/auth";

// enum to make what step we're on more readable 
export const RESET_PASSWORD_STEPS = {
    enter_email: 0,
    verify_id: 1,
    link_sent: 2,
    set_new_password: 3,
    success: 4
}

export default function ResetPasswordController({ initialStep }) {
    // VARIABLES -------------------------------------

    // state information
    const [step, setStep] = useState(initialStep ?? RESET_PASSWORD_STEPS.enter_email);
    const [email, setEmail] = useState("")
    const [id, setId] = useState("") // student id or employee id, depending on user_type
    const [accountInfo, setAccountInfo] = useState(null);

    // token data (will be present if user is coming from password reset link that was emailed to them)
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // if already logged in, we pass fromSession in the url when navigating to reset password
    const fromSession = searchParams.get("fromSession") == "true";

    // reset password hook
    const resetPassword = useResetPassword();

    // LOGIC -----------------------------------------

    // When component is loaded for a user who is already logged in, validate the session
    // and then begin password reset at NewPasswordStep
    useEffect(() => {
        // Helper function to handle this logic
        async function validateSessionAndStart() {
            try {
                const authToken = sessionStorage.getItem("accessToken")

                if(authToken) {
                    const response = await requestTokenValidation(authToken)
                    
                    // session is valid, grab user account data to be used for password reset operation
                    if (response.valid) {
                        setAccountInfo({
                            email: response.email,
                            user_id: response.user_id,
                            user_type: response.user_type
                        })
                        
                        setStep(RESET_PASSWORD_STEPS.set_new_password);
                    
                    } else {
                        console.error("Session is not valid.");
                    }
                } else {
                    console.error("Authorization token could not be found.")
                }

            } catch (error) {
                console.error("Error validating the session: ", error);
            }
        }

        // Helper function actually called here
        if(fromSession) {
            validateSessionAndStart();
        }
    }, [fromSession]);

    // When component is loaded, check right away if user has a token 
    // (means they are coming from a password reset link that was emailed to them)
    useEffect(() => {
        if (token) {
            // direct them onto setting a new password
            setStep(RESET_PASSWORD_STEPS.set_new_password)
        }
    }, [token]);

    // Each of these handlers are passed as a component prop to handle what happens when 
    // you click the "Next" button on a particular step of the password reset process.
    // For instance, handleEmailNext is passed to the EmailStep component and handles
    // the logic that occurs when you press "Next" on the EmailStep page
    const handleEmailNext = (emailInput) => {
        setEmail(emailInput);
        setStep(RESET_PASSWORD_STEPS.verify_id);
    }

    const handleVerifyNext = (idInput) => {
        setId(idInput);
        setStep(RESET_PASSWORD_STEPS.link_sent);
    }

    const handleNewPasswordNext = () => {
        setStep(RESET_PASSWORD_STEPS.success);
    }
    
    // Conditionally render the appropriate page based on which step of the password 
    // reset process the user is on, along with function parameters
    return (
        <>
            { step === RESET_PASSWORD_STEPS.enter_email && <EmailStep onNext={handleEmailNext} requestAccountLookup={resetPassword.requestAccountLookup} /> }
            { step === RESET_PASSWORD_STEPS.verify_id && <VerifyIdStep email={email} onNext={handleVerifyNext} verifyId={resetPassword.verifyId} requestSendResetLink={resetPassword.requestSendResetLink}/> }
            { step === RESET_PASSWORD_STEPS.link_sent && <LinkSentStep />}
            { step === RESET_PASSWORD_STEPS.set_new_password && (
                <NewPasswordStep 
                    token={token}
                    accountInfo={accountInfo} 
                    onNext={handleNewPasswordNext} 
                    requestPasswordReset={resetPassword.requestPasswordReset} 
                    /> 
            )}
            { step === RESET_PASSWORD_STEPS.success && <SuccessStep isLoggedIn={accountInfo ? true : false } userType={accountInfo ? accountInfo.user_type : null } />}
        </>
    )
}