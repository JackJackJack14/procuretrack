import { clampStep, EGP_MILESTONES, EGP_MILESTONE_SHORT } from "@/lib/egp-milestones";
import {
  canNavigateToWorkflowUiStep,
} from "@/lib/step-workflow";

/** วิธีเฉพาะเจาะจง — แสดง 5 ขั้นตอนบน UI แต่บันทึกลง procurement_steps เดิม */
export const SPECIFIC_METHOD_STEP_MAP = [
  {
    ui: 1,
    backend: 1,
    title: "เตรียมโครงการ (บันทึกข้อมูลพื้นฐาน งบประมาณ ประเภทงาน)",
    short: "เตรียมโครงการ",
  },
  {
    ui: 2,
    backend: 2,
    title: "บันทึกผลการสืบราคาและเจรจาต่อรอง (กรอกใบเสนอราคา 3 รายตามสเปกใหม่)",
    short: "สืบราคา/เจรจา",
  },
  {
    ui: 3,
    backend: 4,
    title: "รายงานผลการพิจารณาและอนุมัติสั่งซื้อสั่งจ้าง (ทำเล่มรายงานตามระเบียบข้อ 25)",
    short: "พิจารณา/อนุมัติ",
  },
  {
    ui: 4,
    backend: 5,
    title: "ประกาศผู้ชนะและออกใบสั่งซื้อ/สั่งจ้าง (พิมพ์ใบ PO / ควบคุมงวดงาน)",
    short: "ผู้ชนะ/PO",
  },
  {
    ui: 5,
    backend: 10,
    title: "บริหารสัญญาและการตรวจรับพัสดุ (ส่งมอบงาน ตรวจรับจบโครงการ)",
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

/** ตรวจว่าค่า method (raw จาก DB/Dropdown) คือวิธีเฉพาะเจาะจงหรือไม่ — ใช้ keyword includes เป็นหลัก */
export function methodIndicatesSpecificProcurement(
  method: string | null | undefined,
): boolean {
  if (!method?.trim()) return false;
  const raw = method.trim();
  if (raw.includes("เฉพาะเจาะจง")) return true;
  const lower = raw.toLowerCase();
  return (
    lower === "specific" ||
    lower === "specific_under_500k" ||
    lower === "specific_under_500000" ||
    lower.startsWith("specific")
  );
}

/** ตรวจว่าค่า method คือ e-bidding — ใช้ keyword includes เป็นหลัก */
export function methodIndicatesEBiddingProcurement(
  method: string | null | undefined,
): boolean {
  if (!method?.trim()) return true;
  const raw = method.trim();
  if (methodIndicatesSpecificProcurement(raw)) return false;
  const lower = raw.toLowerCase();
  return (
    raw.includes("e-bidding") ||
    lower === "e_bidding" ||
    lower.includes("ประกวดราคา") ||
    lower.includes("ebidding")
  );
}

/** แปลงค่า method จาก DB/UI ให้เป็นค่ามาตรฐานเดียวกัน */
export function normalizeProcurementMethod(
  method: string | null | undefined,
): string {
  const raw = method?.trim() ?? "";
  if (!raw) return "e_bidding";
  if (methodIndicatesSpecificProcurement(raw)) return "specific";
  const lower = raw.toLowerCase();
  if (lower === "e_market") return "selection";
  if (methodIndicatesEBiddingProcurement(raw)) return "e_bidding";
  if (lower === "selection" || raw.includes("คัดเลือก")) return "selection";
  return raw;
}

export function isSpecificMethodShortWorkflow(
  method: string | null | undefined,
): boolean {
  const raw = method?.trim() ?? "";
  if (raw.includes("เฉพาะเจาะจง")) return true;
  return methodIndicatesSpecificProcurement(method);
}

export function isEBiddingFullWorkflow(
  method: string | null | undefined,
): boolean {
  if (isSpecificMethodShortWorkflow(method)) return false;
  const raw = method?.trim() ?? "";
  if (!raw) return true;
  return methodIndicatesEBiddingProcurement(raw);
}

export function getWorkflowDisplayStepCount(
  method: string | null | undefined,
): number {
  if (isSpecificMethodShortWorkflow(method)) {
    return SPECIFIC_METHOD_STEP_MAP.length;
  }
  return 10;
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
): boolean {
  const total = getWorkflowDisplayStepCount(method);
  const workflowUi = backendStepToUiStep(currentBackendStep, method);
  return canNavigateToWorkflowUiStep(targetUiStep, workflowUi, total);
}

/** ความคืบหน้า % ตามจำนวนขั้นตอนที่แสดง (5 สำหรับเฉพาะเจาะจง / 10 สำหรับ e-bidding) */
export function workflowProgressPercent(
  currentBackendStep: number,
  method: string | null | undefined,
): number {
  const ui = backendStepToUiStep(currentBackendStep, method);
  const total = getWorkflowDisplayStepCount(method);
  return Math.round((ui / total) * 100);
}
