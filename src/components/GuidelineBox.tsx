import { Step3GuidelineBox } from "@/components/Step3GuidelineBox";
import { Step4GuidelineBox } from "@/components/Step4GuidelineBox";
import { Step5GuidelineBox } from "@/components/Step5GuidelineBox";
import { Step6GuidelineBox } from "@/components/Step6GuidelineBox";
import { STEP_GUIDELINES } from "@/lib/guidelines";
import type { Step3SkipReason } from "@/lib/step3-hearing";
import type { Step4Timeline } from "@/lib/step-form";
import { addWorkdays, getStepMinDays } from "@/lib/workdays";
import { formatThaiDate } from "@/lib/utils";

type Props = {
  stepNumber: number;
  method: string;
  budget: number;
  /** วันเริ่มขั้นตอน (ISO yyyy-mm-dd หรือ ISO timestamp). ถ้าไม่ส่งใช้วันนี้ */
  stepStartDate?: string | null;
  /** ขั้นตอนที่ 4 — ไทม์ไลน์คำนวณจากข้อมูลขั้นตอนที่ 3 */
  step4Timeline?: Step4Timeline | null;
  /** ขั้นตอนที่ 6 — วันประกาศผู้ชนะจากขั้นตอนที่ 5 */
  winnerAnnouncementDate?: string | null;
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
  step4Timeline,
  winnerAnnouncementDate,
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

  if (stepNumber === 4) {
    return <Step4GuidelineBox step4Timeline={step4Timeline} />;
  }

  if (stepNumber === 5) {
    return <Step5GuidelineBox />;
  }

  if (stepNumber === 6) {
    return <Step6GuidelineBox winnerAnnouncementDate={winnerAnnouncementDate} />;
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
      {duration && (
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
