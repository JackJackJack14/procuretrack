import { Check } from "lucide-react";
import {
  getStepperDisplayItems,
  backendStepToUiStep,
  isSpecificMethodShortWorkflow,
  canNavigateToUiStep,
} from "@/lib/dynamic-stepper";
import { isAppealWorkflowLocked, type Step6AppealState } from "@/lib/step-form";

type WorkflowStepperProps = {
  method: string;
  currentBackendStep: number;
  activeUiStep: number;
  procurementPath?: string | null;
  step6Appeal: Step6AppealState;
  onNavigate: (uiStep: number) => void;
};

export function WorkflowStepper({
  method,
  currentBackendStep,
  activeUiStep,
  procurementPath,
  step6Appeal,
  onNavigate,
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
        const isAppealLocked =
          !isSpecific &&
          isAppealWorkflowLocked(step6Appeal) &&
          (item.backendStep === 7 || item.backendStep === 8);
        const canNav =
          canNavigateToUiStep(
            item.uiStep,
            currentBackendStep,
            method,
            procurementPath,
          ) && !isAppealLocked;

        return (
          <button
            key={item.uiStep}
            type="button"
            disabled={!canNav}
            onClick={() => onNavigate(item.uiStep)}
            title={
              isAppealLocked
                ? "ล็อก — รอผลวินิจฉัยอุทธรณ์ฟังไม่ขึ้น หรือยืนยันไม่มีผู้ยื่นอุทธรณ์"
                : !canNav
                  ? "ล็อก — ดำเนินการตามลำดับและกด «บันทึกและไปขั้นตอนถัดไป»"
                  : isStepCompleted
                    ? "คลิกเพื่อย้อนกลับดูข้อมูลขั้นตอนนี้"
                    : isActive
                      ? "ขั้นตอนที่กำลังดูอยู่"
                      : "ขั้นตอนปัจจุบัน"
            }
            style={!canNav ? { cursor: "not-allowed" } : undefined}
            className={`relative flex flex-col items-center gap-1.5 rounded-md border-2 p-2 text-center transition ${
              !canNav
                ? "bg-muted/30 border-transparent text-muted-foreground/40 opacity-50 cursor-not-allowed"
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
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
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
