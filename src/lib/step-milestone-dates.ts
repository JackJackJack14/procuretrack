/**
 * วันสิ้นสุด milestone ต่อขั้น — ดึงจากฐานข้อมูล/ฟอร์ม (ไม่ hard-code วันที่)
 */
import {
  PROJECT_TIMELINE_ESTIMATE_STEP3_WORKDAYS,
  bidSubmissionEndAfterPeriodISO,
  committeeReviewDeadlineAfterBidEndISO,
  computeAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
  defaultPublicationEndISO,
} from "@/lib/workdays";

const STEP_FORM_MARKERS = ["__STEP_FORM__:", "__PROCURE_FORM__:"] as const;

export type StepMilestoneProject = {
  created_at?: string | null;
  median_price_approval_date?: string | null;
  committee_appointment_order_date?: string | null;
  procurement_request_approval_date?: string | null;
  committee_review_workdays?: number | null;
  evaluation_report_approval_date?: string | null;
  winner_announcement_date?: string | null;
};

export type StepMilestoneStep = {
  step_number: number;
  completed_at: string | null;
  due_date?: string | null;
};

export type StepMilestoneResolution = {
  iso: string;
  derived: boolean;
};

type Step3AnnouncementFields = {
  publication_end?: string;
  publication_start?: string;
  procurement_request_approval_date?: string;
  committee_review_workdays?: number | null;
};

/** ฟิลด์ด่าน 3 ที่ส่งจาก Form State สด — ใช้ override ค่าใน step3Note (DB) */
export type Step3TimelineLiveAnnouncement = Step3AnnouncementFields;

export function resolveStep3AnnouncementFields(
  step3Note: string | null | undefined,
  live?: Step3TimelineLiveAnnouncement | null,
): Step3AnnouncementFields {
  const fromNote = parseStep3AnnouncementFromNote(step3Note ?? null);
  if (!live) return fromNote;
  const pickStr = (liveVal: string | undefined, noteVal: string | undefined) => {
    const t = liveVal?.trim() ?? "";
    return t || noteVal;
  };
  return {
    publication_end: pickStr(live.publication_end, fromNote.publication_end),
    publication_start: pickStr(live.publication_start, fromNote.publication_start),
    procurement_request_approval_date: pickStr(
      live.procurement_request_approval_date,
      fromNote.procurement_request_approval_date,
    ),
    committee_review_workdays:
      live.committee_review_workdays != null && live.committee_review_workdays > 0
        ? live.committee_review_workdays
        : fromNote.committee_review_workdays,
  };
}

export function isoDatePart(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.slice(0, 10);
}

function parseStep3AnnouncementFromNote(note: string | null): Step3AnnouncementFields {
  if (!note?.trim()) return {};
  let markerIdx = -1;
  let markerLen = 0;
  for (const marker of STEP_FORM_MARKERS) {
    const idx = note.indexOf(marker);
    if (idx >= 0 && (markerIdx < 0 || idx < markerIdx)) {
      markerIdx = idx;
      markerLen = marker.length;
    }
  }
  if (markerIdx < 0) return {};
  try {
    const form = JSON.parse(note.slice(markerIdx + markerLen)) as {
      announcement?: Step3AnnouncementFields;
    };
    return form?.announcement ?? {};
  } catch {
    return {};
  }
}

function resolveCommitteeReviewWorkdaysFromContext(
  project: StepMilestoneProject | null | undefined,
  step3Note: string | null,
  ann?: Step3AnnouncementFields,
): number | null {
  const merged = ann ?? parseStep3AnnouncementFromNote(step3Note);
  const fromMerged = merged.committee_review_workdays;
  if (fromMerged != null && fromMerged > 0) return fromMerged;
  const fromProject = project?.committee_review_workdays;
  if (fromProject != null && fromProject > 0) return fromProject;
  return null;
}

function resolveBidPeriodStartDate(
  project: StepMilestoneProject | null | undefined,
  step3Note: string | null,
  ann?: Step3AnnouncementFields,
): string {
  const merged = ann ?? parseStep3AnnouncementFromNote(step3Note);
  const fromMerged = merged.procurement_request_approval_date?.trim();
  if (fromMerged) return fromMerged;
  const fromProject = project?.procurement_request_approval_date?.trim();
  if (fromProject) return fromProject;
  return "";
}

function resolveStep4CommitteeReviewDeadlineISO(
  project: StepMilestoneProject | null | undefined,
  step3Note: string | null,
  ann?: Step3AnnouncementFields,
): string {
  const bidPeriodStartISO = resolveBidPeriodStartDate(project, step3Note, ann);
  const bidPeriodWorkdays = resolveCommitteeReviewWorkdaysFromContext(project, step3Note, ann);
  if (!bidPeriodStartISO || bidPeriodWorkdays == null || bidPeriodWorkdays <= 0) return "";
  const bidSubmissionEndISO = bidSubmissionEndAfterPeriodISO(
    bidPeriodStartISO,
    bidPeriodWorkdays,
  );
  return committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO);
}

/** วันที่ประกาศแผนจัดซื้อจัดจ้างประจำปี (ด่าน 1) */
export function resolveStep1PlanPublicationDateISO(
  steps: StepMilestoneStep[],
  project?: StepMilestoneProject | null,
): string {
  const step1 = steps.find((s) => s.step_number === 1);
  const completed = isoDatePart(step1?.completed_at);
  if (completed) return completed;
  return isoDatePart(project?.created_at);
}

/** วันสิ้นสุด milestone ของแต่ละขั้น (ISO) — จากฐานข้อมูลจริง */
export function resolveStepMilestoneEndISO(
  stepNumber: number,
  project: StepMilestoneProject,
  stepRecord: StepMilestoneStep | undefined,
  step3Note?: string | null,
  step3Live?: Step3TimelineLiveAnnouncement | null,
): StepMilestoneResolution {
  const ann = resolveStep3AnnouncementFields(step3Note ?? null, step3Live);
  const completedISO = isoDatePart(stepRecord?.completed_at);
  const dueISO = isoDatePart(stepRecord?.due_date ?? null);

  switch (stepNumber) {
    case 1: {
      if (completedISO) return { iso: completedISO, derived: false };
      const created = isoDatePart(project.created_at);
      if (created) return { iso: created, derived: false };
      return { iso: "", derived: false };
    }
    case 2: {
      const median = project.median_price_approval_date?.trim() ?? "";
      if (median) return { iso: median, derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 3: {
      const pubEnd = ann.publication_end?.trim() ?? "";
      if (pubEnd) return { iso: pubEnd, derived: false };
      const procApproval = ann.procurement_request_approval_date?.trim() ?? "";
      if (procApproval) return { iso: procApproval, derived: false };
      const pubStart = ann.publication_start?.trim() ?? "";
      if (pubStart) {
        return {
          iso: defaultPublicationEndISO(pubStart, PROJECT_TIMELINE_ESTIMATE_STEP3_WORKDAYS),
          derived: true,
        };
      }
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 4: {
      const evalDate = project.evaluation_report_approval_date?.trim() ?? "";
      if (evalDate) return { iso: evalDate, derived: false };
      const committeeDeadline = resolveStep4CommitteeReviewDeadlineISO(
        project,
        step3Note ?? null,
        ann,
      );
      if (committeeDeadline) return { iso: committeeDeadline, derived: true };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 5: {
      const winner = project.winner_announcement_date?.trim() ?? "";
      if (winner) return { iso: winner, derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 6: {
      const winner = project.winner_announcement_date?.trim() ?? "";
      if (winner) return { iso: computeAppealDeadlineISO(winner), derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 7: {
      const winner = project.winner_announcement_date?.trim() ?? "";
      if (winner) {
        return { iso: computeContractNotificationDeadlineISO(winner), derived: false };
      }
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 8:
    case 9:
    case 10: {
      if (completedISO) return { iso: completedISO, derived: false };
      if (dueISO) return { iso: dueISO, derived: false };
      return { iso: "", derived: false };
    }
    default:
      return { iso: "", derived: false };
  }
}

export function resolvePreviousStepMilestoneEndISO(
  currentStepNumber: number,
  project: StepMilestoneProject,
  steps: StepMilestoneStep[],
  step3Note?: string | null,
  step3Live?: Step3TimelineLiveAnnouncement | null,
): string {
  if (currentStepNumber <= 1) return "";
  const prev = currentStepNumber - 1;
  const stepRecord = steps.find((s) => s.step_number === prev);
  return resolveStepMilestoneEndISO(prev, project, stepRecord, step3Note, step3Live).iso;
}
