import { Step3GuidelineBox } from "@/components/Step3GuidelineBox";
import { STEP_GUIDELINES } from "@/lib/guidelines";
import type { Step3SkipReason } from "@/lib/step3-hearing";
import { addWorkdays, getStepMinDays } from "@/lib/workdays";
import { formatThaiDate } from "@/lib/utils";

type Props = {
  stepNumber: number;
  method: string;
  budget: number;
  /** วันเริ่มขั้นตอน (ISO yyyy-mm-dd หรือ ISO timestamp). ถ้าไม่ส่งใช้วันนี้ */
  stepStartDate?: string | null;
  /** ขั้นตอนที่ 4 — ระยะเวลาพิจารณาผลจากรายงานขอซื้อขอจ้าง (ขั้นตอนที่ 3) */
  committeeReviewWorkdays?: number | null;
  /** ขั้นตอนที่ 3 — ข้ามการฟังคำวิจารณ์ */
  onSkipStep3?: (reason: Step3SkipReason) => void;
  onProceedStep3Hearing?: () => void;
  step3HearingProceed?: boolean;
  step3Skipping?: boolean;
  /** โหมดดูอย่างเดียว — ปิดปุ่มข้าม/ดำเนินการขั้น 3 */
  readOnly?: boolean;
};

export function GuidelineBox({
  stepNumber,
  method,
  budget,
  stepStartDate,
  committeeReviewWorkdays,
  onSkipStep3,
  onProceedStep3Hearing,
  step3HearingProceed,
  step3Skipping,
  readOnly = false,
}: Props) {
  if (stepNumber === 3) {
    return (
      <Step3GuidelineBox
        budget={budget}
        onSkip={onSkipStep3 ?? (() => {})}
        onProceedHearing={onProceedStep3Hearing}
        hearingProceed={step3HearingProceed}
        skipping={step3Skipping}
        readOnly={readOnly}
      />
    );
  }

  const g = STEP_GUIDELINES[stepNumber - 1];
  if (!g) return null;
  const duration = g.duration;

  const minDays = getStepMinDays(stepNumber, method, budget);
  const start = stepStartDate ? new Date(stepStartDate) : new Date();
  const validStart = !isNaN(start.getTime());
  const deadline = validStart && minDays > 0 ? addWorkdays(start, minDays) : null;

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{
        backgroundColor: "#EFF6FF",
        borderLeft: "4px solid #2563EB",
      }}
    >
      <div className="font-semibold text-foreground mb-2">📋 คุณต้องทำในขั้นตอนนี้</div>
      <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/90 mb-3">
        {g.todo.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>
      {duration && stepNumber !== 4 && (
        <div className="text-sm text-foreground/90 mb-1">
          <span className="font-medium">⏱ ระยะเวลา:</span> {duration}
        </div>
      )}
      {stepNumber === 4 && committeeReviewWorkdays != null && committeeReviewWorkdays > 0 && (
        <div className="text-sm text-foreground/90 mb-1">
          <span className="font-medium">⏱ ระยะเวลาดำเนินการ:</span>{" "}
          ต้องดำเนินการให้แล้วเสร็จ ภายใน {committeeReviewWorkdays} วันทำการ
          (ตามกรอบเวลาที่ได้รับอนุมัติไว้ในรายงานขอซื้อขอจ้าง)
        </div>
      )}
      {stepNumber === 4 && (!committeeReviewWorkdays || committeeReviewWorkdays <= 0) && duration && (
        <div className="text-sm text-foreground/90 mb-1">
          <span className="font-medium">⏱ ระยะเวลา:</span> {duration}
        </div>
      )}
      {deadline && (
        <div className="text-sm text-foreground/90 mb-1">
          <span className="font-medium">📅 กำหนดเสร็จขั้นต่ำ:</span> {formatThaiDate(deadline)}
          <span className="text-muted-foreground">
            {" "}(นับจากวันที่เริ่มขั้นตอน + {minDays} วันทำการ ไม่นับเสาร์-อาทิตย์และวันหยุดราชการ)
          </span>
        </div>
      )}
      <div className="text-sm" style={{ color: "#EA580C" }}>
        <span className="font-medium">⚠️ ข้อควรระวัง:</span> {g.warning}
      </div>
    </div>
  );
}
