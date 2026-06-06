/** ตัวเลือกวิธีจัดซื้อในฟอร์มขั้นตอนที่ 1 (3 วิธีหลัก) */
import { reviewDeadlineISO } from "@/lib/workdays";

export const STEP1_METHOD_OPTIONS = [
  { value: "e_bidding", label: "วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)" },
  { value: "selection", label: "วิธีคัดเลือก" },
  { value: "specific", label: "วิธีเฉพาะเจาะจง" },
] as const;

export type Step2Checklist = {
  draft_order_done?: boolean;
  director_signed_order?: boolean;
  committee_ack_no_conflict?: boolean;
  median_price_report_done?: boolean;
  director_signed_median_price?: boolean;
};

export type Step3Checklist = {
  committee_tor_bid_docs_done?: boolean;
  director_report_submitted?: boolean;
  draft_published_for_comment?: boolean;
};

export type Step3FeedbackResult = "none" | "has_comments" | "";

export type Step3SkipReason = "exempt" | "discretionary";

export type Step3Announcement = {
  approval_letter_no?: string;
  approval_letter_date?: string;
  egp_announcement_no?: string;
  publication_start?: string;
  publication_end?: string;
  feedback_result?: Step3FeedbackResult;
  feedback_report_no?: string;
  feedback_notes?: string;
  /** ข้ามการฟังคำวิจารณ์ (วงเงิน ≤10 ล้าน ตามดุลยพินิจ/ยกเว้น) */
  hearing_skipped?: boolean;
  skip_reason?: Step3SkipReason;
  /** วงเงิน 5–10 ล้าน — เลือกดำเนินการจัดฟังคำวิจารณ์ */
  hearing_proceed?: boolean;
  /** จัดทำรายงานขอซื้อหรือขอจ้าง */
  procurement_request_letter_no?: string;
  procurement_request_approval_date?: string;
  committee_review_workdays?: number | null;
};

/** สถานะการอุทธรณ์ — ขั้นตอนที่ 4 */
export type Step4AppealStatus = "none" | "pending" | "";

export const APPEAL_STATUS_LABELS: Record<Exclude<Step4AppealStatus, "">, string> = {
  none: "พร้อมทำสัญญา",
  pending: "ติดอุทธรณ์",
};

/** Smart Checklist — ขั้นตอนที่ 4 */
export type Step4ChecklistKey =
  | "egp_summary_downloaded"
  | "blacklist_checked"
  | "conflict_of_interest_checked"
  | "technical_price_reviewed"
  | "evaluation_report_submitted"
  | "appeal_period_checked";

export type Step4Checklist = Record<Step4ChecklistKey, boolean>;

export const STEP4_CHECKLIST_ITEMS: Array<{ key: Step4ChecklistKey; label: string }> = [
  { key: "egp_summary_downloaded", label: "ดาวน์โหลดรายงานสรุปผลจาก e-GP" },
  { key: "blacklist_checked", label: "ตรวจสอบผู้ทิ้งงาน (Blacklist) ใน e-GP" },
  { key: "conflict_of_interest_checked", label: "ตรวจสอบผลประโยชน์ร่วมกันของผู้ยื่นซอง" },
  { key: "technical_price_reviewed", label: "พิจารณาข้อเสนอเทคนิคและราคาเรียบร้อย" },
  { key: "evaluation_report_submitted", label: "จัดทำบันทึกรายงานผลพิจารณาเสนอหัวหน้าหน่วยงาน" },
  { key: "appeal_period_checked", label: "ตรวจสอบสถานะ/ระยะเวลาอุทธรณ์ 7 วันทำการ" },
];

export const EMPTY_STEP4_CHECKLIST: Step4Checklist = {
  egp_summary_downloaded: false,
  blacklist_checked: false,
  conflict_of_interest_checked: false,
  technical_price_reviewed: false,
  evaluation_report_submitted: false,
  appeal_period_checked: false,
};

/** ผลการเสนอราคา — ขั้นตอนที่ 4 (winning_bid_amount ส่งต่อมูลค่าสัญญา) */
export type Step4BidResult = {
  egp_doc_request_count?: number | null;
  egp_bid_submission_count?: number | null;
  winning_bidder_name?: string;
  /** ราคาที่เสนอชนะ (บาท) — เชื่อมโยง contract_amount ในขั้นตอนทำสัญญา */
  winning_bid_amount?: number | null;
  evaluation_report_letter_no?: string;
  evaluation_report_approval_date?: string;
  /** ขยายเวลาพิจารณาผล — เมื่ออนุมัติเกินเดดไลน์ */
  review_extension_memo_no?: string;
  review_extension_approval_date?: string;
  appeal_status?: Step4AppealStatus;
  appeal_report_letter_no?: string;
  appeal_consideration_status?: string;
};

export type Step2FormData = { checklist?: Step2Checklist };
export type Step3FormData = {
  checklist?: Step3Checklist;
  announcement?: Step3Announcement;
};
export type Step4FormData = { checklist?: Step4Checklist; bidResult?: Step4BidResult };

export type StepFormData = Step2FormData | Step3FormData | Step4FormData;

export const EMPTY_STEP4_BID_RESULT: Required<
  Omit<Step4BidResult, never>
> = {
  egp_doc_request_count: null,
  egp_bid_submission_count: null,
  winning_bidder_name: "",
  winning_bid_amount: null,
  evaluation_report_letter_no: "",
  evaluation_report_approval_date: "",
  review_extension_memo_no: "",
  review_extension_approval_date: "",
  appeal_status: "",
  appeal_report_letter_no: "",
  appeal_consideration_status: "",
};

export const EMPTY_STEP3_ANNOUNCEMENT: Required<
  Omit<Step3Announcement, "hearing_skipped" | "skip_reason" | "hearing_proceed">
> & {
  hearing_skipped: boolean;
  skip_reason: Step3SkipReason | "";
  hearing_proceed: boolean;
} = {
  approval_letter_no: "",
  approval_letter_date: "",
  egp_announcement_no: "",
  publication_start: "",
  publication_end: "",
  feedback_result: "",
  feedback_report_no: "",
  feedback_notes: "",
  procurement_request_letter_no: "",
  procurement_request_approval_date: "",
  committee_review_workdays: null,
  hearing_skipped: false,
  skip_reason: "",
  hearing_proceed: false,
};

const FORM_MARKER = "__STEP_FORM__:";

export function formatBudgetInput(v: string): string {
  const num = v.replace(/[^\d]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("th-TH").format(Number(num));
}

export function parseBudgetInput(v: string): number {
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** แยกหมายเหตุผู้ใช้ กับข้อมูลฟอร์มที่เก็บใน note (ขั้นตอนที่ 2–3) */
export function parseStepNote(note: string | null): { userNote: string; form: StepFormData } {
  if (!note) return { userNote: "", form: {} };
  const idx = note.indexOf(FORM_MARKER);
  if (idx === -1) return { userNote: note, form: {} };
  const userNote = note.slice(0, idx).trim();
  const raw = note.slice(idx + FORM_MARKER.length);
  try {
    const form = JSON.parse(raw) as StepFormData;
    return { userNote, form: form ?? {} };
  } catch {
    return { userNote: note, form: {} };
  }
}

const RESPONSIBLE_LINE = /^(?:ผู้รับผิดชอบ|เจ้าหน้าที่ผู้รับผิดชอบ):\s*(.+)$/;

/** แยกชื่อเจ้าหน้าที่ผู้รับผิดชอบ (ที่เคยเก็บในบรรทัดท้าย note) ออกจากหมายเหตุอิสระ */
export function splitNoteAndResponsible(raw: string | null): {
  userNote: string;
  responsible: string;
} {
  if (!raw) return { userNote: "", responsible: "" };
  const lines = raw.split("\n");
  const rest: string[] = [];
  let responsible = "";
  for (const line of lines) {
    const m = line.match(RESPONSIBLE_LINE);
    if (m) responsible = m[1].trim();
    else rest.push(line);
  }
  return { userNote: rest.join("\n").trim(), responsible };
}

export function formatResponsibleLine(name: string): string {
  return `เจ้าหน้าที่ผู้รับผิดชอบ: ${name.trim()}`;
}

export type StepDraftFields = {
  responsible_officer_name: string | null;
  step_notes: string | null;
  due_date: string | null;
};

/** บันทึกร่างขั้นตอน — ใช้คอลัมน์ข้อความ ไม่เขียนชื่อลง note (กัน error UUID) */
export function buildStepDraftFields(
  responsibleName: string,
  userNote: string,
  dueDate: string,
): StepDraftFields {
  return {
    responsible_officer_name: responsibleName.trim() || null,
    step_notes: userNote.trim() || null,
    due_date: dueDate?.trim() ? dueDate.trim() : null,
  };
}

type StepLike = {
  note: string | null;
  due_date?: string | null;
  responsible_officer_name?: string | null;
  step_notes?: string | null;
};

/** โหลดค่าจากคอลัมน์ใหม่ หรือถอดจาก note เก่า (backward compatible) */
export function loadStepDraftFields(step: StepLike): {
  responsible: string;
  userNote: string;
  dueDate: string;
} {
  const legacy = splitNoteAndResponsible(step.note);
  return {
    responsible: step.responsible_officer_name?.trim() || legacy.responsible,
    userNote: step.step_notes?.trim() ?? legacy.userNote,
    dueDate: step.due_date ?? "",
  };
}

/** โหลดชื่อเจ้าหน้าที่จากขั้นตอนที่ 1 (ค่ามาตรฐานทั้งโครงการ) */
export function getStep1ResponsibleOfficer(
  steps: Array<StepLike & { step_number?: number }>,
): string {
  const step1 = steps.find((s) => s.step_number === 1);
  return step1 ? loadStepDraftFields(step1).responsible : "";
}

/** ค่าเจ้าหน้าที่ผู้รับผิดชอบ — ขั้นปัจจุบัน หรือ fallback จากขั้นที่ 1 */
export function resolveResponsibleOfficer(
  step: StepLike | undefined,
  step1Default: string,
): string {
  const current = step ? loadStepDraftFields(step).responsible : "";
  return current || step1Default || "";
}

function checklistHasAnyTrue(c: Record<string, boolean | undefined> | undefined): boolean {
  if (!c) return false;
  return Object.values(c).some(Boolean);
}

function announcementHasData(a: Step3Announcement | undefined): boolean {
  if (!a) return false;
  return !!(
    a.approval_letter_no?.trim() ||
    a.approval_letter_date?.trim() ||
    a.egp_announcement_no?.trim() ||
    a.publication_start?.trim() ||
    a.publication_end?.trim() ||
    a.feedback_result ||
    a.feedback_report_no?.trim() ||
    a.feedback_notes?.trim() ||
    a.procurement_request_letter_no?.trim() ||
    a.procurement_request_approval_date?.trim() ||
    (a.committee_review_workdays != null && a.committee_review_workdays > 0) ||
    a.hearing_skipped ||
    a.hearing_proceed ||
    a.skip_reason
  );
}

/** ฟิลด์รายงานขอซื้อขอจ้าง — บันทึกลงตาราง projects (ส่งต่อขั้นตอนที่ 4) */
export function buildProjectProcurementRequestFields(announcement: Step3Announcement) {
  const days = announcement.committee_review_workdays;
  return {
    procurement_request_letter_no:
      announcement.procurement_request_letter_no?.trim() || null,
    procurement_request_approval_date:
      announcement.procurement_request_approval_date?.trim() || null,
    committee_review_workdays:
      days != null && Number.isFinite(days) && days > 0 ? Math.round(days) : null,
  };
}

/** ดึงจำนวนวันทำการพิจารณาผลจากขั้นตอนที่ 3 (project columns หรือ note JSON) */
export function resolveCommitteeReviewWorkdays(
  project: {
    committee_review_workdays?: number | null;
    procurement_request_letter_no?: string | null;
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): number | null {
  const fromProject = project?.committee_review_workdays;
  if (fromProject != null && fromProject > 0) return fromProject;
  const form = loadStep3FormFromNote(step3Note);
  const days = form.announcement?.committee_review_workdays;
  return days != null && days > 0 ? days : null;
}

export const STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG =
  "❌ วันที่อนุมัติผลพิจารณา ต้องไม่ก่อนวันสิ้นสุดการยื่นข้อเสนอ";

export const STEP4_EVALUATION_APPROVAL_OVERDUE_MSG =
  "⚠️ เกินกำหนดเวลาพิจารณาผล โปรดระบุข้อมูลการขอขยายเวลา";

/** วันเดดไลน์พิจารณาผล — วันปิดรับซอง + จำนวนวันทำการ (ขั้นตอนที่ 3) */
export function computeStep4ReviewDeadlineISO(
  bidSubmissionEndISO: string,
  committeeReviewWorkdays: number | null,
): string {
  if (!bidSubmissionEndISO || !committeeReviewWorkdays || committeeReviewWorkdays <= 0) {
    return "";
  }
  return reviewDeadlineISO(bidSubmissionEndISO, committeeReviewWorkdays);
}

/** วันนี้ (yyyy-mm-dd) ตามเวลาท้องถิ่น */
export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** วันสิ้นสุดการยื่นข้อเสนอ (วันปิดรับซอง) จากขั้นตอนที่ 3 */
export function resolveBidSubmissionEndDate(step3Note: string | null): string {
  const form = loadStep3FormFromNote(step3Note);
  return form.announcement?.publication_end?.trim() ?? "";
}

/** ค่าเริ่มต้นวันอนุมัติผลพิจารณา — วันนี้ (ไม่ต่ำกว่าวันปิดรับซอง) */
export function defaultStep4EvaluationApprovalDateISO(bidSubmissionEndISO: string): string {
  const today = todayISO();
  if (!bidSubmissionEndISO) return today;
  return today >= bidSubmissionEndISO ? today : bidSubmissionEndISO;
}

export function isStep4EvaluationApprovalBeforeBidEnd(
  approvalISO: string,
  bidSubmissionEndISO: string,
): boolean {
  const approval = approvalISO.trim();
  return !!bidSubmissionEndISO && !!approval && approval < bidSubmissionEndISO;
}

/** พิจารณาผลเกินเดดไลน์ที่คำนวณจากขั้นตอนที่ 3 */
export function isStep4EvaluationApprovalOverdue(
  approvalISO: string,
  bidSubmissionEndISO: string,
  committeeReviewWorkdays: number | null,
): boolean {
  const approval = approvalISO.trim();
  const deadline = computeStep4ReviewDeadlineISO(
    bidSubmissionEndISO,
    committeeReviewWorkdays,
  );
  if (!approval || !deadline) return false;
  return approval > deadline;
}

function step4BidResultHasData(b: Step4BidResult | undefined): boolean {
  if (!b) return false;
  return !!(
    b.egp_doc_request_count != null ||
    b.egp_bid_submission_count != null ||
    b.winning_bidder_name?.trim() ||
    (b.winning_bid_amount != null && b.winning_bid_amount > 0) ||
    b.evaluation_report_letter_no?.trim() ||
    b.evaluation_report_approval_date?.trim() ||
    b.review_extension_memo_no?.trim() ||
    b.review_extension_approval_date?.trim() ||
    b.appeal_status ||
    b.appeal_report_letter_no?.trim() ||
    b.appeal_consideration_status?.trim()
  );
}

export function isStep4AppealBlocking(bidResult: Step4BidResult): boolean {
  return bidResult.appeal_status === "pending";
}

export function isStep4ChecklistComplete(checklist: Step4Checklist): boolean {
  return STEP4_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
}

export function countStep4ChecklistDone(checklist: Step4Checklist): number {
  return STEP4_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
}

export type Step4ComplianceIssue = { id: string; message: string };

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — Checklist + ฟอร์มสำคัญ */
export function getStep4ComplianceIssues(
  checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    hasEvaluationReportDoc: boolean;
    bidSubmissionEndDate?: string;
    committeeReviewWorkdays?: number | null;
  },
): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];

  STEP4_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!checklist[item.key]) {
      issues.push({
        id: `checklist-${item.key}`,
        message: `ยังไม่ได้ติ๊กข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (
    bidResult.egp_doc_request_count == null ||
    !Number.isFinite(bidResult.egp_doc_request_count) ||
    bidResult.egp_doc_request_count < 0
  ) {
    issues.push({
      id: "egp_doc_request_count",
      message: "กรุณาระบุจำนวนผู้ขอรับ/ซื้อเอกสาร (กลุ่มที่ 1)",
    });
  }
  if (
    bidResult.egp_bid_submission_count == null ||
    !Number.isFinite(bidResult.egp_bid_submission_count) ||
    bidResult.egp_bid_submission_count < 0
  ) {
    issues.push({
      id: "egp_bid_submission_count",
      message: "กรุณาระบุจำนวนผู้ยื่นข้อเสนอและราคา (กลุ่มที่ 1)",
    });
  }
  if (!bidResult.winning_bidder_name?.trim()) {
    issues.push({
      id: "winning_bidder_name",
      message: "กรุณาระบุชื่อผู้ชนะการเสนอราคา (กลุ่มที่ 2)",
    });
  }
  if (
    bidResult.winning_bid_amount == null ||
    !Number.isFinite(bidResult.winning_bid_amount) ||
    bidResult.winning_bid_amount <= 0
  ) {
    issues.push({
      id: "winning_bid_amount",
      message: "กรุณาระบุราคาที่เสนอชนะ (กลุ่มที่ 2)",
    });
  }
  if (!bidResult.evaluation_report_letter_no?.trim()) {
    issues.push({
      id: "evaluation_report_letter_no",
      message: "กรุณาระบุเลขที่หนังสือรายงานผลการพิจารณา (กลุ่มที่ 3)",
    });
  }
  if (!bidResult.evaluation_report_approval_date?.trim()) {
    issues.push({
      id: "evaluation_report_approval_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามอนุมัติ (กลุ่มที่ 3)",
    });
  } else if (
    isStep4EvaluationApprovalBeforeBidEnd(
      bidResult.evaluation_report_approval_date,
      opts.bidSubmissionEndDate ?? "",
    )
  ) {
    issues.push({
      id: "evaluation_report_approval_date_min",
      message: STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
    });
  } else if (
    isStep4EvaluationApprovalOverdue(
      bidResult.evaluation_report_approval_date,
      opts.bidSubmissionEndDate ?? "",
      opts.committeeReviewWorkdays ?? null,
    )
  ) {
    if (!bidResult.review_extension_memo_no?.trim()) {
      issues.push({
        id: "review_extension_memo_no",
        message: "กรุณาระบุเลขที่บันทึกข้อความขอขยายเวลาพิจารณาผล",
      });
    }
    if (!bidResult.review_extension_approval_date?.trim()) {
      issues.push({
        id: "review_extension_approval_date",
        message: "กรุณาระบุวันที่หัวหน้าหน่วยงานอนุมัติขยายเวลา",
      });
    }
  }
  if (!opts.hasEvaluationReportDoc) {
    issues.push({
      id: "evaluation_report_doc",
      message: "กรุณาแนบเอกสารรายงานผลการพิจารณา (PDF) ในกลุ่มที่ 3",
    });
  }
  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบ",
    });
  }
  if (!bidResult.appeal_status) {
    issues.push({
      id: "appeal_status",
      message: "กรุณาเลือกสถานะการอุทธรณ์",
    });
  }
  if (isStep4AppealBlocking(bidResult)) {
    issues.push({
      id: "appeal_pending",
      message: "โครงการติดสถานะอุทธรณ์ — ไม่สามารถไปขั้นตอนทำสัญญาได้",
    });
  }

  return issues;
}

export function isStep4ReadyForNext(
  checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    hasEvaluationReportDoc: boolean;
    bidSubmissionEndDate?: string;
    committeeReviewWorkdays?: number | null;
  },
): boolean {
  return getStep4ComplianceIssues(checklist, bidResult, opts).length === 0;
}

function formHasPersistedData(form: StepFormData): boolean {
  if (checklistHasAnyTrue(form.checklist as Record<string, boolean | undefined> | undefined)) {
    return true;
  }
  if (announcementHasData((form as Step3FormData).announcement)) return true;
  return step4BidResultHasData((form as Step4FormData).bidResult);
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 3 จาก note */
export function loadStep3FormFromNote(note: string | null): Step3FormData {
  const { form } = parseStepNote(note);
  const f = form as Step3FormData;
  return {
    checklist: {
      committee_tor_bid_docs_done: !!f.checklist?.committee_tor_bid_docs_done,
      director_report_submitted: !!f.checklist?.director_report_submitted,
      draft_published_for_comment: !!f.checklist?.draft_published_for_comment,
    },
    announcement: {
      ...EMPTY_STEP3_ANNOUNCEMENT,
      ...f.announcement,
      feedback_result: f.announcement?.feedback_result ?? "",
      hearing_skipped: !!f.announcement?.hearing_skipped,
      hearing_proceed: !!f.announcement?.hearing_proceed,
      skip_reason: f.announcement?.skip_reason ?? "",
    },
  };
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 4 จาก note */
export function loadStep4FormFromNote(note: string | null): Step4FormData {
  const { form } = parseStepNote(note);
  const f = form as Step4FormData;
  const c = f.checklist ?? {};
  return {
    checklist: {
      egp_summary_downloaded: !!c.egp_summary_downloaded,
      blacklist_checked: !!c.blacklist_checked,
      conflict_of_interest_checked: !!c.conflict_of_interest_checked,
      technical_price_reviewed: !!c.technical_price_reviewed,
      evaluation_report_submitted: !!c.evaluation_report_submitted,
      appeal_period_checked: !!c.appeal_period_checked,
    },
    bidResult: {
      ...EMPTY_STEP4_BID_RESULT,
      ...f.bidResult,
    },
  };
}

/** ฟิลด์ผลการเสนอราคา — บันทึกลงตาราง projects */
export function buildProjectStep4Fields(bidResult: Step4BidResult) {
  const amount = bidResult.winning_bid_amount;
  return {
    egp_doc_request_count:
      bidResult.egp_doc_request_count != null &&
      Number.isFinite(bidResult.egp_doc_request_count) &&
      bidResult.egp_doc_request_count >= 0
        ? Math.round(bidResult.egp_doc_request_count)
        : null,
    egp_bid_submission_count:
      bidResult.egp_bid_submission_count != null &&
      Number.isFinite(bidResult.egp_bid_submission_count) &&
      bidResult.egp_bid_submission_count >= 0
        ? Math.round(bidResult.egp_bid_submission_count)
        : null,
    winning_bidder_name: bidResult.winning_bidder_name?.trim() || null,
    winning_bid_amount:
      amount != null && Number.isFinite(amount) && amount > 0 ? amount : null,
    evaluation_report_letter_no: bidResult.evaluation_report_letter_no?.trim() || null,
    evaluation_report_approval_date:
      bidResult.evaluation_report_approval_date?.trim() || null,
    appeal_status: bidResult.appeal_status === "none" || bidResult.appeal_status === "pending"
      ? bidResult.appeal_status
      : null,
    appeal_report_letter_no: bidResult.appeal_report_letter_no?.trim() || null,
    appeal_consideration_status: bidResult.appeal_consideration_status?.trim() || null,
  };
}

/** รวมค่าจาก project columns เข้ากับ bidResult จาก note */
export function mergeStep4BidResultFromProject(
  bidResult: Step4BidResult,
  project: {
    egp_doc_request_count?: number | null;
    egp_bid_submission_count?: number | null;
    winning_bidder_name?: string | null;
    winning_bid_amount?: number | null;
    evaluation_report_letter_no?: string | null;
    evaluation_report_approval_date?: string | null;
    appeal_status?: string | null;
    appeal_report_letter_no?: string | null;
    appeal_consideration_status?: string | null;
  } | null,
): Step4BidResult {
  if (!project) return bidResult;
  const appealFromProject =
    project.appeal_status === "none" || project.appeal_status === "pending"
      ? project.appeal_status
      : "";
  return {
    ...bidResult,
    egp_doc_request_count:
      bidResult.egp_doc_request_count != null
        ? bidResult.egp_doc_request_count
        : project.egp_doc_request_count ?? null,
    egp_bid_submission_count:
      bidResult.egp_bid_submission_count != null
        ? bidResult.egp_bid_submission_count
        : project.egp_bid_submission_count ?? null,
    winning_bidder_name:
      bidResult.winning_bidder_name?.trim() ||
      project.winning_bidder_name ||
      "",
    winning_bid_amount:
      bidResult.winning_bid_amount != null && bidResult.winning_bid_amount > 0
        ? bidResult.winning_bid_amount
        : project.winning_bid_amount ?? null,
    evaluation_report_letter_no:
      bidResult.evaluation_report_letter_no?.trim() ||
      project.evaluation_report_letter_no ||
      "",
    evaluation_report_approval_date:
      bidResult.evaluation_report_approval_date?.trim() ||
      project.evaluation_report_approval_date ||
      "",
    appeal_status:
      bidResult.appeal_status ||
      (appealFromProject as Step4AppealStatus),
    appeal_report_letter_no:
      bidResult.appeal_report_letter_no?.trim() ||
      project.appeal_report_letter_no ||
      "",
    appeal_consideration_status:
      bidResult.appeal_consideration_status?.trim() ||
      project.appeal_consideration_status ||
      "",
  };
}

export function serializeStepNote(userNote: string, form: StepFormData): string {
  if (!formHasPersistedData(form)) return userNote.trim();
  const payload = JSON.stringify(form);
  return userNote.trim() ? `${userNote.trim()}\n${FORM_MARKER}${payload}` : `${FORM_MARKER}${payload}`;
}
