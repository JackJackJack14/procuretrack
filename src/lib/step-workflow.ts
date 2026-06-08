/** จำนวนขั้นตอน e-GP มาตรฐาน */
export const WORKFLOW_TOTAL_STEPS = 10;

/** ขั้นตอนที่ยังล็อก — ห้ามคลิกข้ามไปข้างหน้า (Strict Sequential Forward Lock) */
export function isStepForwardLocked(
  targetStep: number,
  currentWorkflowStep: number,
): boolean {
  return targetStep > currentWorkflowStep;
}

/** คลิกได้: ขั้นที่ทำเสร็จแล้ว + ขั้นปัจจุบัน (ห้ามล่วงหน้า) */
export function canNavigateToStep(
  targetStep: number,
  currentWorkflowStep: number,
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
): StepWorkflowMode {
  if (isActiveWorkflowStep(viewedStep, currentWorkflowStep)) return "current";
  if (isHistoricalStepView(viewedStep, currentWorkflowStep)) {
    return historicalEditUnlocked ? "historical_edit" : "historical_readonly";
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
): boolean {
  return (
    isActiveWorkflowStep(viewedStep, currentWorkflowStep) &&
    stepStatus !== "completed"
  );
}

export function canSaveHistoricalEdit(mode: StepWorkflowMode): boolean {
  return mode === "historical_edit";
}

/** ปุ่มย้อนกลับ (Hard Rollback) — เฉพาะขั้นตอนปัจจุบันที่กำลังทำ (ไม่ใช่โหมดดูย้อนหลัง) */
export function canRollbackWorkflowStep(
  viewedStep: number,
  currentWorkflowStep: number,
): boolean {
  return viewedStep === currentWorkflowStep && viewedStep > 1;
}
