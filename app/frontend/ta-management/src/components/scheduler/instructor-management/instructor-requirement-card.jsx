"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Mail, Calendar, MoreHorizontal, Edit, Trash2, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function InstructorRequirementsCard({
  instructor,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  visibleOfferingsCount,
  filteredOfferings,
}) {
  const [expandedOfferings, setExpandedOfferings] = useState(new Set())

  const toggleOffering = (offeringId) => {
    setExpandedOfferings((prev) => {
      const next = new Set(prev)
      if (next.has(offeringId)) {
        next.delete(offeringId)
      } else {
        next.add(offeringId)
      }
      return next
    })
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={instructor.instructorName} />
                  <AvatarFallback>{getInitials(instructor.instructorName)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{instructor.instructorName}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{instructor.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Employee #{instructor.employeeNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline">{instructor.departmentName}</Badge>
                <Badge variant="secondary">
                  {visibleOfferingsCount} {visibleOfferingsCount === 1 ? "Course" : "Courses"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(instructor)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Instructor
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(instructor.instructorId)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Instructor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Course Requirements</h4>

              {filteredOfferings.length > 0 ? (
                filteredOfferings.map((offering) => (
                  <Card key={offering.offeringId} className="ml-2">
                    <Collapsible
                      open={expandedOfferings.has(offering.offeringId)}
                      onOpenChange={() => toggleOffering(offering.offeringId)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {expandedOfferings.has(offering.offeringId) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {offering.courseCode} - {offering.section}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {offering.term} {offering.year}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{offering.courseTitle}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted: {formatDate(offering.requirements.submittedAt)}</span>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <Separator />
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Requirements</h5>
                              <ul className="space-y-1">
                                {offering.requirements.generalRequirements.map((req, idx) => (
                                  <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground ml-2">
                  <p className="text-sm">No course offerings match the current filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}