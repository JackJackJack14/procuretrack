import {
  EXTERNAL_PROCUREMENT_ENTRY_STEP,
  isExternalProcurement,
} from "@/lib/procurement-path";

/** จำนวนขั้นตอน e-GP มาตรฐาน */
export const WORKFLOW_TOTAL_STEPS = 10;

/** ขั้นตอนที่ยังล็อก — ห้ามคลิกข้ามไปข้างหน้า (Strict Sequential Forward Lock) */
export function isStepForwardLocked(
  targetStep: number,
  currentWorkflowStep: number,
  procurementPath?: string | null,
): boolean {
  if (isExternalProcurement(procurementPath)) {
    return false;
  }
  return targetStep > currentWorkflowStep;
}

/** คลิกได้: ขั้นที่ทำเสร็จแล้ว + ขั้นปัจจุบัน (ห้ามล่วงหน้า — ยกเว้นโหมด external) */
export function canNavigateToStep(
  targetStep: number,
  currentWorkflowStep: number,
  procurementPath?: string | null,
): boolean {
  if (targetStep < 1 || targetStep > WORKFLOW_TOTAL_STEPS) return false;
  if (isExternalProcurement(procurementPath)) {
    return true;
  }
  return !isStepForwardLocked(targetStep, currentWorkflowStep, procurementPath);
}

/** กำลังดูขั้นตอนที่ผ่านมาแล้ว (ย้อนหลังจาก current_step) */
export function isHistoricalStepView(
  viewedStep: number,
  currentWorkflowStep: number,
): boolean {
  return viewedStep < currentWorkflowStep;
}

/** ขั้นที่กำลังดำเนินการ — แก้ไขและกดไปขั้นถัดไปได้ */
export function isActiveWorkflowStep(
  viewedStep: number,
  currentWorkflowStep: number,
): boolean {
  return viewedStep === currentWorkflowStep;
}

export type StepWorkflowMode = "current" | "historical_readonly" | "historical_edit";

export function getStepWorkflowMode(
  viewedStep: number,
  currentWorkflowStep: number,
  historicalEditUnlocked: boolean,
  procurementPath?: string | null,
): StepWorkflowMode {
  if (isActiveWorkflowStep(viewedStep, currentWorkflowStep)) return "current";
  if (isHistoricalStepView(viewedStep, currentWorkflowStep)) {
    return historicalEditUnlocked ? "historical_edit" : "historical_readonly";
  }
  if (
    isExternalProcurement(procurementPath) &&
    viewedStep >= EXTERNAL_PROCUREMENT_ENTRY_STEP &&
    viewedStep > currentWorkflowStep
  ) {
    return "current";
  }
  return "current";
}

export function isWorkflowReadOnly(mode: StepWorkflowMode): boolean {
  return mode === "historical_readonly";
}

export function canCompleteWorkflowStep(
  viewedStep: number,
  currentWorkflowStep: number,
  stepStatus: string,
  procurementPath?: string | null,
): boolean {
  if (stepStatus === "completed") return false;
  return isActiveWorkflowStep(viewedStep, currentWorkflowStep);
}

export function canSaveHistoricalEdit(mode: StepWorkflowMode): boolean {
  return mode === "historical_edit";
}

/** ปุ่มย้อนกลับ (Hard Rollback) — เฉพาะขั้นตอนปัจจุบันที่กำลังทำ (ไม่ใช่โหมดดูย้อนหลัง) */
export function canRollbackWorkflowStep(
  viewedStep: number,
  currentWorkflowStep: number,
  procurementPath?: string | null,
): boolean {
  if (isExternalProcurement(procurementPath) && viewedStep <= 7) {
    return false;
  }
  return viewedStep === currentWorkflowStep && viewedStep > 1;
}
