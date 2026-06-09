/**
 * Form Design Standard — ProcureTrack
 * กฎเหล็ก: รายการ Manual-Check ที่เกี่ยวกับเอกสารทางกายภาพหรือระบบภายนอก
 * ต้องมีช่อง Upload/Input เป็นหลักฐานรองรับ — ห้ามติ๊กลอยโดยไม่มีหลักฐาน
 */
import type { Step4BidResult } from "@/lib/step-form";
import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  isStep4CommitteeReportDocType,
  isStep5EgpWinnerDocType,
  isStep5PhysicalBoardDocType,
} from "@/lib/step-doc-types";

export const FORM_AUDIT_TRAIL_STANDARD = {
  title: "มาตรฐานกลุ่มเอกสารและบันทึกเวลาภายใน (Audit Trail)",
  rule:
    "รายการ Manual-Check ที่เป็นการตรวจสอบเอกสารทางกายภาพ หรือข้อมูลจากระบบภายนอก " +
    "(เช่น e-GP, Blacklist, บันทึกข้อความ) ต้องมีช่องอัปโหลดไฟล์หรือช่องกรอกข้อมูลเป็นหลักฐาน " +
    "ในกลุ่ม Audit Trail ของขั้นตอนนั้น — ห้ามติ๊กยืนยันลอยๆ โดยไม่มีหลักฐาน",
  auditTrailGroupTitle: "กลุ่มเอกสารและบันทึกเวลาภายใน (Audit Trail หลักฐานยันหน้างาน)",
} as const;

export type EvidenceBinding =
  | { kind: "document"; documentTypes: readonly string[]; message: string }
  | { kind: "fields"; fieldKeys: readonly string[]; message: string }
  | { kind: "all"; bindings: EvidenceBinding[]; message: string };

export type ChecklistEvidenceRule = {
  stepNumber: number;
  checklistKey: string;
  checklistIndex: number;
  binding: EvidenceBinding;
  /** always = บังคับก่อนปิดขั้น, when_checked = บังคับเมื่อติ๊ก Manual */
  enforce: "always" | "when_checked";
};

export type EvidenceValidationContext = {
  uploadedDocTypes: string[];
  bidResult?: Step4BidResult;
  /** ค่าฟิลด์ทั่วไปสำหรับ binding แบบ fields */
  fieldValues?: Record<string, string | number | null | undefined>;
};

export type EvidenceComplianceIssue = { id: string; message: string };

/** ผูก Checklist ↔ หลักฐาน — ขั้น 1–10 */
export const CHECKLIST_EVIDENCE_RULES: ChecklistEvidenceRule[] = [
  // Step 1
  {
    stepNumber: 1,
    checklistKey: "annual_plan_published",
    checklistIndex: 2,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ"],
      message: "ข้อที่ 2: กรุณาแนบเอกสารอนุมัติโครงการ/จัดสรรงบประมาณใน Document Hub",
    },
  },
  {
    stepNumber: 1,
    checklistKey: "project_name_and_type_verified",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "fields",
      fieldKeys: ["project_name", "method"],
      message: "ข้อที่ 3: กรุณาระบุชื่อโครงการและวิธีการจัดซื้อจัดจ้างในฟอร์ม",
    },
  },
  // Step 2
  {
    stepNumber: 2,
    checklistKey: "committee_qualifications_verified",
    checklistIndex: 2,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["หนังสือแสดงความบริสุทธิ์ใจของกรรมการ"],
      message: "ข้อที่ 2: กรุณาแนบหนังสือแสดงความบริสุทธิ์ใจของกรรมการใน Document Hub",
    },
  },
  // Step 3
  {
    stepNumber: 3,
    checklistKey: "draft_announcement_standard_compliant",
    checklistIndex: 1,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: [STEP3_DOC.DRAFT_ANNOUNCEMENT_BID],
      message: "ข้อที่ 1: กรุณาแนบร่างประกาศและร่างเอกสารประกวดราคา",
    },
  },
  {
    stepNumber: 3,
    checklistKey: "spec_no_lock_in_verified",
    checklistIndex: 2,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: [STEP3_DOC.DRAFT_TOR_SPEC],
      message: "ข้อที่ 2: กรุณาแนบร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
    },
  },
  {
    stepNumber: 3,
    checklistKey: "internal_memo_director_approval",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "all",
      bindings: [
        {
          kind: "fields",
          fieldKeys: ["approval_letter_no", "approval_letter_date"],
          message: "",
        },
        {
          kind: "document",
          documentTypes: [STEP3_DOC.MEMO_APPROVAL],
          message: "",
        },
      ],
      message: "ข้อที่ 3: กรุณาระบุเลขที่/วันที่บันทึกข้อความและแนบ PDF บันทึกข้อความเห็นชอบ",
    },
  },
  // Step 4 — แม่แบบ Audit Trail
  {
    stepNumber: 4,
    checklistKey: "egp_summary_downloaded",
    checklistIndex: 1,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.EGP_BID_SUMMARY],
      message:
        "หลักฐานข้อที่ 1: กรุณาแนบไฟล์รายงานสรุปผลการเสนอราคาจากระบบ e-GP (PDF)",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "blacklist_checked",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.BLACKLIST_EVIDENCE],
      message: "ข้อที่ 2: กรุณาแนบหลักฐานตรวจ Blacklist (แคปหน้าจอ e-GP ได้)",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "conflict_of_interest_checked",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "all",
      bindings: [
        { kind: "fields", fieldKeys: ["winning_bidder_name"], message: "" },
        { kind: "document", documentTypes: [STEP4_DOC.CONFLICT_EVIDENCE], message: "" },
      ],
      message:
        "ข้อที่ 3: กรุณาระบุชื่อผู้ชนะและแนบหลักฐานตรวจผลประโยชน์ร่วมกัน",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "technical_price_reviewed",
    checklistIndex: 4,
    enforce: "always",
    binding: {
      kind: "all",
      bindings: [
        {
          kind: "fields",
          fieldKeys: ["winning_bid_amount"],
          message: "",
        },
        {
          kind: "document",
          documentTypes: [STEP4_DOC.COMMITTEE_EVALUATION_REPORT],
          message: "",
        },
      ],
      message:
        "หลักฐานข้อที่ 4: กรุณาระบุราคาที่เสนอชนะและแนบรายงานผลการพิจารณาของคณะกรรมการ (PDF)",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "evaluation_report_submitted",
    checklistIndex: 5,
    enforce: "always",
    binding: {
      kind: "all",
      bindings: [
        {
          kind: "fields",
          fieldKeys: ["evaluation_report_letter_no", "evaluation_report_approval_date"],
          message: "",
        },
        {
          kind: "document",
          documentTypes: [STEP4_DOC.COMMITTEE_EVALUATION_REPORT],
          message: "",
        },
      ],
      message:
        "ข้อที่ 5: กรุณาระบุเลขที่หนังสือ/วันที่อนุมัติผลและแนบรายงานผลการพิจารณาของคณะกรรมการ (PDF)",
    },
  },
  // Step 5 — ประกาศผู้ชนะ (มาตรา 66)
  {
    stepNumber: 5,
    checklistKey: "winner_announcement_recorded",
    checklistIndex: 1,
    enforce: "always",
    binding: {
      kind: "fields",
      fieldKeys: ["winner_announcement_no", "winner_announcement_date"],
      message: "ข้อที่ 1: กรุณาระบุเลขที่และวันที่ลงนามในประกาศผู้ชนะ",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "egp_winner_announced",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP5_DOC.EGP_WINNER_ANNOUNCEMENT, "ประกาศผู้ชนะการเสนอราคา (e-GP)"],
      message:
        "ข้อที่ 2: กรุณาแนบหลักฐานประกาศผลผู้ชนะในระบบ e-GP (PDF หรือแคปหน้าจอ)",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "physical_board_posted",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT],
      message:
        "ข้อที่ 3: กรุณาแนบภาพถ่ายบอร์ดประชาสัมพันธ์ปิดประกาศผลผู้ชนะ ณ ที่ทำการหน่วยงาน",
    },
  },
  {
    stepNumber: 6,
    checklistKey: "appeal_documents_verified",
    checklistIndex: 4,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["บันทึกรับเรื่องอุทธรณ์ (ถ้ามี)", "มติ/คำวินิจฉัยคณะกรรมการอุทธรณ์"],
      message: "ข้อที่ 4: กรุณาแนบเอกสารอุทธรณ์/มติคณะกรรมการ (ถ้ามี) ใน Document Hub",
    },
  },
  {
    stepNumber: 7,
    checklistKey: "draft_contract_reviewed",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["ร่างสัญญาจ้างก่อสร้าง"],
      message: "ข้อที่ 3: กรุณาแนบร่างสัญญาจ้างก่อสร้างใน Document Hub",
    },
  },
  {
    stepNumber: 8,
    checklistKey: "contract_guarantee_verified",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["หลักประกันสัญญา (LG/แคชเชียร์เช็ค)"],
      message: "ข้อที่ 3: กรุณาแนบหลักประกันสัญญาใน Document Hub",
    },
  },
  {
    stepNumber: 8,
    checklistKey: "contract_signed_stamped",
    checklistIndex: 4,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["สัญญาจ้างก่อสร้าง (ต้นฉบับ ติดอากรแสตมป์)"],
      message: "ข้อที่ 4: กรุณาแนบสัญญาจ้างก่อสร้างต้นฉบับใน Document Hub",
    },
  },
  {
    stepNumber: 9,
    checklistKey: "contract_summary_verified",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["สรุปสาระสำคัญสัญญา (วงเงิน/ระยะเวลา/งวดงาน)"],
      message: "ข้อที่ 3: กรุณาแนบสรุปสาระสำคัญสัญญาใน Document Hub",
    },
  },
  {
    stepNumber: 9,
    checklistKey: "construction_plan_reviewed",
    checklistIndex: 4,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["แผนปฏิบัติการก่อสร้าง (Gantt)"],
      message: "ข้อที่ 4: กรุณาแนบแผนปฏิบัติการก่อสร้าง (Gantt) ใน Document Hub",
    },
  },
  {
    stepNumber: 10,
    checklistKey: "progress_reports_verified",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["รายงานความคืบหน้ารายสัปดาห์", "รูปถ่ายหน้างานประกอบรายงาน"],
      message: "ข้อที่ 3: กรุณาแนบรายงานความคืบหน้าและรูปถ่ายหน้างานใน Document Hub",
    },
  },
  {
    stepNumber: 10,
    checklistKey: "delivery_inspection_complete",
    checklistIndex: 4,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: ["ใบแจ้งส่งมอบงาน/ใบตรวจรับ (บก.11)"],
      message: "ข้อที่ 4: กรุณาแนบใบตรวจรับ (บก.11) ใน Document Hub",
    },
  },
];

export function getChecklistEvidenceRules(stepNumber: number): ChecklistEvidenceRule[] {
  return CHECKLIST_EVIDENCE_RULES.filter((r) => r.stepNumber === stepNumber);
}

function docUploaded(uploaded: string[], types: readonly string[]): boolean {
  return types.some((t) => {
    if (t === STEP4_DOC.COMMITTEE_EVALUATION_REPORT) {
      return uploaded.some((u) => isStep4CommitteeReportDocType(u));
    }
    return uploaded.includes(t);
  });
}

function fieldFilled(
  values: Record<string, string | number | null | undefined>,
  key: string,
): boolean {
  const v = values[key];
  if (v == null) return false;
  if (typeof v === "number") return Number.isFinite(v) && v >= 0;
  return String(v).trim().length > 0;
}

function bindingSatisfied(
  binding: EvidenceBinding,
  ctx: EvidenceValidationContext,
): boolean {
  const values = ctx.fieldValues ?? {};
  const uploaded = ctx.uploadedDocTypes;

  if (binding.kind === "document") {
    return docUploaded(uploaded, binding.documentTypes);
  }
  if (binding.kind === "fields") {
    return binding.fieldKeys.every((k) => fieldFilled(values, k));
  }
  return binding.bindings.every((b) => bindingSatisfied(b, ctx));
}

export function buildStep4EvidenceFieldValues(bidResult: Step4BidResult): Record<string, string | number | null | undefined> {
  return {
    winning_bidder_name: bidResult.winning_bidder_name,
    egp_bid_submission_count: bidResult.egp_bid_submission_count,
    winning_bid_amount: bidResult.winning_bid_amount,
    evaluation_report_letter_no: bidResult.evaluation_report_letter_no,
    evaluation_report_approval_date: bidResult.evaluation_report_approval_date,
  };
}

export function hasStep4EgpBidSummaryDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.includes(STEP4_DOC.EGP_BID_SUMMARY);
}

export function hasStep4BlacklistEvidenceDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.includes(STEP4_DOC.BLACKLIST_EVIDENCE);
}

export function hasStep4ConflictEvidenceDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.includes(STEP4_DOC.CONFLICT_EVIDENCE);
}

export function hasStep4CommitteeReportDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep4CommitteeReportDocType(t));
}

export function hasStep5EgpWinnerDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep5EgpWinnerDocType(t));
}

export function hasStep5PhysicalBoardDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep5PhysicalBoardDocType(t));
}

/** ตรวจเอกสารบังคับขั้น 5 — รองรับชื่อเอกสารเก่าใน DB */
export function isStep5RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
): boolean {
  if (
    requiredName === STEP5_DOC.EGP_WINNER_ANNOUNCEMENT ||
    requiredName === "ประกาศผู้ชนะการเสนอราคา (e-GP)"
  ) {
    return hasStep5EgpWinnerDoc(uploadedTypes);
  }
  if (requiredName === STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT) {
    return hasStep5PhysicalBoardDoc(uploadedTypes);
  }
  return uploadedTypes.includes(requiredName);
}

/** ตรวจหลักฐานรองรับ Manual-Check / Audit Trail */
export function getChecklistEvidenceIssues(
  stepNumber: number,
  manualChecklist: Record<string, boolean>,
  ctx: EvidenceValidationContext,
): EvidenceComplianceIssue[] {
  const issues: EvidenceComplianceIssue[] = [];
  const seen = new Set<string>();

  for (const rule of getChecklistEvidenceRules(stepNumber)) {
    const shouldEnforce =
      rule.enforce === "always" || !!manualChecklist[rule.checklistKey];
    if (!shouldEnforce) continue;
    if (bindingSatisfied(rule.binding, ctx)) continue;

    const id = `evidence-${rule.checklistKey}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const message =
      rule.binding.kind === "all"
        ? rule.binding.message
        : rule.binding.message;

    issues.push({ id, message });
  }

  return issues;
}

/** เอกสารบังคับขั้นตอนที่ 4 ตามมาตรฐาน Audit Trail */
export function getStep4RequiredAuditDocuments(): { name: string; required: boolean }[] {
  return [
    { name: STEP4_DOC.EGP_BID_SUMMARY, required: true },
    { name: STEP4_DOC.BLACKLIST_EVIDENCE, required: true },
    { name: STEP4_DOC.CONFLICT_EVIDENCE, required: true },
    { name: STEP4_DOC.COMMITTEE_EVALUATION_REPORT, required: true },
  ];
}

/** ตรวจเอกสารบังคับขั้น 4 — รองรับไฟล์เก่า (PDF รายงานผลการพิจารณา) */
export function isStep4RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
): boolean {
  if (requiredName === STEP4_DOC.EGP_BID_SUMMARY) {
    return hasStep4EgpBidSummaryDoc(uploadedTypes);
  }
  if (requiredName === STEP4_DOC.BLACKLIST_EVIDENCE) {
    return hasStep4BlacklistEvidenceDoc(uploadedTypes);
  }
  if (requiredName === STEP4_DOC.CONFLICT_EVIDENCE) {
    return hasStep4ConflictEvidenceDoc(uploadedTypes);
  }
  if (requiredName === STEP4_DOC.COMMITTEE_EVALUATION_REPORT) {
    return hasStep4CommitteeReportDoc(uploadedTypes);
  }
  return uploadedTypes.includes(requiredName);
}
