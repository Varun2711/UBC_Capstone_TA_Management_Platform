"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, ArrowLeft } from "lucide-react"

export function NavigationHeader({ role = "student" }) {
  return (
    <div className="bg-blue-50 border-b px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <span className="font-medium">TA Scheduler System</span>
          <Badge variant={role === "student" ? "default" : "secondary"}>
            {role === "student" ? "Student View" : "Coordinator View"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/roles">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Switch Role
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
