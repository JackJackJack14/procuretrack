import { Eye, Pencil } from "lucide-react";
import type { StepWorkflowMode } from "@/lib/step-workflow";

type Props = {
  mode: StepWorkflowMode;
  stepNumber: number;
  currentWorkflowStep: number;
  onUnlockEdit: () => void;
};

export function StepWorkflowBanner({
  mode,
  stepNumber,
  currentWorkflowStep,
  onUnlockEdit,
}: Props) {
  if (mode === "current") return null;

  if (mode === "historical_readonly") {
    return (
      <div
        className="rounded-lg border px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ backgroundColor: "#F8FAFC", borderColor: "#CBD5E1" }}
      >
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">
              โหมดดูอย่างเดียว — ขั้นตอนที่ {stepNumber}
            </p>
            <p className="text-xs mt-0.5">
              ขั้นตอนปัจจุบันของโครงการคือขั้นที่ {currentWorkflowStep}{" "}
              หากต้องการแก้ไขข้อมูลเก่า กดปุ่มด้านขวาแล้วบันทึกใหม่เพื่ออัปเดต Data Flow
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUnlockEdit}
          className="h-9 px-3 rounded-md border border-primary bg-background text-sm font-medium text-primary hover:bg-primary/5 flex items-center gap-1.5 shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" /> แก้ไขข้อมูลในขั้นตอนนี้
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border px-4 py-3 mb-4 text-sm"
      style={{ backgroundColor: "#FFF7ED", borderColor: "#FDBA74", color: "#9A3412" }}
    >
      <p className="font-medium flex items-center gap-1.5">
        <Pencil className="h-4 w-4" /> โหมดแก้ไขข้อมูลย้อนหลัง — ขั้นตอนที่ {stepNumber}
      </p>
      <p className="text-xs mt-1 opacity-90">
        หลังแก้ไขเสร็จ ต้องกด «บันทึกการแก้ไข» เพื่อให้ระบบอัปเดตข้อมูลที่ส่งต่อไปขั้นถัดไป
        ป้องกันข้อมูลขัดแย้ง (Data Mismatch)
      </p>
    </div>
  );
}
