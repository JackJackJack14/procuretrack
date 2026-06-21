/** เนื้อหา Guideline Box — ขั้นตอนที่ 3 จัดทำร่างประกาศและรับฟังความคิดเห็น (อินโฟกราฟิก 3 การ์ด) */

export const STEP3_GUIDELINE_ACTION =
  "จัดทำร่างประกาศและรับฟังความคิดเห็น โครงการวงเงินงบประมาณ 20,000,000 บาท (เกิน 10 ล้านบาท ระเบียบพัสดุฯ บังคับต้องเผยแพร่เพื่อรับฟังความคิดเห็นไม่น้อยกว่า 3 วันทำการ) พร้อมบังคับดำเนินการจัดฟังคำวิจารณ์ — ต้องกรอกข้อมูลและแนบหลักฐานครบก่อนปิดขั้นตอน";

/** รายการ bullet ด้านบนเส้นไทม์ไลน์ (การ์ดที่ 2) */
export const STEP3_GUIDELINE_RECORDING_BULLET_ITEMS = [
  "• เลขที่หนังสือเห็นชอบ: ระบุเลขที่หนังสือบันทึกข้อความภายในที่เสนอหัวหน้าหน่วยงานเพื่ออนุมัติเผยแพร่ร่างประกาศ (ไม่ใช่เลขคุมโครงการจาก e-GP)",
] as const;

/** หัวข้อเกณฑ์ระยะเวลาเผยแพร่ — แสดงเหนือ Visual Timeline Track */
export const STEP3_GUIDELINE_PUBLICATION_CRITERIA_HEADING =
  "• เกณฑ์ระยะเวลาเผยแพร่: ต้องเผยแพร่ไม่น้อยกว่า 3 วันทำการ";

export const STEP3_TIMELINE_NODE1_TITLE = "วันที่กดเผยแพร่ประกาศ (Day 0)";
export const STEP3_TIMELINE_NODE1_NOTE =
  "(ระบบจะไม่นับวันแรกนี้รวมใน 3 วันทำการ)";

export const STEP3_TIMELINE_CONNECTOR_BADGE = "นับไปอย่างน้อย 3 วันทำการ";

export const STEP3_TIMELINE_NODE2_TITLE = "ระยะเวลาเปิดรับฟังความคิดเห็น";
export const STEP3_TIMELINE_NODE2_NOTE =
  "(ระบบคำนวณหักวันหยุดเสาร์-อาทิตย์ และวันหยุดราชการให้อัตโนมัติ)";

export const STEP3_TIMELINE_NODE3_TITLE = "วันสิ้นสุดการเผยแพร่ขั้นต่ำตามระเบียบฯ";
export const STEP3_TIMELINE_NODE3_NOTE =
  "(เจ้าหน้าที่สามารถขยายเวลาเพิ่มได้ แต่ห้ามต่ำกว่าเกณฑ์นี้)";

/** @deprecated ใช้ STEP3_GUIDELINE_RECORDING_BULLET_ITEMS + Timeline Track แทน */
export const STEP3_GUIDELINE_RECORDING_ITEMS = [
  ...STEP3_GUIDELINE_RECORDING_BULLET_ITEMS,
  STEP3_GUIDELINE_PUBLICATION_CRITERIA_HEADING,
  "• ระบบจะไม่นับวันแรกที่กดเผยแพร่ (Day 0) และไม่รวมวันหยุดเสาร์-อาทิตย์/วันหยุดราชการไทย",
  "• ระบบจะคำนวณวันสิ้นสุดขั้นต่ำให้อัตโนมัติ — เจ้าหน้าที่ขยายระยะเวลาได้ แต่ห้ามต่ำกว่าเกณฑ์ขั้นต่ำที่ระเบียบกำหนด",
] as const;

export const STEP3_GUIDELINE_WARNING =
  "วันที่เริ่มเผยแพร่ ต้องไม่น้อยกว่า (ไม่ย้อนหลัง) วันที่หัวหน้าหน่วยงานลงนามในหนังสือเห็นชอบ";
