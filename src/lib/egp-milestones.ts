/** 10 Milestones อ้างอิง e-GP (e-bidding งานก่อสร้าง) — สอดคล้อง project-rules.md */
export const EGP_MILESTONES = [
  "จัดทำและประกาศแผนการจัดซื้อจัดจ้างประจำปี",
  "แต่งตั้งคณะกรรมการและกำหนดราคากลาง",
  "จัดทำเอกสารประกวดราคา/ประกาศเชิญชวนขึ้นเว็บไซต์",
  "จัดทำรายงานขอซื้อขอจ้าง และแต่งตั้งคณะกรรมการ",
  "เปิดซองและสรุปผลการพิจารณา",
  "อุทธรณ์",
  "แจ้งให้ผู้ชนะมาลงนามในสัญญา",
  "ตรวจสอบหลักประกันและลงนามในสัญญา",
  "บันทึกข้อมูลสาระสำคัญในสัญญาลงระบบ e-GP",
  "บริหารสัญญาและการตรวจรับพัสดุ",
] as const;

export const EGP_MILESTONE_SHORT = [
  "แผนจัดซื้อประจำปี",
  "กรรมการ/ราคากลาง",
  "ประกวดราคา",
  "ขอซื้อ/กรรมการ",
  "เปิดซอง/สรุปผล",
  "อุทธรณ์",
  "แจ้งลงนามสัญญา",
  "ตรวจหลักประกัน/ลงนามสัญญา",
  "บันทึกสาระสำคัญ e-GP",
  "บริหารสัญญา/ตรวจรับพัสดุ",
] as const;

/** หัวข้อฟอร์ม/Smart Checklist ขั้น 8–10 (รวมเลขขั้น) */
export const STEP8_FORM_HEADER = "8. ตรวจสอบหลักประกันและลงนามในสัญญา";
export const STEP9_FORM_HEADER = "9. บันทึกข้อมูลสาระสำคัญในสัญญาลงระบบ e-GP";
export const STEP10_FORM_HEADER = "10. บริหารสัญญาและการตรวจรับพัสดุ";

export function getSmartChecklistStepLabel(step: number): string {
  if (step === 8) return STEP8_FORM_HEADER;
  if (step === 9) return STEP9_FORM_HEADER;
  if (step === 10) return STEP10_FORM_HEADER;
  return `ขั้นตอนที่ ${step}`;
}

if (typeof console !== "undefined") {
  console.log(
    "📝 [UI WORDING UPDATE]: Step titles for 4, 5, 8, 9, 10 have been successfully updated.",
  );
}

export const EGP_TOTAL_STEPS = EGP_MILESTONES.length;

export function clampStep(step: number): number {
  return Math.min(EGP_TOTAL_STEPS, Math.max(1, step));
}

export function milestoneProgressPercent(currentStep: number): number {
  return Math.round((clampStep(currentStep) / EGP_TOTAL_STEPS) * 100);
}

export function getMilestoneLabel(step: number, short = false): string {
  const idx = clampStep(step) - 1;
  return short ? EGP_MILESTONE_SHORT[idx] : EGP_MILESTONES[idx];
}

export type MilestoneStatus = "done" | "current" | "upcoming";

export function getMilestoneStatus(stepNumber: number, currentStep: number): MilestoneStatus {
  const cur = clampStep(currentStep);
  if (stepNumber < cur) return "done";
  if (stepNumber === cur) return "current";
  return "upcoming";
}

/** คำอธิบายระยะเวลา/ข้อควรระวังต่อขั้น (อ้างอิง e-GP งานก่อสร้าง e-bidding) */
export const EGP_STEP_LEGAL_HINTS = [
  "จัดทำและประกาศแผนจัดซื้อจัดจ้างประจำปีบน e-GP ก่อนเริ่มจัดหาพัสดุ",
  "แต่งตั้งคณะกรรมการและกำหนดราคากลาง — ไม่กำหนดวันขั้นต่ำตายตัว",
  "รับฟังความคิดเห็นร่างประกาศ/TOR — ตามวงเงิน (>10 ล้านบังคับ ≥3 วันทำการ)",
  "จัดทำรายงานขอซื้อขอจ้างตามข้อ 22 และแต่งตั้งกรรมการให้ถูกต้องก่อนวันเริ่ม e-Bidding",
  "เปิดซองและสรุปผลการพิจารณา — ภายใน 7 วันทำการหลังปิดรับซอง",
  "อุทธรณ์ — รอครบ 7 วันทำการก่อนดำเนินการขั้นถัดไป (ถ้ามี)",
  "แจ้งให้ผู้ชนะมาลงนามในสัญญา — ภายใน 5 วันทำการหลังพ้นอุทธรณ์ (ข้อ 161)",
  "ตรวจหลักประกันและลงนามสัญญา — ต้องวางหลักประกันก่อนลงนาม",
  "บันทึกสาระสำคัญสัญญา — ก่อนเริ่มบริหารสัญญา/ก่อสร้าง",
  "บริหารสัญญา — ตามระยะเวลาในสัญญา (ส่งมอบ/ตรวจรับ/เบิกจ่าย)",
] as const;
