/**
 * ไทม์ไลน์โครงการ — ใช้วันที่มีผลทางระเบียบ (Effective Date) ไม่ใช้ created_at / completed_at
 */
import { loadStep3FormFromNote } from "@/lib/step-form";
import {
  addWorkdays,
  computeAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
  getMinDays,
  parseISODateLocal,
} from "@/lib/workdays";

export type ProjectTimelineProject = {
  method: string;
  budget: number;
  current_step: number;
  committee_appointment_order_date?: string | null;
  median_price_approval_date?: string | null;
  evaluation_report_approval_date?: string | null;
  winner_announcement_date?: string | null;
};

export type ProjectTimelineStep = {
  step_number: number;
  completed_at: string | null;
  due_date?: string | null;
};

export type ProjectTimelineItem = {
  stepNumber: number;
  date: Date | null;
  /** true = แสดงสัญลักษณ์ ~ (ประมาณการล่วงหน้า) */
  estimated: boolean;
  isDone: boolean;
  isCurrent: boolean;
};

/** วันที่มีผลทางระเบียบต่อขั้น (ISO yyyy-mm-dd) — ขั้น 1–6 จากฟิลด์จริง, ขั้น 7 จากกฎหมาย */
export function resolveStepEffectiveDateISO(
  stepNumber: number,
  project: ProjectTimelineProject,
  step3Note?: string | null,
): string {
  const step3 = loadStep3FormFromNote(step3Note ?? null);

  switch (stepNumber) {
    case 1:
      return project.committee_appointment_order_date?.trim() ?? "";
    case 2:
      return project.median_price_approval_date?.trim() ?? "";
    case 3:
      return step3.announcement.publication_start?.trim() ?? "";
    case 4:
      return project.evaluation_report_approval_date?.trim() ?? "";
    case 5:
      return project.winner_announcement_date?.trim() ?? "";
    case 6: {
      const winner = project.winner_announcement_date?.trim() ?? "";
      return winner ? computeAppealDeadlineISO(winner) : "";
    }
    case 7: {
      const winner = project.winner_announcement_date?.trim() ?? "";
      return winner ? computeContractNotificationDeadlineISO(winner) : "";
    }
    default:
      return "";
  }
}

function seedEstimateCursor(
  project: ProjectTimelineProject,
  step3Note?: string | null,
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor: Date | null = null;
  for (let n = 1; n <= 7; n++) {
    const iso = resolveStepEffectiveDateISO(n, project, step3Note);
    const d = iso ? parseISODateLocal(iso) : null;
    if (d) cursor = d;
  }

  if (!cursor) return today;
  return cursor < today ? today : cursor;
}

/**
 * สร้างรายการไทม์ไลน์ 10 ขั้น
 * - ขั้น 1–6: แสดงวันที่ระเบียบจริงเมื่อมี (ไม่ใส่ ~)
 * - ขั้น 7+: ประมาณการล่วงหน้า (~) จนกว่าจะบันทึก due_date หรือเสร็จขั้น
 */
export function buildProjectTimelineItems(
  steps: ProjectTimelineStep[],
  project: ProjectTimelineProject,
  step3Note?: string | null,
): ProjectTimelineItem[] {
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  const mins = getMinDays(project.method, Number(project.budget));
  const currentStep = project.current_step;
  let cursor = seedEstimateCursor(project, step3Note);

  return sorted.map((s) => {
    const stepNum = s.step_number;
    const isDone = !!s.completed_at;
    const isCurrent = stepNum === currentStep && !isDone;
    const regulatoryISO = resolveStepEffectiveDateISO(stepNum, project, step3Note);
    const regulatoryDate = regulatoryISO ? parseISODateLocal(regulatoryISO) : null;
    const dueISO = s.due_date?.trim() ?? "";
    const dueDate = dueISO ? parseISODateLocal(dueISO) : null;

    // ขั้น 1–6: วันที่ระเบียบจากฟอร์ม (หรือคำนวณอุทธรณ์)
    if (stepNum <= 6 && regulatoryDate) {
      cursor = regulatoryDate;
      return {
        stepNumber: stepNum,
        date: regulatoryDate,
        estimated: false,
        isDone,
        isCurrent,
      };
    }

    // ขั้นที่เสร็จแล้วและมีกำหนดเสร็จที่ผู้ใช้บันทึก
    if (isDone && dueDate) {
      cursor = dueDate;
      return {
        stepNumber: stepNum,
        date: dueDate,
        estimated: false,
        isDone,
        isCurrent,
      };
    }

    // ขั้น 7 ที่ยังไม่ถึง — แสดงวันคำนวณล่วงหน้า (~) ตาม workdays
    if (stepNum === 7 && regulatoryDate && !isDone) {
      cursor = regulatoryDate;
      return {
        stepNumber: stepNum,
        date: regulatoryDate,
        estimated: true,
        isDone,
        isCurrent,
      };
    }

    // ขั้นในอนาคตหรือยังไม่มีวันที่ระเบียบ — ประมาณการต่อจาก cursor
    const minDays = (mins as Record<string, number>)[`step${stepNum}`] ?? 0;
    const bump = Math.max(minDays, 1);
    const estimatedDate = addWorkdays(cursor, bump);
    cursor = estimatedDate;

    const isFuture = stepNum > currentStep;
    const needsEstimate = isFuture || isCurrent || (stepNum <= 6 && !regulatoryDate);

    return {
      stepNumber: stepNum,
      date: needsEstimate ? estimatedDate : null,
      estimated: needsEstimate,
      isDone,
      isCurrent,
    };
  });
}
