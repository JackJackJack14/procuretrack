import { Eye, Pencil } from "lucide-react";
import type { StepWorkflowMode } from "@/lib/step-workflow";

type Props = {
  mode: StepWorkflowMode;
  stepNumber: number;
  currentWorkflowStep: number;
  /** ห้ามปลดล็อกแก้ไขย้อนหลัง — ใช้กับขั้นตอนที่ 1 เมื่อต้องถอยกลับก่อนแก้ไขสาระสำคัญ */
  disableUnlockEdit?: boolean;
  unlockBlockedHint?: string;
};

export function StepWorkflowBanner({
  mode,
  stepNumber,
  currentWorkflowStep,
  disableUnlockEdit = false,
  unlockBlockedHint,
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
              {disableUnlockEdit && unlockBlockedHint
                ? unlockBlockedHint
                : (
                  <>
                    ขั้นตอนปัจจุบันของโครงการคือขั้นที่ {currentWorkflowStep}{" "}
                    — หากต้องการแก้ไขข้อมูลย่อยในขั้นนี้ กดปุ่ม «ปลดล็อกเพื่อแก้ไขข้อมูลขั้นตอนนี้»
                    ที่แถบด้านล่าง (จะไม่ล้างข้อมูลขั้นถัดไป)
                  </>
                )}
            </p>
          </div>
        </div>
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
        แก้ไขได้เฉพาะข้อมูลในขั้นตอนนี้ — กด «บันทึกข้อมูล (Save Changes)» เพื่ออัปเดตทับของเดิม
        ระบบจะไม่ล้างหรือรีเซ็ตขั้นตอนถัดไป
      </p>
    </div>
  );
}
