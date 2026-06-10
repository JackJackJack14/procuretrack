/**
 * Global Form Design Standard — Inline Evidence บนแถว Smart Checklist
 * ตรวจข้อไหน แนบหลักฐานข้อนั้นในแถวเดียวกัน (Upload-Driven Reactive Check)
 */
import type { DocFilePolicyId } from "@/lib/doc-file-types";
import { STEP2_DOC, STEP3_DOC, STEP4_DOC, STEP5_DOC, STEP6_DOC } from "@/lib/step-doc-types";

export type ChecklistInlineEvidence = {
  checklistKey: string;
  documentType: string;
  uploadLabel: string;
  filePolicyId: DocFilePolicyId;
  /** ซ่อน checkbox — ติ๊กอัตโนมัติเมื่ออัปโหลด/ลบไฟล์ */
  uploadDriven: boolean;
};

const STEP1_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "annual_plan_published",
    documentType: "เอกสารอนุมัติโครงการ/จัดสรรงบประมาณ",
    uploadLabel: "แนบเอกสารอนุมัติโครงการ/จัดสรรงบ",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP2_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "committee_qualifications_verified",
    documentType: "หนังสือแสดงความบริสุทธิ์ใจของกรรมการ",
    uploadLabel: "แนบหนังสือแสดงความบริสุทธิ์ใจกรรมการ",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "appointment_order_signed",
    documentType: STEP2_DOC.APPOINTMENT_ORDER,
    uploadLabel: "แนบคำสั่งแต่งตั้ง (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "bg06_table_prepared",
    documentType: STEP2_DOC.MEDIAN_PRICE_BG06,
    uploadLabel: "แนบตารางราคากลาง บก.06",
    filePolicyId: "bg06",
    uploadDriven: true,
  },
];

const STEP3_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "draft_announcement_standard_compliant",
    documentType: STEP3_DOC.DRAFT_ANNOUNCEMENT_BID,
    uploadLabel: "แนบร่างประกาศและเอกสารประกวดราคา",
    filePolicyId: "tor_spec",
    uploadDriven: true,
  },
  {
    checklistKey: "spec_no_lock_in_verified",
    documentType: STEP3_DOC.DRAFT_TOR_SPEC,
    uploadLabel: "แนบร่าง TOR / คุณลักษณะเฉพาะ",
    filePolicyId: "tor_spec",
    uploadDriven: true,
  },
  {
    checklistKey: "internal_memo_director_approval",
    documentType: STEP3_DOC.MEMO_APPROVAL,
    uploadLabel: "แนบ PDF บันทึกข้อความเห็นชอบ",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "egp_published_for_comment",
    documentType: STEP3_DOC.EGP_SCREENSHOT,
    uploadLabel: "แนบหลักฐานเผยแพร่ e-GP (แคปหน้าจอได้)",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
];

/** ขั้นตอนที่ 4 — แม่แบบมาตรฐานกลาง */
const STEP4_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "egp_summary_downloaded",
    documentType: STEP4_DOC.EGP_BID_SUMMARY,
    uploadLabel: "แนบรายงานสรุปผล e-GP (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "blacklist_checked",
    documentType: STEP4_DOC.BLACKLIST_EVIDENCE,
    uploadLabel: "แนบหลักฐานตรวจ Blacklist (แคปหน้าจอได้)",
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
    checklistKey: "technical_price_reviewed",
    documentType: STEP4_DOC.COMMITTEE_EVALUATION_REPORT,
    uploadLabel: "แนบรายงานผลคณะกรรมการ (PDF)",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP5_INLINE: ChecklistInlineEvidence[] = [
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
    checklistKey: "draft_contract_reviewed",
    documentType: "ร่างสัญญาจ้างก่อสร้าง",
    uploadLabel: "แนบร่างสัญญา",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP8_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "contract_guarantee_verified",
    documentType: "หลักประกันสัญญา (LG/แคชเชียร์เช็ค)",
    uploadLabel: "แนบหลักประกันสัญญา",
    filePolicyId: "screenshot_evidence",
    uploadDriven: true,
  },
  {
    checklistKey: "contract_signed_stamped",
    documentType: "สัญญาจ้างก่อสร้าง (ต้นฉบับ ติดอากรแสตมป์)",
    uploadLabel: "แนบสัญญาต้นฉบับ",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

const STEP9_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "contract_summary_verified",
    documentType: "สรุปสาระสำคัญสัญญา (วงเงิน/ระยะเวลา/งวดงาน)",
    uploadLabel: "แนบสรุปสาระสำคัญสัญญา",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "construction_plan_reviewed",
    documentType: "แผนปฏิบัติการก่อสร้าง (Gantt)",
    uploadLabel: "แนบแผน Gantt",
    filePolicyId: "bg06",
    uploadDriven: true,
  },
];

const STEP10_INLINE: ChecklistInlineEvidence[] = [
  {
    checklistKey: "progress_reports_verified",
    documentType: "รายงานความคืบหน้ารายสัปดาห์",
    uploadLabel: "แนบรายงานความคืบหน้า",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
  {
    checklistKey: "delivery_inspection_complete",
    documentType: "ใบแจ้งส่งมอบงาน/ใบตรวจรับ (บก.11)",
    uploadLabel: "แนบใบตรวจรับ บก.11",
    filePolicyId: "pdf_only",
    uploadDriven: true,
  },
];

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

export function getInlineEvidenceForStep(stepNumber: number): ChecklistInlineEvidence[] {
  return BY_STEP[stepNumber] ?? [];
}

export function getInlineEvidenceByKey(
  stepNumber: number,
): Map<string, ChecklistInlineEvidence> {
  return new Map(
    getInlineEvidenceForStep(stepNumber).map((e) => [e.checklistKey, e]),
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
