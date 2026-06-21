/** ข้อความคงที่ — Guideline ขั้นตอนที่ 8 (มาตรฐาน สตง.) */

import {
  STEP7_CONTRACT_SIGNING_DEADLINE_WORKDAYS,
  isWorkday,
  parseISODateLocal,
} from "@/lib/workdays";
import { formatThaiDateSlash } from "@/lib/utils";

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

export const STEP8_GUIDELINE_ACTION_ITEMS = [
  "• ตรวจสอบความถูกต้องของข้อมูลคู่สัญญา, วงเงิน, และเอกสารแนบท้ายสัญญาขั้นสุดท้าย",
  '• ตรวจสอบความถูกต้องของ "หลักประกันสัญญา" (เช่น มูลค่า, วันหมดอายุ, ความน่าเชื่อถือของธนาคารผู้ออกหนังสือค้ำประกัน)',
  "• อัปโหลดไฟล์ [ร่างสัญญาฉบับลงนามแล้ว (PDF)] และ [ไฟล์หลักประกันสัญญา (PDF)] เข้าระบบเพื่อบันทึกจบขั้นตอน",
] as const;

export const STEP8_GUIDELINE_WARNING_GUARANTEE =
  "• มูลค่าหลักประกัน: ยอดหลักประกันสัญญาต้องไม่น้อยกว่า 5% ของราคาที่ตกลงซื้อจ้างจริง (ตามระเบียบฯ ข้อ 168)";

export const STEP8_GUIDELINE_WARNING_STAMP_DUTY =
  "• การติดอากรแสตมป์ (จุดตาย สตง.): บังคับคู่สัญญาจัดทำและติดอากรแสตมป์ (หรือชำระอากรแสตมป์อิเล็กทรอนิกส์ e-Stamp) ในอัตรา 0.1% ของมูลค่าสัญญา ให้เสร็จสิ้นภายใน 15 วันนับถัดจากวันเซ็นสัญญาเด็ดขาด";

export const STEP8_GUARANTEE_BELOW_MINIMUM_MSG =
  "⚠️ ยอดหลักประกันต่ำกว่า 5% ของมูลค่าสัญญา โปรดตรวจสอบ";

export const STEP8_SIGNED_OUTSIDE_RANGE_MSG =
  "⚠️ ลงนามสัญญาเกินกำหนดเวลาที่ระบุในหนังสือเชิญ พัสดุต้องพิจารณาริบหลักประกันซองหรือดำเนินตามระเบียบฯ";

/** @deprecated ใช้ STEP8_SIGNED_OUTSIDE_RANGE_MSG */
export const STEP8_SIGNED_PAST_DEADLINE_MSG = STEP8_SIGNED_OUTSIDE_RANGE_MSG;

export const STEP8_SCHEDULE_INCOMPLETE_MSG =
  "กรุณาบันทึกขั้นตอนที่ 6–7 ก่อน — ระบบจะคำนวณกรอบเวลาลงนามในสัญญาให้อัตโนมัติ";

export const STEP8_TIMELINE_NODE2_PENDING = "— รอเลือก —";

/** ป้ายกำกับวันหยุดที่ระบบเว้นระหว่างคำนวณเดดไลน์ลงนาม */
export function formatStep8SigningHolidaySkipsNote(
  step7ReceivedISO: string,
  deadlineISO: string,
): string {
  const received = parseISODateLocal(step7ReceivedISO?.trim() ?? "");
  const deadline = parseISODateLocal(deadlineISO?.trim() ?? "");
  if (!received || !deadline) {
    return "โดยเว้นวันหยุดราชการให้แล้ว";
  }

  const skipped: string[] = [];
  const cursor = new Date(received.getTime());
  cursor.setDate(cursor.getDate() + 1);
  const end = new Date(deadline.getTime());

  while (cursor <= end) {
    if (!isWorkday(cursor)) {
      skipped.push(`${cursor.getDate()} ${THAI_MONTH_ABBR[cursor.getMonth()]}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (skipped.length === 0) return "โดยเว้นวันหยุดราชการให้แล้ว";
  if (skipped.length === 1) return `โดยเว้นวันหยุด${skipped[0]} ให้แล้ว`;
  return `โดยเว้นวันหยุด${skipped.join(", ")} ให้แล้ว`;
}

export function formatStep8TimelineNode1Line(earliestISO: string): string {
  return `เริ่มลงนามในสัญญาได้ตั้งแต่วันที่ ${formatThaiDateSlash(earliestISO)} เป็นต้นไป (หลังพ้นระยะอุทธรณ์และวันหยุดยาว)`;
}

export function formatStep8TimelineNode2Line(signedISO: string): string {
  if (!signedISO?.trim()) {
    return `วันที่ลงนามสัญญาจริง: ${STEP8_TIMELINE_NODE2_PENDING}`;
  }
  return `วันที่ลงนามสัญญาจริง: ${formatThaiDateSlash(signedISO)}`;
}

export function formatStep8TimelineNode3Line(
  deadlineISO: string,
  step7ReceivedISO: string,
): string {
  const holidayNote = formatStep8SigningHolidaySkipsNote(step7ReceivedISO, deadlineISO);
  return `ต้องลงนามผูกพันสัญญาภายในวันที่ ${formatThaiDateSlash(deadlineISO)} (คำนวณบวก ${STEP7_CONTRACT_SIGNING_DEADLINE_WORKDAYS} วันทำการจากฐานขั้นตอนที่ 7 ${holidayNote})`;
}

export function formatStep8GuidelineOverdueWarning(deadlineISO: string): string {
  const dateLabel = deadlineISO?.trim() ? formatThaiDateSlash(deadlineISO) : "—";
  return `หากคู่สัญญาไม่มาลงนามภายในวันที่ ${dateLabel} โดยไม่มีเหตุอันสมควร พัสดุต้องรายงานหัวหน้าหน่วยงานเพื่อพิจารณา ริบหลักประกันซอง และแจ้งเป็น ผู้ทิ้งงาน ทันที`;
}
