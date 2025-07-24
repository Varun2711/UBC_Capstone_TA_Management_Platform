/*
* Password Reset Step 3: informs user that link to reset password has been
* emailed to them
*/
"use client"

import { Link } from "react-router-dom"
import ResetPasswordBreadcrumb from "./ResetPasswordBreadcrumb"

export default function LinkSentStep() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      <ResetPasswordBreadcrumb />
          
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Email Sent!</h1>
            <p className="text-gray-600 mb-8">
              Please check your email for a link to reset your password.<br />
              
              <Link to="/" className="font-medium text-blue-600 hover:text-blue-500 underline">Return to landing page</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
