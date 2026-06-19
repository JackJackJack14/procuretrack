/**
 * วันสิ้นสุด milestone ต่อขั้น — ดึงจากฐานข้อมูล/ฟอร์ม (ไม่ hard-code วันที่)
 */
import {
  loadStep4FormFromNote,
  loadStep5FormFromNote,
  mergeStep4BidResultFromProject,
  mergeStep5FromProject,
} from "@/lib/step-form";
import {
  computeAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
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
  winner_result_notification_date?: string | null;
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

export type Step4TimelineLiveFields = {
  evaluation_report_approval_date?: string;
};

export type Step5TimelineLiveFields = {
  winner_announcement_date?: string;
  winner_result_notification_date?: string;
};

/** บริบท note + form สด สำหรับไทม์ไลน์ — Single Source of Truth จาก DB + override ขั้นปัจจุบัน */
export type TimelineNotesContext = {
  step4Note?: string | null;
  step5Note?: string | null;
  step4Live?: Step4TimelineLiveFields | null;
  step5Live?: Step5TimelineLiveFields | null;
};

function pickTimelineDate(liveVal?: string, ...stored: Array<string | null | undefined>): string {
  const fromLive = liveVal?.trim() ?? "";
  if (fromLive) return fromLive;
  for (const candidate of stored) {
    const t = candidate?.trim() ?? "";
    if (t) return t;
  }
  return "";
}

/** รวมวันที่ milestone จาก project columns + procurement_steps note + form สด */
export function resolveMergedTimelineProject(
  project: StepMilestoneProject,
  ctx?: TimelineNotesContext | null,
): StepMilestoneProject {
  const step4Bid = mergeStep4BidResultFromProject(
    loadStep4FormFromNote(ctx?.step4Note ?? null).bidResult ?? {},
    project,
  );
  const step5Ann = mergeStep5FromProject(
    loadStep5FormFromNote(ctx?.step5Note ?? null).announcement ?? {},
    project,
  );
  return {
    ...project,
    evaluation_report_approval_date: pickTimelineDate(
      ctx?.step4Live?.evaluation_report_approval_date,
      step4Bid.evaluation_report_approval_date,
      project.evaluation_report_approval_date,
    ),
    winner_announcement_date: pickTimelineDate(
      ctx?.step5Live?.winner_announcement_date,
      step5Ann.winner_announcement_date,
      project.winner_announcement_date,
    ),
    winner_result_notification_date: pickTimelineDate(
      ctx?.step5Live?.winner_result_notification_date,
      step5Ann.winner_result_notification_date,
      project.winner_result_notification_date,
    ),
  };
}

export function resolveTimelineAppealAnchorISO(project: StepMilestoneProject): string {
  return (
    project.winner_result_notification_date?.trim() ||
    project.winner_announcement_date?.trim() ||
    ""
  );
}

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

/** วันสิ้นสุด milestone ของแต่ละขั้น (ISO) — จากฐานข้อมูลจริงเท่านั้น */
export function resolveStepMilestoneEndISO(
  stepNumber: number,
  project: StepMilestoneProject,
  stepRecord: StepMilestoneStep | undefined,
  step3Note?: string | null,
  step3Live?: Step3TimelineLiveAnnouncement | null,
  timelineNotes?: TimelineNotesContext | null,
): StepMilestoneResolution {
  const mergedProject = resolveMergedTimelineProject(project, timelineNotes);
  const ann = resolveStep3AnnouncementFields(step3Note ?? null, step3Live);
  const completedISO = isoDatePart(stepRecord?.completed_at);
  const dueISO = isoDatePart(stepRecord?.due_date ?? null);

  switch (stepNumber) {
    case 1: {
      if (completedISO) return { iso: completedISO, derived: false };
      const created = isoDatePart(mergedProject.created_at);
      if (created) return { iso: created, derived: false };
      return { iso: "", derived: false };
    }
    case 2: {
      const median = mergedProject.median_price_approval_date?.trim() ?? "";
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
      if (pubStart) return { iso: pubStart, derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 4: {
      const evalDate = mergedProject.evaluation_report_approval_date?.trim() ?? "";
      if (evalDate) return { iso: evalDate, derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 5: {
      const winner = mergedProject.winner_announcement_date?.trim() ?? "";
      if (winner) return { iso: winner, derived: false };
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 6: {
      const appealAnchor = resolveTimelineAppealAnchorISO(mergedProject);
      if (appealAnchor) {
        return { iso: computeAppealDeadlineISO(appealAnchor), derived: true };
      }
      if (completedISO) return { iso: completedISO, derived: false };
      return { iso: "", derived: false };
    }
    case 7: {
      const appealAnchor = resolveTimelineAppealAnchorISO(mergedProject);
      if (appealAnchor) {
        return {
          iso: computeContractNotificationDeadlineISO(appealAnchor),
          derived: true,
        };
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
  timelineNotes?: TimelineNotesContext | null,
): string {
  if (currentStepNumber <= 1) return "";
  const prev = currentStepNumber - 1;
  const stepRecord = steps.find((s) => s.step_number === prev);
  return resolveStepMilestoneEndISO(
    prev,
    project,
    stepRecord,
    step3Note,
    step3Live,
    timelineNotes,
  ).iso;
}
