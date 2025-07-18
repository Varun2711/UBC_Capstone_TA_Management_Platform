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
}) {
  const [term, year] = termKey.split("-")
  const hasMultipleProfessors = termOfferings.length > 1

  // Function to format term display name
  const formatTermDisplay = (termCode) => {
    // Parse term codes like "W2024 Term 2" or "W2025 Term 1"
    const match = termCode.match(/^([A-Z])(\d{4})\s+(.+)$/)

    if (match) {
      const [, seasonCode, year, termPart] = match

      // Map season codes to full names
      const seasonMap = {
        W: "Winter",
        S: "Summer",
        F: "Fall",
        Sp: "Spring",
      }

      const seasonName = seasonMap[seasonCode] || seasonCode

      // Handle different term formats
      if (termPart.includes("Both")) {
        return `${seasonName} Both Terms, ${year}`
      } else if (termPart.includes("Term")) {
        return `${seasonName} ${termPart}, ${year}`
      } else {
        return `${seasonName} ${termPart}, ${year}`
      }
    }

    // Fallback for unexpected formats
    return termCode
  }

  const getSharedSessionsForTerm = (course, year, term) => {
    const termKey = `${term}-${year}`
    return course.sharedSessions[termKey] || { labs: [], tutorials: [] }
  }

  const sharedSessions = getSharedSessionsForTerm(course, year, term)

  // Get the first offering's term code to format the display
  const termDisplayName =
    termOfferings.length > 0
      ? formatTermDisplay(termOfferings[0].term)
      : `${term} ${year}`

  return (
    <div className="ml-4 space-y-3">
      {/* Term Header */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-base">{termDisplayName}</span>
        {hasMultipleProfessors && (
          <Badge variant="secondary" className="text-xs">
            Multiple Sections
          </Badge>
        )}
      </div>

      {/* Individual Offerings for this term */}
      {termOfferings.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          onEdit={onEditOffering}
        />
      ))}

      {/* Shared Labs and Tutorials for this term */}
      {(sharedSessions.labs.length > 0 || sharedSessions.tutorials.length > 0) && (
        <SharedSessionsCard
          termKey={termKey}
          term={term}
          year={year}
          termOfferings={termOfferings}
          sharedSessions={sharedSessions}
          expandedLabSections={expandedLabSections}
          onToggleLabSection={onToggleLabSection}
        />
      )}
    </div>
  )
}
