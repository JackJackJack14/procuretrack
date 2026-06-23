/**
 * ไทม์ไลน์โครงการ — วันที่จากฐานข้อมูล/ฟอร์มเท่านั้น (ไม่ cascade mock)
 */
import {
  resolveCommitteeReviewWorkdays,
} from "@/lib/step-form";
import {
  isoDatePart,
  resolveStepMilestoneEndISO,
  resolveStep1PlanPublicationDateISO,
  type Step3TimelineLiveAnnouncement,
  type TimelineNotesContext,
} from "@/lib/step-milestone-dates";
import {
  PROJECT_TIMELINE_ESTIMATE_STEP3_WORKDAYS,
  PROJECT_TIMELINE_ESTIMATE_STEP4_DEFAULT_BID_WORKDAYS,
  PROJECT_TIMELINE_ESTIMATE_STEP5_WORKDAYS,
  PROJECT_TIMELINE_ESTIMATE_STEP6_WORKDAYS,
  PROJECT_TIMELINE_ESTIMATE_STEP7_9_WORKDAYS_EACH,
  STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END,
  parseISODateLocal,
} from "@/lib/workdays";

export { resolveStepMilestoneEndISO, resolveStep1PlanPublicationDateISO };

export type ProjectTimelineProject = {
  id?: string;
  method: string;
  budget: number;
  current_step: number;
  created_at?: string | null;
  committee_appointment_order_date?: string | null;
  median_price_approval_date?: string | null;
  procurement_request_approval_date?: string | null;
  committee_review_workdays?: number | null;
  evaluation_report_approval_date?: string | null;
  winner_announcement_date?: string | null;
  winner_result_notification_date?: string | null;
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

export type ProjectTimelineInput = {
  projectId: string;
  project: ProjectTimelineProject;
  steps: ProjectTimelineStep[];
  step3Note: string | null;
  /** Form State สดของขั้นตอนที่ 3 — override ค่าใน step3Note สำหรับไทม์ไลน์แบบ real-time */
  step3LiveAnnouncement?: Step3TimelineLiveAnnouncement | null;
  /** note ขั้นตอนที่ 4–5 จาก procurement_steps */
  timelineNotes?: TimelineNotesContext | null;
};

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
    procurement_request_approval_date: project.procurement_request_approval_date ?? null,
    committee_review_workdays: project.committee_review_workdays ?? null,
    evaluation_report_approval_date: project.evaluation_report_approval_date ?? null,
    winner_announcement_date: project.winner_announcement_date ?? null,
    winner_result_notification_date: project.winner_result_notification_date ?? null,
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

export function buildProjectTimelineInput(
  projectId: string,
  project: ProjectTimelineProject,
  steps: ProjectTimelineStep[],
  step3Note?: string | null,
  step3LiveAnnouncement?: Step3TimelineLiveAnnouncement | null,
  timelineNotes?: TimelineNotesContext | null,
): ProjectTimelineInput {
  return {
    projectId,
    project: snapshotTimelineProject(project),
    steps: snapshotTimelineSteps(steps),
    step3Note: step3Note ?? null,
    step3LiveAnnouncement: step3LiveAnnouncement ?? null,
    timelineNotes: timelineNotes ?? null,
  };
}

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
    isoDatePart(p.procurement_request_approval_date),
    p.committee_review_workdays ?? "",
    isoDatePart(p.evaluation_report_approval_date),
    isoDatePart(p.winner_announcement_date),
    isoDatePart(p.winner_result_notification_date),
    input.step3Note ?? "",
    input.step3LiveAnnouncement?.publication_start ?? "",
    input.step3LiveAnnouncement?.publication_end ?? "",
    input.step3LiveAnnouncement?.procurement_request_approval_date ?? "",
    input.step3LiveAnnouncement?.committee_review_workdays ?? "",
    input.timelineNotes?.step4Note ?? "",
    input.timelineNotes?.step5Note ?? "",
    input.timelineNotes?.step4Live?.evaluation_report_approval_date ?? "",
    input.timelineNotes?.step5Live?.winner_announcement_date ?? "",
    input.timelineNotes?.step5Live?.winner_result_notification_date ?? "",
    stepSig,
  ].join("::");
}

export function recalculateProjectTimeline(input: ProjectTimelineInput): ProjectTimelineItem[] {
  if (input.project.id && input.project.id !== input.projectId) {
    return [];
  }
  return buildProjectTimelineItemsFromInput(input);
}

/** @deprecated ใช้ resolveStepMilestoneEndISO — คงไว้เพื่อ backward compat */
export function resolveStepEffectiveDateISO(
  stepNumber: number,
  project: ProjectTimelineProject,
  step3Note?: string | null,
  timelineNotes?: TimelineNotesContext | null,
): string {
  return resolveStepMilestoneEndISO(
    stepNumber,
    project,
    undefined,
    step3Note,
    undefined,
    timelineNotes,
  ).iso;
}

/** ระยะวันทำการขั้นต่ำ Fastest Path — สะสมจากวันสิ้นสุดขั้นก่อนหน้า */
export function getTimelineFastPathWorkdays(
  stepNumber: number,
  project: ProjectTimelineProject,
  step3Note?: string | null,
): number {
  switch (stepNumber) {
    case 3:
      return PROJECT_TIMELINE_ESTIMATE_STEP3_WORKDAYS;
    case 4: {
      const bidDays =
        resolveCommitteeReviewWorkdays(project, step3Note ?? null) ??
        PROJECT_TIMELINE_ESTIMATE_STEP4_DEFAULT_BID_WORKDAYS;
      return Math.max(bidDays, 1) + STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END;
    }
    case 5:
      return PROJECT_TIMELINE_ESTIMATE_STEP5_WORKDAYS;
    case 6:
      return PROJECT_TIMELINE_ESTIMATE_STEP6_WORKDAYS;
    case 7:
    case 8:
    case 9:
      return PROJECT_TIMELINE_ESTIMATE_STEP7_9_WORKDAYS_EACH;
    case 1:
    case 2:
      return 1;
    case 10:
      return 0;
    default:
      return 0;
  }
}

function buildProjectTimelineItemsFromInput(
  input: ProjectTimelineInput,
): ProjectTimelineItem[] {
  const { project, steps, step3Note, step3LiveAnnouncement, timelineNotes } = input;
  const currentStep = project.current_step;
  const stepByNum = new Map(steps.map((s) => [s.step_number, s]));

  return steps.map((s) => {
    const stepNum = s.step_number;
    const isDone = !!s.completed_at;
    const isCurrent = stepNum === currentStep && !isDone;
    const stepRecord = stepByNum.get(stepNum);

    const resolution = resolveStepMilestoneEndISO(
      stepNum,
      project,
      stepRecord,
      step3Note,
      step3LiveAnnouncement,
      timelineNotes,
    );

    const date = resolution.iso ? parseISODateLocal(resolution.iso) : null;

    return {
      stepNumber: stepNum,
      date,
      /** derived = คำนวณจาก workdays.ts (ขั้นตอนที่ 6–7) — ไม่ใช่ cascade mock */
      estimated: resolution.derived && !!date,
      isDone,
      isCurrent,
    };
  });
}

export function buildProjectTimelineItems(
  steps: ProjectTimelineStep[],
  project: ProjectTimelineProject,
  step3Note?: string | null,
  projectId?: string,
  step3LiveAnnouncement?: Step3TimelineLiveAnnouncement | null,
  timelineNotes?: TimelineNotesContext | null,
): ProjectTimelineItem[] {
  const resolvedProjectId = projectId ?? project.id ?? "";
  return recalculateProjectTimeline(
    buildProjectTimelineInput(
      resolvedProjectId,
      project,
      steps,
      step3Note,
      step3LiveAnnouncement,
      timelineNotes,
    ),
  );
}
