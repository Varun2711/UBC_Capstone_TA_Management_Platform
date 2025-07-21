"use client"

import { Link } from "react-router-dom"
import ResetPasswordBreadcrumb from "./ResetPasswordBreadcrumb"

export default function SuccessStep() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      <ResetPasswordBreadcrumb />
          
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Success!</h1>
            <p className="text-gray-600 mb-8">
              Your password has been reset and you may now&nbsp;
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">login</Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
