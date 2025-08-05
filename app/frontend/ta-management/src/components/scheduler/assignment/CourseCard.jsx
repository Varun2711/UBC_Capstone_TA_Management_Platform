import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { YearSection } from "./YearSection";

export function CourseCard({ course, expandedYears, onToggleYear }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {course.code} - {course.name}
            </CardTitle>
            <CardDescription>
              Instructor: {course.instructor} • {course.department}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="outline">{course.department}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(course.yearlyOfferings)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, yearData]) => (
              <YearSection
                key={year}
                year={year}
                yearData={yearData}
                type="course"
                isExpanded={expandedYears.has(`${course.id}-${year}`)}
                onToggle={() => onToggleYear(course.id, year)}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}