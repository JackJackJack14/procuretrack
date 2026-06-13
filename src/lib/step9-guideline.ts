import { loadStep8FormFromNote } from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

/** ระยะประกาศสาระสำคัญใน e-GP — ข้อ 162 (วันปฏิทิน รวมวันหยุดราชการ) */
export const STEP9_EGP_DEADLINE_CALENDAR_DAYS = 15;

export const STEP9_GUIDELINE_TODO = [
  "นำรายละเอียดจากเล่มสัญญาที่ลงนามเสร็จใน Step 8 มาบันทึกและประกาศสาระสำคัญสัญญาในระบบ e-GP",
  "บันทึกกำหนดการงวดงาน และนำเข้าแผนปฏิบัติการก่อสร้าง (Gantt Chart) เข้าสู่ระบบ",
  "จัดทำหนังสือแจ้งให้ผู้รับจ้างเข้าปฏิบัติงานตามกำหนด (Notice to Proceed)",
] as const;

export const STEP9_GUIDELINE_DURATION_REG162 = [
  'บังคับต้องบันทึกประกาศสาระสำคัญในระบบ e-GP "ภายใน 15 วัน" นับแต่วันที่ลงนามในสัญญา (นับรวมวันหยุดราชการ / วันปฏิทิน)',
] as const;

export const STEP9_GUIDELINE_WARNING =
  "ห้ามดองเรื่องคีย์ข้อมูลสาระสำคัญจนเกิน 15 วันปฏิทินนับจากวันเซ็นสัญญาเด็ดขาด วันครบกำหนดสัญญาในขั้นตอนนี้จะถูกนำไปใช้จับตาตรวจสอบการส่งมอบงานบน Dashboard ส่วนกลาง";

function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** บวกวันปฏิทินตรงๆ — ไม่ตัดวันหยุดราชการ (ข้อ 162) */
export function addCalendarDaysISO(iso: string, days: number): string | null {
  const start = parseLocalISODate(iso);
  if (!start || days < 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return toLocalISO(end);
}

/** เดดไลน์คีย์ e-GP สาระสำคัญ — วันลงนามสัญญา + 15 วันปฏิทิน */
export function computeStep9EgpDeadlineISO(contractSignedISO: string): string | null {
  const signed = contractSignedISO?.trim();
  if (!signed) return null;
  return addCalendarDaysISO(signed, STEP9_EGP_DEADLINE_CALENDAR_DAYS);
}

/** วันที่ประกาศสาระสำคัญเกินเดดไลน์ข้อ 162 */
export function isStep9EgpPublicationTooLate(
  publicationISO: string,
  contractSignedISO: string,
): boolean {
  const pub = publicationISO?.trim() ?? "";
  const signed = contractSignedISO?.trim() ?? "";
  if (!pub || !signed) return false;
  const deadline = computeStep9EgpDeadlineISO(signed);
  if (!deadline) return false;
  return pub > deadline;
}

export function getStep9EgpPublicationTooLateMsg(deadlineISO: string): string {
  return `❌ วันที่ประกาศสาระสำคัญใน e-GP ต้องไม่เกิน ${STEP9_EGP_DEADLINE_CALENDAR_DAYS} วันปฏิทินนับจากวันลงนามในสัญญา (เดดไลน์: ${formatThaiDateSlash(deadlineISO)})`;
}

/** วันลงนามสัญญาจริง — จากคอลัมน์ projects หรือ note ขั้นตอนที่ 8 */
export function resolveProjectContractSignedDate(
  project: { contract_signed_date?: string | null } | null,
  step8Note: string | null,
): string {
  const fromColumn = project?.contract_signed_date?.trim();
  if (fromColumn) return fromColumn;
  const step8 = loadStep8FormFromNote(step8Note);
  return step8.contractExecution?.contract_signed_date?.trim() ?? "";
}
