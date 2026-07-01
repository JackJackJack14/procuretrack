/**
 * กฎระเบียบไทม์ไลน์การจัดซื้อจัดจ้าง — ขั้นตอนที่ 3–4
 * Pure functions รับ explicit context เท่านั้น (ไม่ parse note / ไม่ global state)
 */
import {
  bidSubmissionEndAfterPeriodISO,
  committeeReviewDeadlineAfterBidEndISO,
  isPublicationEndExtendedBeyondMinimum,
  reviewDeadlineISO,
  STEP3_PUBLICATION_EXTENSION_REASON_MSG,
  STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END,
  validateStep3PublicationDates,
} from "@/lib/workdays";
import { formatThaiDateSlash } from "@/lib/utils";

export type ComplianceIssue = { id: string; message: string };

/** ไทม์ไลน์ขั้นตอนที่ 4 — คำนวณจากข้อมูลขั้นตอนที่ 3 แบบลำดับขั้น */
export type Step4Timeline = {
  /** วันที่หัวหน้าหน่วยงานอนุมัติขอซื้อขอจ้าง (ขั้นตอนที่ 3) */
  bidPeriodStartISO: string;
  /** ระยะเวลาเผยแพร่เอกสารและยื่นข้อเสนอราคา (วันทำการ) */
  bidSubmissionWorkdays: number | null;
  /** ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ) */
  committeeReviewWorkdays: number | null;
  /** @deprecated ใช้ bidSubmissionWorkdays */
  bidPeriodWorkdays: number | null;
  /** วันสิ้นสุดการยื่นข้อเสนอ (ปิดรับซอง) */
  bidSubmissionEndISO: string;
  /** เดดไลน์คณะกรรมการพิจารณาผล — ปิดรับซอง + 1 วันทำการ (ข้อ 55) */
  committeeReviewDeadlineISO: string;
};

export type Step3AnnouncementTimelineFields = {
  publication_start?: string;
  publication_end?: string;
  procurement_request_approval_date?: string;
  procurement_request_letter_no?: string;
  bid_submission_workdays?: number | null;
  committee_review_workdays?: number | null;
  publication_end_extension_reason?: string;
};

export type Step3ProjectTimelineFields = {
  bid_submission_workdays?: number | null;
  committee_review_workdays?: number | null;
  procurement_request_approval_date?: string | null;
  procurement_request_letter_no?: string | null;
  median_price_approval_date?: string | null;
};

export type Step4EvaluationApprovalFields = {
  evaluation_report_letter_no?: string | null;
  evaluation_report_approval_date?: string | null;
};

export {
  bidSubmissionEndAfterPeriodISO,
  committeeReviewDeadlineAfterBidEndISO,
  validateStep3PublicationDates,
};

export const STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG =
  "❌ วันที่อนุมัติรายงานต้องเป็นวันหลังจากอนุมัติราคากลาง (ขั้นตอนที่ 2) และสิ้นสุดการรับฟังความคิดเห็น (ขั้นตอนที่ 3) เรียบร้อยแล้วเท่านั้น";

/** @deprecated ใช้ STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG */
export const STEP4_PROCUREMENT_APPROVAL_BEFORE_PUBLICATION_END_MSG =
  STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG;

export const STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG =
  "❌ วันที่อนุมัติผลพิจารณา ต้องไม่ก่อนวันสิ้นสุดการยื่นข้อเสนอ";

export const STEP4_EVALUATION_APPROVAL_OVERDUE_MSG =
  "⚠️ เกินกำหนดเวลาพิจารณาผล โปรดระบุข้อมูลการขอขยายเวลา";

export const STEP4_EVALUATION_APPROVAL_GATE_MSG =
  "⚠️ กรุณาระบุเลขที่หนังสือและวันที่อนุมัติผลให้ถูกต้อง เพื่อใช้สำหรับตรวจสอบและจัดทำสัญญาในขั้นตอนที่ 8";

function localTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hasExplicitBidSubmissionWorkdays(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): boolean {
  return (
    (project?.bid_submission_workdays != null && project.bid_submission_workdays > 0) ||
    (announcement?.bid_submission_workdays != null && announcement.bid_submission_workdays > 0)
  );
}

/**
 * ค่า legacy ก่อนแยกฟิลด์ — เก็บระยะรับซองไว้ใน committee_review_workdays
 * ใช้เฉพาะเมื่อยังไม่มี bid_submission_workdays ชัดเจน
 */
function resolveLegacyCombinedBidWorkdays(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): number | null {
  if (hasExplicitBidSubmissionWorkdays(project, announcement)) return null;
  const fromProject = project?.committee_review_workdays;
  if (fromProject != null && fromProject > 0) return fromProject;
  const fromAnnouncement = announcement?.committee_review_workdays;
  return fromAnnouncement != null && fromAnnouncement > 0 ? fromAnnouncement : null;
}

/** ระยะเวลาเผยแพร่เอกสารและยื่นข้อเสนอราคา (วันทำการ) */
export function resolveBidSubmissionWorkdays(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): number | null {
  const fromAnnouncement = announcement?.bid_submission_workdays;
  if (fromAnnouncement != null && fromAnnouncement > 0) return fromAnnouncement;

  const fromProject = project?.bid_submission_workdays;
  if (fromProject != null && fromProject > 0) return fromProject;

  return resolveLegacyCombinedBidWorkdays(project, announcement);
}

/** ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ) — ค่า legacy ใช้ข้อ 55 เป็นค่าเริ่มต้น */
export function resolveCommitteeReviewWorkdays(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): number | null {
  const fromAnnouncement = announcement?.committee_review_workdays;
  if (fromAnnouncement != null && fromAnnouncement > 0) return fromAnnouncement;

  if (hasExplicitBidSubmissionWorkdays(project, announcement)) {
    const fromProject = project?.committee_review_workdays;
    if (
      fromProject != null &&
      fromProject > 0 &&
      project?.bid_submission_workdays != null &&
      project.bid_submission_workdays > 0
    ) {
      return fromProject;
    }
    return STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END;
  }

  if (resolveLegacyCombinedBidWorkdays(project, announcement) != null) {
    return STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END;
  }

  return null;
}

/** วันที่อนุมัติราคากลางจากขั้นตอนที่ 2 — project columns มีลำดับก่อน step2 form */
export function resolveStep2MedianApprovalDate(
  project: { median_price_approval_date?: string | null } | null,
  step2MedianApprovalDate?: string | null,
): string {
  const fromProject = project?.median_price_approval_date?.trim();
  if (fromProject) return fromProject;
  return step2MedianApprovalDate?.trim() ?? "";
}

/** วันที่ลงนามรายงานขอซื้อขอจ้างต้องไม่ก่อนราคากลาง (ขั้นตอนที่ 2) และวันสิ้นสุดรับฟังความคิดเห็น (ขั้นตอนที่ 3) */
export function resolveStep4ProcurementSignMinDate(opts: {
  step2MedianApprovalDate?: string;
  step3PublicationEnd?: string;
}): string {
  const candidates = [
    opts.step2MedianApprovalDate?.trim(),
    opts.step3PublicationEnd?.trim(),
  ].filter(Boolean) as string[];
  if (candidates.length === 0) return "";
  return candidates.reduce((latest, iso) => (iso > latest ? iso : latest));
}

export function getStep4ProcurementSignDateIssues(
  signDate: string,
  opts: {
    step2MedianApprovalDate?: string;
    step3PublicationEnd?: string;
    /** false เมื่อข้าม/ไม่จัดรับฟังความคิดเห็นในขั้นตอนที่ 3 */
    requiresStep3PublicationEnd?: boolean;
  },
): ComplianceIssue[] {
  const approval = signDate?.trim() ?? "";
  if (!approval) return [];

  const step3End = opts.step3PublicationEnd?.trim() ?? "";
  const step2Median = opts.step2MedianApprovalDate?.trim() ?? "";
  const requiresStep3PublicationEnd = opts.requiresStep3PublicationEnd !== false;

  if (requiresStep3PublicationEnd && !step3End) {
    return [
      {
        id: "step3_publication_end_missing",
        message: "กรุณาบันทึกวันสิ้นสุดการรับฟังความคิดเห็นในขั้นตอนที่ 3 ก่อน",
      },
    ];
  }
  if (step2Median && approval < step2Median) {
    return [
      {
        id: "procurement_sign_before_median",
        message: STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG,
      },
    ];
  }
  if (requiresStep3PublicationEnd && step3End && approval < step3End) {
    return [
      {
        id: "procurement_sign_before_publication_end",
        message: STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG,
      },
    ];
  }
  return [];
}

export function isStep4ProcurementSignDateValid(
  signDate: string,
  opts: {
    step2MedianApprovalDate?: string;
    step3PublicationEnd?: string;
  },
): boolean {
  return getStep4ProcurementSignDateIssues(signDate, opts).length === 0;
}

/** @deprecated ใช้ isStep4ProcurementSignDateValid */
export function isStep4ProcurementApprovalOnOrAfterPublicationEnd(
  approvalDate: string,
  publicationEnd: string,
): boolean {
  return isStep4ProcurementSignDateValid(approvalDate, {
    step3PublicationEnd: publicationEnd,
  });
}

export function resolveStep3PublicationEnd(
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): string {
  return announcement?.publication_end?.trim() ?? "";
}

/** ตรวจเลขที่หนังสือและวันที่อนุมัติผลพิจารณา — ต้องไม่ว่าง และวันที่ ≥ วันสิ้นสุดรับฟังความคิดเห็น (ขั้น 3) */
export function getStep4EvaluationApprovalIssues(
  bidResult: Step4EvaluationApprovalFields,
  opts: { step3PublicationEnd?: string },
): ComplianceIssue[] {
  const approvalMemoNo = bidResult.evaluation_report_letter_no?.trim() ?? "";
  const approvalDateValue = bidResult.evaluation_report_approval_date?.trim() ?? "";
  const step3DateLimit = opts.step3PublicationEnd?.trim() ?? "";

  const issues: ComplianceIssue[] = [];

  if (!approvalMemoNo) {
    issues.push({
      id: "evaluation_report_letter_no",
      message: STEP4_EVALUATION_APPROVAL_GATE_MSG,
    });
  }
  if (!approvalDateValue) {
    issues.push({
      id: "evaluation_report_approval_date",
      message: STEP4_EVALUATION_APPROVAL_GATE_MSG,
    });
  } else if (step3DateLimit && approvalDateValue < step3DateLimit) {
    issues.push({
      id: "evaluation_report_approval_date",
      message: STEP4_EVALUATION_APPROVAL_GATE_MSG,
    });
  }

  return issues;
}

export function isStep4TimelineComplete(timeline: Step4Timeline): boolean {
  const bidWorkdays = timeline.bidSubmissionWorkdays ?? timeline.bidPeriodWorkdays;
  const reviewWorkdays = timeline.committeeReviewWorkdays;
  return !!(
    timeline.bidPeriodStartISO &&
    bidWorkdays != null &&
    bidWorkdays > 0 &&
    reviewWorkdays != null &&
    reviewWorkdays > 0 &&
    timeline.bidSubmissionEndISO &&
    timeline.committeeReviewDeadlineISO
  );
}

/** วันเริ่มนับรับซองราคา — อนุมัติรายงานขอซื้อขอจ้างจากขั้นตอนที่ 3 */
export function resolveBidPeriodStartDate(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): string {
  const fromProject = project?.procurement_request_approval_date?.trim();
  if (fromProject) return fromProject;
  return announcement?.procurement_request_approval_date?.trim() ?? "";
}

/** วันสิ้นสุดการยื่นข้อเสนอ = วันเริ่มรับซอง + ระยะเวลาจากขั้นตอนที่ 3 */
export function computeBidSubmissionEndISO(
  bidPeriodStartISO: string,
  bidPeriodWorkdays: number | null,
): string {
  if (!bidPeriodStartISO || bidPeriodWorkdays == null || bidPeriodWorkdays <= 0) {
    return "";
  }
  return bidSubmissionEndAfterPeriodISO(bidPeriodStartISO, bidPeriodWorkdays);
}

/** คำนวณไทม์ไลน์ขั้นตอนที่ 4 ครบชุดจากข้อมูลขั้นตอนที่ 3 */
export function computeStep4Timeline(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): Step4Timeline {
  const bidPeriodStartISO = resolveBidPeriodStartDate(project, announcement);
  const bidSubmissionWorkdays = resolveBidSubmissionWorkdays(project, announcement);
  const committeeReviewWorkdays = resolveCommitteeReviewWorkdays(project, announcement);
  const bidSubmissionEndISO = computeBidSubmissionEndISO(
    bidPeriodStartISO,
    bidSubmissionWorkdays,
  );
  const committeeReviewDeadlineISO =
    bidSubmissionEndISO && committeeReviewWorkdays != null && committeeReviewWorkdays > 0
      ? reviewDeadlineISO(bidSubmissionEndISO, committeeReviewWorkdays)
      : committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO);
  return {
    bidPeriodStartISO,
    bidSubmissionWorkdays,
    committeeReviewWorkdays,
    bidPeriodWorkdays: bidSubmissionWorkdays,
    bidSubmissionEndISO,
    committeeReviewDeadlineISO,
  };
}

/** ข้อความกำหนดการอ่านอย่างเดียว — ขั้นตอนที่ 4 (2 บรรทัด) */
export function getStep4TimelineDisplayLines(timeline: Step4Timeline): {
  bidSubmissionEndLine: string;
  committeeDeadlineLine: string;
} | null {
  if (!isStep4TimelineComplete(timeline)) return null;
  return {
    bidSubmissionEndLine: `📅 วันสิ้นสุดการรับซองราคา: ${formatThaiDateSlash(timeline.bidSubmissionEndISO)}`,
    committeeDeadlineLine:
      `⏱ กำหนดเดดไลน์คณะกรรมการ: ต้องพิจารณาผลให้แล้วเสร็จภายในวันที่ ` +
      `${formatThaiDateSlash(timeline.committeeReviewDeadlineISO)} ` +
      `(ตามระเบียบกระทรวงการคลังฯ ข้อ 55)`,
  };
}

/** @deprecated ใช้ getStep4TimelineDisplayLines แทน */
export function buildStep4CommitteeScheduleMessage(timeline: Step4Timeline): string {
  const lines = getStep4TimelineDisplayLines(timeline);
  if (!lines) return "";
  return `${lines.committeeDeadlineLine}`;
}

/** วันเดดไลน์พิจารณาผลคณะกรรมการ — วันสิ้นสุดการยื่นข้อเสนอ + 1 วันทำการ (ข้อ 55) */
export function computeStep4ReviewDeadlineISO(bidSubmissionEndISO: string): string {
  return committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO);
}

/** @deprecated ใช้ computeStep4Timeline().bidSubmissionEndISO แทน */
export function resolveBidSubmissionEndDate(
  project: Step3ProjectTimelineFields | null,
  announcement: Step3AnnouncementTimelineFields | null | undefined,
): string {
  return computeStep4Timeline(project, announcement).bidSubmissionEndISO;
}

/** ค่าเริ่มต้นวันอนุมัติผลพิจารณา — วันนี้ (ไม่ต่ำกว่าเดดไลน์คณะกรรมการ) */
export function defaultStep4EvaluationApprovalDateISO(
  committeeReviewDeadlineISO: string,
): string {
  const today = localTodayISO();
  if (!committeeReviewDeadlineISO) return today;
  return today >= committeeReviewDeadlineISO ? today : committeeReviewDeadlineISO;
}

export function isStep4EvaluationApprovalBeforeBidEnd(
  approvalISO: string,
  bidSubmissionEndISO: string,
): boolean {
  const approval = approvalISO.trim();
  return !!bidSubmissionEndISO && !!approval && approval < bidSubmissionEndISO;
}

/** พิจารณาผลเกินเดดไลน์ — หลังเดดไลน์คณะกรรมการ (ปิดรับซอง + 1 วันทำการ ข้อ 55) */
export function isStep4EvaluationApprovalOverdue(
  approvalISO: string,
  committeeReviewDeadlineISO: string,
): boolean {
  const approval = approvalISO.trim();
  if (!approval || !committeeReviewDeadlineISO) return false;
  return approval > committeeReviewDeadlineISO;
}

// ─── Step 3: ความขัดแย้งของวันที่ ───────────────────────────────────────────

export function step3RequiresPublicationExtensionReason(
  announcement: Step3AnnouncementTimelineFields,
): boolean {
  return isPublicationEndExtendedBeyondMinimum(
    announcement.publication_start ?? "",
    announcement.publication_end ?? "",
  );
}

export function isStep3ProcurementApprovalDateValid(
  announcement: Step3AnnouncementTimelineFields,
  hearingFormActive = true,
): boolean {
  const procDate = announcement.procurement_request_approval_date?.trim() ?? "";
  if (!procDate) return false;
  if (!hearingFormActive) return true;
  const pubEnd = announcement.publication_end?.trim() ?? "";
  if (pubEnd && procDate < pubEnd) return false;
  return true;
}

/** ตรวจความขัดแย้งวันที่ลงนามรายงานขอซื้อขอจ้าง vs วันสิ้นสุดเผยแพร่ (ขั้นตอนที่ 3) */
export function getStep3ProcurementApprovalDateIssues(
  announcement: Step3AnnouncementTimelineFields,
  opts?: { hearingFormActive?: boolean },
): ComplianceIssue[] {
  const hearingFormActive = opts?.hearingFormActive !== false;
  const procDate = announcement.procurement_request_approval_date?.trim() ?? "";
  if (!procDate) return [];
  if (isStep3ProcurementApprovalDateValid(announcement, hearingFormActive)) return [];
  return [
    {
      id: "procurement_request_approval_before_publication_end",
      message:
        "วันที่หัวหน้าหน่วยงานลงนามต้องไม่ก่อนวันสิ้นสุดการเผยแพร่ร่างประกาศ",
    },
  ];
}

/** ตรวจเหตุผลขยายระยะเผยแพร่เมื่อเกินเกณฑ์ขั้นต่ำ (ขั้นตอนที่ 3) */
export function getStep3PublicationExtensionIssues(
  announcement: Step3AnnouncementTimelineFields,
  opts?: { hearingFormActive?: boolean },
): ComplianceIssue[] {
  const hearingFormActive = opts?.hearingFormActive !== false;
  if (
    hearingFormActive &&
    step3RequiresPublicationExtensionReason(announcement) &&
    !announcement.publication_end_extension_reason?.trim()
  ) {
    return [
      {
        id: "publication_end_extension_reason",
        message: STEP3_PUBLICATION_EXTENSION_REASON_MSG,
      },
    ];
  }
  return [];
}
