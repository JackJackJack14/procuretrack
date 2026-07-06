/**
 * ไทม์ไลน์โครงการ — Cascading Timeline Engine + ประมาณการล่วงหน้า
 */
import { resolveWorkflowProcurementMethod } from "@/lib/project-workflow-core";
import {
  buildCascadingTimelineProjectData,
  computeCascadingTimeline,
  CASCADE_INTERVAL,
  type CascadingTimelineConnector,
} from "@/lib/cascading-timeline";
import { mergeStep6AppealFromSources } from "@/lib/step-form";
import {
  isoDatePart,
  resolveStep1PlanPublicationDateISO,
  type Step3TimelineLiveAnnouncement,
  type TimelineNotesContext,
} from "@/lib/step-milestone-dates";
import { parseISODateLocal } from "@/lib/workdays";

export { resolveStepMilestoneEndISO, resolveStep1PlanPublicationDateISO } from "@/lib/step-milestone-dates";
export {
  computeCascadingTimeline,
  buildCascadingTimelineProjectData,
  CASCADE_INTERVAL,
  CASCADE_CONNECTOR_LABELS,
  CASCADE_DEFAULT_STEP7_TO_8_WORKDAYS,
  TIMELINE_HOLD_LABEL,
  TIMELINE_HOLD_LABEL_ALT,
  isTimelineHeldByPendingAppeal,
  type CascadingTimelineProjectData,
  type CascadingTimelineResult,
} from "@/lib/cascading-timeline";

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
  contract_signed_date?: string | null;
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
  /** ป้ายระยะเวลาภายในขั้น (เช่น เผยแพร่ +3 วันทำการ) */
  internalBadge?: string;
  /** true = แช่แข็งปฏิทิน (ติดอุทธรณ์) */
  isOnHold?: boolean;
  holdLabel?: string;
};

export type ProjectTimelineConnector = CascadingTimelineConnector;

export type ProjectTimelineResult = {
  items: ProjectTimelineItem[];
  connectors: ProjectTimelineConnector[];
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
  /** ระยะสัญญา (ขั้น 9) — สำหรับประมาณการขั้น 10 */
  contractDurationDays?: number | null;
  contractEndDate?: string | null;
  egpEssentialPublicationDate?: string | null;
  /** Form State สด — reactive trigger เมื่อแก้ DatePicker */
  step2Live?: {
    median_price_approval_date?: string;
    appointment_order_date?: string;
  } | null;
  step8Live?: { contract_signed_date?: string } | null;
  step9Live?: {
    contract_duration_days?: number | null;
    contract_end_date?: string;
    egp_essential_publication_date?: string;
  } | null;
  step6Note?: string | null;
  step6Live?: {
    appeal_status?: string;
    appeal_resolved_date?: string;
    appeal_committee_decision?: string;
  } | null;
  projectAppealStatus?: string | null;
};

export function snapshotTimelineProject(
  project: ProjectTimelineProject,
): ProjectTimelineProject {
  return {
    id: project.id,
    method: resolveWorkflowProcurementMethod({ projectMethod: project.method }),
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
    contract_signed_date: project.contract_signed_date ?? null,
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
  extras?: {
    contractDurationDays?: number | null;
    contractEndDate?: string | null;
    egpEssentialPublicationDate?: string | null;
    step2Live?: ProjectTimelineInput["step2Live"];
    step8Live?: ProjectTimelineInput["step8Live"];
    step9Live?: ProjectTimelineInput["step9Live"];
    step6Note?: string | null;
    step6Live?: ProjectTimelineInput["step6Live"];
    projectAppealStatus?: string | null;
  },
): ProjectTimelineInput {
  return {
    projectId,
    project: snapshotTimelineProject(project),
    steps: snapshotTimelineSteps(steps),
    step3Note: step3Note ?? null,
    step3LiveAnnouncement: step3LiveAnnouncement ?? null,
    timelineNotes: timelineNotes ?? null,
    contractDurationDays: extras?.contractDurationDays ?? extras?.step9Live?.contract_duration_days,
    contractEndDate: extras?.contractEndDate ?? extras?.step9Live?.contract_end_date,
    egpEssentialPublicationDate:
      extras?.egpEssentialPublicationDate ?? extras?.step9Live?.egp_essential_publication_date,
    step2Live: extras?.step2Live ?? null,
    step8Live: extras?.step8Live ?? null,
    step9Live: extras?.step9Live ?? null,
    step6Note: extras?.step6Note ?? null,
    step6Live: extras?.step6Live ?? null,
    projectAppealStatus: extras?.projectAppealStatus ?? null,
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
    isoDatePart(p.contract_signed_date),
    input.step3Note ?? "",
    input.step3LiveAnnouncement?.publication_start ?? "",
    input.step3LiveAnnouncement?.publication_end ?? "",
    input.step3LiveAnnouncement?.procurement_request_approval_date ?? "",
    input.step3LiveAnnouncement?.committee_review_workdays ?? "",
    input.step3LiveAnnouncement?.bid_submission_workdays ?? "",
    input.timelineNotes?.step4Note ?? "",
    input.timelineNotes?.step5Note ?? "",
    input.timelineNotes?.step4Live?.evaluation_report_approval_date ?? "",
    input.timelineNotes?.step5Live?.winner_announcement_date ?? "",
    input.timelineNotes?.step5Live?.winner_result_notification_date ?? "",
    input.contractDurationDays ?? "",
    input.contractEndDate ?? "",
    input.egpEssentialPublicationDate ?? "",
    input.step2Live?.median_price_approval_date ?? "",
    input.step2Live?.appointment_order_date ?? "",
    input.step8Live?.contract_signed_date ?? "",
    input.step9Live?.contract_duration_days ?? "",
    input.step9Live?.contract_end_date ?? "",
    input.step9Live?.egp_essential_publication_date ?? "",
    input.step6Note ?? "",
    input.step6Live?.appeal_status ?? "",
    input.step6Live?.appeal_resolved_date ?? "",
    input.step6Live?.appeal_committee_decision ?? "",
    input.projectAppealStatus ?? "",
    stepSig,
  ].join("::");
}

function resolveTimelineAppealForInput(input: ProjectTimelineInput): {
  appealStatus: "none" | "pending" | "";
  appealResolvedDate: string;
  appealCommitteeDecision: "upheld" | "not_upheld" | "";
} {
  const merged = mergeStep6AppealFromSources(input.step6Note ?? null, {
    appeal_status: input.projectAppealStatus ?? null,
  });
  const liveStatus = input.step6Live?.appeal_status;
  const appealStatus =
    liveStatus === "none" || liveStatus === "pending"
      ? liveStatus
      : merged.appeal_status === "none" || merged.appeal_status === "pending"
        ? merged.appeal_status
        : "";
  const appealResolvedDate =
    input.step6Live?.appeal_resolved_date?.trim() ||
    merged.appeal_resolved_date?.trim() ||
    "";
  const liveDecision = input.step6Live?.appeal_committee_decision;
  const mergedDecision = merged.appeal_committee_decision ?? "";
  const appealCommitteeDecision =
    liveDecision === "upheld" || liveDecision === "not_upheld"
      ? liveDecision
      : mergedDecision === "upheld" || mergedDecision === "not_upheld"
        ? mergedDecision
        : "";
  return { appealStatus, appealResolvedDate, appealCommitteeDecision };
}

function buildItemsFromCascading(input: ProjectTimelineInput): ProjectTimelineResult {
  const { appealStatus, appealResolvedDate, appealCommitteeDecision } =
    resolveTimelineAppealForInput(input);
  const projectData = buildCascadingTimelineProjectData({
    project: {
      ...input.project,
      median_price_approval_date: pickLiveStr(
        input.step2Live?.median_price_approval_date,
        input.project.median_price_approval_date,
      ),
      committee_appointment_order_date: pickLiveStr(
        input.step2Live?.appointment_order_date,
        input.project.committee_appointment_order_date,
      ),
      contract_signed_date: pickLiveStr(
        input.step8Live?.contract_signed_date,
        input.project.contract_signed_date,
      ),
    },
    steps: input.steps,
    step3Note: input.step3Note,
    step3LiveAnnouncement: input.step3LiveAnnouncement,
    timelineNotes: input.timelineNotes,
    contractDurationDays: input.contractDurationDays ?? input.step9Live?.contract_duration_days,
    contractEndDate: input.contractEndDate ?? input.step9Live?.contract_end_date,
    egpEssentialPublicationDate:
      input.egpEssentialPublicationDate ?? input.step9Live?.egp_essential_publication_date,
    appealStatus,
    appealResolvedDate,
    appealCommitteeDecision,
  });

  const cascading = computeCascadingTimeline(projectData);

  const items: ProjectTimelineItem[] = cascading.steps.map((step) => ({
    stepNumber: step.stepNumber,
    date: step.isOnHold ? null : step.displayDateISO ? parseISODateLocal(step.displayDateISO) : null,
    estimated: step.isEstimated,
    isDone: step.isDone,
    isCurrent: step.isCurrent,
    internalBadge: step.internalBadge,
    isOnHold: step.isOnHold,
    holdLabel: step.holdLabel,
  }));

  return { items, connectors: cascading.connectors };
}

function pickLiveStr(live?: string, stored?: string | null): string | null {
  const l = live?.trim() ?? "";
  if (l) return l;
  return stored ?? null;
}

export function recalculateProjectTimeline(input: ProjectTimelineInput): ProjectTimelineItem[] {
  return recalculateProjectTimelineWithConnectors(input).items;
}

export function recalculateProjectTimelineWithConnectors(
  input: ProjectTimelineInput,
): ProjectTimelineResult {
  if (input.project.id && input.project.id !== input.projectId) {
    return { items: [], connectors: [] };
  }
  return buildItemsFromCascading(input);
}

/** @deprecated ใช้ resolveStepMilestoneEndISO — คงไว้เพื่อ backward compat */
export function resolveStepEffectiveDateISO(
  stepNumber: number,
  project: ProjectTimelineProject,
  step3Note?: string | null,
  timelineNotes?: TimelineNotesContext | null,
): string {
  const input = buildProjectTimelineInput(
    project.id ?? "",
    project,
    [],
    step3Note,
    null,
    timelineNotes,
  );
  const result = computeCascadingTimeline(
    buildCascadingTimelineProjectData({
      project: input.project,
      steps: input.steps,
      step3Note: input.step3Note,
      timelineNotes: input.timelineNotes,
    }),
  );
  return result.steps.find((s) => s.stepNumber === stepNumber)?.displayDateISO ?? "";
}

/** @deprecated ใช้ CASCADE_INTERVAL แทน */
export function getTimelineFastPathWorkdays(stepNumber: number): number {
  switch (stepNumber) {
    case 2:
      return CASCADE_INTERVAL.STEP1_TO_2;
    case 3:
      return CASCADE_INTERVAL.STEP2_TO_3 + CASCADE_INTERVAL.STEP3_INTERNAL_PUBLICATION;
    case 4:
      return CASCADE_INTERVAL.STEP3_TO_4;
    case 5:
      return CASCADE_INTERVAL.STEP4_TO_5;
    case 6:
      return CASCADE_INTERVAL.STEP6_INTERNAL_APPEAL;
    case 7:
      return CASCADE_INTERVAL.STEP6_TO_7;
    case 8:
      return CASCADE_INTERVAL.STEP7_TO_8;
    case 9:
      return CASCADE_INTERVAL.STEP8_TO_9;
    default:
      return 0;
  }
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
