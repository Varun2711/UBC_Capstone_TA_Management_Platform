"use client"

import { Link } from "react-router-dom"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SlashIcon } from "lucide-react"

export default function SuccessStep() {
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
