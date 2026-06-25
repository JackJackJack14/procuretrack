/**
 * Form Design Standard — ProcureTrack
 * กฎเหล็ก: รายการ Manual-Check ที่เกี่ยวกับเอกสารทางกายภาพหรือระบบภายนอก
 * ต้องมีช่อง Upload/Input เป็นหลักฐานรองรับ — ห้ามติ๊กลอยโดยไม่มีหลักฐาน
 */
import {
  STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE,
  hasStep1PlanPublicationDoc,
} from "@/lib/checklist-inline-evidence";
import type { Step4BidResult } from "@/lib/step-form";
import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  STEP6_DOC,
  STEP7_DOC,
  STEP8_DOC,
  STEP8_DOC_LEGACY,
  hasStep2MarketQuotesDoc,
  hasStep2MedianPriceTableDoc,
  hasStep2ReferencePriceDoc,
  isStep4CommitteeReportDocType,
  isStep5EgpWinnerDocType,
  isStep5PhysicalBoardDocType,
  isStep6AgencyOpinionCgdDocType,
  isStep6AgencyReportDocType,
  isStep6AppealEvidenceDocType,
  isStep6BidderAppealLetterDocType,
  isStep6CgdReportDocType,
  isStep6CommitteeDecisionDocType,
  isStep6NoAppealEgpDocType,
} from "@/lib/step-doc-types";
import { isEgpConstructionProjectType } from "@/lib/egp-project-type";

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
  // Step 2
  {
    stepNumber: 2,
    checklistKey: "integrity_letter_signed",
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
  // Step 4 — ก่อนเปิดซอง
  {
    stepNumber: 4,
    checklistKey: "procurement_report_uploaded",
    checklistIndex: 1,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.SIGNED_PROCUREMENT_REQUEST],
      message: "กรุณาแนบรายงานขอซื้อขอจ้างที่ลงนามแล้ว (PDF)",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "committee_order_uploaded",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP2_DOC.EVALUATION_INSPECTION_ORDER],
      message: "กรุณาแนบคำสั่งแต่งตั้งคณะกรรมการ (PDF)",
    },
  },
  {
    stepNumber: 4,
    checklistKey: "supervisor_order_uploaded",
    checklistIndex: 3,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: [STEP2_DOC.SITE_SUPERVISOR_ORDER],
      message: "กรุณาแนบคำสั่งแต่งตั้งผู้ควบคุมงาน (งานก่อสร้าง)",
    },
  },
  // Step 5 — หลังเปิดซอง + ประกาศผู้ชนะ
  {
    stepNumber: 5,
    checklistKey: "price_comparison_uploaded",
    checklistIndex: 1,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.PRICE_COMPARISON_TABLE],
      message: "กรุณาแนบตารางเปรียบเทียบราคา (PDF)",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "evaluation_report_uploaded",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.COMMITTEE_EVALUATION_REPORT],
      message: "กรุณาแนบรายงานผลการพิจารณาของคณะกรรมการ (PDF)",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "egp_bid_summary_uploaded",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.EGP_BID_SUMMARY],
      message: "กรุณาแนบตารางสรุปผลการเสนอราคาจาก e-GP (PDF)",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "blacklist_checked",
    checklistIndex: 4,
    enforce: "when_checked",
    binding: {
      kind: "document",
      documentTypes: [STEP4_DOC.BLACKLIST_EVIDENCE],
      message: "กรุณาแนบหลักฐานตรวจ Blacklist",
    },
  },
  {
    stepNumber: 5,
    checklistKey: "conflict_of_interest_checked",
    checklistIndex: 5,
    enforce: "when_checked",
    binding: {
      kind: "all",
      bindings: [
        { kind: "fields", fieldKeys: ["winning_bidder_name"], message: "" },
        { kind: "document", documentTypes: [STEP4_DOC.CONFLICT_EVIDENCE], message: "" },
      ],
      message: "กรุณาระบุชื่อผู้ชนะและแนบหลักฐานตรวจผลประโยชน์ร่วมกัน",
    },
  },
  // Step 5 — ประกาศผู้ชนะ (มาตรา 66)
  {
    stepNumber: 5,
    checklistKey: "winner_announcement_recorded",
    checklistIndex: 6,
    enforce: "always",
    binding: {
      kind: "fields",
      fieldKeys: ["winner_announcement_no", "winner_announcement_date", "winner_result_notification_date"],
      message: "ข้อที่ 1: กรุณาระบุเลขที่ วันที่ประกาศผล และวันที่แจ้งผลให้ผู้เสนอราคาทราบ",
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
    checklistKey: "appeal_period_passed_no_objection",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [
        STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT,
        STEP6_DOC.APPEAL_RESULT_EVIDENCE,
      ],
      message:
        "ข้อที่ 2: กรุณาแนบภาพแคปหน้าจอ e-GP ยืนยันไม่มีผู้ยื่นอุทธรณ์",
    },
  },
  {
    stepNumber: 6,
    checklistKey: "appeal_agency_report_done",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP6_DOC.AGENCY_APPEAL_REPORT],
      message:
        "ข้อที่ 2: กรุณาแนบหนังสือรายงานผลการพิจารณาอุทธรณ์ของหน่วยงาน (PDF)",
    },
  },
  {
    stepNumber: 6,
    checklistKey: "appeal_sent_to_cgd",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP6_DOC.CGD_APPEAL_REPORT],
      message:
        "ข้อที่ 3: กรุณาแนบหลักฐานส่งรายงานผลอุทธรณ์ให้กรมบัญชีกลาง (PDF)",
    },
  },
  {
    stepNumber: 7,
    checklistKey: "contract_notice_letter_uploaded",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP7_DOC.CONTRACT_NOTICE_LETTER],
      message: "ข้อที่ 2: กรุณาแนบหนังสือแจ้งให้มาลงนามในสัญญาอย่างเป็นทางการ (PDF)",
    },
  },
  {
    stepNumber: 7,
    checklistKey: "contract_notice_delivery_proof",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP7_DOC.CONTRACT_NOTICE_DELIVERY_PROOF],
      message: "ข้อที่ 3: กรุณาแนบหลักฐานการนำส่งหรือการตอบรับหนังสือแจ้ง (.pdf, .png, .jpg)",
    },
  },
  {
    stepNumber: 8,
    checklistKey: "contract_guarantee_verified",
    checklistIndex: 2,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP8_DOC.GUARANTEE_VERIFICATION, STEP8_DOC_LEGACY.GUARANTEE],
      message:
        "ข้อที่ 2: กรุณาแนบหลักฐานยืนยันหลักประกันสัญญา (.pdf, .png, .jpg)",
    },
  },
  {
    stepNumber: 8,
    checklistKey: "contract_signed_stamped",
    checklistIndex: 3,
    enforce: "always",
    binding: {
      kind: "document",
      documentTypes: [STEP8_DOC.SIGNED_CONTRACT, STEP8_DOC_LEGACY.SIGNED],
      message: "ข้อที่ 3: กรุณาแนบสัญญาลงนามครบและติดอากรแสตมป์ (PDF)",
    },
  },
  {
    stepNumber: 9,
    checklistKey: "contract_summary_verified",
    checklistIndex: 2,
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
    checklistIndex: 3,
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

export function hasStep4SignedProcurementRequestDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.includes(STEP4_DOC.SIGNED_PROCUREMENT_REQUEST);
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

export function hasStep4PriceComparisonDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.includes(STEP4_DOC.PRICE_COMPARISON_TABLE);
}

/** รวมประเภทเอกสารหลังเปิดซองจากขั้นตอนที่ 4 (เก่า) หรือขั้นตอนที่ 5 */
export function collectBidEvaluationUploadedDocTypes(
  docs: Array<{ step_number: number | null; document_type: string }>,
): string[] {
  return docs
    .filter((d) => d.step_number === 4 || d.step_number === 5)
    .map((d) => d.document_type);
}

export function hasStep5EgpWinnerDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep5EgpWinnerDocType(t));
}

export function hasStep5PhysicalBoardDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep5PhysicalBoardDocType(t));
}

export function hasStep6NoAppealEgpDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6NoAppealEgpDocType(t));
}

export function hasStep6BidderAppealLetterDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6BidderAppealLetterDocType(t));
}

export function hasStep6AgencyOpinionCgdDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6AgencyOpinionCgdDocType(t));
}

export function hasStep6CommitteeDecisionDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6CommitteeDecisionDocType(t));
}

export function hasStep6AgencyReportDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6AgencyReportDocType(t));
}

export function hasStep6CgdReportDoc(uploadedDocTypes: string[]): boolean {
  return uploadedDocTypes.some((t) => isStep6CgdReportDocType(t));
}

/** @deprecated */
export function hasStep6AppealEvidenceDoc(uploadedDocTypes: string[]): boolean {
  return hasStep6NoAppealEgpDoc(uploadedDocTypes);
}

/** ตรวจเอกสารบังคับขั้น 1 — สอดคล้อง Smart Checklist (รองรับชื่อเอกสารเก่าใน DB) */
export function isStep1RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
): boolean {
  if (
    requiredName === STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE ||
    requiredName === "เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ"
  ) {
    return hasStep1PlanPublicationDoc(
      uploadedTypes.map((document_type) => ({ document_type })),
    );
  }
  return uploadedTypes.includes(requiredName);
}

/** ตรวจเอกสารบังคับขั้น 5 — รองรับชื่อเอกสารเก่าใน DB และไฟล์ที่อัปโหลดในขั้น 4 (โครงการเก่า) */
export function isStep5RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
  legacyStep4Types: string[] = [],
): boolean {
  const merged = [...new Set([...uploadedTypes, ...legacyStep4Types])];
  if (
    requiredName === STEP5_DOC.EGP_WINNER_ANNOUNCEMENT ||
    requiredName === "ประกาศผู้ชนะการเสนอราคา (e-GP)"
  ) {
    return hasStep5EgpWinnerDoc(merged);
  }
  if (requiredName === STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT) {
    return hasStep5PhysicalBoardDoc(merged);
  }
  if (requiredName === STEP4_DOC.PRICE_COMPARISON_TABLE) {
    return hasStep4PriceComparisonDoc(merged);
  }
  if (requiredName === STEP4_DOC.EGP_BID_SUMMARY) {
    return hasStep4EgpBidSummaryDoc(merged);
  }
  if (requiredName === STEP4_DOC.COMMITTEE_EVALUATION_REPORT) {
    return hasStep4CommitteeReportDoc(merged);
  }
  return merged.includes(requiredName);
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

/** เอกสารบังคับขั้นตอนที่ 4 — รายงานขอซื้อขอจ้างที่ลงนามแล้ว (ข้อ 22) */
export function getStep4RequiredAuditDocuments(): { name: string; required: boolean }[] {
  return [{ name: STEP4_DOC.SIGNED_PROCUREMENT_REQUEST, required: true }];
}

/** ตรวจเอกสารบังคับขั้น 4 */
export function isStep4RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
  _step2UploadedTypes?: string[],
): boolean {
  if (requiredName === STEP4_DOC.SIGNED_PROCUREMENT_REQUEST) {
    return hasStep4SignedProcurementRequestDoc(uploadedTypes);
  }
  if (requiredName === STEP2_DOC.EVALUATION_INSPECTION_ORDER) {
    return uploadedTypes.includes(STEP2_DOC.EVALUATION_INSPECTION_ORDER);
  }
  if (requiredName === STEP2_DOC.SITE_SUPERVISOR_ORDER) {
    return uploadedTypes.includes(STEP2_DOC.SITE_SUPERVISOR_ORDER);
  }
  return uploadedTypes.includes(requiredName);
}

export type Step4OptionalAuditTrailFileRef = {
  file_name: string;
  storage_path: string;
} | null;

/** บันทึกสถานะหลักฐาน Audit Trail เสริม (ไม่บังคับ) ลง Console */
export function logStep4OptionalAuditTrailDebug(
  docs: { step_number: number | null; document_type: string; file_name: string; storage_path: string }[],
  stepNumber: number,
  latestUpload?: { documentType: string; fileName: string; storagePath?: string },
): void {
  const stepDocs = docs.filter((d) => d.step_number === stepNumber);
  const resolveFile = (documentType: string): Step4OptionalAuditTrailFileRef => {
    if (latestUpload?.documentType === documentType) {
      return {
        file_name: latestUpload.fileName,
        storage_path: latestUpload.storagePath ?? "(pending refresh)",
      };
    }
    const row = stepDocs.find((d) => d.document_type === documentType);
    return row ? { file_name: row.file_name, storage_path: row.storage_path } : null;
  };
  console.log("🔍 [AUDIT TRAIL DEBUG] Optional Compliance Docs:", {
    blacklist: resolveFile(STEP4_DOC.BLACKLIST_EVIDENCE),
    conflict: resolveFile(STEP4_DOC.CONFLICT_EVIDENCE),
  });
}

/** ตรวจเอกสารบังคับขั้น 2 — รองรับใบเสนอราคาแยกรายซัพพลายเออร์ + งานจ้างก่อสร้าง */
export function isStep2RequiredDocSatisfied(
  requiredName: string,
  uploadedTypes: string[],
  projectType?: string | null,
): boolean {
  const stepDocs = uploadedTypes.map((document_type) => ({ document_type }));
  const isConstruction = isEgpConstructionProjectType(projectType);

  if (isConstruction) {
    if (requiredName === STEP2_DOC.MARKET_QUOTES) {
      return true;
    }
    if (requiredName === STEP2_DOC.BOQ) {
      return hasStep2ReferencePriceDoc(stepDocs);
    }
    if (
      requiredName === STEP2_DOC.MEDIAN_PRICE_BG06 ||
      requiredName === STEP2_DOC.MEDIAN_PRICE_BG01
    ) {
      return hasStep2MedianPriceTableDoc(stepDocs, projectType);
    }
    if (requiredName === STEP2_DOC.REFERENCE_PRICE_SUMMARY) {
      return hasStep2ReferencePriceDoc(stepDocs);
    }
  }

  if (requiredName === STEP2_DOC.MARKET_QUOTES) {
    return hasStep2MarketQuotesDoc(stepDocs);
  }
  return uploadedTypes.includes(requiredName);
}
