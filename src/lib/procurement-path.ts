/** รูปแบบการจัดซื้อจัดจ้าง — กำหนดใน Step 1 */
export type ProcurementPath = "self" | "external";

export const PROCUREMENT_PATH_SELF: ProcurementPath = "self";
export const PROCUREMENT_PATH_EXTERNAL: ProcurementPath = "external";

/** ขั้นตอนเริ่มต้นเมื่อใช้โหมด Bypass (สัญญามาจากส่วนกลาง/สพข.) */
export const EXTERNAL_PROCUREMENT_ENTRY_STEP = 9;

/** ขั้นที่ปลด Validation Gate เมื่อ external */
export const EXTERNAL_PROCUREMENT_BYPASS_LAST_STEP = 7;

export const PROCUREMENT_PATH_OPTIONS: Array<{
  value: ProcurementPath;
  label: string;
  description: string;
}> = [
  {
    value: "self",
    label: "หน่วยงานดำเนินการจัดซื้อจัดจ้างเองตั้งแต่ต้น",
    description: "ดำเนินครบ 10 ขั้นตอน e-GP ตามลำดับ — ระบบตรวจสอบทุกด่าน",
  },
  {
    value: "external",
    label: "หน่วยงานอื่น (ส่วนกลาง/สพข. เขต) เป็นผู้ดำเนินการจัดซื้อจัดจ้างให้",
    description:
      "สำหรับสัญญาที่ได้รับมาจากส่วนกลาง — ข้ามด่าน Step 1-7 ไปเริ่มบันทึกสัญญา/งวดงานที่ Step 9",
  },
];

export function normalizeProcurementPath(
  stored?: string | null,
): ProcurementPath {
  return stored === "external" ? "external" : "self";
}

export function isExternalProcurement(
  path?: string | null,
): boolean {
  return normalizeProcurementPath(path) === "external";
}

/** Step 1-7 ไม่บังคับ validation เมื่อ external */
export function isProcurementStepBypassed(
  stepNumber: number,
  path?: string | null,
): boolean {
  return (
    isExternalProcurement(path) &&
    stepNumber >= 1 &&
    stepNumber <= EXTERNAL_PROCUREMENT_BYPASS_LAST_STEP
  );
}
