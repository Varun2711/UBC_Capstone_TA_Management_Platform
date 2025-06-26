import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ step, totalSteps, stepLabel = "" }) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        {stepLabel && (
          <span className="text-base text-muted-foreground italic">
            {stepLabel}
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          Step {step} of {totalSteps}
        </span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
