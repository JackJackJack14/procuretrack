import { addCalendarDaysISO } from "@/lib/step-form";
import type { Step10InspectionRow } from "@/lib/step-form";
import type { StepDocRecord } from "@/lib/doc-upload";

/** สถานะโครงการ — หลังปิดงานจ้าง อยู่ระหว่างค้ำประกัน 2 ปี */
export const PROJECT_STATUS_WARRANTY = "warranty";

export const PROJECT_WARRANTY_STATUS_LABEL =
  "ปิดงานจ้างสำเร็จ (อยู่ระหว่างค้ำประกันความชำรุด 2 ปี)";

/** สถานะงวดงาน — ขั้นตอนที่ 10 */
export type Step10InstallmentStatus =
  | "under_construction"
  | "delivered"
  | "inspection_passed"
  | "delayed";

export const STEP10_INSTALLMENT_STATUS_OPTIONS: {
  value: Step10InstallmentStatus;
  label: string;
}[] = [
  { value: "under_construction", label: "กำลังก่อสร้าง" },
  { value: "delivered", label: "ส่งมอบแล้ว" },
  { value: "inspection_passed", label: "ตรวจรับผ่านแล้ว" },
  { value: "delayed", label: "ล่าช้า" },
];

export const STEP10_DAILY_REPORT_HINT =
  "ℹ️ สามารถสแกนรวบรวมใบรายงานประจำวันรวมกันเป็น 1 ไฟล์ PDF (รายสัปดาห์ หรือ รายงวด) แล้วอัปโหลดได้";

/** ประเภทเอกสารรายงวด — ขั้นตอนที่ 10 */
export const STEP10_INSTALLMENT_DOC = {
  dailyReport: (n: number) => `รายงานประจำวันของผู้ควบคุมงาน (งวดที่ ${n})`,
  sitePhoto: (n: number) => `รูปถ่ายหน้างานประกอบรายงาน (งวดที่ ${n})`,
  bg11: (n: number) => `ใบแจ้งส่งมอบงาน/ใบตรวจรับ บก.11 (งวดที่ ${n})`,
} as const;

/** @deprecated ชื่อเอกสารเก่าใน DB */
const STEP10_INSTALLMENT_DOC_LEGACY = {
  dailyReport: (n: number) => `รายงานประจำวันช่างคุมงาน (งวดที่ ${n})`,
  sitePhoto: (n: number) => `รูปถ่ายหน้างาน (งวดที่ ${n})`,
};

export const STEP10_GUARANTEE_RETURN_DOC = "บันทึกคืนหลักประกันสัญญา";

export function step10InstallmentDailyDocTypes(n: number): string[] {
  return [
    STEP10_INSTALLMENT_DOC.dailyReport(n),
    STEP10_INSTALLMENT_DOC_LEGACY.dailyReport(n),
  ];
}

export function step10InstallmentPhotoDocTypes(n: number): string[] {
  return [
    STEP10_INSTALLMENT_DOC.sitePhoto(n),
    STEP10_INSTALLMENT_DOC_LEGACY.sitePhoto(n),
  ];
}

export function step10InstallmentBg11DocTypes(n: number): string[] {
  return [STEP10_INSTALLMENT_DOC.bg11(n)];
}

function uploadedHasAnyType(uploadedTypes: string[], candidates: string[]): boolean {
  const set = new Set(uploadedTypes);
  return candidates.some((t) => set.has(t));
}

export function isStep10InstallmentDocType(documentType: string): boolean {
  return (
    documentType.startsWith("รายงานประจำวันของผู้ควบคุมงาน (งวดที่ ") ||
    documentType.startsWith("รายงานประจำวันช่างคุมงาน (งวดที่ ") ||
    documentType.startsWith("รูปถ่ายหน้างานประกอบรายงาน (งวดที่ ") ||
    documentType.startsWith("รูปถ่ายหน้างาน (งวดที่ ") ||
    documentType.startsWith("ใบแจ้งส่งมอบงาน/ใบตรวจรับ บก.11 (งวดที่ ")
  );
}

export function parseStep10InstallmentNoFromDocType(documentType: string): number | null {
  const m = /งวดที่\s*(\d+)/.exec(documentType);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseLocalISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** จำนวนวันปฏิทินระหว่างสองวัน */
export function countCalendarDaysBetweenISO(fromISO: string, toISO: string): number {
  const from = parseLocalISODate(fromISO);
  const to = parseLocalISODate(toISO);
  if (!from || !to) return 0;
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** วันกำหนดเสร็จตามแผนแต่ละงวด — แบ่งระยะเวลาสัญญาเท่าๆ กันจากวันเริ่มงาน */
export function computeStep10InstallmentPlannedDates(
  workStartISO: string,
  durationDays: number | null | undefined,
  totalInstallments: number,
): string[] {
  const start = workStartISO?.trim() ?? "";
  const duration = durationDays;
  const n = Math.max(0, Math.floor(totalInstallments));
  if (!start || duration == null || !Number.isFinite(duration) || duration <= 0 || n <= 0) {
    return [];
  }
  return Array.from({ length: n }, (_, index) => {
    const installment = index + 1;
    const offset = Math.round((duration * installment) / n);
    return addCalendarDaysISO(start, offset) ?? "";
  });
}

/** ค่าปรับสะสมงวด: วงเงินสัญญา x 0.001 x วันปฏิทินที่ส่งมอบเลท */
export function computeStep10InstallmentPenalty(
  contractAmount: number | null | undefined,
  plannedISO: string,
  actualDeliveryISO: string,
): number {
  const amount = contractAmount;
  const planned = plannedISO?.trim() ?? "";
  const actual = actualDeliveryISO?.trim() ?? "";
  if (amount == null || !Number.isFinite(amount) || amount <= 0 || !planned || !actual) {
    return 0;
  }
  if (actual <= planned) return 0;
  const daysLate = countCalendarDaysBetweenISO(planned, actual);
  if (daysLate <= 0) return 0;
  return Math.round(amount * 0.001 * daysLate * 100) / 100;
}

export function normalizeStep10InstallmentStatus(
  raw: string | null | undefined,
): Step10InstallmentStatus | "" {
  if (!raw) return "";
  const found = STEP10_INSTALLMENT_STATUS_OPTIONS.find((o) => o.value === raw);
  return found?.value ?? "";
}

export function hasStep10RowProgressRecorded(row: Step10InspectionRow): boolean {
  return (
    (row.progress_pct != null && Number.isFinite(row.progress_pct)) ||
    !!row.delivery_date?.trim() ||
    !!row.inspection_date?.trim() ||
    !!row.inspector_note?.trim() ||
    !!row.installment_status
  );
}

export function isStep10RowInspectionPassed(row: Step10InspectionRow): boolean {
  return row.installment_status === "inspection_passed";
}

export function countStep10PassedInstallments(rows: Step10InspectionRow[]): number {
  return rows.filter(isStep10RowInspectionPassed).length;
}

export function step10RowHasAllInstallmentDocs(
  installmentNo: number,
  uploadedTypes: string[],
): boolean {
  return (
    uploadedHasAnyType(uploadedTypes, step10InstallmentDailyDocTypes(installmentNo)) &&
    uploadedHasAnyType(uploadedTypes, step10InstallmentPhotoDocTypes(installmentNo)) &&
    uploadedHasAnyType(uploadedTypes, step10InstallmentBg11DocTypes(installmentNo))
  );
}

export function isStep10InspectionBeforeDelivery(
  deliveryISO: string,
  inspectionISO: string,
): boolean {
  const delivery = deliveryISO?.trim() ?? "";
  const inspection = inspectionISO?.trim() ?? "";
  if (!delivery || !inspection) return false;
  return inspection < delivery;
}

/** วันตรวจรับของงวดสุดท้ายที่มีข้อมูล */
export function resolveLastInstallmentInspectionDate(rows: Step10InspectionRow[]): string {
  const withDate = rows.filter((r) => r.inspection_date?.trim());
  if (withDate.length === 0) return "";
  withDate.sort((a, b) => b.installment_no - a.installment_no);
  return withDate[0].inspection_date?.trim() ?? "";
}

/** วันสิ้นสุดค้ำประกัน = วันตรวจรับงวดสุดท้าย + 2 ปีปฏิทิน */
export function computeWarrantyEndDateISO(lastInspectionISO: string): string | null {
  const d = parseLocalISODate(lastInspectionISO);
  if (!d) return null;
  d.setFullYear(d.getFullYear() + 2);
  return formatLocalISODate(d);
}

export function groupStep10DocsByInstallment(
  docs: StepDocRecord[],
): Map<number, StepDocRecord[]> {
  const map = new Map<number, StepDocRecord[]>();
  for (const doc of docs) {
    if (!isStep10InstallmentDocType(doc.document_type)) continue;
    const n = parseStep10InstallmentNoFromDocType(doc.document_type);
    if (n == null) continue;
    const list = map.get(n) ?? [];
    list.push(doc);
    map.set(n, list);
  }
  return map;
}
