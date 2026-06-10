/** ประเภทเอกสารขั้นตอนที่ 2 — ผูกกับฟิลด์ฟอร์ม */
export const STEP2_DOC = {
  APPOINTMENT_ORDER: "คำสั่งแต่งตั้งคณะกรรมการจัดทำ TOR และราคากลาง",
  MEDIAN_PRICE_BG06: "แบบรายงานผลการกำหนดราคากลาง (บก.06)",
} as const;

export const STEP2_APPOINTMENT_ORDER_UPLOAD_LABEL =
  "📎 แนบไฟล์เอกสารคำสั่งแต่งตั้ง (PDF)";

export const STEP2_BG06_UPLOAD_LABEL =
  "📎 แนบไฟล์ตารางแสดงวงเงินราคากลาง (แบบ บก.06) (PDF)";

/** ประเภทเอกสารขั้นตอนที่ 3 — ผูกกับฟิลด์ฟอร์ม (Single Page Workflow) */
export const STEP3_DOC = {
  DRAFT_TOR_SPEC: "ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
  DRAFT_ANNOUNCEMENT_BID: "ร่างประกาศและร่างเอกสารประกวดราคา",
  MEDIAN_BG06: "แบบรายงานผลการกำหนดราคากลาง (บก.06)",
  MEMO_APPROVAL: "PDF บันทึกข้อความเห็นชอบ",
  EGP_ANNOUNCEMENT: "PDF ประกาศจากระบบ e-GP",
  EGP_SCREENSHOT: "ภาพหน้าจอระบบ e-GP (หลักฐานการเผยแพร่)",
  FEEDBACK_REPORT: "PDF รายงานผลการวิจารณ์",
} as const;

export const STEP3_DRAFT_TOR_UPLOAD_LABEL =
  "📎 แนบไฟล์ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ (PDF)";

export const STEP3_DRAFT_ANNOUNCEMENT_UPLOAD_LABEL =
  "📎 แนบไฟล์ร่างประกาศและร่างเอกสารประกวดราคา (PDF)";

export const STEP3_MEDIAN_BG06_UPLOAD_LABEL =
  "📎 แนบไฟล์ตารางราคากลาง (บก.06) (PDF) — หากอัปโหลดในขั้นตอนที่ 2 แล้วไม่ต้องซ้ำ";

export const STEP3_EGP_SCREENSHOT_UPLOAD_LABEL =
  "📎 แนบภาพหน้าจอระบบ e-GP ที่แสดงการเผยแพร่ประกาศ (PNG/JPG/PDF)";

/** ป้ายปุ่มอัปโหลดรายงานผลรับฟังความคิดเห็น (แสดงบนฟอร์ม) */
export const STEP3_FEEDBACK_UPLOAD_LABEL =
  "📎 แนบบันทึกรายงานผลการรับฟังความคิดเห็น / หน้าจอสรุปผลจาก e-GP (PDF)";

export const STEP3_FEEDBACK_HELPER_NONE =
  "หมายเหตุ: กรณีไม่มีผู้เสนอแนะหรือวิจารณ์ ระเบียบพัสดุฯ บังคับให้จัดทำบันทึกข้อความภายในเพื่อรายงานผลให้หัวหน้าหน่วยงานรับทราบ พร้อมแคปหน้าจอหลักฐานสถานะจากระบบ e-GP มัดรวมเป็นไฟล์ PDF เดียวกันแล้วนำมาอัปโหลดที่ช่องนี้";

export const STEP3_FEEDBACK_HELPER_HAS_COMMENTS =
  "หมายเหตุ: ให้แนบรายงานข้อสรุปประเด็นที่มีผู้เสนอแนะหรือวิจารณ์ พร้อมบันทึกข้อความชี้แจง/ปรับปรุงร่าง TOR ที่เสนอหัวหน้าหน่วยงานเห็นชอบ";

/** ประเภทเอกสารขั้นตอนที่ 4 — ผูกกับ Smart Checklist + Audit Trail */
export const STEP4_DOC_LEGACY = {
  /** ค่าเก่าใน DB ก่อนอัปเกรดมาตรฐาน Audit Trail */
  EVALUATION_REPORT: "PDF รายงานผลการพิจารณา",
} as const;

export const STEP4_DOC = {
  /** หลักฐานข้อที่ 1 — ดาวน์โหลดรายงานสรุปผลจาก e-GP */
  EGP_BID_SUMMARY: "PDF รายงานสรุปผลการเสนอราคาจากระบบ e-GP",
  /** หลักฐานข้อที่ 2 — ตรวจ Blacklist จากระบบภายนอก */
  BLACKLIST_EVIDENCE: "ภาพหน้าจอ/เอกสารตรวจ Blacklist (e-GP)",
  /** หลักฐานข้อที่ 3 — ตรวจผลประโยชน์ร่วมกัน */
  CONFLICT_EVIDENCE: "ภาพหน้าจอ/เอกสารตรวจผลประโยชน์ร่วมกัน",
  /** หลักฐานข้อที่ 4–5 — รายงานผลการพิจารณาของคณะกรรมการ */
  COMMITTEE_EVALUATION_REPORT: "PDF รายงานผลการพิจารณาของคณะกรรมการ",
  /** @deprecated ใช้ COMMITTEE_EVALUATION_REPORT — รองรับไฟล์เก่าใน DB */
  EVALUATION_REPORT: STEP4_DOC_LEGACY.EVALUATION_REPORT,
} as const;

/** ประเภทเอกสารขั้นตอนที่ 5 — ผูกกับ Smart Checklist + Audit Trail */
export const STEP5_DOC = {
  /** หลักฐานข้อที่ 2 — ประกาศผลผู้ชนะในระบบ e-GP */
  EGP_WINNER_ANNOUNCEMENT: "หลักฐานประกาศผลผู้ชนะในระบบ e-GP",
  /** หลักฐานข้อที่ 3 — ปิดประกาศ ณ ที่ทำการหน่วยงาน */
  PHYSICAL_BOARD_ANNOUNCEMENT: "ภาพถ่ายบอร์ดประชาสัมพันธ์ปิดประกาศผลผู้ชนะ",
} as const;

/** @deprecated ชื่อเอกสารเก่าใน DB — รองรับ Audit Hub */
export const STEP5_DOC_LEGACY = {
  EGP_WINNER: "ประกาศผู้ชนะการเสนอราคา (e-GP)",
  EVALUATION_SIGNED: "รายงานผลการพิจารณา (ลงนามคณะกรรมการครบ)",
  APPROVAL_MEMO: "บันทึกอนุมัติผลจากหัวหน้าหน่วยงาน",
} as const;

export function isStep5EgpWinnerDocType(documentType: string): boolean {
  return (
    documentType === STEP5_DOC.EGP_WINNER_ANNOUNCEMENT ||
    documentType === STEP5_DOC_LEGACY.EGP_WINNER
  );
}

export function isStep5PhysicalBoardDocType(documentType: string): boolean {
  return documentType === STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT;
}

/** ประเภทเอกสารขั้นตอนที่ 6 — หลักฐานตามเคสอุทธรณ์ */
export const STEP6_DOC = {
  /** เคสไม่มีผู้ยื่นอุทธรณ์ — แคปหน้าจอ e-GP */
  NO_APPEAL_EGP_SCREENSHOT: "ภาพแคปหน้าจอ e-GP ยืนยันไม่มีผู้ยื่นอุทธรณ์",
  /** เคสมีผู้ยื่นอุทธรณ์ — รายงานหน่วยงาน */
  AGENCY_APPEAL_REPORT: "หนังสือรายงานผลการพิจารณาอุทธรณ์ของหน่วยงาน (PDF)",
  /** เคสมีผู้ยื่นอุทธรณ์ — ส่ง กบง. */
  CGD_APPEAL_REPORT: "หลักฐานส่งรายงานผลอุทธรณ์ให้กรมบัญชีกลาง (PDF)",
  /** @deprecated ชื่อเก่าใน DB */
  APPEAL_RESULT_EVIDENCE:
    "หลักฐานรายงานผลการอุทธรณ์หรือภาพแคปหน้าจอ e-GP (ไม่มีผู้ยื่นอุทธรณ์)",
} as const;

export function isStep6NoAppealEgpDocType(documentType: string): boolean {
  return (
    documentType === STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT ||
    documentType === STEP6_DOC.APPEAL_RESULT_EVIDENCE
  );
}

export function isStep6AgencyReportDocType(documentType: string): boolean {
  return documentType === STEP6_DOC.AGENCY_APPEAL_REPORT;
}

export function isStep6CgdReportDocType(documentType: string): boolean {
  return documentType === STEP6_DOC.CGD_APPEAL_REPORT;
}

/** @deprecated */
export function isStep6AppealEvidenceDocType(documentType: string): boolean {
  return isStep6NoAppealEgpDocType(documentType);
}

export function isStep4CommitteeReportDocType(documentType: string): boolean {
  return (
    documentType === STEP4_DOC.COMMITTEE_EVALUATION_REPORT ||
    documentType === STEP4_DOC_LEGACY.EVALUATION_REPORT
  );
}

export const STEP4_EGP_SUMMARY_UPLOAD_LABEL =
  "📎 หลักฐานข้อที่ 1 — แนบรายงานสรุปผลการเสนอราคาจากระบบ e-GP (PDF)";

export const STEP4_COMMITTEE_REPORT_UPLOAD_LABEL =
  "📎 หลักฐานข้อที่ 4 — แนบรายงานผลการพิจารณาของคณะกรรมการ (PDF)";

/** @deprecated */
export const STEP4_EVALUATION_UPLOAD_LABEL = STEP4_COMMITTEE_REPORT_UPLOAD_LABEL;

/** ชื่อเอกสารเก่า (backward compatible ใน Hub) */
export const STEP3_DOC_LEGACY = [
  "ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
  "ร่างประกาศและร่างเอกสารประกวดราคา",
  "รายงานขอความเห็นชอบร่างประกาศฯ",
] as const;
