/** ขั้นตอนที่ 6 — อุทธรณ์ (มาตรา 117) — อินโฟกราฟิก 3 การ์ด */

import { addWorkdays, isWorkday, parseISODateLocal, toISODate } from "@/lib/workdays";
import { formatThaiDateHint } from "@/lib/utils";

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

export const STEP6_GUIDELINE_ACTION_ITEMS = [
  "• ตรวจสอบในระบบ e-GP ว่ามีผู้ยื่นอุทธรณ์ผลการจัดซื้อจัดจ้างภายในระยะ 7 วันทำการ นับจากวันที่แจ้งผลให้ผู้เสนอราคาทราบ (ขั้นตอนที่ 5)",
  "• กรณี 'ไม่มีผู้ยื่นอุทธรณ์': บันทึกสถานะในระบบ พร้อมแนบภาพหน้าจอตรวจสอบสถานะอุทธรณ์จาก e-GP (ไม่บังคับ) แล้วดำเนินการไปขั้นตอนที่ 7 — แจ้งให้ผู้ชนะมาลงนามในสัญญา",
  "• กรณี 'มีผู้ยื่นอุทธรณ์': บันทึกชื่อผู้ยื่น วันรับหนังสือ ทำรายงานความเห็นเสนอหัวหน้าหน่วยงานภายใน 5 วันทำการ และหากหัวหน้าหน่วยงานเห็นว่าอุทธรณ์ฟังไม่ขึ้น ให้ส่งรายงานไปยังกรมบัญชีกลางภายใน 3 วันทำการนับจากวันมีคำวินิจฉัย — ห้ามลงนามสัญญาก่อนได้ผล 'อุทธรณ์ฟังไม่ขึ้น'",
] as const;

export const STEP6_GUIDELINE_SCHEDULE_STATIC_ITEMS = [
  "• ระยะอุทธรณ์: 7 วันทำการ นับถัดจากวันที่แจ้งผล (ตาม มาตรา 117)",
  "• กรณีมีผู้ยื่นอุทธรณ์: ต้องทำความเห็นเสนอหัวหน้าหน่วยงานภายใน 5 วันทำการ และรายงานส่งกรมบัญชีกลางภายใน 3 วันทำการ (ตามระเบียบฯ ข้อ 118-119)",
] as const;

/** กรอบเวลาตามระเบียบฯ ข้อ 118-119 */
export const STEP6_HEAD_OPINION_DEADLINE_WORKDAYS = 5;
export const STEP6_CGD_REPORT_AFTER_HEAD_WORKDAYS = 3;

export const STEP6_CGD_LATE_SUBMISSION_MSG =
  "⚠️ หมายเหตุ: วันที่ส่งรายงานเกินกรอบเวลา 3 วันทำการตามระเบียบฯ ข้อ 119 (โปรดเตรียมบันทึกเหตุผลความล่าช้ารองรับการตรวจของ สตง.)";

/** เดดไลน์ทำความเห็นเสนอหัวหน้าหน่วยงาน — นับจากวันรับหนังสืออุทธรณ์ + 5 วันทำการ (ข้อ 118) */
export function computeStep6HeadOpinionDeadlineISO(appealReceivedISO: string): string {
  const start = parseISODateLocal(appealReceivedISO?.trim() ?? "");
  if (!start) return "";
  return toISODate(addWorkdays(start, STEP6_HEAD_OPINION_DEADLINE_WORKDAYS));
}

/** เดดไลน์ส่งรายงานกรมบัญชีกลาง — 3 วันทำการนับจากวันหัวหน้าลงนามวินิจฉัย (ข้อ 119) เท่านั้น */
export function computeStep6CgdReportDeadlineFromHeadSignedISO(
  headSignedISO: string,
): string {
  const start = parseISODateLocal(headSignedISO?.trim() ?? "");
  if (!start) return "";
  return toISODate(addWorkdays(start, STEP6_CGD_REPORT_AFTER_HEAD_WORKDAYS));
}

/** @deprecated ใช้ computeStep6CgdReportDeadlineFromHeadSignedISO */
export function computeStep6CgdReportDeadlineISO(appealReceivedISO: string): string {
  return computeStep6CgdReportDeadlineFromHeadSignedISO(appealReceivedISO);
}

/** วันทำการแรกที่เลือกวันหัวหน้าลงนามได้ — หลังวันรับหนังสืออุทธรณ์ */
export function computeStep6HeadSignedMinDateISO(appealReceivedISO: string): string {
  const received = parseISODateLocal(appealReceivedISO?.trim() ?? "");
  if (!received) return "";
  const d = new Date(received.getTime());
  d.setDate(d.getDate() + 1);
  while (!isWorkday(d)) {
    d.setDate(d.getDate() + 1);
  }
  return toISODate(d);
}

export function isStep6CgdSubmissionBeyondHeadDeadline(
  headSignedISO: string,
  cgdSubmissionISO: string,
): boolean {
  const deadline = computeStep6CgdReportDeadlineFromHeadSignedISO(headSignedISO);
  if (!deadline || !cgdSubmissionISO?.trim()) return false;
  return cgdSubmissionISO.trim() > deadline;
}

export function getStep6HeadOpinionDisplayLine(appealReceivedISO: string): string | null {
  const deadline = computeStep6HeadOpinionDeadlineISO(appealReceivedISO);
  if (!deadline) return null;
  return `⏱️ เดดไลน์ต้องทำความเห็นเสนอหัวหน้าหน่วยงาน (5 วันทำการ): ภายใน ${formatThaiDateHint(deadline)}`;
}

export function getStep6CgdReportDisplayLine(headSignedISO: string): string | null {
  const deadline = computeStep6CgdReportDeadlineFromHeadSignedISO(headSignedISO);
  if (!deadline) return null;
  return `⏱️ เดดไลน์ต้องรายงานส่งกรมบัญชีกลาง (3 วันทำการนับจากวันหัวหน้าลงนาม): ภายใน ${formatThaiDateHint(deadline)}`;
}

export type Step6AppealPendingTimeline = {
  headOpinionDeadlineISO: string;
  cgdReportDeadlineISO: string;
};

export function computeStep6AppealPendingTimeline(
  appealReceivedISO: string,
  headSignedISO?: string,
): Step6AppealPendingTimeline | null {
  const received = appealReceivedISO?.trim() ?? "";
  if (!received) return null;
  const headOpinionDeadlineISO = computeStep6HeadOpinionDeadlineISO(received);
  const signed = headSignedISO?.trim() ?? "";
  const cgdReportDeadlineISO = signed
    ? computeStep6CgdReportDeadlineFromHeadSignedISO(signed)
    : "";
  if (!headOpinionDeadlineISO) return null;
  return { headOpinionDeadlineISO, cgdReportDeadlineISO };
}

export function getStep6AppealPendingTimelineDisplayLines(
  timeline: Step6AppealPendingTimeline | null,
): { headOpinionLine: string; cgdReportLine: string } | null {
  if (!timeline) return null;
  return {
    headOpinionLine: `⏱️ เดดไลน์ต้องทำความเห็นเสนอหัวหน้าหน่วยงาน (5 วันทำการ): ภายใน ${formatThaiDateHint(timeline.headOpinionDeadlineISO)}`,
    cgdReportLine: timeline.cgdReportDeadlineISO
      ? `⏱️ เดดไลน์ต้องรายงานส่งกรมบัญชีกลาง (3 วันทำการนับจากวันหัวหน้าลงนาม): ภายใน ${formatThaiDateHint(timeline.cgdReportDeadlineISO)}`
      : "",
  };
}

export const STEP6_GUIDELINE_WARNING =
  "ห้ามลงนามในสัญญาก่อนพ้นกำหนดระยะเวลาอุทธรณ์ และ/หรือ ก่อนมีผลวินิจฉัย 'อุทธรณ์ฟังไม่ขึ้น' โดยเด็ดขาด หากมีการลงนามก่อนถือว่าสัญญาขัดต่อกฎหมายทันที";

export const STEP6_SCHEDULE_INCOMPLETE_MSG =
  "กรุณาบันทึกวันที่ลงนามในประกาศผู้ชนะในขั้นตอนที่ 5 ก่อน — ระบบจะคำนวณวันสิ้นสุดอุทธรณ์และวันที่เริ่มลงนามในสัญญาได้ให้อัตโนมัติ";

export const STEP6_CONTRACT_EARLIEST_CALC_NOTE =
  "คำนวณเว้นวันหยุดราชการแล้ว";

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
