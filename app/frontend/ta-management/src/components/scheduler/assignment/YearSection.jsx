import { ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TermSection } from "./TermSection";

export function YearSection({ year, yearData, type, isExpanded, onToggle }) {
  const getYearStats = () => {
    if (type === "student") {
      const totalYearHours = Object.values(yearData).reduce((total, termAssignments) => {
        return total + termAssignments.reduce((termTotal, assignment) => termTotal + assignment.weekHours, 0);
      }, 0);
      return { stat: `${totalYearHours} hrs/week`, label: "hours" };
    } else {
      const totalSections = Object.values(yearData).reduce((total, termSections) => {
        return total + termSections.length;
      }, 0);
      return { stat: `${totalSections} section${totalSections !== 1 ? 's' : ''}`, label: "sections" };
    }
  };

  const getColorScheme = () => {
    return type === "student" 
      ? {
          bg: "bg-blue-50/70",
          border: "border-blue-200/60",
          hover: "hover:bg-blue-100/50",
          chevron: "text-blue-600",
          icon: "text-blue-700",
          text: "text-blue-900",
          badgeOutline: "border-blue-300 text-blue-700",
          badgeSecondary: "bg-blue-100 text-blue-800",
          borderLeft: "border-blue-200/50"
        }
      : {
          bg: "bg-violet-50/70",
          border: "border-violet-200/60",
          hover: "hover:bg-violet-100/50",
          chevron: "text-violet-600",
          icon: "text-violet-700",
          text: "text-violet-900",
          badgeOutline: "border-violet-300 text-violet-700",
          badgeSecondary: "bg-violet-100 text-violet-800",
          borderLeft: "border-violet-200/50"
        };
  };

  const colors = getColorScheme();
  const { stat } = getYearStats();

  const sortedTerms = Object.keys(yearData).sort((a, b) => {
    const parseTermForSorting = (termCode) => {
      const match = termCode.match(/^([A-Z]+)(\d{4})\s+(.+)$/);
      if (!match) return { season: 'Z', year: 9999, termOrder: 999 };
      
      const [, seasonCode, year, termPart] = match;
      
      const seasonOrder = { 'S': 1, 'F': 2, 'W': 3, 'Sp': 4 };
      
      let termOrder = 999;
      if (termPart.includes('Term 1')) termOrder = 1;
      else if (termPart.includes('Term 2')) termOrder = 2;
      else if (termPart.includes('Both Terms')) termOrder = 3;
      
      return {
        seasonOrder: seasonOrder[seasonCode] || 999,
        year: parseInt(year),
        termOrder: termOrder,
      };
    };
    
    const aParsed = parseTermForSorting(a);
    const bParsed = parseTermForSorting(b);
    
    if (aParsed.year !== bParsed.year) return bParsed.year - aParsed.year;
    if (aParsed.seasonOrder !== bParsed.seasonOrder) return aParsed.seasonOrder - bParsed.seasonOrder;
    return aParsed.termOrder - bParsed.termOrder;
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${colors.bg} ${colors.border} ${colors.hover}`}>
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className={`h-4 w-4 ${colors.chevron}`} />
            ) : (
              <ChevronRight className={`h-4 w-4 ${colors.chevron}`} />
            )}
            <GraduationCap className={`h-4 w-4 ${colors.icon}`} />
            <span className={`font-medium ${colors.text}`}>Academic Year {year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${colors.badgeOutline}`}>
              {Object.keys(yearData).length} term{Object.keys(yearData).length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary" className={`text-xs ${colors.badgeSecondary}`}>
              {stat}
            </Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`ml-4 mt-3 space-y-3 border-l-2 pl-4 ${colors.borderLeft}`}>
          {sortedTerms.map((termKey) => (
            <TermSection 
              key={termKey} 
              termKey={termKey} 
              data={yearData[termKey]} 
              type={type}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}