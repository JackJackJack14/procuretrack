/** แสดงผลจำนวนเงิน read-only — ลูกน้ำคั่นหลักตามมาตรฐาน th-TH */
export function formatCurrencyDisplay(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("th-TH");
}

/** ล้างลูกน้ำ/อักขระที่ไม่ใช่ตัวเลข — ไม่ log (ใช้ภายใน) */
export function stripCurrencyToNumber(v: string): number | null {
  const stripped = v.replace(/,/g, "").replace(/[^\d]/g, "");
  if (!stripped) return null;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
}

/** บันทึกค่าดิบขณะผู้ใช้กำลังพิมพ์ */
export function logCurrencyRawInput(rawValue: string): void {
  console.log("✍️ [NUMBER FORMAT] Raw Input Value:", rawValue);
}

/** ล้างลูกน้ำก่อนบันทึก state/DB — พร้อม log หลักฐาน */
export function parseCurrencyForDatabase(rawValue: string): number | null {
  const cleaned = stripCurrencyToNumber(rawValue);
  console.log("🧼 [NUMBER FORMAT] Cleaned Value for DB:", cleaned);
  return cleaned;
}

/** ฟอร์แมตช่องกรอกแบบ real-time (เฉพาะตัวเลข 0-9) */
export function formatBudgetInput(v: string): string {
  const num = v.replace(/[^\d]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("th-TH");
}

/** @deprecated ใช้ parseCurrencyForDatabase เมื่อต้องการ null สำหรับค่าว่าง */
export function parseBudgetInput(v: string): number {
  return stripCurrencyToNumber(v) ?? 0;
}
