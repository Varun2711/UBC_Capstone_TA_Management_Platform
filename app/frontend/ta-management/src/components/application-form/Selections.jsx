import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import RankSelect from "@/components/ui/RankSelect";
import ErrorMessage from "@/components/ErrorMessage";

const disciplines = ["ASTR", "COSC", "DATA", "MATH", "PHYS", "STAT"];
const currentApplicationYear = 2025;

/* A helper function used to validate ranked selections for Discplines
 * Ensuring that values can't be repeated
 * Ensuring that the user selects a disicpline for each rank
 */
export const validateSelections = (rankObj) => {
  const { rank1, rank2, rank3 } = rankObj;

  if (!rank1 || !rank2 || !rank3) {
    return "Please choose a discipline for all three ranks.";
  }

  const set = new Set([rank1, rank2, rank3]);
  if (set.size !== 3) {
    return "Each rank must be a different discipline.";
  }
  return null;
};

// Simple error message component
// const ErrorMessage = ({ error }) => {
//   if (!error) return null;
//   return <p className="text-red-600 text-sm mt-1">{error}</p>;
// };

export default function Selections({ selections, setSelections, errors = {} }) {
  const [error, setError] = useState("");

  /*This UseEffect hook checks for errors whenever selections.diciplineRanking is changed */
  useEffect(() => {
    const msg = validateSelections(selections.disciplineRanking);
    setError(msg || "");
  }, [selections.disciplineRanking]);

  const updateRank = (key, value) =>
    setSelections({
      ...selections,
      disciplineRanking: { ...selections.disciplineRanking, [key]: value },
    });

  return (
    <div className="space-y-8 col-span-full">
      {/* Position Type */}
      <div>
        <Label className="block mb-2 text-lg font-semibold">
          Which position are you applying for?
        </Label>

        <RadioGroup
          value={selections.positionType}
          onValueChange={(val) =>
            setSelections({ ...selections, positionType: val })
          }
        >
          {[
            "Undergraduate Teaching Assistant",
            "Graduate Teaching Assistant 2 (Master's Student)",
            "Graduate Teaching Assistant 1 (Ph.D student)",
          ].map((option) => (
            <Label key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} />
              {option}
            </Label>
          ))}
        </RadioGroup>

        <ErrorMessage error={errors.positionType} />
      </div>

      {/* Term Selection */}
      <div>
        <Label className="block mb-2 text-lg font-semibold">
          For W{currentApplicationYear} applications, which of the following
          terms are you applying to TA for?
        </Label>
        <RadioGroup
          value={selections.winterTerm}
          onValueChange={(val) =>
            setSelections({ ...selections, winterTerm: val })
          }
        >
          {[
            `W${currentApplicationYear} both terms`,
            `W${currentApplicationYear} Term 1 only (September 01 - December 31 ${currentApplicationYear})`,
            `W${currentApplicationYear} Term 2 only (January 1 - April 30) ${
              currentApplicationYear + 1
            }`,
          ].map((option) => (
            <Label key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} />
              {option}
            </Label>
          ))}
        </RadioGroup>

        <ErrorMessage error={errors.winterTerm} />
      </div>

      {/* Workload Preference */}
      <div>
        <Label className="block mb-2 text-lg font-semibold">
          Please indicate your preferred maximum average hourly workload:
        </Label>
        <RadioGroup
          value={selections.workload}
          onValueChange={(val) =>
            setSelections({ ...selections, workload: val })
          }
        >
          {["6 hours", "12 hours"].map((option) => (
            <Label key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} />
              {option}
            </Label>
          ))}
        </RadioGroup>

        <ErrorMessage error={errors.workload} />
      </div>

      {/* Discipline/Domain Ranking */}
      <div>
        <Label className="block mb-2 text-lg font-semibold">
          Rank your top 3 preferred disciplines:
        </Label>

        <RankSelect
          label="1st Choice"
          rankKey="rank1"
          options={disciplines}
          currentRankings={selections.disciplineRanking || {}}
          onRankChange={updateRank}
        />

        <RankSelect
          label="2nd Choice"
          rankKey="rank2"
          options={disciplines}
          currentRankings={selections.disciplineRanking || {}}
          onRankChange={updateRank}
        />

        <RankSelect
          label="3rd Choice"
          rankKey="rank3"
          options={disciplines}
          currentRankings={selections.disciplineRanking || {}}
          onRankChange={updateRank}
        />

        <ErrorMessage error={errors.disciplineRanking} />
      </div>
    </div>
  );
}
