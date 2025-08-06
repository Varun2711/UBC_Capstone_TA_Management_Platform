import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionItem } from "./SectionItem";

export function CourseSection({ courseKey, assignments }) {
  return (
    <Card className="shadow-sm border-l-4 border-l-slate-300 bg-slate-50/30">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-600" />
            <span className="font-medium text-sm text-slate-800">{courseKey}</span>
          </div>
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
            {assignments.length} section{assignments.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <SectionItem key={assignment.id} section={assignment} type="student" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}