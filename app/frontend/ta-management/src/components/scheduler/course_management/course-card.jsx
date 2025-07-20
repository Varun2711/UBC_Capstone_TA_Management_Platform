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
  onAddLabTutorial, 
  onDeleteOffering, 
  expandedOfferings,
  expandedLabSections,
  onToggleOffering,
  onToggleLabSection,
  visibleOfferingsCount,
  selectedYear,
  onEditSharedSession,
  onDeleteSharedSession,
}) {
  // Simple approach: collect all unique terms from both offerings and shared sessions
  const getAllTerms = (course) => {
    const allTerms = new Set()
    
    // Add terms from offerings
    course.offerings?.forEach(offering => {
      if (offering.term) {
        allTerms.add(offering.term)
      }
    })
    
    // Add terms from shared sessions
    if (course.sharedSessions) {
      Object.keys(course.sharedSessions).forEach(termKey => {
        allTerms.add(termKey)
      })
    }
    
    return Array.from(allTerms)
  }

  // Group offerings by term
  const groupOfferingsByTerm = (offerings) => {
    const grouped = {}
    offerings?.forEach(offering => {
      const termKey = offering.term
      if (!grouped[termKey]) {
        grouped[termKey] = []
      }
      grouped[termKey].push({
        ...offering,
        displaySection: offering.displaySection || `${course.code}-${offering.section}`
      })
    })
    return grouped
  }

  // Apply year filter if needed
  const getFilteredOfferings = () => {
    if (selectedYear === "all") {
      return course.offerings || []
    }
    return (course.offerings || []).filter(offering => String(offering.year) === String(selectedYear))
  }

  // Function to sort terms chronologically
  const sortTermsChronologically = (terms) => {
    return terms.sort((a, b) => {
      // Parse term codes like "W2025 Term 1", "W2025 Term 2", "W2025 Both Terms"
      const parseTermForSorting = (termCode) => {
        const match = termCode.match(/^([A-Z]+)(\d{4})\s+(.+)$/)
        if (!match) return { season: 'Z', year: 9999, termOrder: 999 } // Put unparseable terms at end
        
        const [, seasonCode, year, termPart] = match
        
        // Map seasons to sort order (chronological through academic year)
        const seasonOrder = {
          'S': 1,   // Summer (starts academic year)
          'F': 2,   // Fall 
          'W': 3,   // Winter (ends academic year)
          'Sp': 4   // Spring (if used)
        }
        
        // Map term parts to sort order
        let termOrder = 999
        if (termPart.includes('Term 1')) {
          termOrder = 1
        } else if (termPart.includes('Term 2')) {
          termOrder = 2
        } else if (termPart.includes('Both Terms')) {
          termOrder = 3 // Both terms come after individual terms
        }
        
        return {
          season: seasonCode,
          seasonOrder: seasonOrder[seasonCode] || 999,
          year: parseInt(year),
          termOrder: termOrder,
          originalTerm: termCode
        }
      }
      
      const aParsed = parseTermForSorting(a)
      const bParsed = parseTermForSorting(b)
      
      // First sort by year (descending - newest first)
      if (aParsed.year !== bParsed.year) {
        return bParsed.year - aParsed.year
      }
      
      // Then by season (chronological order within year)
      if (aParsed.seasonOrder !== bParsed.seasonOrder) {
        return aParsed.seasonOrder - bParsed.seasonOrder
      }
      
      // Finally by term order (Term 1, Term 2, Both Terms)
      return aParsed.termOrder - bParsed.termOrder
    })
  }

  const filteredOfferings = getFilteredOfferings()
  const groupedOfferings = groupOfferingsByTerm(filteredOfferings)
  const allTerms = getAllTerms(course)

  // Filter terms by year if needed, then sort chronologically
  let filteredTerms = selectedYear === "all" ? allTerms : allTerms.filter(termKey => {
    const termMatch = termKey.match(/^([A-Z])(\d{4})\s+(.+)$/)
    return termMatch && termMatch[2] === String(selectedYear)
  })

  // Sort the filtered terms chronologically
  filteredTerms = sortTermsChronologically(filteredTerms)

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

              {/* Terms */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Course Terms</h4>
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((termKey) => (
                    <TermSection
                      key={termKey}
                      termKey={termKey}
                      termOfferings={groupedOfferings[termKey] || []}
                      course={course}
                      expandedOfferings={expandedOfferings}
                      expandedLabSections={expandedLabSections}
                      onToggleOffering={onToggleOffering}
                      onToggleLabSection={onToggleLabSection}
                      onEditOffering={onEditOffering}
                      onDeleteOffering={onDeleteOffering}
                      onEditSession={onEditSharedSession}
                      onDeleteSession={onDeleteSharedSession}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No terms match the current filters.</p>
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
