/**
 * ไทม์ไลน์โครงการ — ใช้วันที่มีผลทางระเบียบ (Effective Date) ไม่ใช้ created_at / completed_at
 * คำนวณแบบ pure function ต่อ projectId — ไม่เก็บ cache ระดับโมดูล
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
  id?: string;
  method: string;
  budget: number;
  current_step: number;
  created_at?: string | null;
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

/** อินพุตสำหรับคำนวณไทม์ไลน์ — ผูกกับ projectId เพื่อกัน stale data ข้ามโครงการ */
export type ProjectTimelineInput = {
  projectId: string;
  project: ProjectTimelineProject;
  steps: ProjectTimelineStep[];
  step3Note: string | null;
};

function isoDatePart(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.slice(0, 10);
}

/** สnapshot ฟิลด์ที่เกี่ยวกับไทม์ไลน์เท่านั้น — ป้องกัน reference เก่าจาก object ใหญ่ */
export function snapshotTimelineProject(
  project: ProjectTimelineProject,
): ProjectTimelineProject {
  return {
    id: project.id,
    method: project.method ?? "e_bidding",
    budget: Number(project.budget) || 0,
    current_step: project.current_step ?? 1,
    created_at: project.created_at ?? null,
    committee_appointment_order_date: project.committee_appointment_order_date ?? null,
    median_price_approval_date: project.median_price_approval_date ?? null,
    evaluation_report_approval_date: project.evaluation_report_approval_date ?? null,
    winner_announcement_date: project.winner_announcement_date ?? null,
  };
}

export function snapshotTimelineSteps(steps: ProjectTimelineStep[]): ProjectTimelineStep[] {
  return [...steps]
    .sort((a, b) => a.step_number - b.step_number)
    .map((s) => ({
      step_number: s.step_number,
      completed_at: s.completed_at,
      due_date: s.due_date ?? null,
    }));
}

/** สร้างอินพุตคำนวณไทม์ไลน์จากข้อมูลโครงการปัจจุบัน */
export function buildProjectTimelineInput(
  projectId: string,
  project: ProjectTimelineProject,
  steps: ProjectTimelineStep[],
  step3Note?: string | null,
): ProjectTimelineInput {
  return {
    projectId,
    project: snapshotTimelineProject(project),
    steps: snapshotTimelineSteps(steps),
    step3Note: step3Note ?? null,
  };
}

/** คีย์สำหรับ useMemo — เปลี่ยนเมื่อข้อมูลโครงการที่เกี่ยวกับไทม์ไลน์เปลี่ยน */
export function getProjectTimelineInputKey(input: ProjectTimelineInput): string {
  const p = input.project;
  const stepSig = input.steps
    .map((s) => `${s.step_number}:${isoDatePart(s.completed_at)}:${isoDatePart(s.due_date ?? null)}`)
    .join("|");
  return [
    input.projectId,
    p.id ?? "",
    p.method,
    p.budget,
    p.current_step,
    isoDatePart(p.created_at),
    isoDatePart(p.committee_appointment_order_date),
    isoDatePart(p.median_price_approval_date),
    isoDatePart(p.evaluation_report_approval_date),
    isoDatePart(p.winner_announcement_date),
    input.step3Note ?? "",
    stepSig,
  ].join("::");
}

/** คำนวณไทม์ไลน์ใหม่ทุกครั้งจากอินพุต — ไม่ใช้ global state */
export function recalculateProjectTimeline(input: ProjectTimelineInput): ProjectTimelineItem[] {
  if (input.project.id && input.project.id !== input.projectId) {
    return [];
  }
  return buildProjectTimelineItemsFromInput(input);
}

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

function parseProjectCreatedDate(project: ProjectTimelineProject): Date | null {
  const createdISO = isoDatePart(project.created_at);
  return createdISO ? parseISODateLocal(createdISO) : null;
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

  if (!cursor) {
    const created = parseProjectCreatedDate(project);
    if (created) return created < today ? today : created;
    return today;
  }
  return cursor < today ? today : cursor;
}

function buildProjectTimelineItemsFromInput(
  input: ProjectTimelineInput,
): ProjectTimelineItem[] {
  const { project, steps, step3Note } = input;
  const sorted = steps;
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

/**
 * สร้างรายการไทม์ไลน์ 10 ขั้น
 * - ขั้น 1–6: แสดงวันที่ระเบียบจริงเมื่อมี (ไม่ใส่ ~)
 * - ขั้น 7+: ประมาณการล่วงหน้า (~) จนกว่าจะบันทึก due_date หรือเสร็จขั้น
 */
export function buildProjectTimelineItems(
  steps: ProjectTimelineStep[],
  project: ProjectTimelineProject,
  step3Note?: string | null,
  projectId?: string,
): ProjectTimelineItem[] {
  const resolvedProjectId = projectId ?? project.id ?? "";
  return recalculateProjectTimeline(
    buildProjectTimelineInput(resolvedProjectId, project, steps, step3Note),
  );
}
