import { Check } from "lucide-react";
import {
  EGP_MILESTONES,
  EGP_TOTAL_STEPS,
  clampStep,
  getMilestoneStatus,
  milestoneProgressPercent,
} from "@/lib/egp-milestones";
import { cn } from "@/lib/utils";

type MilestoneTimelineProps = {
  currentStep: number;
  className?: string;
};

/** Timeline 10 ขั้น e-GP — แบบกล่อง ไฮไลต์ขั้นปัจจุบัน */
export function MilestoneTimeline({ currentStep, className }: MilestoneTimelineProps) {
  const cur = clampStep(currentStep);
  const pct = milestoneProgressPercent(cur);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          ขั้นตอนที่ {cur}/{EGP_TOTAL_STEPS}
        </span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {EGP_MILESTONES.map((name, i) => {
          const stepNum = i + 1;
          const status = getMilestoneStatus(stepNum, cur);

          return (
            <div
              key={stepNum}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs min-h-[2.75rem]",
                status === "done" && "border-primary/30 bg-primary/5",
                status === "current" && "border-primary bg-primary/10 font-medium shadow-sm",
                status === "upcoming" && "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 shrink-0 rounded flex items-center justify-center text-[10px] font-semibold",
                  status === "done" && "bg-primary text-primary-foreground",
                  status === "current" && "bg-primary text-primary-foreground",
                  status === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {status === "done" ? <Check className="h-3 w-3" /> : stepNum}
              </div>
              <span className="leading-snug">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
