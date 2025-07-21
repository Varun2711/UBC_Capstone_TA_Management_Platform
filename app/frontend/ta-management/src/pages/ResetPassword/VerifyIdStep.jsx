"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { useResetPassword } from "@/hooks/useResetPassword"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SlashIcon } from "lucide-react"

export default function VerifyIdStep({ onNext }) {
  // state
  const [id, setId] = useState("")
  const [error, setError] = useState("")

  const { verifyId } = useResetPassword();

  const handleSubmit = async (e) => {
    e.preventDefault()

    if(validInput()) {
      // check inputted student/employee id with value in database (todo)
      const success = await verifyId(id);
      if(success) {
        console.log("valid id")
        onNext(id);
      }
    }
  }

  /* 
  Perform input validation and return true if valid, false if invalid
  */
  function validInput() {
    let idError = "";

    if(!id.trim()) { // id field was left empty
      idError = "Student/employee id is required"
    } else if(!(/^(?!0{8})\d{8}$/.test(id))) { // id must be non-zero, non-negative, 8 digit number
      idError = "Student/employee id must be an 8 digit number"
    }

    setError(idError)

    return idError == ""
  }

  const handleIdChange = (e) => {
    // set id var as inputted value and clear error msg
    setId(e.target.value)
    setError("")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="hover:text-gray-900 underline">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator> 
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/login" className="hover:text-gray-900 underline">Login</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator> 
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            Forgot Password
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
        
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Confirm Your Identity</h1>
            <p className="text-gray-600 mb-8">
              { /* TODO: what if an account does not exist for that email address? */}
              Verify your identity by entering the student or employee number associated with your account.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} role="form" noValidate>
            <div className="space-y-2">
              <Label htmlFor="id" className="text-sm font-medium text-gray-700">
                Student or Employee ID *
              </Label>
              <Input
                id="id"
                name="id"
                type="text"
                inputmode="numeric"
                value={id}
                onChange={handleIdChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your student or employee ID"
                required
              />
              {error && <span className="text-red-700">{error}</span>}
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
    </div>
  )
}
