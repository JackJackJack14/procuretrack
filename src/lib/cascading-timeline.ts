/**
 * Timeline Engine — คำนวณไทม์ไลน์ 10 ขั้นแบบ Cascading
 * ใช้วันจริงเป็น Anchor เมื่อมี — ไม่เช่นนั้นใช้ประมาณการจากขั้นก่อนหน้า
 */
import { resolveBidSubmissionWorkdays } from "@/lib/compliance/rules/bid-timeline.rules";
import {
  isoDatePart,
  resolveStep3AnnouncementFields,
  type Step3TimelineLiveAnnouncement,
  type TimelineNotesContext,
} from "@/lib/step-milestone-dates";
import {
  addWorkdays,
  APPEAL_PERIOD_WORKDAYS,
  computeAppealDeadlineISO,
  computeContractEarliestFromAppealDeadlineISO,
  MIN_DRAFT_PUBLICATION_WORKDAYS,
  parseISODateLocal,
  toISODate,
} from "@/lib/workdays";

/** ระยะเวลามาตรฐานระหว่างขั้นตอน — อ้างอิงระเบียบพัสดุฯ (ฐานคำนวณ Cascading) */
export const CASCADE_INTERVAL = {
  /** โดยเร็ว — จำลอง +2 วันทำการ */
  ASAP_WORKDAYS: 2,
  STEP1_TO_2: 2,
  STEP2_TO_3: 2,
  STEP3_INTERNAL_PUBLICATION: MIN_DRAFT_PUBLICATION_WORKDAYS,
  STEP3_TO_4: 2,
  /** ข้อ 55 — วันทำการถัดไป */
  STEP4_TO_5: 1,
  STEP6_INTERNAL_APPEAL: APPEAL_PERIOD_WORKDAYS,
  /** พ้นอุทธรณ์ — วันทำการถัดไป */
  STEP6_TO_7: 1,
  /** ระเบียบข้อ 99 — ภายใน 5 วันทำการ */
  STEP8_TO_9: 5,
  /** Worst-case baseline ขั้น 7→8 — รอนำหลักประกันมาลงนาม (วันทำการ) */
  STEP7_TO_8: 15,
} as const;

/** @deprecated ใช้ CASCADE_INTERVAL.STEP7_TO_8 */
export const CASCADE_DEFAULT_STEP7_TO_8_WORKDAYS = CASCADE_INTERVAL.STEP7_TO_8;

/** ข้อความป้ายบนเส้นเชื่อม — ถ้อยคำตามระเบียบ (ไม่แสดงตัวเลขบัฟเฟอร์ภายใน) */
export const CASCADE_CONNECTOR_LABELS = {
  "1-2": "(โดยเร็ว)",
  "2-3": "(โดยเร็ว)",
  "3-4": "(โดยเร็ว)",
  "4-5": "(วันทำการถัดไป)",
  "5-6": "(โดยเร็ว)",
  "6-7": "(พ้นกำหนดอุทธรณ์ 7 วันทำการ)",
  "7-8": "(ไม่เกิน 15 วัน)",
  "8-9": "(ภายใน 5 วันทำการ)",
  "9-10": "(ตามกำหนดในสัญญา)",
} as const;

export const CASCADE_DEFAULT_BID_SUBMISSION_WORKDAYS = 15;
export const CASCADE_DEFAULT_CONTRACT_DURATION_DAYS = 30;

export type CascadingTimelineHolidays = string[] | null | undefined;

export type CascadingTimelineStepRecord = {
  step_number: number;
  completed_at: string | null;
  due_date?: string | null;
};

export type CascadingTimelineProjectData = {
  method: string;
  budget: number;
  currentStep: number;
  createdAt: string | null;
  steps: CascadingTimelineStepRecord[];
  committeeAppointmentOrderDate?: string | null;
  medianPriceApprovalDate?: string | null;
  publicationStart?: string | null;
  publicationEnd?: string | null;
  procurementRequestApprovalDate?: string | null;
  bidSubmissionWorkdays?: number | null;
  evaluationReportApprovalDate?: string | null;
  winnerAnnouncementDate?: string | null;
  winnerResultNotificationDate?: string | null;
  contractSignedDate?: string | null;
  contractDurationDays?: number | null;
  contractEndDate?: string | null;
  egpEssentialPublicationDate?: string | null;
};

export type CascadingTimelineStep = {
  stepNumber: number;
  actualDateISO: string;
  estimatedDateISO: string;
  displayDateISO: string;
  isEstimated: boolean;
  isDone: boolean;
  isCurrent: boolean;
  internalBadge?: string;
};

export type CascadingTimelineConnector = {
  fromStep: number;
  toStep: number;
  workdays: number | null;
  label: string;
};

export type CascadingTimelineResult = {
  steps: CascadingTimelineStep[];
  connectors: CascadingTimelineConnector[];
};

function addWorkdaysISO(iso: string, workdays: number): string {
  const start = parseISODateLocal(iso?.trim() ?? "");
  if (!start || workdays < 1) return "";
  return toISODate(addWorkdays(start, workdays));
}

function addCalendarDaysISO(iso: string, days: number): string {
  const start = parseISODateLocal(iso?.trim() ?? "");
  if (!start || days < 1) return "";
  const d = new Date(start.getTime());
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function pickAnchor(actual: string | null | undefined, estimated: string): string {
  const a = actual?.trim() ?? "";
  if (a) return a;
  return estimated?.trim() ?? "";
}

function resolveBidWorkdays(data: CascadingTimelineProjectData): number {
  if (data.bidSubmissionWorkdays != null && data.bidSubmissionWorkdays > 0) {
    return data.bidSubmissionWorkdays;
  }
  const fromRules = resolveBidSubmissionWorkdays(
    {
      bid_submission_workdays: data.bidSubmissionWorkdays ?? null,
      committee_review_workdays: null,
    },
    { bid_submission_workdays: data.bidSubmissionWorkdays ?? null },
  );
  return fromRules != null && fromRules > 0
    ? fromRules
    : CASCADE_DEFAULT_BID_SUBMISSION_WORKDAYS;
}

function resolveContractDurationDays(data: CascadingTimelineProjectData): number {
  if (data.contractDurationDays != null && data.contractDurationDays > 0) {
    return Math.round(data.contractDurationDays);
  }
  return CASCADE_DEFAULT_CONTRACT_DURATION_DAYS;
}

function stepRecord(
  steps: CascadingTimelineStepRecord[],
  stepNumber: number,
): CascadingTimelineStepRecord | undefined {
  return steps.find((s) => s.step_number === stepNumber);
}

function buildConnectorSpecs(
  contractDurationDays: number,
): CascadingTimelineConnector[] {
  return [
    {
      fromStep: 1,
      toStep: 2,
      workdays: CASCADE_INTERVAL.STEP1_TO_2,
      label: CASCADE_CONNECTOR_LABELS["1-2"],
    },
    {
      fromStep: 2,
      toStep: 3,
      workdays: CASCADE_INTERVAL.STEP2_TO_3,
      label: CASCADE_CONNECTOR_LABELS["2-3"],
    },
    {
      fromStep: 3,
      toStep: 4,
      workdays: CASCADE_INTERVAL.STEP3_TO_4,
      label: CASCADE_CONNECTOR_LABELS["3-4"],
    },
    {
      fromStep: 4,
      toStep: 5,
      workdays: CASCADE_INTERVAL.STEP4_TO_5,
      label: CASCADE_CONNECTOR_LABELS["4-5"],
    },
    {
      fromStep: 5,
      toStep: 6,
      workdays: CASCADE_INTERVAL.ASAP_WORKDAYS,
      label: CASCADE_CONNECTOR_LABELS["5-6"],
    },
    {
      fromStep: 6,
      toStep: 7,
      workdays: CASCADE_INTERVAL.STEP6_INTERNAL_APPEAL,
      label: CASCADE_CONNECTOR_LABELS["6-7"],
    },
    {
      fromStep: 7,
      toStep: 8,
      workdays: CASCADE_INTERVAL.STEP7_TO_8,
      label: CASCADE_CONNECTOR_LABELS["7-8"],
    },
    {
      fromStep: 8,
      toStep: 9,
      workdays: CASCADE_INTERVAL.STEP8_TO_9,
      label: CASCADE_CONNECTOR_LABELS["8-9"],
    },
    {
      fromStep: 9,
      toStep: 10,
      workdays: contractDurationDays,
      label: CASCADE_CONNECTOR_LABELS["9-10"],
    },
  ];
}

/**
 * คำนวณไทม์ไลน์ 10 ขั้นแบบ Cascading — แกนกลางของระบบ
 * @param projectData ข้อมูลโครงการ + วันจริงที่บันทึกแล้ว
 * @param holidays วันหยุดเพิ่มเติม (yyyy-mm-dd) — สำรองสำหรับปฏิทินหน่วยงาน (ยังใช้ปฏิทินราชการในตัว)
 */
export function computeCascadingTimeline(
  projectData: CascadingTimelineProjectData,
  holidays?: CascadingTimelineHolidays,
): CascadingTimelineResult {
  void holidays;

  const { steps, currentStep } = projectData;
  const bidDays = resolveBidWorkdays(projectData);
  const contractDays = resolveContractDurationDays(projectData);
  const connectors = buildConnectorSpecs(contractDays);

  const step1Rec = stepRecord(steps, 1);
  const step1Actual =
    isoDatePart(step1Rec?.completed_at) || isoDatePart(projectData.createdAt);
  let cursor = step1Actual;
  const est1 = step1Actual;
  cursor = pickAnchor(step1Actual, est1);

  const step2Actual =
    isoDatePart(projectData.medianPriceApprovalDate) ||
    isoDatePart(projectData.committeeAppointmentOrderDate) ||
    isoDatePart(stepRecord(steps, 2)?.completed_at);
  const est2 = cursor ? addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP1_TO_2) : "";
  cursor = pickAnchor(step2Actual, est2);

  const pubStartActual = isoDatePart(projectData.publicationStart);
  const pubEndActual = isoDatePart(projectData.publicationEnd);
  const procApprovalActual = isoDatePart(projectData.procurementRequestApprovalDate);
  const est3PubStart = cursor ? addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP2_TO_3) : "";
  const est3PubEnd = addWorkdaysISO(
    pickAnchor(pubStartActual, est3PubStart),
    CASCADE_INTERVAL.STEP3_INTERNAL_PUBLICATION,
  );
  const step3Actual =
    pubEndActual || procApprovalActual || pubStartActual || isoDatePart(stepRecord(steps, 3)?.completed_at);
  const step3Est = est3PubEnd || procApprovalActual;
  cursor = pickAnchor(step3Actual, step3Est);

  const procForBid =
    procApprovalActual ||
    (cursor ? addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP3_TO_4) : "");
  const bidEndEst = procForBid ? addWorkdaysISO(procForBid, bidDays) : "";
  const step4Actual = isoDatePart(projectData.evaluationReportApprovalDate) ||
    isoDatePart(stepRecord(steps, 4)?.completed_at);
  const step4Est = bidEndEst ? addWorkdaysISO(bidEndEst, CASCADE_INTERVAL.STEP4_TO_5) : "";
  cursor = pickAnchor(step4Actual, step4Est);

  const step5Actual =
    isoDatePart(projectData.winnerAnnouncementDate) ||
    isoDatePart(stepRecord(steps, 5)?.completed_at);
  const step5Est = cursor
    ? addWorkdaysISO(cursor, CASCADE_INTERVAL.ASAP_WORKDAYS)
    : "";
  const step5Anchor = pickAnchor(step5Actual, step5Est);
  cursor = step5Anchor;

  const appealEndActual = step5Anchor ? computeAppealDeadlineISO(step5Anchor) : "";
  const step6Actual =
    appealEndActual || isoDatePart(stepRecord(steps, 6)?.completed_at);
  const step6Est = appealEndActual;
  cursor = pickAnchor(step6Actual, step6Est);

  const step7Est = cursor
    ? computeContractEarliestFromAppealDeadlineISO(cursor) ||
      addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP6_TO_7)
    : "";
  const step7Actual = isoDatePart(stepRecord(steps, 7)?.completed_at);
  cursor = pickAnchor(step7Actual, step7Est);

  const step8Actual =
    isoDatePart(projectData.contractSignedDate) ||
    isoDatePart(stepRecord(steps, 8)?.completed_at);
  const step8Est = cursor ? addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP7_TO_8) : "";
  cursor = pickAnchor(step8Actual, step8Est);

  const step9Actual =
    isoDatePart(projectData.egpEssentialPublicationDate) ||
    isoDatePart(stepRecord(steps, 9)?.completed_at) ||
    isoDatePart(stepRecord(steps, 9)?.due_date);
  const step9Est = cursor ? addWorkdaysISO(cursor, CASCADE_INTERVAL.STEP8_TO_9) : "";
  cursor = pickAnchor(step9Actual, step9Est);

  const step10Actual =
    isoDatePart(projectData.contractEndDate) ||
    isoDatePart(stepRecord(steps, 10)?.completed_at) ||
    isoDatePart(stepRecord(steps, 10)?.due_date);
  const step10Est = cursor ? addCalendarDaysISO(cursor, contractDays) : "";

  const stepDefs: Array<{
    stepNumber: number;
    actual: string;
    estimated: string;
  }> = [
    { stepNumber: 1, actual: step1Actual, estimated: est1 },
    { stepNumber: 2, actual: step2Actual, estimated: est2 },
    { stepNumber: 3, actual: step3Actual, estimated: step3Est },
    { stepNumber: 4, actual: step4Actual, estimated: step4Est },
    { stepNumber: 5, actual: step5Actual, estimated: step5Est },
    { stepNumber: 6, actual: step6Actual, estimated: step6Est },
    { stepNumber: 7, actual: step7Actual, estimated: step7Est },
    { stepNumber: 8, actual: step8Actual, estimated: step8Est },
    { stepNumber: 9, actual: step9Actual, estimated: step9Est },
    { stepNumber: 10, actual: step10Actual, estimated: step10Est },
  ];

  const cascadingSteps: CascadingTimelineStep[] = stepDefs.map((def) => {
    const rec = stepRecord(steps, def.stepNumber);
    const isDone = !!rec?.completed_at;
    const isCurrent = def.stepNumber === currentStep && !isDone;
    const hasActual = !!def.actual;
    const displayDateISO = hasActual ? def.actual : def.estimated;
    return {
      stepNumber: def.stepNumber,
      actualDateISO: def.actual,
      estimatedDateISO: def.estimated,
      displayDateISO,
      isEstimated: !hasActual && !!def.estimated,
      isDone,
      isCurrent,
    };
  });

  return { steps: cascadingSteps, connectors };
}

/** แปลง ProjectTimelineInput เป็น CascadingTimelineProjectData */
export function buildCascadingTimelineProjectData(input: {
  project: {
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
  steps: CascadingTimelineStepRecord[];
  step3Note?: string | null;
  step3LiveAnnouncement?: Step3TimelineLiveAnnouncement | null;
  timelineNotes?: TimelineNotesContext | null;
  contractDurationDays?: number | null;
  contractEndDate?: string | null;
  egpEssentialPublicationDate?: string | null;
}): CascadingTimelineProjectData {
  const ann = resolveStep3AnnouncementFields(
    input.step3Note ?? null,
    input.step3LiveAnnouncement ?? null,
  );
  const step4Live = input.timelineNotes?.step4Live;
  const step5Live = input.timelineNotes?.step5Live;

  const pick = (live?: string, ...stored: Array<string | null | undefined>) => {
    const l = live?.trim() ?? "";
    if (l) return l;
    for (const s of stored) {
      const t = s?.trim() ?? "";
      if (t) return t;
    }
    return "";
  };

  return {
    method: input.project.method,
    budget: Number(input.project.budget) || 0,
    currentStep: input.project.current_step ?? 1,
    createdAt: input.project.created_at ?? null,
    steps: input.steps,
    committeeAppointmentOrderDate: input.project.committee_appointment_order_date,
    medianPriceApprovalDate: input.project.median_price_approval_date,
    publicationStart: ann.publication_start,
    publicationEnd: ann.publication_end,
    procurementRequestApprovalDate: pick(
      undefined,
      ann.procurement_request_approval_date,
      input.project.procurement_request_approval_date,
    ),
    bidSubmissionWorkdays: ann.bid_submission_workdays ?? ann.committee_review_workdays,
    evaluationReportApprovalDate: pick(
      step4Live?.evaluation_report_approval_date,
      input.project.evaluation_report_approval_date,
    ),
    winnerAnnouncementDate: pick(
      step5Live?.winner_announcement_date,
      input.project.winner_announcement_date,
    ),
    winnerResultNotificationDate: pick(
      step5Live?.winner_result_notification_date,
      input.project.winner_result_notification_date,
    ),
    contractSignedDate: input.project.contract_signed_date,
    contractDurationDays: input.contractDurationDays,
    contractEndDate: input.contractEndDate,
    egpEssentialPublicationDate: input.egpEssentialPublicationDate,
  };
}
