export function isThaiHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  const fullDateStr = `${year}-${dateStr}`;

  // วันหยุดประจำปี (วันที่คงที่ทุกปี — ไม่รวมวันพุทธศาสนาที่เปลี่ยนตามจันทรคติ)
  const fixedHolidays = [
    "01-01", "04-06",
    "04-13", "04-14", "04-15",
    "05-01", "05-04", "06-03",
    "07-28", "08-12", "10-23",
    "12-05", "12-10", "12-31",
  ];
  if (fixedHolidays.includes(dateStr)) return true;

  // ปี พ.ศ. 2569 (ค.ศ. 2026) — อ้างอิงประกาศ ธปท. / ปฏิทินราชการ
  const holidays2026 = [
    "2026-01-02", // วันหยุดพิเศษปีใหม่
    "2026-03-03", // วันมาฆบูชา
    "2026-05-11", // วันพระราชพิธีพืชมงคล (หน่วยราชการ)
    "2026-05-31", // วันวิสาขบูชา
    "2026-06-01", // ชดเชยวันวิสาขบูชา (ตกวันอาทิตย์)
    "2026-07-29", // วันอาสาฬหบูชา
    "2026-07-30", // วันเข้าพรรษา
    "2026-10-13", // วันคล้ายวันสวรรคต ร.9
    "2026-12-07", // ชดเชยวันพ่อแห่งชาติ (5 ธ.ค. ตกวันเสาร์)
  ];

  // ปี พ.ศ. 2570 (ค.ศ. 2027) — ตามปฏิทินจันทรคติ (อาจมีการประกาศชดเชยเพิ่มเมื่อใกล้ปี)
  const holidays2027 = [
    "2027-02-21", // วันมาฆบูชา
    "2027-02-22", // ชดเชยวันมาฆบูชา
    "2027-05-03", // ชดเชยวันแรงงาน (1 พ.ค. ตกวันเสาร์)
    "2027-05-20", // วันวิสาขบูชา
    "2027-07-18", // วันอาสาฬหบูชา
    "2027-07-19", // ชดเชยวันอาสาฬหบูชา
    "2027-07-20", // วันเข้าพรรษา
    "2027-10-13", // วันคล้ายวันสวรรคต ร.9
    "2027-10-25", // ชดเชยวันปิยมหาราช (23 ต.ค. ตกวันเสาร์)
    "2027-12-06", // ชดเชยวันพ่อแห่งชาติ (5 ธ.ค. ตกวันอาทิตย์)
  ];

  if (year === 2026 && holidays2026.includes(fullDateStr)) return true;
  if (year === 2027 && holidays2027.includes(fullDateStr)) return true;

  return false;
}

export function isWorkday(date: Date): boolean {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  return !isThaiHoliday(date);
}

/** นับวันทำการระหว่างสองวัน (รวมวันเริ่มและวันสิ้นสุด) — ไม่นับเสาร์-อาทิตย์และวันหยุดราชการ */
export function countWorkdaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getTime());
  const end = new Date(endDate.getTime());
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start.getTime());
  while (cursor <= end) {
    if (isWorkday(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** นับจากสตริง yyyy-mm-dd (คืน 0 ถ้าวันที่ไม่ถูกต้อง) */
export function countWorkdaysBetweenISO(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  return countWorkdaysBetween(start, end);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addWorkdays(startDate: Date, days: number): Date {
  const resultDate = new Date(startDate.getTime());
  let addedDays = 0;
  while (addedDays < days) {
    resultDate.setDate(resultDate.getDate() + 1);
    const dayOfWeek = resultDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend && !isThaiHoliday(resultDate)) {
      addedDays++;
    }
  }
  while (
    resultDate.getDay() === 0 ||
    resultDate.getDay() === 6 ||
    isThaiHoliday(resultDate)
  ) {
    resultDate.setDate(resultDate.getDate() + 1);
  }
  return resultDate;
}

/** ระยะเผยแพร่ขั้นต่ำตามระเบียบรับฟังความคิดเห็น (วันทำการถัดจากวันเริ่ม ไม่นับวันเริ่ม) */
export const MIN_DRAFT_PUBLICATION_WORKDAYS = 3;

export const STEP3_PUBLICATION_END_GUIDELINE =
  "เกณฑ์ในการประกาศจะอยู่ที่ไม่น้อยกว่า 3 วันทำการ (ไม่รวมวันหยุดราชการ) โดยระบบจะคำนวณวันสิ้นสุดขั้นต่ำให้โดยอัตโนมัติ ทั้งนี้ เจ้าหน้าที่สามารถขยายระยะเวลาเพิ่มขึ้นได้ตามความเหมาะสม แต่ห้ามปรับลดวันน้อยกว่าเกณฑ์ขั้นต่ำที่ระเบียบกำหนด";

export const STEP3_PUBLICATION_END_TOO_SHORT_MSG =
  "❌ ไม่สามารถเลือกวันทำการน้อยกว่า 3 วันทำการได้ เนื่องจากขัดต่อระเบียบกระทรวงการคลังฯ";

/** วันสิ้นสุดเผยแพร่ถูกต้องตามขั้นต่ำ (≥ min วันทำการถัดจากวันเริ่ม) */
export function isPublicationEndValidISO(startISO: string, endISO: string): boolean {
  if (!startISO || !endISO) return false;
  const minEnd = defaultPublicationEndISO(startISO);
  if (!minEnd) return false;
  return endISO >= minEnd;
}

/** ตรวจวันเผยแพร่ขั้น 3 ก่อนบันทึก/ปิดขั้นตอน — คืนข้อความ error หรือ null ถ้าผ่าน */
export function validateStep3PublicationDates(
  startISO?: string,
  endISO?: string,
): string | null {
  const start = startISO?.trim() ?? "";
  const end = endISO?.trim() ?? "";
  if (!start || !end) {
    return "กรุณาระบุวันเริ่มและวันสิ้นสุดการเผยแพร่ร่างประกาศให้ครบ";
  }
  if (!isPublicationEndValidISO(start, end)) {
    return STEP3_PUBLICATION_END_TOO_SHORT_MSG;
  }
  return null;
}

/**
 * วันสิ้นสุดเผยแพร่เริ่มต้น (yyyy-mm-dd) — นับถัดจากวันเริ่ม minWorkdays วันทำการ (ไม่รวมวันเริ่ม)
 */
export function defaultPublicationEndISO(
  startISO: string,
  workdaysAfter = MIN_DRAFT_PUBLICATION_WORKDAYS,
): string {
  if (!startISO || workdaysAfter < 1) return "";
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return "";
  start.setHours(0, 0, 0, 0);
  return toISODate(addWorkdays(start, workdaysAfter));
}

/** วันเดดไลน์พิจารณาผล — วันปิดรับซอง + N วันทำการ (ใช้ addWorkdays ข้ามวันหยุด) */
export function reviewDeadlineISO(bidSubmissionEndISO: string, workdays: number): string {
  if (!bidSubmissionEndISO || workdays <= 0) return "";
  return defaultPublicationEndISO(bidSubmissionEndISO, workdays);
}

/** @deprecated ใช้ defaultPublicationEndISO แทน */
export function minEndDateForWorkdayCountISO(startISO: string, minWorkdays = 3): string {
  return defaultPublicationEndISO(startISO, minWorkdays);
}

/** นับวันทำการระหว่างวันเริ่มกับวันสิ้นสุด (ไม่นับวันเริ่ม — นับเฉพาะวันถัดไปจนถึงวันสิ้นสุด) */
export function countWorkdaysAfterStartISO(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end <= start) return 0;
  let count = 0;
  const cursor = new Date(start.getTime());
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    if (isWorkday(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function parseISODateLocal(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export type StepMinDays = Partial<Record<
  "step1" | "step2" | "step3" | "step4" | "step5" | "step6" | "step7" | "step8" | "step9" | "step10",
  number
>>;

/**
 * จำนวนวันทำการขั้นต่ำต่อ Milestone e-GP (10 ขั้น)
 *
 * - ขั้น 1,2,4,5,7,8,9,10: ไม่ล็อกขั้นต่ำ (คืน 0) — ผู้ใช้กำหนดกำหนดส่งเอง
 * - ขั้น 3: ระยะประกาศ e-bidding ขั้นต่ำตามวงเงิน
 * - ขั้น 6: ระยะอุทธรณ์ 7 วันทำการก่อนทำสัญญา (ข้อ 62)
 */
export function getMinDays(method: string, budget: number): StepMinDays {
  const flexibleSteps: StepMinDays = {
    step1: 0,
    step2: 0,
    step4: 0,
    step5: 0,
    step7: 0,
    step8: 0,
    step9: 0,
    step10: 0,
  };

  /** ข้อ 62 — ระยะอุทธรณ์ก่อนดำเนินการขั้นสัญญา */
  const appealPeriod: StepMinDays = { step6: 7 };

  if (method === "specific" || budget <= 500_000) {
    return { ...flexibleSteps, step3: 0, ...appealPeriod };
  }

  if (method === "selective" || method === "selection") {
    return { ...flexibleSteps, step3: 3, ...appealPeriod };
  }

  let step3 = 5;
  if (budget > 50_000_000) step3 = 20;
  else if (budget > 10_000_000) step3 = 12;
  else if (budget > 5_000_000) step3 = 10;

  return { ...flexibleSteps, step3, ...appealPeriod };
}

export function getStepMinDays(stepNumber: number, method: string, budget: number): number {
  const key = `step${stepNumber}` as keyof StepMinDays;
  return getMinDays(method, budget)[key] ?? 0;
}
