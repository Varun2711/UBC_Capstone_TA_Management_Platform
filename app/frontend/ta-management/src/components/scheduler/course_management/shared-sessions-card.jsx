import { ChevronDown, ChevronRight } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SessionList } from "./session-list"

export function SharedSessionsCard({
  termKey,
  term,
  year,
  termOfferings,
  sharedSessions,
  expandedLabSections,
  onToggleLabSection,
  onEditSession,
  onDeleteSession,
}) {
  const isExpanded = expandedLabSections.has(`shared-${termKey}`)

  return (
    <Card className="ml-2 border-dashed">
      <Collapsible open={isExpanded} onOpenChange={() => onToggleLabSection(`shared-${termKey}`)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-sm">
                Shared Sessions
              </span>
              <Badge variant="secondary" className="text-xs">
                {sharedSessions.labs.length + sharedSessions.tutorials.length} sessions
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Shared Labs */}
              {sharedSessions.labs.length > 0 && (
                <SessionList
                  type="labs"
                  termKey={termKey}
                  sessions={sharedSessions.labs}
                  expandedLabSections={expandedLabSections}
                  onToggleLabSection={onToggleLabSection}
                  onEditSession={onEditSession}
                  onDeleteSession={onDeleteSession}
                />
              )}

              {/* Shared Tutorials */}
              {sharedSessions.tutorials.length > 0 && (
                <SessionList
                  type="tutorials"
                  termKey={termKey}
                  sessions={sharedSessions.tutorials}
                  expandedLabSections={expandedLabSections}
                  onToggleLabSection={onToggleLabSection}
                  onEditSession={onEditSession}
                  onDeleteSession={onDeleteSession}
                />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
