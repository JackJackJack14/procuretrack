/** ตัวเลือกหน่วยวัดผลสัมฤทธิ์ — ใช้ร่วม Step 1 / รายงานสรุป */
export const PROJECT_RESULT_UNIT_OPTIONS = [
  { value: "ไร่", label: "ไร่" },
  { value: "บ่อ", label: "บ่อ" },
  { value: "กม.", label: "กม." },
  { value: "แห่ง", label: "แห่ง" },
] as const;

export type ProjectResultUnit = (typeof PROJECT_RESULT_UNIT_OPTIONS)[number]["value"];

/** ค่าใน dropdown เมื่อเลือก «อื่น ๆ (พิมพ์ระบุเอง)» */
export const PROJECT_RESULT_UNIT_OTHER = "__other__";

const PRESET_RESULT_UNITS = new Set<string>(
  PROJECT_RESULT_UNIT_OPTIONS.map((o) => o.value),
);

export function isPresetResultUnit(unit: string | null | undefined): boolean {
  const u = unit?.trim();
  return !!u && PRESET_RESULT_UNITS.has(u);
}

/** แปลงค่าที่เก็บใน DB → ค่าใน `<select>` */
export function getResultUnitDropdownValue(unit: string | null | undefined): string {
  const u = unit?.trim() ?? "";
  if (!u) return "";
  if (isPresetResultUnit(u)) return u;
  return PROJECT_RESULT_UNIT_OTHER;
}

/** หน่วยที่ใช้แสดงผล (preset หรือข้อความที่พิมพ์เอง) */
export function resolveResultUnitLabel(unit: string | null | undefined): string {
  return unit?.trim() ?? "";
}

/** ข้อมูลโปรไฟล์โครงการ — กรอกในขั้นตอนที่ 1 บันทึกลง projects */
export type Step1ProjectProfile = {
  district_office: string;
  approving_agency: string;
  procurement_agency: string;
  activity_type: string;
  result_unit: string;
  site_village: string;
  site_moo: number | null;
  site_subdistrict: string;
  site_district: string;
  site_province: string;
};

export const EMPTY_STEP1_PROJECT_PROFILE: Step1ProjectProfile = {
  district_office: "",
  approving_agency: "",
  procurement_agency: "",
  activity_type: "",
  result_unit: "",
  site_village: "",
  site_moo: null,
  site_subdistrict: "",
  site_district: "",
  site_province: "",
};

type ProjectProfileLike = {
  district_office?: string | null;
  approving_agency?: string | null;
  procurement_agency?: string | null;
  activity_type?: string | null;
  result_unit?: string | null;
  site_village?: string | null;
  site_moo?: number | null;
  site_subdistrict?: string | null;
  site_district?: string | null;
  site_province?: string | null;
};

export function mergeStep1ProfileFromProject(
  project: ProjectProfileLike | null,
): Step1ProjectProfile {
  if (!project) return { ...EMPTY_STEP1_PROJECT_PROFILE };
  const moo = project.site_moo;
  return {
    district_office: project.district_office?.trim() ?? "",
    approving_agency: project.approving_agency?.trim() ?? "",
    procurement_agency: project.procurement_agency?.trim() ?? "",
    activity_type: project.activity_type?.trim() ?? "",
    result_unit: project.result_unit?.trim() ?? "",
    site_village: project.site_village?.trim() ?? "",
    site_moo: moo != null && Number.isFinite(moo) && moo > 0 ? Math.floor(moo) : null,
    site_subdistrict: project.site_subdistrict?.trim() ?? "",
    site_district: project.site_district?.trim() ?? "",
    site_province: project.site_province?.trim() ?? "",
  };
}

export function buildProjectStep1ProfileFields(profile: Step1ProjectProfile) {
  const moo = profile.site_moo;
  return {
    district_office: profile.district_office.trim() || null,
    approving_agency: profile.approving_agency.trim() || null,
    procurement_agency: profile.procurement_agency.trim() || null,
    activity_type: profile.activity_type.trim() || null,
    result_unit: profile.result_unit.trim() || null,
    site_village: profile.site_village.trim() || null,
    site_moo: moo != null && Number.isFinite(moo) && moo > 0 ? Math.floor(moo) : null,
    site_subdistrict: profile.site_subdistrict.trim() || null,
    site_district: profile.site_district.trim() || null,
    site_province: profile.site_province.trim() || null,
  };
}

export function formatProjectSiteLocation(profile: Step1ProjectProfile): string {
  const parts: string[] = [];
  if (profile.site_village.trim()) parts.push(`บ้าน${profile.site_village.trim()}`);
  if (profile.site_moo != null && profile.site_moo > 0) parts.push(`หมู่ที่ ${profile.site_moo}`);
  if (profile.site_subdistrict.trim()) parts.push(`ต.${profile.site_subdistrict.trim()}`);
  if (profile.site_district.trim()) parts.push(`อ.${profile.site_district.trim()}`);
  if (profile.site_province.trim()) parts.push(`จ.${profile.site_province.trim()}`);
  return parts.length > 0 ? parts.join(" ") : "—";
}

export function formatProgressWithUnit(
  value: number | null | undefined,
  unit: string | null | undefined,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const u = unit?.trim();
  return u ? `${value} ${u}` : String(value);
}
