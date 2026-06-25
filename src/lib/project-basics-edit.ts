import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isSpecificMethodShortWorkflow,
  normalizeProcurementMethod,
  SPECIFIC_METHOD_BACKEND_STEPS,
} from "@/lib/dynamic-stepper";
import {
  getPreviousStepReopenPatch,
  getProcurementStepColumnAvailability,
  getStepRollbackProcurementStepWipe,
  getStepRollbackProjectWipe,
  updateProcurementStepWithSchemaFallback,
  updateProjectWithSchemaFallback,
} from "@/lib/step-rollback";
import { STEP2_COMMITTEE_DB_TYPES } from "@/lib/step-form";
import { decrementStorageUsage } from "@/lib/storage";

/** ข้อความยืนยันก่อนถอยกลับเพื่อแก้ไขข้อมูลสาระสำคัญ */
export const ROLLBACK_TO_EDIT_PROJECT_CONFIRM_MSG =
  "การแก้ไขสาระสำคัญจะทำให้ข้อมูลในขั้นตอนที่ 2-5 ถูกรีเซ็ตใหม่ทั้งหมด คุณยืนยันหรือไม่?";

export const STEP_NEEDS_REVIEW_AFTER_CRITICAL_EDIT_NOTE =
  "ต้องการตรวจสอบใหม่ — มีการแก้ไขข้อมูลสาระสำคัญขั้นตอนที่ 1";

export type CriticalProjectSnapshot = {
  budget: number;
  method: string;
};

export type WorkflowAuditAction =
  | "rollback_to_edit_basics"
  | "critical_fields_saved_reset";

export type WorkflowAuditEntry = {
  projectId: string;
  organizationId: string;
  action: WorkflowAuditAction;
  performedBy: string;
  performerName: string;
  details?: Record<string, unknown>;
};

type StepRow = { id: string; step_number: number };
type DocRow = {
  step_number: number | null;
  storage_path: string;
  file_size: number | null;
};

/** แก้ไขสาระสำคัญได้เฉพาะขณะอยู่ขั้นตอนที่ 1 (backend) */
export function canEditCriticalProjectFieldsOnCurrentStep(
  backendCurrentStep: number,
): boolean {
  return backendCurrentStep <= 1;
}

export function shouldShowRollbackToEditProjectButton(
  backendCurrentStep: number,
): boolean {
  return backendCurrentStep > 1;
}

/** ขั้น backend ที่ต้องรีเซ็ตเมื่อแก้ไขสาระสำคัญ (ขั้นตอน UI 2–5) */
export function getDownstreamResetBackendSteps(
  method: string | null | undefined,
  currentBackendStep?: number,
): number[] {
  const uiMapped = isSpecificMethodShortWorkflow(method)
    ? SPECIFIC_METHOD_BACKEND_STEPS.filter((s) => s > 1)
    : [2, 3, 4, 5];

  if (!currentBackendStep || currentBackendStep <= 5) {
    return [...uiMapped];
  }

  const extra: number[] = [];
  for (let s = 6; s <= currentBackendStep; s++) {
    if (!uiMapped.includes(s)) extra.push(s);
  }
  return [...uiMapped, ...extra].sort((a, b) => a - b);
}

export function hasCriticalProjectFieldChanges(
  before: CriticalProjectSnapshot,
  after: CriticalProjectSnapshot,
): boolean {
  return (
    Number(before.budget) !== Number(after.budget) ||
    normalizeProcurementMethod(before.method) !==
      normalizeProcurementMethod(after.method)
  );
}

function downstreamStepResetPatch(
  stepNumber: number,
  availability: Awaited<ReturnType<typeof getProcurementStepColumnAvailability>>,
) {
  const wipe = getStepRollbackProcurementStepWipe(stepNumber, availability);
  const patch: Record<string, unknown> = {
    ...wipe,
    status: "pending",
  };

  if (availability.step_notes) {
    patch.step_notes = STEP_NEEDS_REVIEW_AFTER_CRITICAL_EDIT_NOTE;
  } else {
    patch.note = STEP_NEEDS_REVIEW_AFTER_CRITICAL_EDIT_NOTE;
  }

  return patch;
}

/** ล้างเอกสารของขั้นที่ถูกรีเซ็ต */
async function deleteStepDocuments(
  supabase: SupabaseClient,
  projectId: string,
  organizationId: string,
  stepNumber: number,
  docs: DocRow[],
): Promise<void> {
  const stepDocs = docs.filter((d) => d.step_number === stepNumber);
  if (stepDocs.length === 0) return;

  const paths = stepDocs.map((d) => d.storage_path);
  const { error: storageErr } = await supabase.storage
    .from("procurement-docs")
    .remove(paths);
  if (storageErr) {
    console.warn("[BasicsEdit] storage delete partial fail", storageErr);
  }

  const totalBytes = stepDocs.reduce((sum, d) => sum + Number(d.file_size ?? 0), 0);
  if (totalBytes > 0) {
    await decrementStorageUsage(organizationId, totalBytes);
  }

  const { error: docErr } = await supabase
    .from("documents")
    .delete()
    .eq("project_id", projectId)
    .eq("step_number", stepNumber);
  if (docErr) throw new Error(docErr.message);
}

/**
 * รีเซ็ตขั้นตอนถัดจากขั้นที่ 1 — ใช้หลังแก้ไขสาระสำคัญหรือถอยกลับเพื่อแก้ไข
 */
export async function resetDownstreamWorkflowSteps(params: {
  supabase: SupabaseClient;
  projectId: string;
  organizationId: string;
  method: string;
  steps: StepRow[];
  docs: DocRow[];
  backendStepsToReset: number[];
}): Promise<{
  error?: string;
  projectFieldWipe: Record<string, unknown>;
}> {
  const { supabase, projectId, organizationId, steps, docs, backendStepsToReset } =
    params;

  let projectFieldWipe: Record<string, unknown> = {};

  try {
    const columnAvailability = await getProcurementStepColumnAvailability(supabase);

    if (backendStepsToReset.includes(2)) {
      const { error: committeeErr } = await supabase
        .from("committees")
        .delete()
        .eq("project_id", projectId)
        .in("committee_type", [...STEP2_COMMITTEE_DB_TYPES]);
      if (committeeErr) {
        console.warn("[BasicsEdit] committees delete failed", committeeErr);
      }
    }

    for (const stepNum of backendStepsToReset) {
      await deleteStepDocuments(supabase, projectId, organizationId, stepNum, docs);

      const stepRecord = steps.find((s) => s.step_number === stepNum);
      if (stepRecord) {
        const wipePayload = downstreamStepResetPatch(stepNum, columnAvailability);
        const wipeResult = await updateProcurementStepWithSchemaFallback(
          supabase,
          stepRecord.id,
          wipePayload,
        );
        if (wipeResult.error) throw new Error(wipeResult.error);
      }

      projectFieldWipe = {
        ...projectFieldWipe,
        ...getStepRollbackProjectWipe(stepNum),
      };
    }

    return { projectFieldWipe };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "รีเซ็ตขั้นตอนถัดไปไม่สำเร็จ";
    return { error: message, projectFieldWipe: {} };
  }
}

/** บันทึก Audit — ใครสั่งถอย/แก้ไขสาระสำคัญ เมื่อไหร่ */
export async function logProjectWorkflowAudit(
  supabase: SupabaseClient,
  entry: WorkflowAuditEntry,
): Promise<void> {
  const row = {
    project_id: entry.projectId,
    organization_id: entry.organizationId,
    action: entry.action,
    performed_by: entry.performedBy,
    performer_name: entry.performerName,
    performed_at: new Date().toISOString(),
    details: entry.details ?? {},
  };

  const { error } = await supabase.from("project_workflow_audit_logs").insert(row);
  if (error) {
    console.warn("[Workflow Audit] DB insert failed — logged to console", row, error.message);
  } else {
    console.info("[Workflow Audit]", row);
  }
}

export async function resolvePerformerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; name: string }> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  return {
    id: userId,
    name: data?.full_name?.trim() || userId,
  };
}

/** ถอยโครงการกลับขั้นตอนที่ 1 เพื่อแก้ไขสาระสำคัญ + รีเซ็ตขั้น 2-5 */
export async function rollbackProjectToBasicsEdit(params: {
  supabase: SupabaseClient;
  projectId: string;
  organizationId: string;
  method: string;
  currentBackendStep: number;
  steps: StepRow[];
  docs: DocRow[];
  performer: { id: string; name: string };
}): Promise<{ error?: string }> {
  const backendStepsToReset = getDownstreamResetBackendSteps(
    params.method,
    params.currentBackendStep,
  );

  const resetResult = await resetDownstreamWorkflowSteps({
    supabase: params.supabase,
    projectId: params.projectId,
    organizationId: params.organizationId,
    method: params.method,
    steps: params.steps,
    docs: params.docs,
    backendStepsToReset,
  });

  if (resetResult.error) {
    return { error: resetResult.error };
  }

  const projectFieldWipe = resetResult.projectFieldWipe;

  const step1 = params.steps.find((s) => s.step_number === 1);
  if (step1) {
    const reopenResult = await updateProcurementStepWithSchemaFallback(
      params.supabase,
      step1.id,
      getPreviousStepReopenPatch(),
    );
    if (reopenResult.error) return { error: reopenResult.error };
  }

  const projectUpdateResult = await updateProjectWithSchemaFallback(
    params.supabase,
    params.projectId,
    {
      current_step: 1,
      status: "active",
      ...projectFieldWipe,
    },
  );
  if (projectUpdateResult.error) return { error: projectUpdateResult.error };

  await logProjectWorkflowAudit(params.supabase, {
    projectId: params.projectId,
    organizationId: params.organizationId,
    action: "rollback_to_edit_basics",
    performedBy: params.performer.id,
    performerName: params.performer.name,
    details: {
      from_step: params.currentBackendStep,
      reset_steps: backendStepsToReset,
    },
  });

  return {};
}
