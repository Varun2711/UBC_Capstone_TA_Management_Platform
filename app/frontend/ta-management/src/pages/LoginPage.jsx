"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isAlreadyLoggedIn, requestLogin, requestTokenValidation } from "@/logic/auth"

export default function LoginPage() {
  // state handling
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")

  const navigate = useNavigate()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // on page load, check for token and redirect user who is already logged in (cannot login again!)
  useEffect(() => {
    // if already logged in, send them to correct dashboard based on user type
    if(isAlreadyLoggedIn()) {
      const user_type = localStorage.getItem('user_type')
      if(user_type === "student") {
        navigate("/student-dashboard")
      } else if(user_type === "instructor") {
        navigate("/instructordashboard")
      } else if(user_type === "scheduler") {
        navigate("/scheduler-dashboard")
      }
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // on login form submission, attempt to login
    try {
      const response = await requestLogin(email, password)
      localStorage.setItem('accessToken', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      localStorage.setItem('user_type', response.user_type)

      const user_type = response.user_type

      // navigate to particular dashboard depending on user_type
      if(user_type === "student") {
        navigate("/student-dashboard")
      } else if(user_type === "instructor") {
        navigate("/instructordashboard") // broken for now because this page does not exist yet
      } else if(user_type === "scheduler") {
        navigate("/scheduler-dashboard")
      } else {
        // admin
      }

    } catch (error) {
      // if anything goes wrong with login, set the error state (this is used in the return to conditionally display error text)
      setLoginError("Login Failed. You have entered an invalid email address or password. Please try again.")
    } finally {
      
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
          {loginError && (
            <div role="alert" className="text-red-600 text-sm">
              {loginError}
            </div>
          )}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Login</h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setLoginError("") // clear error when user starts typing
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setLoginError("") // clear error when user starts typing
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-gray-600 hover:text-gray-900 underline">
              Forgot password
            </Link>
            <Link to="/create-account/step1" className="text-gray-600 hover:text-gray-900 underline">
              Create an account
            </Link>
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className="w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
