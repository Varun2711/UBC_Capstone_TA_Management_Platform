import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SessionItem } from "./session-item"

export function SessionList({ type, termKey, sessions, expandedLabSections, onToggleLabSection }) {
  const sectionKey = `${type}-${termKey}`
  const isExpanded = expandedLabSections.has(sectionKey)
  const title = type === "labs" ? "Laboratory Sessions" : "Tutorial Sessions"
  const count = sessions.length
  const countLabel = type === "labs" ? "labs" : "tutorials"

  return (
    <Collapsible open={isExpanded} onOpenChange={() => onToggleLabSection(sectionKey)}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/25 p-2 rounded transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <h5 className="font-medium text-sm">{title}</h5>
          <Badge variant="outline" className="text-xs">
            {count} {countLabel}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 ml-6">
          {sessions.map((session) => (
            <SessionItem key={session.id} session={session} type={type} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
