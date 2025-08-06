import { FlaskConical, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SectionItem({ section, type }) {
  const getSectionIcon = (sectionType) => {
    if (sectionType === "Lab" || sectionType === "Tutorial") {
      return <FlaskConical className="h-3 w-3 text-orange-600" />;
    }
    return <BookOpen className="h-3 w-3 text-indigo-600" />;
  };

  const getSectionColor = (sectionType) => {
    if (sectionType === "Lab" || sectionType === "Tutorial") {
      return "border-l-orange-300 bg-orange-50/40";
    }
    return "border-l-indigo-300 bg-indigo-50/40";
  };

  const getSectionType = () => {
    return section.sectionType || section.type;
  };

  const getHours = () => {
    return section.weekHours || section.hours;
  };

  // Helper function to format section display name
  const formatSectionName = () => {
    const sectionType = getSectionType();
    const sectionNumber = section.section;

    // For lectures that include day information, show it clearly
    if (sectionType === "Lecture" && sectionNumber.includes(" - ")) {
      const [baseSection, day] = sectionNumber.split(" - ");
      return `${sectionType} ${baseSection} (${day})`;
    }

    return `${sectionType} ${sectionNumber}`;
  };

  if (type === "student") {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-lg border-l-4 ${getSectionColor(
          getSectionType()
        )} hover:shadow-sm transition-shadow`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getSectionIcon(getSectionType())}
            <h4 className="font-medium text-sm">{formatSectionName()}</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {section.timeSlots.map((slot, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-white/60">
                <Clock className="h-2 w-2 mr-1" />
                {slot.day} {slot.startTime}-{slot.endTime}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-sm font-medium text-slate-700">
            {getHours()} hrs/week
          </p>
        </div>
      </div>
    );
  }

  // Course view
  return (
    <div
      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
        section.assignedTA
          ? "bg-green-50/60 border-green-200/60 hover:bg-green-50/80"
          : "bg-red-50/60 border-red-200/60 hover:bg-red-50/80"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {getSectionIcon(getSectionType())}
          <h4 className="font-medium text-sm">
            {formatSectionName()}
          </h4>
          <Badge
            variant={section.assignedTA ? "default" : "destructive"}
            className="text-xs"
          >
            {section.assignedTA ? "Assigned" : "Unassigned"}
          </Badge>
        </div>
        {section.assignedTA && (
          <p className="text-sm text-muted-foreground mb-2">
            TA: {section.assignedTA} (ID: {section.studentId})
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {section.timeSlots.map((slot, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-white/60">
              <Clock className="h-2 w-2 mr-1" />
              {slot.day} {slot.startTime}-{slot.endTime}
            </Badge>
          ))}
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-medium">{getHours()} hrs/week</p>
      </div>
    </div>
  );
}