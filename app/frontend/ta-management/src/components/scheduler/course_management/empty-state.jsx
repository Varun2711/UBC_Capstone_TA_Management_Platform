

import { BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function EmptyState({ onAddCourse }) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No courses found</h3>
        <p className="text-muted-foreground mb-4">Try adjusting your search criteria or add a new course.</p>
        <Button onClick={onAddCourse}>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </CardContent>
    </Card>
  )
}
