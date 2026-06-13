import {
  computeStep9ContractEndDateISO,
  EMPTY_STEP9_CONTRACT_SCHEDULE,
  loadStep7FormFromNote,
  loadStep9FormFromNote,
  loadStepDraftFields,
  mergeStep9ScheduleFromSources,
} from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

export const STEP10_GUIDELINE_TODO = [
  "บันทึกรายงานประจำวันของผู้ควบคุมงาน (ช่างคุมงานต้องอัปเดต % ความคืบหน้าจริงหน้างานทุกวัน)",
  "เมื่อผู้รับจ้างส่งงวดงาน คณะกรรมการต้องลงพื้นที่ตรวจรับและทำรายงานผลภายในกำหนดวันทำการ",
  "ตรวจสอบสถานะการงด/ลดค่าปรับ หรือการขยายเวลาสัญญา (ถ้ามี)",
  "เมื่อส่งมอบงานงวดสุดท้ายและหมดระยะเวลาประกันความชำรุดบกพร่อง (ปกติ 2 ปี) ให้ทำเรื่องคืนหลักประกันสัญญา",
] as const;

export const STEP10_GUIDELINE_DURATION_REG176 = [
  'ผู้ควบคุมงาน: บันทึกรายงานผลหน้างาน เสนอประธานกรรมการ "ทุกวันทำการ"',
  "คณะกรรมการตรวจรับ: ต้องทำการตรวจรับให้เสร็จสิ้นโดยเร็ว (ตามเกณฑ์ปกติภายใน 3-5 วันทำการ นับถัดจากวันที่ผู้รับจ้างส่งมอบงาน)",
] as const;

export const STEP10_GUIDELINE_WARNING =
  'หากผู้รับจ้างส่งงานเกินกำหนดสัญญา ระบบจะคิดค่าปรับรายวันทันทีในอัตรา "ร้อยละ 0.10 ต่อวัน" ของมูลค่าสัญญา — การนับวันปรับให้นับรวมวันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์ด้วย (นับวันปฏิทิน ห้ามหักวันหยุดออกเด็ดขาด)';

export const STEP10_PENALTY_RATE_PERCENT = 0.1;

type StepLike = {
  step_number?: number;
  note: string | null;
  due_date?: string | null;
};

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

export function todayLocalISO(): string {
  const d = new Date();
  return toLocalISO(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** นับวันเสาร์-อาทิตย์ในช่วงวันที่ (รวมปลายทั้งสองด้าน) */
export function countWeekendDaysInclusive(start: Date, end: Date): number {
  const from = start <= end ? new Date(start) : new Date(end);
  const to = start <= end ? new Date(end) : new Date(start);
  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = cursor.getDay();
    if (day === 0 || day === 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export type Step10ContractStatus = {
  endISO: string;
  isOverdue: boolean;
  daysRemaining: number | null;
  daysOverdue: number | null;
  weekendDaysInOverdue: number | null;
  statusText: string;
};

/** สถานะสัญญา — นับถอยหลัง/เกินกำหนดเป็นวันปฏิทิน */
export function computeStep10ContractStatus(
  contractEndISO: string,
  asOfISO: string = todayLocalISO(),
): Step10ContractStatus | null {
  const end = parseLocalISODate(contractEndISO);
  const asOf = parseLocalISODate(asOfISO);
  if (!end || !asOf) return null;

  const diffDays = Math.floor((asOf.getTime() - end.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    const remaining = -diffDays;
    const statusText =
      diffDays === 0
        ? `ครบกำหนดวันนี้ (${formatThaiDateSlash(contractEndISO)}) — ต้องส่งมอบงานภายในวันนี้`
        : `อยู่ระหว่างดำเนินการ — เหลือ ${remaining} วันปฏิทิน ก่อนวันสิ้นสุดสัญญา`;

    return {
      endISO: contractEndISO,
      isOverdue: false,
      daysRemaining: remaining,
      daysOverdue: null,
      weekendDaysInOverdue: null,
      statusText,
    };
  }

  const overdueStart = new Date(end);
  overdueStart.setDate(overdueStart.getDate() + 1);
  const weekendDays = countWeekendDaysInclusive(overdueStart, asOf);

  return {
    endISO: contractEndISO,
    isOverdue: true,
    daysRemaining: null,
    daysOverdue: diffDays,
    weekendDaysInOverdue: weekendDays,
    statusText: `เกินกำหนดสัญญา ${diffDays} วันปฏิทิน (รวมวันเสาร์-อาทิตย์ ${weekendDays} วัน — นับเป็นวันปฏิทินสำหรับค่าปรับ)`,
  };
}

/** วันสิ้นสุดสัญญาตัวจริง — จาก Step 9 (work_start + duration) หรือ due_date ขั้น 9 */
export function resolveProjectContractEndDate(
  steps: StepLike[],
  opts: {
    step7Note?: string | null;
    contractSignedDate?: string | null;
  },
): string {
  const step9 = steps.find((s) => s.step_number === 9);
  if (!step9) return "";

  const step9Form = loadStep9FormFromNote(step9.note);
  const step7Form = loadStep7FormFromNote(opts.step7Note ?? null);
  const schedule = mergeStep9ScheduleFromSources(
    step9Form.contractSchedule ?? { ...EMPTY_STEP9_CONTRACT_SCHEDULE },
    {
      step7NoticeDate: step7Form.contractNotice?.contract_notice_letter_date,
      contractSignedDate: opts.contractSignedDate,
    },
  );

  const computed = computeStep9ContractEndDateISO(
    schedule.work_start_date,
    schedule.contract_duration_days,
  );
  if (computed) return computed;

  return loadStepDraftFields(step9).dueDate?.trim() ?? "";
}
