import { Check } from "lucide-react";
import {
  backendStepToUiStep,
  getStepperDisplayItems,
  getWorkflowDisplayStepCount,
  isSpecificMethodShortWorkflow,
  workflowProgressPercent,
} from "@/lib/dynamic-stepper";
import { getMilestoneStatus } from "@/lib/egp-milestones";
import { resolveWorkflowProcurementMethod } from "@/lib/project-workflow-core";
import { cn } from "@/lib/utils";

type MilestoneTimelineProps = {
  currentStep: number;
  method?: string | null;
  className?: string;
};

/** Timeline ขั้นตอนโครงการ — 5 ขั้นสำหรับวิธีเฉพาะเจาะจง / 10 ขั้นสำหรับ e-bidding */
export function MilestoneTimeline({
  currentStep,
  method,
  className,
}: MilestoneTimelineProps) {
  const resolvedMethod = resolveWorkflowProcurementMethod({ projectMethod: method });
  const items = getStepperDisplayItems(resolvedMethod);
  const total = getWorkflowDisplayStepCount(resolvedMethod);
  const cur = isSpecificMethodShortWorkflow(resolvedMethod)
    ? backendStepToUiStep(currentStep, resolvedMethod)
    : Math.min(total, Math.max(1, currentStep));
  const pct = workflowProgressPercent(currentStep, resolvedMethod);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          ขั้นตอนที่ {cur}/{total}
          {isSpecificMethodShortWorkflow(resolvedMethod) && (
            <span className="ml-1 text-emerald-700">(เฉพาะเจาะจง)</span>
          )}
        </span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className={cn(
          "grid gap-2",
          isSpecificMethodShortWorkflow(resolvedMethod)
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
        )}
      >
        {items.map((item) => {
          const status = getMilestoneStatus(item.uiStep, cur);

          return (
            <div
              key={item.uiStep}
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
                {status === "done" ? <Check className="h-3 w-3" /> : item.uiStep}
              </div>
              <span className="leading-snug">{item.shortLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
