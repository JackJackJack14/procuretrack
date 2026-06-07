/** ตัวเลือกวิธีจัดซื้อในฟอร์มขั้นตอนที่ 1 (3 วิธีหลัก) */
import {
  countWorkdaysAfterStartISO,
  countWorkdaysBetweenISO,
  reviewDeadlineISO,
  validateStep3PublicationDates,
} from "@/lib/workdays";

export const STEP1_METHOD_OPTIONS = [
  { value: "e_bidding", label: "วิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)" },
  { value: "selection", label: "วิธีคัดเลือก" },
  { value: "specific", label: "วิธีเฉพาะเจาะจง" },
] as const;

/** Smart Checklist — ขั้นตอนที่ 1 */
export type Step1ChecklistKey =
  | "budget_allocated_confirmed"
  | "annual_plan_published"
  | "egp_plan_code_verified"
  | "project_name_and_type_verified"
  | "responsible_officer_confirmed";

export type Step1Checklist = Record<Step1ChecklistKey, boolean>;

export const STEP1_CHECKLIST_ITEMS: Array<{ key: Step1ChecklistKey; label: string }> = [
  { key: "budget_allocated_confirmed", label: "ตรวจสอบและยืนยันการได้รับจัดสรรงบประมาณ" },
  {
    key: "annual_plan_published",
    label: 'จัดทำและเผยแพร่ "แผนการจัดซื้อจัดจ้างประจำปี" ขึ้นระบบ e-GP',
  },
  { key: "egp_plan_code_verified", label: 'ตรวจสอบ "รหัสแผนจัดซื้อจัดจ้าง e-GP" ให้ถูกต้อง' },
  {
    key: "project_name_and_type_verified",
    label: 'ตรวจสอบ "ชื่อโครงการ" และ "ประเภทพัสดุ" ให้ตรงกับแผนฯ',
  },
  {
    key: "responsible_officer_confirmed",
    label: 'ยืนยันรายชื่อ "เจ้าหน้าที่ผู้รับผิดชอบโครงการ"',
  },
];

export const EMPTY_STEP1_CHECKLIST: Step1Checklist = {
  budget_allocated_confirmed: false,
  annual_plan_published: false,
  egp_plan_code_verified: false,
  project_name_and_type_verified: false,
  responsible_officer_confirmed: false,
};

/** Smart Checklist — ขั้นตอนที่ 2 */
export type Step2ChecklistKey =
  | "committee_composition_verified"
  | "committee_qualifications_verified"
  | "appointment_order_signed"
  | "median_price_calculated"
  | "median_price_director_signed"
  | "bg06_table_prepared";

export type Step2Checklist = Record<Step2ChecklistKey, boolean>;

export const STEP2_CHECKLIST_ITEMS: Array<{ key: Step2ChecklistKey; label: string }> = [
  { key: "committee_composition_verified", label: "ตรวจสอบองค์ประกอบและจำนวนคณะกรรมการ" },
  { key: "committee_qualifications_verified", label: "ตรวจสอบคุณสมบัติผู้ที่จะได้รับแต่งตั้งเป็นกรรมการ" },
  {
    key: "appointment_order_signed",
    label: 'จัดทำและเสนอลงนาม "คำสั่งแต่งตั้งคณะกรรมการ..."',
  },
  { key: "median_price_calculated", label: 'คณะกรรมการดำเนินการคำนวณและสรุป "ราคากลาง"' },
  { key: "median_price_director_signed", label: 'หัวหน้าหน่วยงานของรัฐลงนาม "อนุมัติราคากลาง"' },
  {
    key: "bg06_table_prepared",
    label: "จัดทำตารางแสดงวงเงินงบประมาณและราคากลาง (แบบ บก.06)",
  },
];

export const EMPTY_STEP2_CHECKLIST: Step2Checklist = {
  committee_composition_verified: false,
  committee_qualifications_verified: false,
  appointment_order_signed: false,
  median_price_calculated: false,
  median_price_director_signed: false,
  bg06_table_prepared: false,
};

/** ข้อมูลคำสั่งแต่งตั้งคณะกรรมการ — ขั้นตอนที่ 2 */
export type Step2CommitteeOrder = {
  appointment_order_no?: string;
  appointment_order_date?: string;
};

/** ข้อมูลราคากลาง — ขั้นตอนที่ 2 */
export type Step2MedianPrice = {
  approved_median_price?: number | null;
  median_price_approval_date?: string;
};

export const EMPTY_STEP2_COMMITTEE_ORDER: Required<Step2CommitteeOrder> = {
  appointment_order_no: "",
  appointment_order_date: "",
};

export const EMPTY_STEP2_MEDIAN_PRICE: Required<
  Omit<Step2MedianPrice, never>
> = {
  approved_median_price: null,
  median_price_approval_date: "",
};

/** ประเภทคณะกรรมการใน DB — ขั้นตอนที่ 2 (ตรง check constraint บน Supabase) */
export const STEP2_COMMITTEE_TYPE = {
  /** โหมดชุดเดียว — บันทึกเป็น tor (คณะเดียวทำ TOR + ราคากlาง) */
  COMBINED: "tor",
  TOR: "tor",
  MEDIAN: "price_median",
} as const;

/** ค่า committee_type ที่อาจมีใน DB — ใช้ลบ/โหลด (รวม legacy จาก migration เก่า) */
export const STEP2_COMMITTEE_DB_TYPES = [
  STEP2_COMMITTEE_TYPE.TOR,
  STEP2_COMMITTEE_TYPE.MEDIAN,
  "tor_and_median",
  "median_price",
] as const;

/** โปรไฟล์ค่า committee_type สำหรับ insert — ลองตามลำดับเมื่อ DB constraint ยังไม่อัปเดต */
export type Step2CommitteeInsertProfile = {
  combined: string;
  tor: string;
  median: string;
};

export const STEP2_COMMITTEE_INSERT_PROFILES: Step2CommitteeInsertProfile[] = [
  { combined: "tor", tor: "tor", median: "price_median" },
  { combined: "tor", tor: "tor", median: "median_price" },
  { combined: "tor_and_median", tor: "tor", median: "median_price" },
  { combined: "tor", tor: "tor", median: "tor" },
];

const STEP2_COMMITTEE_LEGACY_COMBINED = "tor_and_median";
const STEP2_COMMITTEE_LEGACY_MEDIAN = "median_price";

export function isStep2CommitteeTypeCheckError(message: string): boolean {
  return message.includes("committees_committee_type_check");
}

function isStep2MedianCommitteeType(committeeType: string): boolean {
  return (
    committeeType === STEP2_COMMITTEE_TYPE.MEDIAN ||
    committeeType === STEP2_COMMITTEE_LEGACY_MEDIAN
  );
}

export type Step2CommitteeListKey = "combined_members" | "tor_members" | "median_price_members";

/** รูปแบบการแต่งตั้งคณะกรรมการ — ขั้นตอนที่ 2 */
export type Step2CommitteeAppointmentMode = "combined" | "separate";

export type Step2CommitteesState = {
  appointment_mode: Step2CommitteeAppointmentMode;
  combined_members: string[];
  tor_members: string[];
  median_price_members: string[];
};

export const EMPTY_STEP2_COMMITTEES: Step2CommitteesState = {
  appointment_mode: "combined",
  combined_members: ["", "", ""],
  tor_members: ["", "", ""],
  median_price_members: ["", "", ""],
};

function padCommitteeMemberList(names: string[]): string[] {
  const trimmed = names.map((n) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) return ["", "", ""];
  return trimmed.length >= 3
    ? trimmed
    : [...trimmed, ...Array(Math.max(0, 3 - trimmed.length)).fill("")];
}

/** โหลดรายชื่อคณะกรรมการจากตาราง committees + โหมดที่บันทึกไว้ */
export function loadStep2CommitteesFromDb(
  rows: Array<{ committee_type: string; member_name: string }>,
  savedMode?: Step2CommitteeAppointmentMode | string | null,
  noteBackup?: Partial<Step2CommitteesState> | null,
): Step2CommitteesState {
  const combined = rows
    .filter((r) => r.committee_type === STEP2_COMMITTEE_LEGACY_COMBINED)
    .map((r) => r.member_name);
  const tor = rows
    .filter((r) => r.committee_type === STEP2_COMMITTEE_TYPE.TOR)
    .map((r) => r.member_name);
  const median = rows
    .filter((r) => isStep2MedianCommitteeType(r.committee_type))
    .map((r) => r.member_name);

  const modeFromProject =
    savedMode === "separate" || savedMode === "combined" ? savedMode : null;
  const modeFromNote =
    noteBackup?.appointment_mode === "separate" || noteBackup?.appointment_mode === "combined"
      ? noteBackup.appointment_mode
      : null;

  let appointment_mode: Step2CommitteeAppointmentMode =
    modeFromProject ?? modeFromNote ?? "combined";

  if (!modeFromProject && !modeFromNote) {
    if (tor.length > 0 && median.length > 0) appointment_mode = "separate";
    else if (combined.length > 0) appointment_mode = "combined";
    else if (tor.length > 0 && median.length === 0) appointment_mode = "combined";
  }

  if (appointment_mode === "separate") {
    return {
      appointment_mode: "separate",
      combined_members: padCommitteeMemberList(noteBackup?.combined_members ?? []),
      tor_members: padCommitteeMemberList(
        tor.length > 0 ? tor : (noteBackup?.tor_members ?? []),
      ),
      median_price_members: padCommitteeMemberList(
        median.length > 0 ? median : (noteBackup?.median_price_members ?? []),
      ),
    };
  }

  const combinedSource =
    combined.length > 0 ? combined : tor.length > 0 ? tor : (noteBackup?.combined_members ?? []);
  return {
    appointment_mode: "combined",
    combined_members: padCommitteeMemberList(combinedSource),
    tor_members: padCommitteeMemberList(noteBackup?.tor_members ?? []),
    median_price_members: padCommitteeMemberList(noteBackup?.median_price_members ?? []),
  };
}

export type Step2CommitteeRow = {
  organization_id: string;
  project_id: string;
  committee_type: string;
  member_name: string;
  position: string;
  appointment_date: null;
};

/** สร้างแถวสำหรับบันทึกลงตาราง committees */
export function buildStep2CommitteeRows(
  project: { id: string; organization_id: string },
  committees: Step2CommitteesState,
  profile: Step2CommitteeInsertProfile = STEP2_COMMITTEE_INSERT_PROFILES[0],
): Step2CommitteeRow[] {
  const rows: Step2CommitteeRow[] = [];

  const pushMembers = (
    members: string[],
    committeeType: string,
    opts?: { medianAsTor?: boolean },
  ) => {
    const type = committeeType.trim();
    if (!type) return;
    members
      .map((n) => n.trim())
      .filter(Boolean)
      .forEach((member_name, idx) => {
        const isMedianTorFallback = !!opts?.medianAsTor && type === "tor";
        rows.push({
          organization_id: project.organization_id,
          project_id: project.id,
          committee_type: type,
          member_name,
          position: isMedianTorFallback
            ? idx === 0
              ? "ประธานกรรมการ (ราคากlาง)"
              : "กรรมการ (ราคากlาง)"
            : idx === 0
              ? "ประธานกรรมการ"
              : "กรรมการ",
          appointment_date: null,
        });
      });
  };

  const medianAsTor = profile.median === profile.tor;

  if (committees.appointment_mode === "combined") {
    pushMembers(committees.combined_members, profile.combined);
  } else {
    pushMembers(committees.tor_members, profile.tor);
    pushMembers(committees.median_price_members, profile.median, { medianAsTor });
  }

  return rows.filter((r) => r.committee_type.trim() !== "" && r.member_name.trim() !== "");
}

export function countFilledCommitteeMembers(members: string[]): number {
  return members.map((n) => n.trim()).filter(Boolean).length;
}

export function shouldWarnEvenCommitteeCount(members: string[]): boolean {
  const count = countFilledCommitteeMembers(members);
  return count >= 4 && count % 2 === 0;
}

export type Step3ChecklistKey =
  | "draft_announcement_standard_compliant"
  | "spec_no_lock_in_verified"
  | "internal_memo_director_approval"
  | "median_price_step2_verified"
  | "hearing_files_prepared"
  | "egp_published_for_comment"
  | "comment_channel_prepared";

export type Step3Checklist = Record<Step3ChecklistKey, boolean>;

export const STEP3_CHECKLIST_ITEMS: Array<{
  key: Step3ChecklistKey;
  label: string;
  hint?: string;
}> = [
  {
    key: "draft_announcement_standard_compliant",
    label: 'ตรวจสอบ "ร่างประกาศฯ และร่างเอกสารประกวดราคา" ให้เป็นไปตามแบบมาตรฐาน',
    hint: "ตรวจสอบว่าสาระสำคัญครบถ้วนตามแบบที่กรมบัญชีกลางกำหนด ทั้งเงื่อนไขการเสนอราคา เกณฑ์การพิจารณา และระยะเวลาการส่งมอบ",
  },
  {
    key: "spec_no_lock_in_verified",
    label: 'ตรวจสอบคุณลักษณะเฉพาะ (Spec) ไม่ให้เป็นการ "ล็อกสเปค"',
    hint: "ยี่ห้อสินค้า สเปคที่เจาะจงเกินจำเป็น หรือการระบุชื่อผู้ขายรายใดรายหนึ่ง ต้องไม่มี หรือหากมีต้องมีเหตุผลความจำเป็นที่ชัดเจน",
  },
  {
    key: "internal_memo_director_approval",
    label: 'จัดทำบันทึกข้อความภายในเสนอหัวหน้าหน่วยงาน "ขอความเห็นชอบ"',
    hint: "ต้องมีหนังสือบันทึกข้อความที่ผ่านการออกเลขสารบรรณแล้ว เพื่อขอเห็นชอบร่างเอกสารทั้งหมดก่อนนำไปขึ้นเว็บ",
  },
  {
    key: "median_price_step2_verified",
    label: 'ตรวจสอบสถานะการอนุมัติ "ราคากlาง" จากขั้นตอนที่ 2',
    hint: "ยืนยันว่าราคากlางได้รับอนุมัติเรียบร้อยแล้วและตัวเลขตรงกันก่อนนำไปบันทึกลงในระบบ e-GP",
  },
  {
    key: "hearing_files_prepared",
    label: 'เตรียมไฟล์สำหรับ "เผยแพร่รับฟังคำวิจารณ์" ให้ครบ',
    hint: "ไฟล์ร่างประกาศ + ร่างเอกสารประกวดราคา + ไฟล์ตารางราคากlาง บก.06",
  },
  {
    key: "egp_published_for_comment",
    label: "นำข้อมูลขึ้นเผยแพร่ในระบบ e-GP เพื่อรับฟังความคิดเห็น (ขั้นต่ำ 3 วันทำการ)",
    hint: "ต้องบันทึกเลขที่โครงการจาก e-GP ให้เรียบร้อย",
  },
  {
    key: "comment_channel_prepared",
    label: "เตรียมช่องทางรับคำวิจารณ์",
    hint: "ระบุอีเมลหน่วยงาน หรือช่องทางอื่นให้ชัดเจน เพื่อให้ผู้ประกอบการส่งคำวิจารณ์เข้ามาได้",
  },
];

export const EMPTY_STEP3_CHECKLIST: Step3Checklist = {
  draft_announcement_standard_compliant: false,
  spec_no_lock_in_verified: false,
  internal_memo_director_approval: false,
  median_price_step2_verified: false,
  hearing_files_prepared: false,
  egp_published_for_comment: false,
  comment_channel_prepared: false,
};

/** @deprecated ใช้ Step3ChecklistKey แทน */
export type LegacyStep3Checklist = {
  committee_tor_bid_docs_done?: boolean;
  director_report_submitted?: boolean;
  draft_published_for_comment?: boolean;
};

export type Step3FeedbackResult = "none" | "has_comments" | "";

export type Step3SkipReason = "exempt" | "discretionary";

export type Step3Announcement = {
  approval_letter_no?: string;
  approval_letter_date?: string;
  /** เลขที่โครงการในระบบ e-GP */
  egp_project_code?: string;
  egp_announcement_no?: string;
  publication_start?: string;
  publication_end?: string;
  /** อีเมลหรือช่องทางรับคำวิจารณ์จากผู้ประกอบการ */
  comment_channel_email?: string;
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

export type Step2ComplianceLog = {
  /** มีการแจ้งเตือนความเร็วในการอนุมัติราคากlาง (ไม่บล็อก — บันทึกเพื่อ audit) */
  fast_median_approval_warning?: boolean;
  fast_median_approval_warning_at?: string;
};

export type Step1FormData = { checklist?: Step1Checklist };
export type Step2FormData = {
  checklist?: Step2Checklist;
  committeeOrder?: Step2CommitteeOrder;
  medianPrice?: Step2MedianPrice;
  committees?: Partial<Step2CommitteesState>;
  complianceLog?: Step2ComplianceLog;
};
export type Step3FormData = {
  checklist?: Step3Checklist;
  announcement?: Step3Announcement;
};
export type Step4FormData = { checklist?: Step4Checklist; bidResult?: Step4BidResult };

export type StepFormData = Step1FormData | Step2FormData | Step3FormData | Step4FormData;

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
  egp_project_code: "",
  egp_announcement_no: "",
  publication_start: "",
  publication_end: "",
  comment_channel_email: "",
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

export function isStep1ChecklistComplete(checklist: Step1Checklist): boolean {
  return STEP1_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
}

export function countStep1ChecklistDone(checklist: Step1Checklist): number {
  return STEP1_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
}

/** ปลดล็อกช่องรหัส e-GP เมื่อติ๊กข้อ 2 และ 3 แล้ว */
export function isStep1EgpCodeUnlocked(checklist: Step1Checklist): boolean {
  return checklist.annual_plan_published && checklist.egp_plan_code_verified;
}

export type Step1ComplianceIssue = { id: string; message: string };

export function getStep1ComplianceIssues(
  checklist: Step1Checklist,
  opts: {
    egpCode: string;
    budget: string;
    responsibleName: string;
  },
): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];

  STEP1_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!checklist[item.key]) {
      issues.push({
        id: `checklist-${item.key}`,
        message: `ยังไม่ได้ติ๊กข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.egpCode.trim()) {
    issues.push({
      id: "egp_code",
      message: 'กรุณาระบุ "รหัสแผนจัดซื้อจัดจ้าง e-GP"',
    });
  }
  const budgetVal = parseBudgetInput(opts.budget);
  if (!budgetVal || budgetVal <= 0) {
    issues.push({
      id: "budget",
      message: "กรุณาระบุวงเงินงบประมาณ (บาท)",
    });
  }
  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  return issues;
}

export function isStep1ReadyForNext(
  checklist: Step1Checklist,
  opts: {
    egpCode: string;
    budget: string;
    responsibleName: string;
  },
): boolean {
  return getStep1ComplianceIssues(checklist, opts).length === 0;
}

function normalizeStep1Checklist(raw: Partial<Step1Checklist> | null | undefined): Step1Checklist {
  const c = raw ?? {};
  return {
    budget_allocated_confirmed: !!c.budget_allocated_confirmed,
    annual_plan_published: !!c.annual_plan_published,
    egp_plan_code_verified: !!c.egp_plan_code_verified,
    project_name_and_type_verified: !!c.project_name_and_type_verified,
    responsible_officer_confirmed: !!c.responsible_officer_confirmed,
  };
}

/** โหลด Smart Checklist ขั้นตอนที่ 1 — จากคอลัมน์ step1_checklist หรือ note */
export function loadStep1FormFromStep(step: {
  note: string | null;
  step1_checklist?: Step1Checklist | Record<string, boolean> | null;
}): Step1FormData {
  if (step.step1_checklist && typeof step.step1_checklist === "object") {
    return { checklist: normalizeStep1Checklist(step.step1_checklist as Partial<Step1Checklist>) };
  }
  return loadStep1FormFromNote(step.note);
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 1 จาก note */
export function loadStep1FormFromNote(note: string | null): Step1FormData {
  const { form } = parseStepNote(note);
  const f = form as Step1FormData;
  return { checklist: normalizeStep1Checklist(f.checklist) };
}

function normalizeStep2Checklist(raw: Partial<Step2Checklist> | null | undefined): Step2Checklist {
  const c = raw ?? {};
  return {
    committee_composition_verified: !!c.committee_composition_verified,
    committee_qualifications_verified: !!c.committee_qualifications_verified,
    appointment_order_signed: !!c.appointment_order_signed,
    median_price_calculated: !!c.median_price_calculated,
    median_price_director_signed: !!c.median_price_director_signed,
    bg06_table_prepared: !!c.bg06_table_prepared,
  };
}

export function countStep2ChecklistDone(checklist: Step2Checklist): number {
  return STEP2_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
}

export function isStep2MedianPriceOverBudget(
  approvedMedianPrice: number | null | undefined,
  step1Budget: number,
): boolean {
  if (approvedMedianPrice == null || !Number.isFinite(approvedMedianPrice) || approvedMedianPrice <= 0) {
    return false;
  }
  if (!step1Budget || step1Budget <= 0) return false;
  return approvedMedianPrice > step1Budget;
}

export const STEP2_MEDIAN_OVER_BUDGET_MSG =
  "⚠️ ราคากลางสูงกว่างบประมาณ โปรดตรวจสอบหรือเตรียมทำเรื่องขออนุมัติงบเพิ่มเติม";

export const STEP2_EVEN_COMMITTEE_MSG =
  "⚠️ ระเบียบแนะนำให้คณะกรรมการเป็นจำนวนคี่ เพื่อความสะดวกในการลงมติ";

export const STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG =
  "❌ วันที่อนุมัติราคากลาง ต้องไม่ก่อนวันที่ในคำสั่งแต่งตั้งคณะกรรมการ";

export const STEP2_MEDIAN_WORKDAYS_SLOW_MSG =
  "⚠️ โครงการเริ่มล่าช้า: คณะกรรมการใช้เวลาจัดทำราคากลางนานเกิน 30 วัน โปรดตรวจสอบสถานะการทำงาน";

export const STEP2_MEDIAN_WORKDAYS_THRESHOLD = 30;

export const STEP2_MEDIAN_FAST_APPROVAL_MSG =
  "⚠️ การอนุมัติราคากลางภายใน 1 วันทำการหลังจากแต่งตั้งกรรมการ อาจถูกหน่วยงานตรวจสอบ (สตง.) ทักท้วงได้ โปรดตรวจสอบว่าคณะกรรมการได้ประชุมและพิจารณาตามกระบวนการจริงแล้ว";

export const STEP2_MEDIAN_FAST_APPROVAL_HELPER =
  "โดยปกติ คณะกรรมการควรใช้เวลาประชุมและคำนวณราคากลางตามความซับซ้อนของโครงการ";

/** อนุมัติราคากลางภายใน 1 วันทำการถัดจากวันคำสั่งแต่งตั้ง (Fast Approval — Warning ไม่บล็อก) */
export function isStep2MedianFastApproval(
  appointmentOrderISO: string,
  medianApprovalISO: string,
): boolean {
  const appointment = appointmentOrderISO.trim();
  const approval = medianApprovalISO.trim();
  if (!appointment || !approval) return false;
  if (isStep2MedianApprovalBeforeAppointment(approval, appointment)) return false;
  const workdaysAfterAppointment = countWorkdaysAfterStartISO(appointment, approval);
  return workdaysAfterAppointment <= 1;
}

/** บันทึกสถานะ compliance log ขั้นตอนที่ 2 ตามเงื่อนไขวันที่ปัจจุบัน */
export function buildStep2ComplianceLog(
  committeeOrder: Step2CommitteeOrder,
  medianPrice: Step2MedianPrice,
  previous?: Step2ComplianceLog,
): Step2ComplianceLog {
  const appointment = committeeOrder.appointment_order_date ?? "";
  const approval = medianPrice.median_price_approval_date ?? "";
  if (isStep2MedianFastApproval(appointment, approval)) {
    return {
      fast_median_approval_warning: true,
      fast_median_approval_warning_at:
        previous?.fast_median_approval_warning && previous.fast_median_approval_warning_at
          ? previous.fast_median_approval_warning_at
          : new Date().toISOString(),
    };
  }
  return { fast_median_approval_warning: false };
}

/** บันทึก compliance warning ลง console (audit trail ฝั่ง client) */
export function logStep2ComplianceWarnings(
  projectId: string,
  complianceLog: Step2ComplianceLog,
  ctx: { appointmentDate: string; medianApprovalDate: string },
): void {
  if (!complianceLog.fast_median_approval_warning) return;
  console.warn("[Step2][Compliance] fast_median_approval_warning", {
    projectId,
    message: "มีการแจ้งเตือนความเร็วในการอนุมัติ",
    appointmentDate: ctx.appointmentDate,
    medianApprovalDate: ctx.medianApprovalDate,
    loggedAt: complianceLog.fast_median_approval_warning_at,
  });
}

/** วันอนุมัติราคากลางอยู่ก่อนวันคำสั่งแต่งตั้ง (Anti-Backdating) */
export function isStep2MedianApprovalBeforeAppointment(
  medianApprovalISO: string,
  appointmentOrderISO: string,
): boolean {
  const approval = medianApprovalISO.trim();
  const appointment = appointmentOrderISO.trim();
  if (!approval || !appointment) return false;
  return approval < appointment;
}

/** จำนวนวันทำการจากวันคำสั่งแต่งตั้งถึงวันอนุมัติราคากlาง (รวมทั้งสองวัน) */
export function countStep2MedianProcessWorkdays(
  appointmentOrderISO: string,
  medianApprovalISO: string,
): number {
  return countWorkdaysBetweenISO(appointmentOrderISO.trim(), medianApprovalISO.trim());
}

/** ใช้เวลาจัดทำราคากlางเกินเกณฑ์ (Warning — ไม่บล็อก) */
export function isStep2MedianProcessSlow(
  appointmentOrderISO: string,
  medianApprovalISO: string,
): boolean {
  const days = countStep2MedianProcessWorkdays(appointmentOrderISO, medianApprovalISO);
  if (days <= 0) return false;
  return days > STEP2_MEDIAN_WORKDAYS_THRESHOLD;
}

export type Step2ComplianceIssue = { id: string; message: string };

export function getStep2ComplianceIssues(
  checklist: Step2Checklist,
  opts: {
    committees: Step2CommitteesState;
    committeeOrder: Step2CommitteeOrder;
    medianPrice: Step2MedianPrice;
    responsibleName: string;
    hasAppointmentOrderDoc: boolean;
    hasBg06Doc: boolean;
  },
): Step2ComplianceIssue[] {
  const issues: Step2ComplianceIssue[] = [];

  STEP2_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!checklist[item.key]) {
      issues.push({
        id: `checklist-${item.key}`,
        message: `ยังไม่ได้ติ๊กข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (opts.committees.appointment_mode === "combined") {
    if (countFilledCommitteeMembers(opts.committees.combined_members) < 3) {
      issues.push({
        id: "committee_members_combined",
        message: "กรุณาระบุรายชื่อคณะกรรมการอย่างน้อย 3 คน (ชุดเดียวกัน)",
      });
    }
  } else {
    if (countFilledCommitteeMembers(opts.committees.tor_members) < 3) {
      issues.push({
        id: "committee_members_tor",
        message: "กรุณาระบุรายชื่อคณะกรรมการจัดทำ TOR อย่างน้อย 3 คน",
      });
    }
    if (countFilledCommitteeMembers(opts.committees.median_price_members) < 3) {
      issues.push({
        id: "committee_members_median",
        message: "กรุณาระบุรายชื่อคณะกรรมการกำหนดราคากลางอย่างน้อย 3 คน",
      });
    }
  }

  if (!opts.committeeOrder.appointment_order_no?.trim()) {
    issues.push({
      id: "appointment_order_no",
      message: "กรุณาระบุเลขที่คำสั่งแต่งตั้ง",
    });
  }
  if (!opts.committeeOrder.appointment_order_date?.trim()) {
    issues.push({
      id: "appointment_order_date",
      message: "กรุณาระบุวันที่ลงนามในคำสั่งแต่งตั้ง",
    });
  }
  if (!opts.hasAppointmentOrderDoc) {
    issues.push({
      id: "appointment_order_doc",
      message: "กรุณาแนบไฟล์เอกสารคำสั่งแต่งตั้ง",
    });
  }

  const price = opts.medianPrice.approved_median_price;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    issues.push({
      id: "approved_median_price",
      message: "กรุณาระบุราคากลาง (บาท)",
    });
  }
  if (!opts.medianPrice.median_price_approval_date?.trim()) {
    issues.push({
      id: "median_price_approval_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานอนุมัติราคากลาง",
    });
  } else {
    const appointmentDate = opts.committeeOrder.appointment_order_date?.trim() ?? "";
    const medianApprovalDate = opts.medianPrice.median_price_approval_date.trim();
    if (
      appointmentDate &&
      isStep2MedianApprovalBeforeAppointment(medianApprovalDate, appointmentDate)
    ) {
      issues.push({
        id: "median_price_approval_before_appointment",
        message: STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG,
      });
    }
  }
  if (!opts.hasBg06Doc) {
    issues.push({
      id: "bg06_doc",
      message: "กรุณาแนบไฟล์ตารางแสดงวงเงินราคากลาง (แบบ บก.06)",
    });
  }

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  return issues;
}

export function isStep2ReadyForNext(
  checklist: Step2Checklist,
  opts: Parameters<typeof getStep2ComplianceIssues>[1],
): boolean {
  return getStep2ComplianceIssues(checklist, opts).length === 0;
}

/** โหลด Smart Checklist ขั้นตอนที่ 2 — จากคอลัมน์ step2_checklist หรือ note */
export function loadStep2FormFromStep(step: {
  note: string | null;
  step2_checklist?: Step2Checklist | Record<string, boolean> | null;
}): Step2FormData {
  const fromNote = loadStep2FormFromNote(step.note);
  if (step.step2_checklist && typeof step.step2_checklist === "object") {
    return {
      ...fromNote,
      checklist: normalizeStep2Checklist(step.step2_checklist as Partial<Step2Checklist>),
    };
  }
  return fromNote;
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 2 จาก note */
export function loadStep2FormFromNote(note: string | null): Step2FormData {
  const { form } = parseStepNote(note);
  const f = form as Step2FormData;
  return {
    checklist: normalizeStep2Checklist(f.checklist),
    committeeOrder: {
      ...EMPTY_STEP2_COMMITTEE_ORDER,
      ...f.committeeOrder,
    },
    medianPrice: {
      ...EMPTY_STEP2_MEDIAN_PRICE,
      ...f.medianPrice,
    },
    committees: f.committees ? { ...EMPTY_STEP2_COMMITTEES, ...f.committees } : undefined,
    complianceLog: f.complianceLog ?? {},
  };
}

type Step2ProjectLike = {
  committee_appointment_mode?: string | null;
  committee_appointment_order_no?: string | null;
  committee_appointment_order_date?: string | null;
  approved_median_price?: number | null;
  median_price_approval_date?: string | null;
  /** legacy — ย้ายมาใช้ approved_median_price ในขั้นตอนที่ 2 */
  estimated_price?: number | null;
};

/** ราคากลางที่แสดง/ใช้งาน — ขั้นตอนที่ 2 เป็นหลัก (รองรับข้อมูลเก่าจาก estimated_price) */
export function resolveProjectMedianPrice(project: {
  approved_median_price?: number | null;
  estimated_price?: number | null;
} | null): number | null {
  if (!project) return null;
  const approved = project.approved_median_price;
  if (approved != null && Number(approved) > 0) return Number(approved);
  const legacy = project.estimated_price;
  if (legacy != null && Number(legacy) > 0) return Number(legacy);
  return null;
}

/** รวมข้อมูลฟอร์มขั้นตอนที่ 2 จาก note + คอลัมน์ projects */
export function mergeStep2FormFromProject(
  form: Step2FormData,
  project: Step2ProjectLike,
): Step2FormData {
  return {
    checklist: normalizeStep2Checklist(form.checklist),
    committeeOrder: {
      appointment_order_no:
        form.committeeOrder?.appointment_order_no?.trim() ||
        project.committee_appointment_order_no?.trim() ||
        "",
      appointment_order_date:
        form.committeeOrder?.appointment_order_date?.trim() ||
        project.committee_appointment_order_date?.trim() ||
        "",
    },
    medianPrice: {
      approved_median_price:
        form.medianPrice?.approved_median_price != null &&
        Number.isFinite(form.medianPrice.approved_median_price) &&
        form.medianPrice.approved_median_price > 0
          ? form.medianPrice.approved_median_price
          : resolveProjectMedianPrice(project),
      median_price_approval_date:
        form.medianPrice?.median_price_approval_date?.trim() ||
        project.median_price_approval_date?.trim() ||
        "",
    },
  };
}

/** ฟิลด์ขั้นตอนที่ 2 — บันทึกลงตาราง projects */
export function buildProjectStep2Fields(
  committeeOrder: Step2CommitteeOrder,
  medianPrice: Step2MedianPrice,
  committees: Pick<Step2CommitteesState, "appointment_mode">,
) {
  const price = medianPrice.approved_median_price;
  const normalized =
    price != null && Number.isFinite(price) && price > 0 ? price : null;
  return {
    committee_appointment_mode: committees.appointment_mode,
    committee_appointment_order_no: committeeOrder.appointment_order_no?.trim() || null,
    committee_appointment_order_date:
      committeeOrder.appointment_order_date?.trim() || null,
    approved_median_price: normalized,
    /** ซิงก์ legacy column — ราคากลางบันทึกจากขั้นตอนที่ 2 เท่านั้น */
    estimated_price: normalized,
    median_price_approval_date: medianPrice.median_price_approval_date?.trim() || null,
  };
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

function normalizeStep3Checklist(
  raw: Partial<Step3Checklist> & LegacyStep3Checklist | null | undefined,
): Step3Checklist {
  const checklist = { ...EMPTY_STEP3_CHECKLIST };
  if (!raw) return checklist;

  STEP3_CHECKLIST_ITEMS.forEach((item) => {
    if (raw[item.key]) checklist[item.key] = true;
  });

  if (raw.committee_tor_bid_docs_done) {
    checklist.draft_announcement_standard_compliant = true;
    checklist.hearing_files_prepared = true;
  }
  if (raw.director_report_submitted) {
    checklist.internal_memo_director_approval = true;
  }
  if (raw.draft_published_for_comment) {
    checklist.egp_published_for_comment = true;
  }

  return checklist;
}

export type Step3ComplianceIssue = { id: string; message: string };

export function getStep3ComplianceIssues(
  checklist: Step3Checklist,
  opts: {
    announcement: Step3Announcement;
    responsibleName: string;
    approvedMedianPrice: number | null;
    medianPriceApprovalDate: string | null;
    hasMemoDoc: boolean;
    hasDraftTorDoc: boolean;
    hasDraftAnnouncementDoc: boolean;
    hasBg06Doc: boolean;
    hasEgpAnnouncementDoc: boolean;
    hasEgpScreenshotDoc: boolean;
    hearingFormActive: boolean;
  },
): Step3ComplianceIssue[] {
  if (!opts.hearingFormActive) return [];

  const issues: Step3ComplianceIssue[] = [];

  STEP3_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!checklist[item.key]) {
      issues.push({
        id: `checklist-${item.key}`,
        message: `ยังไม่ได้ติ๊กข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.announcement.approval_letter_no?.trim()) {
    issues.push({
      id: "approval_letter_no",
      message: "กรุณาระบุเลขที่บันทึกข้อความภายใน (ขอความเห็นชอบร่าง TOR)",
    });
  }
  if (!opts.announcement.approval_letter_date?.trim()) {
    issues.push({
      id: "approval_letter_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนาม",
    });
  }
  if (!opts.hasMemoDoc) {
    issues.push({
      id: "memo_doc",
      message: "กรุณาแนบไฟล์ PDF บันทึกข้อความเห็นชอบ",
    });
  }

  const median =
    opts.approvedMedianPrice != null &&
    Number.isFinite(opts.approvedMedianPrice) &&
    opts.approvedMedianPrice > 0;
  if (!median) {
    issues.push({
      id: "median_price_missing",
      message: "ยังไม่มีราคากlางที่อนุมัติจากขั้นตอนที่ 2 — กรุณากลับไปบันทึกขั้นตอนที่ 2",
    });
  }
  if (!opts.medianPriceApprovalDate?.trim()) {
    issues.push({
      id: "median_price_approval_date",
      message: "ยังไม่มีวันที่อนุมัติราคากlางจากขั้นตอนที่ 2",
    });
  }

  if (!opts.hasDraftTorDoc) {
    issues.push({
      id: "draft_tor_doc",
      message: "กรุณาแนบไฟล์ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
    });
  }
  if (!opts.hasDraftAnnouncementDoc) {
    issues.push({
      id: "draft_announcement_doc",
      message: "กรุณาแนบไฟล์ร่างประกาศและร่างเอกสารประกวดราคา",
    });
  }
  if (!opts.hasBg06Doc) {
    issues.push({
      id: "bg06_doc",
      message: "กรุณาแนบไฟล์ตารางราคากlาง (บก.06) — อัปโหลดในขั้นตอนนี้หรือขั้นตอนที่ 2",
    });
  }

  if (!opts.announcement.egp_project_code?.trim() && !opts.announcement.egp_announcement_no?.trim()) {
    issues.push({
      id: "egp_project_code",
      message: "กรุณาระบุเลขที่โครงการหรือเลขที่ประกาศในระบบ e-GP",
    });
  }
  if (!opts.hasEgpAnnouncementDoc && !opts.hasEgpScreenshotDoc) {
    issues.push({
      id: "egp_publication_proof",
      message: "กรุณาแนบ PDF ประกาศจาก e-GP หรือภาพหน้าจอหลักฐานการเผยแพร่",
    });
  }

  const pubErr = validateStep3PublicationDates(
    opts.announcement.publication_start,
    opts.announcement.publication_end,
  );
  if (pubErr) {
    issues.push({ id: "publication_dates", message: pubErr });
  }

  if (!opts.announcement.comment_channel_email?.trim()) {
    issues.push({
      id: "comment_channel_email",
      message: "กรุณาระบุอีเมลหรือช่องทางรับคำวิจารณ์จากผู้ประกอบการ",
    });
  }

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  return issues;
}

export function isStep3ReadyForNext(
  checklist: Step3Checklist,
  opts: Parameters<typeof getStep3ComplianceIssues>[1],
): boolean {
  return getStep3ComplianceIssues(checklist, opts).length === 0;
}

/** โหลด Smart Checklist ขั้นตอนที่ 3 — จากคอลัมน์ step3_checklist หรือ note */
export function loadStep3FormFromStep(step: {
  note: string | null;
  step3_checklist?: Step3Checklist | LegacyStep3Checklist | Record<string, boolean> | null;
}): Step3FormData {
  const fromNote = loadStep3FormFromNote(step.note);
  if (step.step3_checklist && typeof step.step3_checklist === "object") {
    return {
      ...fromNote,
      checklist: normalizeStep3Checklist(
        step.step3_checklist as Partial<Step3Checklist> & LegacyStep3Checklist,
      ),
    };
  }
  return fromNote;
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 3 จาก note */
export function loadStep3FormFromNote(note: string | null): Step3FormData {
  const { form } = parseStepNote(note);
  const f = form as Step3FormData;
  return {
    checklist: normalizeStep3Checklist(f.checklist),
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
