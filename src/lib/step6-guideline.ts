/** ขั้นตอนที่ 6 — อุทธรณ์ (มาตรา 117) — อินโฟกราฟิก 3 การ์ด */

import { isWorkday, parseISODateLocal } from "@/lib/workdays";

const THAI_MONTH_ABBR = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/** ป้ายกำกับช่วงเว้นวันหยุดระหว่างวันสิ้นสุดอุทธรณ์กับวันเริ่มลงนามได้ */
export function formatStep6AppealHolidayBridgeLabel(
  appealDeadlineISO: string,
  contractEarliestISO: string,
): string {
  const appealEnd = parseISODateLocal(appealDeadlineISO?.trim() ?? "");
  const contractStart = parseISODateLocal(contractEarliestISO?.trim() ?? "");
  if (!appealEnd || !contractStart) return "เว้นวันหยุดราชการ";

  const nonWorkdays: Date[] = [];
  const cursor = new Date(appealEnd.getTime());
  cursor.setDate(cursor.getDate() + 1);
  const end = new Date(contractStart.getTime());
  end.setDate(end.getDate() - 1);

  while (cursor <= end) {
    if (!isWorkday(cursor)) {
      nonWorkdays.push(new Date(cursor.getTime()));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (nonWorkdays.length === 0) return "เว้นวันหยุดราชการ";

  const first = nonWorkdays[0];
  const last = nonWorkdays[nonWorkdays.length - 1];
  const monthAbbr = THAI_MONTH_ABBR[first.getMonth()];
  if (nonWorkdays.length === 1) {
    return `เว้นวันหยุดราชการ ${first.getDate()} ${monthAbbr}`;
  }
  return `เว้นวันหยุดราชการ ${first.getDate()}-${last.getDate()} ${monthAbbr}`;
}

export const STEP6_GUIDELINE_ACTION_ITEMS = [  "• ตรวจสอบในระบบ e-GP ว่ามีผู้ยื่นอุทธรณ์ผลการจัดซื้อจัดจ้างภายในระยะ 7 วันทำการ นับจากวันที่แจ้งผลให้ผู้เสนอราคาทราบ (ขั้นตอนที่ 5)",
  "• กรณี 'ไม่มีผู้ยื่นอุทธรณ์': บันทึกสถานะในระบบ พร้อมแนบภาพหน้าจอตรวจสอบสถานะอุทธรณ์จาก e-GP (ไม่บังคับ) แล้วดำเนินการไปขั้นตอนที่ 7 — แจ้งให้ผู้ชนะมาลงนามในสัญญา",
  "• กรณี 'มีผู้ยื่นอุทธรณ์': บันทึกชื่อผู้ยื่น วันรับหนังสือ รายงานความเห็นเสนอหัวหน้าหน่วยงาน ส่งกรมบัญชีกลางภายใน 7 วันทำการ และรอผลวินิจฉัยคณะกรรมการ — ห้ามลงนามสัญญาก่อนได้ผล 'อุทธรณ์ฟังไม่ขึ้น'",
] as const;

export const STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS = [
  "• ระยะอุทธรณ์: 7 วันทำการ นับถัดจากวันที่แจ้งผล (ตาม มาตรา 117)",
  "• กรณีมีผู้ยื่นอุทธรณ์: ส่งรายงานความเห็นให้กรมบัญชีกลางภายใน 7 วันทำการ นับจากวันที่หน่วยงานได้รับหนังสืออุทธรณ์",
] as const;

export const STEP6_GUIDELINE_WARNING =
  "ห้ามลงนามในสัญญาก่อนพ้นกำหนดระยะเวลาอุทธรณ์ และ/หรือ ก่อนมีผลวินิจฉัย 'อุทธรณ์ฟังไม่ขึ้น' โดยเด็ดขาด หากมีการลงนามก่อนถือว่าสัญญาขัดต่อกฎหมายทันที";

export const STEP6_SCHEDULE_INCOMPLETE_MSG =
  "กรุณาบันทึกวันที่ลงนามในประกาศผู้ชนะในขั้นตอนที่ 5 ก่อน — ระบบจะคำนวณวันสิ้นสุดอุทธรณ์และวันที่เริ่มลงนามในสัญญาได้ให้อัตโนมัติ";

export const STEP6_CONTRACT_EARLIEST_CALC_NOTE =
  "คำนวณเว้นวันหยุดราชการแล้ว";

/** ข้อความแบนเนอร์เตือนเมื่อมีผู้ยื่นอุทธรณ์ */
export const STEP6_APPEAL_ACTIVE_BANNER_MSG =
  "⚠️ มีการยื่นอุทธรณ์เข้ามาในระบบ ห้ามลงนามในสัญญาเด็ดขาดตามมาตรา 66 วรรคสอง และต้องทำหนังสือส่งรายงานความเห็นให้กรมบัญชีกลางภายในกรอบเวลากฎหมาย";

/** @deprecated ใช้ STEP6_GUIDELINE_ACTION_ITEMS แทน */
export const STEP6_GUIDELINE_TODO = STEP6_GUIDELINE_ACTION_ITEMS;

/** @deprecated ใช้ STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS แทน */
export const STEP6_GUIDELINE_DURATION = STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS;

/** @deprecated ใช้ STEP6_GUIDELINE_WARNING แทน */
export const STEP6_GUIDELINE_WARNINGS = [STEP6_GUIDELINE_WARNING] as const;

/** @deprecated ใช้ STEP6_CONTRACT_EARLIEST_CALC_NOTE แทน */
export const STEP6_CONTRACT_EARLIEST_HINT =
  "*(คำนวณเว้นวันหยุดราชการช่วงวันที่ 28-30 ก.ค. 2569 แล้ว)*";
