import { loadStep8FormFromNote } from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

/** ระยะประกาศสาระสำคัญใน e-GP — มาตรา 98 (วันปฏิทิน รวมเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์) */
export const STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS = 30;

/** @deprecated ใช้ STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS */
export const STEP9_EGP_DEADLINE_CALENDAR_DAYS = STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS;

export const STEP9_GUIDELINE_ACTION_ITEMS = [
  "นำรายละเอียดจากสัญญากระดาษที่ลงนามแล้วในขั้นตอนที่ 8 ไปบันทึกข้อมูลเข้าสู่ระบบ e-GP กลางเพื่อออกเลขคุมสัญญาและใบ หส.1",
  "ดาวน์โหลดไฟล์และทำการอัปโหลด [ประกาศสาระสำคัญของสัญญา (แบบ หส.1) (PDF)] เข้าระบบ ProcureTrack เพื่อบันทึกจบขั้นตอน",
] as const;

/** @deprecated ใช้ STEP9_GUIDELINE_ACTION_ITEMS */
export const STEP9_GUIDELINE_TODO = STEP9_GUIDELINE_ACTION_ITEMS;

/** @deprecated */
export const STEP9_GUIDELINE_DURATION_REG162 = [
  `บังคับเผยแพร่สาระสำคัญของสัญญา (หส.1) ลงระบบ e-GP ภายใน ${STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS} วันปฏิทินนับแต่วันที่ทำสัญญา (มาตรา 98)`,
] as const;

export const STEP9_GUIDELINE_ARTICLE_98_WARNING =
  "บังคับเผยแพร่สาระสำคัญของสัญญา (หส.1) ลงระบบ e-GP ภายใน 30 วันนับแต่วันที่ทำสัญญาเด็ดขาด หากเกินกำหนดเวลาถือเป็นการไม่ปฏิบัติตามมาตรา 98 แห่ง พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 ซึ่งมีโทษทางวินัย และบังคับติดอากรแสตมป์ (e-Stamp) ในอัตรา 0.1% ของมูลค่าสัญญาให้เสร็จสิ้นภายใน 15 วันนับถัดจากวันเซ็นสัญญา";

/** @deprecated ใช้ STEP9_GUIDELINE_ARTICLE_98_WARNING */
export const STEP9_GUIDELINE_WARNING = STEP9_GUIDELINE_ARTICLE_98_WARNING;

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

/** บวกวันปฏิทินตรงๆ — ไม่ตัดวันหยุดราชการ (มาตรา 98) */
export function addCalendarDaysISO(iso: string, days: number): string | null {
  const start = parseLocalISODate(iso);
  if (!start || days < 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return toLocalISO(end);
}

/** เดดไลน์ประกาศ หส.1 — วันลงนามสัญญา + 30 วันปฏิทิน */
export function computeStep9EgpDeadlineISO(contractSignedISO: string): string | null {
  const signed = contractSignedISO?.trim();
  if (!signed) return null;
  return addCalendarDaysISO(signed, STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS);
}

/** วันที่ประกาศสาระสำคัญเกินเดดไลน์มาตรา 98 */
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
  return `❌ วันที่ประกาศสาระสำคัญใน e-GP เกินกำหนดมาตรา 98 — ต้องไม่เกิน ${STEP9_ARTICLE_98_DEADLINE_CALENDAR_DAYS} วันปฏิทินนับจากวันลงนามในสัญญา (เดดไลน์: ${formatThaiDateSlash(deadlineISO)})`;
}

export const STEP9_SCHEDULE_INCOMPLETE_MSG =
  "กรุณาบันทึกวันที่ลงนามสัญญาในขั้นตอนที่ 8 ก่อน — ระบบจะคำนวณเดดไลน์มาตรา 98 ให้อัตโนมัติ";

export const STEP9_TIMELINE_NODE2_PENDING = "รอพัสดุระบุวันที่ในฟอร์มด้านล่าง";

export const STEP9_GUIDELINE_TIMELINE_NOTE =
  "นับวันปฏิทินตรงๆ รวมเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์ (มาตรา 98)";

export function formatStep9TimelineNode1Line(signedISO: string): string {
  if (!signedISO?.trim()) return "— บันทึกวันที่ลงนามในขั้นตอนที่ 8 ก่อน —";
  return formatThaiDateSlash(signedISO);
}

export function formatStep9TimelineNode2Line(publicationISO: string): string {
  if (!publicationISO?.trim()) return STEP9_TIMELINE_NODE2_PENDING;
  return formatThaiDateSlash(publicationISO);
}

export function formatStep9TimelineNode3Line(deadlineISO: string): string {
  return formatThaiDateSlash(deadlineISO);
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
