/**
 * Global Chronological Date Validator — ตรวจลำดับวันที่ทุกขั้นตอน (Step 1–10)
 */
import {
  chronologicalFieldKey,
  INTRA_STEP_DATE_CHAINS,
  type ChronologicalFieldKey,
  type CrossStepDateChainRule,
} from "@/lib/chronological-date-chains";
import { mergeMinDateISO } from "@/lib/chronological-lock";
import type { Step4Timeline } from "@/lib/compliance/rules/bid-timeline.rules";
import { computeStep6HeadSignedMinDateISO } from "@/lib/step6-guideline";
import {
  isStep10DeliveryBeforeContractStart,
  isStep10InspectionBeforeDelivery,
  isStep10InspectionBeforeSupervisorReport,
} from "@/lib/step10-contract";
import {
  resolvePreviousStepMilestoneEndISO,
} from "@/lib/step-milestone-dates";
import {
  computeStep5RequiredAnnouncementDateISO,
  getStep5WinnerAnnouncementDateInvalidMsg,
  isAppealReceivedBeforeStep5Notification,
  isISODateBefore,
  isStep2MedianApprovalBeforeAppointment,
  isStep4EvaluationApprovalBeforeBidEnd,
  isStep5WinnerAnnouncementDateInvalid,
  isStep7ContractorReceivedBeforeLetterDate,
  resolveStep9ContractEndDateISO,
  STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG,
  STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG,
  STEP7_RECEIVED_BEFORE_LETTER_MSG,
  STEP7_SIGNED_BEFORE_RECEIVED_MSG,
  type Step10InspectionRow,
  type Step2CommitteeOrder,
  type Step2MedianPrice,
  type Step3Announcement,
  type Step4BidResult,
  type Step5Announcement,
  type Step6AppealState,
  type Step7ContractNotice,
  type Step8ContractExecution,
  type Step9ContractSchedule,
} from "@/lib/step-form";
import {
  computeStep7MinLgExpiryFromNotice,
  isStep7LgExpiryBeforeMin,
  STEP7_LG_EXPIRY_BEFORE_WARRANTY_END_MSG,
} from "@/lib/step7-lg-expiry";
import {
  getCrossStepTimelineConflictIssues,
  getStep2TimelineDateFields,
  getStep3TimelineValidationIssues,
  getStep4TimelineDateFields,
  getStep5TimelineDateFields,
  getStep6TimelineDateFields,
  getStep7TimelineDateFields,
  getStep8TimelineDateFields,
  getStep9TimelineDateFields,
  getStep10TimelineDateFields,
  isStepDateBeforeReference,
  type TimelineValidationContext,
} from "@/lib/timeline-validation";
import { formatThaiDateSlash } from "@/lib/utils";

export type ChronologicalDateIssue = {
  id: string;
  fieldKey: ChronologicalFieldKey;
  message: string;
};

export type ChronologicalFormSnapshot = {
  step2CommitteeOrder?: Step2CommitteeOrder;
  step2MedianPrice?: Step2MedianPrice;
  step3Announcement?: Step3Announcement;
  step4BidResult?: Step4BidResult;
  step5Announcement?: Step5Announcement;
  step6Appeal?: Step6AppealState;
  step7ContractNotice?: Step7ContractNotice;
  step8ContractExecution?: Step8ContractExecution;
  step9ContractSchedule?: Step9ContractSchedule;
  step10InspectionRows?: Step10InspectionRow[];
  step4Timeline?: Step4Timeline | null;
  step2MedianApprovalDate?: string;
  step3PublicationEnd?: string;
  step5NotificationDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractSignedDate?: string;
  earliestSigningISO?: string;
  step7SigningDeadlineISO?: string;
  evaluationApprovalDate?: string;
};

function isoTrim(v: string | null | undefined): string {
  return v?.trim() ?? "";
}

function issueIfBefore(
  dependentISO: string,
  baseISO: string,
  fieldKey: ChronologicalFieldKey,
  issueId: string,
  message: string,
): ChronologicalDateIssue | null {
  const dep = isoTrim(dependentISO);
  const base = isoTrim(baseISO);
  if (!dep || !base) return null;
  if (isStepDateBeforeReference(dep, base)) {
    return { id: issueId, fieldKey, message };
  }
  return null;
}

function getStepFieldISO(
  stepNumber: number,
  fieldId: string,
  snapshot: ChronologicalFormSnapshot,
  installmentNo?: number,
): string {
  switch (stepNumber) {
    case 2:
      if (fieldId === "appointment_order_date") {
        return isoTrim(snapshot.step2CommitteeOrder?.appointment_order_date);
      }
      if (fieldId === "median_price_approval_date") {
        return isoTrim(snapshot.step2MedianPrice?.median_price_approval_date);
      }
      return "";
    case 3: {
      const a = snapshot.step3Announcement;
      if (!a) return "";
      return isoTrim((a as Record<string, string | undefined>)[fieldId]);
    }
    case 4: {
      const b = snapshot.step4BidResult;
      if (!b) return "";
      return isoTrim((b as Record<string, string | undefined>)[fieldId]);
    }
    case 5: {
      const ann = snapshot.step5Announcement;
      if (!ann) return "";
      if (fieldId === "evaluation_report_approval_date") {
        return isoTrim(
          snapshot.evaluationApprovalDate ??
            snapshot.step4BidResult?.evaluation_report_approval_date,
        );
      }
      return isoTrim((ann as Record<string, string | undefined>)[fieldId]);
    }
    case 6: {
      const appeal = snapshot.step6Appeal;
      if (!appeal) return "";
      if (fieldId === "appeal_received_date") {
        return isoTrim(appeal.appeal_received_date || appeal.appeal_report_approval_date);
      }
      return isoTrim((appeal as Record<string, string | undefined>)[fieldId]);
    }
    case 7: {
      const n = snapshot.step7ContractNotice;
      if (!n) return "";
      return isoTrim((n as Record<string, string | undefined>)[fieldId]);
    }
    case 8: {
      const e = snapshot.step8ContractExecution;
      if (!e) return "";
      return isoTrim((e as Record<string, string | undefined>)[fieldId]);
    }
    case 9: {
      const s = snapshot.step9ContractSchedule;
      if (!s) return "";
      return isoTrim((s as Record<string, string | undefined>)[fieldId]);
    }
    case 10: {
      const rows = snapshot.step10InspectionRows ?? [];
      const row =
        installmentNo != null
          ? rows.find((r) => r.installment_no === installmentNo)
          : undefined;
      if (!row) return "";
      return isoTrim((row as Record<string, string | undefined>)[fieldId]);
    }
    default:
      return "";
  }
}

const CROSS_STEP_DATE_CHAINS: CrossStepDateChainRule[] = [
  {
    stepNumber: 4,
    dependentFieldId: "evaluation_report_approval_date",
    dependentLabel: "วันที่อนุมัติผลการพิจารณา",
    resolveBaseISO: (s) => s.step4Timeline?.bidSubmissionEndISO ?? "",
    baseLabel: "วันปิดรับซอง/ประมูล",
    message: (_d, _b, iso) =>
      `❌ วันที่อนุมัติผลการพิจารณาต้องไม่ก่อนวันปิดรับซอง (${formatThaiDateSlash(iso)})`,
  },
  {
    stepNumber: 5,
    dependentFieldId: "winner_announcement_date",
    dependentLabel: "วันที่ประกาศผล",
    resolveBaseISO: (s) => {
      const evalApproval = isoTrim(
        s.evaluationApprovalDate ?? s.step4BidResult?.evaluation_report_approval_date,
      );
      return evalApproval ? computeStep5RequiredAnnouncementDateISO(evalApproval) : "";
    },
    baseLabel: "วันที่อนุมัติผลพิจารณา (+1 วันทำการ)",
    message: (_d, _b, iso) => getStep5WinnerAnnouncementDateInvalidMsg(iso),
  },
  {
    stepNumber: 6,
    dependentFieldId: "appeal_received_date",
    dependentLabel: "วันที่รับหนังสืออุทธรณ์",
    resolveBaseISO: (s) => isoTrim(s.step5NotificationDate),
    baseLabel: "วันที่แจ้งผลให้ผู้เสนอราคาทราบ",
    message: () =>
      "วันที่หน่วยงานได้รับหนังสืออุทธรณ์ต้องไม่ก่อนวันที่แจ้งผลให้ผู้เสนอราคาทราบในขั้นตอนที่ 5",
  },
  {
    stepNumber: 8,
    dependentFieldId: "contract_signed_date",
    dependentLabel: "วันที่ลงนามสัญญาจริง",
    resolveBaseISO: (s) => isoTrim(s.earliestSigningISO),
    baseLabel: "วันเริ่มลงนามในสัญญาได้",
    message: (_d, b, iso) =>
      `วันที่ลงนามสัญญาจริงต้องไม่ก่อน${b} (${formatThaiDateSlash(iso)})`,
  },
  {
    stepNumber: 9,
    dependentFieldId: "work_start_date",
    dependentLabel: "วันเริ่มต้นสัญญา",
    resolveBaseISO: (s) =>
      isoTrim(s.contractSignedDate ?? s.step8ContractExecution?.contract_signed_date),
    baseLabel: "วันที่ลงนามสัญญา",
    message: (_d, _b, iso) =>
      `วันเริ่มต้นสัญญาต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(iso)} เป็นต้นไป`,
  },
  {
    stepNumber: 9,
    dependentFieldId: "egp_essential_publication_date",
    dependentLabel: "วันที่ประกาศสาระสำคัญใน e-GP",
    resolveBaseISO: (s) =>
      isoTrim(s.contractSignedDate ?? s.step8ContractExecution?.contract_signed_date),
    baseLabel: "วันที่ลงนามสัญญา",
    message: (_d, _b, iso) =>
      `วันที่ประกาศสาระสำคัญต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(iso)} เป็นต้นไป`,
  },
];

export function getIntraStepChronologicalIssues(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
): ChronologicalDateIssue[] {
  const issues: ChronologicalDateIssue[] = [];
  const rules = INTRA_STEP_DATE_CHAINS[stepNumber] ?? [];

  for (const rule of rules) {
    const dependentISO = getStepFieldISO(stepNumber, rule.dependentFieldId, snapshot);
    const baseISO = getStepFieldISO(stepNumber, rule.baseFieldId, snapshot);
    const fieldKey = chronologicalFieldKey(stepNumber, rule.dependentFieldId);
    const hit = issueIfBefore(
      dependentISO,
      baseISO,
      fieldKey,
      `${rule.dependentFieldId}_before_${rule.baseFieldId}`,
      rule.message(rule.dependentLabel, rule.baseLabel),
    );
    if (hit) issues.push(hit);
  }

  if (stepNumber === 2) {
    const approval = isoTrim(snapshot.step2MedianPrice?.median_price_approval_date);
    const appointment = isoTrim(snapshot.step2CommitteeOrder?.appointment_order_date);
    if (approval && appointment && isStep2MedianApprovalBeforeAppointment(approval, appointment)) {
      issues.push({
        id: "median_price_approval_date_before_appointment",
        fieldKey: chronologicalFieldKey(2, "median_price_approval_date"),
        message: STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG,
      });
    }
  }

  if (stepNumber === 5) {
    const winner = isoTrim(snapshot.step5Announcement?.winner_announcement_date);
    const evalApproval = isoTrim(
      snapshot.evaluationApprovalDate ?? snapshot.step4BidResult?.evaluation_report_approval_date,
    );
    if (winner && evalApproval && isStep5WinnerAnnouncementDateInvalid(winner, evalApproval)) {
      issues.push({
        id: "winner_announcement_date_min",
        fieldKey: chronologicalFieldKey(5, "winner_announcement_date"),
        message: getStep5WinnerAnnouncementDateInvalidMsg(evalApproval),
      });
    }
    const notification = isoTrim(snapshot.step5Announcement?.winner_result_notification_date);
    if (notification && winner && notification < winner) {
      issues.push({
        id: "winner_result_notification_date_before_announcement",
        fieldKey: chronologicalFieldKey(5, "winner_result_notification_date"),
        message: STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG,
      });
    }
    const evalDate = isoTrim(snapshot.step4BidResult?.evaluation_report_approval_date);
    const bidEnd = isoTrim(snapshot.step4Timeline?.bidSubmissionEndISO);
    if (evalDate && bidEnd && isStep4EvaluationApprovalBeforeBidEnd(evalDate, bidEnd)) {
      issues.push({
        id: "evaluation_report_approval_date_before_bid_end",
        fieldKey: chronologicalFieldKey(4, "evaluation_report_approval_date"),
        message: `❌ วันที่อนุมัติผลการพิจารณาต้องไม่ก่อนวันปิดรับซอง (${formatThaiDateSlash(bidEnd)})`,
      });
    }
  }

  if (stepNumber === 6 && snapshot.step6Appeal?.appeal_status === "pending") {
    const received = isoTrim(
      snapshot.step6Appeal.appeal_received_date ||
        snapshot.step6Appeal.appeal_report_approval_date,
    );
    const notification = isoTrim(snapshot.step5NotificationDate);
    if (
      received &&
      notification &&
      isAppealReceivedBeforeStep5Notification(received, notification)
    ) {
      issues.push({
        id: "appeal_received_date_before_step5_notification",
        fieldKey: chronologicalFieldKey(6, "appeal_received_date"),
        message:
          "วันที่หน่วยงานได้รับหนังสืออุทธรณ์ต้องไม่ก่อนวันที่แจ้งผลให้ผู้เสนอราคาทราบในขั้นตอนที่ 5",
      });
    }
    const headSigned = isoTrim(snapshot.step6Appeal.appeal_head_signed_date);
    const minHead = received ? computeStep6HeadSignedMinDateISO(received) : "";
    if (headSigned && minHead && headSigned < minHead) {
      issues.push({
        id: "appeal_head_signed_date_min",
        fieldKey: chronologicalFieldKey(6, "appeal_head_signed_date"),
        message: `❌ วันที่ลงนามต้องไม่ก่อนวันที่ ${formatThaiDateSlash(minHead)}`,
      });
    }
  }

  if (stepNumber === 7 && snapshot.step7ContractNotice?.notice_outcome === "proceed_to_sign") {
    const letter = isoTrim(snapshot.step7ContractNotice.contract_notice_letter_date);
    const received = isoTrim(snapshot.step7ContractNotice.contractor_received_date);
    const signed = isoTrim(snapshot.step7ContractNotice.actual_contract_signed_date);
    if (letter && received && isStep7ContractorReceivedBeforeLetterDate(letter, received)) {
      issues.push({
        id: "contractor_received_date_before_letter",
        fieldKey: chronologicalFieldKey(7, "contractor_received_date"),
        message: STEP7_RECEIVED_BEFORE_LETTER_MSG,
      });
    }
    if (received && signed && signed < received) {
      issues.push({
        id: "actual_contract_signed_date_before_received",
        fieldKey: chronologicalFieldKey(7, "actual_contract_signed_date"),
        message: STEP7_SIGNED_BEFORE_RECEIVED_MSG,
      });
    }
    const bondType = snapshot.step7ContractNotice.performance_bond_type;
    if (
      bondType === "bank_guarantee" &&
      snapshot.step7ContractNotice.performance_bond_collection === "collect"
    ) {
      const projectContractEnd =
        isoTrim(snapshot.contractEndDate) ||
        isoTrim(resolveStep9ContractEndDateISO(snapshot.step9ContractSchedule ?? {}) ?? "");
      const minLgExpiry = computeStep7MinLgExpiryFromNotice(
        projectContractEnd,
        snapshot.step7ContractNotice,
      );
      const lgExpiry = isoTrim(snapshot.step7ContractNotice.performance_bond_lg_expiry_date);
      if (minLgExpiry && lgExpiry && isStep7LgExpiryBeforeMin(lgExpiry, minLgExpiry)) {
        issues.push({
          id: "performance_bond_lg_expiry_date_before_warranty_end",
          fieldKey: chronologicalFieldKey(7, "performance_bond_lg_expiry_date"),
          message: STEP7_LG_EXPIRY_BEFORE_WARRANTY_END_MSG(minLgExpiry),
        });
      }
    }
  }

  if (stepNumber === 9) {
    const signed = isoTrim(
      snapshot.contractSignedDate ?? snapshot.step8ContractExecution?.contract_signed_date,
    );
    const workStart = isoTrim(snapshot.step9ContractSchedule?.work_start_date);
    const egpPub = isoTrim(snapshot.step9ContractSchedule?.egp_essential_publication_date);
    const contractEnd = isoTrim(snapshot.step9ContractSchedule?.contract_end_date);
    if (workStart && signed && isISODateBefore(workStart, signed)) {
      issues.push({
        id: "work_start_date_before_signed",
        fieldKey: chronologicalFieldKey(9, "work_start_date"),
        message: `วันเริ่มต้นสัญญาต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signed)} เป็นต้นไป`,
      });
    }
    if (egpPub && signed && isISODateBefore(egpPub, signed)) {
      issues.push({
        id: "egp_publication_before_signed",
        fieldKey: chronologicalFieldKey(9, "egp_essential_publication_date"),
        message: `วันที่ประกาศสาระสำคัญต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signed)} เป็นต้นไป`,
      });
    }
    if (workStart && contractEnd && !isISODateBefore(workStart, contractEnd)) {
      issues.push({
        id: "contract_end_not_after_start",
        fieldKey: chronologicalFieldKey(9, "contract_end_date"),
        message: "❌ วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มต้นสัญญา",
      });
    }
  }

  if (stepNumber === 10) {
    const contractStart = isoTrim(snapshot.contractStartDate);
    for (const row of snapshot.step10InspectionRows ?? []) {
      const n = row.installment_no;
      const delivery = isoTrim(row.delivery_date);
      const inspection = isoTrim(row.inspection_date);
      const supervisor = isoTrim(row.supervisor_report_date);
      if (
        contractStart &&
        delivery &&
        isStep10DeliveryBeforeContractStart(contractStart, delivery)
      ) {
        issues.push({
          id: `installment-${n}-delivery_before_contract`,
          fieldKey: chronologicalFieldKey(10, `i${n}.delivery_date`),
          message: `งวดที่ ${n}: วันที่ส่งมอบงานจริงต้องไม่ก่อนวันเริ่มต้นสัญญา (${formatThaiDateSlash(contractStart)})`,
        });
      }
      if (isStep10InspectionBeforeDelivery(delivery, inspection)) {
        issues.push({
          id: `installment-${n}-inspection_before_delivery`,
          fieldKey: chronologicalFieldKey(10, `i${n}.inspection_date`),
          message: `งวดที่ ${n}: วันตรวจรับต้องไม่ก่อนวันที่คู่สัญญาส่งมอบงานจริง`,
        });
      }
      if (
        supervisor &&
        isStep10InspectionBeforeSupervisorReport(supervisor, inspection)
      ) {
        issues.push({
          id: `installment-${n}-inspection_before_supervisor`,
          fieldKey: chronologicalFieldKey(10, `i${n}.inspection_date`),
          message: `งวดที่ ${n}: วันตรวจรับต้องไม่ก่อนวันที่ผู้ควบคุมงานรายงานผลสำเร็จ`,
        });
      }
    }
  }

  return issues;
}

export function getCrossStepChronologicalIssues(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
): ChronologicalDateIssue[] {
  const issues: ChronologicalDateIssue[] = [];
  for (const rule of CROSS_STEP_DATE_CHAINS) {
    if (rule.stepNumber !== stepNumber) continue;
    const dependentISO = getStepFieldISO(stepNumber, rule.dependentFieldId, snapshot);
    const baseISO = rule.resolveBaseISO(snapshot);
    const fieldKey = chronologicalFieldKey(stepNumber, rule.dependentFieldId);
    const hit = issueIfBefore(
      dependentISO,
      baseISO,
      fieldKey,
      `cross_${rule.dependentFieldId}`,
      rule.message(rule.dependentLabel, rule.baseLabel, baseISO),
    );
    if (hit) issues.push(hit);
  }
  return issues;
}

function getTimelineDateFieldsForStep(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
) {
  switch (stepNumber) {
    case 2:
      return getStep2TimelineDateFields(
        snapshot.step2CommitteeOrder ?? {},
        snapshot.step2MedianPrice ?? {},
      );
    case 4:
      return getStep4TimelineDateFields(snapshot.step4BidResult);
    case 5:
      return getStep5TimelineDateFields(snapshot.step5Announcement ?? {});
    case 6:
      return getStep6TimelineDateFields(snapshot.step6Appeal ?? { appeal_status: "" });
    case 7:
      return getStep7TimelineDateFields(snapshot.step7ContractNotice ?? {});
    case 8:
      return getStep8TimelineDateFields(snapshot.step8ContractExecution ?? {});
    case 9:
      return getStep9TimelineDateFields(snapshot.step9ContractSchedule ?? {});
    case 10:
      return getStep10TimelineDateFields(snapshot.step10InspectionRows ?? []);
    default:
      return [];
  }
}

export function getChronologicalDateIssues(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
  timelineCtx: TimelineValidationContext,
): ChronologicalDateIssue[] {
  const issues: ChronologicalDateIssue[] = [
    ...getIntraStepChronologicalIssues(stepNumber, snapshot),
    ...getCrossStepChronologicalIssues(stepNumber, snapshot),
  ];

  if (stepNumber === 3 && snapshot.step3Announcement) {
    for (const t of getStep3TimelineValidationIssues(snapshot.step3Announcement, timelineCtx)) {
      issues.push({
        id: t.id,
        fieldKey: chronologicalFieldKey(3, t.id.split("_")[0] ?? "approval_letter_date"),
        message: t.message,
      });
    }
  } else if (stepNumber > 1) {
    const dateFields = getTimelineDateFieldsForStep(stepNumber, snapshot);
    for (const t of getCrossStepTimelineConflictIssues(stepNumber, dateFields, timelineCtx)) {
      const fieldId = t.id.replace(/^timeline_/, "").replace(/_before_step_\d+$/, "");
      issues.push({
        id: t.id,
        fieldKey: chronologicalFieldKey(stepNumber, fieldId),
        message: t.message,
      });
    }
  }

  return issues;
}

export function getFirstChronologicalDateIssue(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
  timelineCtx: TimelineValidationContext,
): ChronologicalDateIssue | null {
  return getChronologicalDateIssues(stepNumber, snapshot, timelineCtx)[0] ?? null;
}

export function getChronologicalSaveBlockMessage(
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
  timelineCtx: TimelineValidationContext,
): string | null {
  return getFirstChronologicalDateIssue(stepNumber, snapshot, timelineCtx)?.message ?? null;
}

export function resolveChronologicalFieldMinDate(
  fieldKey: ChronologicalFieldKey,
  snapshot: ChronologicalFormSnapshot,
  timelineCtx: TimelineValidationContext,
  opts?: {
    explicitMinDate?: string | null;
    additionalMinDates?: Array<string | null | undefined>;
  },
): string | undefined {
  const [stepStr, ...rest] = fieldKey.split(".");
  const stepNumber = Number(stepStr);
  const fieldId = rest.join(".");
  const installmentMatch = fieldId.match(/^i(\d+)\.(.+)$/);
  const installmentNo = installmentMatch ? Number(installmentMatch[1]) : undefined;
  const pureFieldId = installmentMatch ? installmentMatch[2] : fieldId;

  const candidates: Array<string | null | undefined> = [
    opts?.explicitMinDate,
    ...(opts?.additionalMinDates ?? []),
  ];

  const intraRules = INTRA_STEP_DATE_CHAINS[stepNumber] ?? [];
  for (const rule of intraRules) {
    if (rule.dependentFieldId === pureFieldId) {
      candidates.push(getStepFieldISO(stepNumber, rule.baseFieldId, snapshot, installmentNo));
    }
  }

  for (const rule of CROSS_STEP_DATE_CHAINS) {
    if (rule.stepNumber === stepNumber && rule.dependentFieldId === pureFieldId) {
      candidates.push(rule.resolveBaseISO(snapshot));
    }
  }

  if (stepNumber === 5 && pureFieldId === "winner_announcement_date") {
    const evalApproval = isoTrim(
      snapshot.evaluationApprovalDate ?? snapshot.step4BidResult?.evaluation_report_approval_date,
    );
    if (evalApproval) {
      candidates.push(computeStep5RequiredAnnouncementDateISO(evalApproval));
    }
  }

  if (stepNumber === 4 && pureFieldId === "evaluation_report_approval_date") {
    candidates.push(snapshot.step4Timeline?.bidSubmissionEndISO);
    candidates.push(snapshot.step3PublicationEnd);
  }

  if (stepNumber === 6 && pureFieldId === "appeal_received_date") {
    candidates.push(snapshot.step5NotificationDate);
  }
  if (stepNumber === 6 && pureFieldId === "appeal_head_signed_date") {
    const received = isoTrim(
      snapshot.step6Appeal?.appeal_received_date ||
        snapshot.step6Appeal?.appeal_report_approval_date,
    );
    if (received) candidates.push(computeStep6HeadSignedMinDateISO(received));
  }

  if (
    stepNumber === 9 &&
    (pureFieldId === "work_start_date" || pureFieldId === "egp_essential_publication_date")
  ) {
    candidates.push(
      snapshot.contractSignedDate ?? snapshot.step8ContractExecution?.contract_signed_date,
    );
  }

  if (stepNumber === 10 && pureFieldId === "delivery_date" && installmentNo != null) {
    candidates.push(snapshot.contractStartDate);
  }
  if (stepNumber === 10 && pureFieldId === "inspection_date" && installmentNo != null) {
    candidates.push(getStepFieldISO(10, "delivery_date", snapshot, installmentNo));
  }

  if (stepNumber === 7 && pureFieldId === "actual_contract_signed_date") {
    candidates.push(getStepFieldISO(7, "contractor_received_date", snapshot, installmentNo));
  }

  if (stepNumber === 7 && pureFieldId === "performance_bond_lg_expiry_date") {
    const projectContractEnd =
      isoTrim(snapshot.contractEndDate) ||
      isoTrim(resolveStep9ContractEndDateISO(snapshot.step9ContractSchedule ?? {}) ?? "");
    const minLgExpiry = computeStep7MinLgExpiryFromNotice(
      projectContractEnd,
      snapshot.step7ContractNotice ?? {
        lg_reference_contract_end_date: "",
        defect_warranty_years: null,
      },
    );
    if (minLgExpiry) candidates.push(minLgExpiry);
  }

  if (stepNumber > 1 && timelineCtx) {
    candidates.push(
      resolvePreviousStepMilestoneEndISO(
        stepNumber,
        timelineCtx.project,
        timelineCtx.steps,
        timelineCtx.step3Note,
      ),
    );
  }

  return mergeMinDateISO(...candidates);
}

export function getChronologicalFieldError(
  fieldKey: ChronologicalFieldKey,
  stepNumber: number,
  snapshot: ChronologicalFormSnapshot,
  timelineCtx: TimelineValidationContext,
): string | null {
  const issues = getChronologicalDateIssues(stepNumber, snapshot, timelineCtx);
  const direct = issues.find((i) => i.fieldKey === fieldKey);
  if (direct) return direct.message;
  const [stepStr] = fieldKey.split(".");
  const linkedStep = Number(stepStr);
  if (linkedStep !== stepNumber) {
    const linkedIssues = getChronologicalDateIssues(linkedStep, snapshot, timelineCtx);
    return linkedIssues.find((i) => i.fieldKey === fieldKey)?.message ?? null;
  }
  return null;
}
