  "use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isAlreadyLoggedIn, navigateToUserDashboard, requestLogin } from "@/logic/auth"

  export default function LoginPage() {
    // state handling
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loginError, setLoginError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // on page load, check for token and redirect user who is already logged in (cannot login again!)
  useEffect(() => {
    // if already logged in, send them to correct dashboard based on user type
    if(isAlreadyLoggedIn()) {
      const user_type = sessionStorage.getItem('user_type')
      navigateToUserDashboard(user_type, navigate)
    }
  }, [navigate])

    // This was missing - define the handleSubmit function
    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsLoading(true)
      setLoginError("")

    // on login form submission, attempt to login
    try {
      const response = await requestLogin(email, password)
      sessionStorage.setItem('accessToken', response.access)
      sessionStorage.setItem('refreshToken', response.refresh)
      sessionStorage.setItem('user_type', response.user_type)

      const user_type = response.user_type

      // navigate to particular dashboard depending on user_type
      navigateToUserDashboard(user_type, navigate)

    } catch (error) {
      // if anything goes wrong with login, set the error state (this is used in the return to conditionally display error text)
      setLoginError("Login Failed. You have entered an invalid email address or password. Please try again.")
    } finally {
      
    }
  }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Login</h1>
            <p className="mt-2 text-gray-600">Welcome back! Please sign in to your account.</p>
          </div>

          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{loginError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/create-account/step1" className="font-medium text-blue-600 hover:text-blue-500">
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    )
  }