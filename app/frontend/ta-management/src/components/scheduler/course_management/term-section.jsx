
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { OfferingCard } from "./offering-card"
import { SharedSessionsCard } from "./shared-sessions-card"

export function TermSection({
  termKey,
  termOfferings,
  course,
  expandedOfferings,
  expandedLabSections,
  onToggleOffering,
  onToggleLabSection,
}) {
  const [term, year] = termKey.split("-")
  const hasMultipleProfessors = termOfferings.length > 1

  const getSharedSessionsForTerm = (course, year, term) => {
    const termKey = `${term}-${year}`
    return course.sharedSessions[termKey] || { labs: [], tutorials: [] }
  }

  const sharedSessions = getSharedSessionsForTerm(course, year, term)

  return (
    <div className="ml-4 space-y-3">
      {/* Term Header */}
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-base">
          {term} {year}
        </span>
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
          isExpanded={expandedOfferings.has(offering.id)}
          onToggle={() => onToggleOffering(offering.id)}
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
