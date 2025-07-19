"use client"

import { Link } from "react-router-dom"

export default function SuccessStep() {

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Success!</h1>
          <p className="text-gray-600 mb-8">
            Your password has been reset and you can now login.
          </p>
        </div>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
