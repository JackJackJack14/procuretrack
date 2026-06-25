import {
  formatBudgetBahtShort,
  getStep3HearingTier,
  type Step3HearingTier,
} from "@/lib/step3-hearing";

/** เนื้อหา Guideline Box — ขั้นตอนที่ 3 จัดทำร่างประกาศและรับฟังความคิดเห็น (อินโฟกราฟิก 3 การ์ด) */

/** @deprecated ใช้ getStep3GuidelineAction(budget) แทน */
export const STEP3_GUIDELINE_ACTION =
  "จัดทำร่างประกาศและรับฟังความคิดเห็น — ดูงบประมาณโครงการจากขั้นตอนที่ 1";

/** ข้อความหลักในกล่อง 📘 คุณต้องทำในขั้นตอนนี้ — อิงงบประมาณจริงจากขั้นตอนที่ 1 */
export function getStep3GuidelineAction(budget: number): string {
  const formatted = formatBudgetBahtShort(budget);
  const tier = getStep3HearingTier(budget);
  if (tier === "mandatory") {
    return `จัดทำร่างประกาศและรับฟังความคิดเห็น โครงการวงเงินงบประมาณ ${formatted} บาท — ระเบียบพัสดุฯ บังคับเผยแพร่รับฟังความคิดเห็นไม่น้อยกว่า 3 วันทำการ พร้อมดำเนินการจัดฟังคำวิจารณ์ให้ครบก่อนปิดขั้นตอน`;
  }
  if (tier === "discretionary") {
    return `จัดทำร่างประกาศและเอกสารประกวดราคา โครงการวงเงินงบประมาณ ${formatted} บาท — การจัดรับฟังความคิดเห็นอยู่ในดุลยพินิจของหัวหน้าหน่วยงาน`;
  }
  return `จัดทำรายงานขอซื้อขอจ้าง โครงการวงเงินงบประมาณ ${formatted} บาท — วงเงินไม่เกิน 5 ล้านบาท ได้รับยกเว้นไม่ต้องเผยแพร่รับฟังความคิดเห็น`;
}

/** รายการ bullet ด้านบนเส้นไทม์ไลน์ (การ์ดที่ 2) */
export const STEP3_GUIDELINE_RECORDING_BULLET_ITEMS = [
  "• เลขที่หนังสือเห็นชอบ: ระบุเลขที่หนังสือบันทึกข้อความภายในที่เสนอหัวหน้าหน่วยงานเพื่ออนุมัติเผยแพร่ร่างประกาศ (ไม่ใช่เลขคุมโครงการจาก e-GP)",
] as const;

/** หัวข้อเกณฑ์ระยะเวลาเผยแพร่ — แสดงเหนือ Visual Timeline Track */
export const STEP3_GUIDELINE_PUBLICATION_CRITERIA_HEADING =
  "• เกณฑ์ระยะเวลาเผยแพร่: ต้องเผยแพร่ไม่น้อยกว่า 3 วันทำการ";

/** หัวข้อเกณฑ์ตามวงเงิน — แสดงเหนือ Visual Timeline Track */
export function getStep3GuidelinePublicationCriteriaHeading(budget: number): string {
  const tier = getStep3HearingTier(budget);
  if (tier === "mandatory") {
    return "• เกณฑ์ระยะเวลาเผยแพร่: บังคับเผยแพร่รับฟังความคิดเห็นไม่น้อยกว่า 3 วันทำการ";
  }
  if (tier === "discretionary") {
    return "• เกณฑ์การจัดรับฟังความคิดเห็น: อยู่ในดุลยพินิจของหัวหน้าหน่วยงาน (หากจัดฟัง ต้องเผยแพร่ไม่น้อยกว่า 3 วันทำการ)";
  }
  return "• วงเงินไม่เกิน 5 ล้านบาท: ได้รับยกเว้นไม่ต้องจัดรับฟังความคิดเห็น";
}

/** แสดง Timeline Track ในไกด์ไลน์เมื่อบังคับฟัง หรือเลือกดำเนินการฟังแล้ว */
export function shouldShowStep3GuidelineTimeline(
  tier: Step3HearingTier,
  hearingProceed: boolean,
): boolean {
  return tier === "mandatory" || (tier === "discretionary" && hearingProceed);
}

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
