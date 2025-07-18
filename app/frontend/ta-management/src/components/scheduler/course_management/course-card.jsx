"use client"
import { BookOpen, ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TermSection } from "./term-section"

export function CourseCard({
  course,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddOffering,
  onEditOffering,
  onAddLabTutorial, // Add this prop
  expandedOfferings,
  expandedLabSections,
  onToggleOffering,
  onToggleLabSection,
  visibleOfferingsCount,
}) {
  const groupOfferingsByTerm = (offerings) => {
    const grouped = {}
    offerings.forEach((offering) => {
      const termKey = `${offering.term}-${offering.year}`
      if (!grouped[termKey]) {
        grouped[termKey] = []
      }
      grouped[termKey].push({
        ...offering,
        // Only addition: ensure displaySection is available for backend integration
        displaySection: offering.displaySection || `${course.code}-${offering.section}`
      })
    })
    return grouped
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
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">
                      {course.code} - {course.title}
                    </CardTitle>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {visibleOfferingsCount} {visibleOfferingsCount === 1 ? "Offering" : "Offerings"}
                </Badge>
                <Badge variant="outline">{course.department}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(course)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddOffering(course)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Offering
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddLabTutorial(course)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lab/Tutorial
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(course.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Course
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
              <p className="text-sm text-muted-foreground">{course.description}</p>

              {/* Course Offerings grouped by term */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Course Offerings</h4>
                {course.offerings && course.offerings.length > 0 ? (
                  Object.entries(groupOfferingsByTerm(course.offerings)).map(([termKey, termOfferings]) => (
                    <TermSection
                      key={termKey}
                      termKey={termKey}
                      termOfferings={termOfferings}
                      course={course}
                      expandedOfferings={expandedOfferings}
                      expandedLabSections={expandedLabSections}
                      onToggleOffering={onToggleOffering}
                      onToggleLabSection={onToggleLabSection}
                      onEditOffering={onEditOffering}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No offerings available for this course.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-transparent"
                      onClick={() => onAddOffering(course)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Offering
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
