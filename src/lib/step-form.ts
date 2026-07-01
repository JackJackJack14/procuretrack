import { resolveEgpProjectId, type ProjectEgpIdSource } from "@/lib/project-refs";
import {
  hasStep1PlanPublicationDoc,
  STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE,
} from "@/lib/checklist-inline-evidence";
import { isSpecificMethodShortWorkflow, normalizeProcurementMethod } from "@/lib/dynamic-stepper";
import type { DocItem } from "@/lib/procurement";
import {
  getStep1SpecificWorkflowComplianceIssues,
  hasStep1SpecificPurchaseReportDoc,
  isStep1SpecificCoreDocumentsReady,
  isStep1SpecificInspectorsComplete,
  normalizeStep1SpecificWorkflow,
  STEP1_SPECIFIC_DOC,
  type Step1SpecificWorkflowFields,
} from "@/lib/step1-specific-workflow";
import {
  getStep2SpecificQuotationComplianceIssues,
  isStep2SpecificQuotationComplete,
  normalizeStep2SpecificQuotation,
  type Step2SpecificQuotation,
} from "@/lib/step2-specific-quotation";
import {
  formatBudgetInput as formatBudgetInputFromCurrency,
  parseBudgetInput as parseBudgetInputFromCurrency,
  stripCurrencyToNumber,
} from "@/lib/currency-format";
import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  STEP6_DOC,
  STEP7_DOC,
  STEP8_DOC,
  STEP8_DOC_LEGACY,
  countStep2MarketQuoteDocsUploaded,
  hasStep2MarketQuotesDoc,
  hasStep2ReferencePriceDoc,
  hasStep9Hs1Doc,
  hasStep2MedianPriceTableDoc,
  resolveStep2MedianPriceTableFieldLabel,
  STEP2_REFERENCE_PRICE_FIELD_LABEL,
} from "@/lib/step-doc-types";
import {
  buildEffectiveChecklist,
  computeAutoChecklistState,
  getSmartChecklistItems,
  getStep6ChecklistItems,
  STEP5_CHECKLIST_ITEMS,
} from "@/lib/smart-checklist";
import {
  isStep10RowInspectionPassed,
  step10RowHasRequiredDocs,
  countStep10PassedInstallments,
  isStep10InspectionBeforeDelivery,
  isStep10DeliveryBeforeContractStart,
  isStep10InspectionBeforeSupervisorReport,
  normalizeStep10InspectionResult,
  STEP10_INSPECTION_RESULT_OPTIONS,
} from "@/lib/step10-contract";
import {
  countWorkdaysAfterStartISO,
  countWorkdaysBetweenISO,
  validateStep3PublicationDates,
  isStep7NotificationLetterTooLate,
  CONTRACT_NOTIFICATION_WORKDAYS,
  isContractActionBeforeAppealPeriodEnds,
  computeContractEarliestFromAppealDeadlineISO,
  STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END,
} from "@/lib/workdays";
import {
  type Step4Timeline,
  STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG,
  STEP4_PROCUREMENT_APPROVAL_BEFORE_PUBLICATION_END_MSG,
  STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
  STEP4_EVALUATION_APPROVAL_OVERDUE_MSG,
  STEP4_EVALUATION_APPROVAL_GATE_MSG,
  resolveCommitteeReviewWorkdays as resolveCommitteeReviewWorkdaysFromAnnouncement,
  resolveStep2MedianApprovalDate as resolveStep2MedianApprovalDateFromContext,
  resolveStep3PublicationEnd as resolveStep3PublicationEndFromAnnouncement,
  resolveBidPeriodStartDate as resolveBidPeriodStartDateFromAnnouncement,
  computeStep4Timeline as computeStep4TimelineFromAnnouncement,
  resolveBidSubmissionEndDate as resolveBidSubmissionEndDateFromAnnouncement,
  getStep3ProcurementApprovalDateIssues,
  getStep3PublicationExtensionIssues,
  isStep3ProcurementApprovalDateValid,
  step3RequiresPublicationExtensionReason,
  resolveStep4ProcurementSignMinDate,
  getStep4ProcurementSignDateIssues,
  isStep4ProcurementSignDateValid,
  isStep4ProcurementApprovalOnOrAfterPublicationEnd,
  getStep4EvaluationApprovalIssues,
  isStep4TimelineComplete,
  computeBidSubmissionEndISO,
  getStep4TimelineDisplayLines,
  buildStep4CommitteeScheduleMessage,
  computeStep4ReviewDeadlineISO,
  defaultStep4EvaluationApprovalDateISO,
  isStep4EvaluationApprovalBeforeBidEnd,
  isStep4EvaluationApprovalOverdue,
  committeeReviewDeadlineAfterBidEndISO,
} from "@/lib/compliance/rules/bid-timeline.rules";
export type { Step4Timeline } from "@/lib/compliance/rules/bid-timeline.rules";
export {
  STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG,
  STEP4_PROCUREMENT_APPROVAL_BEFORE_PUBLICATION_END_MSG,
  STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
  STEP4_EVALUATION_APPROVAL_OVERDUE_MSG,
  STEP4_EVALUATION_APPROVAL_GATE_MSG,
  resolveStep4ProcurementSignMinDate,
  getStep4ProcurementSignDateIssues,
  isStep4ProcurementSignDateValid,
  isStep4ProcurementApprovalOnOrAfterPublicationEnd,
  getStep4EvaluationApprovalIssues,
  isStep4TimelineComplete,
  computeBidSubmissionEndISO,
  getStep4TimelineDisplayLines,
  buildStep4CommitteeScheduleMessage,
  computeStep4ReviewDeadlineISO,
  defaultStep4EvaluationApprovalDateISO,
  isStep4EvaluationApprovalBeforeBidEnd,
  isStep4EvaluationApprovalOverdue,
  committeeReviewDeadlineAfterBidEndISO,
};
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
  isResultUnitComplete,
  isResultUnitOtherPending,
  type Step1ProjectProfile,
} from "@/lib/project-profile";
import {
  countStep1SiteLocationRequiredFields,
  isEgpConstructionProjectType,
  isStep1SiteDetailOptional,
} from "@/lib/egp-project-type";
import { isExternalProcurement } from "@/lib/procurement-path";
import {
  isLowBudgetElectronicMethodConflict,
  STEP1_LOW_BUDGET_EBIDDING_BLOCKED_MSG,
} from "@/lib/procurement-budget-rules";

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
    label: "ตารางแสดงวงเงินราคากลางถูกต้อง (แนบไฟล์)",
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
  /** งานจ้างก่อสร้าง — ยอดรวมราคากลางสุทธิจากการถอดแบบ → projects.approved_reference_price */
  approved_reference_price?: number | null;
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
  approved_reference_price: null,
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
  /** คณะกรรมการพิจารณาผลประกวดราคา */
  EVALUATION: "evaluation",
  /** คณะกรรมการตรวจรับพัสดุ */
  INSPECTION: "inspection",
} as const;

/** ค่า committee_type ที่อาจมีใน DB — ใช้ลบ/โหลด (รวม legacy จาก migration เก่า) */
export const STEP2_COMMITTEE_DB_TYPES = [
  STEP2_COMMITTEE_TYPE.TOR,
  STEP2_COMMITTEE_TYPE.MEDIAN,
  "tor_and_median",
  "median_price",
  STEP2_COMMITTEE_TYPE.EVALUATION,
  STEP2_COMMITTEE_TYPE.INSPECTION,
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

const STEP2_COMMITTEE_ROLE_LABELS = [
  "ประธานกรรมการ (ราคากลาง)",
  "กรรมการและเลขานุการ",
  "กรรมการ (ราคากลาง)",
  "ประธานกรรมการ",
  "กรรมการ",
] as const;

/** ดึงข้อความตำแหน่งในคณะกรรมการจากฟิลด์ position (DB/legacy) */
function extractCommitteeRoleFromPosition(position: string): string {
  const trimmed = position.trim();
  if (!trimmed) return "";
  for (const label of STEP2_COMMITTEE_ROLE_LABELS) {
    if (trimmed === label) return label;
  }
  return "";
}

/** ตำแหน่งสายงาน — ไม่รวมข้อความบทบาทในคณะกรรมการล้วนๆ */
function resolveCommitteeJobPosition(member: Step2CommitteeMember): string {
  const position = member.position_endorsement?.trim() ?? "";
  if (!position) return "";
  if (extractCommitteeRoleFromPosition(position)) return "";
  return position;
}

/** ตำแหน่งในคณะกรรมการ — จาก role หรือข้อความใน position (DB) */
function resolveCommitteeRoleInCommittee(member: Step2CommitteeMember): string {
  const fromPosition = extractCommitteeRoleFromPosition(member.position_endorsement ?? "");
  if (fromPosition) return fromPosition;
  if (member.role === "chair") return "ประธานกรรมการ";
  if (member.role === "member") return "กรรมการ";
  return "";
}

/** จัดรูปแบบรายชื่อกรรมการ — "1. ชื่อ (ตำแหน่งสายงาน) - ตำแหน่งในคณะกรรมการ" */
export function formatCommitteeMembersForDisplay(members: Step2CommitteeMember[]): string {
  const lines: string[] = [];
  let filledIndex = 0;
  for (const raw of members) {
    const member = normalizeStep2CommitteeMember(raw);
    const name = getCommitteeMemberName(member).trim();
    if (!name) continue;

    const jobPosition = resolveCommitteeJobPosition(member);
    let committeeRole = resolveCommitteeRoleInCommittee(member);
    if (!committeeRole) {
      committeeRole = filledIndex === 0 ? "ประธานกรรมการ" : "กรรมการ";
    }

    const displayNum = filledIndex + 1;
    let line = `${displayNum}. ${name}`;
    if (jobPosition) line += ` (${jobPosition})`;
    line += ` - ${committeeRole}`;
    lines.push(line);
    filledIndex += 1;
  }
  return lines.join("\n");
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

function mapCommitteeDbRowsToMembers(
  rows: Step2CommitteeDbRow[],
  noteMembers?: Step2CommitteeMember[],
): Step2CommitteeMember[] {
  return rows.map((r, idx) => {
    const position = (r.position ?? "").trim();
    const noteMatch =
      noteMembers?.find((m) => getCommitteeMemberName(m).trim() === r.member_name.trim()) ??
      noteMembers?.[idx];
    const normalizedNote = noteMatch ? normalizeStep2CommitteeMember(noteMatch) : null;

    const committeeRoleInDb = extractCommitteeRoleFromPosition(position);
    const jobFromDb = committeeRoleInDb && committeeRoleInDb === position ? "" : position;

    const position_endorsement =
      normalizedNote?.position_endorsement?.trim() || jobFromDb;
    const role =
      normalizedNote?.role === "chair" || normalizedNote?.role === "member"
        ? normalizedNote.role
        : committeeRoleInDb.includes("ประธาน")
          ? ("chair" as const)
          : committeeRoleInDb
            ? ("member" as const)
            : "";

    return {
      name: r.member_name,
      position_endorsement,
      role,
    };
  });
}

function resolveStep2EvaluationMembersFromSources(
  rows: Step2CommitteeDbRow[],
  noteBackup?: Partial<Step2CommitteesState> | null,
): Step2CommitteeMember[] {
  const fromDb = mapCommitteeDbRowsToMembers(
    rows.filter((r) => r.committee_type === STEP2_COMMITTEE_TYPE.EVALUATION),
    noteBackup?.evaluation_members,
  );
  if (fromDb.length > 0) return fromDb;
  return (noteBackup?.evaluation_members ?? []).filter((m) => getCommitteeMemberName(m).trim());
}

function resolveStep2InspectionMembersFromSources(
  rows: Step2CommitteeDbRow[],
  noteBackup?: Partial<Step2CommitteesState> | null,
): Step2CommitteeMember[] {
  const fromDb = mapCommitteeDbRowsToMembers(
    rows.filter((r) => r.committee_type === STEP2_COMMITTEE_TYPE.INSPECTION),
    noteBackup?.inspection_members,
  );
  if (fromDb.length > 0) return fromDb;
  return (noteBackup?.inspection_members ?? []).filter((m) => getCommitteeMemberName(m).trim());
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
  const evaluationMembers = resolveStep2EvaluationMembersFromSources(rows, noteBackup);
  const inspectionMembers = resolveStep2InspectionMembersFromSources(rows, noteBackup);

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
      evaluation_members: padCommitteeMemberList(evaluationMembers),
      inspection_members: padCommitteeMemberList(inspectionMembers),
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
    evaluation_members: padCommitteeMemberList(evaluationMembers),
    inspection_members: padCommitteeMemberList(inspectionMembers),
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

  pushMembers(committees.evaluation_members, STEP2_COMMITTEE_TYPE.EVALUATION);
  pushMembers(committees.inspection_members, STEP2_COMMITTEE_TYPE.INSPECTION);

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

export {
  countStep2MarketQuoteDocsUploaded,
  hasStep2MarketQuotesDoc,
  hasStep2ReferencePriceDoc,
} from "@/lib/step-doc-types";

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

/** ตรวจว่ามีคำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ — อัปโหลดในขั้นตอนที่ 4 เท่านั้น */
export function hasStep4EvaluationInspectionOrderDoc(
  docs: Array<{ step_number?: number | null; document_type: string }>,
): boolean {
  return docs.some(
    (d) =>
      d.step_number === 4 &&
      d.document_type === STEP2_DOC.EVALUATION_INSPECTION_ORDER,
  );
}

/** @deprecated ใช้ hasStep4EvaluationInspectionOrderDoc สำหรับ validation ขั้นตอนที่ 4 */
export function hasEvaluationInspectionOrderDoc(
  docs: Array<{ step_number?: number | null; document_type: string }>,
): boolean {
  return hasStep4EvaluationInspectionOrderDoc(docs);
}

/** ตรวจว่ามีคำสั่งแต่งตั้งผู้ควบคุมงาน — จากขั้นตอนที่ 2 หรือ 4 */
export function hasSiteSupervisorOrderDoc(
  docs: Array<{ step_number?: number | null; document_type: string }>,
): boolean {
  const docType = STEP2_DOC.SITE_SUPERVISOR_ORDER;
  return docs.some(
    (d) =>
      d.document_type === docType && (d.step_number === 2 || d.step_number === 4),
  );
}

/** อ้างอิงไฟล์จากขั้นตอนที่ 2 สำหรับ debug / สืบทอนในขั้นตอนที่ 4 */
export function resolveStep4InheritedOrderDocRefs(
  docs: Array<{
    step_number?: number | null;
    document_type: string;
    storage_path?: string;
  }>,
): { committeeOrder: string | null; supervisorOrder: string | null } {
  const step2Docs = docs.filter((d) => d.step_number === 2);
  const committee = step2Docs.find(
    (d) => d.document_type === STEP2_DOC.EVALUATION_INSPECTION_ORDER,
  );
  const supervisor = step2Docs.find(
    (d) => d.document_type === STEP2_DOC.SITE_SUPERVISOR_ORDER,
  );
  return {
    committeeOrder: committee?.storage_path ?? null,
    supervisorOrder: supervisor?.storage_path ?? null,
  };
}

/** พิมพ์ log หลักฐานการสืบทอนไฟล์จากขั้นตอนที่ 2 → 4 */
export function logStep4DocumentInheritanceDebug(
  docs: Array<{
    step_number?: number | null;
    document_type: string;
    storage_path?: string;
  }>,
): void {
  const { committeeOrder, supervisorOrder } = resolveStep4InheritedOrderDocRefs(docs);
  console.log("📂 [INHERITANCE DEBUG] Step 2 File Found for Step 4:", {
    committeeOrder,
    supervisorOrder,
  });
}

/** ตรวจว่ามีคำสั่งพิจารณาผล/ตรวจรับที่อัปโหลดจากขั้นตอนที่ 2 (สำหรับยืนยันในขั้นตอนที่ 4) */
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

export const STEP4_SITE_SUPERVISOR_ORDER_REQUIRED_MSG =
  'กรุณาแนบเอกสาร "คำสั่งแต่งตั้งผู้ควบคุมงานหน้างาน" (เอกสารบังคับตามกฎหมาย)';

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
    hint: "ไฟล์ร่างประกาศ + ร่างเอกสารประกวดราคา (ตารางราคากลางอ้างอิงจากขั้นตอนที่ 2)",
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

/** คำแนะนำระเบียบ — แสดงใต้ช่องอัปโหลดในฟอร์มขั้นตอนที่ 3 */
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

/** ความคืบหน้าเอกสารขั้นตอนที่ 3 — โหมดข้ามฟังใช้เฉพาะ TOR + อ้างอิงราคากลางขั้น 2 */
export function countStep3DocumentsProgress(
  opts: {
    hasDraftTorDoc: boolean;
    hasDraftAnnouncementDoc: boolean;
    hasBg06Doc: boolean;
  },
  hearingFormActive: boolean,
): { done: number; total: number } {
  if (hearingFormActive) {
    return countStep3CoreDocumentsReady(opts);
  }
  let done = 0;
  if (opts.hasDraftTorDoc) done += 1;
  if (opts.hasBg06Doc) done += 1;
  return { done, total: 2 };
}

/** ฟิลด์กรอกข้อมูลที่มีเครื่องหมาย * ในฟอร์มขั้นตอนที่ 3 */
export function getStep3RequiredFormFieldIssues(
  announcement: Step3Announcement,
  opts?: { hearingFormActive?: boolean },
): Step3ComplianceIssue[] {
  const hearingFormActive = opts?.hearingFormActive !== false;
  const issues: Step3ComplianceIssue[] = [];

  if (!announcement.procurement_request_letter_no?.trim()) {
    issues.push({
      id: "procurement_request_letter_no",
      message: 'กรุณาระบุเลขที่บันทึกข้อความ "รายงานขอซื้อขอจ้าง"',
    });
  }
  if (!announcement.procurement_request_approval_date?.trim()) {
    issues.push({
      id: "procurement_request_approval_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามในรายงานขอซื้อขอจ้าง",
    });
  } else {
    issues.push(
      ...getStep3ProcurementApprovalDateIssues(announcement, { hearingFormActive }),
    );
  }
  const workdays = announcement.committee_review_workdays;
  if (workdays == null || workdays <= 0) {
    issues.push({
      id: "committee_review_workdays",
      message: "กรุณาระบุระยะเวลารับซองราคา / พิจารณาผล (วันทำการ)",
    });
  }
  issues.push(...getStep3PublicationExtensionIssues(announcement, { hearingFormActive }));

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
  /** ระยะเวลาเผยแพร่เอกสารและยื่นข้อเสนอราคา (วันทำการ) */
  bid_submission_workdays?: number | null;
  /** ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ) */
  committee_review_workdays?: number | null;
};

/** สถานะการอุทธรณ์ — บันทึกในขั้นตอนที่ 6 (อุทธรณ์) */
export type StepAppealStatus = "none" | "pending" | "";

/** ผลการพิจารณาของหัวหน้าหน่วยงาน */
export type AppealHeadOpinion = "agree" | "disagree" | "";

/** ผลการวินิจฉัยคณะกรรมการพิจารณาอุทธรณ์ */
export type AppealCommitteeDecision = "upheld" | "not_upheld" | "";

export const APPEAL_HEAD_OPINION_OPTIONS: Array<{
  value: Exclude<AppealHeadOpinion, "">;
  label: string;
}> = [
  { value: "agree", label: "เห็นด้วยกับอุทธรณ์" },
  { value: "disagree", label: "ไม่เห็นด้วยกับอุทธรณ์" },
];

export const APPEAL_COMMITTEE_DECISION_OPTIONS: Array<{
  value: Exclude<AppealCommitteeDecision, "">;
  label: string;
}> = [
  { value: "upheld", label: "อุทธรณ์ฟังขึ้น" },
  { value: "not_upheld", label: "อุทธรณ์ฟังไม่ขึ้น" },
];

/** @deprecated ใช้ StepAppealStatus */
export type Step4AppealStatus = StepAppealStatus;

export const APPEAL_STATUS_LABELS: Record<Exclude<StepAppealStatus, "">, string> = {
  none: "พร้อมทำสัญญา",
  pending: "ติดอุทธรณ์",
};

/** ข้อมูลอุทธรณ์ — ขั้นตอนที่ 6 (เก็บใน note JSON / step6_notes) */
export type Step6AppealState = {
  appeal_status?: StepAppealStatus;
  /** ชื่อผู้ประกอบการที่ยื่นอุทธรณ์ */
  appeal_bidder_name?: string;
  /** วันที่หน่วยงานได้รับหนังสืออุทธรณ์ */
  appeal_received_date?: string;
  /** เลขที่หนังสือรายงานความเห็นเสนอหัวหน้าหน่วยงาน */
  appeal_report_letter_no?: string;
  /** ผลการพิจารณาของหัวหน้าหน่วยงาน */
  appeal_head_opinion?: AppealHeadOpinion;
  /** เลขที่หนังสือส่งเรื่องให้กรมบัญชีกลาง */
  cgd_submission_letter_no?: string;
  /** วันที่ส่งเรื่องให้กรมบัญชีกลาง */
  cgd_submission_date?: string;
  /** ผลการวินิจฉัยจากคณะกรรมการพิจารณาอุทธรณ์ */
  appeal_committee_decision?: AppealCommitteeDecision;
  /** @deprecated ใช้ appeal_received_date */
  appeal_report_approval_date?: string;
  /** @deprecated */
  appeal_consideration_status?: string;
};

export const EMPTY_STEP6_APPEAL: Required<Omit<Step6AppealState, never>> = {
  appeal_status: "",
  appeal_bidder_name: "",
  appeal_received_date: "",
  appeal_report_letter_no: "",
  appeal_head_opinion: "",
  cgd_submission_letter_no: "",
  cgd_submission_date: "",
  appeal_committee_decision: "",
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

/** Smart Checklist — ขั้นตอนที่ 4 (ก่อนเปิดซองเท่านั้น) */
export type Step4ChecklistKey =
  | "procurement_report_uploaded"
  | "committee_order_uploaded"
  | "supervisor_order_uploaded";

export type Step4Checklist = Record<Step4ChecklistKey, boolean>;

export const STEP4_CHECKLIST_ITEMS: Array<{ key: Step4ChecklistKey; label: string }> = [
  { key: "procurement_report_uploaded", label: "แนบรายงานขอซื้อขอจ้างที่ลงนามแล้ว" },
  { key: "committee_order_uploaded", label: "แนบคำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ" },
  {
    key: "supervisor_order_uploaded",
    label: "แนบคำสั่งแต่งตั้งผู้ควบคุมงานหน้างาน (งานก่อสร้าง)",
  },
];

export const EMPTY_STEP4_CHECKLIST: Step4Checklist = {
  procurement_report_uploaded: false,
  committee_order_uploaded: false,
  supervisor_order_uploaded: false,
};

/** ประกาศผู้ชนะ — ขั้นตอนที่ 5 */
export type Step5Announcement = {
  winner_announcement_no?: string;
  /** วันที่ประกาศผลผ่านระบบ e-GP / ลงนามในประกาศผู้ชนะ */
  winner_announcement_date?: string;
  /** วันที่แจ้งผลให้ผู้เสนอราคาทราบ — ฐานนับระยะอุทธรณ์ 7 วันทำการ */
  winner_result_notification_date?: string;
};

export const EMPTY_STEP5_ANNOUNCEMENT: Required<Step5Announcement> = {
  winner_announcement_no: "",
  winner_announcement_date: "",
  winner_result_notification_date: "",
};

/** Smart Checklist — ขั้นตอนที่ 5 (หลังเปิดซอง + ประกาศผู้ชนะ) */
export type Step5ChecklistKey =
  | "price_comparison_uploaded"
  | "evaluation_report_uploaded"
  | "egp_bid_summary_uploaded"
  | "blacklist_checked"
  | "conflict_of_interest_checked"
  | "egp_winner_announced"
  | "physical_board_posted";

export type Step5Checklist = Record<Step5ChecklistKey, boolean>;

export const EMPTY_STEP5_CHECKLIST: Step5Checklist = {
  price_comparison_uploaded: false,
  evaluation_report_uploaded: false,
  egp_bid_summary_uploaded: false,
  blacklist_checked: false,
  conflict_of_interest_checked: false,
  egp_winner_announced: false,
  physical_board_posted: false,
};

/** ผู้ยื่นข้อเสนอ — ขั้นตอนที่ 4 (ส่งต่อขั้นตอนที่ 8) */
export type Step4BidderQualification = "passed" | "failed";

export type Step4Bidder = {
  company_name: string;
  offered_price: number | null;
  qualification_status: Step4BidderQualification;
  negotiation_notes?: string;
};

export const STEP4_BIDDER_QUALIFICATION_OPTIONS: Array<{
  value: Step4BidderQualification;
  label: string;
}> = [
  { value: "passed", label: "ผ่านเกณฑ์" },
  { value: "failed", label: "ไม่ผ่านเกณฑ์" },
];

export const EMPTY_STEP4_BIDDER: Step4Bidder = {
  company_name: "",
  offered_price: null,
  qualification_status: "passed",
  negotiation_notes: "",
};

export function normalizeStep4Bidder(raw: Step4Bidder | null | undefined): Step4Bidder {
  const status = raw?.qualification_status === "failed" ? "failed" : "passed";
  const price = raw?.offered_price;
  return {
    company_name: raw?.company_name?.trim() ?? "",
    offered_price:
      price != null && Number.isFinite(price) && price >= 0 ? price : null,
    qualification_status: status,
    negotiation_notes: raw?.negotiation_notes?.trim() ?? "",
  };
}

export function normalizeStep4Bidders(
  raw: Step4Bidder[] | null | undefined,
): Step4Bidder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => normalizeStep4Bidder(row));
}

/** ดัชนีแถวที่เสนอราคาต่ำสุดและผ่านคุณสมบัติ (รองรับเสมอกัน) */
export function resolveLowestValidStep4BidderIndices(bidders: Step4Bidder[]): number[] {
  const candidates: Array<{ index: number; price: number }> = [];
  bidders.forEach((raw, index) => {
    const row = normalizeStep4Bidder(raw);
    if (row.qualification_status !== "passed") return;
    const price = row.offered_price;
    if (price == null || price <= 0) return;
    candidates.push({ index, price });
  });
  if (candidates.length === 0) return [];
  const minPrice = Math.min(...candidates.map((c) => c.price));
  return candidates.filter((c) => c.price === minPrice).map((c) => c.index);
}

/** ผู้ยื่นที่เสนอราคาต่ำสุดและผ่านคุณสมบัติ */
export function resolveLowestValidStep4Bidder(
  bidders: Step4Bidder[],
): Step4Bidder | null {
  const indices = resolveLowestValidStep4BidderIndices(bidders);
  if (indices.length === 0) return null;
  return normalizeStep4Bidder(bidders[indices[0]]);
}

/** ดึงราคาเสนอชนะ / ราคาตกลงจริงจากแถวผู้ยื่น — ใช้ราคาหลังต่อรองจากหมายเหตุถ้ามี */
export function resolveStep4PriceFromBidderRow(row: Step4Bidder): {
  winning_bid_amount: number | null;
  final_agreed_amount: number | null;
} {
  const normalized = normalizeStep4Bidder(row);
  const offered = normalized.offered_price;
  const negotiated = parsePriceFromNegotiationNotes(normalized.negotiation_notes);
  if (offered == null || offered <= 0) {
    return {
      winning_bid_amount: null,
      final_agreed_amount: negotiated,
    };
  }
  return {
    winning_bid_amount: offered,
    final_agreed_amount: negotiated ?? offered,
  };
}

function parsePriceFromNegotiationNotes(notes: string | undefined): number | null {
  const trimmed = notes?.trim();
  if (!trimmed) return null;
  const direct = stripCurrencyToNumber(trimmed);
  if (direct != null && direct > 0) return direct;
  const match = trimmed.match(/[\d,]+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = stripCurrencyToNumber(match[0]);
  return parsed != null && parsed > 0 ? parsed : null;
}

/** ดึงผู้ชนะจากแถว highlight ในตาราง bidders — บันทึกหลังบ้านก่อน sync DB */
export function applyStep4WinnerFromBiddersTable(bidResult: Step4BidResult): Step4BidResult {
  const winner = resolveLowestValidStep4Bidder(normalizeStep4Bidders(bidResult.bidders));
  if (!winner?.company_name) {
    return bidResult;
  }
  const prices = resolveStep4PriceFromBidderRow(winner);
  const extractedName = winner.company_name;
  const extractedPrice = prices.final_agreed_amount;
  console.log("🛡️ [BACKGROUND MAP] Extracted Winner Row to Database:", {
    winner: extractedName,
    finalPrice: extractedPrice,
  });
  return {
    ...bidResult,
    winning_bidder_name: extractedName,
    winning_bid_amount: prices.winning_bid_amount,
    final_agreed_amount: extractedPrice,
  };
}

export function getStep4BiddersFieldIssues(bidders: Step4Bidder[]): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];
  if (bidders.length === 0) return issues;
  bidders.forEach((raw, index) => {
    const row = normalizeStep4Bidder(raw);
    const rowNo = index + 1;
    if (!row.company_name) {
      issues.push({
        id: `bidder_${index}_company_name`,
        message: `แถวที่ ${rowNo}: กรุณาระบุชื่อบริษัท/ห้างหุ้นส่วนจำกัด`,
      });
    }
    if (row.offered_price == null || row.offered_price <= 0) {
      issues.push({
        id: `bidder_${index}_offered_price`,
        message: `แถวที่ ${rowNo}: กรุณาระบุราคาที่เสนอ (บาท)`,
      });
    }
  });
  return issues;
}

/** โหลดรายชื่อผู้ยื่นข้อเสนอจาก note ขั้นตอนที่ 4 — ใช้แสดงในขั้นตอนที่ 8 */
export function loadStep4BiddersFromSteps(
  steps: Array<{ step_number: number; note: string | null }>,
): Step4Bidder[] {
  const step4 = steps.find((s) => s.step_number === 4);
  return normalizeStep4Bidders(loadStep4FormFromNote(step4?.note ?? null).bidResult?.bidders);
}

export const STEP4_PRICE_COMPARISON_REQUIRED_MSG =
  'กรุณาแนบเอกสาร "ตารางเปรียบเทียบราคาฉบับสมบูรณ์ (PDF)"';

export const STEP4_COMMITTEE_REPORT_REQUIRED_MSG =
  'กรุณาแนบเอกสาร "PDF รายงานผลการพิจารณาของคณะกรรมการ"';

export const STEP4_EGP_BID_SUMMARY_REQUIRED_MSG =
  'กรุณาแนบเอกสาร "PDF รายงานสรุปผลการเสนอราคาจากระบบ e-GP"';

/** บทบาทในคณะกรรมการ — ขั้นตอนที่ 4 */
export type Step4CommitteeMemberRole = "chair" | "member" | "member_secretary";

export type Step4CommitteeMember = {
  full_name: string;
  position: string;
  role: Step4CommitteeMemberRole | "";
};

export const STEP4_MIN_COMMITTEE_MEMBERS = 3;

export const STEP4_COMMITTEE_ROLE_OPTIONS: Array<{
  value: Step4CommitteeMemberRole;
  label: string;
}> = [
  { value: "chair", label: "ประธานกรรมการ" },
  { value: "member", label: "กรรมการ" },
  { value: "member_secretary", label: "กรรมการและเลขานุการ" },
];

/** บทบาทคณะกรรมการตรวจรับ — ห้ามเลขานุการตามระเบียบ */
export const STEP4_INSPECTION_COMMITTEE_ROLE_OPTIONS: Array<{
  value: Exclude<Step4CommitteeMemberRole, "member_secretary">;
  label: string;
}> = [
  { value: "chair", label: "ประธานกรรมการ" },
  { value: "member", label: "กรรมการ" },
];

export type Step4CommitteeRoleConstraintOptions = {
  /** คณะกรรมการตรวจรับพัสดุ — อนุญาตเฉพาะประธาน/กรรมการ */
  allowMemberSecretary?: boolean;
};

export const EMPTY_STEP4_COMMITTEE_MEMBER: Step4CommitteeMember = {
  full_name: "",
  position: "",
  role: "",
};

export function normalizeStep4CommitteeMember(
  raw: Step4CommitteeMember | null | undefined,
): Step4CommitteeMember {
  if (!raw) return { ...EMPTY_STEP4_COMMITTEE_MEMBER };
  const role =
    raw.role === "chair" || raw.role === "member" || raw.role === "member_secretary"
      ? raw.role
      : "";
  return {
    full_name: raw.full_name ?? "",
    position: raw.position ?? "",
    role,
  };
}

/** ตัดช่องว่างหัวท้ายก่อนบันทึก/แสดงผล — ไม่ใช้ระหว่างพิมพ์เพื่อให้เว้นวรรคได้ */
export function finalizeStep4CommitteeMember(
  member: Step4CommitteeMember,
): Step4CommitteeMember {
  const normalized = normalizeStep4CommitteeMember(member);
  return {
    ...normalized,
    full_name: normalized.full_name.trim(),
    position: normalized.position.trim(),
  };
}

export function createStep4CommitteeMemberRows(count: number): Step4CommitteeMember[] {
  const size = Math.max(0, count);
  return applyStep4CommitteeRoleConstraints(
    Array.from({ length: size }, () => ({ ...EMPTY_STEP4_COMMITTEE_MEMBER })),
  );
}

/** บังคับประธานกรรมการเพียงแถวแรก (index 0) — ตามระเบียบพัสดุ */
export function applyStep4CommitteeRoleConstraints(
  members: Step4CommitteeMember[],
  opts?: Step4CommitteeRoleConstraintOptions,
): Step4CommitteeMember[] {
  const allowMemberSecretary = opts?.allowMemberSecretary !== false;
  return members.map((raw, index) => {
    const member = normalizeStep4CommitteeMember(raw);
    if (index === 0) {
      return { ...member, role: "chair" };
    }
    if (member.role === "chair") {
      return { ...member, role: "" };
    }
    if (!allowMemberSecretary && member.role === "member_secretary") {
      return { ...member, role: "member" };
    }
    return member;
  });
}

/** จัดรูปแบบรายชื่อกรรมการขั้นตอนที่ 4 — เก็บใน evaluation_committee_text เพื่อ backward compat */
export function formatStep4CommitteeMembersForDisplay(members: Step4CommitteeMember[]): string {
  const lines: string[] = [];
  let filledIndex = 0;
  for (const raw of members) {
    const member = finalizeStep4CommitteeMember(raw);
    if (!member.full_name) continue;
    const roleLabel =
      STEP4_COMMITTEE_ROLE_OPTIONS.find((o) => o.value === member.role)?.label ?? "";
    const displayNum = filledIndex + 1;
    let line = `${displayNum}. ${member.full_name}`;
    if (member.position) line += ` (${member.position})`;
    if (roleLabel) line += ` - ${roleLabel}`;
    lines.push(line);
    filledIndex += 1;
  }
  return lines.join("\n");
}

export function normalizeStep4CommitteeMembers(
  raw?: Step4CommitteeMember[] | null,
  minRows = STEP4_MIN_COMMITTEE_MEMBERS,
  opts?: Step4CommitteeRoleConstraintOptions,
): Step4CommitteeMember[] {
  const normalized = (raw ?? []).map(normalizeStep4CommitteeMember);
  while (normalized.length < minRows) {
    normalized.push({ ...EMPTY_STEP4_COMMITTEE_MEMBER });
  }
  return applyStep4CommitteeRoleConstraints(normalized, opts);
}

export function getStep4CommitteeMembersIssues(
  members: Step4CommitteeMember[] | undefined,
  committeeKind: "evaluation" | "inspection",
): Step4ComplianceIssue[] {
  const panelId =
    committeeKind === "evaluation"
      ? "evaluation_committee_members"
      : "inspection_committee_members";
  const label =
    committeeKind === "evaluation" ? "คณะกรรมการพิจารณาผล" : "คณะกรรมการตรวจรับ";
  const normalized = applyStep4CommitteeRoleConstraints(
    (members ?? []).map(normalizeStep4CommitteeMember),
    committeeKind === "evaluation"
      ? { allowMemberSecretary: true }
      : { allowMemberSecretary: false },
  );
  const issues: Step4ComplianceIssue[] = [];

  if (normalized.length < STEP4_MIN_COMMITTEE_MEMBERS) {
    issues.push({
      id: panelId,
      message: `${label} ต้องมีอย่างน้อย ${STEP4_MIN_COMMITTEE_MEMBERS} คน`,
    });
    return issues;
  }

  normalized.forEach((member, index) => {
    const rowId = `${panelId}_row_${index}`;
    const rowNo = index + 1;
    if (!member.full_name.trim()) {
      issues.push({
        id: rowId,
        message: `${label} แถวที่ ${rowNo}: กรุณาระบุชื่อ-นามสกุล`,
      });
    }
    if (!member.position.trim()) {
      issues.push({
        id: rowId,
        message: `${label} แถวที่ ${rowNo}: กรุณาระบุตำแหน่ง/สังกัด`,
      });
    }
    if (!member.role) {
      issues.push({
        id: rowId,
        message: `${label} แถวที่ ${rowNo}: กรุณาเลือกบทบาทในคณะกรรมการ`,
      });
    }
  });

  return issues;
}

/** แยก/ย้ายค่าวันทำการ legacy — ฟิลด์เดิมรวม 2 ความหมายไว้ใน committee_review_workdays */
export function normalizeStep4WorkdayFields(
  bidResult: Pick<Step4BidResult, "bid_submission_workdays" | "committee_review_workdays">,
): Pick<Step4BidResult, "bid_submission_workdays" | "committee_review_workdays"> {
  const bidSubmission = bidResult.bid_submission_workdays;
  const committeeReview = bidResult.committee_review_workdays;

  if (bidSubmission != null && bidSubmission > 0) {
    return {
      bid_submission_workdays: bidSubmission,
      committee_review_workdays:
        committeeReview != null && committeeReview > 0 ? committeeReview : null,
    };
  }

  if (committeeReview != null && committeeReview > 0) {
    return {
      bid_submission_workdays: committeeReview,
      committee_review_workdays: STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END,
    };
  }

  return { bid_submission_workdays: null, committee_review_workdays: null };
}

export function normalizeStep4BidResult(bidResult: Step4BidResult): Step4BidResult {
  const evaluationMembers = normalizeStep4CommitteeMembers(
    bidResult.evaluation_committee_members,
    STEP4_MIN_COMMITTEE_MEMBERS,
    { allowMemberSecretary: true },
  ).map(finalizeStep4CommitteeMember);
  const inspectionMembers = normalizeStep4CommitteeMembers(
    bidResult.inspection_committee_members,
    STEP4_MIN_COMMITTEE_MEMBERS,
    { allowMemberSecretary: false },
  ).map(finalizeStep4CommitteeMember);
  const workdays = normalizeStep4WorkdayFields(bidResult);
  return {
    ...bidResult,
    ...workdays,
    evaluation_committee_members: evaluationMembers,
    inspection_committee_members: inspectionMembers,
    evaluation_committee_text:
      bidResult.evaluation_committee_text?.trim() ||
      formatStep4CommitteeMembersForDisplay(evaluationMembers),
    inspection_committee_text:
      bidResult.inspection_committee_text?.trim() ||
      formatStep4CommitteeMembersForDisplay(inspectionMembers),
  };
}

/** ผลการเสนอราคา / รายงานขอซื้อขอจ้าง — ขั้นตอนที่ 4 */
export type Step4BidResult = {
  /** รายงานขอซื้อขอจ้าง — เลขที่หนังสือ */
  procurement_request_letter_no?: string;
  /** วันที่หัวหน้าหน่วยงานอนุมัติรายงานขอซื้อขอจ้าง */
  procurement_request_approval_date?: string;
  /** ระยะเวลาเผยแพร่เอกสารและยื่นข้อเสนอราคา (วันทำการ) */
  bid_submission_workdays?: number | null;
  /** ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ) */
  committee_review_workdays?: number | null;
  /** รายชื่อคณะกรรมการพิจารณาผล — โครงสร้างอาเรย์ (step4_notes) */
  evaluation_committee_members?: Step4CommitteeMember[];
  /** รายชื่อคณะกรรมการตรวจรับ — โครงสร้างอาเรย์ (step4_notes) */
  inspection_committee_members?: Step4CommitteeMember[];
  /** @deprecated สรุปข้อความจาก evaluation_committee_members — เก็บเพื่อ backward compat */
  evaluation_committee_text?: string;
  /** @deprecated สรุปข้อความจาก inspection_committee_members */
  inspection_committee_text?: string;
  /** สรุปเหตุผลความจำเป็นในการคัดเลือกผู้ชนะ — แสดงเมื่อกรอกจำนวนผู้ยื่นข้อเสนอ */
  winner_selection_reason_summary?: string;
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
  /** ยืนยันตรวจสอบคำสั่งพิจารณาผล/ตรวจรับที่ดึงจากขั้นตอนที่ 2 */
  evaluation_inspection_order_confirmed?: boolean;
  /** ตารางผู้ยื่นข้อเสนอและเปรียบเทียบราคา — บันทึกใน step4 note */
  bidders?: Step4Bidder[];
};

export type Step2ComplianceLog = {
  /** มีการแจ้งเตือนความเร็วในการอนุมัติราคากลาง (ไม่บล็อก — บันทึกเพื่อ audit) */
  fast_median_approval_warning?: boolean;
  fast_median_approval_warning_at?: string;
};

export type Step1FormData = {
  checklist?: Step1Checklist;
  /** @deprecated ใช้ specificWorkflow.reason */
  specificMethodReason?: string;
  /** ฟิลด์ขั้นตอนที่ 1 — วิธีเฉพาะเจาะจง (< 500,000 บาท) */
  specificWorkflow?: Partial<Step1SpecificWorkflowFields>;
};
export type Step2FormData = {
  checklist?: Step2Checklist;
  committeeOrder?: Step2CommitteeOrder;
  medianPrice?: Step2MedianPrice;
  committees?: Partial<Step2CommitteesState>;
  complianceLog?: Step2ComplianceLog;
  /** ใบเสนอราคารายเดียว — วิธีเฉพาะเจาะจง */
  specificQuotation?: Partial<Step2SpecificQuotation>;
};
export type Step3FormData = {
  checklist?: Step3Checklist;
  announcement?: Step3Announcement;
  complianceLog?: Step3ComplianceLog;
};

/** บันทึก compliance warning ขั้นตอนที่ 3 — ชื่อกรรมการซ้ำข้ามชุด */
export type Step3ComplianceLog = {
  committee_overlap_warning?: boolean;
  committee_overlap_warning_at?: string;
  committee_overlap_names?: string[];
  committee_overlap_reason?: string;
};
export type Step4NotesPayload = {
  evaluation_committee_members: Step4CommitteeMember[];
  inspection_committee_members: Step4CommitteeMember[];
  /** เลขที่หนังสือรายงานผลการพิจารณา — ซิงก์ใน note เพื่อส่งต่อขั้นตอนที่ 8 */
  evaluation_report_letter_no?: string;
  /** วันที่หัวหน้าหน่วยงานลงนามอนุมัติผล — ซิงก์ใน note เพื่อส่งต่อขั้นตอนที่ 8 */
  evaluation_report_approval_date?: string;
};

export type Step4FormData = {
  checklist?: Step4Checklist;
  bidResult?: Step4BidResult;
  /** โครงสร้าง JSON คณะกรรมการขั้นตอนที่ 4 — บันทึกใน note ของ procurement_steps */
  step4_notes?: Step4NotesPayload;
};
export type Step5FormData = { checklist?: Step5Checklist; announcement?: Step5Announcement };

/** ข้อมูลอุทธรณ์ — บันทึกใน note ของ procurement_steps (ขั้นตอนที่ 6) */
export type Step6FormData = {
  checklist?: Step6Checklist;
  appeal?: Step6AppealState;
  /** @deprecated alias — ใช้ appeal */
  step6_notes?: Step6AppealState;
};

/** ข้อมูลหนังสือแจ้งทำสัญญา — ขั้นตอนที่ 7 */
export type Step7ContractNotice = {
  contract_notice_letter_no: string;
  contract_notice_letter_date: string;
  contractor_received_date: string;
  contract_signing_deadline: string;
};

export type Step7FormData = {
  checklist?: Record<string, boolean>;
  contractNotice?: Step7ContractNotice;
};

export const EMPTY_STEP7_CONTRACT_NOTICE: Step7ContractNotice = {
  contract_notice_letter_no: "",
  contract_notice_letter_date: "",
  contractor_received_date: "",
  contract_signing_deadline: "",
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

/** ตัวเลือกประเภทหลักประกันในฟอร์มขั้นตอนที่ 8 (UI) */
export const STEP8_GUARANTEE_TYPE_UI_OPTIONS: Array<{
  value: Exclude<Step8GuaranteeType, "">;
  label: string;
}> = [
  { value: "cash", label: "เงินสด" },
  { value: "cashier_check", label: "แคชเชียร์เช็ค" },
  { value: "bank_guarantee", label: "หนังสือค้ำประกันธนาคาร (LG)" },
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
  /** วันสิ้นสุดสัญญา — บันทึกจากฟอร์มเพื่อส่งต่อขั้นตอนที่ 10 */
  contract_end_date: string;
  /** จำนวนงวดงานทั้งหมดตามสัญญา — ใช้ดีดตารางตรวจรับ Step 10 */
  total_installment_count: number | null;
  /** วันเริ่มต้นสัญญา — sync กับ notice_to_proceed_date (legacy) */
  work_start_date: string;
  notice_to_proceed_date: string;
  /** วันที่ประกาศเผยแพร่สาระสำคัญในระบบ e-GP (มาตรา 98) */
  egp_essential_publication_date: string;
  /** เลขที่สัญญาจากระบบ e-GP */
  egp_contract_control_no: string;
  /** @deprecated ไม่ใช้ในฟอร์มขั้นตอนที่ 9 รุ่นใหม่ */
  notice_to_proceed_letter_no: string;
};

export type Step9FormData = {
  checklist?: Record<string, boolean>;
  contractSchedule?: Step9ContractSchedule;
};

export const EMPTY_STEP9_CONTRACT_SCHEDULE: Step9ContractSchedule = {
  contract_duration_days: null,
  contract_end_date: "",
  total_installment_count: null,
  work_start_date: "",
  notice_to_proceed_date: "",
  egp_essential_publication_date: "",
  egp_contract_control_no: "",
  notice_to_proceed_letter_no: "",
};

/** แถวตารางตรวจรับงวดงาน — ขั้นตอนที่ 10 */
export type Step10ProjectType = "general" | "construction";

export type Step10InspectionRow = {
  installment_no: number;
  /** วันครบกำหนดส่งมอบประจำงวดตามสัญญา */
  planned_completion_date: string;
  /** เลขที่หนังสือส่งมอบงาน */
  delivery_letter_no: string;
  delivery_date: string;
  inspection_date: string;
  /** ผลการตรวจรับ — passed | defects */
  inspection_result: string;
  /** อัตราค่าปรับต่อวัน (ร้อยละ) */
  penalty_rate_pct: number | null;
  /** งานก่อสร้าง — ชื่อผู้ควบคุมงาน */
  supervisor_name: string;
  /** งานก่อสร้าง — วันที่ผู้ควบคุมงานรายงานผลสำเร็จ */
  supervisor_report_date: string;
  progress_pct: number | null;
  progress_cumulative_units: number | null;
  inspector_note: string;
  /** @deprecated ใช้ inspection_result */
  installment_status: string;
  /** หมายเหตุความคืบหน้าจากฝ่ายแผนงานก่อสร้าง (ซิงก์) */
  site_diary?: string;
  /** อุปสรรคหน้างานจากฝ่ายแผนงานก่อสร้าง (ซิงก์) */
  site_obstacles?: string;
  /** งวดนี้มีการซิงก์ข้อมูลจากเมนูติดตามงานก่อสร้างแล้ว */
  construction_synced?: boolean;
};

export type Step10FormData = {
  checklist?: Record<string, boolean>;
  project_type?: Step10ProjectType;
  inspectionRows?: Step10InspectionRow[];
};

function normalizeStep10InspectionRow(
  row: Partial<Step10InspectionRow>,
  index: number,
  projectType: Step10ProjectType = "general",
): Step10InspectionRow {
  const inspectionResult =
    row.inspection_result?.trim() ||
    (row.installment_status === "inspection_passed" ? "passed" : "");
  const penaltyRate =
    row.penalty_rate_pct != null && Number.isFinite(row.penalty_rate_pct)
      ? row.penalty_rate_pct
      : projectType === "construction"
        ? 0.01
        : 0.1;
  return {
    installment_no: row.installment_no ?? index + 1,
    planned_completion_date: row.planned_completion_date?.trim() ?? "",
    delivery_letter_no: row.delivery_letter_no?.trim() ?? "",
    delivery_date: row.delivery_date?.trim() ?? "",
    inspection_date: row.inspection_date?.trim() ?? "",
    inspection_result: inspectionResult,
    penalty_rate_pct: penaltyRate,
    supervisor_name: row.supervisor_name?.trim() ?? "",
    supervisor_report_date: row.supervisor_report_date?.trim() ?? "",
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
    installment_status:
      inspectionResult === "passed"
        ? "inspection_passed"
        : row.installment_status?.trim() ?? "",
    site_diary: row.site_diary?.trim() ?? "",
    site_obstacles: row.site_obstacles?.trim() ?? "",
    construction_synced: row.construction_synced === true,
  };
}

export function buildStep10InspectionRows(
  totalInstallments: number,
  existing: Step10InspectionRow[] = [],
  plannedDates: string[] = [],
  projectType: Step10ProjectType = "general",
): Step10InspectionRow[] {
  const n = Math.max(0, Math.min(99, Math.floor(totalInstallments)));
  return Array.from({ length: n }, (_, index) => {
    const installment_no = index + 1;
    const prev = existing.find((row) => row.installment_no === installment_no);
    const planned =
      plannedDates[index]?.trim() || prev?.planned_completion_date?.trim() || "";
    if (prev) {
      return normalizeStep10InspectionRow(
        { ...prev, planned_completion_date: planned },
        index,
        projectType,
      );
    }
    return normalizeStep10InspectionRow(
      {
        installment_no,
        planned_completion_date: planned,
        penalty_rate_pct: projectType === "construction" ? 0.01 : 0.1,
      },
      index,
      projectType,
    );
  });
}

export function loadStep10FormFromNote(note: string | null): Step10FormData {
  const { form } = parseStepNote(note);
  const f = form as Step10FormData;
  const projectType: Step10ProjectType | undefined =
    f.project_type === "construction"
      ? "construction"
      : f.project_type === "general"
        ? "general"
        : undefined;
  const rowDefaultType = projectType ?? "general";
  const raw = f.inspectionRows ?? [];
  return {
    checklist: f.checklist,
    ...(projectType != null ? { project_type: projectType } : {}),
    inspectionRows: raw.map((row, index) =>
      normalizeStep10InspectionRow(row, index, rowDefaultType),
    ),
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
  | Step6FormData
  | Step7FormData
  | Step8FormData
  | Step9FormData
  | Step10FormData;

export const EMPTY_STEP4_BID_RESULT: Required<
  Omit<Step4BidResult, never>
> = {
  procurement_request_letter_no: "",
  procurement_request_approval_date: "",
  bid_submission_workdays: null,
  committee_review_workdays: null,
  evaluation_committee_members: createStep4CommitteeMemberRows(STEP4_MIN_COMMITTEE_MEMBERS),
  inspection_committee_members: createStep4CommitteeMemberRows(STEP4_MIN_COMMITTEE_MEMBERS),
  evaluation_committee_text: "",
  inspection_committee_text: "",
  winner_selection_reason_summary: "",
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
  bidders: [],
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

/** เอกสารที่เกี่ยวกับการเผยแพร่/วิจารณ์ร่างประกาศ — เคลียร์เมื่อสลับกลับไปโหมดข้ามการฟัง */
export const STEP3_HEARING_ONLY_DOC_TYPES = [
  STEP3_DOC.EGP_ANNOUNCEMENT,
  STEP3_DOC.EGP_SCREENSHOT,
  STEP3_DOC.FEEDBACK_REPORT,
] as const;

export function isStep3HearingOnlyDocType(documentType: string): boolean {
  return (STEP3_HEARING_ONLY_DOC_TYPES as readonly string[]).includes(documentType);
}

/** เปิดโหมดจัดฟังคำวิจารณ์ (ยกเลิกสถานะข้าม) */
export function buildStep3ProceedHearingAnnouncementState(
  announcement: Step3Announcement,
): Step3Announcement {
  return {
    ...announcement,
    hearing_proceed: true,
    hearing_skipped: false,
    skip_reason: undefined,
  };
}

/** สลับกลับไปข้ามการฟัง — เคลียร์ฟิลด์วิจารณ์ออกจาก state */
export function buildStep3SkipAnnouncementState(
  announcement: Step3Announcement,
  reason: Step3SkipReason,
): Step3Announcement {
  return {
    ...announcement,
    hearing_skipped: true,
    skip_reason: reason,
    hearing_proceed: false,
    publication_start: "",
    publication_end: "",
    publication_end_extension_reason: "",
    publication_end_extended: false,
    comment_channel_email: "",
    feedback_result: "",
    feedback_report_no: "",
    feedback_clarification_letter_no: "",
    feedback_notes: "",
  };
}

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
  return formatBudgetInputFromCurrency(v);
}

export function parseBudgetInput(v: string): number {
  return parseBudgetInputFromCurrency(v);
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
  const bidDays = announcement.bid_submission_workdays;
  const reviewDays = announcement.committee_review_workdays;
  return {
    procurement_request_letter_no:
      announcement.procurement_request_letter_no?.trim() || null,
    procurement_request_approval_date:
      announcement.procurement_request_approval_date?.trim() || null,
    committee_review_workdays:
      reviewDays != null && Number.isFinite(reviewDays) && reviewDays > 0
        ? Math.round(reviewDays)
        : bidDays != null && Number.isFinite(bidDays) && bidDays > 0
          ? Math.round(bidDays)
          : null,
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
  const form = loadStep3FormFromNote(step3Note);
  return resolveCommitteeReviewWorkdaysFromAnnouncement(project, form.announcement);
}

/** วันที่อนุมัติราคากลางจากขั้นตอนที่ 2 */
export function resolveStep2MedianApprovalDate(
  project: { median_price_approval_date?: string | null } | null,
  step2Note: string | null,
): string {
  const step2Form = loadStep2FormFromNote(step2Note);
  return resolveStep2MedianApprovalDateFromContext(
    project,
    step2Form.medianPrice?.median_price_approval_date ?? null,
  );
}

/** ดึงวันสิ้นสุดการรับฟังความคิดเห็นจากขั้นตอนที่ 3 */
export function resolveStep3PublicationEnd(step3Note: string | null): string {
  const form = loadStep3FormFromNote(step3Note);
  return resolveStep3PublicationEndFromAnnouncement(form.announcement);
}

/** แปลงฟิลด์รายงานขอซื้อขอจ้างจากขั้น 4 เป็นรูปแบบ announcement สำหรับบันทึกลง projects */
export function step4BidResultToProcurementAnnouncement(
  bidResult: Step4BidResult,
): Pick<
  Step3Announcement,
  | "procurement_request_letter_no"
  | "procurement_request_approval_date"
  | "bid_submission_workdays"
  | "committee_review_workdays"
> {
  const normalized = normalizeStep4WorkdayFields(bidResult);
  return {
    procurement_request_letter_no: bidResult.procurement_request_letter_no ?? "",
    procurement_request_approval_date: bidResult.procurement_request_approval_date ?? "",
    bid_submission_workdays: normalized.bid_submission_workdays ?? null,
    committee_review_workdays: normalized.committee_review_workdays ?? null,
  };
}

/** วันเริ่มนับรับซองราคา — อนุมัติรายงานขอซื้อขอจ้างจากขั้นตอนที่ 3 */
export function resolveBidPeriodStartDate(
  project: {
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): string {
  const form = loadStep3FormFromNote(step3Note);
  return resolveBidPeriodStartDateFromAnnouncement(project, form.announcement);
}

/** คำนวณไทม์ไลน์ขั้นตอนที่ 4 ครบชุดจากข้อมูลขั้นตอนที่ 3 */
export function computeStep4Timeline(
  project: {
    committee_review_workdays?: number | null;
    procurement_request_approval_date?: string | null;
    bid_submission_workdays?: number | null;
  } | null,
  step3Note: string | null,
  liveAnnouncement?: Partial<Step3Announcement> | null,
): Step4Timeline {
  const fromNote = loadStep3FormFromNote(step3Note).announcement;
  const announcement = liveAnnouncement ? { ...fromNote, ...liveAnnouncement } : fromNote;
  return computeStep4TimelineFromAnnouncement(project, announcement);
}

/** @deprecated ใช้ computeStep4Timeline().bidSubmissionEndISO แทน */
export function resolveBidSubmissionEndDate(
  project: {
    committee_review_workdays?: number | null;
    procurement_request_approval_date?: string | null;
  } | null,
  step3Note: string | null,
): string {
  const form = loadStep3FormFromNote(step3Note);
  return resolveBidSubmissionEndDateFromAnnouncement(project, form.announcement);
}

/** มูลค่าสัญญาที่ส่งต่อขั้นตอนที่ 8 — ใช้ราคาตกลงจริงก่อน หากไม่มีใช้ราคาเสนอชนะ */
export function resolveStep4ContractAmount(bidResult: Pick<Step4BidResult, "final_agreed_amount" | "winning_bid_amount">): number | null {
  const final = bidResult.final_agreed_amount;
  if (final != null && Number.isFinite(final) && final > 0) return final;
  const winning = bidResult.winning_bid_amount;
  if (winning != null && Number.isFinite(winning) && winning > 0) return winning;
  return null;
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
    b.procurement_request_letter_no?.trim() ||
    b.procurement_request_approval_date?.trim() ||
    (b.committee_review_workdays != null && b.committee_review_workdays > 0) ||
    b.evaluation_committee_members?.some((m) => m.full_name?.trim()) ||
    b.inspection_committee_members?.some((m) => m.full_name?.trim()) ||
    b.evaluation_committee_text?.trim() ||
    b.inspection_committee_text?.trim() ||
    b.egp_doc_request_count != null ||
    b.egp_bid_submission_count != null ||
    b.winning_bidder_name?.trim() ||
    (b.winning_bid_amount != null && b.winning_bid_amount > 0) ||
    (b.final_agreed_amount != null && b.final_agreed_amount > 0) ||
    b.evaluation_report_letter_no?.trim() ||
    b.evaluation_report_approval_date?.trim() ||
    b.review_extension_memo_no?.trim() ||
    b.review_extension_approval_date?.trim() ||
    (b.bidders?.length ?? 0) > 0
  );
}

export function isAppealWorkflowLocked(
  appeal: Pick<Step6AppealState, "appeal_status" | "appeal_committee_decision">,
): boolean {
  if (appeal.appeal_status !== "pending") return false;
  const decision = appeal.appeal_committee_decision ?? "";
  return !decision || decision === "upheld";
}

export function isAppealBlocking(
  appeal: Pick<Step6AppealState, "appeal_status" | "appeal_committee_decision">,
): boolean {
  return isAppealWorkflowLocked(appeal);
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

/** ปลดล็อกช่องรหัส e-GP — เมื่อแนบหลักฐานแผนจัดซื้อจัดจ้าง (ข้อ 2) แล้ว; วิธีเฉพาะเจาะจงปลดล็อกทันที */
export function isStep1EgpCodeUnlocked(
  _checklist: Step1Checklist,
  opts?: {
    hasAnnualPlanDoc?: boolean;
    stepDocs?: Array<{ document_type: string }>;
    method?: string;
  },
): boolean {
  if (isSpecificMethodShortWorkflow(opts?.method)) return true;
  return !!(opts?.hasAnnualPlanDoc || hasStep1AnnualPlanDoc(opts?.stepDocs));
}

export type Step1ComplianceIssue = { id: string; message: string };

/** เอกสารบังคับขั้นตอนที่ 2 — ใช้ใน Compliance Gate (คำสั่งพิจารณาผล/ตรวจรับ = ไม่บังคับในขั้นตอนที่ 2) */
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

export const STEP1_RESULT_UNIT_OTHER_REQUIRED_MSG =
  "กรุณาระบุหน่วยวัดเมื่อเลือก «อื่น ๆ (พิมพ์ระบุเอง)» ตามระเบียบข้อ 22";

export function isStep1ResultUnitSubmitBlocked(
  unit: string | null | undefined,
  otherPending: boolean,
): boolean {
  if (isResultUnitOtherPending(unit, otherPending)) return true;
  return !isResultUnitComplete(unit);
}

/** คำเตือน Live Compliance — วงเงินเกิน 500,000 บาท กับวิธีเฉพาะเจาะจง */
export const STEP1_SPECIFIC_METHOD_BUDGET_COMPLIANCE_WARNING_MSG =
  "⚠️ คำเตือน: วงเงินงบประมาณเกิน 500,000 บาท โปรดตรวจสอบความถูกต้องของเงื่อนไขการใช้วิธีเฉพาะเจาะจงตามระเบียบกระทรวงการคลังฯ อย่างเคร่งครัด";

/** ตรวจพิกัดสถานที่ดำเนินการ — แปรผันตามประเภทโครงการ e-GP */
export function getStep1SiteLocationComplianceIssues(
  profile: Step1ProjectProfile,
): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];
  const siteDetailRequired = !isStep1SiteDetailOptional(profile.project_type);

  if (siteDetailRequired) {
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
  if (!isSpecificMethodShortWorkflow(method)) return false;
  const val = parseBudgetInput(budget);
  return val > STEP1_SPECIFIC_METHOD_MAX_BUDGET;
}

export function shouldShowStep1SpecificMethodBudgetComplianceWarning(
  budget: string,
  method: string,
): boolean {
  return isStep1SpecificMethodBudgetExceeded(budget, method);
}

/** Compliance Gate ขั้นตอนที่ 1 — เอกสารหลัก + ฟิลด์ฟอร์ม (ไม่ใช้ Smart Checklist) */
export function isStep1CoreDocumentsReady(
  stepDocs?: Array<{ document_type: string }>,
  method?: string,
): boolean {
  if (isSpecificMethodShortWorkflow(method)) {
    return isStep1SpecificCoreDocumentsReady(stepDocs);
  }
  return hasStep1AnnualPlanDoc(stepDocs);
}

export function countStep1CoreDocumentsReady(
  stepDocs?: Array<{ document_type: string }>,
  method?: string,
): { done: number; total: number } {
  if (isSpecificMethodShortWorkflow(method)) {
    const ready = isStep1SpecificCoreDocumentsReady(stepDocs);
    return { done: ready ? 1 : 0, total: 1 };
  }
  return { done: hasStep1AnnualPlanDoc(stepDocs) ? 1 : 0, total: 1 };
}

const STEP1_LEGACY_ANNUAL_PLAN_DOC_NAMES = [
  STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE,
  "เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ",
] as const;

/** วิธีเฉพาะเจาะจง — ยกเว้นเอกสารประกาศแผน e-GP ถาวร */
export function isStep1AnnualPlanDocRequired(method?: string): boolean {
  return !isSpecificMethodShortWorkflow(method);
}

export function isStep1AnnualPlanDocName(docName: string): boolean {
  return (STEP1_LEGACY_ANNUAL_PLAN_DOC_NAMES as readonly string[]).includes(docName);
}

/** รายการเอกสารบังคับขั้นตอนที่ 1 — แยกตามวิธีจัดซื้อ */
export function getStep1RequiredDocsForMethod(
  stepDocs: DocItem[],
  method?: string,
): DocItem[] {
  if (isSpecificMethodShortWorkflow(method)) {
    return [{ name: STEP1_SPECIFIC_DOC.PURCHASE_REQUEST_REPORT, required: true }];
  }
  return stepDocs.filter((d) => d.required);
}

/** ตรวจเอกสารบังคับขั้นตอนที่ 1 — วิธีเฉพาะเจาะจงไม่บังคับแผน e-GP */
export function isStep1RequiredDocSatisfiedForMethod(
  requiredName: string,
  uploadedTypes: string[],
  method?: string,
): boolean {
  if (isSpecificMethodShortWorkflow(method)) {
    if (isStep1AnnualPlanDocName(requiredName)) {
      return true;
    }
    if (requiredName === STEP1_SPECIFIC_DOC.PURCHASE_REQUEST_REPORT) {
      return hasStep1SpecificPurchaseReportDoc(
        uploadedTypes.map((document_type) => ({ document_type })),
      );
    }
    return uploadedTypes.includes(requiredName);
  }
  if (isStep1AnnualPlanDocName(requiredName)) {
    return hasStep1PlanPublicationDoc(
      uploadedTypes.map((document_type) => ({ document_type })),
    );
  }
  return uploadedTypes.includes(requiredName);
}

export function getStep1RequiredFormFieldIssues(opts: {
  egpCode: string;
  budget: string;
  responsibleName: string;
  projectName: string;
  method: string;
  projectProfile: Step1ProjectProfile;
  specificMethodReason?: string;
  specificWorkflow?: Step1SpecificWorkflowFields;
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
      message: isSpecificMethodShortWorkflow(opts.method)
        ? "กรุณาระบุเลขที่โครงการ e-GP / รหัสโครงการภายใน"
        : "กรุณาระบุรหัสแผนจัดซื้อจัดจ้าง e-GP",
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
  if (!opts.projectProfile.budget_category?.trim()) {
    issues.push({
      id: "budget_category",
      message: "กรุณาเลือกหมวดงบประมาณ",
    });
  }
  if (!opts.projectProfile.project_type?.trim()) {
    issues.push({
      id: "egp_project_type",
      message: "กรุณาเลือกประเภทโครงการ (e-GP)",
    });
  }
  if (
    opts.projectProfile.target_quantity == null ||
    !Number.isFinite(opts.projectProfile.target_quantity) ||
    opts.projectProfile.target_quantity <= 0
  ) {
    issues.push({
      id: "target_quantity",
      message: "กรุณาระบุจำนวนผลสัมฤทธิ์ของงาน",
    });
  }
  if (!opts.projectProfile.result_unit?.trim()) {
    issues.push({
      id: "result_unit",
      message: "กรุณาเลือกหน่วยวัดผลสัมฤทธิ์ของงาน",
    });
  }
  issues.push(...getStep1SiteLocationComplianceIssues(opts.projectProfile));

  return issues;
}

/** ฟิลด์พื้นฐานขั้นตอนที่ 1 — วิธีเฉพาะเจาะจง (ไม่รวม e-Bidding / ที่อยู่ / บก.06) */
export function getStep1SpecificMethodBaseFormIssues(opts: {
  egpCode: string;
  budget: string;
  responsibleName: string;
  projectName: string;
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
      message: "กรุณาระบุเลขที่โครงการ e-GP / รหัสโครงการภายใน",
    });
  }
  if (!opts.projectName?.trim()) {
    issues.push({
      id: "project_name",
      message: "กรุณาระบุชื่อโครงการ",
    });
  }
  if (!opts.responsibleName?.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }
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
  specificWorkflow?: Step1SpecificWorkflowFields;
}): { done: number; total: number } {
  const isSpecific = isSpecificMethodShortWorkflow(opts.method);
  if (isSpecific) {
    const baseTotal = 4;
    const wfTotal = 5;
    const docTotal = 1;
    const total = baseTotal + wfTotal + docTotal;
    let done = 0;
    const budgetVal = parseBudgetInput(opts.budget ?? "");
    if (budgetVal > 0) done += 1;
    if (opts.egpCode?.trim()) done += 1;
    if (opts.projectName?.trim()) done += 1;
    if (opts.responsibleName?.trim()) done += 1;
    if (opts.specificWorkflow) {
      const wf = opts.specificWorkflow;
      if (wf.delivery_days != null && wf.delivery_days >= 1) done += 1;
      if (wf.reason?.trim()) done += 1;
      if (wf.spec?.trim()) done += 1;
      if (wf.inspector_type) done += 1;
      if (isStep1SpecificInspectorsComplete(wf)) done += 1;
    }
    return { done, total };
  }
  const siteFieldTotal = countStep1SiteLocationRequiredFields(opts.projectProfile.project_type);
  const total = 9 + siteFieldTotal;
  let done = 0;
  const budgetVal = parseBudgetInput(opts.budget ?? "");
  if (budgetVal > 0) done += 1;
  if (opts.egpCode?.trim()) done += 1;
  if (opts.projectName?.trim()) done += 1;
  if (opts.method?.trim()) done += 1;
  if (opts.responsibleName?.trim()) done += 1;
  const siteIssues = getStep1SiteLocationComplianceIssues(opts.projectProfile);
  done += siteFieldTotal - siteIssues.length;
  if (opts.projectProfile.budget_category?.trim()) done += 1;
  if (opts.projectProfile.project_type?.trim()) done += 1;
  if (opts.projectProfile.result_unit?.trim()) done += 1;
  if (
    opts.projectProfile.target_quantity != null &&
    Number.isFinite(opts.projectProfile.target_quantity) &&
    opts.projectProfile.target_quantity > 0
  ) {
    done += 1;
  }
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
    specificWorkflow?: Step1SpecificWorkflowFields;
    stepDocs?: Array<{ document_type: string }>;
  },
  _autoStates?: Record<string, boolean>,
): Step1ComplianceIssue[] {
  const issues: Step1ComplianceIssue[] = [];

  if (isLowBudgetElectronicMethodConflict(opts.budget, opts.method)) {
    issues.push({
      id: "low_budget_electronic_method",
      message: STEP1_LOW_BUDGET_EBIDDING_BLOCKED_MSG,
    });
  }

  if (isStep1SpecificMethodBudgetExceeded(opts.budget, opts.method)) {
    issues.push({
      id: "specific_method_budget_exceeded",
      message: STEP1_SPECIFIC_METHOD_BUDGET_EXCEEDED_MSG,
    });
  }

  if (isSpecificMethodShortWorkflow(opts.method)) {
    const wf = normalizeStep1SpecificWorkflow(opts.specificWorkflow);
    issues.push(
      ...getStep1SpecificWorkflowComplianceIssues(wf, opts.stepDocs),
    );
    issues.push(...getStep1SpecificMethodBaseFormIssues(opts));
    return issues;
  }

  if (isSpecificMethodShortWorkflow(opts.method) && !opts.specificMethodReason?.trim()) {
    issues.push({
      id: "specific_method_reason",
      message: STEP1_SPECIFIC_METHOD_REASON_REQUIRED_MSG,
    });
  }

  if (!isStep1CoreDocumentsReady(opts.stepDocs, opts.method)) {
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
    specificWorkflow?: Step1SpecificWorkflowFields;
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
  const legacyReason =
    typeof f.specificMethodReason === "string" ? f.specificMethodReason : "";
  const specificWorkflow = normalizeStep1SpecificWorkflow(f.specificWorkflow);
  if (!specificWorkflow.reason && legacyReason) {
    specificWorkflow.reason = legacyReason;
  }
  return {
    checklist: normalizeStep1Checklist(f.checklist),
    specificMethodReason: legacyReason || specificWorkflow.reason,
    specificWorkflow,
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

/** รายการเอกสารบังคับขั้นตอนที่ 2 — ปรับตามประเภทงาน (งานก่อสร้างไม่บังคับ BOQ/ใบเสนอราคา 3 ราย) */
export function getStep2RequiredDocsForProject(
  baseDocs: DocItem[],
  projectType: string | null | undefined,
): DocItem[] {
  if (!isEgpConstructionProjectType(projectType)) {
    return baseDocs;
  }
  return [
    { name: STEP2_DOC.APPOINTMENT_ORDER, required: true },
    { name: STEP2_DOC.REFERENCE_PRICE_SUMMARY, required: true },
    { name: STEP2_DOC.MEDIAN_PRICE_BG01, required: true },
    { name: STEP2_DOC.INTEGRITY_LETTER, required: true },
  ];
}

export function isStep2CoreDocumentsReady(opts: {
  hasAppointmentOrderDoc: boolean;
  hasBoqDoc: boolean;
  hasIntegrityLetterDoc: boolean;
  hasMedianPriceTableDoc: boolean;
  hasMarketQuotesDoc: boolean;
  hasReferencePriceDoc?: boolean;
  isConstructionProject?: boolean;
}): boolean {
  if (opts.isConstructionProject) {
    return (
      opts.hasAppointmentOrderDoc &&
      opts.hasMedianPriceTableDoc &&
      !!opts.hasReferencePriceDoc
    );
  }
  return (
    opts.hasAppointmentOrderDoc &&
    opts.hasBoqDoc &&
    opts.hasIntegrityLetterDoc &&
    opts.hasMedianPriceTableDoc &&
    opts.hasMarketQuotesDoc
  );
}

export function countStep2CoreDocumentsReady(opts: {
  hasAppointmentOrderDoc: boolean;
  hasBoqDoc: boolean;
  hasIntegrityLetterDoc: boolean;
  hasMedianPriceTableDoc: boolean;
  stepDocs?: Array<{ document_type: string }>;
  isConstructionProject?: boolean;
}): { done: number; total: number } {
  if (opts.isConstructionProject) {
    let done = 0;
    if (opts.hasAppointmentOrderDoc) done += 1;
    if (hasStep2ReferencePriceDoc(opts.stepDocs)) done += 1;
    if (opts.hasMedianPriceTableDoc) done += 1;
    return { done, total: 3 };
  }
  let done = 0;
  if (opts.hasAppointmentOrderDoc) done += 1;
  if (opts.hasBoqDoc) done += 1;
  if (opts.hasIntegrityLetterDoc) done += 1;
  if (opts.hasMedianPriceTableDoc) done += 1;
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

  const price = opts.isConstructionProject
    ? opts.medianPrice.approved_reference_price
    : opts.medianPrice.approved_median_price;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    issues.push({
      id: opts.isConstructionProject
        ? "approved_reference_price"
        : "approved_median_price",
      message: opts.isConstructionProject
        ? "กรุณาระบุมูลค่าราคากลางสุทธิที่ได้รับการอนุมัติ (บาท)"
        : "กรุณาระบุราคากลาง (บาท)",
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

  if (!opts.isConstructionProject) {
    if (!isStep2MarketQuotesComplete(opts.committees.market_quotes)) {
      issues.push({
        id: "market_quotes",
        message: "กรุณากรอกใบเสนอราคาท้องตลาดครบ 3 ราย (ชื่อซัพพลายเออร์และราคา)",
      });
    }
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
  const isConstruction = !!opts.isConstructionProject;
  const formIssues = getStep2RequiredFormFieldIssues(opts);
  const structuralIds = new Set(
    isConstruction
      ? [
          "committee_members_combined",
          "committee_members_tor",
          "committee_members_median",
          "appointment_order_no",
          "appointment_order_date",
          "median_approval_letter_no",
          "approved_reference_price",
          "median_over_budget",
          "median_price_approval_date",
          "median_price_approval_before_appointment",
          "responsible_officer",
        ]
      : [
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
        ],
  );
  const structuralIssueCount = formIssues.filter((i) => structuralIds.has(i.id)).length;
  const total = isConstruction ? 11 : 11;
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
    hasMedianPriceTableDoc: boolean;
    hasIntegrityLetterDoc: boolean;
    hasEvaluationInspectionOrderDoc?: boolean;
    hasMarketQuotesDoc: boolean;
    step1Budget?: number;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
    quotationOnly?: boolean;
    specificQuotation?: Step2SpecificQuotation;
    fiscalYear?: number;
    isConstructionProject?: boolean;
    hasReferencePriceDoc?: boolean;
    projectType?: string | null;
  },
  _autoStates?: Record<string, boolean>,
): Step2ComplianceIssue[] {
  const issues: Step2ComplianceIssue[] = [];

  if (opts.quotationOnly) {
    const approvedBudget = opts.step1Budget ?? 0;
    issues.push(
      ...getStep2SpecificQuotationComplianceIssues({
        quotation: normalizeStep2SpecificQuotation(opts.specificQuotation),
        approvedBudget,
        fiscalYear: opts.fiscalYear,
        stepDocs: opts.stepDocs,
      }),
    );
    if (!opts.responsibleName.trim()) {
      issues.push({
        id: "responsible_officer",
        message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
      });
    }
    return issues;
  }

  if (!opts.hasAppointmentOrderDoc) {
    issues.push({
      id: "appointment_order_doc",
      message: "กรุณาแนบไฟล์เอกสารคำสั่งแต่งตั้ง",
    });
  }
  if (!opts.isConstructionProject && !opts.hasBoqDoc) {
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
  if (!opts.hasMedianPriceTableDoc) {
    issues.push({
      id: "median_price_table_doc",
      message: `กรุณาแนบไฟล์${resolveStep2MedianPriceTableFieldLabel(opts.projectType)}`,
    });
  }
  if (!opts.isConstructionProject && !opts.hasMarketQuotesDoc) {
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

  if (opts.isConstructionProject && !opts.hasReferencePriceDoc) {
    issues.push({
      id: "construction_reference_doc",
      message: `กรุณาแนบไฟล์${STEP2_REFERENCE_PRICE_FIELD_LABEL}`,
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
      hasMedianPriceTableDoc: opts.hasMedianPriceTableDoc,
      hasIntegrityLetterDoc: opts.hasIntegrityLetterDoc,
      isConstructionProject: opts.isConstructionProject,
    });
  const torMedianMembersOk =
    opts.committees.appointment_mode === "combined"
      ? countFilledCommitteeMembers(opts.committees.combined_members) >= 3
      : countFilledCommitteeMembers(opts.committees.tor_members) >= 3 &&
        countFilledCommitteeMembers(opts.committees.median_price_members) >= 3;
  const price = opts.isConstructionProject
    ? opts.medianPrice.approved_reference_price
    : opts.medianPrice.approved_median_price;
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
    bg06_table_verified: !!opts.hasMedianPriceTableDoc,
  };
  const effectiveChecklist = buildEffectiveChecklist(
    2,
    checklist as Record<string, boolean>,
    mergedAuto,
    opts.stepDocs,
    undefined,
    opts.projectType,
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
    specificQuotation: normalizeStep2SpecificQuotation(f.specificQuotation),
  };
}

type Step2ProjectLike = {
  committee_appointment_mode?: string | null;
  committee_appointment_order_no?: string | null;
  committee_appointment_order_date?: string | null;
  allocated_budget?: number | null;
  budget?: number | null;
  approved_median_price?: number | null;
  approved_reference_price?: number | null;
  median_price_approval_date?: string | null;
  median_approval_letter_no?: string | null;
  /** legacy — ย้ายมาใช้ approved_median_price ในขั้นตอนที่ 2 */
  estimated_price?: number | null;
};

/** ราคากลางที่แสดง/ใช้งาน — ขั้นตอนที่ 2 เป็นหลัก (รองรับงานก่อสร้าง + ข้อมูลเก่า) */
export function resolveProjectMedianPrice(project: {
  approved_reference_price?: number | null;
  approved_median_price?: number | null;
  estimated_price?: number | null;
} | null): number | null {
  if (!project) return null;
  const reference = project.approved_reference_price;
  if (reference != null && Number(reference) > 0) return Number(reference);
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
          : project.approved_median_price != null &&
              Number(project.approved_median_price) > 0
            ? Number(project.approved_median_price)
            : null,
      approved_reference_price:
        form.medianPrice?.approved_reference_price != null &&
        Number.isFinite(form.medianPrice.approved_reference_price) &&
        form.medianPrice.approved_reference_price > 0
          ? form.medianPrice.approved_reference_price
          : project.approved_reference_price != null &&
              Number(project.approved_reference_price) > 0
            ? Number(project.approved_reference_price)
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
    specificQuotation: normalizeStep2SpecificQuotation(form.specificQuotation),
  };
}
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
  opts?: {
    referencePriceDocumentUrl?: string | null;
    isConstructionProject?: boolean;
  },
) {
  const price = opts?.isConstructionProject
    ? medianPrice.approved_reference_price
    : medianPrice.approved_median_price;
  const normalized =
    price != null && Number.isFinite(price) && price > 0 ? price : null;
  const refPrice = medianPrice.approved_reference_price;
  const normalizedReference =
    refPrice != null && Number.isFinite(refPrice) && refPrice > 0 ? refPrice : null;
  const allocated = medianPrice.allocated_budget;
  const normalizedAllocated =
    allocated != null && Number.isFinite(allocated) && allocated > 0
      ? allocated
      : null;
  const base = {
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
  if (!opts?.isConstructionProject) return base;
  return {
    ...base,
    approved_reference_price: normalizedReference,
    reference_price_document_url: opts.referencePriceDocumentUrl?.trim() || null,
    /** งานก่อสร้าง — ใช้ราคาอ้างอิงถอดแบบเป็นค่ากลางในขั้นถัดไปเมื่อยังไม่มีราคากลางคณะกรรมการ */
    approved_median_price: normalized ?? normalizedReference,
    estimated_price: normalized ?? normalizedReference,
  };
}

/** ส่งต่อข้อมูลจากโครงการ/ขั้นตอนที่ 2 → ขั้นตอนที่ 3 (รวมเลขโครงการ e-GP) */
export function mergeStep3AnnouncementFromStep2Project(
  announcement: Step3Announcement,
  project:
    | ({
        median_approval_letter_no?: string | null;
      } & ProjectEgpIdSource)
    | null,
): Step3Announcement {
  if (!project) return announcement;
  const egpId = resolveEgpProjectId(project);
  return {
    ...announcement,
    approval_letter_no:
      announcement.approval_letter_no?.trim() ||
      project.median_approval_letter_no?.trim() ||
      "",
    egp_project_code:
      announcement.egp_project_code?.trim() || egpId || "",
  };
}

export function isStep4ChecklistComplete(
  checklist: Step4Checklist,
  _opts?: { isConstructionProject?: boolean },
): boolean {
  return STEP4_CHECKLIST_ITEMS.filter(
    (item) => item.key !== "supervisor_order_uploaded",
  ).every((item) => checklist[item.key]);
}

export function countStep4ChecklistDone(
  checklist: Step4Checklist,
  _opts?: { isConstructionProject?: boolean },
): number {
  return STEP4_CHECKLIST_ITEMS.filter(
    (item) => item.key !== "supervisor_order_uploaded",
  ).filter((item) => checklist[item.key]).length;
}

export type Step4ComplianceIssue = { id: string; message: string };

export function isStep4CoreDocumentsReady(opts: {
  hasSignedProcurementRequestDoc: boolean;
  hasCommitteeOrderDoc: boolean;
  hasSupervisorOrderDoc?: boolean;
  isConstructionProject?: boolean;
}): boolean {
  return !!opts.hasSignedProcurementRequestDoc && !!opts.hasCommitteeOrderDoc;
}

export function countStep4CoreDocumentsReady(opts: {
  hasSignedProcurementRequestDoc: boolean;
  hasCommitteeOrderDoc: boolean;
  hasSupervisorOrderDoc?: boolean;
  isConstructionProject?: boolean;
}): { done: number; total: number } {
  let done = 0;
  const total = 2;
  if (opts.hasSignedProcurementRequestDoc) done += 1;
  if (opts.hasCommitteeOrderDoc) done += 1;
  return { done, total };
}

/** รายชื่อคณะกรรมการราคากลางจากขั้นตอนที่ 2 — สำหรับคัดลอกไปคณะพิจารณาผลขั้นตอนที่ 4 */
export function resolveStep2MedianPriceCommitteeMembers(
  committees: Step2CommitteesState,
): Step2CommitteeMember[] {
  if (committees.appointment_mode === "separate") {
    return pickFilledCommitteeMembers(committees.median_price_members);
  }
  const combined = pickFilledCommitteeMembers(committees.combined_members);
  if (combined.length > 0) return combined;
  return pickFilledCommitteeMembers(committees.tor_members);
}

export function hasStep2MedianPriceCommitteeNames(committees: Step2CommitteesState): boolean {
  return resolveStep2MedianPriceCommitteeMembers(committees).length > 0;
}

/** โหลด state คณะกรรมการขั้นตอนที่ 2 จาก note + ตาราง committees (ใช้ซิงค์ข้ามขั้น) */
export function hydrateStep2CommitteesFromSources(
  rows: Step2CommitteeDbRow[],
  project: {
    committee_appointment_mode?: Step2CommitteeAppointmentMode | string | null;
  } | null,
  step2Note: string | null | undefined,
): Step2CommitteesState {
  const step2Form = loadStep2FormFromStep({ note: step2Note ?? null });
  return loadStep2CommitteesFromDb(
    rows,
    project?.committee_appointment_mode ?? step2Form.committees?.appointment_mode,
    step2Form.committees,
  );
}

/** มีรายชื่อคณะกรรมการจากขั้นตอนที่ 2 (ชุดใหม่หรือชุดเก่า TOR/ราคากลาง) */
export function hasStep2CommitteeMemberNames(committees: Step2CommitteesState): boolean {
  return (
    resolveStep4CommitteeMembersForEvaluation(committees).length > 0 ||
    resolveStep4CommitteeMembersForInspection(committees).length > 0
  );
}

function pickFilledCommitteeMembers(members: Step2CommitteeMember[]): Step2CommitteeMember[] {
  return members.filter((m) => getCommitteeMemberName(m).trim());
}

/** ชุด TOR / รวม — สำหรับโครงการเก่าที่ยังไม่มี evaluation_members */
function resolveStep4LegacyTorMembers(committees: Step2CommitteesState): Step2CommitteeMember[] {
  if (committees.appointment_mode === "separate") {
    const tor = pickFilledCommitteeMembers(committees.tor_members);
    if (tor.length > 0) return tor;
  }
  return pickFilledCommitteeMembers(committees.combined_members);
}

/** ชุดราคากลาง / รวม — สำหรับโครงการเก่าที่ยังไม่มี inspection_members */
function resolveStep4LegacyMedianMembers(committees: Step2CommitteesState): Step2CommitteeMember[] {
  if (committees.appointment_mode === "separate") {
    const median = pickFilledCommitteeMembers(committees.median_price_members);
    if (median.length > 0) return median;
  }
  return pickFilledCommitteeMembers(committees.combined_members);
}

/** รายชื่อคณะกรรมการพิจารณาผล — evaluation_members ก่อน แล้ว fallback TOR/รวม */
function resolveStep4CommitteeMembersForEvaluation(
  committees: Step2CommitteesState,
): Step2CommitteeMember[] {
  const dedicated = pickFilledCommitteeMembers(committees.evaluation_members);
  if (dedicated.length > 0) return dedicated;
  return resolveStep4LegacyTorMembers(committees);
}

/** รายชื่อคณะกรรมการตรวจรับ — inspection_members ก่อน แล้ว fallback ราคากลาง/TOR/รวม */
function resolveStep4CommitteeMembersForInspection(
  committees: Step2CommitteesState,
): Step2CommitteeMember[] {
  const dedicated = pickFilledCommitteeMembers(committees.inspection_members);
  if (dedicated.length > 0) return dedicated;
  const medianLegacy = resolveStep4LegacyMedianMembers(committees);
  if (medianLegacy.length > 0) return medianLegacy;
  return resolveStep4LegacyTorMembers(committees);
}

/** เติมรายชื่อคณะกรรมการจากขั้นตอนที่ 2 เมื่อช่องขั้นตอนที่ 4 ยังว่าง */
export function applyStep4CommitteeAutoFill(
  bidResult: Step4BidResult,
  committees?: Step2CommitteesState | null,
  opts?: { step2Note?: string | null },
): Step4BidResult {
  const safeCommittees = committees ?? EMPTY_STEP2_COMMITTEES;
  console.log("📦 [FALLBACK CHECK] Raw Step 2 Project Note:", opts?.step2Note ?? null);

  const evaluationArray = resolveStep4CommitteeMembersForEvaluation(safeCommittees);
  const inspectionArray = resolveStep4CommitteeMembersForInspection(safeCommittees);
  console.log("🔍 DEBUG EVALUATION MEMBERS:", evaluationArray);
  console.log("🔍 DEBUG INSPECTION MEMBERS:", inspectionArray);

  const evaluationValue = formatCommitteeMembersForDisplay(evaluationArray) || "";
  const inspectionValue = formatCommitteeMembersForDisplay(inspectionArray) || "";
  const hasEvaluationSource = evaluationArray.some((m) => getCommitteeMemberName(m).trim());
  const hasInspectionSource = inspectionArray.some((m) => getCommitteeMemberName(m).trim());
  const finalOutputText = {
    evaluation_committee: evaluationValue,
    inspection_committee: inspectionValue,
  };
  console.log("🎭 [ROLE DEBUG] Full Formatted String for Step 4:", finalOutputText);
  console.log("✍️ [COMMITTEE FORMAT] Evaluation Text:", evaluationValue);
  console.log("🎯 [FALLBACK OUT] Evaluation Target Text:", evaluationValue);
  console.log("🎯 [FALLBACK OUT] Inspection Target Text:", inspectionValue);

  return {
    ...bidResult,
    evaluation_committee_text: hasEvaluationSource
      ? evaluationValue
      : bidResult.evaluation_committee_text?.trim() || "",
    inspection_committee_text: hasInspectionSource
      ? inspectionValue
      : bidResult.inspection_committee_text?.trim() || "",
  };
}

function step2MemberToStep4CommitteeMember(
  member: Step2CommitteeMember,
  index: number,
): Step4CommitteeMember {
  const name = getCommitteeMemberName(member);
  let role: Step4CommitteeMemberRole | "" = "";
  if (member.role === "chair") role = "chair";
  else if (member.role === "member") role = "member";
  else {
    const roleLabel = resolveCommitteeRoleInCommittee(member);
    if (roleLabel.includes("ประธาน")) role = "chair";
    else if (name.trim()) role = index === 0 ? "chair" : "member";
  }
  const jobPosition = resolveCommitteeJobPosition(member);
  return {
    full_name: name,
    position: jobPosition || member.position_endorsement?.trim() || "",
    role,
  };
}

/** คัดลอกรายชื่อคณะกรรมการพิจารณาผลจากขั้นตอนที่ 2 → โครงสร้างขั้นตอนที่ 4 (ไม่แตะคณะตรวจรับ) */
export function buildStep4EvaluationCommitteeFromStep2(
  committees: Step2CommitteesState,
): Pick<Step4BidResult, "evaluation_committee_members" | "evaluation_committee_text"> {
  const medianSource = resolveStep2MedianPriceCommitteeMembers(committees);
  const evaluation_committee_members =
    medianSource.length > 0
      ? medianSource.map(step2MemberToStep4CommitteeMember)
      : createStep4CommitteeMemberRows(STEP4_MIN_COMMITTEE_MEMBERS);
  const constrainedEval = applyStep4CommitteeRoleConstraints(evaluation_committee_members, {
    allowMemberSecretary: true,
  });
  return {
    evaluation_committee_members: constrainedEval,
    evaluation_committee_text: formatStep4CommitteeMembersForDisplay(constrainedEval),
  };
}

/** คัดลอกรายชื่อคณะกรรมการจากขั้นตอนที่ 2 → โครงสร้างขั้นตอนที่ 4 */
export function buildStep4CommitteesFromStep2(
  committees: Step2CommitteesState,
): Pick<
  Step4BidResult,
  | "evaluation_committee_members"
  | "inspection_committee_members"
  | "evaluation_committee_text"
  | "inspection_committee_text"
> {
  const evalSource = resolveStep4CommitteeMembersForEvaluation(committees);
  const inspSource = resolveStep4CommitteeMembersForInspection(committees);
  const evaluation_committee_members =
    evalSource.length > 0
      ? evalSource.map(step2MemberToStep4CommitteeMember)
      : createStep4CommitteeMemberRows(STEP4_MIN_COMMITTEE_MEMBERS);
  const inspection_committee_members =
    inspSource.length > 0
      ? inspSource.map(step2MemberToStep4CommitteeMember)
      : createStep4CommitteeMemberRows(STEP4_MIN_COMMITTEE_MEMBERS);
  const constrainedEval = applyStep4CommitteeRoleConstraints(evaluation_committee_members, {
    allowMemberSecretary: true,
  });
  const constrainedInsp = applyStep4CommitteeRoleConstraints(inspection_committee_members, {
    allowMemberSecretary: false,
  });
  return {
    evaluation_committee_members: constrainedEval,
    inspection_committee_members: constrainedInsp,
    evaluation_committee_text: formatStep4CommitteeMembersForDisplay(constrainedEval),
    inspection_committee_text: formatStep4CommitteeMembersForDisplay(constrainedInsp),
  };
}

export function getStep4RequiredFormFieldIssues(
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    step2MedianApprovalDate?: string;
    step3PublicationEnd?: string;
    requiresStep3PublicationEnd?: boolean;
    timelineCtx?: TimelineValidationContext;
  },
): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];
  const normalizedWorkdays = normalizeStep4WorkdayFields(bidResult);

  if (!bidResult.procurement_request_letter_no?.trim()) {
    issues.push({
      id: "procurement_request_letter_no",
      message: "กรุณาระบุเลขที่หนังสือบันทึกข้อความเสนอขอเห็นชอบ",
    });
  }
  if (!bidResult.procurement_request_approval_date?.trim()) {
    issues.push({
      id: "procurement_request_approval_date",
      message: "กรุณาระบุวันที่หัวหน้าหน่วยงานลงนามในรายงานขอซื้อขอจ้าง",
    });
  } else {
    issues.push(
      ...getStep4ProcurementSignDateIssues(bidResult.procurement_request_approval_date, {
        step2MedianApprovalDate: opts.step2MedianApprovalDate,
        step3PublicationEnd: opts.step3PublicationEnd,
        requiresStep3PublicationEnd: opts.requiresStep3PublicationEnd,
      }),
    );
  }

  if (normalizedWorkdays.bid_submission_workdays == null || normalizedWorkdays.bid_submission_workdays <= 0) {
    issues.push({
      id: "bid_submission_workdays",
      message: "กรุณาระบุระยะเวลาเผยแพร่เอกสารและยื่นข้อเสนอราคา (วันทำการ)",
    });
  }
  if (
    normalizedWorkdays.committee_review_workdays == null ||
    normalizedWorkdays.committee_review_workdays <= 0
  ) {
    issues.push({
      id: "committee_review_workdays",
      message: "กรุณาระบุระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ)",
    });
  }

  issues.push(
    ...getStep4CommitteeMembersIssues(
      bidResult.evaluation_committee_members,
      "evaluation",
    ),
  );
  issues.push(
    ...getStep4CommitteeMembersIssues(
      bidResult.inspection_committee_members,
      "inspection",
    ),
  );

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
  const total = 6;
  let done = 0;
  const normalizedWorkdays = normalizeStep4WorkdayFields(bidResult);

  if (bidResult.procurement_request_letter_no?.trim()) done += 1;

  const approvalDate = bidResult.procurement_request_approval_date?.trim();
  if (
    approvalDate &&
    getStep4ProcurementSignDateIssues(approvalDate, {
      step2MedianApprovalDate: opts.step2MedianApprovalDate,
      step3PublicationEnd: opts.step3PublicationEnd,
      requiresStep3PublicationEnd: opts.requiresStep3PublicationEnd,
    }).length === 0
  ) {
    done += 1;
  }

  if (
    normalizedWorkdays.bid_submission_workdays != null &&
    normalizedWorkdays.bid_submission_workdays > 0
  ) {
    done += 1;
  }
  if (
    normalizedWorkdays.committee_review_workdays != null &&
    normalizedWorkdays.committee_review_workdays > 0
  ) {
    done += 1;
  }

  if (
    getStep4CommitteeMembersIssues(bidResult.evaluation_committee_members, "evaluation")
      .length === 0
  ) {
    done += 1;
  }
  if (
    getStep4CommitteeMembersIssues(bidResult.inspection_committee_members, "inspection")
      .length === 0
  ) {
    done += 1;
  }

  return { done, total };
}

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 4 (ก่อนเปิดซองเท่านั้น) */
export function getStep4ComplianceIssues(
  _checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: {
    responsibleName: string;
    hasSignedProcurementRequestDoc: boolean;
    hasCommitteeOrderDoc: boolean;
    hasSupervisorOrderDoc?: boolean;
    isConstructionProject?: boolean;
    step2MedianApprovalDate?: string;
    step3PublicationEnd?: string;
    requiresStep3PublicationEnd?: boolean;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step4ComplianceIssue[] {
  const issues: Step4ComplianceIssue[] = [];

  if (!opts.hasSignedProcurementRequestDoc) {
    issues.push({
      id: "signed_procurement_request_doc",
      message: `กรุณาแนบเอกสาร "${STEP4_DOC.SIGNED_PROCUREMENT_REQUEST}"`,
    });
  }
  if (!opts.hasCommitteeOrderDoc) {
    issues.push({
      id: "committee_order_doc",
      message: STEP4_EVALUATION_INSPECTION_ORDER_REQUIRED_MSG,
    });
  }

  issues.push(
    ...getStep4RequiredFormFieldIssues(bidResult, {
      responsibleName: opts.responsibleName,
      step2MedianApprovalDate: opts.step2MedianApprovalDate,
      step3PublicationEnd: opts.step3PublicationEnd,
      requiresStep3PublicationEnd: opts.requiresStep3PublicationEnd,
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
    hasBidderAppealLetterDoc: boolean;
    hasAgencyOpinionCgdDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
  },
): boolean {
  if (!appealStatus) return false;
  if (appealStatus === "none") return true;
  if (appealStatus === "pending") {
    const hasAgencyCgd =
      opts.hasAgencyOpinionCgdDoc ||
      (opts.hasAgencyReportDoc && opts.hasCgdReportDoc);
    return opts.hasBidderAppealLetterDoc && hasAgencyCgd;
  }
  return false;
}

export function countStep6CoreDocumentsReady(
  appealStatus: string,
  opts: {
    hasNoAppealEgpDoc: boolean;
    hasBidderAppealLetterDoc: boolean;
    hasAgencyOpinionCgdDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
  },
): { done: number; total: number } {
  if (!appealStatus) return { done: 0, total: 1 };
  if (appealStatus === "none") return { done: 1, total: 1 };
  if (appealStatus === "pending") {
    let done = 0;
    const total = 2;
    if (opts.hasBidderAppealLetterDoc) done += 1;
    if (
      opts.hasAgencyOpinionCgdDoc ||
      (opts.hasAgencyReportDoc && opts.hasCgdReportDoc)
    ) {
      done += 1;
    }
    return { done, total };
  }
  return { done: 0, total: 1 };
}

export function isAppealReceivedBeforeStep5Notification(
  receivedISO: string,
  step5NotificationISO: string,
): boolean {
  return (
    !!receivedISO?.trim() &&
    !!step5NotificationISO?.trim() &&
    receivedISO.trim() < step5NotificationISO.trim()
  );
}

export const STEP6_APPEAL_RECEIVED_BEFORE_STEP5_MSG =
  "วันที่หน่วยงานได้รับหนังสืออุทธรณ์ต้องไม่ก่อนวันที่แจ้งผลให้ผู้เสนอราคาทราบในขั้นตอนที่ 5";

export function getStep6RequiredFormFieldIssues(
  appeal: Step6AppealState,
  opts: {
    responsibleName: string;
    step5NotificationDate?: string;
    timelineCtx?: TimelineValidationContext;
  },
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
      message: "กรุณาเลือกสถานะการอุทธรณ์ผลการจัดซื้อจัดจ้าง",
    });
  }
  if (status === "pending") {
    if (!appeal.appeal_bidder_name?.trim()) {
      issues.push({
        id: "appeal_bidder_name",
        message: "กรุณาเลือกชื่อผู้ประกอบการที่ยื่นอุทธรณ์",
      });
    }
    const receivedDate =
      appeal.appeal_received_date?.trim() ||
      appeal.appeal_report_approval_date?.trim() ||
      "";
    if (!receivedDate) {
      issues.push({
        id: "appeal_received_date",
        message: "กรุณาระบุวันที่หน่วยงานได้รับหนังสืออุทธรณ์",
      });
    } else if (
      opts.step5NotificationDate &&
      isAppealReceivedBeforeStep5Notification(receivedDate, opts.step5NotificationDate)
    ) {
      issues.push({
        id: "appeal_received_date",
        message: STEP6_APPEAL_RECEIVED_BEFORE_STEP5_MSG,
      });
    }
    if (!appeal.appeal_report_letter_no?.trim()) {
      issues.push({
        id: "appeal_report_letter_no",
        message: "กรุณาระบุเลขที่หนังสือรายงานความเห็นเสนอหัวหน้าหน่วยงาน",
      });
    }
    if (!appeal.appeal_head_opinion?.trim()) {
      issues.push({
        id: "appeal_head_opinion",
        message: "กรุณาเลือกผลการพิจารณาของหัวหน้าหน่วยงาน",
      });
    }
    if (!appeal.cgd_submission_letter_no?.trim()) {
      issues.push({
        id: "cgd_submission_letter_no",
        message: "กรุณาระบุเลขที่หนังสือส่งเรื่องให้กรมบัญชีกลาง",
      });
    }
    if (!appeal.cgd_submission_date?.trim()) {
      issues.push({
        id: "cgd_submission_date",
        message: "กรุณาระบุวันที่ส่งเรื่องให้กรมบัญชีกลาง",
      });
    }
    if (!appeal.appeal_committee_decision?.trim()) {
      issues.push({
        id: "appeal_committee_decision",
        message: "กรุณาเลือกผลการวินิจฉัยจากคณะกรรมการพิจารณาอุทธรณ์",
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
  opts: {
    responsibleName: string;
    step5NotificationDate?: string;
    timelineCtx?: TimelineValidationContext;
  },
): { done: number; total: number } {
  const status = appeal.appeal_status ?? "";
  const total = status === "pending" ? 9 : 2;
  const formIssues = getStep6RequiredFormFieldIssues(appeal, opts);
  return { done: Math.max(0, total - formIssues.length), total };
}

/** ตรวจความพร้อมขั้นตอนที่ 6 — ฟอร์ม + เอกสารตามเคสอุทธรณ์ */
export function getStep6ComplianceIssues(
  appeal: Step6AppealState,
  _checklist: Step6Checklist,
  opts: {
    hasNoAppealEgpDoc: boolean;
    hasBidderAppealLetterDoc: boolean;
    hasAgencyOpinionCgdDoc: boolean;
    hasAgencyReportDoc: boolean;
    hasCgdReportDoc: boolean;
    responsibleName: string;
    step5NotificationDate?: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step6ComplianceIssue[] {
  const issues: Step6ComplianceIssue[] = [];
  const status = appeal.appeal_status ?? "";

  if (status === "pending") {
    if (!opts.hasBidderAppealLetterDoc) {
      issues.push({
        id: "bidder_appeal_letter_doc",
        message: "กรุณาแนบหนังสืออุทธรณ์จากผู้ประกอบการ (PDF)",
      });
    }
    const hasAgencyCgd =
      opts.hasAgencyOpinionCgdDoc ||
      (opts.hasAgencyReportDoc && opts.hasCgdReportDoc);
    if (!hasAgencyCgd) {
      issues.push({
        id: "agency_opinion_cgd_doc",
        message:
          "กรุณาแนบรายงานความเห็นของหน่วยงาน + หนังสือส่งกรมบัญชีกลาง (PDF)",
      });
    }
  }

  issues.push(
    ...getStep6RequiredFormFieldIssues(appeal, {
      responsibleName: opts.responsibleName,
      step5NotificationDate: opts.step5NotificationDate,
      timelineCtx: opts.timelineCtx,
    }),
  );

  if (isAppealWorkflowLocked(appeal)) {
    issues.push({
      id: "appeal_workflow_locked",
      message:
        "มีผู้ยื่นอุทธรณ์ — ต้องเลือกผลวินิจฉัย «อุทธรณ์ฟังไม่ขึ้น» ก่อนจึงจะไปขั้นตอนถัดไปได้",
    });
  }

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
      hasBidderAppealLetterDoc: false,
      hasAgencyOpinionCgdDoc: false,
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
      hasBidderAppealLetterDoc: false,
      hasAgencyOpinionCgdDoc: false,
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

/** วันที่แจ้งผลให้ผู้เสนอราคาทราบ — ฐานนับระยะอุทธรณ์ (fallback เป็นวันประกาศผล) */
export function resolveAppealAnchorDate(
  project: {
    winner_result_notification_date?: string | null;
    winner_announcement_date?: string | null;
  } | null,
  step5Note?: string | null,
): string {
  const merged = mergeStep5FromProject(
    loadStep5FormFromNote(step5Note ?? null).announcement ?? { ...EMPTY_STEP5_ANNOUNCEMENT },
    project,
  );
  return (
    merged.winner_result_notification_date?.trim() ||
    merged.winner_announcement_date?.trim() ||
    ""
  );
}

export const STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG =
  "❌ วันที่แจ้งผลให้ผู้เสนอราคาทราบ ต้องไม่ก่อนวันที่ประกาศผล";

export const STEP5_CONTRACT_AFTER_APPEAL_MSG = (earliestISO: string) =>
  `⚠️ การทำสัญญาควรดำเนินการหลังวันที่ ${formatThaiDateSlash(earliestISO)} (เมื่อพ้นระยะเวลาอุทธรณ์แล้ว)`;

export const STEP4_WINNER_DATA_LOCKED_MSG =
  "🔒 ข้อมูลผู้ชนะและราคาตกลงจ้างถูกล็อกแล้ว — หากต้องการแก้ไขต้องยกเลิกประกาศผลใน e-GP และย้อนกลับไปแก้ไขขั้นตอนที่ 4";

/** ล็อกตารางผู้ยื่นข้อเสนอหลังผ่านขั้นตอนที่ 5 แล้ว (อยู่ขั้น 6 ขึ้นไป) */
export function isStep4WinnerDataLocked(currentStep: number): boolean {
  return currentStep > 5;
}

/** ล็อกข้อมูลประกาศผลหลังบันทึกขั้นตอนที่ 5 แล้ว (อยู่ขั้น 6 ขึ้นไป) */
export function isStep5WinnerDataLocked(currentStep: number): boolean {
  return currentStep > 5;
}

export function isStep4ReadyForNext(
  checklist: Step4Checklist,
  bidResult: Step4BidResult,
  opts: Parameters<typeof getStep4ComplianceIssues>[2],
  autoStates?: Record<string, boolean>,
): boolean {
  return getStep4ComplianceIssues(checklist, bidResult, opts, autoStates).length === 0;
}

export type Step5ComplianceIssue = { id: string; message: string };

function buildStep5EvidenceFieldValues(announcement: Step5Announcement) {
  return {
    winner_announcement_no: announcement.winner_announcement_no,
    winner_announcement_date: announcement.winner_announcement_date,
    winner_result_notification_date: announcement.winner_result_notification_date,
  };
}

export function isStep5CoreDocumentsReady(opts: {
  hasPriceComparisonDoc: boolean;
  hasCommitteeReportDoc: boolean;
  hasEgpBidSummaryDoc: boolean;
  hasEgpWinnerDoc: boolean;
  hasPhysicalBoardDoc: boolean;
}): boolean {
  return (
    opts.hasPriceComparisonDoc &&
    opts.hasCommitteeReportDoc &&
    opts.hasEgpBidSummaryDoc &&
    opts.hasEgpWinnerDoc &&
    opts.hasPhysicalBoardDoc
  );
}

export function countStep5CoreDocumentsReady(opts: {
  hasPriceComparisonDoc: boolean;
  hasCommitteeReportDoc: boolean;
  hasEgpBidSummaryDoc: boolean;
  hasEgpWinnerDoc: boolean;
  hasPhysicalBoardDoc: boolean;
}): { done: number; total: number } {
  let done = 0;
  const total = 5;
  if (opts.hasPriceComparisonDoc) done += 1;
  if (opts.hasCommitteeReportDoc) done += 1;
  if (opts.hasEgpBidSummaryDoc) done += 1;
  if (opts.hasEgpWinnerDoc) done += 1;
  if (opts.hasPhysicalBoardDoc) done += 1;
  return { done, total };
}

export function getStep5BidEvaluationFormFieldIssues(
  bidResult: Step4BidResult,
  opts: {
    step3PublicationEnd?: string;
    timelineCtx?: TimelineValidationContext;
  },
): Step5ComplianceIssue[] {
  const issues: Step5ComplianceIssue[] = [];
  issues.push(...getStep4BiddersFieldIssues(normalizeStep4Bidders(bidResult.bidders)));
  issues.push(
    ...getStep4EvaluationApprovalIssues(bidResult, {
      step3PublicationEnd: opts.step3PublicationEnd,
    }),
  );
  if (opts.timelineCtx) {
    issues.push(
      ...getCrossStepTimelineConflictIssues(
        5,
        [
          {
            id: "evaluation_report_approval_date",
            iso: bidResult.evaluation_report_approval_date?.trim() ?? "",
            label: "วันที่หัวหน้าหน่วยงานลงนามอนุมัติผลการพิจารณา",
          },
        ],
        opts.timelineCtx,
      ),
    );
  }
  return issues;
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

  if (!announcement.winner_result_notification_date?.trim()) {
    issues.push({
      id: "winner_result_notification_date",
      message: "กรุณาระบุวันที่แจ้งผลให้ผู้เสนอราคาทราบ",
    });
  } else {
    const notificationDate = announcement.winner_result_notification_date.trim();
    const announcementDate = announcement.winner_announcement_date?.trim() ?? "";
    if (announcementDate && notificationDate < announcementDate) {
      issues.push({
        id: "winner_result_notification_date",
        message: STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG,
      });
    }
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
  bidResult: Step4BidResult,
  opts: Parameters<typeof getStep5RequiredFormFieldIssues>[1] & {
    step3PublicationEnd?: string;
    timelineCtx?: TimelineValidationContext;
  },
): { done: number; total: number } {
  const announcementIssues = getStep5RequiredFormFieldIssues(announcement, opts);
  const bidIssues = getStep5BidEvaluationFormFieldIssues(bidResult, {
    step3PublicationEnd: opts.step3PublicationEnd,
    timelineCtx: opts.timelineCtx,
  });
  const total = 6;
  return {
    done: Math.max(0, total - announcementIssues.length - bidIssues.length),
    total,
  };
}

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 5 (หลังเปิดซอง + ประกาศผู้ชนะ) */
export function getStep5ComplianceIssues(
  _checklist: Step5Checklist,
  announcement: Step5Announcement,
  bidResult: Step4BidResult,
  opts: {
    hasPriceComparisonDoc: boolean;
    hasCommitteeReportDoc: boolean;
    hasEgpBidSummaryDoc: boolean;
    hasEgpWinnerDoc: boolean;
    hasPhysicalBoardDoc: boolean;
    evaluationApprovalDate: string;
    responsibleName: string;
    step3PublicationEnd?: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step5ComplianceIssue[] {
  const issues: Step5ComplianceIssue[] = [];

  if (!opts.hasPriceComparisonDoc) {
    issues.push({
      id: "price_comparison_doc",
      message: STEP4_PRICE_COMPARISON_REQUIRED_MSG,
    });
  }
  if (!opts.hasCommitteeReportDoc) {
    issues.push({
      id: "committee_evaluation_report_doc",
      message: STEP4_COMMITTEE_REPORT_REQUIRED_MSG,
    });
  }
  if (!opts.hasEgpBidSummaryDoc) {
    issues.push({
      id: "egp_bid_summary_doc",
      message: STEP4_EGP_BID_SUMMARY_REQUIRED_MSG,
    });
  }
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

  issues.push(
    ...getStep5BidEvaluationFormFieldIssues(bidResult, {
      step3PublicationEnd: opts.step3PublicationEnd,
      timelineCtx: opts.timelineCtx,
    }),
  );

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
  bidResult: Step4BidResult,
  opts: Parameters<typeof getStep5ComplianceIssues>[3],
  autoStates?: Record<string, boolean>,
): boolean {
  return (
    getStep5ComplianceIssues(checklist, announcement, bidResult, opts, autoStates).length === 0
  );
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
  if (isStep2SpecificQuotationComplete(normalizeStep2SpecificQuotation(form.specificQuotation))) {
    return true;
  }
  if (form.complianceLog && Object.keys(form.complianceLog).length > 0) return true;
  return false;
}

function formHasPersistedData(form: StepFormData): boolean {
  if (checklistHasAnyTrue(form.checklist as Record<string, boolean | undefined> | undefined)) {
    return true;
  }
  if ((form as Step1FormData).specificMethodReason?.trim()) return true;
  const sw = (form as Step1FormData).specificWorkflow;
  if (sw) {
    const normalized = normalizeStep1SpecificWorkflow(sw);
    if (
      normalized.delivery_days != null ||
      normalized.reason ||
      normalized.spec ||
      normalized.inspector_type ||
      normalized.inspectors.some((m) => m.name || m.position)
    ) {
      return true;
    }
  }
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
  if (step6AppealHasData((form as Step6FormData).appeal)) return true;
  if (step6AppealHasData((form as Step6FormData).step6_notes)) return true;
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
    notice.contract_notice_letter_no?.trim() ||
    notice.contract_notice_letter_date?.trim() ||
    notice.contractor_received_date?.trim() ||
    notice.contract_signing_deadline?.trim()
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

export function step6AppealHasData(appeal?: Step6AppealState | null): boolean {
  if (!appeal) return false;
  return !!(
    appeal.appeal_status === "none" ||
    appeal.appeal_status === "pending" ||
    appeal.appeal_bidder_name?.trim() ||
    appeal.appeal_received_date?.trim() ||
    appeal.appeal_report_letter_no?.trim() ||
    appeal.appeal_head_opinion?.trim() ||
    appeal.cgd_submission_letter_no?.trim() ||
    appeal.cgd_submission_date?.trim() ||
    appeal.appeal_committee_decision?.trim() ||
    appeal.appeal_report_approval_date?.trim() ||
    appeal.appeal_consideration_status?.trim()
  );
}

function normalizeStep6AppealState(raw: Partial<Step6AppealState>): Step6AppealState {
  const received =
    raw.appeal_received_date?.trim() || raw.appeal_report_approval_date?.trim() || "";
  const headOpinion =
    raw.appeal_head_opinion === "agree" || raw.appeal_head_opinion === "disagree"
      ? raw.appeal_head_opinion
      : "";
  const committeeDecision =
    raw.appeal_committee_decision === "upheld" ||
    raw.appeal_committee_decision === "not_upheld"
      ? raw.appeal_committee_decision
      : "";
  return {
    ...EMPTY_STEP6_APPEAL,
    ...raw,
    appeal_status:
      raw.appeal_status === "none" || raw.appeal_status === "pending"
        ? raw.appeal_status
        : "",
    appeal_received_date: received,
    appeal_head_opinion: headOpinion,
    appeal_committee_decision: committeeDecision,
  };
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
  const issues: Step3ComplianceIssue[] = [];
  issues.push(...getStep3MandatoryHearingGateIssues(opts.budget, opts.announcement));

  if (!opts.hearingFormActive) {
    if (!opts.hasDraftTorDoc) {
      issues.push({
        id: "draft_tor_doc",
        message: "กรุณาแนบไฟล์ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
      });
    }
    if (!opts.announcement.approval_letter_no?.trim()) {
      issues.push({
        id: "approval_letter_no",
        message: 'กรุณาระบุเลขที่บันทึกข้อความ "ขอเห็นชอบร่าง TOR และร่างประกาศ"',
      });
    }
    if (!opts.hasMemoDoc) {
      issues.push({
        id: "memo_approval_doc",
        message: "กรุณาแนบไฟล์บันทึกข้อความขอความเห็นชอบร่าง TOR และร่างประกาศ",
      });
    }
    if (!opts.hasBg06Doc) {
      issues.push({
        id: "bg06_doc",
        message: "กรุณาอัปโหลดตารางราคากลางในขั้นตอนที่ 2 ก่อนดำเนินการต่อ",
      });
    }
    issues.push(
      ...getStep3RequiredFormFieldIssues(opts.announcement, { hearingFormActive: false }),
    );
    return issues;
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
      message: "กรุณาอัปโหลดตารางราคากลางในขั้นตอนที่ 2 ก่อนดำเนินการต่อ",
    });
  }

  issues.push(
    ...getStep3RequiredFormFieldIssues(opts.announcement, { hearingFormActive: true }),
  );

  return issues;
}

export function isStep3ReadyForNext(
  checklist: Step3Checklist,
  opts: Parameters<typeof getStep3ComplianceIssues>[1],
): boolean {
  const mandatoryGate = getStep3MandatoryHearingGateIssues(opts.budget, opts.announcement);
  if (mandatoryGate.length > 0) return false;
  if (!opts.hearingFormActive) {
    return getStep3ComplianceIssues(checklist, opts).length === 0;
  }
  return (
    isStep3CoreDocumentsReady(opts) &&
    getStep3RequiredFormFieldIssues(opts.announcement, { hearingFormActive: true }).length === 0
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
    winner_result_notification_date?: string | null;
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
    winner_result_notification_date:
      announcement.winner_result_notification_date?.trim() ||
      project.winner_result_notification_date ||
      "",
  };
}

export type Step7ComplianceIssue = { id: string; message: string };

export const STEP7_NOTIFICATION_DEADLINE_EXCEEDED_MSG = (deadlineISO: string) =>
  `❌ วันที่ออกหนังสือแจ้งเกิน ${CONTRACT_NOTIFICATION_WORKDAYS} วันทำการตามระเบียบข้อ 161 (เดดไลน์: ${formatThaiDateSlash(deadlineISO)})`;

export const STEP7_RECEIVED_BEFORE_LETTER_MSG =
  "❌ วันที่ได้รับหนังสือเชิญ ห้ามเกิดก่อนวันที่ออกหนังสือเชิญชวน";

/** วันที่ได้รับหนังสือเชิญอยู่ก่อนวันที่ในหนังสือเชิญลงนามหรือไม่ */
export function isStep7ContractorReceivedBeforeLetterDate(
  letterDateISO: string,
  receivedDateISO: string,
): boolean {
  const letter = letterDateISO?.trim() ?? "";
  const received = receivedDateISO?.trim() ?? "";
  if (!letter || !received) return false;
  return received < letter;
}

/** ความสัมพันธ์เชิงเวลาระหว่างวันที่ในหนังสือ vs วันที่ได้รับ — ผ่านเมื่อยังไม่กรอกหรือ received ≥ letter */
export function isStep7ContractorReceivedDateChronoValid(
  letterDateISO: string,
  receivedDateISO: string,
): boolean {
  return !isStep7ContractorReceivedBeforeLetterDate(letterDateISO, receivedDateISO);
}

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 7 (ฟอร์มมาตรฐาน + หนังสือแจ้งทำสัญญา) */
export function getStep7ComplianceIssues(
  contractNotice: Step7ContractNotice,
  _manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    appealDeadlineISO: string;
    notificationDeadlineISO: string;
    hasContractNoticeLetterDoc: boolean;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step7ComplianceIssue[] {
  const issues: Step7ComplianceIssue[] = [];

  if (!contractNotice?.contract_notice_letter_no?.trim()) {
    issues.push({
      id: "contract_notice_letter_no",
      message: "กรุณาระบุเลขที่หนังสือเชิญลงนามในสัญญา",
    });
  }
  const letterDate = contractNotice?.contract_notice_letter_date?.trim() ?? "";
  if (!letterDate) {
    issues.push({
      id: "contract_notice_letter_date",
      message: "กรุณาระบุวันที่ในหนังสือเชิญลงนาม",
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
      message: `วันที่ในหนังสือเชิญลงนามต้องไม่ก่อนวันพ้นกำหนดอุทธรณ์ (ลงนามได้ตั้งแต่ ${formatThaiDateSlash(
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
  const receivedDate = contractNotice?.contractor_received_date?.trim() ?? "";
  if (!receivedDate) {
    issues.push({
      id: "contractor_received_date",
      message: "กรุณาระบุวันที่ผู้ประกอบการได้รับหนังสือเชิญ",
    });
  } else if (
    letterDate &&
    isStep7ContractorReceivedBeforeLetterDate(letterDate, receivedDate)
  ) {
    issues.push({
      id: "contractor_received_date_before_letter",
      message: STEP7_RECEIVED_BEFORE_LETTER_MSG,
    });
  }
  const signingDeadline = contractNotice?.contract_signing_deadline?.trim() ?? "";
  if (!signingDeadline) {
    issues.push({
      id: "contract_signing_deadline",
      message: "กรุณาระบุกำหนดวันสุดท้ายที่ต้องมาลงนาม",
    });
  }
  if (!opts.hasContractNoticeLetterDoc) {
    issues.push({
      id: "contract_notice_letter_doc",
      message: `กรุณาแนบเอกสาร "${STEP7_DOC.CONTRACT_NOTICE_LETTER}"`,
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

export function isStep8GuaranteeBelowMinimum(
  guaranteeAmount: number | null | undefined,
  contractAmount: number | null | undefined,
): boolean {
  const minimum = computeRecommendedGuaranteeAmount(contractAmount);
  if (minimum == null) return false;
  if (guaranteeAmount == null || !Number.isFinite(guaranteeAmount) || guaranteeAmount <= 0) {
    return false;
  }
  return guaranteeAmount < minimum;
}

export function isStep8SignedPastDeadline(
  signedDateISO: string,
  step7SigningDeadlineISO: string,
): boolean {
  const signed = signedDateISO?.trim() ?? "";
  const deadline = step7SigningDeadlineISO?.trim() ?? "";
  if (!signed || !deadline) return false;
  return signed > deadline;
}

export function isStep8SignedBeforeEarliest(
  signedDateISO: string,
  earliestSigningISO: string,
): boolean {
  const signed = signedDateISO?.trim() ?? "";
  const earliest = earliestSigningISO?.trim() ?? "";
  if (!signed || !earliest) return false;
  return signed < earliest;
}

export function isStep8SignedOutsideAllowedRange(
  signedDateISO: string,
  earliestSigningISO: string,
  step7SigningDeadlineISO: string,
): boolean {
  return (
    isStep8SignedBeforeEarliest(signedDateISO, earliestSigningISO) ||
    isStep8SignedPastDeadline(signedDateISO, step7SigningDeadlineISO)
  );
}

export function hasStep8SignedContractDoc(documentTypes: string[]): boolean {
  return documentTypes.some(
    (t) => t === STEP8_DOC.SIGNED_CONTRACT || t === STEP8_DOC_LEGACY.SIGNED,
  );
}

export function hasStep8GuaranteeVerificationDoc(documentTypes: string[]): boolean {
  return documentTypes.some(
    (t) =>
      t === STEP8_DOC.GUARANTEE_VERIFICATION || t === STEP8_DOC_LEGACY.GUARANTEE,
  );
}

export const STEP8_FORM_REQUIRED_PROGRESS_TOTAL = 5;

/** ความพร้อมขั้นตอนที่ 8 — 5 ฟิลด์จริงบนฟอร์ม (ไม่รวม Checklist เก่า) */
export function countStep8FormRequiredProgress(
  contractExecution: Step8ContractExecution,
  opts: {
    earliestSigningISO?: string;
    step7SigningDeadlineISO?: string;
    stepDocs?: Array<{ document_type: string }>;
  },
): { done: number; total: number } {
  console.log(
    "🔧 [BUG FIX STEP 8]: Process percentage logic refactored to match actual form fields. Old checklist states completely removed.",
  );

  const total = STEP8_FORM_REQUIRED_PROGRESS_TOTAL;
  let done = 0;
  const uploadedDocTypes = (opts.stepDocs ?? []).map((d) => d.document_type);

  if (contractExecution?.guarantee_type) done++;

  const guaranteeAmount = contractExecution?.guarantee_amount;
  if (guaranteeAmount != null && Number.isFinite(guaranteeAmount) && guaranteeAmount > 0) {
    done++;
  }

  const signedDate = contractExecution?.contract_signed_date?.trim() ?? "";
  const earliest = opts.earliestSigningISO?.trim() ?? "";
  const deadline = opts.step7SigningDeadlineISO?.trim() ?? "";
  if (
    signedDate &&
    !isStep8SignedOutsideAllowedRange(signedDate, earliest, deadline)
  ) {
    done++;
  }

  if (hasStep8SignedContractDoc(uploadedDocTypes)) done++;
  if (hasStep8GuaranteeVerificationDoc(uploadedDocTypes)) done++;

  return { done, total };
}

export type Step8ComplianceIssue = { id: string; message: string };

/** ตรวจความพร้อมก่อนไปขั้นถัดไป — ขั้นตอนที่ 8 (ฟอร์ม + Evidence Validation) */
export function getStep8ComplianceIssues(
  contractExecution: Step8ContractExecution,
  _manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    earliestSigningISO: string;
    appealDeadlineISO: string;
    step7SigningDeadlineISO?: string;
    stepDocs?: Array<{ document_type: string }>;
    timelineCtx?: TimelineValidationContext;
  },
): Step8ComplianceIssue[] {
  const issues: Step8ComplianceIssue[] = [];
  const uploadedDocTypes = (opts.stepDocs ?? []).map((d) => d.document_type);

  const signedDate = contractExecution?.contract_signed_date?.trim() ?? "";
  if (!signedDate) {
    issues.push({ id: "contract_signed_date", message: "กรุณาระบุวันที่ลงนามสัญญาจริง" });
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
  const step7Deadline = opts.step7SigningDeadlineISO?.trim() ?? "";
  const earliestSigning = opts.earliestSigningISO?.trim() ?? "";
  if (signedDate && earliestSigning && isStep8SignedBeforeEarliest(signedDate, earliestSigning)) {
    issues.push({
      id: "contract_signed_date_earliest",
      message: `วันที่ลงนามสัญญาจริงต้องไม่ก่อนวันที่เริ่มลงนามในสัญญาได้ (${formatThaiDateSlash(earliestSigning)})`,
    });
  }
  if (signedDate && step7Deadline && isStep8SignedPastDeadline(signedDate, step7Deadline)) {
    issues.push({
      id: "contract_signed_date_step7_deadline",
      message: `วันที่ลงนามสัญญาจริงต้องไม่เกินกำหนดวันสุดท้ายที่ต้องมาลงนามจากขั้นตอนที่ 7 (${formatThaiDateSlash(step7Deadline)})`,
    });
  }
  const contractAmount = contractExecution?.contract_amount;
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    issues.push({
      id: "contract_amount",
      message: "ยังไม่พบวงเงินราคาที่ตกลงซื้อจ้างจากขั้นตอนก่อนหน้า",
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

  if (!hasStep8SignedContractDoc(uploadedDocTypes)) {
    issues.push({
      id: "signed_contract_doc",
      message: "กรุณาอัปโหลดร่างสัญญาฉบับลงนามแล้ว",
    });
  }
  if (!hasStep8GuaranteeVerificationDoc(uploadedDocTypes)) {
    issues.push({
      id: "guarantee_verification_doc",
      message: "กรุณาอัปโหลดไฟล์หลักประกันสัญญา",
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
  _autoStates?: Record<string, boolean>,
): boolean {
  return getStep8ComplianceIssues(contractExecution, manualChecklist, opts).length === 0;
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

/** จำนวนวันปฏิทินระหว่างวันเริ่มต้นและวันสิ้นสุดสัญญา (end > start) */
export function computeStep9ContractDurationDays(
  startISO: string,
  endISO: string,
): number | null {
  const start = parseLocalISODate(startISO);
  const end = parseLocalISODate(endISO);
  if (!start || !end) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
  return diff > 0 ? diff : null;
}

/** วันสิ้นสุดสัญญา — ใช้ค่าที่บันทึก หรือคำนวณจากวันเริ่ม + ระยะเวลา (legacy) */
export function resolveStep9ContractEndDateISO(
  schedule: Pick<
    Step9ContractSchedule,
    "contract_end_date" | "work_start_date" | "contract_duration_days"
  >,
): string | null {
  const stored = schedule.contract_end_date?.trim();
  if (stored) return stored;
  return computeStep9ContractEndDateISO(
    schedule.work_start_date,
    schedule.contract_duration_days,
  );
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

/** Sync ระยะเวลาสัญญาจากวันเริ่มต้นและวันสิ้นสุด */
export function syncStep9ContractDurationFromDates(
  schedule: Step9ContractSchedule,
): Step9ContractSchedule {
  const start = schedule.work_start_date?.trim() ?? "";
  const end = schedule.contract_end_date?.trim() ?? "";
  if (!start || !end) {
    return { ...schedule, contract_duration_days: null };
  }
  const days = computeStep9ContractDurationDays(start, end);
  return { ...schedule, contract_duration_days: days };
}

/** Sync วันเริ่มงานระหว่างฟิลด์หลักและ legacy */
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
  const sanitized = sanitizeStep9WorkStartAgainstSignedDate(synced, signed);
  let contractEnd = sanitized.contract_end_date?.trim() ?? "";
  if (!contractEnd && workStart && duration != null && duration > 0) {
    contractEnd = computeStep9ContractEndDateISO(workStart, duration) ?? "";
  }
  return syncStep9ContractDurationFromDates({
    ...sanitized,
    contract_end_date: contractEnd,
    contract_duration_days: duration,
  });
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 9 จาก note */
export function loadStep9FormFromNote(note: string | null): Step9FormData {
  const { form } = parseStepNote(note);
  const f = form as Step9FormData;
  const raw = f.contractSchedule;
  const workStart = raw?.work_start_date?.trim() || raw?.notice_to_proceed_date?.trim() || "";
  const loaded = syncStep9WorkStartDate(
    {
      ...EMPTY_STEP9_CONTRACT_SCHEDULE,
      ...raw,
      contract_duration_days: raw?.contract_duration_days ?? null,
      contract_end_date: raw?.contract_end_date?.trim() ?? "",
      total_installment_count: raw?.total_installment_count ?? null,
      egp_essential_publication_date: raw?.egp_essential_publication_date ?? "",
      egp_contract_control_no: raw?.egp_contract_control_no ?? "",
      notice_to_proceed_letter_no: raw?.notice_to_proceed_letter_no ?? "",
    },
    workStart,
  );
  let contractEnd = loaded.contract_end_date?.trim() ?? "";
  if (!contractEnd && workStart && loaded.contract_duration_days != null && loaded.contract_duration_days > 0) {
    contractEnd =
      computeStep9ContractEndDateISO(workStart, loaded.contract_duration_days) ?? "";
  }
  return {
    checklist: f.checklist,
    contractSchedule: syncStep9ContractDurationFromDates({
      ...loaded,
      contract_end_date: contractEnd,
    }),
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

export function countStep9FormRequiredProgress(
  schedule: Step9ContractSchedule,
  opts: {
    stepDocs?: Array<{ document_type: string }>;
    contractSignedDate?: string | null;
  },
): { done: number; total: number } {
  const total = 6;
  let done = 0;
  if (schedule.egp_contract_control_no?.trim()) done += 1;
  const pub = schedule.egp_essential_publication_date?.trim() ?? "";
  const signed = opts.contractSignedDate?.trim() ?? "";
  if (pub && (!signed || !isISODateBefore(pub, signed))) done += 1;
  const start = schedule.work_start_date?.trim() ?? "";
  if (start && (!signed || !isISODateBefore(start, signed))) done += 1;
  const end = schedule.contract_end_date?.trim() ?? "";
  if (end && start && isISODateBefore(start, end)) done += 1;
  const installments = schedule.total_installment_count;
  if (installments != null && Number.isFinite(installments) && installments > 0) done += 1;
  if (hasStep9Hs1Doc(opts.stepDocs ?? [])) done += 1;
  return { done, total };
}

export function getStep9ComplianceIssues(
  schedule: Step9ContractSchedule,
  opts: {
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    contractSignedDate?: string | null;
    procurementPath?: string | null;
    externalCapture?: Step9ExternalCaptureInput;
    timelineCtx?: TimelineValidationContext;
  },
): Step9ComplianceIssue[] {
  const issues: Step9ComplianceIssue[] = [];
  const signedDate = opts.contractSignedDate?.trim() ?? "";

  if (!schedule.egp_contract_control_no?.trim()) {
    issues.push({
      id: "egp_contract_control_no",
      message: "กรุณาระบุเลขที่สัญญาจากระบบ e-GP",
    });
  }

  const egpPublication = schedule.egp_essential_publication_date?.trim() ?? "";
  if (!egpPublication) {
    issues.push({
      id: "egp_essential_publication_date",
      message: "กรุณาระบุวันที่ประกาศเผยแพร่สาระสำคัญในระบบ e-GP",
    });
  } else if (signedDate && isISODateBefore(egpPublication, signedDate)) {
    issues.push({
      id: "egp_publication_before_signed",
      message: `วันที่ประกาศสาระสำคัญต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signedDate)} เป็นต้นไป`,
    });
  } else if (signedDate && isStep9EgpPublicationTooLate(egpPublication, signedDate)) {
    const egpDeadline = computeStep9EgpDeadlineISO(signedDate);
    if (egpDeadline) {
      issues.push({
        id: "egp_essential_publication_deadline",
        message: getStep9EgpPublicationTooLateMsg(egpDeadline),
      });
    }
  }

  const workStart = schedule.work_start_date?.trim() ?? "";
  if (!workStart) {
    issues.push({
      id: "work_start_date",
      message: "กรุณาระบุวันเริ่มต้นสัญญา",
    });
  } else if (signedDate && isISODateBefore(workStart, signedDate)) {
    issues.push({
      id: "work_start_before_signed",
      message: `วันเริ่มต้นสัญญาต้องไม่ก่อนวันที่ลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signedDate)} เป็นต้นไป`,
    });
  }

  const contractEnd = schedule.contract_end_date?.trim() ?? "";
  if (!contractEnd) {
    issues.push({
      id: "contract_end_date",
      message: "กรุณาระบุวันสิ้นสุดสัญญา",
    });
  } else if (workStart && !isISODateBefore(workStart, contractEnd)) {
    issues.push({
      id: "contract_end_after_start",
      message: "วันสิ้นสุดสัญญาต้องอยู่หลังวันเริ่มต้นสัญญา",
    });
  }

  const duration = computeStep9ContractDurationDays(workStart, contractEnd);
  if (workStart && contractEnd && duration == null) {
    issues.push({
      id: "contract_duration_days",
      message: "ไม่สามารถคำนวณระยะเวลาดำเนินการทั้งหมดได้ — ตรวจสอบวันเริ่มต้นและวันสิ้นสุดสัญญา",
    });
  }

  const installments = schedule.total_installment_count;
  if (installments == null || !Number.isFinite(installments) || installments <= 0) {
    issues.push({
      id: "total_installment_count",
      message: "กรุณาระบุจำนวนงวดงานทั้งหมด (ต้องมากกว่า 0)",
    });
  }

  if (!hasStep9Hs1Doc(opts.stepDocs ?? [])) {
    issues.push({
      id: "hs1_doc",
      message: "กรุณาแนบประกาศสาระสำคัญของสัญญา (แบบ หส.1) (PDF)",
    });
  }

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
  opts: Parameters<typeof getStep9ComplianceIssues>[1],
): boolean {
  return getStep9ComplianceIssues(schedule, opts).length === 0;
}

export type Step10ComplianceIssue = { id: string; message: string };

/** ความพร้อมขั้นตอนที่ 10 — ฟิลด์รายงวด + เอกสารบังคับ (ไม่รวม Checklist เก่า) */
export function countStep10FormRequiredProgress(
  inspectionRows: Step10InspectionRow[],
  opts: {
    projectType?: Step10ProjectType;
    stepDocs?: Array<{ document_type: string }>;
    totalInstallmentCount: number;
  },
): { done: number; total: number } {
  const projectType: Step10ProjectType =
    opts.projectType === "construction" ? "construction" : "general";
  const uploadedTypes = (opts.stepDocs ?? []).map((d) => d.document_type);
  const expectedCount = Math.max(0, Math.floor(opts.totalInstallmentCount));
  const fieldsPerRow = projectType === "construction" ? 9 : 6;
  const total = expectedCount * fieldsPerRow;
  let done = 0;

  for (const row of inspectionRows) {
    if (row.planned_completion_date?.trim()) done++;
    if (row.delivery_letter_no?.trim()) done++;
    if (row.delivery_date?.trim()) done++;
    if (row.inspection_date?.trim()) done++;
    if (normalizeStep10InspectionResult(row.inspection_result) === "passed") done++;
    if (step10RowHasRequiredDocs(row.installment_no, uploadedTypes, projectType)) {
      done++;
    }
    if (projectType === "construction") {
      if (row.supervisor_name?.trim()) done++;
      if (row.supervisor_report_date?.trim()) done++;
      if (
        uploadedTypes.some(
          (t) =>
            t.includes(`งวดที่ ${row.installment_no}`) &&
            (t.includes("รายงานผลการปฏิบัติงานของผู้ควบคุมงาน") ||
              t.includes("รายงานประจำวัน")),
        )
      ) {
        done++;
      }
    }
  }

  return { done, total };
}

export function getStep10ComplianceIssues(
  inspectionRows: Step10InspectionRow[],
  _manualChecklist: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    stepDocs?: Array<{ document_type: string }>;
    totalInstallmentCount: number;
    projectType?: Step10ProjectType;
    contractStartDate?: string | null;
    timelineCtx?: TimelineValidationContext;
  },
  _autoStates?: Record<string, boolean>,
): Step10ComplianceIssue[] {
  const issues: Step10ComplianceIssue[] = [];
  const uploadedTypes = (opts.stepDocs ?? []).map((d) => d.document_type);
  const expectedCount = Math.max(0, Math.floor(opts.totalInstallmentCount));
  const projectType: Step10ProjectType =
    opts.projectType === "construction" ? "construction" : "general";
  const contractStart = opts.contractStartDate?.trim() ?? "";

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

  inspectionRows.forEach((row) => {
    const n = row.installment_no;
    if (!row.planned_completion_date?.trim()) {
      issues.push({
        id: `installment-${n}-planned_date`,
        message: `งวดที่ ${n}: กรุณาระบุวันครบกำหนดส่งมอบประจำงวดตามสัญญา`,
      });
    }
    if (!row.delivery_letter_no?.trim()) {
      issues.push({
        id: `installment-${n}-delivery_letter_no`,
        message: `งวดที่ ${n}: กรุณาระบุเลขที่หนังสือส่งมอบงาน`,
      });
    }
    if (!row.delivery_date?.trim()) {
      issues.push({
        id: `installment-${n}-delivery_date`,
        message: `งวดที่ ${n}: กรุณาระบุวันที่คู่สัญญาส่งมอบงานจริง`,
      });
    } else if (
      contractStart &&
      isStep10DeliveryBeforeContractStart(contractStart, row.delivery_date)
    ) {
      issues.push({
        id: `installment-${n}-delivery_before_contract`,
        message: `งวดที่ ${n}: วันที่ส่งมอบงานจริงต้องไม่ก่อนวันเริ่มต้นสัญญา (${formatThaiDateSlash(contractStart)})`,
      });
    }
    if (!row.inspection_date?.trim()) {
      issues.push({
        id: `installment-${n}-inspection_date`,
        message: `งวดที่ ${n}: กรุณาระบุวันที่คณะกรรมการตรวจรับจริง`,
      });
    }
    if (isStep10InspectionBeforeDelivery(row.delivery_date, row.inspection_date)) {
      issues.push({
        id: `installment-${n}-inspection_before_delivery`,
        message: `งวดที่ ${n}: วันตรวจรับต้องไม่ก่อนวันที่คู่สัญญาส่งมอบงานจริง`,
      });
    }
    const inspectionResult = normalizeStep10InspectionResult(row.inspection_result);
    if (!inspectionResult) {
      issues.push({
        id: `installment-${n}-inspection_result`,
        message: `งวดที่ ${n}: กรุณาเลือกผลการตรวจรับ`,
      });
    } else if (inspectionResult !== "passed") {
      issues.push({
        id: `installment-${n}-inspection_not_passed`,
        message: `งวดที่ ${n}: ต้องผ่านการตรวจรับถูกต้องครบถ้วนก่อนปิดโครงการ`,
      });
    }
    if (row.penalty_rate_pct == null || !Number.isFinite(row.penalty_rate_pct)) {
      issues.push({
        id: `installment-${n}-penalty_rate`,
        message: `งวดที่ ${n}: กรุณาระบุอัตราค่าปรับต่อวัน (ร้อยละ)`,
      });
    }
    if (projectType === "construction") {
      if (!row.supervisor_name?.trim()) {
        issues.push({
          id: `installment-${n}-supervisor_name`,
          message: `งวดที่ ${n}: กรุณาระบุชื่อ-นามสกุลผู้ควบคุมงานก่อสร้าง`,
        });
      }
      if (!row.supervisor_report_date?.trim()) {
        issues.push({
          id: `installment-${n}-supervisor_report_date`,
          message: `งวดที่ ${n}: กรุณาระบุวันที่ผู้ควบคุมงานรายงานผลสำเร็จ`,
        });
      }
      if (
        isStep10InspectionBeforeSupervisorReport(
          row.supervisor_report_date,
          row.inspection_date,
        )
      ) {
        issues.push({
          id: `installment-${n}-inspection_before_supervisor`,
          message: `งวดที่ ${n}: วันตรวจรับต้องไม่ก่อนวันที่ผู้ควบคุมงานรายงานผลสำเร็จ`,
        });
      }
    }
    if (!step10RowHasRequiredDocs(n, uploadedTypes, projectType)) {
      const docHint =
        projectType === "construction"
          ? "หนังสือส่งมอบงาน, ใบตรวจรับพัสดุ และรายงานผู้ควบคุมงาน"
          : "หนังสือส่งมอบงานและใบตรวจรับพัสดุ";
      issues.push({
        id: `installment-${n}-docs`,
        message: `งวดที่ ${n}: กรุณาแนบหลักฐานบังคับครบ (${docHint})`,
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

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 6 จาก note — ไม่อ่านคอลัมน์ projects.appeal_report_approval_date */
export function loadStep6FormFromNote(note: string | null): Step6FormData {
  const { form } = parseStepNote(note);
  const f = form as Step6FormData;
  const rawAppeal = f.appeal ?? f.step6_notes ?? {};
  const c = f.checklist ?? {};
  return {
    checklist: {
      appeal_period_passed_no_objection: !!c.appeal_period_passed_no_objection,
      appeal_agency_report_done: !!c.appeal_agency_report_done,
      appeal_sent_to_cgd: !!c.appeal_sent_to_cgd,
    },
    appeal: normalizeStep6AppealState(rawAppeal),
  };
}

/** รวมข้อมูลอุทธรณ์จาก note (หลัก) + appeal_status จาก projects (สำหรับ dashboard เท่านั้น) */
export function mergeStep6AppealFromSources(
  note: string | null,
  project?: { appeal_status?: string | null } | null,
): Step6AppealState {
  const fromNote = loadStep6FormFromNote(note).appeal ?? { ...EMPTY_STEP6_APPEAL };
  if (step6AppealHasData(fromNote)) return fromNote;
  const legacyStatus =
    project?.appeal_status === "none" || project?.appeal_status === "pending"
      ? project.appeal_status
      : "";
  return { ...fromNote, appeal_status: legacyStatus as StepAppealStatus };
}

/** โหลดข้อมูลฟอร์มขั้นตอนที่ 5 จาก note */
export function loadStep5FormFromNote(note: string | null): Step5FormData {
  const { form } = parseStepNote(note);
  const f = form as Step5FormData;
  const c = f.checklist ?? {};
  return {
    checklist: {
      price_comparison_uploaded: !!c.price_comparison_uploaded,
      evaluation_report_uploaded: !!c.evaluation_report_uploaded,
      egp_bid_summary_uploaded: !!c.egp_bid_summary_uploaded,
      blacklist_checked: !!c.blacklist_checked,
      conflict_of_interest_checked: !!c.conflict_of_interest_checked,
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
  const rawBid = f.bidResult ?? {};
  const fromNotes = f.step4_notes;
  const bidResult = normalizeStep4BidResult(
    stripAppealFieldsFromBidResult({
      ...rawBid,
      evaluation_committee_members:
        rawBid.evaluation_committee_members ??
        fromNotes?.evaluation_committee_members,
      inspection_committee_members:
        rawBid.inspection_committee_members ??
        fromNotes?.inspection_committee_members,
      evaluation_report_letter_no:
        rawBid.evaluation_report_letter_no ?? fromNotes?.evaluation_report_letter_no,
      evaluation_report_approval_date:
        rawBid.evaluation_report_approval_date ??
        fromNotes?.evaluation_report_approval_date,
    }),
  );
  return {
    checklist: {
      procurement_report_uploaded: !!c.procurement_report_uploaded,
      committee_order_uploaded: !!c.committee_order_uploaded,
      supervisor_order_uploaded: !!c.supervisor_order_uploaded,
    },
    bidResult,
    step4_notes: buildStep4NotesPayload(bidResult),
  };
}

export function buildStep4NotesPayload(bidResult: Step4BidResult): Step4NotesPayload {
  const normalized = normalizeStep4BidResult(bidResult);
  return {
    evaluation_committee_members: normalized.evaluation_committee_members ?? [],
    inspection_committee_members: normalized.inspection_committee_members ?? [],
    evaluation_report_letter_no: normalized.evaluation_report_letter_no?.trim() ?? "",
    evaluation_report_approval_date:
      normalized.evaluation_report_approval_date?.trim() ?? "",
  };
}

function stripAppealFieldsFromBidResult(bidResult?: Step4BidResult): Step4BidResult {
  const raw = bidResult ?? {};
  return {
    ...EMPTY_STEP4_BID_RESULT,
    procurement_request_letter_no: raw.procurement_request_letter_no ?? "",
    procurement_request_approval_date: raw.procurement_request_approval_date ?? "",
    bid_submission_workdays: raw.bid_submission_workdays ?? null,
    committee_review_workdays: raw.committee_review_workdays ?? null,
    evaluation_committee_members: normalizeStep4CommitteeMembers(
      raw.evaluation_committee_members,
      STEP4_MIN_COMMITTEE_MEMBERS,
      { allowMemberSecretary: true },
    ),
    inspection_committee_members: normalizeStep4CommitteeMembers(
      raw.inspection_committee_members,
      STEP4_MIN_COMMITTEE_MEMBERS,
      { allowMemberSecretary: false },
    ),
    evaluation_committee_text: raw.evaluation_committee_text ?? "",
    inspection_committee_text: raw.inspection_committee_text ?? "",
    winner_selection_reason_summary: raw.winner_selection_reason_summary ?? "",
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
    bidders: normalizeStep4Bidders(raw.bidders),
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
    winner_result_notification_date:
      announcement.winner_result_notification_date?.trim() || null,
  };
}

/** ซิงก์เฉพาะ appeal_status ไป projects — วันที่/เลขที่เก็บใน note JSON เท่านั้น */
export function buildProjectAppealStatusSync(appeal: Step6AppealState) {
  return {
    appeal_status:
      appeal.appeal_status === "none" || appeal.appeal_status === "pending"
        ? appeal.appeal_status
        : null,
  };
}

/** @deprecated ใช้ buildProjectAppealStatusSync — ห้ามเขียน appeal_report_approval_date ลง projects */
export function buildProjectAppealFields(appeal: Step6AppealState) {
  return buildProjectAppealStatusSync(appeal);
}

/** @deprecated ใช้ mergeStep6AppealFromSources(note, project) */
export function mergeAppealFromProject(
  project: { appeal_status?: string | null } | null,
): Step6AppealState {
  return mergeStep6AppealFromSources(null, project);
}

/** รวมค่าจาก project columns เข้ากับ bidResult จาก note */
export function mergeStep4BidResultFromProject(
  bidResult: Step4BidResult,
  project: {
    procurement_request_letter_no?: string | null;
    procurement_request_approval_date?: string | null;
    committee_review_workdays?: number | null;
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
  if (!project) return normalizeStep4BidResult(bidResult);
  return normalizeStep4BidResult({
    ...bidResult,
    procurement_request_letter_no:
      bidResult.procurement_request_letter_no?.trim() ||
      project.procurement_request_letter_no ||
      "",
    procurement_request_approval_date:
      bidResult.procurement_request_approval_date?.trim() ||
      project.procurement_request_approval_date ||
      "",
    committee_review_workdays:
      bidResult.committee_review_workdays != null && bidResult.committee_review_workdays > 0
        ? bidResult.committee_review_workdays
        : project.committee_review_workdays ?? null,
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
  });
}

export function serializeStepNote(userNote: string, form: StepFormData): string {
  const clean = stripStepFormPayload(userNote);
  if (!formHasPersistedData(form)) return clean;
  const payload = JSON.stringify(form);
  return clean ? `${clean}\n${FORM_MARKER}${payload}` : `${FORM_MARKER}${payload}`;
}
