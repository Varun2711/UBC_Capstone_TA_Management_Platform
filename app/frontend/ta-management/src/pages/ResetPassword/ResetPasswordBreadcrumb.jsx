import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { getDashboardLink } from "@/logic/getDashboardLink"
import { SlashIcon } from "lucide-react"

export default function ResetPasswordBreadcrumb({isLoggedIn = false, userType = null}) {
    if(isLoggedIn) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={getDashboardLink(userType)} className="hover:text-gray-900 underline">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator> 
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Change Password</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    }

    return (
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
            <BreadcrumbPage>Reset Password</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
}