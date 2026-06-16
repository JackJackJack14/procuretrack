import { useMemo } from "react";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import {
  type ChronologicalMinProfile,
  resolveChronologicalMinDateISO,
} from "@/lib/chronological-lock";
import type { TimelineValidationContext } from "@/lib/timeline-validation";
import { formatThaiDateSlash } from "@/lib/utils";

type ThaiDatePickerProps = React.ComponentProps<typeof ThaiDatePicker>;

export type ChronologicalDatePickerProps = Omit<ThaiDatePickerProps, "minDate"> & {
  /** ด่านปัจจุบัน (1–10) — ใช้คำนวณ minDate จากด่าน N-1 */
  stepNumber: number;
  /** บริบทโครงการ — ดึงวันที่จากฐานข้อมูลแบบ Dynamic */
  chronologicalCtx?: TimelineValidationContext | null;
  /** โปรไฟล์ขั้นต่ำพิเศษ (เช่น TOR ขั้น 3, ประกาศผู้ชนะขั้น 5) */
  minProfile?: ChronologicalMinProfile;
  /** ขั้นต่ำภายในด่านเดียวกัน (เช่น วันอนุมัติหลังคำสั่งแต่งตั้ง) */
  intraStepMinDate?: string | null;
  /** ขั้นต่ำเพิ่มเติม (เช่น เดดไลน์รับซอง, วันสิ้นสุดเผยแพร่) */
  additionalMinDates?: Array<string | null | undefined>;
  /** ขั้นต่ำจาก props เดิม — รวมกับค่าที่คำนวณอัตโนมัติ */
  minDate?: string | null;
  /** ขั้น 5 — วันอนุมัติผลจากด่าน 4 */
  evaluationApprovalDate?: string | null;
  /** แสดงคำอธิบายวันที่เลือกได้ตั้งแต่... */
  showChronologicalHint?: boolean;
  /** ปิดการล็อกข้ามด่าน (ใช้เฉพาะกรณีพิเศษ) */
  skipChronologicalLock?: boolean;
};

export function ChronologicalDatePicker({
  stepNumber,
  chronologicalCtx,
  minProfile = "default",
  intraStepMinDate,
  additionalMinDates,
  minDate: explicitMinDate,
  evaluationApprovalDate,
  showChronologicalHint = true,
  skipChronologicalLock = false,
  disabled,
  ...pickerProps
}: ChronologicalDatePickerProps) {
  const effectiveMin = useMemo(() => {
    if (skipChronologicalLock) {
      return explicitMinDate?.trim() || intraStepMinDate?.trim() || undefined;
    }
    return resolveChronologicalMinDateISO({
      stepNumber,
      ctx: chronologicalCtx,
      profile: minProfile,
      intraStepMinDate,
      additionalMinDates,
      explicitMinDate,
      evaluationApprovalDate,
    });
  }, [
    stepNumber,
    chronologicalCtx,
    minProfile,
    intraStepMinDate,
    additionalMinDates,
    explicitMinDate,
    evaluationApprovalDate,
    skipChronologicalLock,
  ]);

  const prevStepLabel = stepNumber > 1 ? stepNumber - 1 : null;

  return (
    <div className="space-y-1">
      <ThaiDatePicker
        {...pickerProps}
        minDate={effectiveMin}
        disabled={disabled}
      />
      {showChronologicalHint &&
        effectiveMin &&
        !skipChronologicalLock &&
        stepNumber > 1 &&
        prevStepLabel != null && (
          <p className="text-xs text-muted-foreground">
            เลือกได้ตั้งแต่ {formatThaiDateSlash(effectiveMin)} เป็นต้นไป
            {minProfile === "default" && (
              <span> (หลังวันสิ้นสุดขั้นตอนที่ {prevStepLabel})</span>
            )}
          </p>
        )}
    </div>
  );
}
