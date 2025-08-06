import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CourseSection } from "./CourseSection";
import { SectionItem } from "./SectionItem";

export function TermSection({ termKey, data, type }) {
  const formatTermDisplay = (termCode) => {
    const match = termCode.match(/^([A-Z])(\d{4})\s+(.+)$/);
    if (match) {
      const [, seasonCode, year, termPart] = match;
      const seasonMap = { W: "Winter", S: "Summer", F: "Fall", Sp: "Spring" };
      const seasonName = seasonMap[seasonCode] || seasonCode;
      
      if (termPart.includes("Both")) return `${seasonName} Both Terms`;
      else if (termPart.includes("Term")) return `${seasonName} ${termPart}`;
      else return `${seasonName} ${termPart}`;
    }
    return termCode;
  };

  const getTermStats = () => {
    if (type === "student") {
      const totalTermHours = data.reduce((total, assignment) => total + assignment.weekHours, 0);
      return `${totalTermHours} hrs/week`;
    } else {
      return `${data.length} section${data.length !== 1 ? 's' : ''}`;
    }
  };

  const getColorScheme = () => {
    return type === "student" 
      ? {
          bg: "bg-emerald-50/60",
          border: "border-emerald-200/50",
          icon: "text-emerald-600",
          text: "text-emerald-900",
          badge: "border-emerald-300 text-emerald-700",
          borderLeft: "border-emerald-200/40"
        }
      : {
          bg: "bg-teal-50/60",
          border: "border-teal-200/50",
          icon: "text-teal-600",
          text: "text-teal-900",
          badge: "border-teal-300 text-teal-700",
          borderLeft: "border-teal-200/40"
        };
  };

  const colors = getColorScheme();

  if (type === "student") {
    // Group assignments by course for students
    const groupedByCourse = data.reduce((groups, assignment) => {
      const courseKey = `${assignment.courseCode} - ${assignment.courseName}`;
      if (!groups[courseKey]) {
        groups[courseKey] = [];
      }
      groups[courseKey].push(assignment);
      return groups;
    }, {});

    return (
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 border-b rounded ${colors.bg} ${colors.border}`}>
          <div className="flex items-center gap-2">
            <CalendarIcon className={`h-4 w-4 ${colors.icon}`} />
            <span className={`font-medium text-sm ${colors.text}`}>
              {formatTermDisplay(termKey)}
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${colors.badge}`}>
            {getTermStats()}
          </Badge>
        </div>

        <div className={`space-y-3 ml-2 border-l-2 pl-3 ${colors.borderLeft}`}>
          {Object.entries(groupedByCourse).map(([courseKey, courseAssignments]) => (
            <CourseSection 
              key={courseKey} 
              courseKey={courseKey} 
              assignments={courseAssignments} 
            />
          ))}
        </div>
      </div>
    );
  } else {
    // Direct sections for courses
    return (
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 border-b rounded ${colors.bg} ${colors.border}`}>
          <div className="flex items-center gap-2">
            <CalendarIcon className={`h-4 w-4 ${colors.icon}`} />
            <span className={`font-medium text-sm ${colors.text}`}>
              {formatTermDisplay(termKey)}
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${colors.badge}`}>
            {getTermStats()}
          </Badge>
        </div>

        <div className={`space-y-2 ml-2 border-l-2 pl-3 ${colors.borderLeft}`}>
          {data.map((section) => (
            <SectionItem key={section.id} section={section} type="course" />
          ))}
        </div>
      </div>
    );
  }
}