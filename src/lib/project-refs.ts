/** แหล่งอ้างอิงเลขโครงการ e-GP — ใช้ egp_project_id เป็นหลัก, project_code เป็น fallback โครงการเก่า */
export type ProjectEgpIdSource = {
  egp_project_id?: string | null;
  project_code?: string | null;
};

/** แหล่งอ้างอิงรหัสแบบมาตรฐาน — ใช้ standard_model_code เป็นหลัก, design_code เป็น fallback */
export type ProjectStandardModelSource = {
  standard_model_code?: string | null;
  design_code?: string | null;
};

export function resolveEgpProjectId(
  project: ProjectEgpIdSource | null | undefined,
): string {
  return project?.egp_project_id?.trim() || project?.project_code?.trim() || "";
}

export function resolveStandardModelCode(
  project: ProjectStandardModelSource | null | undefined,
): string {
  return (
    project?.standard_model_code?.trim() || project?.design_code?.trim() || ""
  );
}

/** ซิงก์ egp_project_id กับ project_code เมื่อบันทึก (รองรับโค้ด/รายงานที่ยังอ่าน project_code) */
export function buildProjectEgpIdSyncFields(trimmedEgpId: string) {
  const id = trimmedEgpId.trim();
  return {
    egp_project_id: id || null,
    project_code: id,
  };
}

/** ค่า e-GP สำหรับ state ฟอร์ม — ขั้นตอนที่ 1 ใช้ค่าที่กำลังแก้, ขั้นอื่นอ่านจากโครงการ */
export function resolveEgpProjectIdForStep(
  activeStep: number,
  egpCodeDraft: string,
  project: ProjectEgpIdSource | null | undefined,
): string {
  const draft = egpCodeDraft.trim();
  if (activeStep === 1 && draft) return draft;
  return resolveEgpProjectId(project);
}
