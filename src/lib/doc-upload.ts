import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateDocFile } from "@/lib/doc-file-types";
import { checkStorageQuota, decrementStorageUsage, incrementStorageUsage } from "@/lib/storage";

export type ProjectDocRef = {
  id: string;
  organization_id: string;
};

export type StepDocRecord = {
  id: string;
  step_number: number | null;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
};

export async function uploadStepDocument(
  project: ProjectDocRef,
  stepNumber: number,
  documentType: string,
  file: File,
): Promise<StepDocRecord | null> {
  const typeCheck = validateDocFile(file, documentType);
  if (!typeCheck.ok) {
    toast.error(typeCheck.message);
    return null;
  }

  if (file.size > 50 * 1024 * 1024) {
    toast.error("ขนาดไฟล์เกิน 50MB");
    return null;
  }
  const quota = await checkStorageQuota(project.organization_id, file.size);
  if (!quota.ok) return null;

  const { data: u, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    toast.error(`ไม่สามารถตรวจสอบผู้ใช้ได้: ${authErr.message}`);
    return null;
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${project.organization_id}/${project.id}/step-${stepNumber}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("procurement-docs").upload(path, file);
  if (upErr) {
    toast.error(`อัปโหลดไฟล์ไม่สำเร็จ: ${upErr.message}`);
    return null;
  }

  const { data: inserted, error: dbErr } = await supabase
    .from("documents")
    .insert({
      organization_id: project.organization_id,
      project_id: project.id,
      step_number: stepNumber,
      document_type: documentType,
      file_name: file.name,
      storage_path: path,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: u.user?.id ?? null,
    })
    .select("id, step_number, document_type, file_name, storage_path, file_size")
    .single();
  if (dbErr) {
    toast.error(`บันทึกข้อมูลเอกสารไม่สำเร็จ: ${dbErr.message}`);
    return null;
  }

  await incrementStorageUsage(project.organization_id, file.size);
  toast.success("อัปโหลดไฟล์เรียบร้อย");
  return inserted as StepDocRecord;
}

export async function deleteStepDocument(
  project: ProjectDocRef,
  doc: StepDocRecord,
  opts?: { silent?: boolean },
): Promise<boolean> {
  const { error: storageErr } = await supabase.storage
    .from("procurement-docs")
    .remove([doc.storage_path]);
  if (storageErr) {
    if (!opts?.silent) toast.error(`ลบไฟล์ไม่สำเร็จ: ${storageErr.message}`);
    return false;
  }
  const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
  if (dbErr) {
    if (!opts?.silent) toast.error(`ลบข้อมูลเอกสารไม่สำเร็จ: ${dbErr.message}`);
    return false;
  }
  await decrementStorageUsage(project.organization_id, Number(doc.file_size ?? 0));
  if (!opts?.silent) toast.success("ลบไฟล์เรียบร้อยแล้ว");
  return true;
}

export async function getSignedDocUrl(storagePath: string, expiresSec = 300): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("procurement-docs")
    .createSignedUrl(storagePath, expiresSec);
  if (error) {
    toast.error(`เปิดไฟล์ไม่สำเร็จ: ${error.message}`);
    return null;
  }
  return data?.signedUrl ?? null;
}

export async function openStepDocument(storagePath: string): Promise<void> {
  const url = await getSignedDocUrl(storagePath);
  if (url) window.open(url, "_blank");
}

/** รวมเล่มเอกสาร Audit ของขั้นตอนเป็น ZIP */
export async function downloadStepAuditZip(
  stepNumber: number,
  stepLabel: string,
  docs: StepDocRecord[],
): Promise<void> {
  const stepDocs = docs.filter((d) => d.step_number === stepNumber);
  if (stepDocs.length === 0) {
    toast.error("ยังไม่มีไฟล์หลักฐานในขั้นตอนนี้");
    return;
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  let added = 0;

  for (const doc of stepDocs) {
    const url = await getSignedDocUrl(doc.storage_path, 600);
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      const safeType = doc.document_type.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 80);
      const safeName = doc.file_name.replace(/[/\\?%*:|"<>]/g, "_");
      zip.file(`${String(added + 1).padStart(2, "0")}_${safeType}__${safeName}`, blob);
      added++;
    } catch {
      /* skip failed file */
    }
  }

  if (added === 0) {
    toast.error("ดาวน์โหลดไฟล์ไม่สำเร็จ — ลองใหม่อีกครั้ง");
    return;
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Audit_Step${stepNumber}_${stepLabel.replace(/\s+/g, "_")}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  toast.success(`รวมเล่ม Audit ${added} ไฟล์เรียบร้อย`);
}

export async function downloadStepDocument(doc: StepDocRecord): Promise<void> {
  const url = await getSignedDocUrl(doc.storage_path, 600);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.file_name;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
