import { isISODateBefore, type Step7ContractNotice } from "@/lib/step-form";
import { formatThaiDateSlash } from "@/lib/utils";

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

export function resolveStep7EffectiveContractEndDateISO(
  contractEndDateFromProject: string | null | undefined,
  notice: Pick<Step7ContractNotice, "lg_reference_contract_end_date">,
): string {
  const fromProject = contractEndDateFromProject?.trim() ?? "";
  if (fromProject) return fromProject;
  return notice.lg_reference_contract_end_date?.trim() ?? "";
}

export function resolveStep7DefectWarrantyYears(
  notice: Pick<Step7ContractNotice, "defect_warranty_years">,
): number {
  const raw = notice.defect_warranty_years;
  if (raw != null && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  return STEP7_DEFECT_WARRANTY_YEARS_DEFAULT;
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
  contractEndDateFromProject: string | null | undefined,
  notice: Pick<
    Step7ContractNotice,
    "lg_reference_contract_end_date" | "defect_warranty_years"
  >,
): string | null {
  const contractEnd = resolveStep7EffectiveContractEndDateISO(
    contractEndDateFromProject,
    notice,
  );
  if (!contractEnd) return null;
  return computeStep7MinLgExpiryDateISO(
    contractEnd,
    resolveStep7DefectWarrantyYears(notice),
  );
}

export const STEP7_LG_EXPIRY_BEFORE_WARRANTY_END_MSG = (minISO: string) =>
  `❌ วันสิ้นสุดความคุ้มครองต้องไม่น้อยกว่าวันสิ้นสุดการรับประกันผลงาน (${formatThaiDateSlash(minISO)})`;

export const STEP7_LG_MIN_EXPIRY_HELPER_MSG = (minISO: string) =>
  `ℹ️ วันสิ้นสุดความคุ้มครองขั้นต่ำ: ${formatThaiDateSlash(minISO)}`;

export const STEP7_LG_REFERENCE_CONTRACT_END_REQUIRED_MSG =
  "กรุณาระบุวันครบกำหนดส่งมอบงานตามสัญญา เพื่อคำนวณวันสิ้นสุดความคุ้มครองขั้นต่ำ";

export function isStep7LgExpiryBeforeMin(
  lgExpiryISO: string,
  minLgExpiryISO: string,
): boolean {
  const lg = lgExpiryISO?.trim() ?? "";
  const min = minLgExpiryISO?.trim() ?? "";
  if (!lg || !min) return false;
  return isISODateBefore(lg, min);
}
