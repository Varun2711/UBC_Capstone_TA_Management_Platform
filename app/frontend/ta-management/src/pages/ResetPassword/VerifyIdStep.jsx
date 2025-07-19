"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { useResetPassword } from "@/hooks/useResetPassword"

export default function VerifyIdStep({ onNext }) {
  // state
  const [id, setId] = useState("")
  const { verifyId } = useResetPassword(); // todo change this to id check

  const handleSubmit = async (e) => {
    e.preventDefault()

    // check inputted student/employee id with value in database
    const success = await verifyId(id);
    if(success) {
      console.log("valid id")
      onNext(id);
    }
  }

  const handleIdChange = (e) => {
    setId(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Forgot Password</h1>
          <p className="text-gray-600 mb-8">
            { /* TODO: what if an account does not exist for that email address? 
            also, fix formatting */}
            Success! An account was found with the email address provided.<br /> 
            Now let's make sure it's you. Please provide your student or employee number to confirm your identity.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} role="form">
          <div className="space-y-2">
            <Label htmlFor="id" className="text-sm font-medium text-gray-700">
              Student or Employee ID *
            </Label>
            <Input
              id="id"
              name="id"
              type="number"
              value={id}
              onChange={handleIdChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your student or employee ID"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
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
  )
}
