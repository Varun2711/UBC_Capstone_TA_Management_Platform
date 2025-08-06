import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { YearSection } from "./YearSection";

export function StudentCard({ student, expandedYears, onToggleYear }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar} alt={student.studentName} />
              <AvatarFallback>
                {student.studentName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{student.studentName}</CardTitle>
              <CardDescription>
                {student.email} • ID: {student.studentId}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {Object.keys(student.yearlyAssignments).length} academic year{Object.keys(student.yearlyAssignments).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(student.yearlyAssignments)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, yearData]) => (
              <YearSection
                key={year}
                year={year}
                yearData={yearData}
                type="student"
                isExpanded={expandedYears.has(`${student.id}-${year}`)}
                onToggle={() => onToggleYear(student.id, year)}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}