import { clampStep, EGP_MILESTONES, EGP_MILESTONE_SHORT } from "@/lib/egp-milestones";
import { isExternalProcurement } from "@/lib/procurement-path";

/** วิธีเฉพาะเจาะจง — แสดง 5 ขั้นตอนบน UI แต่บันทึกลง procurement_steps เดิม */
export const SPECIFIC_METHOD_STEP_MAP = [
  {
    ui: 1,
    backend: 1,
    title: "เตรียมโครงการและรายงานขอซื้อขอจ้าง",
    short: "เตรียมโครงการ",
  },
  {
    ui: 2,
    backend: 2,
    title: "บันทึกใบเสนอราคา (Quotation)",
    short: "ใบเสนอราคา",
  },
  {
    ui: 3,
    backend: 4,
    title: "รายงานผลการพิจารณาและอนุมัติสั่งซื้อสั่งจ้าง",
    short: "พิจารณา/อนุมัติ",
  },
  {
    ui: 4,
    backend: 5,
    title: "ประกาศผู้ชนะ และ ออกใบสั่งซื้อ/สั่งจ้าง (PO)",
    short: "ผู้ชนะ/PO",
  },
  {
    ui: 5,
    backend: 10,
    title: "บริหารสัญญาและการตรวจรับพัสดุ",
    short: "สัญญา/ตรวจรับ",
  },
] as const;

export const SPECIFIC_METHOD_BACKEND_STEPS = SPECIFIC_METHOD_STEP_MAP.map(
  (s) => s.backend,
);

export type StepperDisplayItem = {
  uiStep: number;
  backendStep: number;
  title: string;
  shortLabel: string;
};

/** แปลงค่า method จาก DB/UI ให้เป็นค่ามาตรฐานเดียวกัน */
export function normalizeProcurementMethod(
  method: string | null | undefined,
): string {
  const raw = method?.trim() ?? "";
  if (!raw) return "e_bidding";
  const lower = raw.toLowerCase();
  if (
    lower === "specific" ||
    lower === "specific_under_500k" ||
    lower === "specific_under_500000" ||
    raw === "วิธีเฉพาะเจาะจง" ||
    raw.includes("เฉพาะเจาะจง")
  ) {
    return "specific";
  }
  if (lower === "e_market") return "selection";
  return raw;
}

export function isSpecificMethodShortWorkflow(
  method: string | null | undefined,
): boolean {
  return normalizeProcurementMethod(method) === "specific";
}

export function getWorkflowDisplayStepCount(
  method: string | null | undefined,
): number {
  return isSpecificMethodShortWorkflow(method) ? SPECIFIC_METHOD_STEP_MAP.length : 10;
}

export function getStepperDisplayItems(
  method: string | null | undefined,
): StepperDisplayItem[] {
  if (isSpecificMethodShortWorkflow(method)) {
    return SPECIFIC_METHOD_STEP_MAP.map((s) => ({
      uiStep: s.ui,
      backendStep: s.backend,
      title: s.title,
      shortLabel: s.short,
    }));
  }
  return EGP_MILESTONES.map((title, i) => ({
    uiStep: i + 1,
    backendStep: i + 1,
    title,
    shortLabel: EGP_MILESTONE_SHORT[i],
  }));
}

export function uiStepToBackendStep(
  uiStep: number,
  method: string | null | undefined,
): number {
  if (!isSpecificMethodShortWorkflow(method)) return clampStep(uiStep);
  const entry = SPECIFIC_METHOD_STEP_MAP.find((s) => s.ui === uiStep);
  return entry?.backend ?? 1;
}

export function backendStepToUiStep(
  backendStep: number,
  method: string | null | undefined,
): number {
  if (!isSpecificMethodShortWorkflow(method)) return clampStep(backendStep);
  let ui = 1;
  for (const entry of SPECIFIC_METHOD_STEP_MAP) {
    if (backendStep >= entry.backend) ui = entry.ui;
  }
  return ui;
}

export function getWorkflowStepTitle(
  uiStep: number,
  method: string | null | undefined,
): string {
  const items = getStepperDisplayItems(method);
  return items.find((i) => i.uiStep === uiStep)?.title ?? `ขั้นตอนที่ ${uiStep}`;
}

export function getNextBackendStepAfterComplete(
  completedBackend: number,
  method: string | null | undefined,
): number {
  if (!isSpecificMethodShortWorkflow(method)) {
    return Math.min(10, completedBackend + 1);
  }
  const idx = SPECIFIC_METHOD_BACKEND_STEPS.indexOf(completedBackend);
  if (idx >= 0 && idx < SPECIFIC_METHOD_BACKEND_STEPS.length - 1) {
    return SPECIFIC_METHOD_BACKEND_STEPS[idx + 1];
  }
  const next = SPECIFIC_METHOD_BACKEND_STEPS.find((s) => s > completedBackend);
  return next ?? 10;
}

export function getPrevBackendStep(
  currentBackend: number,
  method: string | null | undefined,
): number {
  if (!isSpecificMethodShortWorkflow(method)) {
    return Math.max(1, currentBackend - 1);
  }
  const idx = SPECIFIC_METHOD_BACKEND_STEPS.indexOf(currentBackend);
  if (idx > 0) return SPECIFIC_METHOD_BACKEND_STEPS[idx - 1];
  for (let i = SPECIFIC_METHOD_BACKEND_STEPS.length - 1; i >= 0; i--) {
    if (SPECIFIC_METHOD_BACKEND_STEPS[i] < currentBackend) {
      return SPECIFIC_METHOD_BACKEND_STEPS[i];
    }
  }
  return 1;
}

/** ขั้น backend ที่ต้อง mark completed อัตโนมัติเมื่อข้ามจากขั้นปัจจุบัน */
export function getBackendStepsSkippedOnAdvance(
  fromBackend: number,
  method: string | null | undefined,
): number[] {
  const next = getNextBackendStepAfterComplete(fromBackend, method);
  if (next <= fromBackend + 1) return [];
  const skipped: number[] = [];
  for (let s = fromBackend + 1; s < next; s++) skipped.push(s);
  return skipped;
}

export function isBackendStepHiddenInShortWorkflow(
  backendStep: number,
  method: string | null | undefined,
): boolean {
  if (!isSpecificMethodShortWorkflow(method)) return false;
  return !SPECIFIC_METHOD_BACKEND_STEPS.includes(
    backendStep as (typeof SPECIFIC_METHOD_BACKEND_STEPS)[number],
  );
}

export function canNavigateToUiStep(
  targetUiStep: number,
  currentBackendStep: number,
  method: string | null | undefined,
  procurementPath?: string | null,
): boolean {
  const total = getWorkflowDisplayStepCount(method);
  if (targetUiStep < 1 || targetUiStep > total) return false;
  if (isExternalProcurement(procurementPath)) return true;
  const workflowUi = backendStepToUiStep(currentBackendStep, method);
  return targetUiStep <= workflowUi;
}
