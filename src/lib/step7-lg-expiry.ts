import {
  addCalendarDaysISO,
  computeStep9ContractDurationDays,
  isISODateBefore,
  type Step7ContractNotice,
} from "@/lib/step-form";
import { formatThaiDateHint } from "@/lib/utils";

/** ระยะรับประกันความชำรุดบกพร่องมาตรฐาน (ปีปฏิทิน) — สอดคล้องขั้นตอนที่ 10 */
export const STEP7_DEFECT_WARRANTY_YEARS_DEFAULT = 2;

function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** บวกจำนวนปีปฏิทินลงในวันที่ ISO (local) */
export function addCalendarYearsISO(startISO: string, years: number): string | null {
  const d = parseLocalISODate(startISO);
  if (!d || !Number.isFinite(years) || years <= 0) return null;
  d.setFullYear(d.getFullYear() + Math.round(years));
  return formatLocalISODate(d);
}

export function resolveStep7DefectWarrantyYears(
  notice: Pick<Step7ContractNotice, "defect_warranty_years">,
): number {
  const raw = notice.defect_warranty_years;
  if (raw != null && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  return STEP7_DEFECT_WARRANTY_YEARS_DEFAULT;
}

/** วันครบกำหนดส่งมอบงาน = วันที่ลงนามในสัญญาจริง + ระยะเวลาดำเนินการ (วันปฏิทิน) */
export function computeStep7ContractEndDateISO(
  signedDateISO: string,
  durationDays: number | null | undefined,
): string | null {
  const signed = signedDateISO?.trim();
  const days = durationDays;
  if (!signed || days == null || !Number.isFinite(days) || days <= 0) return null;
  return addCalendarDaysISO(signed, Math.round(days));
}

export function isStep7ContractDurationReady(
  durationDays: number | null | undefined,
): boolean {
  return durationDays != null && Number.isFinite(durationDays) && durationDays > 0;
}

export function computeStep7ContractEndFromNotice(
  notice: Pick<Step7ContractNotice, "actual_contract_signed_date" | "contract_duration_days">,
): string | null {
  if (!isStep7ContractDurationReady(notice.contract_duration_days)) return null;
  return computeStep7ContractEndDateISO(
    notice.actual_contract_signed_date,
    notice.contract_duration_days,
  );
}

/** Min_LG_Date = วันครบกำหนดส่งมอบงานตามสัญญา + ระยะเวลารับประกันความชำรุดบกพร่อง */
export function computeStep7MinLgExpiryDateISO(
  contractEndISO: string,
  warrantyYears: number,
): string | null {
  const end = contractEndISO?.trim();
  if (!end) return null;
  return addCalendarYearsISO(end, warrantyYears);
}

export function computeStep7MinLgExpiryFromNotice(
  notice: Pick<
    Step7ContractNotice,
    "actual_contract_signed_date" | "contract_duration_days" | "defect_warranty_years"
  >,
): string | null {
  const contractEnd = computeStep7ContractEndFromNotice(notice);
  if (!contractEnd) return null;
  return computeStep7MinLgExpiryDateISO(
    contractEnd,
    resolveStep7DefectWarrantyYears(notice),
  );
}

export const STEP7_CONTRACT_DURATION_REQUIRED_MSG =
  "กรุณาระบุระยะเวลาดำเนินการตามสัญญา (วัน) เพื่อคำนวณวันครบกำหนดส่งมอบงาน";

export const STEP7_CONTRACT_SIGNED_REQUIRED_FOR_LG_MSG =
  "กรุณาระบุวันที่ลงนามในสัญญาจริงก่อนคำนวณวันครบกำหนดส่งมอบงาน";

export const STEP7_LG_EXPIRY_BEFORE_WARRANTY_END_MSG = (minISO: string) =>
  `❌ วันสิ้นสุดความคุ้มครองต้องไม่น้อยกว่าวันสิ้นสุดการรับประกันผลงาน (${formatThaiDateHint(minISO)})`;

export const STEP7_LG_MIN_EXPIRY_HELPER_MSG = (minISO: string) =>
  `ℹ️ วันสิ้นสุดความคุ้มครองขั้นต่ำ: ${formatThaiDateHint(minISO)}`;

/** แสดง helper วันสิ้นสุดความคุ้มครองขั้นต่ำเฉพาะเมื่อระยะเวลาดำเนินการ > 0 และคำนวณวันขั้นต่ำได้ */
export function shouldShowStep7MinLgExpiryHelper(
  durationDays: number | null | undefined,
  minLgExpiryISO: string | null | undefined,
): boolean {
  return isStep7ContractDurationReady(durationDays) && !!minLgExpiryISO?.trim();
}

/** ซิงก์วันสิ้นสุดความคุ้มครอง LG กับขั้นต่ำที่คำนวณได้ — เคลียร์เมื่อยังคำนวณไม่ได้, auto-fill เมื่อว่างหรือต่ำกว่า min */
export function syncStep7LgExpiryWithMin(
  currentExpiryISO: string | null | undefined,
  minLgExpiryISO: string | null | undefined,
): { next: string; changed: boolean } {
  const current = currentExpiryISO?.trim() ?? "";
  const min = minLgExpiryISO?.trim() ?? "";
  if (!min) {
    return { next: "", changed: current !== "" };
  }
  if (!current) {
    return { next: min, changed: true };
  }
  if (isStep7LgExpiryBeforeMin(current, min)) {
    return { next: min, changed: current !== min };
  }
  return { next: current, changed: false };
}

export const STEP7_COMPUTED_CONTRACT_END_HELPER_MSG = (endISO: string) =>
  `วันครบกำหนดส่งมอบงานตามสัญญา (คำนวณอัตโนมัติ): ${formatThaiDateHint(endISO)}`;

export function isStep7LgExpiryBeforeMin(
  lgExpiryISO: string,
  minLgExpiryISO: string,
): boolean {
  const lg = lgExpiryISO?.trim() ?? "";
  const min = minLgExpiryISO?.trim() ?? "";
  if (!lg || !min) return false;
  return isISODateBefore(lg, min);
}

/** แปลง legacy lg_reference_contract_end_date → contract_duration_days */
export function migrateStep7ContractDurationDays(
  raw?: (Partial<Step7ContractNotice> & { lg_reference_contract_end_date?: string }) | null,
): number | null {
  const rawDays = raw?.contract_duration_days;
  if (rawDays != null && Number.isFinite(Number(rawDays)) && Number(rawDays) > 0) {
    return Math.round(Number(rawDays));
  }
  const signed = raw?.actual_contract_signed_date?.trim();
  const legacyEnd = raw?.lg_reference_contract_end_date?.trim();
  if (signed && legacyEnd) {
    const days = computeStep9ContractDurationDays(signed, legacyEnd);
    if (days != null && days > 0) return days;
  }
  return null;
}
