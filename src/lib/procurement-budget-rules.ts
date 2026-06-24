import { normalizeProcurementMethod } from "@/lib/dynamic-stepper";
import { parseBudgetInput } from "@/lib/step-form";

/** วงเงินสูงสุดที่ใช้วิธีเฉพาะเจาะจง / ห้าม e-bidding ตามระเบียบพัสดุ */
export const PROCUREMENT_LOW_BUDGET_THRESHOLD = 500_000;

export const STEP1_LOW_BUDGET_EBIDDING_BLOCKED_MSG =
  "❌ วงเงินงบประมาณไม่เกิน 500,000 บาท ไม่สามารถจัดซื้อจัดจ้างด้วยวิธี e-bidding ได้ตามระเบียบพัสดุฯ โปรดเปลี่ยนเป็นวิธีเฉพาะเจาะจง";

const LOW_BUDGET_BLOCKED_RAW = new Set(["e_bidding", "e_market", "selection"]);

export function parseProcurementBudgetAmount(
  budget: string | number | null | undefined,
): number {
  if (typeof budget === "number") {
    return Number.isFinite(budget) ? budget : 0;
  }
  return parseBudgetInput(budget ?? "");
}

export function isLowBudgetProcurement(budget: number): boolean {
  return budget > 0 && budget <= PROCUREMENT_LOW_BUDGET_THRESHOLD;
}

export function isProcurementMethodBlockedForLowBudget(
  method: string | null | undefined,
): boolean {
  const raw = method?.trim().toLowerCase() ?? "";
  if (LOW_BUDGET_BLOCKED_RAW.has(raw)) return true;
  const normalized = normalizeProcurementMethod(method);
  return normalized === "e_bidding" || normalized === "selection";
}

export function isLowBudgetElectronicMethodConflict(
  budget: string | number | null | undefined,
  method: string | null | undefined,
): boolean {
  const amount = parseProcurementBudgetAmount(budget);
  if (!isLowBudgetProcurement(amount)) return false;
  return isProcurementMethodBlockedForLowBudget(method);
}

/** บังคับวิธีเฉพาะเจาะจงเมื่อวงเงิน ≤ 500,000 และเลือกวิธีอิเล็กทรอนิกส์ */
export function coerceProcurementMethodForBudget(
  budget: string | number | null | undefined,
  method: string,
): string {
  if (isLowBudgetElectronicMethodConflict(budget, method)) {
    return "specific";
  }
  return method;
}
