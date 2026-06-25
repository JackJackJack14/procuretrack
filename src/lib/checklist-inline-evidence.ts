/**
 * Global Form Design Standard — Inline Evidence บนแถว Smart Checklist
 * ตรวจข้อไหน แนบหลักฐานข้อนั้นในแถวเดียวกัน (Upload-Driven Reactive Check)
 */
import type { DocFilePolicyId } from "@/lib/doc-file-types";
import { isEgpConstructionProjectType } from "@/lib/egp-project-type";
import {
  STEP2_DOC,
  STEP3_DOC,
  STEP4_DOC,
  STEP5_DOC,
  STEP6_DOC,
  STEP7_DOC,
  STEP8_DOC,
  STEP8_DOC_LEGACY,
} from "@/lib/step-doc-types";

export type ChecklistInlineEvidence = {
  checklistKey: string;
  documentType: string;
  uploadLabel: string;
  filePolicyId: DocFilePolicyId;
  /** ซ่อน checkbox — ติ๊กอัตโนมัติเมื่ออัปโหลด/ลบไฟล์ */
  uploadDriven: boolean;
  /** ชื่อประเภทเอกสารเก่าใน DB — รองรับโปรเจกต์ก่อนอัปเกรด */
  legacyDocumentTypes?: string[];
};

/** เอกสารประกาศแผนจัดซื้อจัดจ้าง — ขั้นตอนที่ 1 */
export const STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE =
  "เอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP";

/** ชื่อประเภทเอกสารเก่าใน DB — รองรับโปรเจกต์ก่อนอัปเกรด */
export const STEP1_LEGACY_PLAN_DOC_TYPES = [
  "เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ",
] as const;

/** @deprecated ใช้ STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE */
export const STEP1_ANNUAL_PLAN_DOCUMENT_TYPE = STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE;

export function hasStep1PlanPublicationDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  const types = new Set<string>([
    STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE,
    ...STEP1_LEGACY_PLAN_DOC_TYPES,
  ]);
  return stepDocs?.some((d) => types.has(d.document_type)) ?? false;
}

const STEP1_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "annual_plan_published",
    documentType: STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE,
    uploadLabel: "แนบเอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP",
    filePolicyId: "egp_screenshot",
    uploadDriven: true,
    legacyDocumentTypes: [...STEP1_LEGACY_PLAN_DOC_TYPES],
  },
];

const STEP2_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "integrity_letter_signed",
    documentType: STEP2_DOC.INTEGRITY_LETTER,
    uploadLabel: "แนบหนังสือแสดงความบริสุทธิ์ใจกรรมการ",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "tor_median_committee_appointed",
    documentType: STEP2_DOC.APPOINTMENT_ORDER,
    uploadLabel: "แนบคำสั่งแต่งตั้ง (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "bg06_table_verified",
    documentType: STEP2_DOC.MEDIAN_PRICE_BG06,
    uploadLabel: "แนบตารางแสดงวงเงินราคากลาง (บก.06/บก.01)",
    filePolicyId: "bg06",
    uploadDriven: true,
    legacyDocumentTypes: [STEP2_DOC.MEDIAN_PRICE_BG01],
  },
];

const STEP3_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "egp_published_for_comment",
    documentType: STEP3_DOC.EGP_SCREENSHOT,
    uploadLabel: "แนบหลักฐานเผยแพร่ e-GP (แคปหน้าจอได้)",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
];

/** ขั้นตอนที่ 4 — ก่อนเปิดซองเท่านั้น */
const STEP4_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "procurement_report_uploaded",
    documentType: STEP4_DOC.SIGNED_PROCUREMENT_REQUEST,
    uploadLabel: "แนบรายงานขอซื้อขอจ้างที่ลงนามแล้ว (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "committee_order_uploaded",
    documentType: STEP2_DOC.EVALUATION_INSPECTION_ORDER,
    uploadLabel: "แนบคำสั่งแต่งตั้งคณะกรรมการ (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "supervisor_order_uploaded",
    documentType: STEP2_DOC.SITE_SUPERVISOR_ORDER,
    uploadLabel: "แนบคำสั่งแต่งตั้งผู้ควบคุมงาน (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP5_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "price_comparison_uploaded",
    documentType: STEP4_DOC.PRICE_COMPARISON_TABLE,
    uploadLabel: "แนบตารางเปรียบเทียบราคา (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "evaluation_report_uploaded",
    documentType: STEP4_DOC.COMMITTEE_EVALUATION_REPORT,
    uploadLabel: "แนบรายงานผลการพิจารณา (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "egp_bid_summary_uploaded",
    documentType: STEP4_DOC.EGP_BID_SUMMARY,
    uploadLabel: "แนบตารางสรุปผล e-GP (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "blacklist_checked",
    documentType: STEP4_DOC.BLACKLIST_EVIDENCE,
    uploadLabel: "แนบหลักฐานตรวจ Blacklist",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
  {
    checklistKey: "conflict_of_interest_checked",
    documentType: STEP4_DOC.CONFLICT_EVIDENCE,
    uploadLabel: "แนบหลักฐานตรวจผลประโยชน์ร่วมกัน",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
  {
    checklistKey: "egp_winner_announced",
    documentType: STEP5_DOC.EGP_WINNER_ANNOUNCEMENT,
    uploadLabel: "แนบใบประกาศหรือภาพแคปหน้าจอ e-GP",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
  {
    checklistKey: "physical_board_posted",
    documentType: STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT,
    uploadLabel: "แนบภาพถ่ายบอร์ดประชาสัมพันธ์หน่วยงาน",
    filePolicyId: "image_only",
    uploadDriven: true,
  },
];

const STEP6_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "appeal_period_passed_no_objection",
    documentType: STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT,
    uploadLabel: "แนบหลักฐาน (.pdf, .png, .jpg)",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
  {
    checklistKey: "appeal_agency_report_done",
    documentType: STEP6_DOC.AGENCY_APPEAL_REPORT,
    uploadLabel: "แนบหลักฐาน (.pdf)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "appeal_sent_to_cgd",
    documentType: STEP6_DOC.CGD_APPEAL_REPORT,
    uploadLabel: "แนบหลักฐาน (.pdf)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP7_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "contract_notice_letter_uploaded",
    documentType: STEP7_DOC.CONTRACT_NOTICE_LETTER,
    uploadLabel: "แนบหลักฐาน (.pdf)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "contract_notice_delivery_proof",
    documentType: STEP7_DOC.CONTRACT_NOTICE_DELIVERY_PROOF,
    uploadLabel: "แนบหลักฐาน (.pdf, .png, .jpg)",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
];

const STEP8_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "contract_guarantee_verified",
    documentType: STEP8_DOC.GUARANTEE_VERIFICATION,
    uploadLabel: "แนบหลักฐาน (.pdf, .png, .jpg)",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
    legacyDocumentTypes: [STEP8_DOC_LEGACY.GUARANTEE],
  },
  {
    checklistKey: "contract_signed_stamped",
    documentType: STEP8_DOC.SIGNED_CONTRACT,
    uploadLabel: "แนบหลักฐาน (.pdf)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
    legacyDocumentTypes: [STEP8_DOC_LEGACY.SIGNED],
  },
];

const STEP9_INLINE: ChecklistInlineEvidence[] = [];

const STEP10_INLINE: ChecklistInlineEvidence[] = [];

const BY_STEP: Record<number, ChecklistInlineEvidence[]> = {
  1: STEP1_INLINE,
  2: STEP2_INLINE,
  3: STEP3_INLINE,
  4: STEP4_INLINE,
  5: STEP5_INLINE,
  6: STEP6_INLINE,
  7: STEP7_INLINE,
  8: STEP8_INLINE,
  9: STEP9_INLINE,
  10: STEP10_INLINE,
};

export function getInlineEvidenceForStep(
  stepNumber: number,
  projectType?: string | null,
): ChecklistInlineEvidence[] {
  const base = BY_STEP[stepNumber] ?? [];
  if (stepNumber !== 2 || !isEgpConstructionProjectType(projectType)) {
    return base;
  }
  return base.map((entry) => {
    if (entry.checklistKey !== "bg06_table_verified") return entry;
    return {
      ...entry,
      documentType: STEP2_DOC.MEDIAN_PRICE_BG01,
      uploadLabel: "แนบตารางแสดงวงเงินราคากลางงานก่อสร้าง (แบบ บก.01)",
      legacyDocumentTypes: [STEP2_DOC.MEDIAN_PRICE_BG06],
    };
  });
}

export function getInlineEvidenceByKey(
  stepNumber: number,
  projectType?: string | null,
): Map<string, ChecklistInlineEvidence> {
  return new Map(
    getInlineEvidenceForStep(stepNumber, projectType).map((e) => [e.checklistKey, e]),
  );
}

export function hasInlineEvidenceDoc(
  docs: Array<{ document_type: string }>,
  documentType: string,
  altTypes?: string[],
): boolean {
  const types = new Set([documentType, ...(altTypes ?? [])]);
  return docs.some((d) => types.has(d.document_type));
}
