"use client"

import { MoreHorizontal, Edit, Trash2, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function OfferingCard({ offering, onEdit, onDelete }) {
  // Format time slots for display - handle the API format
  const formatTimeSlots = (offering) => {
    // Your API returns time_slots with {day, time} format
    let timeSlots = offering.time_slots || []
    
    console.log("OfferingCard formatting time slots:", timeSlots)
    
    if (!timeSlots || timeSlots.length === 0) {
      return "No schedule set"
    }

    return timeSlots.map(slot => {
      const day = slot.day?.charAt(0).toUpperCase() + slot.day?.slice(1) || "Unknown"
      // The time is already formatted as "02:22 PM - 04:22 PM"
      const timeStr = slot.time || "Time TBD"
      
      return `${day} ${timeStr}`
    }).join(', ')
  }

  const handleEdit = () => {
    try {
      console.log("OfferingCard edit clicked, offering:", offering)
      onEdit(offering)
    } catch (error) {
      console.error("Error in OfferingCard handleEdit:", error)
    }
  }

  const handleDelete = () => {
    try {
      console.log("OfferingCard delete clicked, offering:", offering)
      onDelete(offering)
    } catch (error) {
      console.error("Error in OfferingCard handleDelete:", error)
    }
  }

  // Check if any time slot data exists
  const hasTimeSlots = offering.time_slots?.length > 0

  return (
    <Card className="ml-2">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">Section {offering.section}</span>
                <Badge variant="secondary">{offering.instructorName || 'Unassigned'}</Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimeSlots(offering)}</span>
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
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Offering
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Offering
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  )
}

export function TermSection({
  termKey,
  termOfferings,
  course,
  expandedLabSections,
  onToggleLabSection,
  onEditOffering,
  onDeleteOffering,
}) {
  return (
    <div className="ml-4 space-y-3">
      {/* ... existing code ... */}

      {/* Individual Offerings for this term */}
      {termOfferings.map((offering) => (
        <OfferingCard
          key={offering.id}
          offering={offering}
          onEdit={onEditOffering}
          onDelete={onDeleteOffering}
        />
      ))}

      {/* ... rest of existing code ... */}
    </div>
  )
}