/**
 * Global Chronological Lock — minDate แบบ Dynamic จากด่านก่อนหน้าในฐานข้อมูล (ห้าม hard-code วันที่)
 */
import {
  PROJECT_TIMELINE_ESTIMATE_STEP5_WORKDAYS,
  addWorkdays,
  parseISODateLocal,
  toISODate,
} from "@/lib/workdays";
import {
  resolvePreviousStepMilestoneEndISO,
  resolveStep1PlanPublicationDateISO,
  type StepMilestoneProject,
  type StepMilestoneStep,
} from "@/lib/step-milestone-dates";
import type { TimelineValidationContext } from "@/lib/timeline-validation";

export type ChronologicalMinProfile =
  | "default"
  /** ขั้น 3 — วันลงนาม TOR: หลังแผนด่าน 1 และด่าน 2 */
  | "step3_tor_approval"
  /** ขั้น 5 — ประกาศผู้ชนะ: หลังด่าน 4 + ระยะขั้นต่ำ 7 วันทำการ (e-bidding) */
  | "step5_winner_announcement";

/** รวมวันขั้นต่ำ — คืนวันที่ล่าสุด (เข้มงวดสุด) หรือ undefined ถ้าไม่มี */
export function mergeMinDateISO(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  let best = "";
  for (const c of candidates) {
    const trimmed = c?.trim() ?? "";
    if (!trimmed) continue;
    if (!best || trimmed > best) best = trimmed;
  }
  return best || undefined;
}

/** วันสิ้นสุด milestone ด่านก่อนหน้า — ใช้เป็น minDate เริ่มต้นของด่าน N */
export function getStepPreviousMilestoneMinISO(
  stepNumber: number,
  ctx: TimelineValidationContext,
): string | undefined {
  if (stepNumber <= 1) return undefined;
  const iso = resolvePreviousStepMilestoneEndISO(
    stepNumber,
    ctx.project,
    ctx.steps,
    ctx.step3Note,
  );
  return iso || undefined;
}

/** ขั้น 3 — วันลงนาม TOR ต้องไม่ก่อนแผนด่าน 1 และไม่ก่อนด่าน 2 */
export function getStep3TorApprovalMinISO(ctx: TimelineValidationContext): string | undefined {
  return mergeMinDateISO(
    resolveStep1PlanPublicationDateISO(ctx.steps, ctx.project),
    getStepPreviousMilestoneMinISO(3, ctx),
  );
}

/** ขั้น 5 — วันประกาศผู้ชนะ: หลังด่าน 4 + อย่างน้อย 7 วันทำการจากวันสิ้นสุดด่าน 4 */
export function getStep5WinnerAnnouncementMinISO(
  ctx: TimelineValidationContext,
  evaluationApprovalDate?: string | null,
): string | undefined {
  const prevEnd = getStepPreviousMilestoneMinISO(5, ctx);
  let legalFloor: string | undefined;
  if (prevEnd) {
    const base = parseISODateLocal(prevEnd);
    if (base) {
      legalFloor = toISODate(addWorkdays(base, PROJECT_TIMELINE_ESTIMATE_STEP5_WORKDAYS));
    }
  }
  return mergeMinDateISO(prevEnd, evaluationApprovalDate, legalFloor);
}

export function resolveChronologicalMinDateISO(input: {
  stepNumber: number;
  ctx?: TimelineValidationContext | null;
  profile?: ChronologicalMinProfile;
  intraStepMinDate?: string | null;
  additionalMinDates?: Array<string | null | undefined>;
  explicitMinDate?: string | null;
  evaluationApprovalDate?: string | null;
}): string | undefined {
  const {
    stepNumber,
    ctx,
    profile = "default",
    intraStepMinDate,
    additionalMinDates = [],
    explicitMinDate,
    evaluationApprovalDate,
  } = input;

  let profileMin: string | undefined;
  if (ctx && stepNumber > 1) {
    switch (profile) {
      case "step3_tor_approval":
        profileMin = getStep3TorApprovalMinISO(ctx);
        break;
      case "step5_winner_announcement":
        profileMin = getStep5WinnerAnnouncementMinISO(ctx, evaluationApprovalDate);
        break;
      default:
        profileMin = getStepPreviousMilestoneMinISO(stepNumber, ctx);
        break;
    }
  }

  return mergeMinDateISO(
    profileMin,
    intraStepMinDate,
    ...additionalMinDates,
    explicitMinDate,
  );
}

export function buildChronologicalContext(input: {
  project: StepMilestoneProject;
  steps: Array<{ step_number: number; completed_at: string | null; due_date?: string | null }>;
  step3Note?: string | null;
}): TimelineValidationContext {
  return {
    project: input.project,
    steps: input.steps.map((s) => ({
      step_number: s.step_number,
      completed_at: s.completed_at,
      due_date: s.due_date ?? null,
    })),
    step3Note: input.step3Note ?? null,
  };
}
