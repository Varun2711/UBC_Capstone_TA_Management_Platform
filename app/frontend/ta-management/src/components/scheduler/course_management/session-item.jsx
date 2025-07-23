import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

export function SessionItem({ session, type, termKey, onEdit, onDelete }) {
  const bgColor = type === "labs" ? "bg-blue-50/50" : "bg-green-50/50"
  const dotColor = type === "labs" ? "bg-blue-500" : "bg-green-500"

  const handleEdit = () => {
    try {
      console.log("SessionItem edit clicked, session:", session)
      console.log("Type:", type, "TermKey:", termKey)
      
      // Convert type back to singular form for the handler
      const sessionType = type === "labs" ? "lab" : "tutorial"
      
      // Add the session type and term to the session object for the modal
      const sessionWithMetadata = {
        ...session,
        sessionType: sessionType,
        session_type: sessionType,
        term: termKey
      }
      
      console.log("Calling onEdit with:", sessionWithMetadata, sessionType, termKey)
      onEdit(sessionWithMetadata, sessionType, termKey)
    } catch (error) {
      console.error("Error in SessionItem handleEdit:", error)
    }
  }

  const handleDelete = () => {
    try {
      console.log("SessionItem delete clicked, session:", session)
      console.log("Type:", type, "TermKey:", termKey)
      // Convert type back to singular form for the handler
      const sessionType = type === "labs" ? "lab" : "tutorial"
      onDelete(session, sessionType, termKey)
    } catch (error) {
      console.error("Error in SessionItem handleDelete:", error)
    }
  }

  // Determine TA assignment status and display
  const getTADisplayInfo = () => {
    // Check multiple possible field names for TA assignment
    const taName = session.student_name || session.taAssigned || session.ta_name || session.assignedTA
    
    if (taName) {
      return {
        hasTA: true,
        displayName: taName,
        variant: "default"
      }
    }
    
    return {
      hasTA: false,
      displayName: "No TA",
      variant: "destructive"
    }
  }

  const taInfo = getTADisplayInfo()

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg ${bgColor}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
        <div>
          <div className="font-medium text-sm">{session.section}</div>
          <div className="text-xs text-muted-foreground">
            {session.day} {session.time} • {session.location || 'TBD'}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 text-sm">
        <Badge variant={taInfo.variant}>
          {taInfo.displayName}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Session
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
