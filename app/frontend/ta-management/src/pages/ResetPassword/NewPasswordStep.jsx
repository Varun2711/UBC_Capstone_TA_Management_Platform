"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { useResetPassword } from "@/hooks/useResetPassword"

export default function NewPasswordStep({ onNext }) {
  // state
  const [password, setPassword] = useState(""); // new password
  const [confirm, setConfirm] = useState(""); // confirm new password
  const { requestPasswordReset } = useResetPassword();

  const handleSubmit = async (e) => {
    e.preventDefault()

    // attempt password reset
    const success = await requestPasswordReset(password, confirm);
    if(success) {
      console.log("password has been reset!")
      onNext();
    }
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirm(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Forgot Password</h1>
          <p className="text-gray-600 mb-8">
            Create a new password
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} role="form">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
              New Password
            </Label>
            <Input
              id="new-password"
              name="new-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a new password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              value={confirm}
              onChange={handleConfirmPasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Reset Password
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
