"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/logic/auth"

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

  // This was missing - define the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    try {
      const response = await login(email, password)
      localStorage.setItem('accessToken', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      
      // CRITICAL: Make a profile service request to establish the connection
      try {
        await axios.get(`${API_URL}/api/profile/me/`, {
          headers: {
            Authorization: `Bearer ${response.access}`
          }
        })
        console.log("Profile association successful")
      } catch (profileError) {
        console.warn("Profile connection error:", profileError)
        
        // Only try to create profile if it's a 404
        if (profileError.response && profileError.response.status === 404) {
          try {
            await axios.patch(
              `${API_URL}/api/profile/me/update/`,
              { first_name: "", last_name: "" },
              {
                headers: {
                  Authorization: `Bearer ${response.access}`
                }
              }
            )
            console.log("Profile created successfully")
          } catch (createError) {
            console.warn("Profile creation failed:", createError)
          }
        }
      }

      // todo navigate to particular dashboard depending on user_type
      navigate("/student-dashboard")
    } catch (error) {
      // if anything goes wrong with login, set the error state
      setLoginError("Login Failed. You have entered an invalid email address or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to handle API errors
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    
    if (error.response) {
      if (error.response.status === 400 && error.response.data) {
        const backendErrors = error.response.data;
        const formattedErrors = {};
        
        for (const field in backendErrors) {
          if (Array.isArray(backendErrors[field])) {
            formattedErrors[field] = backendErrors[field][0];
          } else if (typeof backendErrors[field] === 'object') {
            for (const nestedField in backendErrors[field]) {
              formattedErrors[nestedField] = backendErrors[field][nestedField][0];
            }
          } else {
            formattedErrors[field] = backendErrors[field];
          }
        }
        
        return formattedErrors;
      } else if (error.response.status === 404) {
        return { api: "Resource not found" };
      } else {
        return { api: defaultMessage };
      }
    } else if (error.request) {
      return { api: "No response received from server. Please check your connection." };
    } else {
      return { api: defaultMessage };
    }
  };

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
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
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