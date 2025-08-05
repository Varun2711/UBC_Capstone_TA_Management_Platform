/*
 * Password Reset Step 1: User enters their email address and we look it up
in the database to see their account exists. This is also where we grab their
student/employee id in order to verify it in step 2.
 */
"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import ResetPasswordBreadcrumb from "./ResetPasswordBreadcrumb"
import { toast } from "sonner"
import { useLockoutTimer } from "@/hooks/useLockoutTimer"
import { formatTime } from "@/logic/password-reset-lockout"

export default function EmailStep({ onNext, requestAccountLookup }) {
  // state
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  
  const { lockedOut, lockoutTime } = useLockoutTimer();

  const handleSubmit = async (e) => {
    e.preventDefault()

    if(lockedOut) return;

    if(validInput()) {
      // lookup email address in database to check that is associated with an account
      const response = await requestAccountLookup(email);

      // if email found, proceed to next step of password reset
      if(response.success) {
        onNext(email);
        toast.success("Account found!")
      // if email not found, display error toast
      } else {
        toast.error(response.data)
      }
    }
  }

  /* 
  * Perform input validation and return true if valid, false if invalid
  */
  function validInput() {
    let emailError = "";

    if(!email.trim()) { // email field was left empty
      emailError = "Email address is required"
    } else if(!(/\S+@\S+\.\S+/.test(email))) { // email not in proper format, abc@abc.abc
      emailError = "Email address must be in valid format: name@example.com"
    }

    setError(emailError)

    return emailError == ""
  }

  const handleEmailChange = (e) => {
    // set email var as inputted value and clear error msg
    setEmail(e.target.value)
    setError("")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      {/*Breadcrumb showing Home / Login / Forgot Password so that user is informed of their location w/in the app */}
      <ResetPasswordBreadcrumb />
      
      {/* Main page content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Reset Password</h1>
            <p className="text-gray-600 mb-8">
              Enter the email address associated with your account. 
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} role="form" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
                disabled={lockedOut}
              />
              
              {error && <span className="text-red-700" role="alert">{error}</span>}
              {lockedOut && 
                <span className="text-red-700" role="alert">
                  You have reached the maximum number of failed verification attempts. Try again in {formatTime(lockoutTime)}, or if you believe this is in error, please contact the system administrator.
                </span>}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              disabled={lockedOut}
            >
              Next
            </Button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
