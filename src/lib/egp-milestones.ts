/** 10 Milestones อ้างอิง e-GP (e-bidding งานก่อสร้าง) — สอดคล้อง project-rules.md */
export const EGP_MILESTONES = [
  "แต่งตั้งผู้รับผิดชอบและจัดทำแบบรูปรายการงานก่อสร้าง",
  "แต่งตั้งคณะกรรมการและกำหนดราคากลาง",
  "จัดทำเอกสารประกวดราคา/ประกาศเชิญชวนขึ้นเว็บไซต์",
  "รายชื่อผู้เสนอราคาและผลการเสนอราคา",
  "จัดทำและประกาศ ผู้ชนะการเสนอราคา",
  "อุทธรณ์",
  "แจ้งให้ผู้ชนะมาลงนามในสัญญา",
  "ตรวจสอบหลักประกันสัญญาและจัดทำสัญญา",
  "ข้อมูลสาระสำคัญในสัญญา",
  "บริหารสัญญา",
] as const;

export const EGP_MILESTONE_SHORT = [
  "ผู้รับผิดชอบ/แบบรูป",
  "กรรมการ/ราคากลาง",
  "ประกวดราคา",
  "ผลเสนอราคา",
  "ผู้ชนะ",
  "อุทธรณ์",
  "แจ้งลงนามสัญญา",
  "หลักประกัน/สัญญา",
  "สาระสำคัญสัญญา",
  "บริหารสัญญา",
] as const;

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
  "แต่งตั้งผู้รับผิดชอบและจัดทำแบบรูปรายการ — ตามแผนงานหน่วยงาน",
  "แต่งตั้งคณะกรรมการและกำหนดราคากลาง — ไม่กำหนดวันขั้นต่ำตายตัว",
  "รับฟังความคิดเห็นร่างประกาศ/TOR — ตามวงเงิน (>10 ล้านบังคับ ≥3 วันทำการ)",
  "รับซองและพิจารณาผลเสนอราคา — ภายใน 7 วันทำการหลังปิดรับซอง",
  "ประกาศผู้ชนะ — ภายใน 7 วันทำการหลังพิจารณาผล",
  "อุทธรณ์ — รอครบ 7 วันทำการก่อนดำเนินการขั้นถัดไป (ถ้ามี)",
  "แจ้งให้ผู้ชนะมาลงนามในสัญญา — ภายใน 5 วันทำการหลังพ้นอุทธรณ์ (ข้อ 161)",
  "ตรวจหลักประกันและลงนามสัญญา — ต้องวางหลักประกันก่อนลงนาม",
  "บันทึกสาระสำคัญสัญญา — ก่อนเริ่มบริหารสัญญา/ก่อสร้าง",
  "บริหารสัญญา — ตามระยะเวลาในสัญญา (ส่งมอบ/ตรวจรับ/เบิกจ่าย)",
] as const;
