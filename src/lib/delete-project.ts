import { supabase } from "@/integrations/supabase/client";

/** ลบโครงการและข้อมูล workflow ที่ผูกอยู่ (hard delete) */
export async function deleteProjectAndRelatedData(
  projectId: string,
): Promise<{ error: string | null }> {
  const tables = [
    "bidders",
    "committees",
    "documents",
    "construction_reports",
    "contracts",
    "inspections",
    "procurement_steps",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("project_id", projectId);
    if (error && !/does not exist|schema cache/i.test(error.message)) {
      return { error: `${table}: ${error.message}` };
    }
  }

  const { error: projectErr } = await supabase.from("projects").delete().eq("id", projectId);
  if (projectErr) {
    return { error: projectErr.message };
  }

  return { error: null };
}
