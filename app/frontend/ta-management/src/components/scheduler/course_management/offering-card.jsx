import { ChevronDown, ChevronRight, MoreHorizontal, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function OfferingCard({ offering, isExpanded, onToggle }) {
  return (
    <Card className="ml-2">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3" data-testid="collapsible-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{offering.section}</span>
                    <Badge variant="secondary">{offering.instructor}</Badge>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit Offering</DropdownMenuItem>
                  <DropdownMenuItem>Add Lab/Tutorial</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete Offering</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* TA Requirements */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h5 className="font-medium text-sm mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                TA Requirements - {offering.section}
              </h5>
              {offering.requirements.specialRequirements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {offering.requirements.specialRequirements.map((req, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
