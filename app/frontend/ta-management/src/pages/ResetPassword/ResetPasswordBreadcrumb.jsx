import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SlashIcon } from "lucide-react"

export default function ResetPasswordBreadcrumb() {
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
            <BreadcrumbPage>Forgot Password</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
}