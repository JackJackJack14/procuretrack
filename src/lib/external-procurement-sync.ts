import type { SupabaseClient } from "@supabase/supabase-js";
import { EXTERNAL_PROCUREMENT_ENTRY_STEP } from "@/lib/procurement-path";

/** ข้าม Step 1-8 — ตั้ง current_step = 9 และทำเครื่องหมายขั้นก่อนหน้า completed */
export async function syncExternalProcurementBypass(
  supabase: SupabaseClient,
  projectId: string,
  completedBy: string | null,
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();

  const { error: stepsErr } = await supabase
    .from("procurement_steps")
    .update({
      status: "completed",
      completed_at: now,
      completed_by: completedBy,
    })
    .eq("project_id", projectId)
    .gte("step_number", 1)
    .lte("step_number", EXTERNAL_PROCUREMENT_ENTRY_STEP - 1);

  if (stepsErr) {
    return { error: stepsErr.message };
  }

  const { error: step9Err } = await supabase
    .from("procurement_steps")
    .update({ status: "in_progress" })
    .eq("project_id", projectId)
    .eq("step_number", EXTERNAL_PROCUREMENT_ENTRY_STEP);

  if (step9Err) {
    return { error: step9Err.message };
  }

  const { error: projErr } = await supabase
    .from("projects")
    .update({ current_step: EXTERNAL_PROCUREMENT_ENTRY_STEP })
    .eq("id", projectId);

  return { error: projErr?.message ?? null };
}
