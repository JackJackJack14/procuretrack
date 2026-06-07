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
  MEDIAN_BG06: "แบบรายงานผลการกำหนดราคากlาง (บก.06)",
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
  "📎 แนบไฟล์ตารางราคากlาง (บก.06) (PDF) — หากอัปโหลดในขั้นตอนที่ 2 แล้วไม่ต้องซ้ำ";

export const STEP3_EGP_SCREENSHOT_UPLOAD_LABEL =
  "📎 แนบภาพหน้าจอระบบ e-GP ที่แสดงการเผยแพร่ประกาศ (PNG/JPG/PDF)";

/** ป้ายปุ่มอัปโหลดรายงานผลรับฟังความคิดเห็น (แสดงบนฟอร์ม) */
export const STEP3_FEEDBACK_UPLOAD_LABEL =
  "📎 แนบบันทึกรายงานผลการรับฟังความคิดเห็น / หน้าจอสรุปผลจาก e-GP (PDF)";

export const STEP3_FEEDBACK_HELPER_NONE =
  "หมายเหตุ: กรณีไม่มีผู้เสนอแนะหรือวิจารณ์ ระเบียบพัสดุฯ บังคับให้จัดทำบันทึกข้อความภายในเพื่อรายงานผลให้หัวหน้าหน่วยงานรับทราบ พร้อมแคปหน้าจอหลักฐานสถานะจากระบบ e-GP มัดรวมเป็นไฟล์ PDF เดียวกันแล้วนำมาอัปโหลดที่ช่องนี้";

export const STEP3_FEEDBACK_HELPER_HAS_COMMENTS =
  "หมายเหตุ: ให้แนบรายงานข้อสรุปประเด็นที่มีผู้เสนอแนะหรือวิจารณ์ พร้อมบันทึกข้อความชี้แจง/ปรับปรุงร่าง TOR ที่เสนอหัวหน้าหน่วยงานเห็นชอบ";

/** ประเภทเอกสารขั้นตอนที่ 4 — ผูกกับฟิลด์ฟอร์ม */
export const STEP4_DOC = {
  EVALUATION_REPORT: "PDF รายงานผลการพิจารณา",
} as const;

export const STEP4_EVALUATION_UPLOAD_LABEL =
  "📎 แนบเอกสารรายงานผลการพิจารณา (PDF)";

/** ชื่อเอกสารเก่า (backward compatible ใน Hub) */
export const STEP3_DOC_LEGACY = [
  "ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ",
  "ร่างประกาศและร่างเอกสารประกวดราคา",
  "รายงานขอความเห็นชอบร่างประกาศฯ",
] as const;
