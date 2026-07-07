import { useMemo } from "react";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import {
  useChronologicalDateValidation,
  ChronologicalDateFieldError,
} from "@/contexts/ChronologicalDateValidationContext";
import type { ChronologicalFieldKey } from "@/lib/chronological-date-chains";
import { chronologicalFieldKey } from "@/lib/chronological-date-chains";
import {
  type ChronologicalMinProfile,
  resolveChronologicalMinDateISO,
} from "@/lib/chronological-lock";
import type { TimelineValidationContext } from "@/lib/timeline-validation";
import { formatThaiDateSlash } from "@/lib/utils";

type ThaiDatePickerProps = React.ComponentProps<typeof ThaiDatePicker>;

export type ChronologicalDatePickerProps = Omit<ThaiDatePickerProps, "minDate"> & {
  /** ขั้นตอนที่ปัจจุบัน (1–10) — ใช้คำนวณ minDate จากขั้นตอนที่ N-1 */
  stepNumber: number;
  /** บริบทโครงการ — ดึงวันที่จากฐานข้อมูลแบบ Dynamic */
  chronologicalCtx?: TimelineValidationContext | null;
  /** โปรไฟล์ขั้นต่ำพิเศษ (เช่น TOR ขั้น 3, ประกาศผู้ชนะขั้น 5) */
  minProfile?: ChronologicalMinProfile;
  /** ขั้นต่ำภายในขั้นตอนที่เดียวกัน (เช่น วันอนุมัติหลังคำสั่งแต่งตั้ง) */
  intraStepMinDate?: string | null;
  /** ขั้นต่ำเพิ่มเติม (เช่น เดดไลน์รับซอง, วันสิ้นสุดเผยแพร่) */
  additionalMinDates?: Array<string | null | undefined>;
  /** ขั้นต่ำจาก props เดิม — รวมกับค่าที่คำนวณอัตโนมัติ */
  minDate?: string | null;
  /** ขั้น 5 — วันอนุมัติผลจากขั้นตอนที่ 4 */
  evaluationApprovalDate?: string | null;
  /** แสดงคำอธิบายวันที่เลือกได้ตั้งแต่... */
  showChronologicalHint?: boolean;
  /** ปิดการล็อกข้ามขั้นตอน (ใช้เฉพาะกรณีพิเศษ) */
  skipChronologicalLock?: boolean;
  /** วันที่สูงสุดที่เลือกได้ (yyyy-mm-dd) */
  maxDate?: string | null;
  /** คีย์ฟิลด์ใน Global Date Chain — เปิดใช้ minDate + real-time error อัตโนมัติ */
  chainFieldKey?: ChronologicalFieldKey;
  /** ชื่อฟิลด์ใน chain (ย่อ — รวมกับ stepNumber เป็น chainFieldKey) */
  fieldId?: string;
  /** งวดที่ (ขั้น 10) */
  installmentNo?: number;
  /** แสดง error จาก Global Validator ใต้ปฏิทิน */
  showChainError?: boolean;
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
  maxDate,
  chainFieldKey,
  fieldId,
  installmentNo,
  showChainError = true,
  disabled,
  ...pickerProps
}: ChronologicalDatePickerProps) {
  const chronoValidation = useChronologicalDateValidation();

  const resolvedChainKey = useMemo((): ChronologicalFieldKey | undefined => {
    if (chainFieldKey) return chainFieldKey;
    if (!fieldId) return undefined;
    if (installmentNo != null) {
      return chronologicalFieldKey(stepNumber, `i${installmentNo}.${fieldId}`);
    }
    return chronologicalFieldKey(stepNumber, fieldId);
  }, [chainFieldKey, fieldId, installmentNo, stepNumber]);

  const chainMinDate = useMemo(() => {
    if (!resolvedChainKey || !chronoValidation) return undefined;
    return chronoValidation.getFieldMinDate(resolvedChainKey, {
      explicitMinDate,
      additionalMinDates,
    });
  }, [
    resolvedChainKey,
    chronoValidation,
    explicitMinDate,
    additionalMinDates,
  ]);

  const effectiveMin = useMemo(() => {
    if (resolvedChainKey && chainMinDate) {
      return chainMinDate;
    }
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
    resolvedChainKey,
    chainMinDate,
    stepNumber,
    chronologicalCtx,
    minProfile,
    intraStepMinDate,
    additionalMinDates,
    explicitMinDate,
    evaluationApprovalDate,
    skipChronologicalLock,
  ]);

  const chainError =
    resolvedChainKey && chronoValidation
      ? chronoValidation.getFieldError(resolvedChainKey)
      : null;

  const prevStepLabel = stepNumber > 1 ? stepNumber - 1 : null;

  return (
    <div className="space-y-1">
      <ThaiDatePicker
        {...pickerProps}
        minDate={effectiveMin}
        maxDate={maxDate?.trim() || undefined}
        disabled={disabled}
      />
      {showChainError && resolvedChainKey && chainError && (
        <ChronologicalDateFieldError fieldKey={resolvedChainKey} show />
      )}
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
