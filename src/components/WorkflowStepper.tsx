import { Check } from "lucide-react";
import {
  getStepperDisplayItems,
  backendStepToUiStep,
  isSpecificMethodShortWorkflow,
  canNavigateToUiStep,
} from "@/lib/dynamic-stepper";
import { STRICT_SEQUENTIAL_NAVIGATION_MSG } from "@/lib/step-workflow";

type WorkflowStepperProps = {
  method: string;
  currentBackendStep: number;
  activeUiStep: number;
  onNavigate: (uiStep: number) => void;
  onBlockedNavigate?: (message: string) => void;
  /** ล็อกขั้น 7–10 ขณะอุทธรณ์ค้าง (HOLD) */
  appealStepperLocked?: boolean;
};

export function WorkflowStepper({
  method,
  currentBackendStep,
  activeUiStep,
  onNavigate,
  onBlockedNavigate,
  appealStepperLocked = false,
}: WorkflowStepperProps) {
  const isSpecific = isSpecificMethodShortWorkflow(method);
  const items = getStepperDisplayItems(method);
  const workflowUiStep = backendStepToUiStep(currentBackendStep, method);

  return (
    <div
      className={`grid gap-2 ${
        isSpecific ? "grid-cols-5" : "grid-cols-5 lg:grid-cols-10"
      }`}
    >
      {items.map((item) => {
        const isActive = activeUiStep === item.uiStep;
        const isStepCompleted = item.uiStep < workflowUiStep;
        const isAppealHoldTarget =
          appealStepperLocked && item.backendStep >= 7 && item.backendStep <= 10;
        const canNav = canNavigateToUiStep(item.uiStep, currentBackendStep, method, {
          appealStepperLocked,
        });

        const handleClick = () => {
          if (!canNav) {
            onBlockedNavigate?.(
              isAppealHoldTarget
                ? "⚠️ ระงับชั่วคราวติดอุทธรณ์ — ไม่สามารถข้ามไปขั้นตอนที่ 7–10 ได้จนกว่าคดีจะจบ"
                : STRICT_SEQUENTIAL_NAVIGATION_MSG,
            );
            return;
          }
          onNavigate(item.uiStep);
        };

        return (
          <button
            key={item.uiStep}
            type="button"
            disabled={!canNav}
            onClick={handleClick}
            title={
              !canNav
                ? isAppealHoldTarget
                  ? "⚠️ ระงับชั่วคราวติดอุทธรณ์ (HOLD)"
                  : STRICT_SEQUENTIAL_NAVIGATION_MSG
                : isStepCompleted
                  ? "คลิกเพื่อย้อนกลับดูข้อมูลขั้นตอนนี้"
                  : isActive
                    ? "ขั้นตอนที่กำลังดูอยู่"
                    : "ขั้นตอนปัจจุบัน"
            }
            style={!canNav ? { cursor: "not-allowed" } : undefined}
            className={`relative flex flex-col items-center gap-1.5 rounded-md border-2 p-2 text-center transition ${
              !canNav
                ? isAppealHoldTarget
                  ? "bg-orange-50/80 border-orange-300/60 text-orange-900/70 opacity-80 cursor-not-allowed"
                  : "bg-muted/30 border-transparent text-muted-foreground/40 opacity-50 cursor-not-allowed"
                : isStepCompleted
                  ? "bg-success/15 border-success/30 text-success-foreground hover:bg-success/20 cursor-pointer"
                  : isActive
                    ? "bg-blue-50 border-2 border-blue-600 text-blue-700 font-semibold cursor-pointer"
                    : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted cursor-pointer"
            }`}
          >
            {isStepCompleted && (
              <Check className="absolute top-1 right-1 h-3 w-3 text-success" />
            )}
            {isAppealHoldTarget && (
              <span
                className="absolute top-0.5 right-0.5 text-[8px] font-bold text-orange-700 leading-none"
                aria-hidden
              >
                HOLD
              </span>
            )}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isAppealHoldTarget
                    ? "bg-orange-200 text-orange-900"
                    : isStepCompleted
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {item.uiStep}
            </div>
            <div className="text-[10px] font-medium leading-tight line-clamp-2">
              {item.shortLabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}
