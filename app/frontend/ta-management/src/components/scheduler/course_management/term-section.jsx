"use client"

import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OfferingCard } from "./offering-card"
import { SharedSessionsCard } from "./shared-sessions-card"

export function TermSection({
  termKey,
  termOfferings,
  course,
  expandedLabSections,
  onToggleLabSection,
  onEditOffering,
  onDeleteOffering,
  onEditSession,
  onDeleteSession,
}) {
  const hasOfferings = termOfferings.length > 0
  const hasMultipleProfessors = termOfferings.length > 1

  // Format term display name
  const formatTermDisplay = (termCode) => {
    const match = termCode.match(/^([A-Z])(\d{4})\s+(.+)$/)

    if (match) {
      const [, seasonCode, year, termPart] = match
      const seasonMap = {
        W: "Winter",
        S: "Summer",
        F: "Fall",
        Sp: "Spring",
      }
      const seasonName = seasonMap[seasonCode] || seasonCode

      if (termPart.includes("Both")) {
        return `${seasonName} Both Terms, ${year}`
      } else if (termPart.includes("Term")) {
        return `${seasonName} ${termPart}, ${year}`
      } else {
        return `${seasonName} ${termPart}, ${year}`
      }
    }
    return termCode
  }

  // Get shared sessions for this term directly
  const sharedSessions = course.sharedSessions?.[termKey] || { labs: [], tutorials: [], seminars: [], workshops: [] }
  
  const hasSharedSessions = (sharedSessions.labs?.length > 0) || 
                           (sharedSessions.tutorials?.length > 0) || 
                           (sharedSessions.seminars?.length > 0) || 
                           (sharedSessions.workshops?.length > 0)

  const termDisplayName = formatTermDisplay(termKey)

  // Extract year and term for SharedSessionsCard props
  const termMatch = termKey.match(/^([A-Z])(\d{4})\s+(.+)$/)
  let displayTerm = "Unknown"
  let displayYear = "Unknown"
  
  if (termMatch) {
    const [, seasonCode, year, termPart] = termMatch
    const seasonMap = { W: "Winter", S: "Summer", F: "Fall", Sp: "Spring" }
    displayTerm = seasonMap[seasonCode] || seasonCode
    displayYear = year
  }

  return (
    <div className="ml-4 space-y-3">
      {/* Term Header */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-base">{termDisplayName}</span>
        <div className="flex items-center space-x-2">
          {hasMultipleProfessors && (
            <Badge variant="secondary" className="text-xs">
              Multiple Sections
            </Badge>
          )}
          {!hasOfferings && hasSharedSessions && (
            <Badge variant="outline" className="text-xs">
              Shared Sessions Only
            </Badge>
          )}
        </div>
      </div>

      {/* Individual Offerings for this term */}
      {hasOfferings && termOfferings.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          onEdit={onEditOffering}
          onDelete={onDeleteOffering}
        />
      ))}

      {/* Message if no offerings but has shared sessions */}
      {!hasOfferings && hasSharedSessions && (
        <div className="text-sm text-muted-foreground italic pl-4">
          No course offerings for this term, but shared sessions are available.
        </div>
      )}

      {/* Shared Labs and Tutorials for this term */}
      {hasSharedSessions && (
        <SharedSessionsCard
          termKey={termKey}
          term={displayTerm}
          year={displayYear}
          termOfferings={termOfferings}
          sharedSessions={sharedSessions}
          expandedLabSections={expandedLabSections}
          onToggleLabSection={onToggleLabSection}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
        />
      )}
    </div>
  )
}
