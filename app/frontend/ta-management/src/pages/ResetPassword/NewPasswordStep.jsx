/**
 * Password Reset Step 4: after clicking the link that was emailed to them,
 * user is navigated here, where they input a new password and then confirm
 * that new password by entering it again. Their password is then updated
 * in the database accordingly
 */
"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import ResetPasswordBreadcrumb from "./ResetPasswordBreadcrumb"

export default function NewPasswordStep({ onNext, requestPasswordReset }) {
  // state
  const [password, setPassword] = useState(""); // new password
  const [confirm, setConfirm] = useState(""); // confirm new password
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault()

    if(validInput()) {
      // attempt password reset (todo)
      const success = await requestPasswordReset(password, confirm);
      if(success) {
        //console.log("password has been reset!")
        onNext();
      }
    }
  }

  /* 
  Perform input validation and return true if valid, false if invalid
  Password requirements:
  - 8 characters in length
  - Contains at least: 1 uppercase, 1 lowercase, 1 number, 1 symbol
  */
  function validInput() {
    let validationErrors = {};
    // regular expression to check if has at least 1 upper/lower/number/symbol
    const passwordRequirementsRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

    if(!password.trim()) { // password field was left empty
      validationErrors.password = "Password is required"
    } else if(password.length < 8) { // TODO: decide on password requirements, for now must be >= 8 characters, easy to add more
      validationErrors.password = "Password must be at least 8 characters in length"
    } else if(!passwordRequirementsRegex.test(password)){
      validationErrors.password = "Password must include at least one of each: uppercase letter, lowercase letter, number, and symbol"
    }

    if(!confirm.trim()) { // confirm password field was left empty
      validationErrors.confirm = "Confirm password is required"
    } else if(confirm !== password) { // password and confirm password don't match
      validationErrors.confirm = "Passwords must match"
    }

    setErrors(validationErrors)

    // check if there's at least one error (means invalid input)
    return Object.keys(validationErrors).length === 0
  }

  const handlePasswordChange = (e) => {
    // set password var as inputted value and clear error msg
    setPassword(e.target.value)
    delete errors.password
  }

  const handleConfirmPasswordChange = (e) => {
    // set confirm password var as inputted value and clear error msg
    setConfirm(e.target.value)
    delete errors.confirm
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-2">
      <ResetPasswordBreadcrumb />
        
      <div className="flex-grow flex items-center justify-center p-4">      
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Set New Password</h1>
            <p className="text-gray-600">
              Enter a new password to be used for your account.
            </p>
            <p className="text-gray-600">
              <b>Password requirements: </b> 
            </p>
            <div className="mx-auto w-min">
              <ul className="list-disc pl-5 text-nowrap text-left">
                <li>&ge; 8 characters in length </li>
                <li> At least one uppercase letter </li>
                <li> At least one lowercase letter </li>
                <li> At least one number </li>
                <li> At least one symbol</li>
              </ul>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} role="form" noValidate>
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
              {errors.password && <span className="text-red-700" role="alert">{errors.password}</span>}
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
              {errors.confirm && <span className="text-red-700" role="alert">{errors.confirm}</span>}
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
    </div>
  )
}
