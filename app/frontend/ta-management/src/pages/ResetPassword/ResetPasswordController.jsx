/*
Component to handle flow of password reset operation, store data,
keep track of which step user is on, and display correct page

Our password reset has 4 steps as follows:
1. Enter email: user enters email associated with their account and we look it up
in the db
2. Verify id: if that email is tied to an account, we ask the user to enter their
student/employee number and then verify that with what's in the db to confirm
their identity as the account owner
3. Set new password: if their id matches up, user is prompted to set a new password
and then confirm that new password (enter it a second time, passwords must match)
4. Success: new password is hashed and stored in the database, user is informed
that password reset was successful, and user is prompted to login
*/

import { useState } from "react";
import EmailStep from "./EmailStep";
import VerifyIdStep from "./VerifyIdStep";
import NewPasswordStep from "./NewPasswordStep";
import SuccessStep from "./SuccessStep";
import { useResetPassword } from "@/hooks/useResetPassword";

export default function ResetPasswordController() {
    // enum to make state information more readable
    const STEPS = {
        enter_email: 0,
        verify_id: 1,
        set_new_password: 2,
        success: 3
    }
    
    // state information
    const [step, setStep] = useState(STEPS.enter_email);
    const [email, setEmail] = useState("")
    const [id, setId] = useState("") // student id or employee id, depending on user_type

    const resetPassword = useResetPassword();

    // Each of these handlers are passed as a component prop to handle what happens when 
    // you click the "Next" button on a particular step of the password reset process.
    // For instance, handleEmailNext is passed to the EmailStep component and handles
    // the logic that occurs when you press "Next" on the EmailStep page
    const handleEmailNext = (emailInput) => {
        setEmail(emailInput);
        setStep(STEPS.verify_id);
    }

    const handleVerifyNext = (idInput) => {
        setId(idInput);
        setStep(STEPS.set_new_password);
    }

    const handleNewPasswordNext = () => {
        setStep(STEPS.success)
    }
    
    // Conditionally render the appropriate page based on which step of the password 
    // reset process the user is on, along with function parameters
    return (
        <>
            { step === STEPS.enter_email && <EmailStep onNext={handleEmailNext} requestAccountLookup={resetPassword.requestAccountLookup} /> }
            { step === STEPS.verify_id && <VerifyIdStep email={email} onNext={handleVerifyNext} verifyId={resetPassword.verifyId} /> }
            { step === STEPS.set_new_password && <NewPasswordStep email={email} id={id} onNext={handleNewPasswordNext} requestPasswordReset={resetPassword.requestPasswordReset} /> }
            { step === STEPS.success && <SuccessStep />}
        </>
    )
}