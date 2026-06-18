/** ประเภทเอกสารขั้นตอนที่ 2 — ผูกกับฟิลด์ฟอร์ม */
export const STEP2_DOC = {
  APPOINTMENT_ORDER: "คำสั่งแต่งตั้งคณะกรรมการจัดทำ TOR และราคากลาง",
  BOQ: "แบบรูปรายการงานก่อสร้าง (BOQ)",
  MEDIAN_PRICE_BG06: "แบบรายงานผลการกำหนดราคากลาง (บก.06)",
  INTEGRITY_LETTER: "หนังสือแสดงความบริสุทธิ์ใจของกรรมการ",
  EVALUATION_INSPECTION_ORDER: "คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ",
  SITE_SUPERVISOR_ORDER: "คำสั่งแต่งตั้งผู้ควบคุมงานหน้างาน",
  MARKET_QUOTES: "ใบเสนอราคาท้องตลาดอย่างน้อย 3 ราย",
} as const;

export const STEP2_APPOINTMENT_ORDER_UPLOAD_LABEL =
  "📎 แนบไฟล์เอกสารคำสั่งแต่งตั้ง (PDF)";

export const STEP2_BOQ_UPLOAD_LABEL =
  "📎 แนบไฟล์แบบรูปรายการงานก่อสร้าง (BOQ) (PDF)";

export const STEP2_BG06_UPLOAD_LABEL =
  "📎 แนบไฟล์ตารางแสดงวงเงินราคากลาง (แบบ บก.06) (PDF)";

export const STEP2_INTEGRITY_LETTER_UPLOAD_LABEL =
  "📎 แนบไฟล์หนังสือแสดงความบริสุทธิ์ใจของกรรมการ (PDF)";

export const STEP2_EVALUATION_INSPECTION_ORDER_UPLOAD_LABEL =
  "📎 แนบไฟล์คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับ (PDF)";

export const STEP2_SITE_SUPERVISOR_ORDER_UPLOAD_LABEL =
  "📎 แนบไฟล์คำสั่งแต่งตั้งผู้ควบคุมงานหน้างาน (PDF)";

export const STEP2_MARKET_QUOTES_UPLOAD_LABEL =
  "📎 แนบไฟล์ใบเสนอราคาท้องตลาดอย่างน้อย 3 ราย (PDF/ZIP)";

const STEP2_MARKET_QUOTE_DOC_PREFIX = `${STEP2_DOC.MARKET_QUOTES} (รายที่ `;

/** ประเภทเอกสารใบเสนอราคาท้องตลาด — แยกตามลำดับซัพพลายเออร์ (1-based) */
export function step2MarketQuoteDocType(index: number): string {
  return `${STEP2_DOC.MARKET_QUOTES} (รายที่ ${index + 1})`;
}

export function isStep2MarketQuoteDocType(documentType: string): boolean {
  return (
    documentType === STEP2_DOC.MARKET_QUOTES ||
    documentType.startsWith(STEP2_MARKET_QUOTE_DOC_PREFIX)
  );
}

/** คืนค่า index 0-based จาก document_type — null ถ้าเป็นไฟล์รวมแบบเก่า */
export function parseStep2MarketQuoteIndexFromDocType(documentType: string): number | null {
  if (documentType === STEP2_DOC.MARKET_QUOTES) return null;
  const m = /รายที่\s*(\d+)/.exec(documentType);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n - 1 : null;
}

export function step2MarketQuoteUploadLabel(index: number, supplierName?: string): string {
  const name = supplierName?.trim();
  if (name) {
    return `📎 แนบใบเสนอราคา — ${name} (PDF)`;
  }
  return `📎 แนบใบเสนอราคารายที่ ${index + 1} (PDF)`;
}

export const STEP2_MARKET_QUOTE_REQUIRED_COUNT = 3;

/** นับไฟล์ใบเสนอราคาที่แนบแยกรายซัพพลายเออร์ */
export function countStep2MarketQuoteDocsUploaded(
  stepDocs?: Array<{ document_type: string }>,
  quoteCount = STEP2_MARKET_QUOTE_REQUIRED_COUNT,
): number {
  if (!stepDocs?.length) return 0;
  let count = 0;
  for (let i = 0; i < quoteCount; i++) {
    if (stepDocs.some((d) => d.document_type === step2MarketQuoteDocType(i))) {
      count++;
    }
  }
  return count;
}

/** ตรวจว่าแนบใบเสนอราคาครบ — รองรับไฟล์รวมแบบเก่า (ก่อนแยกราย) */
export function hasStep2MarketQuotesDoc(
  stepDocs?: Array<{ document_type: string }>,
  quoteCount = STEP2_MARKET_QUOTE_REQUIRED_COUNT,
): boolean {
  if (countStep2MarketQuoteDocsUploaded(stepDocs, quoteCount) >= quoteCount) {
    return true;
  }
  return (
    quoteCount >= 3 &&
    countStep2MarketQuoteDocsUploaded(stepDocs, quoteCount) === 0 &&
    (stepDocs?.some((d) => d.document_type === STEP2_DOC.MARKET_QUOTES) ?? false)
  );
}

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

export const STEP3_MEMO_APPROVAL_UPLOAD_LABEL =
  "📎 บันทึกข้อความขอความเห็นชอบร่าง TOR (PDF)";

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
  /** เอกสารบังคับ — รายงานขอซื้อขอจ้างที่เซ็นลงนามแล้ว (ข้อ 22) */
  SIGNED_PROCUREMENT_REQUEST: "PDF รายงานขอซื้อขอจ้างที่เซ็นลงนามแล้ว",
  /** หลักฐานข้อที่ 1 — ดาวน์โหลดรายงานสรุปผลจาก e-GP */
  EGP_BID_SUMMARY: "PDF รายงานสรุปผลการเสนอราคาจากระบบ e-GP",
  /** หลักฐานข้อที่ 2 — ตรวจ Blacklist จากระบบภายนอก */
  BLACKLIST_EVIDENCE: "ภาพหน้าจอ/เอกสารตรวจ Blacklist (e-GP)",
  /** หลักฐานข้อที่ 3 — ตรวจผลประโยชน์ร่วมกัน */
  CONFLICT_EVIDENCE: "ภาพหน้าจอ/เอกสารตรวจผลประโยชน์ร่วมกัน",
  /** หลักฐานข้อที่ 4–5 — รายงานผลการพิจารณาของคณะกรรมการ */
  COMMITTEE_EVALUATION_REPORT: "PDF รายงานผลการพิจารณาของคณะกรรมการ",
  /** เอกสารบังคับ — ตารางเปรียบเทียบราคาฉบับสมบูรณ์ */
  PRICE_COMPARISON_TABLE: "ตารางเปรียบเทียบราคาฉบับสมบูรณ์ (PDF)",
  /** @deprecated ใช้ COMMITTEE_EVALUATION_REPORT — รองรับไฟล์เก่าใน DB */
  EVALUATION_REPORT: STEP4_DOC_LEGACY.EVALUATION_REPORT,
} as const;

export const STEP4_PRICE_COMPARISON_UPLOAD_LABEL =
  "📎 แนบตารางเปรียบเทียบราคาฉบับสมบูรณ์ (PDF)";

/** ประเภทเอกสารขั้นตอนที่ 5 — ผูกกับ Smart Checklist + Audit Trail */
export const STEP5_DOC = {
  /** หลักฐานข้อที่ 2 — ประกาศผลผู้ชนะในระบบ e-GP */
  EGP_WINNER_ANNOUNCEMENT: "หลักฐานประกาศผลผู้ชนะในระบบ e-GP",
  /** หลักฐานข้อที่ 3 — ปิดประกาศ ณ ที่ทำการหน่วยงาน */
  PHYSICAL_BOARD_ANNOUNCEMENT: "ภาพถ่ายบอร์ดประชาสัมพันธ์ปิดประกาศผลผู้ชนะ",
  /** หลักฐานแจ้งผลให้ผู้เสนอราคาทุกรายทราบ */
  ALL_BIDDERS_RESULT_NOTICE: "หลักฐานแจ้งผลผู้เสนอราคาทุกราย",
} as const;

export const STEP5_ALL_BIDDERS_RESULT_UPLOAD_LABEL =
  "📎 แนบหลักฐานแจ้งผลผู้เสนอราคาทุกราย (อีเมล e-GP / ใบตอบรับ)";

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

export function isStep5AllBiddersResultDocType(documentType: string): boolean {
  return documentType === STEP5_DOC.ALL_BIDDERS_RESULT_NOTICE;
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

/** ประเภทเอกสารขั้นตอนที่ 7 — แจ้งให้ผู้ชนะมาลงนามในสัญญา (ข้อ 161) */
export const STEP7_DOC = {
  /** หลักฐานข้อที่ 2 — หนังสือแจ้งลงนามสัญญา (ลงนามหัวหน้าหน่วยงาน) */
  CONTRACT_NOTICE_LETTER: "หนังสือแจ้งให้ผู้ชนะมาลงนามในสัญญา (ลงนามหัวหน้าหน่วยงาน)",
  /** หลักฐานข้อที่ 3 — ใบตอบรับ/หลักฐานนำส่ง */
  CONTRACT_NOTICE_DELIVERY_PROOF: "หลักฐานการนำส่งหรือตอบรับหนังสือแจ้งทำสัญญา",
  /** ร่างสัญญาจ้างก่อสร้าง — เตรียมก่อนลงนาม */
  DRAFT_CONTRACT: "ร่างสัญญาจ้างก่อสร้าง",
} as const;

export const STEP7_DRAFT_CONTRACT_UPLOAD_LABEL =
  "📎 แนบไฟล์ร่างสัญญาจ้างก่อสร้าง (PDF)";

/** @deprecated ชื่อเอกสารเก่าใน DB */
export const STEP7_DOC_LEGACY = {
  /** @deprecated ใช้ STEP7_DOC.DRAFT_CONTRACT */
  DRAFT_CONTRACT: STEP7_DOC.DRAFT_CONTRACT,
  CORRESPONDENCE: "หนังสือโต้ตอบก่อนลงนาม (ถ้ามี)",
} as const;

export function isStep7DraftContractDocType(documentType: string): boolean {
  return documentType === STEP7_DOC.DRAFT_CONTRACT;
}

/** ประเภทเอกสารขั้นตอนที่ 8 — ตรวจหลักประกันและลงนามสัญญา */
export const STEP8_DOC = {
  /** หลักฐานข้อที่ 2 — ยืนยันหลักประกันสัญญา */
  GUARANTEE_VERIFICATION: "หลักฐานยืนยันหลักประกันสัญญา",
  /** หลักฐานข้อที่ 3 — สัญญาลงนามครบและติดอากร */
  SIGNED_CONTRACT: "สัญญาจ้างลงนามครบและติดอากรแสตมป์",
} as const;

/** @deprecated ชื่อเอกสารเก่าใน DB */
export const STEP8_DOC_LEGACY = {
  GUARANTEE: "หลักประกันสัญญา (LG/แคชเชียร์เช็ค)",
  SIGNED: "สัญญาจ้างก่อสร้าง (ต้นฉบับ ติดอากรแสตมป์)",
  COMPANY_REG: "สำเนาทะเบียนบริษัทผู้รับจ้าง",
  POWER_OF_ATTORNEY: "หนังสือมอบอำนาจ (ถ้ามี)",
} as const;

/** ประเภทเอกสารขั้นตอนที่ 9 — สาระสำคัญสัญญา */
export const STEP9_DOC = {
  GANTT_CHART: "แผนปฏิบัติการก่อสร้าง (Gantt)",
  EGP_ESSENTIAL_PUBLICATION: "ใบประกาศสาระสำคัญสัญญาจาก e-GP",
  NOTICE_TO_PROCEED: "หนังสือแจ้งเริ่มงาน",
} as const;

/** @deprecated ชื่อเอกสารเก่าใน DB */
export const STEP9_DOC_LEGACY = {
  CONTRACT_SUMMARY: "สรุปสาระสำคัญสัญญา (วงเงิน/ระยะเวลา/งวดงาน)",
  GANTT: STEP9_DOC.GANTT_CHART,
} as const;

export function isStep9GanttDocType(documentType: string): boolean {
  return (
    documentType === STEP9_DOC.GANTT_CHART ||
    documentType === STEP9_DOC_LEGACY.GANTT
  );
}

/** ประเภทเอกสารขั้นตอนที่ 10 — บริหารสัญญา (คืนหลักประกัน) */
export const STEP10_DOC = {
  GUARANTEE_RETURN: "บันทึกคืนหลักประกันสัญญา",
} as const;

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

export const STEP4_SIGNED_PROCUREMENT_REQUEST_UPLOAD_LABEL =
  "📎 แนบไฟล์รายงานขอซื้อขอจ้างที่เซ็นลงนามแล้ว (PDF) *";

export const STEP4_EGP_SUMMARY_UPLOAD_LABEL =
  "📎 แนบตารางสรุปผลการเสนอราคาจาก e-GP (PDF) *";

export const STEP4_COMMITTEE_REPORT_UPLOAD_LABEL =
  "📎 แนบรายงานผลการพิจารณาของคณะกรรมการ (PDF) *";

/** @deprecated */
export const STEP4_EVALUATION_UPLOAD_LABEL = STEP4_COMMITTEE_REPORT_UPLOAD_LABEL;

/** ชื่อเอกสารเก่า (backward compatible ใน Hub) */
export const STEP3_DOC_LEGACY = [
  "ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
  "ร่างประกาศและร่างเอกสารประกวดราคา",
  "รายงานขอความเห็นชอบร่างประกาศฯ",
] as const;
