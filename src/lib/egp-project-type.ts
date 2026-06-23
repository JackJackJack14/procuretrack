/** ประเภทโครงการมาตรฐาน e-GP — บันทึกใน projects.project_type */
export const EGP_PROJECT_TYPE_OPTIONS = [
  "ซื้อ",
  "จ้างทำของ/จ้างเหมาบริการ",
  "จ้างก่อสร้าง",
  "จ้างที่ปรึกษา",
  "จ้างออกแบบ/ควบคุมงาน",
] as const;

export type EgpProjectType = (typeof EGP_PROJECT_TYPE_OPTIONS)[number];

export const EGP_PROJECT_TYPE_CONSTRUCTION: EgpProjectType = "จ้างก่อสร้าง";

/** ประเภทโครงการที่ไม่บังคับรายละเอียดที่อยู่หน้างาน (ขั้นตอนที่ 1) */
export const EGP_PROJECT_TYPES_SITE_DETAIL_OPTIONAL: readonly EgpProjectType[] = [
  "ซื้อ",
  "จ้างทำของ/จ้างเหมาบริการ",
];

export function isStep1SiteDetailOptional(
  projectType: string | null | undefined,
): boolean {
  const t = projectType?.trim() ?? "";
  return (EGP_PROJECT_TYPES_SITE_DETAIL_OPTIONAL as readonly string[]).includes(t);
}

/** จำนวนฟิลด์สถานที่ที่บังคับกรอก — งานซื้อ/จ้างเหมา = จังหวัดอย่างเดียว, งานก่อสร้าง = ครบ 5 ช่อง */
export function countStep1SiteLocationRequiredFields(
  projectType: string | null | undefined,
): number {
  return isStep1SiteDetailOptional(projectType) ? 1 : 5;
}

/** หมวดงบประมาณ — ใช้แนะนำประเภทโครงการอัตโนมัติ (ขั้นตอนที่ 1) */
export const BUDGET_CATEGORY_OPTIONS = [
  {
    value: "capital",
    label: "งบลงทุน (ค่าที่ดินและสิ่งก่อสร้าง)",
  },
  { value: "operating", label: "งบดำเนินงาน" },
  { value: "other", label: "อื่นๆ" },
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORY_OPTIONS)[number]["value"];

export const BUDGET_CATEGORY_CAPITAL: BudgetCategory = "capital";

export function isCapitalBudgetCategory(
  category: string | null | undefined,
): boolean {
  return category?.trim() === BUDGET_CATEGORY_CAPITAL;
}

export function isEgpConstructionProjectType(
  projectType: string | null | undefined,
): boolean {
  return projectType?.trim() === EGP_PROJECT_TYPE_CONSTRUCTION;
}

/** แนะนำประเภทโครงการจากหมวดงบ — คืนค่าเมื่อควร auto-select เท่านั้น */
export function suggestEgpProjectTypeFromBudgetCategory(
  category: string | null | undefined,
): EgpProjectType | null {
  if (isCapitalBudgetCategory(category)) {
    return EGP_PROJECT_TYPE_CONSTRUCTION;
  }
  return null;
}

export function isValidEgpProjectType(
  value: string | null | undefined,
): value is EgpProjectType {
  if (!value?.trim()) return false;
  return (EGP_PROJECT_TYPE_OPTIONS as readonly string[]).includes(value.trim());
}
