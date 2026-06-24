import {
  methodIndicatesEBiddingProcurement,
  methodIndicatesSpecificProcurement,
  normalizeProcurementMethod,
} from "@/lib/dynamic-stepper";

/** ขั้น backend สูงสุดที่แก้ไขสาระสำคัญได้โดยตรง (ต้องอยู่ขั้นตอนที่ 1) */
export const PROJECT_BASICS_EDIT_MAX_BACKEND_STEP = 1;

/** ปุ่มแก้ไขโครงการ — เปิดใช้เมื่อ current_step = 1 เท่านั้น */
export function canEnableProjectBasicsEditButton(
  backendCurrentStep: number,
): boolean {
  return backendCurrentStep <= PROJECT_BASICS_EDIT_MAX_BACKEND_STEP;
}

export type ProjectBasicsEditSessionState = {
  tab: "detail";
  activeUiStep: 1;
  historicalEditUnlocked: true;
};

/** สร้าง state เริ่มต้นสำหรับโหมดแก้ไขข้อมูลพื้นฐานโครงการ */
export function createProjectBasicsEditSessionState(): ProjectBasicsEditSessionState {
  return {
    tab: "detail",
    activeUiStep: 1,
    historicalEditUnlocked: true,
  };
}

export type WorkflowMethodResolutionInput = {
  projectMethod?: string | null;
  formMethod?: string | null;
  formMethodDirty?: boolean;
  activeUiStep?: number;
};

/**
 * ตัวแปรกลางวิธีจัดซื้อ — ใช้ร่วมกับ Stepper / Timeline / Progress bar
 * บนขั้นตอนที่ 1 ใช้ค่าจากฟอร์มแบบ real-time เมื่อผู้ใช้เปลี่ยน dropdown
 */
export function resolveWorkflowProcurementMethod(
  input: WorkflowMethodResolutionInput,
): string {
  const useFormLive =
    input.activeUiStep === 1 && input.formMethodDirty && input.formMethod;
  const raw = useFormLive
    ? input.formMethod
    : (input.projectMethod ?? input.formMethod);
  return normalizeProcurementMethod(raw);
}

/** ตรวจว่าควรคงโหมดแก้ไขย้อนหลังไว้เมื่อสลับขั้นตอน UI หรือไม่ */
export function shouldPreserveBasicsEditUnlock(
  basicsEditSessionActive: boolean,
  activeUiStep: number,
): boolean {
  return basicsEditSessionActive && activeUiStep <= 2;
}

/** ตรวจ keyword วิธีจัดซื้อแบบ includes — ใช้ก่อน normalize ในจุดที่ต้องการ raw string */
export function procurementMethodKeywordIncludes(
  method: string | null | undefined,
  keyword: "เฉพาะเจาะจง" | "e-bidding",
): boolean {
  const raw = method?.trim() ?? "";
  if (!raw) return keyword === "e-bidding";
  if (keyword === "เฉพาะเจาะจง") {
    return methodIndicatesSpecificProcurement(raw);
  }
  return methodIndicatesEBiddingProcurement(raw);
}

export {
  STRICT_SEQUENTIAL_NAVIGATION_MSG,
  canNavigateToWorkflowUiStep,
  isWorkflowUiStepForwardLocked,
} from "@/lib/step-workflow";
