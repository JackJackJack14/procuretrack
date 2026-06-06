/** ตัวเลือกวิธีจัดซื้อในฟอร์มขั้นตอนที่ 1 (3 วิธีหลัก) */
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

export type Step2FormData = { checklist?: Step2Checklist };
export type Step3FormData = {
  checklist?: Step3Checklist;
  announcement?: Step3Announcement;
};

export type StepFormData = Step2FormData | Step3FormData;

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

function formHasPersistedData(form: StepFormData): boolean {
  if (checklistHasAnyTrue(form.checklist as Record<string, boolean | undefined> | undefined)) {
    return true;
  }
  return announcementHasData((form as Step3FormData).announcement);
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

export function serializeStepNote(userNote: string, form: StepFormData): string {
  if (!formHasPersistedData(form)) return userNote.trim();
  const payload = JSON.stringify(form);
  return userNote.trim() ? `${userNote.trim()}\n${FORM_MARKER}${payload}` : `${FORM_MARKER}${payload}`;
}
