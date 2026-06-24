import {
  EMPTY_STEP9_CONTRACT_SCHEDULE,
  loadStep7FormFromNote,
  loadStep9FormFromNote,
  loadStepDraftFields,
  mergeStep9ScheduleFromSources,
  resolveStep9ContractEndDateISO,
} from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

export const STEP10_GUIDELINE_ACTION_TEXT =
  "ติดตามและบันทึกการส่งมอบงานของคู่สัญญาในแต่ละงวดงานให้ตรงตามกำหนดเวลา พร้อมตรวจสอบรายงานผลการตรวจรับพัสดุของคณะกรรมการให้ถูกต้องครบถ้วนก่อนส่งเบิกจ่าย";

export const STEP10_GUIDELINE_WARNING_AUDIT =
  "หากคู่สัญญาส่งมอบงานเกินกว่ากำหนดเวลาประจำงวด บังคับคิดค่าปรับรายวันตามกฎหมายทันทีโดยคำนวณเป็นวันปฏิทิน (รวมวันหยุด) ห้ามละเว้นเด็ดขาด ทั้งนี้สำหรับงานก่อสร้างต้องคิดค่าปรับจากวงเงินรวมทั้งสัญญา และต้องตรวจสอบให้คณะกรรมการตรวจรับพัสดุเซ็นชื่อครบถ้วน พร้อมแนบภาพถ่ายหน้างานจริงทุกงวดงาน สำหรับงานก่อสร้าง คณะกรรมการตรวจรับพัสดุต้องถือรายงานของผู้ควบคุมงานก่อสร้างประกอบการพิจารณาตรวจรับทุกงวดงาน (ตามระเบียบฯ ข้อ 176)";

export const STEP10_SCHEDULE_INCOMPLETE_MSG =
  "กรุณาบันทึกวันเริ่มต้นและวันสิ้นสุดสัญญาในขั้นตอนที่ 9 ก่อน — ระบบจะแสดงกรอบเวลารวมของโครงการให้อัตโนมัติ";

export const STEP10_PENALTY_RATE_GENERAL_DEFAULT = 0.1;
export const STEP10_PENALTY_RATE_CONSTRUCTION_DEFAULT = 0.01;
export const STEP10_PENALTY_RATE_CONSTRUCTION_MIN = 0.01;
export const STEP10_PENALTY_RATE_CONSTRUCTION_MAX = 0.1;
export const STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT = 100;

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

/** วันสิ้นสุดสัญญาตัวจริง — จาก Step 9 */
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

  const computed = resolveStep9ContractEndDateISO(schedule);
  if (computed) return computed;

  return loadStepDraftFields(step9).dueDate?.trim() ?? "";
}

/** วันเริ่มต้นสัญญาจาก Step 9 */
export function resolveProjectContractStartDate(steps: StepLike[]): string {
  const step9 = steps.find((s) => s.step_number === 9);
  if (!step9) return "";
  const schedule = loadStep9FormFromNote(step9.note).contractSchedule;
  return schedule?.work_start_date?.trim() ?? "";
}

export type Step10ContractStatus = {
  endISO: string;
  isOverdue: boolean;
  daysRemaining: number | null;
  daysOverdue: number | null;
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
      statusText,
    };
  }

  return {
    endISO: contractEndISO,
    isOverdue: true,
    daysRemaining: null,
    daysOverdue: diffDays,
    statusText: `เกินกำหนดสัญญา ${diffDays} วันปฏิทิน (นับรวมวันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์)`,
  };
}
