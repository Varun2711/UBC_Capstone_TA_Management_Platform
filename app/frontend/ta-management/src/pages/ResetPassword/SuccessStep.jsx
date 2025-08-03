/*
* Password Reset Step 5: after their password has been successfully reset,
user sees this page to confirm
*/
"use client"

import { Link } from "react-router-dom"
import ResetPasswordBreadcrumb from "./ResetPasswordBreadcrumb"
import { getDashboardLink } from "@/logic/getDashboardLink"

export default function SuccessStep({isLoggedIn=null, userType=null}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      <ResetPasswordBreadcrumb />
          
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Success!</h1>
            <p className="text-gray-600 mb-8">
              {isLoggedIn ? (
                <>
                  Your password has been changed. Return to&nbsp;
                  <Link to={getDashboardLink(userType)} className="font-medium text-blue-600 hover:text-blue-500 underline">dashboard</Link>.
                </>
              ) : (
                <>
                  Your password has been reset. Return to&nbsp;
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">login</Link>.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
