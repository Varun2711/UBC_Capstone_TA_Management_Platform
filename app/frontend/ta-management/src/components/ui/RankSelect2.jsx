import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/**
 * Reusable RankSelect component for discipline ranking
 * label - The label to display for this rank
 * rankKey - The key in the ranking object (e.g., 'rank1', 'rank2', 'rank3')
 * options - Array of available options to select from
 * currentRankings - Current state of all rankings
 * onRankChange - Callback function when selection changes
 * placeholder - Placeholder text for the select dropdown
 */
export default function RankSelect({
  label,
  rankKey,
  options = [],
  currentRankings = {},
  onRankChange,
  placeholder = "Select discipline",
}) {
  const currentValue = currentRankings[rankKey] || "";

  const handleValueChange = (value) => {
    if (value === "__CLEAR__") {
      // Clear the selection by calling onRankChange with empty string or undefined
      onRankChange(rankKey, "");
    } else {
      onRankChange(rankKey, value);
    }
  };

  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Only show clear option if there's a current value */}
          {currentValue && (
            <SelectItem value="__CLEAR__">
              <span className="text-muted-foreground">Clear selection</span>
            </SelectItem>
          )}
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              disabled={
                Object.values(currentRankings).includes(option) &&
                currentRankings[rankKey] !== option
              }
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
