import { isExternalProcurement } from "@/lib/procurement-path";
export const WORKFLOW_TOTAL_STEPS = 10;

/** ข้อความแจ้งเตือนเมื่อพยายามข้ามขั้นตอน — Strict Sequential Mode (ทุกโครงการ) */
export const STRICT_SEQUENTIAL_NAVIGATION_MSG =
  "กรุณาดำเนินการตามลำดับขั้นตอน เพื่อความถูกต้องตามระเบียบพัสดุ";

/** ขั้นตอน UI อยู่เหนือความคืบหน้าปัจจุบัน — ห้ามคลิกข้ามล่วงหน้า */
export function isWorkflowUiStepForwardLocked(
  targetUiStep: number,
  maxAllowedUiStep: number,
): boolean {
  return targetUiStep > maxAllowedUiStep;
}

/**
 * นำทางผ่าน Stepper ได้หรือไม่ — Strict Sequential
 * อนุญาตเฉพาะขั้นตอนที่ ≤ ความคืบหน้าปัจจุบัน (ย้อนกลับดูข้อมูลเก่าได้)
 * ห้ามข้ามไปขั้นล่วงหน้า — ต้องใช้ปุ่ม «บันทึกและไปขั้นตอนถัดไป» เท่านั้น
 */
export function canNavigateToWorkflowUiStep(
  targetUiStep: number,
  maxAllowedUiStep: number,
  totalUiSteps: number,
): boolean {
  if (targetUiStep < 1 || targetUiStep > totalUiSteps) return false;
  return !isWorkflowUiStepForwardLocked(targetUiStep, maxAllowedUiStep);
}

/** @deprecated ใช้ isWorkflowUiStepForwardLocked — คงไว้เพื่อ backward compat */
export function isStepForwardLocked(
  targetStep: number,
  currentWorkflowStep: number,
  _procurementPath?: string | null,
): boolean {
  return targetStep > currentWorkflowStep;
}

/** ขั้นที่อยู่เหนือ activeStep — ห้ามคลิกจากแถบ Stepper (Strict Active-View Forward Lock) */
export function isStepBeyondActiveView(
  targetStep: number,
  activeStep: number,
): boolean {
  return targetStep > activeStep;
}

export function canClickStepperTab(
  targetStep: number,
  workflowStep: number,
  _procurementPath?: string | null,
): boolean {
  return canNavigateToStep(targetStep, workflowStep);
}

/** คลิกได้ตาม workflowStep ใน DB — Strict Sequential (ไม่มีข้อยกเว้น external) */
export function canNavigateToStep(
  targetStep: number,
  currentWorkflowStep: number,
  _procurementPath?: string | null,
): boolean {
  if (targetStep < 1 || targetStep > WORKFLOW_TOTAL_STEPS) return false;
  return !isStepForwardLocked(targetStep, currentWorkflowStep);
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
  _procurementPath?: string | null,
): StepWorkflowMode {
  if (isActiveWorkflowStep(viewedStep, currentWorkflowStep)) return "current";
  if (isHistoricalStepView(viewedStep, currentWorkflowStep)) {
    return historicalEditUnlocked ? "historical_edit" : "historical_readonly";
  }
  if (viewedStep > currentWorkflowStep) {
    return "historical_readonly";
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

/** กำลังดูขั้นตอนที่ผ่านมาแล้ว (โหมดย้อนหลัง) */
export function isHistoricalWorkflowMode(mode: StepWorkflowMode): boolean {
  return mode === "historical_readonly" || mode === "historical_edit";
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
