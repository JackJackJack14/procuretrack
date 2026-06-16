/** ตัวเลือกวิธีจัดซื้อในฟอร์มขั้นตอนที่ 1 (3 วิธีหลัก) */
import { buildStep4EvidenceFieldValues, getChecklistEvidenceIssues } from "@/lib/form-audit-trail";
import { hasStep1PlanPublicationDoc } from "@/lib/checklist-inline-evidence";
import { STEP2_DOC, STEP3_DOC, STEP4_DOC, STEP5_DOC, STEP6_DOC, STEP7_DOC, countStep2MarketQuoteDocsUploaded, hasStep2MarketQuotesDoc } from "@/lib/step-doc-types";
import {
  buildEffectiveChecklist,
  computeAutoChecklistState,
  getSmartChecklistItems,
  getStep6ChecklistItems,
  STEP5_CHECKLIST_ITEMS,
  STEP7_CHECKLIST_ITEMS,
  STEP8_CHECKLIST_ITEMS,
  STEP9_CHECKLIST_ITEMS,
  getStep10ChecklistItems,
} from "@/lib/smart-checklist";
import {
  isStep10RowInspectionPassed,
  step10RowHasAllInstallmentDocs,
  countStep10PassedInstallments,
  isStep10InspectionBeforeDelivery,
} from "@/lib/step10-contract";
import {
  countWorkdaysAfterStartISO,
  countWorkdaysBetweenISO,
  bidSubmissionEndAfterPeriodISO,
  committeeReviewDeadlineAfterBidEndISO,
  validateStep3PublicationDates,
  isPublicationEndExtendedBeyondMinimum,
  STEP3_PUBLICATION_EXTENSION_REASON_MSG,
  isStep7NotificationLetterTooLate,
  CONTRACT_NOTIFICATION_WORKDAYS,
  isContractActionBeforeAppealPeriodEnds,
  computeContractEarliestFromAppealDeadlineISO,
} from "@/lib/workdays";
import {
  getCrossStepTimelineConflictIssues,
  getStep10TimelineDateFields,
  getStep2TimelineDateFields,
  getStep3TimelineValidationIssues,
  getStep4TimelineDateFields,
  getStep5TimelineDateFields,
  getStep6TimelineDateFields,
  getStep7TimelineDateFields,
  getStep8TimelineDateFields,
  getStep9TimelineDateFields,
  type TimelineValidationContext,
} from "@/lib/timeline-validation";
import {
  getStep3HearingTier,
  shouldShowStep3HearingForm,
  STEP3_MANDATORY_HEARING_BLOCK_MSG,
  STEP3_DISCRETIONARY_HEARING_WARNING_MSG,
  STEP3_FEEDBACK_SOFT_WARNING_MSG,
} from "@/lib/step3-hearing";
import {
  computeStep9EgpDeadlineISO,
  getStep9EgpPublicationTooLateMsg,
  isStep9EgpPublicationTooLate,
} from "@/lib/step9-guideline";
import { formatThaiDateSlash } from "@/lib/utils";
import {
  buildProjectStep1ProfileFields,
  type Step1ProjectProfile,
} from "@/lib/project-profile";
import { isExternalProcurement } from "@/lib/procurement-path";

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

/** Smart Checklist — ขั้นตอนที่ 2 (ระเบียบฯ ข้อ 21) */
export type Step2ChecklistKey =
  | "tor_median_committee_appointed"
  | "integrity_letter_signed"
  | "median_price_calculated_signed"
  | "median_price_director_approved"
  | "bg06_table_verified";

export type Step2Checklist = Record<Step2ChecklistKey, boolean>;

export const STEP2_CHECKLIST_ITEMS: Array<{ key: Step2ChecklistKey; label: string }> = [
  {
    key: "tor_median_committee_appointed",
    label: "แต่งตั้งคณะกรรมการจัดทำร่าง TOR และกำหนดราคากลางแล้ว",
  },
  {
    key: "integrity_letter_signed",
    label: 'คณะกรรมการลงนามใน "หนังสือแสดงความบริสุทธิ์ใจ" แล้ว (แนบไฟล์)',
  },
  {
    key: "median_price_calculated_signed",
    label: "คณะกรรมการคำนวณราคากลางเสร็จสิ้นและลงนามแล้ว",
  },
  {
    key: "median_price_director_approved",
    label: "หัวหน้าหน่วยงานอนุมัติราคากลางแล้ว",
  },
  {
    key: "bg06_table_verified",
    label: "ตารางแสดงวงเงินงบประมาณและราคากลาง (บก.06) ถูกต้อง (แนบไฟล์)",
  },
];

export const EMPTY_STEP2_CHECKLIST: Step2Checklist = {
  tor_median_committee_appointed: false,
  integrity_letter_signed: false,
  median_price_calculated_signed: false,
  median_price_director_approved: false,
  bg06_table_verified: false,
};

/** ข้อมูลคำสั่งแต่งตั้งคณะกรรมการ — ขั้นตอนที่ 2 */
export type Step2CommitteeOrder = {
  appointment_order_no?: string;
  appointment_order_date?: string;
};

/** ข้อมูลราคากลาง — ขั้นตอนที่ 2 */
export type Step2MedianPrice = {
  /** วงเงินงบประมาณที่ได้รับจัดสรร (บาท) — sync ลง projects.allocated_budget */
  allocated_budget?: number | null;
  median_approval_letter_no?: string;
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
  allocated_budget: null,
  median_approval_letter_no: "",
  approved_median_price: null,
  median_price_approval_date: "",
};

export type Step2MarketQuote = {
  supplier_name: string;
  quoted_price: number | null;
};

export const EMPTY_STEP2_MARKET_QUOTES: Step2MarketQuote[] = [
  { supplier_name: "", quoted_price: null },
  { supplier_name: "", quoted_price: null },
  { supplier_name: "", quoted_price: null },
];

/** ประเภทคณะกรรมการใน DB — ขั้นตอนที่ 2 (ตรง check constraint บน Supabase) */
export const STEP2_COMMITTEE_TYPE = {
  /** โหมดชุดเดียว — บันทึกเป็น tor (คณะเดียวทำ TOR + ราคากลาง) */
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

/** สมาชิกคณะกรรมการ — ขั้นตอนที่ 2 */
export type Step2CommitteeMemberRole = "chair" | "member";

export type Step2CommitteeMember = {
  name: string;
  /** ตำแหน่ง/ความเห็นชอบ */
  position_endorsement?: string;
  /** ประธานหรือกรรมการ */
  role?: Step2CommitteeMemberRole | "";
};

export const EMPTY_STEP2_COMMITTEE_MEMBER: Step2CommitteeMember = {
  name: "",
  position_endorsement: "",
  role: "",
};

export function normalizeStep2CommitteeMember(
  raw: string | Step2CommitteeMember | null | undefined,
): Step2CommitteeMember {
  if (raw == null) return { ...EMPTY_STEP2_COMMITTEE_MEMBER };
  if (typeof raw === "string") return { name: raw, position_endorsement: "", role: "" };
  return {
    name: raw.name ?? "",
    position_endorsement: raw.position_endorsement ?? "",
    role: raw.role === "chair" || raw.role === "member" ? raw.role : "",
  };
}

export function getCommitteeMemberName(
  member: string | Step2CommitteeMember | null | undefined,
): string {
  return normalizeStep2CommitteeMember(member).name;
}

export const STEP2_DUPLICATE_CHAIR_MSG = "มีประธานได้เพียง 1 ท่านต่อคณะ";

/** นับจำนวนประธานในคณะ (เฉพาะแถวที่มีชื่อ) */
export function countStep2CommitteeChairs(
  members: Step2CommitteeMember[],
): number {
  return members.filter(
    (m) => m.role === "chair" && getCommitteeMemberName(m).trim(),
  ).length;
}

/** แถวนี้เลือกประธานซ้ำในคณะเดียวกันหรือไม่ */
export function isStep2CommitteeChairDuplicateAtIndex(
  members: Step2CommitteeMember[],
  index: number,
): boolean {
  const member = members[index];
  if (!member || member.role !== "chair") return false;
  return members.some(
    (m, i) =>
      i !== index && m.role === "chair" && getCommitteeMemberName(m).trim(),
  );
}

export type Step2CommitteeListKey =
  | "combined_members"
  | "tor_members"
  | "median_price_members"
  | "evaluation_members"
  | "inspection_members";

/** รูปแบบการแต่งตั้งคณะกรรมการ — ขั้นตอนที่ 2 */
export type Step2CommitteeAppointmentMode = "combined" | "separate";

export type Step2CommitteesState = {
  appointment_mode: Step2CommitteeAppointmentMode;
  combined_members: Step2CommitteeMember[];
  tor_members: Step2CommitteeMember[];
  median_price_members: Step2CommitteeMember[];
  /** คณะกรรมการพิจารณาผล — แยกจากชุด TOR/ราคากลาง */
  evaluation_members: Step2CommitteeMember[];
  /** คณะกรรมการตรวจรับพัสดุ */
  inspection_members: Step2CommitteeMember[];
  /** ใบเสนอราคาท้องตลาดอย่างน้อย 3 ราย */
  market_quotes: Step2MarketQuote[];
  /** เหตุผลสรุปการสืบราคา — หลักฐานประกอบราคากลาง */
  market_survey_summary_reason?: string;
};

export const EMPTY_STEP2_COMMITTEES: Step2CommitteesState = {
  appointment_mode: "combined",
  combined_members: [
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
  ],
  tor_members: [
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
  ],
  median_price_members: [
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
  ],
  evaluation_members: [
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
  ],
  inspection_members: [
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    { ...EMPTY_STEP2_COMMITTEE_MEMBER },
  ],
  market_quotes: EMPTY_STEP2_MARKET_QUOTES.map((q) => ({ ...q })),
  market_survey_summary_reason: "",
};

/** โปรไฟล์ insert — โหมดแยกชุดห้าม fallback บันทึกราคากลางเป็น tor */
export function getStep2CommitteeInsertProfiles(
  mode: Step2CommitteeAppointmentMode,
): Step2CommitteeInsertProfile[] {
  if (mode === "separate") {
    return STEP2_COMMITTEE_INSERT_PROFILES.filter((p) => p.median !== p.tor);
  }
  return STEP2_COMMITTEE_INSERT_PROFILES;
}

function padCommitteeMemberList(
  names: Array<string | Step2CommitteeMember> | null | undefined,
): Step2CommitteeMember[] {
  const normalized = (names ?? []).map(normalizeStep2CommitteeMember);
  const trimmed = normalized.filter((m) => m.name.trim());
  if (trimmed.length === 0) {
    return [
      { ...EMPTY_STEP2_COMMITTEE_MEMBER },
      { ...EMPTY_STEP2_COMMITTEE_MEMBER },
      { ...EMPTY_STEP2_COMMITTEE_MEMBER },
    ];
  }
  const result = normalized.length >= 3 ? [...normalized] : [...trimmed];
  while (result.length < 3) {
    result.push({ ...EMPTY_STEP2_COMMITTEE_MEMBER });
  }
  return result;
}

export type Step2CommitteeDbRow = {
  committee_type: string;
  member_name: string;
  position?: string;
};

function resolveStep2CommitteeAppointmentMode(
  savedMode: Step2CommitteeAppointmentMode | string | null | undefined,
  noteBackup: Partial<Step2CommitteesState> | null | undefined,
  rows: Step2CommitteeDbRow[],
): Step2CommitteeAppointmentMode {
  if (savedMode === "separate" || savedMode === "combined") return savedMode;
  if (
    noteBackup?.appointment_mode === "separate" ||
    noteBackup?.appointment_mode === "combined"
  ) {
    return noteBackup.appointment_mode;
  }

  const torRows = rows.filter((r) => r.committee_type === STEP2_COMMITTEE_TYPE.TOR);
  const medianRows = rows.filter((r) => isStep2MedianCommitteeType(r.committee_type));
  const combinedRows = rows.filter((r) => r.committee_type === STEP2_COMMITTEE_LEGACY_COMBINED);
  const medianMislabeled = torRows.filter((r) => (r.position ?? "").includes("ราคากลาง"));
  const torClean = torRows.filter((r) => !(r.position ?? "").includes("ราคากลาง"));

  if (torClean.length > 0 && (medianRows.length > 0 || medianMislabeled.length > 0)) {
    return "separate";
  }
  if (combinedRows.length > 0) return "combined";
  if (torRows.length > 0 && medianRows.length === 0) return "combined";
  return "combined";
}

/** โหลดรายชื่อคณะกรรมการจากตาราง committees + โหมดที่บันทึกไว้ */
export function loadStep2CommitteesFromDb(
  rows: Step2CommitteeDbRow[],
  savedMode?: Step2CommitteeAppointmentMode | string | null,
  noteBackup?: Partial<Step2CommitteesState> | null,
): Step2CommitteesState {
  const combined = rows
    .filter((r) => r.committee_type === STEP2_COMMITTEE_LEGACY_COMBINED)
    .map((r) => ({ name: r.member_name, position_endorsement: r.position ?? "" }));

  const torRows = rows.filter((r) => r.committee_type === STEP2_COMMITTEE_TYPE.TOR);
  const torClean = torRows
    .filter((r) => !(r.position ?? "").includes("ราคากลาง"))
    .map((r) => ({ name: r.member_name, position_endorsement: r.position ?? "" }));
  const medianFromType = rows
    .filter((r) => isStep2MedianCommitteeType(r.committee_type))
    .map((r) => ({ name: r.member_name, position_endorsement: r.position ?? "" }));
  const medianFromMislabeled = torRows
    .filter((r) => (r.position ?? "").includes("ราคากลาง"))
    .map((r) => ({ name: r.member_name, position_endorsement: r.position ?? "" }));

  const appointment_mode = resolveStep2CommitteeAppointmentMode(
    savedMode,
    noteBackup,
    rows,
  );

  if (appointment_mode === "separate") {
    const dbTor = torClean.length > 0 ? torClean : [];
    const dbMedian =
      medianFromType.length > 0
        ? medianFromType
        : medianFromMislabeled.length > 0
          ? medianFromMislabeled
          : [];

    return {
      appointment_mode: "separate",
      combined_members: padCommitteeMemberList(noteBackup?.combined_members ?? []),
      tor_members: padCommitteeMemberList(
        dbTor.length > 0 ? dbTor : (noteBackup?.tor_members ?? []),
      ),
      median_price_members: padCommitteeMemberList(
        dbMedian.length > 0 ? dbMedian : (noteBackup?.median_price_members ?? []),
      ),
      evaluation_members: padCommitteeMemberList(noteBackup?.evaluation_members ?? []),
      inspection_members: padCommitteeMemberList(noteBackup?.inspection_members ?? []),
      market_quotes: normalizeStep2MarketQuotes(noteBackup?.market_quotes),
    };
  }

  const torAllNames = torRows.map((r) => ({
    name: r.member_name,
    position_endorsement: r.position ?? "",
  }));
  const combinedSource =
    combined.length > 0
      ? combined
      : torAllNames.length > 0
        ? torAllNames
        : (noteBackup?.combined_members ?? []);

  return {
    appointment_mode: "combined",
    combined_members: padCommitteeMemberList(combinedSource),
    tor_members: padCommitteeMemberList(noteBackup?.tor_members ?? []),
    median_price_members: padCommitteeMemberList(noteBackup?.median_price_members ?? []),
    evaluation_members: padCommitteeMemberList(noteBackup?.evaluation_members ?? []),
    inspection_members: padCommitteeMemberList(noteBackup?.inspection_members ?? []),
    market_quotes: normalizeStep2MarketQuotes(noteBackup?.market_quotes),
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
    members: Step2CommitteeMember[],
    committeeType: string,
    opts?: { medianAsTor?: boolean },
  ) => {
    const type = committeeType.trim();
    if (!type) return;
    members.forEach((member, idx) => {
      const member_name = member.name.trim();
      if (!member_name) return;
      const customPosition = member.position_endorsement?.trim();
      const isMedianTorFallback = !!opts?.medianAsTor && type === "tor";
      const isChair = member.role === "chair" || (member.role !== "member" && idx === 0);
      const defaultPosition = isMedianTorFallback
        ? isChair
          ? "ประธานกรรมการ (ราคากลาง)"
          : "กรรมการ (ราคากลาง)"
        : isChair
          ? "ประธานกรรมการ"
          : "กรรมการ";
      rows.push({
        organization_id: project.organization_id,
        project_id: project.id,
        committee_type: type,
        member_name,
        position: customPosition || defaultPosition,
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

export function countFilledCommitteeMembers(
  members: Array<string | Step2CommitteeMember>,
): number {
  return members.map((m) => getCommitteeMemberName(m).trim()).filter(Boolean).length;
}

export function normalizeStep2MarketQuotes(
  raw: Step2MarketQuote[] | null | undefined,
): Step2MarketQuote[] {
  const base = EMPTY_STEP2_MARKET_QUOTES.map((q) => ({ ...q }));
  if (!raw?.length) return base;
  return base.map((empty, index) => {
    const row = raw[index];
    if (!row) return empty;
    const price = row.quoted_price;
    return {
      supplier_name: row.supplier_name?.trim() ?? "",
      quoted_price:
        price != null && Number.isFinite(price) && price > 0 ? price : null,
    };
  });
}

export function isStep2MarketQuotesComplete(quotes: Step2MarketQuote[]): boolean {
  const normalized = normalizeStep2MarketQuotes(quotes);
  return normalized.every(
    (q) => !!q.supplier_name.trim() && q.quoted_price != null && q.quoted_price > 0,
  );
}

export { countStep2MarketQuoteDocsUploaded, hasStep2MarketQuotesDoc } from "@/lib/step-doc-types";

/** ค่าเฉลี่ยราคาสืบจากใบเสนอราคาท้องตลาด — ใช้เปรียบเทียบราคากลาง */
export function computeStep2MarketSurveyAverage(quotes: Step2MarketQuote[]): number | null {
  const normalized = normalizeStep2MarketQuotes(quotes);
  const prices = normalized
    .map((q) => q.quoted_price)
    .filter((p): p is number => p != null && Number.isFinite(p) && p > 0);
  if (prices.length < 3) return null;
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

export const STEP2_MEDIAN_PRICE_DEVIATION_THRESHOLD = 0.1;

export const STEP2_MEDIAN_PRICE_DEVIATION_WARNING_MSG =
  "⚠️ ราคากลางมีค่าเบี่ยงเบนสูงกว่าปกติเกิน 10% โปรดตรวจสอบความถูกต้อง";

/** เตือนเมื่อราคากลางเบี่ยงเบนจากราคาเฉลี่ยสืบเกินเกณฑ์ (ไม่บล็อกบันทึก) */
export function isStep2MedianPriceDeviationHigh(
  approvedMedianPrice: number | null | undefined,
  quotes: Step2MarketQuote[],
  threshold = STEP2_MEDIAN_PRICE_DEVIATION_THRESHOLD,
): boolean {
  const approved = approvedMedianPrice;
  const average = computeStep2MarketSurveyAverage(quotes);
  if (
    approved == null ||
    !Number.isFinite(approved) ||
    approved <= 0 ||
    average == null ||
    average <= 0
  ) {
    return false;
  }
  return Math.abs(approved - average) / average > threshold;
}

/** ตรวจว่ามีคำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ — จากด่าน 2 หรือ 4 */
export function hasEvaluationInspectionOrderDoc(
  docs: Array<{ step_number?: number | null; document_type: string }>,
): boolean {
  const docType = STEP2_DOC.EVALUATION_INSPECTION_ORDER;
  return docs.some(
    (d) =>
      d.document_type === docType && (d.step_number === 2 || d.step_number === 4),
  );
}

/** ตรวจว่ามีคำสั่งพิจารณาผล/ตรวจรับที่อัปโหลดจากด่าน 2 (สำหรับยืนยันในด่าน 4) */
export function hasEvaluationOrderFromStep2(
  docs: Array<{ step_number?: number | null; document_type: string }>,
): boolean {
  return docs.some(
    (d) =>
      d.step_number === 2 &&
      d.document_type === STEP2_DOC.EVALUATION_INSPECTION_ORDER,
  );
}

/** ตรวจว่ามีไฟล์ BOQ — ขั้นตอนที่ 2 */
export function hasStep2BoqDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return stepDocs?.some((d) => d.document_type === STEP2_DOC.BOQ) ?? false;
}

export const STEP4_EVALUATION_INSPECTION_ORDER_REQUIRED_MSG =
  'กรุณาแนบเอกสาร "คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ" (ระเบียบพัสดุฯ ข้อ 22)';

export function shouldWarnEvenCommitteeCount(
  members: Array<string | Step2CommitteeMember>,
): boolean {
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
    label:
      "ข้าพเจ้าได้ตรวจสอบแล้วว่าไม่มีการกำหนดคุณลักษณะเฉพาะที่ชี้เฉพาะเจาะจงยี่ห้อ (Lock-in) ตาม พ.ร.บ.ฯ มาตรา 9",
    hint: "ยี่ห้อสินค้า สเปคที่เจาะจงเกินจำเป็น หรือการระบุชื่อผู้ขายรายใดรายหนึ่ง ต้องไม่มี หรือหากมีต้องมีเหตุผลความจำเป็นที่ชัดเจน",
  },
  {
    key: "internal_memo_director_approval",
    label: 'จัดทำบันทึกข้อความภายในเสนอหัวหน้าหน่วยงาน "ขอความเห็นชอบ"',
    hint: "ต้องมีหนังสือบันทึกข้อความที่ผ่านการออกเลขสารบรรณแล้ว เพื่อขอเห็นชอบร่างเอกสารทั้งหมดก่อนนำไปขึ้นเว็บ",
  },
  {
    key: "median_price_step2_verified",
    label: 'ตรวจสอบสถานะการอนุมัติ "ราคากลาง" จากขั้นตอนที่ 2',
    hint: "ยืนยันว่าราคากลางได้รับอนุมัติเรียบร้อยแล้วและตัวเลขตรงกันก่อนนำไปบันทึกลงในระบบ e-GP",
  },
  {
    key: "hearing_files_prepared",
    label: 'เตรียมไฟล์สำหรับ "เผยแพร่รับฟังคำวิจารณ์" ให้ครบ',
    hint: "ไฟล์ร่างประกาศ + ร่างเอกสารประกวดราคา + ไฟล์ตารางราคากลาง บก.06",
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

/** คำแนะนำระเบียบ — แสดงใต้ช่องอัปโหลดในฟอร์มด่าน 3 */
export const STEP3_TOR_UPLOAD_COMPLIANCE_HELPER =
  "⚠️ เงื่อนไข: ตรวจสอบว่าไม่มีการกำหนดคุณลักษณะเฉพาะที่สืบไปถึงการล็อกสเปคตาม พ.ร.บ. มาตรา 9";

export const STEP3_ANNOUNCEMENT_UPLOAD_COMPLIANCE_HELPER =
  "⚠️ เงื่อนไข: โปรดตรวจสอบร่างประกาศฯ และเอกสารประกวดราคาให้เป็นไปตามแบบมาตรฐาน";

export const STEP3_MEMO_UPLOAD_COMPLIANCE_HELPER =
  "⚠️ เงื่อนไข: ต้องจัดทำบันทึกข้อความภายในเสนอหัวหน้าหน่วยงานเพื่อขอความเห็นชอบก่อนนำไปขึ้นเว็บภาครัฐ";

/** เอกสารหลัก 3 ชุดในกลุ่มร่างเอกสาร — ใช้ปลดล็อกปุ่มไปขั้นถัดไป */
export function isStep3CoreDocumentsReady(opts: {
  hasDraftTorDoc: boolean;
  hasDraftAnnouncementDoc: boolean;
  hasBg06Doc: boolean;
}): boolean {
  return opts.hasDraftTorDoc && opts.hasDraftAnnouncementDoc && opts.hasBg06Doc;
}

export function countStep3CoreDocumentsReady(opts: {
  hasDraftTorDoc: boolean;
  hasDraftAnnouncementDoc: boolean;
  hasBg06Doc: boolean;
}): { done: number; total: number } {
  let done = 0;
  if (opts.hasDraftTorDoc) done += 1;
  if (opts.hasDraftAnnouncementDoc) done += 1;
  if (opts.hasBg06Doc) done += 1;
  return { done, total: 3 };
}

function step3RequiresPublicationExtensionReason(announcement: Step3Announcement): boolean {
  return isPublicationEndExtendedBeyondMinimum(
    announcement.publication_start ?? "",
    announcement.publication_end ?? "",
  );
}

function isStep3ProcurementApprovalDateValid(announcement: Step3Announcement): boolean {
  const procDate = announcement.procurement_request_approval_date?.trim() ?? "";
  if (!procDate) return false;
  const pubEnd = announcement.publication_end?.trim() ?? "";
  if (pubEnd && procDate < pubEnd) return false;
  return true;
}

/** ฟิลด์กรอกข้อมูลที่มีเครื่องหมาย * ในฟอร์มด่าน 3 */
export function getStep3RequiredFormFieldIssues(
  announcement: Step3Announcement,
): Step3ComplianceIssue[] {
  const issues: Step3ComplianceIssue[] = [];

  if (!announcement.procurement_request_letter_no?.trim()) {
    issues.push({
      id: "procurement_request_letter_no",
      message: "กรุณาระบุเลขที่หนังสือบันทึกข้อความเสนอขอเห็นชอบ",
    });
  }
  if (!announcement.procurement_request_approval_date?.trim()) {
    issues.push({
      id: "procurement_request_approval_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามในรายงานขอซื้อขอจ้าง",
    });
  } else if (!isStep3ProcurementApprovalDateValid(announcement)) {
    issues.push({
      id: "procurement_request_approval_before_publication_end",
      message:
        "วันที่หัวหน้าหน่วยงานลงนามต้องไม่ก่อนวันสิ้นสุดการเผยแพร่ร่างประกาศ",
    });
  }
  const workdays = announcement.committee_review_workdays;
  if (workdays == null || workdays <= 0) {
    issues.push({
      id: "committee_review_workdays",
      message: "กรุณาระบุระยะเวลารับซองราคา / พิจารณาผล (วันทำการ)",
    });
  }
  if (
    step3RequiresPublicationExtensionReason(announcement) &&
    !announcement.publication_end_extension_reason?.trim()
  ) {
    issues.push({
      id: "publication_end_extension_reason",
      message: STEP3_PUBLICATION_EXTENSION_REASON_MSG,
    });
  }

  return issues;
}

export function countStep3FormRequiredProgress(announcement: Step3Announcement): {
  done: number;
  total: number;
} {
  const total = 3 + (step3RequiresPublicationExtensionReason(announcement) ? 1 : 0);
  let done = 0;
  if (announcement.procurement_request_letter_no?.trim()) done += 1;
  if (isStep3ProcurementApprovalDateValid(announcement)) done += 1;
  if ((announcement.committee_review_workdays ?? 0) > 0) done += 1;
  if (
    step3RequiresPublicationExtensionReason(announcement) &&
    announcement.publication_end_extension_reason?.trim()
  ) {
    done += 1;
  }
  return { done, total };
}

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
  /** เหตุผลเมื่อขยายวันสิ้นสุดเผยแพร่เกินเกณฑ์ขั้นต่ำ 3 วันทำการ */
  publication_end_extension_reason?: string;
  /** เปิดโหมดขยายระยะเวลาเผยแพร่ (UI state) */
  publication_end_extended?: boolean;
  /** อีเมลหรือช่องทางรับคำวิจารณ์จากผู้ประกอบการ */
  comment_channel_email?: string;
  feedback_result?: Step3FeedbackResult;
  feedback_report_no?: string;
  /** เลขที่หนังสือชี้แจง/แก้ไข — กรณีมีผู้เสนอแนะหรือวิจารณ์ */
  feedback_clarification_letter_no?: string;
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

/** สถานะการอุทธรณ์ — บันทึกในขั้นตอนที่ 6 (อุทธรณ์) */
export type StepAppealStatus = "none" | "pending" | "";

/** @deprecated ใช้ StepAppealStatus */
export type Step4AppealStatus = StepAppealStatus;

export const APPEAL_STATUS_LABELS: Record<Exclude<StepAppealStatus, "">, string> = {
  none: "พร้อมทำสัญญา",
  pending: "ติดอุทธรณ์",
};

/** ข้อมูลอุทธรณ์ — ขั้นตอนที่ 6 */
export type Step6AppealState = {
  appeal_status?: StepAppealStatus;
  appeal_report_letter_no?: string;
  /** วันที่หัวหน้าหน่วยงานลงนามในหนังสือผลอุทธรณ์ */
  appeal_report_approval_date?: string;
  /** @deprecated ใช้ appeal_report_approval_date */
  appeal_consideration_status?: string;
};

export const EMPTY_STEP6_APPEAL: Required<Omit<Step6AppealState, never>> = {
  appeal_status: "",
  appeal_report_letter_no: "",
  appeal_report_approval_date: "",
  appeal_consideration_status: "",
};

export type Step6ChecklistKey =
  | "appeal_period_passed_no_objection"
  | "appeal_agency_report_done"
  | "appeal_sent_to_cgd";

export type Step6Checklist = Record<Step6ChecklistKey, boolean>;

export const EMPTY_STEP6_CHECKLIST: Step6Checklist = {
  appeal_period_passed_no_objection: false,
  appeal_agency_report_done: false,
  appeal_sent_to_cgd: false,
};

/** Smart Checklist — ขั้นตอนที่ 4 */
export type Step4ChecklistKey =
  | "egp_summary_downloaded"
  | "blacklist_checked"
  | "conflict_of_interest_checked"
  | "technical_price_reviewed"
  | "evaluation_report_submitted";

export type Step4Checklist = Record<Step4ChecklistKey, boolean>;

export const STEP4_CHECKLIST_ITEMS: Array<{ key: Step4ChecklistKey; label: string }> = [
  { key: "egp_summary_downloaded", label: "ดาวน์โหลดรายงานสรุปผลจาก e-GP" },
  { key: "blacklist_checked", label: "ตรวจสอบผู้ทิ้งงาน (Blacklist) ใน e-GP" },
  { key: "conflict_of_interest_checked", label: "ตรวจสอบผลประโยชน์ร่วมกันของผู้ยื่นซอง" },
  { key: "technical_price_reviewed", label: "พิจารณาข้อเสนอเทคนิคและราคาเรียบร้อย" },
  { key: "evaluation_report_submitted", label: "จัดทำบันทึกรายงานผลพิจารณาเสนอหัวหน้าหน่วยงาน" },
];

export const EMPTY_STEP4_CHECKLIST: Step4Checklist = {
  egp_summary_downloaded: false,
  blacklist_checked: false,
  conflict_of_interest_checked: false,
  technical_price_reviewed: false,
  evaluation_report_submitted: false,
};

/** ประกาศผู้ชนะ — ขั้นตอนที่ 5 */
export type Step5Announcement = {
  winner_announcement_no?: string;
  winner_announcement_date?: string;
};

export const EMPTY_STEP5_ANNOUNCEMENT: Required<Step5Announcement> = {
  winner_announcement_no: "",
  winner_announcement_date: "",
};

/** Smart Checklist — ขั้นตอนที่ 5 (manual keys เท่านั้น — auto คำนวณจากฟอร์ม) */
export type Step5ChecklistKey = "egp_winner_announced" | "physical_board_posted";

export type Step5Checklist = Record<Step5ChecklistKey, boolean>;

export const EMPTY_STEP5_CHECKLIST: Step5Checklist = {
  egp_winner_announced: false,
  physical_board_posted: false,
};

/** ผลการเสนอราคา — ขั้นตอนที่ 4 */
export type Step4BidResult = {
  egp_doc_request_count?: number | null;
  egp_bid_submission_count?: number | null;
  winning_bidder_name?: string;
  /** ราคาที่เสนอชนะ (บาท) */
  winning_bid_amount?: number | null;
  /** ราคาที่ตกลงซื้อหรือจ้างจริง (บาท) — กรณีต่อรองราคา; ส่งต่อมูลค่าสัญญา */
  final_agreed_amount?: number | null;
  evaluation_report_letter_no?: string;
  evaluation_report_approval_date?: string;
  /** ขยายเวลาพิจารณาผล — เมื่ออนุมัติเกินเดดไลน์ */
  review_extension_memo_no?: string;
  review_extension_approval_date?: string;
  /** ผู้ควบคุมงานหน้างาน — คำสั่งแต่งตั้งช่าง (ขั้นตอนที่ 4) */
  site_supervisor_name?: string;
  site_supervisor_affiliation?: string;
  site_engineer_name?: string;
  /** ยืนยันตรวจสอบคำสั่งพิจารณาผล/ตรวจรับที่ดึงจากด่าน 2 */
  evaluation_inspection_order_confirmed?: boolean;
};

export type Step2ComplianceLog = {
  /** มีการแจ้งเตือนความเร็วในการอนุมัติราคากลาง (ไม่บล็อก — บันทึกเพื่อ audit) */
  fast_median_approval_warning?: boolean;
  fast_median_approval_warning_at?: string;
};

export type Step1FormData = {
  checklist?: Step1Checklist;
  /** เหตุผลความจำเป็น — วิธีเฉพาะเจาะจง (ข้อ 79) */
  specificMethodReason?: string;
};
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
  complianceLog?: Step3ComplianceLog;
};

/** บันทึก compliance warning ด่าน 3 — ชื่อกรรมการซ้ำข้ามชุด */
export type Step3ComplianceLog = {
  committee_overlap_warning?: boolean;
  committee_overlap_warning_at?: string;
  committee_overlap_names?: string[];
  committee_overlap_reason?: string;
};
export type Step4FormData = { checklist?: Step4Checklist; bidResult?: Step4BidResult };
export type Step5FormData = { checklist?: Step5Checklist; announcement?: Step5Announcement };

/** ข้อมูลหนังสือแจ้งทำสัญญา — ขั้นตอนที่ 7 */
export type Step7ContractNotice = {
  contract_notice_letter_no: string;
  contract_notice_letter_date: string;
};

export type Step7FormData = {
  checklist?: Record<string, boolean>;
  contractNotice?: Step7ContractNotice;
};

export const EMPTY_STEP7_CONTRACT_NOTICE: Step7ContractNotice = {
  contract_notice_letter_no: "",
  contract_notice_letter_date: "",
};

/** ประเภทหลักประกันสัญญา — ขั้นตอนที่ 8 */
export type Step8GuaranteeType =
  | "cash"
  | "cashier_check"
  | "bank_guarantee"
  | "finance_guarantee"
  | "";

export const STEP8_GUARANTEE_TYPE_OPTIONS: Array<{
  value: Exclude<Step8GuaranteeType, "">;
  label: string;
}> = [
  { value: "cash", label: "เงินสด" },
  { value: "cashier_check", label: "เช็คที่ธนาคารเซ็นสั่งจ่าย" },
  { value: "bank_guarantee", label: "หนังสือค้ำประกันธนาคาร (BG)" },
  { value: "finance_guarantee", label: "หนังสือค้ำประกันของบริษัทเงินทุน" },
];

export function step8GuaranteeTypeLabel(code: Step8GuaranteeType): string {
  if (!code) return "";
  return STEP8_GUARANTEE_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export function parseStep8GuaranteeTypeFromProject(
  stored?: string | null,
): Step8GuaranteeType {
  if (!stored?.trim()) return "";
  const trimmed = stored.trim();
  const byLabel = STEP8_GUARANTEE_TYPE_OPTIONS.find((o) => o.label === trimmed);
  if (byLabel) return byLabel.value;
  const byCode = STEP8_GUARANTEE_TYPE_OPTIONS.find((o) => o.value === trimmed);
  return (byCode?.value ?? "") as Step8GuaranteeType;
}

/** ข้อมูลลงนามสัญญาและหลักประกัน — ขั้นตอนที่ 8 */
export type Step8ContractExecution = {
  contract_no: string;
  contract_signed_date: string;
  contract_amount: number | null;
  guarantee_type: Step8GuaranteeType;
  guarantee_amount: number | null;
  guarantee_document_no: string;
};

export type Step8FormData = {
  checklist?: Record<string, boolean>;
  contractExecution?: Step8ContractExecution;
};

/** ระยะเวลาและงวดงาน — ขั้นตอนที่ 9 */
export type Step9ContractSchedule = {
  contract_duration_days: number | null;
  /** จำนวนงวดงานทั้งหมดตามสัญญา — ใช้ดีดตารางตรวจรับ Step 10 */
  total_installment_count: number | null;
  /** วันที่เริ่มปฏิบัติงานหน้างาน — sync กับ notice_to_proceed_date */
  work_start_date: string;
  notice_to_proceed_date: string;
  /** วันที่บันทึก/ประกาศสาระสำคัญสัญญาใน e-GP (ข้อ 162) */
  egp_essential_publication_date: string;
  /** เลขคุมสัญญาที่ระบบ e-GP ออกให้หลังบันทึกสาระสำคัญ */
  egp_contract_control_no: string;
  /** เลขที่หนังสือแจ้งให้เริ่มปฏิบัติงาน (Notice to Proceed) */
  notice_to_proceed_letter_no: string;
};

export type Step9FormData = {
  checklist?: Record<string, boolean>;
  contractSchedule?: Step9ContractSchedule;
};

export const EMPTY_STEP9_CONTRACT_SCHEDULE: Step9ContractSchedule = {
  contract_duration_days: null,
  total_installment_count: null,
  work_start_date: "",
  notice_to_proceed_date: "",
  egp_essential_publication_date: "",
  egp_contract_control_no: "",
  notice_to_proceed_letter_no: "",
};

/** แถวตารางตรวจรับงวดงาน — ขั้นตอนที่ 10 */
export type Step10InspectionRow = {
  installment_no: number;
  /** วันกำหนดเสร็จตามแผน — คำนวณจาก Gantt/ระยะเวลาสัญญา (Step 9) */
  planned_completion_date: string;
  delivery_date: string;
  inspection_date: string;
  progress_pct: number | null;
  /** ผลสะสมหน้างานจริง (จำนวนหน่วย) — แสดงหน่วยจาก Step 1 */
  progress_cumulative_units: number | null;
  inspector_note: string;
  /** สถานะงวดงาน */
  installment_status: string;
};

export type Step10FormData = {
  checklist?: Record<string, boolean>;
  inspectionRows?: Step10InspectionRow[];
};

export function buildStep10InspectionRows(
  totalInstallments: number,
  existing: Step10InspectionRow[] = [],
  plannedDates: string[] = [],
): Step10InspectionRow[] {
  const n = Math.max(0, Math.min(99, Math.floor(totalInstallments)));
  return Array.from({ length: n }, (_, index) => {
    const installment_no = index + 1;
    const prev = existing.find((row) => row.installment_no === installment_no);
    const planned =
      plannedDates[index]?.trim() || prev?.planned_completion_date?.trim() || "";
    if (prev) {
      return {
        ...prev,
        planned_completion_date: planned,
      };
    }
    return {
      installment_no,
      planned_completion_date: planned,
      delivery_date: "",
      inspection_date: "",
      progress_pct: null,
      progress_cumulative_units: null,
      inspector_note: "",
      installment_status: "",
    };
  });
}

export function loadStep10FormFromNote(note: string | null): Step10FormData {
  const { form } = parseStepNote(note);
  const f = form as Step10FormData;
  const raw = f.inspectionRows ?? [];
  return {
    checklist: f.checklist,
    inspectionRows: raw.map((row, index) => ({
      installment_no: row.installment_no ?? index + 1,
      planned_completion_date: row.planned_completion_date?.trim() ?? "",
      delivery_date: row.delivery_date?.trim() ?? "",
      inspection_date: row.inspection_date?.trim() ?? "",
      progress_pct:
        row.progress_pct != null && Number.isFinite(row.progress_pct)
          ? row.progress_pct
          : null,
      progress_cumulative_units:
        row.progress_cumulative_units != null &&
        Number.isFinite(row.progress_cumulative_units)
          ? row.progress_cumulative_units
          : null,
      inspector_note: row.inspector_note?.trim() ?? "",
      installment_status: row.installment_status?.trim() ?? "",
    })),
  };
}

export function resolveProjectTotalInstallmentCount(
  steps: Array<{ step_number?: number; note: string | null }>,
): number {
  const step9 = steps.find((s) => s.step_number === 9);
  if (!step9) return 0;
  const schedule = loadStep9FormFromNote(step9.note).contractSchedule;
  const count = schedule?.total_installment_count;
  if (count == null || !Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

export const EMPTY_STEP8_CONTRACT_EXECUTION: Step8ContractExecution = {
  contract_no: "",
  contract_signed_date: "",
  contract_amount: null,
  guarantee_type: "",
  guarantee_amount: null,
  guarantee_document_no: "",
};

export type StepFormData =
  | Step1FormData
  | Step2FormData
  | Step3FormData
  | Step4FormData
  | Step5FormData
  | Step7FormData
  | Step8FormData
  | Step9FormData
  | Step10FormData;

export const EMPTY_STEP4_BID_RESULT: Required<
  Omit<Step4BidResult, never>
> = {
  egp_doc_request_count: null,
  egp_bid_submission_count: null,
  winning_bidder_name: "",
  winning_bid_amount: null,
  final_agreed_amount: null,
  evaluation_report_letter_no: "",
  evaluation_report_approval_date: "",
  review_extension_memo_no: "",
  review_extension_approval_date: "",
  site_supervisor_name: "",
  site_supervisor_affiliation: "",
  site_engineer_name: "",
  evaluation_inspection_order_confirmed: false,
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
  publication_end_extension_reason: "",
  publication_end_extended: false,
  comment_channel_email: "",
  feedback_result: "",
  feedback_report_no: "",
  feedback_clarification_letter_no: "",
  feedback_notes: "",
  procurement_request_letter_no: "",
  procurement_request_approval_date: "",
  committee_review_workdays: null,
  hearing_skipped: false,
  skip_reason: "",
  hearing_proceed: false,
};

const FORM_MARKER = "__STEP_FORM__:";

/** มาร์กเกอร์ที่ใช้เก็บ form state ใน note (ไม่แสดงในช่องหมายเหตุผู้ใช้) */
export const STEP_FORM_MARKERS = ["__STEP_FORM__:", "__PROCURE_FORM__:"] as const;

/** ตัด payload ฟอร์มหลังบ้านออกจากข้อความ — เหลือเฉพาะหมายเหตุที่ผู้ใช้พิมพ์ */
export function stripStepFormPayload(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = raw;
  for (const marker of STEP_FORM_MARKERS) {
    const idx = text.indexOf(marker);
    if (idx >= 0) text = text.slice(0, idx);
  }
  return text.trim();
}

export function formatBudgetInput(v: string): string {
  const num = v.replace(/[^\d]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("th-TH").format(Number(num));
}

export function parseBudgetInput(v: string): number {
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** แยกหมายเหตุผู้ใช้ กับข้อมูลฟอร์มที่เก็บใน note (metadata หลังบ้าน) */
export function parseStepNote(note: string | null): { userNote: string; form: StepFormData } {
  if (!note) return { userNote: "", form: {} };

  let markerIdx = -1;
  let markerLen = 0;
  for (const marker of STEP_FORM_MARKERS) {
    const idx = note.indexOf(marker);
    if (idx >= 0 && (markerIdx < 0 || idx < markerIdx)) {
      markerIdx = idx;
      markerLen = marker.length;
    }
  }

  if (markerIdx === -1) return { userNote: note.trim(), form: {} };

  const userNote = note.slice(0, markerIdx).trim();
  const raw = note.slice(markerIdx + markerLen);
  try {
    const form = JSON.parse(raw) as StepFormData;
    return { userNote, form: form ?? {} };
  } catch {
    return { userNote: stripStepFormPayload(note), form: {} };
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
  const cleanNote = stripStepFormPayload(userNote);
  return {
    responsible_officer_name: responsibleName.trim() || null,
    step_notes: cleanNote || null,
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
  const { userNote: noteColumnText } = parseStepNote(step.note);
  const legacy = splitNoteAndResponsible(noteColumnText);
  const fromStepNotes =
    step.step_notes != null ? stripStepFormPayload(step.step_notes) : null;
  return {
    responsible: step.responsible_officer_name?.trim() || legacy.responsible,
    userNote: fromStepNotes ?? legacy.userNote,
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
    a.feedback_clarification_letter_no?.trim() ||
    a.feedback_notes?.trim() ||
    a.publication_end_extension_reason?.trim() ||
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

/** ไทม์ไลน์ขั้นตอนที่ 4 — คำนวณจากข้อมูลขั้นตอนที่ 3 แบบลำดับขั้น */
export type Step4Timeline = {
  /** วันที่หัวหน้าหน่วยงานอนุมัติขอซื้อขอจ้าง (ขั้นตอนที่ 3) */
  bidPeriodStartISO: string;
  /** ระยะเวลารับซองราคา/พิจารณาผล (วันทำการ) จากขั้นตอนที่ 3 */
  bidPeriodWorkdays: number | null;
  /** วันสิ้นสุดการยื่นข้อเสนอ (ปิดรับซอง) */
  bidSubmissionEndISO: string;
  /** เดดไลน์คณะกรรมการพิจารณาผล — ปิดรับซอง + 1 วันทำการ (ข้อ 55) */
  committeeReviewDeadlineISO: string;
};

export function isStep4TimelineComplete(timeline: Step4Timeline): boolean {
  return !!(
    timeline.bidPeriodStartISO &&
    timeline.bidPeriodWorkdays != null &&
    timeline.bidPeriodWorkdays > 0 &&
    timeline.bidSubmissionEndISO &&
    timeline.committeeReviewDeadlineISO
  );
}

/** วันเริ่มนับรับซองราคา — อนุมัติรายงานขอซื้อขอจ้างจากขั้นตอนที่ 3 */
export function resolveBidPeriodStartDate(
  project: {
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): string {
  const fromProject = project?.procurement_request_approval_date?.trim();
  if (fromProject) return fromProject;
  const form = loadStep3FormFromNote(step3Note);
  return form.announcement?.procurement_request_approval_date?.trim() ?? "";
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
  project: {
    committee_review_workdays?: number | null;
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): Step4Timeline {
  const bidPeriodStartISO = resolveBidPeriodStartDate(project, step3Note);
  const bidPeriodWorkdays = resolveCommitteeReviewWorkdays(project, step3Note);
  const bidSubmissionEndISO = computeBidSubmissionEndISO(
    bidPeriodStartISO,
    bidPeriodWorkdays,
  );
  const committeeReviewDeadlineISO =
    committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO);
  return {
    bidPeriodStartISO,
    bidPeriodWorkdays,
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

/** มูลค่าสัญญาที่ส่งต่อขั้นตอนที่ 8 — ใช้ราคาตกลงจริงก่อน หากไม่มีใช้ราคาเสนอชนะ */
export function resolveStep4ContractAmount(bidResult: Pick<Step4BidResult, "final_agreed_amount" | "winning_bid_amount">): number | null {
  const final = bidResult.final_agreed_amount;
  if (final != null && Number.isFinite(final) && final > 0) return final;
  const winning = bidResult.winning_bid_amount;
  if (winning != null && Number.isFinite(winning) && winning > 0) return winning;
  return null;
}

/** วันเดดไลน์พิจารณาผลคณะกรรมการ — วันสิ้นสุดการยื่นข้อเสนอ + 1 วันทำการ (ข้อ 55) */
export function computeStep4ReviewDeadlineISO(bidSubmissionEndISO: string): string {
  return committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO);
}

/** @deprecated ใช้ computeStep4Timeline().bidSubmissionEndISO แทน */
export function resolveBidSubmissionEndDate(
  project: {
    committee_review_workdays?: number | null;
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): string {
  return computeStep4Timeline(project, step3Note).bidSubmissionEndISO;
}

/** ค่าเริ่มต้นวันอนุมัติผลพิจารณา — วันนี้ (ไม่ต่ำกว่าเดดไลน์คณะกรรมการ) */
export function defaultStep4EvaluationApprovalDateISO(
  committeeReviewDeadlineISO: string,
): string {
  const today = todayISO();
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

/** วันที่ลงนามประกาศผู้ชนะ (ขั้น 5) อยู่ก่อนวันอนุมัติผลพิจารณา (ขั้น 4) */
export function isStep5WinnerAnnouncementBeforeEvaluation(
  winnerAnnouncementISO: string,
  evaluationApprovalISO: string,
): boolean {
  const winner = winnerAnnouncementISO.trim();
  const evaluation = evaluationApprovalISO.trim();
  return !!evaluation && !!winner && winner < evaluation;
}

export function getStep5WinnerAnnouncementBeforeEvaluationMsg(
  evaluationApprovalISO: string,
): string {
  const dateLabel = formatThaiDateSlash(evaluationApprovalISO);
  return `❌ วันที่ลงนามในประกาศผลผู้ชนะ ต้องไม่เกิดก่อนวันที่หัวหน้าหน่วยงานอนุมัติผลการพิจารณา (วันที่ ${dateLabel})`;
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

/** วันนี้ (yyyy-mm-dd) ตามเวลาท้องถิ่น */
export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function step4BidResultHasData(b: Step4BidResult | undefined): boolean {
  if (!b) return false;
  return !!(
    b.egp_doc_request_count != null ||
    b.egp_bid_submission_count != null ||
    b.winning_bidder_name?.trim() ||
    (b.winning_bid_amount != null && b.winning_bid_amount > 0) ||
    (b.final_agreed_amount != null && b.final_agreed_amount > 0) ||
    b.evaluation_report_letter_no?.trim() ||
    b.evaluation_report_approval_date?.trim() ||
    b.review_extension_memo_no?.trim() ||
    b.review_extension_approval_date?.trim()
  );
}

export function isAppealBlocking(appeal: Pick<Step6AppealState, "appeal_status">): boolean {
  return appeal.appeal_status === "pending";
}

/** @deprecated ใช้ isAppealBlocking */
export function isStep4AppealBlocking(bidResult: { appeal_status?: StepAppealStatus }): boolean {
  return isAppealBlocking(bidResult);
}

export function isStep1ChecklistComplete(checklist: Step1Checklist): boolean {
  return STEP1_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
}

export function countStep1ChecklistDone(checklist: Step1Checklist): number {
  return STEP1_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
}

/** ปลดล็อกช่องรหัส e-GP — เมื่อแนบหลักฐานแผนจัดซื้อจัดจ้าง (ข้อ 2) แล้ว */
export function isStep1EgpCodeUnlocked(
  _checklist: Step1Checklist,
  opts?: { hasAnnualPlanDoc?: boolean; stepDocs?: Array<{ document_type: string }> },
): boolean {
  return !!(opts?.hasAnnualPlanDoc || hasStep1AnnualPlanDoc(opts?.stepDocs));
}

export type Step1ComplianceIssue = { id: string; message: string };

/** เอกสารบังคับขั้นตอนที่ 2 — ใช้ใน Compliance Gate (คำสั่งพิจารณาผล/ตรวจรับ = ไม่บังคับในด่าน 2) */
export const STEP2_REQUIRED_DOCS = {
  MARKET_QUOTES: "ใบเสนอราคาท้องตลาดอย่างน้อย 3 ราย",
} as const;

export function hasStep1AnnualPlanDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return hasStep1PlanPublicationDoc(stepDocs);
}

/** วงเงินสูงสุดสำหรับวิธีเฉพาะเจาะจง — ขั้นตอนที่ 1 */
export const STEP1_SPECIFIC_METHOD_MAX_BUDGET = 500_000;

export const STEP1_SPECIFIC_METHOD_BUDGET_EXCEEDED_MSG =
  "❌ วงเงินเกิน 500,000 บาท ไม่สามารถใช้วิธีเฉพาะเจาะจงได้ตามระเบียบกระทรวงการคลังฯ";

export const STEP1_SPECIFIC_METHOD_REASON_REQUIRED_MSG =
  "กรุณาระบุเหตุผลความจำเป็นในการใช้วิธีเฉพาะเจาะจง (ระเบียบพัสดุฯ ข้อ 79)";

/** ตรวจพิกัดสถานที่ดำเนินการ — บังคับครบทุกช่อง (ใช้ในรายงาน PDF ขั้น 10) */
export function getStep1SiteLocationComplianceIssues(
  profile: Step1ProjectProfile,
): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];
  if (!profile.site_village.trim()) {
    issues.push({ id: "site_village", message: "กรุณาระบุชื่อบ้าน/หมู่บ้าน" });
  }
  if (profile.site_moo == null || !Number.isFinite(profile.site_moo) || profile.site_moo <= 0) {
    issues.push({ id: "site_moo", message: "กรุณาระบุหมู่ที่" });
  }
  if (!profile.site_subdistrict.trim()) {
    issues.push({ id: "site_subdistrict", message: "กรุณาระบุตำบล" });
  }
  if (!profile.site_district.trim()) {
    issues.push({ id: "site_district", message: "กรุณาระบุอำเภอ" });
  }
  if (!profile.site_province.trim()) {
    issues.push({ id: "site_province", message: "กรุณาระบุจังหวัด" });
  }
  return issues;
}

export function isStep1SpecificMethodBudgetExceeded(
  budget: string,
  method: string,
): boolean {
  if (method !== "specific") return false;
  const val = parseBudgetInput(budget);
  return val > STEP1_SPECIFIC_METHOD_MAX_BUDGET;
}

/** Compliance Gate ขั้นตอนที่ 1 — เอกสารหลัก + ฟิลด์ฟอร์ม (ไม่ใช้ Smart Checklist) */
export function isStep1CoreDocumentsReady(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return hasStep1AnnualPlanDoc(stepDocs);
}

export function countStep1CoreDocumentsReady(
  stepDocs?: Array<{ document_type: string }>,
): { done: number; total: number } {
  return { done: hasStep1AnnualPlanDoc(stepDocs) ? 1 : 0, total: 1 };
}

export function getStep1RequiredFormFieldIssues(opts: {
  egpCode: string;
  budget: string;
  responsibleName: string;
  projectName: string;
  method: string;
  projectProfile: Step1ProjectProfile;
  specificMethodReason?: string;
}): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];
  const budgetVal = parseBudgetInput(opts.budget ?? "");
  if (!budgetVal || budgetVal <= 0) {
    issues.push({
      id: "budget_allocated",
      message: "กรุณาระบุวงเงินงบประมาณมากกว่า 0",
    });
  }
  if (!opts.egpCode?.trim()) {
    issues.push({
      id: "egp_plan_code",
      message: "กรุณาระบุรหัสแผนจัดซื้อจัดจ้าง e-GP",
    });
  }
  if (!opts.projectName?.trim()) {
    issues.push({
      id: "project_name",
      message: "กรุณาระบุชื่อโครงการ",
    });
  }
  if (!opts.method?.trim()) {
    issues.push({
      id: "procurement_method",
      message: "กรุณาเลือกประเภทโครงการ (วิธีจัดซื้อจัดจ้าง)",
    });
  }
  if (!opts.responsibleName?.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }
  issues.push(...getStep1SiteLocationComplianceIssues(opts.projectProfile));
  return issues;
}

export function countStep1FormRequiredProgress(opts: {
  egpCode: string;
  budget: string;
  responsibleName: string;
  projectName: string;
  method: string;
  projectProfile: Step1ProjectProfile;
  specificMethodReason?: string;
}): { done: number; total: number } {
  const total = 10 + (opts.method === "specific" ? 1 : 0);
  let done = 0;
  const budgetVal = parseBudgetInput(opts.budget ?? "");
  if (budgetVal > 0) done += 1;
  if (opts.egpCode?.trim()) done += 1;
  if (opts.projectName?.trim()) done += 1;
  if (opts.method?.trim()) done += 1;
  if (opts.responsibleName?.trim()) done += 1;
  const siteIssues = getStep1SiteLocationComplianceIssues(opts.projectProfile);
  done += 5 - siteIssues.length;
  if (opts.method === "specific" && opts.specificMethodReason?.trim()) done += 1;
  return { done, total };
}

export function getStep1ComplianceIssues(
  _checklist: Step1Checklist,
  opts: {
    egpCode: string;
    budget: string;
    responsibleName: string;
    projectName: string;
    method: string;
    projectProfile: Step1ProjectProfile;
    specificMethodReason?: string;
    stepDocs?: Array<{ document_type: string }>;
  },
  _autoStates?: Record<string, boolean>,
): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];

  if (isStep1SpecificMethodBudgetExceeded(opts.budget, opts.method)) {
    issues.push({
      id: "specific_method_budget_exceeded",
      message: STEP1_SPECIFIC_METHOD_BUDGET_EXCEEDED_MSG,
    });
  }

  if (opts.method === "specific" && !opts.specificMethodReason?.trim()) {
    issues.push({
      id: "specific_method_reason",
      message: STEP1_SPECIFIC_METHOD_REASON_REQUIRED_MSG,
    });
  }

  if (!isStep1CoreDocumentsReady(opts.stepDocs)) {
    issues.push({
      id: "annual_plan_doc",
      message: "กรุณาแนบเอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP",
    });
  }

  issues.push(...getStep1RequiredFormFieldIssues(opts));

  return issues;
}

export function isStep1ReadyForNext(
  checklist: Step1Checklist,
  opts: {
    egpCode: string;
    budget: string;
    responsibleName: string;
    projectName: string;
    method: string;
    projectProfile: Step1ProjectProfile;
    specificMethodReason?: string;
    stepDocs?: Array<{ document_type: string }>;
  },
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep1ComplianceIssues(checklist, opts, autoStates).length === 0;
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
  const fromNote = loadStep1FormFromNote(step.note);
  if (step.step1_checklist && typeof step.step1_checklist === "object") {
    return {
      ...fromNote,
      checklist: normalizeStep1Checklist(step.step1_checklist as Partial<Step1Checklist>),
    };
  }
  return fromNote;
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 1 จาก note */
export function loadStep1FormFromNote(note: string | null): Step1FormData {
  const { form } = parseStepNote(note);
  const f = form as Step1FormData;
  return {
    checklist: normalizeStep1Checklist(f.checklist),
    specificMethodReason:
      typeof f.specificMethodReason === "string" ? f.specificMethodReason : "",
  };
}

function normalizeStep2Checklist(
  raw: Partial<Step2Checklist> & Record<string, boolean> | null | undefined,
): Step2Checklist {
  const c = raw ?? {};
  const legacy = c as Record<string, boolean>;
  return {
    tor_median_committee_appointed: !!(
      c.tor_median_committee_appointed ??
      (legacy.committee_composition_verified && legacy.appointment_order_signed)
    ),
    integrity_letter_signed: !!(
      c.integrity_letter_signed ??
      legacy.committee_qualifications_verified ??
      legacy.committee_integrity_confirmed
    ),
    median_price_calculated_signed: !!(
      c.median_price_calculated_signed ?? legacy.median_price_calculated
    ),
    median_price_director_approved: !!(
      c.median_price_director_approved ?? legacy.median_price_director_signed
    ),
    bg06_table_verified: !!(c.bg06_table_verified ?? legacy.bg06_table_prepared),
  };
}

/** ประเภทเอกสารหนังสือแสดงความบริสุทธิ์ใจ — ขั้นตอนที่ 2 */
export const STEP2_INTEGRITY_LETTER_DOCUMENT_TYPE =
  "หนังสือแสดงความบริสุทธิ์ใจของกรรมการ";

/** ตรวจว่ามีไฟล์หนังสือแสดงความบริสุทธิ์ใจของกรรมการ */
export function hasStep2IntegrityLetterDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return (
    stepDocs?.some((d) => d.document_type === STEP2_INTEGRITY_LETTER_DOCUMENT_TYPE) ??
    false
  );
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
  "❌ ราคากลางสูงกว่างบประมาณที่ได้รับจัดสรร ไม่สามารถดำเนินการต่อได้";

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

/** จำนวนวันทำการจากวันคำสั่งแต่งตั้งถึงวันอนุมัติราคากลาง (รวมทั้งสองวัน) */
export function countStep2MedianProcessWorkdays(
  appointmentOrderISO: string,
  medianApprovalISO: string,
): number {
  return countWorkdaysBetweenISO(appointmentOrderISO.trim(), medianApprovalISO.trim());
}

/** ใช้เวลาจัดทำราคากลางเกินเกณฑ์ (Warning — ไม่บล็อก) */
export function isStep2MedianProcessSlow(
  appointmentOrderISO: string,
  medianApprovalISO: string,
): boolean {
  const days = countStep2MedianProcessWorkdays(appointmentOrderISO, medianApprovalISO);
  if (days <= 0) return false;
  return days > STEP2_MEDIAN_WORKDAYS_THRESHOLD;
}

export type Step2ComplianceIssue = { id: string; message: string };

function getStep2CommitteeChairComplianceIssues(
  committees: Step2CommitteesState,
): Step2ComplianceIssue[] {
  const issues: Step2ComplianceIssue[] = [];
  const pushIfDuplicate = (
    members: Step2CommitteeMember[],
    id: string,
    label: string,
  ) => {
    if (countStep2CommitteeChairs(members) > 1) {
      issues.push({
        id,
        message: `${label}: ${STEP2_DUPLICATE_CHAIR_MSG}`,
      });
    }
  };
  if (committees.appointment_mode === "combined") {
    pushIfDuplicate(
      committees.combined_members,
      "chair_duplicate_combined",
      "คณะกรรมการจัดทำ TOR และกำหนดราคากลาง",
    );
  } else {
    pushIfDuplicate(
      committees.tor_members,
      "chair_duplicate_tor",
      "คณะกรรมการจัดทำ TOR",
    );
    pushIfDuplicate(
      committees.median_price_members,
      "chair_duplicate_median",
      "คณะกรรมการกำหนดราคากลาง",
    );
  }
  return issues;
}

export function isStep2CoreDocumentsReady(opts: {
  hasAppointmentOrderDoc: boolean;
  hasBoqDoc: boolean;
  hasIntegrityLetterDoc: boolean;
  hasBg06Doc: boolean;
  hasMarketQuotesDoc: boolean;
}): boolean {
  return (
    opts.hasAppointmentOrderDoc &&
    opts.hasBoqDoc &&
    opts.hasIntegrityLetterDoc &&
    opts.hasBg06Doc &&
    opts.hasMarketQuotesDoc
  );
}

export function countStep2CoreDocumentsReady(opts: {
  hasAppointmentOrderDoc: boolean;
  hasBoqDoc: boolean;
  hasIntegrityLetterDoc: boolean;
  hasBg06Doc: boolean;
  stepDocs?: Array<{ document_type: string }>;
}): { done: number; total: number } {
  let done = 0;
  if (opts.hasAppointmentOrderDoc) done += 1;
  if (opts.hasBoqDoc) done += 1;
  if (opts.hasIntegrityLetterDoc) done += 1;
  if (opts.hasBg06Doc) done += 1;
  const quoteUploaded = countStep2MarketQuoteDocsUploaded(opts.stepDocs);
  done += Math.min(quoteUploaded, EMPTY_STEP2_MARKET_QUOTES.length);
  return { done, total: 4 + EMPTY_STEP2_MARKET_QUOTES.length };
}

export function getStep2RequiredFormFieldIssues(
  opts: Parameters<typeof getStep2ComplianceIssues>[1],
): Step2ComplianceIssue[] {
  const issues: Step2ComplianceIssue[] = [];

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

  issues.push(...getStep2CommitteeChairComplianceIssues(opts.committees));

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
  if (!opts.medianPrice.median_approval_letter_no?.trim()) {
    issues.push({
      id: "median_approval_letter_no",
      message: "กรุณาระบุเลขที่หนังสืออนุมัติราคากลาง",
    });
  }

  const price = opts.medianPrice.approved_median_price;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    issues.push({
      id: "approved_median_price",
      message: "กรุณาระบุราคากลาง (บาท)",
    });
  } else if (
    opts.step1Budget != null &&
    opts.step1Budget > 0 &&
    isStep2MedianPriceOverBudget(price, opts.step1Budget)
  ) {
    issues.push({
      id: "median_over_budget",
      message: STEP2_MEDIAN_OVER_BUDGET_MSG,
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

  if (!isStep2MarketQuotesComplete(opts.committees.market_quotes)) {
    issues.push({
      id: "market_quotes",
      message: "กรุณากรอกใบเสนอราคาท้องตลาดครบ 3 ราย (ชื่อซัพพลายเออร์และราคา)",
    });
  }

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        2,
        getStep2TimelineDateFields(opts.committeeOrder, opts.medianPrice),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function countStep2FormRequiredProgress(
  opts: Parameters<typeof getStep2ComplianceIssues>[1],
): { done: number; total: number } {
  const formIssues = getStep2RequiredFormFieldIssues(opts);
  const structuralIds = new Set([
    "committee_members_combined",
    "committee_members_tor",
    "committee_members_median",
    "appointment_order_no",
    "appointment_order_date",
    "median_approval_letter_no",
    "approved_median_price",
    "median_over_budget",
    "median_price_approval_date",
    "median_price_approval_before_appointment",
    "market_quotes",
    "responsible_officer",
  ]);
  const structuralIssueCount = formIssues.filter((i) => structuralIds.has(i.id)).length;
  const total = 11;
  return { done: Math.max(0, total - structuralIssueCount), total };
}

export function getStep2ComplianceIssues(
  _checklist: Step2Checklist,
  opts: {
    committees: Step2CommitteesState;
    committeeOrder: Step2CommitteeOrder;
    medianPrice: Step2MedianPrice;
    responsibleName: string;
    hasAppointmentOrderDoc: boolean;
    hasBoqDoc: boolean;
    hasBg06Doc: boolean;
    hasIntegrityLetterDoc: boolean;
    hasEvaluationInspectionOrderDoc?: boolean;
    hasMarketQuotesDoc: boolean;
    step1Budget?: number;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step2ComplianceIssue[] {
  const issues: Step2ComplianceIssue[] = [];

  if (!opts.hasAppointmentOrderDoc) {
    issues.push({
      id: "appointment_order_doc",
      message: "กรุณาแนบไฟล์เอกสารคำสั่งแต่งตั้ง",
    });
  }
  if (!opts.hasBoqDoc) {
    issues.push({
      id: "boq_doc",
      message: `กรุณาแนบไฟล์ "${STEP2_DOC.BOQ}"`,
    });
  }
  if (!opts.hasIntegrityLetterDoc) {
    issues.push({
      id: "integrity_letter_doc",
      message: "กรุณาแนบไฟล์หนังสือแสดงความบริสุทธิ์ใจของกรรมการ",
    });
  }
  if (!opts.hasBg06Doc) {
    issues.push({
      id: "bg06_doc",
      message: "กรุณาแนบไฟล์ตารางแสดงวงเงินราคากลาง (แบบ บก.06)",
    });
  }
  if (!opts.hasMarketQuotesDoc) {
    const uploaded = countStep2MarketQuoteDocsUploaded(opts.stepDocs);
    const required = EMPTY_STEP2_MARKET_QUOTES.length;
    issues.push({
      id: "market_quotes_doc",
      message:
        uploaded > 0
          ? `กรุณาแนบใบเสนอราคาท้องตลาดครบ ${required} ไฟล์ (แนบแล้ว ${uploaded}/${required} ราย — รายละ 1 ไฟล์ต่อซัพพลายเออร์)`
          : `กรุณาแนบใบเสนอราคาท้องตลาดครบ ${required} ไฟล์ (รายละ 1 ไฟล์ต่อซัพพลายเออร์)`,
    });
  }

  issues.push(...getStep2RequiredFormFieldIssues(opts));

  return issues;
}

export function isStep2ReadyForNext(
  checklist: Step2Checklist,
  opts: Parameters<typeof getStep2ComplianceIssues>[1],
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep2ComplianceIssues(checklist, opts, autoStates).length === 0;
}

/** สรุปสาเหตุที่ยังไปขั้นถัดไปไม่ได้ — สำหรับ debug ขั้นตอนที่ 2 */
export function getStep2ReadyDebugInfo(
  checklist: Step2Checklist,
  opts: Parameters<typeof getStep2ComplianceIssues>[1],
  autoStates?: Record<string, boolean>,
) {
  const issues = getStep2ComplianceIssues(checklist, opts, autoStates);
  const baseAuto =
    autoStates ??
    computeAutoChecklistState({
      stepNumber: 2,
      committees: opts.committees,
      committeeOrder: opts.committeeOrder,
      medianPrice: opts.medianPrice,
      hasAppointmentOrderDoc: opts.hasAppointmentOrderDoc,
      hasBg06Doc: opts.hasBg06Doc,
      hasIntegrityLetterDoc: opts.hasIntegrityLetterDoc,
    });
  const torMedianMembersOk =
    opts.committees.appointment_mode === "combined"
      ? countFilledCommitteeMembers(opts.committees.combined_members) >= 3
      : countFilledCommitteeMembers(opts.committees.tor_members) >= 3 &&
        countFilledCommitteeMembers(opts.committees.median_price_members) >= 3;
  const price = opts.medianPrice.approved_median_price;
  const medianCalculated =
    price != null && Number.isFinite(price) && price > 0;
  const mergedAuto = {
    ...baseAuto,
    tor_median_committee_appointed:
      torMedianMembersOk &&
      !!opts.committeeOrder.appointment_order_no?.trim() &&
      !!opts.committeeOrder.appointment_order_date?.trim() &&
      !!opts.hasAppointmentOrderDoc,
    integrity_letter_signed: !!opts.hasIntegrityLetterDoc,
    median_price_calculated_signed: medianCalculated,
    median_price_director_approved:
      !!opts.medianPrice.median_approval_letter_no?.trim(),
    bg06_table_verified: !!opts.hasBg06Doc,
  };
  const effectiveChecklist = buildEffectiveChecklist(
    2,
    checklist as Record<string, boolean>,
    mergedAuto,
    opts.stepDocs,
  );
  return {
    ready: issues.length === 0,
    issues,
    mergedAuto,
    effectiveChecklist,
  };
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
    committees: f.committees
      ? {
          ...EMPTY_STEP2_COMMITTEES,
          ...f.committees,
          combined_members: padCommitteeMemberList(f.committees.combined_members ?? []),
          tor_members: padCommitteeMemberList(f.committees.tor_members ?? []),
          median_price_members: padCommitteeMemberList(f.committees.median_price_members ?? []),
          evaluation_members: padCommitteeMemberList(f.committees.evaluation_members ?? []),
          inspection_members: padCommitteeMemberList(f.committees.inspection_members ?? []),
          market_quotes: normalizeStep2MarketQuotes(f.committees.market_quotes),
          market_survey_summary_reason: f.committees.market_survey_summary_reason?.trim() ?? "",
        }
      : undefined,
    complianceLog: f.complianceLog ?? {},
  };
}

type Step2ProjectLike = {
  committee_appointment_mode?: string | null;
  committee_appointment_order_no?: string | null;
  committee_appointment_order_date?: string | null;
  allocated_budget?: number | null;
  budget?: number | null;
  approved_median_price?: number | null;
  median_price_approval_date?: string | null;
  median_approval_letter_no?: string | null;
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
      allocated_budget:
        form.medianPrice?.allocated_budget != null &&
        Number.isFinite(form.medianPrice.allocated_budget) &&
        form.medianPrice.allocated_budget > 0
          ? form.medianPrice.allocated_budget
          : resolveProjectAllocatedBudget(project),
      median_approval_letter_no:
        form.medianPrice?.median_approval_letter_no?.trim() ||
        project.median_approval_letter_no?.trim() ||
        "",
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
    committees: form.committees
      ? {
          ...EMPTY_STEP2_COMMITTEES,
          ...form.committees,
          combined_members: padCommitteeMemberList(form.committees.combined_members ?? []),
          tor_members: padCommitteeMemberList(form.committees.tor_members ?? []),
          median_price_members: padCommitteeMemberList(form.committees.median_price_members ?? []),
          evaluation_members: padCommitteeMemberList(form.committees.evaluation_members ?? []),
          inspection_members: padCommitteeMemberList(form.committees.inspection_members ?? []),
          market_quotes: normalizeStep2MarketQuotes(form.committees.market_quotes),
          market_survey_summary_reason: form.committees.market_survey_summary_reason?.trim() ?? "",
        }
      : undefined,
    complianceLog: form.complianceLog ?? {},
  };
}

/** วงเงินที่ได้รับจัดสรร — ขั้นตอนที่ 2 (fallback งบ Step 1) */
export function resolveProjectAllocatedBudget(project: {
  allocated_budget?: number | null;
  budget?: number | null;
} | null): number | null {
  if (!project) return null;
  const allocated = project.allocated_budget;
  if (allocated != null && Number(allocated) > 0) return Number(allocated);
  const budget = project.budget;
  if (budget != null && Number(budget) > 0) return Number(budget);
  return null;
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
  const allocated = medianPrice.allocated_budget;
  const normalizedAllocated =
    allocated != null && Number.isFinite(allocated) && allocated > 0
      ? allocated
      : null;
  return {
    allocated_budget: normalizedAllocated,
    committee_appointment_mode: committees.appointment_mode,
    committee_appointment_order_no: committeeOrder.appointment_order_no?.trim() || null,
    committee_appointment_order_date:
      committeeOrder.appointment_order_date?.trim() || null,
    approved_median_price: normalized,
    /** ซิงก์ legacy column — ราคากลางบันทึกจากขั้นตอนที่ 2 เท่านั้น */
    estimated_price: normalized,
    median_price_approval_date: medianPrice.median_price_approval_date?.trim() || null,
    median_approval_letter_no: medianPrice.median_approval_letter_no?.trim() || null,
  };
}

/** ส่งต่อเลขที่หนังสืออนุมัติราคากลางจากขั้นตอนที่ 2 → ขั้นตอนที่ 3 */
export function mergeStep3AnnouncementFromStep2Project(
  announcement: Step3Announcement,
  project: { median_approval_letter_no?: string | null } | null,
): Step3Announcement {
  if (!project) return announcement;
  return {
    ...announcement,
    approval_letter_no:
      announcement.approval_letter_no?.trim() ||
      project.median_approval_letter_no?.trim() ||
      "",
  };
}

export function isStep4ChecklistComplete(checklist: Step4Checklist): boolean {
  return STEP4_CHECKLIST_ITEMS.every((item) => checklist[item.key]);
}

export function countStep4ChecklistDone(checklist: Step4Checklist): number {
  return STEP4_CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
}

export type Step4ComplianceIssue = { id: string; message: string };

export function isStep4CoreDocumentsReady(opts: {
  hasEgpBidSummaryDoc: boolean;
  hasBlacklistEvidenceDoc: boolean;
  hasConflictEvidenceDoc: boolean;
  hasCommitteeEvaluationDoc: boolean;
  hasEvaluationInspectionOrderDoc: boolean;
}): boolean {
  return (
    opts.hasEgpBidSummaryDoc &&
    opts.hasBlacklistEvidenceDoc &&
    opts.hasConflictEvidenceDoc &&
    opts.hasCommitteeEvaluationDoc &&
    opts.hasEvaluationInspectionOrderDoc
  );
}

export function countStep4CoreDocumentsReady(opts: {
  hasEgpBidSummaryDoc: boolean;
  hasBlacklistEvidenceDoc: boolean;
  hasConflictEvidenceDoc: boolean;
  hasCommitteeEvaluationDoc: boolean;
  hasEvaluationInspectionOrderDoc: boolean;
}): { done: number; total: number } {
  let done = 0;
  if (opts.hasEgpBidSummaryDoc) done += 1;
  if (opts.hasBlacklistEvidenceDoc) done += 1;
  if (opts.hasConflictEvidenceDoc) done += 1;
  if (opts.hasCommitteeEvaluationDoc) done += 1;
  if (opts.hasEvaluationInspectionOrderDoc) done += 1;
  return { done, total: 5 };
}

export function getStep4RequiredFormFieldIssues(
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    timeline?: Step4Timeline;
    timelineCtx?: TimelineValidationContext;
  },
): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];
  const timeline = opts.timeline ?? {
    bidPeriodStartISO: "",
    bidPeriodWorkdays: null,
    bidSubmissionEndISO: "",
    committeeReviewDeadlineISO: "",
  };

  if (!isStep4TimelineComplete(timeline)) {
    issues.push({
      id: "step4_timeline",
      message:
        "กรุณาระบุวันที่อนุมัติขอซื้อขอจ้างและระยะเวลารับซองราคา (วันทำการ) ในรายงานขอซื้อขอจ้าง ขั้นตอนที่ 3",
    });
  }

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
  if (
    bidResult.final_agreed_amount != null &&
    (!Number.isFinite(bidResult.final_agreed_amount) || bidResult.final_agreed_amount <= 0)
  ) {
    issues.push({
      id: "final_agreed_amount",
      message: "ราคาที่ตกลงซื้อหรือจ้างจริงต้องมากกว่า 0 (กลุ่มที่ 2)",
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
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามอนุมัติผล (กลุ่มที่ 3)",
    });
  } else if (
    isStep4EvaluationApprovalBeforeBidEnd(
      bidResult.evaluation_report_approval_date,
      timeline.bidSubmissionEndISO,
    )
  ) {
    issues.push({
      id: "evaluation_report_approval_date_min",
      message: STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
    });
  } else if (
    isStep4EvaluationApprovalOverdue(
      bidResult.evaluation_report_approval_date,
      timeline.committeeReviewDeadlineISO,
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

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบ",
    });
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        4,
        getStep4TimelineDateFields(bidResult),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function countStep4FormRequiredProgress(
  bidResult: Step4BidResult,
  opts: Parameters<typeof getStep4RequiredFormFieldIssues>[1],
): { done: number; total: number } {
  const formIssues = getStep4RequiredFormFieldIssues(bidResult, opts);
  const baseTotal = 7;
  const extensionNeeded =
    !!bidResult.evaluation_report_approval_date?.trim() &&
    isStep4EvaluationApprovalOverdue(
      bidResult.evaluation_report_approval_date,
      (opts.timeline ?? {}).committeeReviewDeadlineISO ?? "",
    );
  const total = baseTotal + (extensionNeeded ? 2 : 0);
  const done = Math.max(0, total - formIssues.length);
  return { done, total };
}

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — เอกสารหลัก + ฟอร์ม (ไม่ใช้ Smart Checklist) */
export function getStep4ComplianceIssues(
  _checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    hasEgpBidSummaryDoc: boolean;
    hasBlacklistEvidenceDoc: boolean;
    hasConflictEvidenceDoc: boolean;
    hasCommitteeEvaluationDoc: boolean;
    hasEvaluationInspectionOrderDoc: boolean;
    hasEvaluationOrderFromStep2?: boolean;
    timeline?: Step4Timeline;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];

  if (!opts.hasEgpBidSummaryDoc) {
    issues.push({
      id: "egp_bid_summary_doc",
      message: `กรุณาแนบเอกสาร "${STEP4_DOC.EGP_BID_SUMMARY}"`,
    });
  }
  if (!opts.hasBlacklistEvidenceDoc) {
    issues.push({
      id: "blacklist_evidence_doc",
      message: `กรุณาแนบเอกสาร "${STEP4_DOC.BLACKLIST_EVIDENCE}"`,
    });
  }
  if (!opts.hasConflictEvidenceDoc) {
    issues.push({
      id: "conflict_evidence_doc",
      message: `กรุณาแนบเอกสาร "${STEP4_DOC.CONFLICT_EVIDENCE}"`,
    });
  }
  if (!opts.hasCommitteeEvaluationDoc) {
    issues.push({
      id: "committee_evaluation_doc",
      message: `กรุณาแนบเอกสาร "${STEP4_DOC.COMMITTEE_EVALUATION_REPORT}"`,
    });
  }
  if (!opts.hasEvaluationInspectionOrderDoc) {
    issues.push({
      id: "evaluation_inspection_order_doc",
      message: STEP4_EVALUATION_INSPECTION_ORDER_REQUIRED_MSG,
    });
  }
  if (
    opts.hasEvaluationOrderFromStep2 &&
    !bidResult.evaluation_inspection_order_confirmed
  ) {
    issues.push({
      id: "evaluation_inspection_order_confirm",
      message:
        "กรุณาตรวจสอบคำสั่งแต่งตั้งจากขั้นตอนที่ 2 และกดยืนยันก่อนดำเนินการต่อ",
    });
  }

  issues.push(
    ...getStep4RequiredFormFieldIssues(bidResult, {
      responsibleName: opts.responsibleName,
      timeline: opts.timeline,
      timelineCtx: opts.timelineCtx,
    }),
  );

  return issues;
}

export type Step6ComplianceIssue = { id: string; message: string };

export function isStep6CoreDocumentsReady(
  appealStatus: string,
  opts: {
    hasNoAppealEgpDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
  },
): boolean {
  if (!appealStatus) return false;
  if (appealStatus === "none") return opts.hasNoAppealEgpDoc;
  if (appealStatus === "pending") return opts.hasAgencyReportDoc && opts.hasCgdReportDoc;
  return false;
}

export function countStep6CoreDocumentsReady(
  appealStatus: string,
  opts: {
    hasNoAppealEgpDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
  },
): { done: number; total: number } {
  if (!appealStatus) return { done: 0, total: 1 };
  if (appealStatus === "none") {
    return { done: opts.hasNoAppealEgpDoc ? 1 : 0, total: 1 };
  }
  if (appealStatus === "pending") {
    let done = 0;
    if (opts.hasAgencyReportDoc) done += 1;
    if (opts.hasCgdReportDoc) done += 1;
    return { done, total: 2 };
  }
  return { done: 0, total: 1 };
}

export function getStep6RequiredFormFieldIssues(
  appeal: Step6AppealState,
  opts: { responsibleName: string; timelineCtx?: TimelineValidationContext },
): Step6ComplianceIssue[] {
  const issues: Step6ComplianceIssue[] = [];
  const status = appeal.appeal_status ?? "";

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบ",
    });
  }
  if (!status) {
    issues.push({
      id: "appeal_status",
      message: "กรุณาเลือกสถานะการอุทธรณ์โครงการ",
    });
  }
  if (status === "pending") {
    if (!appeal.appeal_report_letter_no?.trim()) {
      issues.push({
        id: "appeal_report_letter_no",
        message: "กรุณาระบุเลขที่หนังสือรายงานผลการพิจารณาอุทธรณ์",
      });
    }
    if (!appeal.appeal_report_approval_date?.trim()) {
      issues.push({
        id: "appeal_report_approval_date",
        message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามในหนังสือผลอุทธรณ์",
      });
    }
  }
  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        6,
        getStep6TimelineDateFields(appeal),
        opts.timelineCtx,
      ),
    );
  }
  return issues;
}

export function countStep6FormRequiredProgress(
  appeal: Step6AppealState,
  opts: { responsibleName: string; timelineCtx?: TimelineValidationContext },
): { done: number; total: number } {
  const status = appeal.appeal_status ?? "";
  const total = status === "pending" ? 4 : 2;
  const formIssues = getStep6RequiredFormFieldIssues(appeal, opts);
  return { done: Math.max(0, total - formIssues.length), total };
}

/** ตรวจความพร้อมขั้นตอนที่ 6 — ฟอร์ม + เอกสารตามเคสอุทธรณ์ */
export function getStep6ComplianceIssues(
  appeal: Step6AppealState,
  _checklist: Step6Checklist,
  opts: {
    hasNoAppealEgpDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step6ComplianceIssue[] {
  const issues: Step6ComplianceIssue[] = [];
  const status = appeal.appeal_status ?? "";

  if (status === "none" && !opts.hasNoAppealEgpDoc) {
    issues.push({
      id: "no_appeal_egp_doc",
      message:
        "กรุณาแนบภาพแคปหน้าจอ e-GP ยืนยันไม่มีผู้ยื่นอุทธรณ์ (.pdf, .png, .jpg)",
    });
  }
  if (status === "pending") {
    if (!opts.hasAgencyReportDoc) {
      issues.push({
        id: "agency_appeal_report_doc",
        message: "กรุณาแนบหนังสือรายงานผลการพิจารณาอุทธรณ์ของหน่วยงาน (PDF)",
      });
    }
    if (!opts.hasCgdReportDoc) {
      issues.push({
        id: "cgd_appeal_report_doc",
        message: "กรุณาแนบหลักฐานส่งรายงานผลอุทธรณ์ให้กรมบัญชีกลาง (PDF)",
      });
    }
  }

  issues.push(
    ...getStep6RequiredFormFieldIssues(appeal, {
      responsibleName: opts.responsibleName,
      timelineCtx: opts.timelineCtx,
    }),
  );

  return issues;
}

/** @deprecated ใช้ getStep6ComplianceIssues */
export function getStep6AppealComplianceIssues(
  appeal: Step6AppealState,
): Step6ComplianceIssue[] {
  return getStep6ComplianceIssues(
    appeal,
    { ...EMPTY_STEP6_CHECKLIST },
    {
      hasNoAppealEgpDoc: false,
      hasAgencyReportDoc: false,
      hasCgdReportDoc: false,
      responsibleName: "",
    },
  );
}

export function isStep6ReadyForNext(
  appeal: Step6AppealState,
  checklist: Step6Checklist,
  opts: Parameters<typeof getStep6ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep6ComplianceIssues(appeal, checklist, opts, autoStates).length === 0;
}

export function isStep6AppealReadyForNext(
  appeal: Step6AppealState,
  checklist?: Step6Checklist,
  opts?: Parameters<typeof getStep6ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return isStep6ReadyForNext(
    appeal,
    checklist ?? { ...EMPTY_STEP6_CHECKLIST },
    opts ?? {
      hasNoAppealEgpDoc: false,
      hasAgencyReportDoc: false,
      hasCgdReportDoc: false,
      responsibleName: "",
    },
    autoStates,
  );
}

/** วันประกาศผู้ชนะ — จาก project หรือ note ขั้นตอนที่ 5 */
export function resolveWinnerAnnouncementDate(
  project: { winner_announcement_date?: string | null } | null,
  step5Note?: string | null,
): string {
  const fromProject = project?.winner_announcement_date?.trim() ?? "";
  if (fromProject) return fromProject;
  const step5Form = loadStep5FormFromNote(step5Note ?? null);
  return (
    mergeStep5FromProject(
      step5Form.announcement ?? { ...EMPTY_STEP5_ANNOUNCEMENT },
      project,
    ).winner_announcement_date?.trim() ?? ""
  );
}

export function isStep4ReadyForNext(
  checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: Parameters<typeof getStep4ComplianceIssues>[2],
): boolean {
  return getStep4ComplianceIssues(checklist, bidResult, opts).length === 0;
}

export type Step5ComplianceIssue = { id: string; message: string };

function buildStep5EvidenceFieldValues(announcement: Step5Announcement) {
  return {
    winner_announcement_no: announcement.winner_announcement_no,
    winner_announcement_date: announcement.winner_announcement_date,
  };
}

export function isStep5CoreDocumentsReady(opts: {
  hasEgpWinnerDoc: boolean;
  hasPhysicalBoardDoc: boolean;
  hasAllBiddersResultDoc: boolean;
}): boolean {
  return opts.hasEgpWinnerDoc && opts.hasPhysicalBoardDoc && opts.hasAllBiddersResultDoc;
}

export function countStep5CoreDocumentsReady(opts: {
  hasEgpWinnerDoc: boolean;
  hasPhysicalBoardDoc: boolean;
  hasAllBiddersResultDoc: boolean;
}): { done: number; total: number } {
  let done = 0;
  if (opts.hasEgpWinnerDoc) done += 1;
  if (opts.hasPhysicalBoardDoc) done += 1;
  if (opts.hasAllBiddersResultDoc) done += 1;
  return { done, total: 3 };
}

export function getStep5RequiredFormFieldIssues(
  announcement: Step5Announcement,
  opts: {
    evaluationApprovalDate: string;
    responsibleName: string;
    timelineCtx?: TimelineValidationContext;
  },
): Step5ComplianceIssue[] {
  const issues: Step5ComplianceIssue[] = [];
  const evaluationApprovalDate = opts.evaluationApprovalDate?.trim() ?? "";

  if (!announcement.winner_announcement_no?.trim()) {
    issues.push({
      id: "winner_announcement_no",
      message: "กรุณาระบุเลขที่ประกาศผลผู้ชนะในระบบ e-GP",
    });
  }
  if (!announcement.winner_announcement_date?.trim()) {
    issues.push({
      id: "winner_announcement_date",
      message: "กรุณาระบุวันที่ลงนามในประกาศผู้ชนะ",
    });
  } else if (
    evaluationApprovalDate &&
    isStep5WinnerAnnouncementBeforeEvaluation(
      announcement.winner_announcement_date,
      evaluationApprovalDate,
    )
  ) {
    issues.push({
      id: "winner_announcement_date_min",
      message: getStep5WinnerAnnouncementBeforeEvaluationMsg(evaluationApprovalDate),
    });
  }
  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }
  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        5,
        getStep5TimelineDateFields(announcement),
        opts.timelineCtx,
      ),
    );
  }
  return issues;
}

export function countStep5FormRequiredProgress(
  announcement: Step5Announcement,
  opts: Parameters<typeof getStep5RequiredFormFieldIssues>[1],
): { done: number; total: number } {
  const formIssues = getStep5RequiredFormFieldIssues(announcement, opts);
  const total = 3;
  return { done: Math.max(0, total - formIssues.length), total };
}

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 5 (เอกสารหลัก + ฟอร์ม) */
export function getStep5ComplianceIssues(
  _checklist: Step5Checklist,
  announcement: Step5Announcement,
  opts: {
    hasEgpWinnerDoc: boolean;
    hasPhysicalBoardDoc: boolean;
    hasAllBiddersResultDoc: boolean;
    evaluationApprovalDate: string;
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step5ComplianceIssue[] {
  const issues: Step5ComplianceIssue[] = [];

  if (!opts.hasEgpWinnerDoc) {
    issues.push({
      id: "egp_winner_doc",
      message: `กรุณาแนบเอกสาร "${STEP5_DOC.EGP_WINNER_ANNOUNCEMENT}"`,
    });
  }
  if (!opts.hasPhysicalBoardDoc) {
    issues.push({
      id: "physical_board_doc",
      message: `กรุณาแนบเอกสาร "${STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT}"`,
    });
  }
  if (!opts.hasAllBiddersResultDoc) {
    issues.push({
      id: "all_bidders_result_doc",
      message: `กรุณาแนบเอกสาร "${STEP5_DOC.ALL_BIDDERS_RESULT_NOTICE}"`,
    });
  }

  issues.push(
    ...getStep5RequiredFormFieldIssues(announcement, {
      evaluationApprovalDate: opts.evaluationApprovalDate,
      responsibleName: opts.responsibleName,
      timelineCtx: opts.timelineCtx,
    }),
  );

  return issues;
}

export function isStep5ReadyForNext(
  checklist: Step5Checklist,
  announcement: Step5Announcement,
  opts: Parameters<typeof getStep5ComplianceIssues>[2],
): boolean {
  return getStep5ComplianceIssues(checklist, announcement, opts).length === 0;
}

function step2FormHasPersistedData(form: Step2FormData): boolean {
  if (form.committeeOrder?.appointment_order_no?.trim()) return true;
  if (form.committeeOrder?.appointment_order_date?.trim()) return true;
  if (
    form.medianPrice?.approved_median_price != null &&
    Number.isFinite(form.medianPrice.approved_median_price) &&
    form.medianPrice.approved_median_price > 0
  ) {
    return true;
  }
  if (form.medianPrice?.median_price_approval_date?.trim()) return true;
  if (form.committees) {
    const c = form.committees;
    if (c.appointment_mode === "separate" || c.appointment_mode === "combined") return true;
    const lists = [c.combined_members, c.tor_members, c.median_price_members];
    if (lists.some((list) => list?.some((member) => getCommitteeMemberName(member).trim()))) {
      return true;
    }
    if (
      c.market_quotes?.some(
        (q) => !!q.supplier_name?.trim() || (q.quoted_price != null && q.quoted_price > 0),
      )
    ) {
      return true;
    }
    if (c.market_survey_summary_reason?.trim()) return true;
  }
  if (form.complianceLog && Object.keys(form.complianceLog).length > 0) return true;
  return false;
}

function formHasPersistedData(form: StepFormData): boolean {
  if (checklistHasAnyTrue(form.checklist as Record<string, boolean | undefined> | undefined)) {
    return true;
  }
  if ((form as Step1FormData).specificMethodReason?.trim()) return true;
  if (
    "committeeOrder" in form ||
    "medianPrice" in form ||
    "committees" in form ||
    "complianceLog" in form
  ) {
    if (step2FormHasPersistedData(form as Step2FormData)) return true;
  }
  if (announcementHasData((form as Step3FormData).announcement)) return true;
  if (step4BidResultHasData((form as Step4FormData).bidResult)) return true;
  if (step5AnnouncementHasData((form as Step5FormData).announcement)) return true;
  if (step7ContractNoticeHasData((form as Step7FormData).contractNotice)) return true;
  if (step8ContractExecutionHasData((form as Step8FormData).contractExecution)) return true;
  return step9ContractScheduleHasData((form as Step9FormData).contractSchedule);
}

function step9ContractScheduleHasData(schedule?: Step9ContractSchedule): boolean {
  if (!schedule) return false;
  return !!(
    (schedule.contract_duration_days != null && schedule.contract_duration_days > 0) ||
    (schedule.total_installment_count != null && schedule.total_installment_count > 0) ||
    schedule.work_start_date?.trim() ||
    schedule.notice_to_proceed_date?.trim() ||
    schedule.egp_essential_publication_date?.trim() ||
    schedule.egp_contract_control_no?.trim() ||
    schedule.notice_to_proceed_letter_no?.trim()
  );
}

function step7ContractNoticeHasData(notice?: Step7ContractNotice): boolean {
  if (!notice) return false;
  return !!(
    notice.contract_notice_letter_no?.trim() || notice.contract_notice_letter_date?.trim()
  );
}

function step8ContractExecutionHasData(execution?: Step8ContractExecution): boolean {
  if (!execution) return false;
  return !!(
    execution.contract_no?.trim() ||
    execution.contract_signed_date?.trim() ||
    (execution.contract_amount != null && execution.contract_amount > 0) ||
    execution.guarantee_type ||
    (execution.guarantee_amount != null && execution.guarantee_amount > 0) ||
    execution.guarantee_document_no?.trim()
  );
}

function step5AnnouncementHasData(announcement?: Step5Announcement): boolean {
  if (!announcement) return false;
  return !!(
    announcement.winner_announcement_no?.trim() || announcement.winner_announcement_date?.trim()
  );
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

export type Step3ComplianceWarning = { id: string; message: string };

/** ชื่อกรรมการที่ซ้ำระหว่างชุดพิจารณาผลและชุดตรวจรับ (จากขั้นตอนที่ 2) */
export function detectCommitteeEvaluationInspectionOverlap(
  committees: Step2CommitteesState,
): string[] {
  const evalNames = new Set(
    committees.evaluation_members
      .map((m) => getCommitteeMemberName(m).trim().toLowerCase())
      .filter(Boolean),
  );
  const overlaps: string[] = [];
  for (const member of committees.inspection_members) {
    const name = getCommitteeMemberName(member).trim();
    if (name && evalNames.has(name.toLowerCase())) {
      overlaps.push(name);
    }
  }
  return [...new Set(overlaps)];
}

export const STEP3_COMMITTEE_OVERLAP_WARNING_MSG =
  "⚠️ พบชื่อกรรมการซ้ำระหว่างชุดพิจารณาผลและชุดตรวจรับ — โปรดบันทึกเหตุผลประกอบใน Log";

export function buildStep3ComplianceLog(
  committees: Step2CommitteesState,
  overlapReason: string,
  previous?: Step3ComplianceLog,
): Step3ComplianceLog {
  const names = detectCommitteeEvaluationInspectionOverlap(committees);
  if (names.length === 0) {
    return { committee_overlap_warning: false };
  }
  const reason =
    overlapReason.trim() ||
    previous?.committee_overlap_reason?.trim() ||
    `ชื่อซ้ำระหว่างคณะพิจารณาผลและคณะตรวจรับ: ${names.join(", ")}`;
  return {
    committee_overlap_warning: true,
    committee_overlap_warning_at:
      previous?.committee_overlap_warning_at ?? new Date().toISOString(),
    committee_overlap_names: names,
    committee_overlap_reason: reason,
  };
}

export function logStep3ComplianceWarnings(
  projectId: string,
  complianceLog: Step3ComplianceLog,
): void {
  if (!complianceLog.committee_overlap_warning) return;
  console.warn("[Step3][Compliance] committee_overlap_warning", {
    projectId,
    names: complianceLog.committee_overlap_names,
    reason: complianceLog.committee_overlap_reason,
    loggedAt: complianceLog.committee_overlap_warning_at,
  });
}

/** Hard Block — วงเงิน > 10 ล้าน ต้องจัดฟังคำวิจารณ์ (ห้ามข้าม) */
export function getStep3MandatoryHearingGateIssues(
  budget: number,
  announcement: Step3Announcement,
): Step3ComplianceIssue[] {
  if (getStep3HearingTier(budget) !== "mandatory") return [];
  if (announcement.hearing_skipped) {
    return [{ id: "mandatory_hearing_skipped", message: STEP3_MANDATORY_HEARING_BLOCK_MSG }];
  }
  const active = shouldShowStep3HearingForm(
    "mandatory",
    !!announcement.hearing_proceed,
    !!announcement.hearing_skipped,
  );
  if (!active) {
    return [{ id: "mandatory_hearing_incomplete", message: STEP3_MANDATORY_HEARING_BLOCK_MSG }];
  }
  return [];
}

/** Warning — วงเงิน ≤ 10 ล้าน ไม่บังคับรายงานรับฟัง (ดุลยพินิจ) */
export function getStep3ComplianceWarnings(
  announcement: Step3Announcement,
  opts: {
    budget: number;
    hasFeedbackReportDoc: boolean;
    hearingFormActive: boolean;
  },
): Step3ComplianceWarning[] {
  const warnings: Step3ComplianceWarning[] = [];
  const tier = getStep3HearingTier(opts.budget);
  if (tier !== "mandatory") {
    warnings.push({
      id: "discretionary_hearing",
      message: STEP3_DISCRETIONARY_HEARING_WARNING_MSG,
    });
  }
  if (!opts.hearingFormActive || tier === "mandatory") return warnings;

  const missingFeedback =
    !announcement.feedback_result ||
    !announcement.feedback_report_no?.trim() ||
    !opts.hasFeedbackReportDoc;
  if (missingFeedback) {
    warnings.push({
      id: "feedback_soft",
      message: STEP3_FEEDBACK_SOFT_WARNING_MSG,
    });
  }
  return warnings;
}

export function getStep3ComplianceIssues(
  checklist: Step3Checklist,
  opts: {
    announcement: Step3Announcement;
    responsibleName: string;
    budget: number;
    approvedMedianPrice: number | null;
    medianPriceApprovalDate: string | null;
    hasMemoDoc: boolean;
    hasDraftTorDoc: boolean;
    hasDraftAnnouncementDoc: boolean;
    hasBg06Doc: boolean;
    hasEgpAnnouncementDoc: boolean;
    hasEgpScreenshotDoc: boolean;
    hasFeedbackReportDoc: boolean;
    hearingFormActive: boolean;
    timelineCtx?: TimelineValidationContext;
    /** เอกสารขั้น 3 — ใช้คำนวณ Smart Checklist ให้ตรงกับ UI */
    step3Docs?: Array<{ document_type: string }>;
  },
  autoStates?: Record<string, boolean>,
): Step3ComplianceIssue[] {
  if (!opts.hearingFormActive) return [];

  const issues: Step3ComplianceIssue[] = [];
  issues.push(...getStep3MandatoryHearingGateIssues(opts.budget, opts.announcement));

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
      message: "กรุณาแนบไฟล์ตารางราคากลาง (บก.06) — อัปโหลดในขั้นตอนนี้หรือขั้นตอนที่ 2",
    });
  }

  issues.push(...getStep3RequiredFormFieldIssues(opts.announcement));

  return issues;
}

export function isStep3ReadyForNext(
  checklist: Step3Checklist,
  opts: Parameters<typeof getStep3ComplianceIssues>[1],
): boolean {
  const mandatoryGate = getStep3MandatoryHearingGateIssues(opts.budget, opts.announcement);
  if (mandatoryGate.length > 0) return false;
  if (!opts.hearingFormActive) return true;
  return (
    isStep3CoreDocumentsReady(opts) &&
    getStep3RequiredFormFieldIssues(opts.announcement).length === 0
  );
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
    complianceLog: f.complianceLog ?? {},
  };
}

/** รวมค่าจาก project columns เข้ากับ announcement จาก note */
export function mergeStep5FromProject(
  announcement: Step5Announcement,
  project: {
    winner_announcement_no?: string | null;
    winner_announcement_date?: string | null;
  } | null,
): Step5Announcement {
  if (!project) return announcement;
  return {
    winner_announcement_no:
      announcement.winner_announcement_no?.trim() ||
      project.winner_announcement_no ||
      "",
    winner_announcement_date:
      announcement.winner_announcement_date?.trim() ||
      project.winner_announcement_date ||
      "",
  };
}

export type Step7ComplianceIssue = { id: string; message: string };

export const STEP7_NOTIFICATION_DEADLINE_EXCEEDED_MSG = (deadlineISO: string) =>
  `❌ วันที่ออกหนังสือแจ้งเกิน ${CONTRACT_NOTIFICATION_WORKDAYS} วันทำการตามระเบียบข้อ 161 (เดดไลน์: ${formatThaiDateSlash(deadlineISO)})`;

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 7 (3/3 Checklist + หนังสือแจ้งทำสัญญา) */
export function getStep7ComplianceIssues(
  contractNotice: Step7ContractNotice,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    appealDeadlineISO: string;
    notificationDeadlineISO: string;
    hasDraftContractDoc: boolean;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  autoStates?: Record<string, boolean>,
): Step7ComplianceIssue[] {
  const issues: Step7ComplianceIssue[] = [];
  const auto =
    autoStates ??
    computeAutoChecklistState({
      stepNumber: 7,
      step7ContractNotice: contractNotice,
    });
  const effective = buildEffectiveChecklist(
    7,
    manualChecklist,
    auto,
    opts.stepDocs,
  );

  if (!contractNotice?.contract_notice_letter_no?.trim()) {
    issues.push({
      id: "contract_notice_letter_no",
      message: "กรุณาระบุเลขที่หนังสือแจ้งให้ผู้ชนะมาลงนามในสัญญา",
    });
  }
  const letterDate = contractNotice?.contract_notice_letter_date?.trim() ?? "";
  if (!letterDate) {
    issues.push({
      id: "contract_notice_letter_date",
      message: "กรุณาระบุวันที่ออกหนังสือแจ้ง",
    });
  }
  const appealEnd = opts.appealDeadlineISO?.trim() ?? "";
  if (
    letterDate &&
    appealEnd &&
    isContractActionBeforeAppealPeriodEnds(letterDate, appealEnd)
  ) {
    issues.push({
      id: "contract_notice_letter_date_min",
      message: `วันที่ออกหนังสือแจ้งต้องไม่ก่อนวันพ้นระยะอุทธรณ์ (7 วันทำการจากวันประกาศผล — ลงนามได้ตั้งแต่ ${formatThaiDateSlash(
        computeContractEarliestFromAppealDeadlineISO(appealEnd),
      )})`,
    });
  }
  const notificationDeadline = opts.notificationDeadlineISO?.trim() ?? "";
  if (
    letterDate &&
    notificationDeadline &&
    isStep7NotificationLetterTooLate(letterDate, notificationDeadline)
  ) {
    issues.push({
      id: "contract_notice_letter_date_deadline",
      message: STEP7_NOTIFICATION_DEADLINE_EXCEEDED_MSG(notificationDeadline),
    });
  }
  if (!opts.hasDraftContractDoc) {
    issues.push({
      id: "draft_contract_doc",
      message: `กรุณาแนบเอกสาร "${STEP7_DOC.DRAFT_CONTRACT}"`,
    });
  }

  STEP7_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!effective[item.key]) {
      const prefix =
        item.mode === "auto" ? "ระบบตรวจพบยังไม่ครบ (Auto)" : "ยังไม่ได้แนบหลักฐาน";
      issues.push({
        id: `checklist-${item.key}`,
        message: `${prefix} ข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        7,
        getStep7TimelineDateFields(contractNotice),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function isStep7ReadyForNext(
  contractNotice: Step7ContractNotice,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: Parameters<typeof getStep7ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return (
    getStep7ComplianceIssues(contractNotice, manualChecklist, opts, autoStates).length === 0
  );
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 7 จาก note */
export function loadStep7FormFromNote(note: string | null): Step7FormData {
  const { form } = parseStepNote(note);
  const f = form as Step7FormData;
  return {
    checklist: f.checklist,
    contractNotice: {
      ...EMPTY_STEP7_CONTRACT_NOTICE,
      ...f.contractNotice,
    },
  };
}

export function resolveDefaultStep8ContractAmount(
  project: {
    final_agreed_amount?: number | null;
    winning_bid_amount?: number | null;
  } | null,
  bidResult?: Pick<Step4BidResult, "final_agreed_amount" | "winning_bid_amount">,
): number | null {
  if (bidResult) return resolveStep4ContractAmount(bidResult);
  return resolveStep4ContractAmount({
    final_agreed_amount: project?.final_agreed_amount ?? null,
    winning_bid_amount: project?.winning_bid_amount ?? null,
  });
}

export function mergeStep8FromProject(
  execution: Step8ContractExecution,
  project: {
    contract_no?: string | null;
    contract_signed_date?: string | null;
    final_agreed_amount?: number | null;
    winning_bid_amount?: number | null;
    contract_guarantee_type?: string | null;
    contract_guarantee_amount?: number | null;
    contract_guarantee_document_no?: string | null;
  } | null,
  step4BidResult?: Pick<Step4BidResult, "final_agreed_amount" | "winning_bid_amount"> | null,
): Step8ContractExecution {
  const defaultAmount = resolveDefaultStep8ContractAmount(project, step4BidResult ?? undefined);
  return {
    contract_no: execution.contract_no?.trim() || project?.contract_no?.trim() || "",
    contract_signed_date:
      execution.contract_signed_date?.trim() || project?.contract_signed_date?.trim() || "",
    contract_amount:
      execution.contract_amount != null && execution.contract_amount > 0
        ? execution.contract_amount
        : defaultAmount,
    guarantee_type:
      execution.guarantee_type ||
      parseStep8GuaranteeTypeFromProject(project?.contract_guarantee_type),
    guarantee_amount:
      execution.guarantee_amount != null && execution.guarantee_amount > 0
        ? execution.guarantee_amount
        : project?.contract_guarantee_amount ?? null,
    guarantee_document_no:
      execution.guarantee_document_no?.trim() ||
      project?.contract_guarantee_document_no?.trim() ||
      "",
  };
}

export function buildProjectStep8Fields(execution: Step8ContractExecution) {
  const guaranteeLabel = execution.guarantee_type
    ? step8GuaranteeTypeLabel(execution.guarantee_type)
    : null;
  return {
    contract_no: execution.contract_no?.trim() || null,
    contract_signed_date: execution.contract_signed_date?.trim() || null,
    final_agreed_amount:
      execution.contract_amount != null && execution.contract_amount > 0
        ? execution.contract_amount
        : null,
    contract_guarantee_type: guaranteeLabel,
    contract_guarantee_amount:
      execution.guarantee_amount != null && execution.guarantee_amount > 0
        ? execution.guarantee_amount
        : null,
    contract_guarantee_document_no: execution.guarantee_document_no?.trim() || null,
  };
}

/** มูลค่าหลักประกันขั้นต่ำแนะนำ — 5% ของมูลค่าสัญญา */
export function computeRecommendedGuaranteeAmount(
  contractAmount: number | null | undefined,
): number | null {
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    return null;
  }
  return Math.round(contractAmount * 0.05 * 100) / 100;
}

export type Step8ComplianceIssue = { id: string; message: string };

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 8 (3/3 Checklist) */
export function getStep8ComplianceIssues(
  contractExecution: Step8ContractExecution,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    earliestSigningISO: string;
    appealDeadlineISO: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  autoStates?: Record<string, boolean>,
): Step8ComplianceIssue[] {
  const issues: Step8ComplianceIssue[] = [];
  const auto =
    autoStates ??
    computeAutoChecklistState({
      stepNumber: 8,
      step8ContractExecution: contractExecution,
    });
  const effective = buildEffectiveChecklist(
    8,
    manualChecklist,
    auto,
    opts.stepDocs,
  );

  if (!contractExecution?.contract_no?.trim()) {
    issues.push({ id: "contract_no", message: "กรุณาระบุเลขที่สัญญา" });
  }
  const signedDate = contractExecution?.contract_signed_date?.trim() ?? "";
  if (!signedDate) {
    issues.push({ id: "contract_signed_date", message: "กรุณาระบุวันที่ลงนามในสัญญา" });
  }
  const appealEnd = opts.appealDeadlineISO?.trim() ?? "";
  if (signedDate && appealEnd && isContractActionBeforeAppealPeriodEnds(signedDate, appealEnd)) {
    issues.push({
      id: "contract_signed_date_appeal",
      message: `ห้ามเลือกวันที่ลงนามในสัญญาก่อนวันพ้นระยะอุทธรณ์ (7 วันทำการจากวันประกาศผล — ลงนามได้ตั้งแต่ ${formatThaiDateSlash(
        computeContractEarliestFromAppealDeadlineISO(appealEnd),
      )})`,
    });
  }
  const contractAmount = contractExecution?.contract_amount;
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    issues.push({
      id: "contract_amount",
      message: "กรุณาระบุมูลค่าสัญญาจัดซื้อจัดจ้างจริง (บาท)",
    });
  }
  if (!contractExecution?.guarantee_type) {
    issues.push({ id: "guarantee_type", message: "กรุณาเลือกประเภทหลักประกันสัญญา" });
  }
  const guaranteeAmount = contractExecution?.guarantee_amount;
  if (guaranteeAmount == null || !Number.isFinite(guaranteeAmount) || guaranteeAmount <= 0) {
    issues.push({
      id: "guarantee_amount",
      message: "กรุณาระบุมูลค่าหลักประกันสัญญา (บาท)",
    });
  }
  if (!contractExecution?.guarantee_document_no?.trim()) {
    issues.push({
      id: "guarantee_document_no",
      message: "กรุณาระบุเลขที่เอกสารหลักประกัน",
    });
  }

  STEP8_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!effective[item.key]) {
      const prefix =
        item.mode === "auto" ? "ระบบตรวจพบยังไม่ครบ (Auto)" : "ยังไม่ได้แนบหลักฐาน";
      issues.push({
        id: `checklist-${item.key}`,
        message: `${prefix} ข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        8,
        getStep8TimelineDateFields(contractExecution),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function isStep8ReadyForNext(
  contractExecution: Step8ContractExecution,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: Parameters<typeof getStep8ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return (
    getStep8ComplianceIssues(contractExecution, manualChecklist, opts, autoStates).length === 0
  );
}

function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** เปรียบเทียบวันที่ ISO (yyyy-mm-dd) — a อยู่ก่อน b หรือไม่ */
export function isISODateBefore(a: string, b: string): boolean {
  const da = parseLocalISODate(a);
  const db = parseLocalISODate(b);
  if (!da || !db) return false;
  return da.getTime() < db.getTime();
}

/** ล้างวันเริ่มงานถ้าอยู่ก่อนวันลงนามสัญญา (ขั้น 8) */
export function sanitizeStep9WorkStartAgainstSignedDate(
  schedule: Step9ContractSchedule,
  contractSignedDate?: string | null,
): Step9ContractSchedule {
  const signed = contractSignedDate?.trim();
  if (!signed) return schedule;
  const workStart =
    schedule.work_start_date?.trim() || schedule.notice_to_proceed_date?.trim() || "";
  if (!workStart || !isISODateBefore(workStart, signed)) return schedule;
  return syncStep9WorkStartDate(schedule, "");
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** บวกวันปฏิทินตรงๆ — ไม่ตัดวันหยุดราชการ */
export function addCalendarDaysISO(iso: string, days: number): string | null {
  const start = parseLocalISODate(iso);
  if (!start || days < 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return toLocalISO(end);
}

/** วันครบกำหนดสิ้นสุดสัญญา — วันเริ่มงาน + ระยะเวลาทำงาน (วันปฏิทินตรงๆ) */
export function computeStep9ContractEndDateISO(
  workStartISO: string,
  durationDays: number | null | undefined,
): string | null {
  const start = workStartISO?.trim();
  if (!start) return null;
  const days = durationDays;
  if (days == null || !Number.isFinite(days) || days <= 0) return null;
  return addCalendarDaysISO(start, Math.round(days));
}

/** Sync วันเริ่มงานระหว่างกลุ่มที่ 2 และกลุ่มที่ 3 */
export function syncStep9WorkStartDate(
  schedule: Step9ContractSchedule,
  workStartISO: string,
): Step9ContractSchedule {
  const v = workStartISO.trim();
  return {
    ...schedule,
    work_start_date: v,
    notice_to_proceed_date: v,
  };
}

export function mergeStep9ScheduleFromSources(
  schedule: Step9ContractSchedule,
  opts: {
    step7NoticeDate?: string | null;
    savedDueDate?: string | null;
    contractDurationDays?: number | null;
    /** วันที่ลงนามสัญญา (ขั้น 8) — วันเริ่มงานต้องไม่ก่อนวันนี้ */
    contractSignedDate?: string | null;
  },
): Step9ContractSchedule {
  const signed = opts.contractSignedDate?.trim() || "";
  let workStart =
    schedule.work_start_date?.trim() || schedule.notice_to_proceed_date?.trim() || "";
  if (!workStart) {
    const fromStep7 = opts.step7NoticeDate?.trim() || "";
    if (fromStep7 && (!signed || !isISODateBefore(fromStep7, signed))) {
      workStart = fromStep7;
    }
  }
  const duration =
    schedule.contract_duration_days != null && schedule.contract_duration_days > 0
      ? schedule.contract_duration_days
      : opts.contractDurationDays != null && opts.contractDurationDays > 0
        ? opts.contractDurationDays
        : null;
  const synced = syncStep9WorkStartDate(
    { ...EMPTY_STEP9_CONTRACT_SCHEDULE, ...schedule, contract_duration_days: duration },
    workStart,
  );
  return sanitizeStep9WorkStartAgainstSignedDate(synced, signed);
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 9 จาก note */
export function loadStep9FormFromNote(note: string | null): Step9FormData {
  const { form } = parseStepNote(note);
  const f = form as Step9FormData;
  const raw = f.contractSchedule;
  const workStart = raw?.work_start_date?.trim() || raw?.notice_to_proceed_date?.trim() || "";
  return {
    checklist: f.checklist,
    contractSchedule: syncStep9WorkStartDate(
      {
        ...EMPTY_STEP9_CONTRACT_SCHEDULE,
        ...raw,
        contract_duration_days: raw?.contract_duration_days ?? null,
        total_installment_count: raw?.total_installment_count ?? null,
        egp_essential_publication_date: raw?.egp_essential_publication_date ?? "",
        egp_contract_control_no: raw?.egp_contract_control_no ?? "",
        notice_to_proceed_letter_no: raw?.notice_to_proceed_letter_no ?? "",
      },
      workStart,
    ),
  };
}

export type Step9ComplianceIssue = { id: string; message: string };

/** ข้อมูลจากกล่องพิเศษ Step 9 — ซิงค์เทียบเท่า Step 1 / 2 / 4 (โหมด external) */
export type Step9ExternalCaptureInput = {
  profile: Step1ProjectProfile;
  medianPrice: Step2MedianPrice;
  bidResult: Pick<
    Step4BidResult,
    | "site_supervisor_name"
    | "site_supervisor_affiliation"
    | "site_engineer_name"
    | "final_agreed_amount"
  >;
};

export function getStep9ExternalCaptureComplianceIssues(
  capture: Step9ExternalCaptureInput,
): Step9ComplianceIssue[] {
  const issues: Step9ComplianceIssue[] = [];
  const { profile, medianPrice, bidResult } = capture;

  if (!profile.site_village.trim()) {
    issues.push({ id: "ext_site_village", message: "กรุณาระบุชื่อบ้าน/หมู่บ้าน (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (profile.site_moo == null || !Number.isFinite(profile.site_moo) || profile.site_moo <= 0) {
    issues.push({ id: "ext_site_moo", message: "กรุณาระบุหมู่ที่ (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (!profile.site_subdistrict.trim()) {
    issues.push({ id: "ext_site_subdistrict", message: "กรุณาระบุตำบล (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (!profile.site_district.trim()) {
    issues.push({ id: "ext_site_district", message: "กรุณาระบุอำเภอ (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (!profile.site_province.trim()) {
    issues.push({ id: "ext_site_province", message: "กรุณาระบุจังหวัด (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (!profile.activity_type.trim()) {
    issues.push({ id: "ext_activity_type", message: "กรุณาระบุประเภทกิจกรรม/งาน (กล่องบันทึกสัญญาส่วนกลาง)" });
  }
  if (!profile.result_unit.trim()) {
    issues.push({ id: "ext_result_unit", message: "กรุณาเลือกหน่วยวัดผลสัมฤทธิ์ (กล่องบันทึกสัญญาส่วนกลาง)" });
  }

  const allocated = medianPrice.allocated_budget;
  if (allocated == null || !Number.isFinite(allocated) || allocated <= 0) {
    issues.push({
      id: "ext_allocated_budget",
      message: "กรุณาระบุวงเงินงบประมาณที่ได้รับจัดสรร (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }
  const median = medianPrice.approved_median_price;
  if (median == null || !Number.isFinite(median) || median <= 0) {
    issues.push({
      id: "ext_approved_median_price",
      message: "กรุณาระบุมูลค่าราคากลาง (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }
  const contractAmount = bidResult.final_agreed_amount;
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    issues.push({
      id: "ext_contract_amount",
      message: "กรุณาระบุราคาประมูลตามสัญญาจ้างจริง (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }

  if (!bidResult.site_supervisor_name?.trim()) {
    issues.push({
      id: "ext_site_supervisor_name",
      message: "กรุณาระบุชื่อ-นามสกุล ผู้ควบคุมงาน (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }
  if (!bidResult.site_supervisor_affiliation?.trim()) {
    issues.push({
      id: "ext_site_supervisor_affiliation",
      message: "กรุณาระบุตำแหน่ง/สังกัด ผู้ควบคุมงาน (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }
  if (!bidResult.site_engineer_name?.trim()) {
    issues.push({
      id: "ext_site_engineer_name",
      message: "กรุณาระบุชื่อวิศวกรผู้รับผิดชอบ (กล่องบันทึกสัญญาส่วนกลาง)",
    });
  }

  return issues;
}

/** บันทึกลง projects — ข้อมูลกล่องพิเศษ Step 9 (โหมด external) */
export function buildProjectStep9ExternalCaptureFields(capture: Step9ExternalCaptureInput) {
  const { profile, medianPrice, bidResult } = capture;
  const allocated = medianPrice.allocated_budget;
  const normalizedAllocated =
    allocated != null && Number.isFinite(allocated) && allocated > 0 ? allocated : null;
  const price = medianPrice.approved_median_price;
  const normalizedPrice =
    price != null && Number.isFinite(price) && price > 0 ? price : null;
  const finalAmount = bidResult.final_agreed_amount;
  const normalizedFinal =
    finalAmount != null && Number.isFinite(finalAmount) && finalAmount > 0
      ? finalAmount
      : null;

  return {
    ...buildProjectStep1ProfileFields(profile),
    allocated_budget: normalizedAllocated,
    approved_median_price: normalizedPrice,
    estimated_price: normalizedPrice,
    site_supervisor_name: bidResult.site_supervisor_name?.trim() || null,
    site_supervisor_affiliation: bidResult.site_supervisor_affiliation?.trim() || null,
    site_engineer_name: bidResult.site_engineer_name?.trim() || null,
    final_agreed_amount: normalizedFinal,
  };
}

export function getStep9ComplianceIssues(
  schedule: Step9ContractSchedule,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    contractSignedDate?: string | null;
    procurementPath?: string | null;
    externalCapture?: Step9ExternalCaptureInput;
    timelineCtx?: TimelineValidationContext;
  },
  autoStates?: Record<string, boolean>,
): Step9ComplianceIssue[] {
  const issues: Step9ComplianceIssue[] = [];
  const auto =
    autoStates ??
    computeAutoChecklistState({
      stepNumber: 9,
      step9ContractSchedule: schedule,
      uploadedDocTypes: (opts.stepDocs ?? []).map((d) => d.document_type),
    });
  const effective = buildEffectiveChecklist(
    9,
    manualChecklist,
    auto,
    opts.stepDocs,
  );

  const duration = schedule.contract_duration_days;
  if (duration == null || !Number.isFinite(duration) || duration <= 0) {
    issues.push({
      id: "contract_duration_days",
      message: "กรุณาระบุระยะเวลาทำงานตามสัญญา (วัน)",
    });
  }
  const installments = schedule.total_installment_count;
  if (installments == null || !Number.isFinite(installments) || installments <= 0) {
    issues.push({
      id: "total_installment_count",
      message: "กรุณาระบุจำนวนงวดงานทั้งหมดตามสัญญา",
    });
  }
  if (!schedule.work_start_date?.trim()) {
    issues.push({
      id: "work_start_date",
      message: "กรุณาระบุวันที่เริ่มปฏิบัติงานหน้างาน",
    });
  }
  const signedDate = opts.contractSignedDate?.trim() ?? "";
  const egpPublication = schedule.egp_essential_publication_date?.trim() ?? "";
  if (!egpPublication) {
    issues.push({
      id: "egp_essential_publication_date",
      message: "กรุณาระบุวันที่ประกาศสาระสำคัญสัญญาใน e-GP",
    });
  } else if (signedDate) {
    const egpDeadline = computeStep9EgpDeadlineISO(signedDate);
    if (egpDeadline && isStep9EgpPublicationTooLate(egpPublication, signedDate)) {
      issues.push({
        id: "egp_essential_publication_deadline",
        message: getStep9EgpPublicationTooLateMsg(egpDeadline),
      });
    }
  }
  if (!schedule.egp_contract_control_no?.trim()) {
    issues.push({
      id: "egp_contract_control_no",
      message: "กรุณาระบุเลขคุมสัญญาจากระบบ e-GP",
    });
  }
  if (!schedule.notice_to_proceed_letter_no?.trim()) {
    issues.push({
      id: "notice_to_proceed_letter_no",
      message: "กรุณาระบุเลขที่หนังสือแจ้งให้เริ่มปฏิบัติงาน",
    });
  }
  const workStart = schedule.work_start_date?.trim() ?? "";
  if (signedDate && workStart && isISODateBefore(workStart, signedDate)) {
    issues.push({
      id: "work_start_before_signed",
      message: `วันที่เริ่มปฏิบัติงานต้องไม่ก่อนวันที่ลงนามในสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signedDate)} เป็นต้นไป`,
    });
  }
  const endISO = computeStep9ContractEndDateISO(
    schedule.work_start_date,
    schedule.contract_duration_days,
  );
  if (!endISO && schedule.work_start_date?.trim() && duration && duration > 0) {
    issues.push({
      id: "contract_end_date",
      message: "ไม่สามารถคำนวณวันครบกำหนดสิ้นสุดสัญญาได้ — ตรวจสอบวันที่เริ่มงานและระยะเวลา",
    });
  }

  STEP9_CHECKLIST_ITEMS.forEach((item, index) => {
    if (!effective[item.key]) {
      const prefix =
        item.mode === "auto" ? "ระบบตรวจพบยังไม่ครบ (Auto)" : "ยังไม่ได้แนบหลักฐาน";
      issues.push({
        id: `checklist-${item.key}`,
        message: `${prefix} ข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  if (isExternalProcurement(opts.procurementPath) && opts.externalCapture) {
    issues.push(...getStep9ExternalCaptureComplianceIssues(opts.externalCapture));
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        9,
        getStep9TimelineDateFields(schedule),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function isStep9ReadyForNext(
  schedule: Step9ContractSchedule,
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: Parameters<typeof getStep9ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep9ComplianceIssues(schedule, manualChecklist, opts, autoStates).length === 0;
}

export type Step10ComplianceIssue = { id: string; message: string };

export function getStep10ComplianceIssues(
  inspectionRows: Step10InspectionRow[],
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    totalInstallmentCount: number;
    timelineCtx?: TimelineValidationContext;
  },
  autoStates?: Record<string, boolean>,
): Step10ComplianceIssue[] {
  const issues: Step10ComplianceIssue[] = [];
  const uploadedTypes = (opts.stepDocs ?? []).map((d) => d.document_type);
  const expectedCount = Math.max(0, Math.floor(opts.totalInstallmentCount));
  const checklistItems = getStep10ChecklistItems(
    countStep10PassedInstallments(inspectionRows),
    expectedCount,
  );
  const auto =
    autoStates ??
    computeAutoChecklistState({
      stepNumber: 10,
      step10InspectionRows: inspectionRows,
      uploadedDocTypes: uploadedTypes,
    });
  const effective = buildEffectiveChecklist(
    10,
    manualChecklist,
    auto,
    opts.stepDocs,
    checklistItems,
  );

  if (expectedCount <= 0) {
    issues.push({
      id: "total_installment_count",
      message: "กรุณาบันทึกจำนวนงวดงานทั้งหมดในขั้นตอนที่ 9 ก่อน",
    });
  }
  if (inspectionRows.length !== expectedCount) {
    issues.push({
      id: "inspection_row_count",
      message: `ตารางตรวจรับต้องมี ${expectedCount} งวด — กรุณาบันทึกร่างเพื่อซิงก์ตาราง`,
    });
  }

  checklistItems.forEach((item, index) => {
    if (!effective[item.key]) {
      const prefix =
        item.mode === "auto" ? "ระบบตรวจพบยังไม่ครบ (Auto)" : "ยังไม่ได้แนบหลักฐาน";
      issues.push({
        id: `checklist-${item.key}`,
        message: `${prefix} ข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  inspectionRows.forEach((row) => {
    if (
      isStep10InspectionBeforeDelivery(row.delivery_date, row.inspection_date)
    ) {
      issues.push({
        id: `installment-${row.installment_no}-inspection_before_delivery`,
        message: `งวดที่ ${row.installment_no}: วันตรวจรับต้องไม่ก่อนวันที่ผู้รับจ้างส่งมอบงานจริง`,
      });
    }
    if (!isStep10RowInspectionPassed(row)) {
      issues.push({
        id: `installment-${row.installment_no}-status`,
        message: `งวดที่ ${row.installment_no}: สถานะต้องเป็น "ตรวจรับผ่านแล้ว" ก่อนปิดโครงการ`,
      });
    }
    if (!step10RowHasAllInstallmentDocs(row.installment_no, uploadedTypes)) {
      issues.push({
        id: `installment-${row.installment_no}-docs`,
        message: `งวดที่ ${row.installment_no}: กรุณาแนบหลักฐานครบ 3 ไฟล์ (รายงานผู้ควบคุมงาน / รูปหน้างาน / บก.11)`,
      });
    }
  });

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        10,
        getStep10TimelineDateFields(inspectionRows),
        opts.timelineCtx,
      ),
    );
  }

  return issues;
}

export function isStep10ReadyForNext(
  inspectionRows: Step10InspectionRow[],
  manualChecklist: Record<string, boolean> | null | undefined,
  opts: Parameters<typeof getStep10ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep10ComplianceIssues(inspectionRows, manualChecklist, opts, autoStates).length === 0;
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 8 จาก note */
export function loadStep8FormFromNote(note: string | null): Step8FormData {
  const { form } = parseStepNote(note);
  const f = form as Step8FormData;
  const raw = f.contractExecution;
  return {
    checklist: f.checklist,
    contractExecution: {
      ...EMPTY_STEP8_CONTRACT_EXECUTION,
      ...raw,
      guarantee_type: (raw?.guarantee_type ?? "") as Step8GuaranteeType,
    },
  };
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 5 จาก note */
export function loadStep5FormFromNote(note: string | null): Step5FormData {
  const { form } = parseStepNote(note);
  const f = form as Step5FormData;
  const c = f.checklist ?? {};
  return {
    checklist: {
      egp_winner_announced: !!c.egp_winner_announced,
      physical_board_posted: !!c.physical_board_posted,
    },
    announcement: {
      ...EMPTY_STEP5_ANNOUNCEMENT,
      ...f.announcement,
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
    },
    bidResult: stripAppealFieldsFromBidResult(f.bidResult),
  };
}

function stripAppealFieldsFromBidResult(bidResult?: Step4BidResult): Step4BidResult {
  const raw = bidResult ?? {};
  return {
    ...EMPTY_STEP4_BID_RESULT,
    egp_doc_request_count: raw.egp_doc_request_count ?? null,
    egp_bid_submission_count: raw.egp_bid_submission_count ?? null,
    winning_bidder_name: raw.winning_bidder_name ?? "",
    winning_bid_amount: raw.winning_bid_amount ?? null,
    final_agreed_amount: raw.final_agreed_amount ?? null,
    evaluation_report_letter_no: raw.evaluation_report_letter_no ?? "",
    evaluation_report_approval_date: raw.evaluation_report_approval_date ?? "",
    review_extension_memo_no: raw.review_extension_memo_no ?? "",
    review_extension_approval_date: raw.review_extension_approval_date ?? "",
    site_supervisor_name: raw.site_supervisor_name ?? "",
    site_supervisor_affiliation: raw.site_supervisor_affiliation ?? "",
    site_engineer_name: raw.site_engineer_name ?? "",
    evaluation_inspection_order_confirmed:
      raw.evaluation_inspection_order_confirmed ?? false,
  };
}

/** ฟิลด์ผลการเสนอราคา — บันทึกลงตาราง projects (ไม่รวมอุทธรณ์ — บันทึกในขั้นตอนที่ 6) */
export function buildProjectStep4Fields(bidResult: Step4BidResult) {
  const winningAmount = bidResult.winning_bid_amount;
  const finalAmount = bidResult.final_agreed_amount;
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
      winningAmount != null && Number.isFinite(winningAmount) && winningAmount > 0
        ? winningAmount
        : null,
    final_agreed_amount:
      finalAmount != null && Number.isFinite(finalAmount) && finalAmount > 0
        ? finalAmount
        : null,
    evaluation_report_letter_no: bidResult.evaluation_report_letter_no?.trim() || null,
    evaluation_report_approval_date:
      bidResult.evaluation_report_approval_date?.trim() || null,
    site_supervisor_name: bidResult.site_supervisor_name?.trim() || null,
    site_supervisor_affiliation: bidResult.site_supervisor_affiliation?.trim() || null,
    site_engineer_name: bidResult.site_engineer_name?.trim() || null,
  };
}

/** ฟิลด์ประกาศผู้ชนะ — บันทึกลงตาราง projects (ขั้นตอนที่ 5) */
export function buildProjectStep5Fields(announcement: Step5Announcement) {
  return {
    winner_announcement_no: announcement.winner_announcement_no?.trim() || null,
    winner_announcement_date: announcement.winner_announcement_date?.trim() || null,
  };
}

/** ฟิลด์อุทธรณ์ — บันทึกลงตาราง projects (ขั้นตอนที่ 6) */
export function buildProjectAppealFields(appeal: Step6AppealState) {
  return {
    appeal_status:
      appeal.appeal_status === "none" || appeal.appeal_status === "pending"
        ? appeal.appeal_status
        : null,
    appeal_report_letter_no: appeal.appeal_report_letter_no?.trim() || null,
    appeal_report_approval_date: appeal.appeal_report_approval_date?.trim() || null,
    appeal_consideration_status: appeal.appeal_consideration_status?.trim() || null,
  };
}

/** โหลดสถานะอุทธรณ์จาก project columns */
export function mergeAppealFromProject(
  project: {
    appeal_status?: string | null;
    appeal_report_letter_no?: string | null;
    appeal_report_approval_date?: string | null;
    appeal_consideration_status?: string | null;
  } | null,
): Step6AppealState {
  if (!project) return { ...EMPTY_STEP6_APPEAL };
  const appealFromProject =
    project.appeal_status === "none" || project.appeal_status === "pending"
      ? project.appeal_status
      : "";
  return {
    appeal_status: appealFromProject as StepAppealStatus,
    appeal_report_letter_no: project.appeal_report_letter_no ?? "",
    appeal_report_approval_date:
      project.appeal_report_approval_date?.trim() ||
      project.appeal_consideration_status?.trim() ||
      "",
    appeal_consideration_status: project.appeal_consideration_status ?? "",
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
    final_agreed_amount?: number | null;
    evaluation_report_letter_no?: string | null;
    evaluation_report_approval_date?: string | null;
    site_supervisor_name?: string | null;
    site_supervisor_affiliation?: string | null;
    site_engineer_name?: string | null;
  } | null,
): Step4BidResult {
  if (!project) return bidResult;
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
    final_agreed_amount:
      bidResult.final_agreed_amount != null && bidResult.final_agreed_amount > 0
        ? bidResult.final_agreed_amount
        : project.final_agreed_amount ?? null,
    evaluation_report_letter_no:
      bidResult.evaluation_report_letter_no?.trim() ||
      project.evaluation_report_letter_no ||
      "",
    evaluation_report_approval_date:
      bidResult.evaluation_report_approval_date?.trim() ||
      project.evaluation_report_approval_date ||
      "",
    site_supervisor_name:
      bidResult.site_supervisor_name?.trim() || project.site_supervisor_name || "",
    site_supervisor_affiliation:
      bidResult.site_supervisor_affiliation?.trim() ||
      project.site_supervisor_affiliation ||
      "",
    site_engineer_name:
      bidResult.site_engineer_name?.trim() || project.site_engineer_name || "",
  };
}

export function serializeStepNote(userNote: string, form: StepFormData): string {
  const clean = stripStepFormPayload(userNote);
  if (!formHasPersistedData(form)) return clean;
  const payload = JSON.stringify(form);
  return clean ? `${clean}\n${FORM_MARKER}${payload}` : `${FORM_MARKER}${payload}`;
}
