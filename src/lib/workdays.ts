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

  // ปี พ.ศ. 2569 (ค.ศ. 2026) — วันหยุดราชการตามประกาศ สลค./มติ ครม.
  // รวมวันหยุดชดเชยและวันหยุดพิเศษ 2 ม.ค. (ไม่รวม 2 มิ.ย. และ 31 ก.ค. ที่ครม.ถอนออก)
  // วันพุทธ/จันทรคติ + วันหยุดคงที่ (01-01, 04-06, สงกรานต์ ฯลฯ) อยู่ใน fixedHolidays ด้านบน
  const holidays2026 = [
    "2026-01-02", // วันหยุดราชการเพิ่มเป็นกรณีพิเศษ (ปีใหม่)
    "2026-03-03", // วันมาฆบูชา
    "2026-05-13", // วันพระราชพิธีพืชมงคล (หยุดเฉพาะหน่วยงานราชการ)
    "2026-05-31", // วันวิสาขบูชา (อาทิตย์)
    "2026-06-01", // ชดเชยวันวิสาขบูชา
    "2026-07-29", // วันอาสาฬหบูชา
    "2026-07-30", // วันเข้าพรรษา
    "2026-10-13", // วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาถธำรงเจ้าอยู่หัว
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

export function toISODate(d: Date): string {
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

export const STEP3_PUBLICATION_BEFORE_APPROVAL_MSG =
  "❌ วันที่เผยแพร่ไม่สามารถก่อนวันที่ได้รับอนุมัติจากหัวหน้าหน่วยงานได้";

export const STEP3_PUBLICATION_EXTENSION_REASON_MSG =
  "กรุณาระบุเหตุผลประกอบการขยายระยะเวลาเผยแพร่เกินเกณฑ์ขั้นต่ำ 3 วันทำการ";

/** วันเริ่มเผยแพร่ต้องไม่ก่อนวันที่หัวหน้าหน่วยงานลงนามอนุมัติ */
export function isPublicationStartOnOrAfterApproval(
  startISO: string,
  approvalISO: string,
): boolean {
  const start = startISO?.trim() ?? "";
  const approval = approvalISO?.trim() ?? "";
  if (!start || !approval) return true;
  return start >= approval;
}

/** วันสิ้นสุดเผยแพร่ขยายเกินเกณฑ์ขั้นต่ำ (start + 3 วันทำการ) */
export function isPublicationEndExtendedBeyondMinimum(
  startISO: string,
  endISO: string,
  workdaysAfter = MIN_DRAFT_PUBLICATION_WORKDAYS,
): boolean {
  const minEnd = defaultPublicationEndISO(startISO, workdaysAfter);
  if (!minEnd || !endISO?.trim()) return false;
  return endISO.trim() > minEnd;
}

/** วันสิ้นสุดเผยแพร่ถูกต้องตามขั้นต่ำ (≥ min วันทำการถัดจากวันเริ่ม) */
export function isPublicationEndValidISO(startISO: string, endISO: string): boolean {
  if (!startISO || !endISO) return false;
  const minEnd = defaultPublicationEndISO(startISO);
  if (!minEnd) return false;
  return endISO >= minEnd;
}

/** ตรวจว่าเป็นวันทำการ (ไม่ใช่เสาร์-อาทิตย์/วันหยุดราชการ) */
export function isWorkdayISO(iso: string): boolean {
  if (!iso.trim()) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  d.setHours(0, 0, 0, 0);
  return isWorkday(d);
}

export const STEP3_PUBLICATION_NON_WORKDAY_MSG =
  "❌ วันที่เผยแพร่ต้องเป็นวันทำการ (ไม่นับเสาร์-อาทิตย์และวันหยุดราชการ)";

/** ตรวจวันเผยแพร่ขั้น 3 ก่อนบันทึก/ปิดขั้นตอน — คืนข้อความ error หรือ null ถ้าผ่าน */
export function validateStep3PublicationDates(
  startISO?: string,
  endISO?: string,
  approvalISO?: string,
  extensionReason?: string,
): string | null {
  const start = startISO?.trim() ?? "";
  const end = endISO?.trim() ?? "";
  const approval = approvalISO?.trim() ?? "";
  if (!start || !end) {
    return "กรุณาระบุวันเริ่มและวันสิ้นสุดการเผยแพร่ร่างประกาศให้ครบ";
  }
  if (approval && !isPublicationStartOnOrAfterApproval(start, approval)) {
    return STEP3_PUBLICATION_BEFORE_APPROVAL_MSG;
  }
  if (!isWorkdayISO(start)) {
    return `${STEP3_PUBLICATION_NON_WORKDAY_MSG} (วันเริ่มเผยแพร่)`;
  }
  if (!isWorkdayISO(end)) {
    return `${STEP3_PUBLICATION_NON_WORKDAY_MSG} (วันสิ้นสุดเผยแพร่)`;
  }
  if (!isPublicationEndValidISO(start, end)) {
    return STEP3_PUBLICATION_END_TOO_SHORT_MSG;
  }
  if (
    isPublicationEndExtendedBeyondMinimum(start, end) &&
    !extensionReason?.trim()
  ) {
    return STEP3_PUBLICATION_EXTENSION_REASON_MSG;
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

/** วันสิ้นสุดการรับซองราคา — วันเริ่ม + N วันทำการถัดจากวันเริ่ม (ไม่นับวันเริ่ม) */
export function bidSubmissionEndAfterPeriodISO(
  bidPeriodStartISO: string,
  workdays: number,
): string {
  if (!bidPeriodStartISO || workdays <= 0) return "";
  return defaultPublicationEndISO(bidPeriodStartISO, workdays);
}

/** วันเดดไลน์พิจารณาผล — วันปิดรับซอง + N วันทำการ (ใช้ addWorkdays ข้ามวันหยุด) */
export function reviewDeadlineISO(bidSubmissionEndISO: string, workdays: number): string {
  if (!bidSubmissionEndISO || workdays <= 0) return "";
  return defaultPublicationEndISO(bidSubmissionEndISO, workdays);
}

/** ระยะพิจารณาผลคณะกรรมการหลังปิดรับซอง — ระเบียบพัสดุ ข้อ 55 */
export const STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END = 1;

export const STEP4_COMMITTEE_REVIEW_REGULATION_NOTE =
  "ภายในวันทำการถัดไปตามระเบียบพัสดุ ข้อ 55";

/** วันเดดไลน์พิจารณาผลคณะกรรมการ — วันสิ้นสุดการยื่นข้อเสนอ + 1 วันทำการ */
export function committeeReviewDeadlineAfterBidEndISO(bidSubmissionEndISO: string): string {
  if (!bidSubmissionEndISO.trim()) return "";
  return defaultPublicationEndISO(
    bidSubmissionEndISO,
    STEP4_COMMITTEE_REVIEW_WORKDAYS_AFTER_BID_END,
  );
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

/** ระยะเวลาอุทธรณ์ — พ.ร.บ. จัดซื้อจัดจ้างฯ มาตรา 117 */
export const APPEAL_PERIOD_WORKDAYS = 7;

/** ระยะออกหนังสือแจ้งทำสัญญา — ระเบียบกระทรวงการคลังฯ ข้อ 161 */
export const CONTRACT_NOTIFICATION_WORKDAYS = 5;

/**
 * ไทม์ไลน์โครงการ — ระยะขั้นต่ำ Fastest Path สำหรับด่านที่ยังไม่มีวันที่จริง (วันทำการ)
 * ใช้กับ addWorkdays() เท่านั้น — ห้ามบวก Calendar Days
 */
export const PROJECT_TIMELINE_ESTIMATE_STEP3_WORKDAYS = MIN_DRAFT_PUBLICATION_WORKDAYS;
export const PROJECT_TIMELINE_ESTIMATE_STEP5_WORKDAYS = 7;
export const PROJECT_TIMELINE_ESTIMATE_STEP6_WORKDAYS = APPEAL_PERIOD_WORKDAYS;
/** รวมขั้นต่ำ 3 วันทำการสำหรับขั้น 7–9 (แบ่ง 1 วันต่อขั้น) */
export const PROJECT_TIMELINE_ESTIMATE_STEP7_9_WORKDAYS_EACH = 1;
/** ระยะรับซองราคาเริ่มต้นเมื่อยังไม่มี committee_review_workdays จากขั้น 3 */
export const PROJECT_TIMELINE_ESTIMATE_STEP4_DEFAULT_BID_WORKDAYS = 5;

/**
 * จำนวนวันทำการขั้นต่ำต่อ Milestone e-GP (10 ขั้น)
 *
 * - ขั้น 1,2,4,5,8,9,10: ไม่ล็อกขั้นต่ำ (คืน 0) — ผู้ใช้กำหนดกำหนดส่งเอง
 * - ขั้น 3: ระยะประกาศ e-bidding ขั้นต่ำตามวงเงิน
 * - ขั้น 6: ระยะอุทธรณ์ 7 วันทำการก่อนทำสัญญา (ข้อ 62)
 * - ขั้น 7: ออกหนังสือแจ้งทำสัญญา 5 วันทำการหลังพ้นอุทธรณ์ (ข้อ 161)
 */
export function getMinDays(method: string, budget: number): StepMinDays {
  const flexibleSteps: StepMinDays = {
    step1: 0,
    step2: 0,
    step4: 0,
    step5: 0,
    step8: 0,
    step9: 0,
    step10: 0,
  };

  /** ข้อ 62 — ระยะอุทธรณ์ก่อนดำเนินการขั้นสัญญา */
  const appealPeriod: StepMinDays = { step6: 7 };

  /** ข้อ 161 — ออกหนังสือแจ้งทำสัญญาหลังพ้นอุทธรณ์ */
  const contractNotification: StepMinDays = { step7: CONTRACT_NOTIFICATION_WORKDAYS };

  if (method === "specific" || budget <= 500_000) {
    return { ...flexibleSteps, step3: 0, ...appealPeriod, ...contractNotification };
  }

  if (method === "selective" || method === "selection") {
    return { ...flexibleSteps, step3: 3, ...appealPeriod, ...contractNotification };
  }

  let step3 = 5;
  if (budget > 50_000_000) step3 = 20;
  else if (budget > 10_000_000) step3 = 12;
  else if (budget > 5_000_000) step3 = 10;

  return { ...flexibleSteps, step3, ...appealPeriod, ...contractNotification };
}

export function getStepMinDays(stepNumber: number, method: string, budget: number): number {
  const key = `step${stepNumber}` as keyof StepMinDays;
  return getMinDays(method, budget)[key] ?? 0;
}

/**
 * วันสิ้นสุดระยะอุทธรณ์ — นับจากวันประกาศผู้ชนะ (ขั้น 5) + 7 วันทำการ
 * ไม่นับวันหยุดราชการ (ใช้ addWorkdays)
 */
export function computeAppealDeadlineISO(winnerAnnouncementISO: string): string {
  const start = parseISODateLocal(winnerAnnouncementISO?.trim() ?? "");
  if (!start || APPEAL_PERIOD_WORKDAYS < 1) return "";
  return toISODate(addWorkdays(start, APPEAL_PERIOD_WORKDAYS));
}

/** วันทำการแรกหลังพ้นระยะอุทธรณ์ — จากวันสิ้นสุดอุทธรณ์ (yyyy-mm-dd) */
export function computeContractEarliestFromAppealDeadlineISO(
  appealDeadlineISO: string,
): string {
  const d = parseISODateLocal(appealDeadlineISO?.trim() ?? "");
  if (!d) return "";
  d.setDate(d.getDate() + 1);
  while (!isWorkday(d)) {
    d.setDate(d.getDate() + 1);
  }
  return toISODate(d);
}

/** วันเริ่มลงนามสัญญาได้ — วันทำการถัดจากวันสิ้นสุดอุทธรณ์ */
export function computeContractEarliestISO(winnerAnnouncementISO: string): string {
  const deadlineISO = computeAppealDeadlineISO(winnerAnnouncementISO);
  if (!deadlineISO) return "";
  return computeContractEarliestFromAppealDeadlineISO(deadlineISO);
}

/**
 * วันลงนาม/ออกหนังสือก่อนพ้นระยะอุทธรณ์ (7 วันทำการจากวันประกาศผล)
 * — ใช้กับขั้นตอนที่ 7 และ 8
 */
export function isContractActionBeforeAppealPeriodEnds(
  actionDateISO: string,
  appealDeadlineISO: string,
): boolean {
  const action = actionDateISO?.trim() ?? "";
  const earliest = computeContractEarliestFromAppealDeadlineISO(appealDeadlineISO);
  if (!action || !earliest) return false;
  return action < earliest;
}

/**
 * เดดไลน์ออกหนังสือแจ้งผู้ชนะมาทำสัญญา
 * นับจากวันสิ้นสุดระยะอุทธรณ์ (Step 6) + 5 วันทำการ ไม่นับวันหยุดราชการ
 */
export function computeContractNotificationDeadlineISO(
  winnerAnnouncementISO: string,
): string {
  const appealDeadlineISO = computeAppealDeadlineISO(winnerAnnouncementISO);
  return computeContractNotificationDeadlineFromAppealISO(appealDeadlineISO);
}

/** เดดไลน์ออกหนังสือแจ้งทำสัญญา — จากวันสิ้นสุดอุทธรณ์ (yyyy-mm-dd) โดยตรง */
export function computeContractNotificationDeadlineFromAppealISO(
  appealDeadlineISO: string,
): string {
  const start = parseISODateLocal(appealDeadlineISO?.trim() ?? "");
  if (!start || CONTRACT_NOTIFICATION_WORKDAYS < 1) return "";
  return toISODate(addWorkdays(start, CONTRACT_NOTIFICATION_WORKDAYS));
}

/** วันที่ออกหนังสือแจ้งเกินเดดไลน์ข้อ 161 */
export function isStep7NotificationLetterTooLate(
  letterDateISO: string,
  notificationDeadlineISO: string,
): boolean {
  const letter = letterDateISO?.trim() ?? "";
  const deadline = notificationDeadlineISO?.trim() ?? "";
  if (!letter || !deadline) return false;
  return letter > deadline;
}
