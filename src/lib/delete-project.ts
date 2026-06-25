import { supabase } from "@/integrations/supabase/client";
import { decrementStorageUsage } from "@/lib/storage";

const CHILD_TABLES = [
  "bidders",
  "committees",
  "documents",
  "construction_reports",
  "contracts",
  "inspections",
  "procurement_steps",
  "project_workflow_audit_logs",
] as const;

function isSkippableChildDeleteError(message: string): boolean {
  return /does not exist|schema cache|permission denied|relation .* does not exist/i.test(
    message,
  );
}

/** ลบไฟล์ใน storage ก่อนลบแถว documents */
async function deleteProjectDocumentFiles(
  projectId: string,
  organizationId: string | null,
): Promise<void> {
  const { data: docs, error } = await supabase
    .from("documents")
    .select("storage_path, file_size")
    .eq("project_id", projectId);

  if (error) {
    if (isSkippableChildDeleteError(error.message)) return;
    throw new Error(error.message);
  }

  if (!docs?.length) return;

  const paths = docs.map((d) => d.storage_path).filter(Boolean);
  if (paths.length > 0) {
    const { error: storageErr } = await supabase.storage
      .from("procurement-docs")
      .remove(paths);
    if (storageErr) {
      console.warn("[DeleteProject] storage remove partial fail", storageErr);
    }
  }

  if (organizationId) {
    const totalBytes = docs.reduce((sum, d) => sum + Number(d.file_size ?? 0), 0);
    if (totalBytes > 0) {
      await decrementStorageUsage(organizationId, totalBytes);
    }
  }
}

/** ลบโครงการและข้อมูล workflow ที่ผูกอยู่ (hard delete) */
export async function deleteProjectAndRelatedData(
  projectId: string,
): Promise<{ error: string | null }> {
  const { data: project, error: projectLoadErr } = await supabase
    .from("projects")
    .select("id, organization_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectLoadErr) {
    return { error: projectLoadErr.message };
  }
  if (!project) {
    return { error: "ไม่พบโครงการ" };
  }

  try {
    await deleteProjectDocumentFiles(projectId, project.organization_id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ลบไฟล์เอกสารไม่สำเร็จ";
    return { error: message };
  }

  for (const table of CHILD_TABLES) {
    const { error } = await supabase.from(table).delete().eq("project_id", projectId);
    if (error && !isSkippableChildDeleteError(error.message)) {
      return { error: `${table}: ${error.message}` };
    }
    if (error) {
      console.warn(`[DeleteProject] skipped ${table}:`, error.message);
    }
  }

  const { error: projectErr } = await supabase.from("projects").delete().eq("id", projectId);
  if (projectErr) {
    return { error: projectErr.message };
  }

  return { error: null };
}
