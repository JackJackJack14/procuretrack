import { addCalendarDaysISO } from "@/lib/step-form";
import type { Step10InspectionRow, Step10ProjectType } from "@/lib/step-form";
import type { StepDocRecord } from "@/lib/doc-upload";
import {
  STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT,
  STEP10_PENALTY_RATE_CONSTRUCTION_DEFAULT,
  STEP10_PENALTY_RATE_CONSTRUCTION_MAX,
  STEP10_PENALTY_RATE_CONSTRUCTION_MIN,
  STEP10_PENALTY_RATE_GENERAL_DEFAULT,
} from "@/lib/step10-guideline";

/** สถานะโครงการ — หลังปิดงานจ้าง อยู่ระหว่างค้ำประกัน 2 ปี */
export const PROJECT_STATUS_WARRANTY = "warranty";

export const PROJECT_WARRANTY_STATUS_LABEL =
  "ปิดงานจ้างสำเร็จ (อยู่ระหว่างค้ำประกันความชำรุด 2 ปี)";

export type Step10InstallmentStatus =
  | "under_construction"
  | "delivered"
  | "inspection_passed"
  | "delayed";

export const STEP10_PROJECT_TYPE_OPTIONS: {
  value: Step10ProjectType;
  label: string;
}[] = [
  { value: "general", label: "โครงการทั่วไป (ซื้อ/จ้าง)" },
  { value: "construction", label: "โครงการประเภทงานก่อสร้าง" },
];

export const STEP10_INSPECTION_RESULT_OPTIONS = [
  { value: "passed", label: "ผ่านการตรวจรับถูกต้องครบถ้วน" },
  { value: "defects", label: "ตรวจพบข้อบกพร่องให้แก้ไข" },
] as const;

export type Step10InspectionResult = (typeof STEP10_INSPECTION_RESULT_OPTIONS)[number]["value"];

/** @deprecated ใช้ STEP10_INSPECTION_RESULT_OPTIONS */
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
  deliveryLetter: (n: number) => `หนังสือส่งมอบงาน/ส่งมอบพัสดุจากคู่สัญญา (งวดที่ ${n})`,
  inspectionReport: (n: number) => `ใบตรวจรับพัสดุ / รายงานผลการตรวจรับ (งวดที่ ${n})`,
  sitePhotoEvidence: (n: number) => `ภาพถ่ายหลักฐานการตรวจรับพัสดุหน้างานจริง (งวดที่ ${n})`,
  invoice: (n: number) => `ใบแจ้งหนี้ / ใบกำกับภาษี (งวดที่ ${n})`,
  supervisorReport: (n: number) =>
    `รายงานผลการปฏิบัติงานของผู้ควบคุมงานประจำงวด (งวดที่ ${n})`,
  /** @deprecated */
  dailyReport: (n: number) => `รายงานประจำวันของผู้ควบคุมงาน (งวดที่ ${n})`,
  /** @deprecated */
  sitePhoto: (n: number) => `รูปถ่ายหน้างานประกอบรายงาน (งวดที่ ${n})`,
  /** @deprecated */
  bg11: (n: number) => `ใบแจ้งส่งมอบงาน/ใบตรวจรับ บก.11 (งวดที่ ${n})`,
} as const;

const STEP10_INSTALLMENT_DOC_LEGACY = {
  dailyReport: (n: number) => `รายงานประจำวันช่างคุมงาน (งวดที่ ${n})`,
  sitePhoto: (n: number) => `รูปถ่ายหน้างาน (งวดที่ ${n})`,
};

export const STEP10_GUARANTEE_RETURN_DOC = "บันทึกคืนหลักประกันสัญญา";

export function step10DefaultPenaltyRatePct(projectType: Step10ProjectType): number {
  return projectType === "construction"
    ? STEP10_PENALTY_RATE_CONSTRUCTION_DEFAULT
    : STEP10_PENALTY_RATE_GENERAL_DEFAULT;
}

/**
 * ฐานคำนวณค่าปรับรายงวด (ระเบียบฯ ข้อ 162)
 * - งานก่อสร้าง: วงเงินรวมทั้งสัญญาเท่านั้น (ห้ามใช้วงเงินรายงวด)
 * - ซื้อ/จ้างทั่วไป: วงเงินเฉพาะงวดนั้น (วงเงินสัญญา ÷ จำนวนงวด)
 */
export function getStep10PenaltyBaseAmount(opts: {
  projectType: Step10ProjectType;
  contractAmount: number | null | undefined;
  totalInstallments: number;
}): number {
  const contractAmount = opts.contractAmount;
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    return 0;
  }
  const totalN = Math.max(1, Math.floor(opts.totalInstallments));
  return opts.projectType === "construction"
    ? contractAmount
    : contractAmount / totalN;
}

export function formatStep10PenaltyBaseLabel(
  projectType: Step10ProjectType,
  baseAmount: number,
): string {
  if (baseAmount <= 0) return "— ยังไม่มีวงเงินสัญญา —";
  const formatted = baseAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return projectType === "construction"
    ? `วงเงินรวมทั้งสัญญา ${formatted} บาท`
    : `วงเงินเฉพาะงวดนี้ ${formatted} บาท`;
}

export function step10InstallmentDeliveryLetterDocTypes(n: number): string[] {
  return [STEP10_INSTALLMENT_DOC.deliveryLetter(n)];
}

export function step10InstallmentInspectionReportDocTypes(n: number): string[] {
  return [
    STEP10_INSTALLMENT_DOC.inspectionReport(n),
    STEP10_INSTALLMENT_DOC.bg11(n),
  ];
}

export function step10InstallmentSitePhotoDocTypes(n: number): string[] {
  return [
    STEP10_INSTALLMENT_DOC.sitePhotoEvidence(n),
    STEP10_INSTALLMENT_DOC.sitePhoto(n),
    STEP10_INSTALLMENT_DOC_LEGACY.sitePhoto(n),
  ];
}

export function step10InstallmentInvoiceDocTypes(n: number): string[] {
  return [STEP10_INSTALLMENT_DOC.invoice(n)];
}

export function step10InstallmentSupervisorReportDocTypes(n: number): string[] {
  return [
    STEP10_INSTALLMENT_DOC.supervisorReport(n),
    STEP10_INSTALLMENT_DOC.dailyReport(n),
    STEP10_INSTALLMENT_DOC_LEGACY.dailyReport(n),
  ];
}

/** @deprecated */
export function step10InstallmentDailyDocTypes(n: number): string[] {
  return step10InstallmentSupervisorReportDocTypes(n);
}

/** @deprecated */
export function step10InstallmentPhotoDocTypes(n: number): string[] {
  return step10InstallmentSitePhotoDocTypes(n);
}

/** @deprecated */
export function step10InstallmentBg11DocTypes(n: number): string[] {
  return step10InstallmentInspectionReportDocTypes(n);
}

function uploadedHasAnyType(uploadedTypes: string[], candidates: string[]): boolean {
  const set = new Set(uploadedTypes);
  return candidates.some((t) => set.has(t));
}

export function isStep10InstallmentDocType(documentType: string): boolean {
  return /งวดที่\s*\d+/.test(documentType);
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

/** จำนวนวันปฏิทินระหว่างสองวัน (เมื่อ to หลัง from) */
export function countCalendarDaysBetweenISO(fromISO: string, toISO: string): number {
  const from = parseLocalISODate(fromISO);
  const to = parseLocalISODate(toISO);
  if (!from || !to) return 0;
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function isStep10DateBefore(aISO: string, bISO: string): boolean {
  const a = parseLocalISODate(aISO);
  const b = parseLocalISODate(bISO);
  if (!a || !b) return false;
  return a.getTime() < b.getTime();
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

export type Step10PenaltyResult = {
  daysLate: number;
  penaltyBaht: number;
};

/** ค่าปรับรายงวด — วันปฏิทิน (รวมวันหยุด) */
export function computeStep10InstallmentPenalty(opts: {
  projectType: Step10ProjectType;
  contractAmount: number | null | undefined;
  totalInstallments: number;
  penaltyRatePct: number | null | undefined;
  plannedISO: string;
  actualDeliveryISO: string;
}): Step10PenaltyResult {
  const planned = opts.plannedISO?.trim() ?? "";
  const actual = opts.actualDeliveryISO?.trim() ?? "";
  const rate = opts.penaltyRatePct;
  const contractAmount = opts.contractAmount;
  const totalN = Math.max(1, Math.floor(opts.totalInstallments));

  if (!planned || !actual || actual <= planned) {
    return { daysLate: 0, penaltyBaht: 0 };
  }
  if (rate == null || !Number.isFinite(rate) || rate <= 0) {
    return { daysLate: 0, penaltyBaht: 0 };
  }
  if (contractAmount == null || !Number.isFinite(contractAmount) || contractAmount <= 0) {
    return { daysLate: 0, penaltyBaht: 0 };
  }

  const daysLate = countCalendarDaysBetweenISO(planned, actual);
  if (daysLate <= 0) return { daysLate: 0, penaltyBaht: 0 };

  const baseAmount = getStep10PenaltyBaseAmount({
    projectType: opts.projectType,
    contractAmount,
    totalInstallments: totalN,
  });
  if (baseAmount <= 0) return { daysLate: 0, penaltyBaht: 0 };

  let effectiveRate = rate;
  if (opts.projectType === "construction") {
    effectiveRate = Math.min(
      STEP10_PENALTY_RATE_CONSTRUCTION_MAX,
      Math.max(STEP10_PENALTY_RATE_CONSTRUCTION_MIN, rate),
    );
  }

  let penalty = baseAmount * (effectiveRate / 100) * daysLate;

  if (opts.projectType === "construction") {
    const minTotal = STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT * daysLate;
    penalty = Math.max(penalty, minTotal);
  }

  return {
    daysLate,
    penaltyBaht: Math.round(penalty * 100) / 100,
  };
}

export function normalizeStep10InspectionResult(
  raw: string | null | undefined,
): Step10InspectionResult | "" {
  if (!raw) return "";
  const found = STEP10_INSPECTION_RESULT_OPTIONS.find((o) => o.value === raw);
  return found?.value ?? "";
}

export function isStep10RowInspectionPassed(row: Step10InspectionRow): boolean {
  return (
    row.inspection_result === "passed" ||
    row.installment_status === "inspection_passed"
  );
}

export function countStep10PassedInstallments(rows: Step10InspectionRow[]): number {
  return rows.filter(isStep10RowInspectionPassed).length;
}

export function step10RowHasRequiredDocs(
  installmentNo: number,
  uploadedTypes: string[],
  projectType: Step10ProjectType,
): boolean {
  const hasDelivery = uploadedHasAnyType(
    uploadedTypes,
    step10InstallmentDeliveryLetterDocTypes(installmentNo),
  );
  const hasInspection = uploadedHasAnyType(
    uploadedTypes,
    step10InstallmentInspectionReportDocTypes(installmentNo),
  );
  if (!hasDelivery || !hasInspection) return false;
  if (projectType === "construction") {
    return uploadedHasAnyType(
      uploadedTypes,
      step10InstallmentSupervisorReportDocTypes(installmentNo),
    );
  }
  return true;
}

/** @deprecated */
export function step10RowHasAllInstallmentDocs(
  installmentNo: number,
  uploadedTypes: string[],
): boolean {
  return step10RowHasRequiredDocs(installmentNo, uploadedTypes, "general");
}

export function isStep10InspectionBeforeDelivery(
  deliveryISO: string,
  inspectionISO: string,
): boolean {
  const delivery = deliveryISO?.trim() ?? "";
  const inspection = inspectionISO?.trim() ?? "";
  if (!delivery || !inspection) return false;
  return isStep10DateBefore(inspection, delivery);
}

export function isStep10InspectionBeforeSupervisorReport(
  supervisorReportISO: string,
  inspectionISO: string,
): boolean {
  const report = supervisorReportISO?.trim() ?? "";
  const inspection = inspectionISO?.trim() ?? "";
  if (!report || !inspection) return false;
  return isStep10DateBefore(inspection, report);
}

export function isStep10DeliveryBeforeContractStart(
  contractStartISO: string,
  deliveryISO: string,
): boolean {
  const start = contractStartISO?.trim() ?? "";
  const delivery = deliveryISO?.trim() ?? "";
  if (!start || !delivery) return false;
  return isStep10DateBefore(delivery, start);
}

/** @deprecated */
export function hasStep10RowProgressRecorded(row: Step10InspectionRow): boolean {
  return (
    !!row.delivery_date?.trim() ||
    !!row.inspection_date?.trim() ||
    !!row.delivery_letter_no?.trim() ||
    !!row.inspection_result
  );
}

export function resolveLastInstallmentInspectionDate(rows: Step10InspectionRow[]): string {
  const withDate = rows.filter((r) => r.inspection_date?.trim());
  if (withDate.length === 0) return "";
  withDate.sort((a, b) => b.installment_no - a.installment_no);
  return withDate[0].inspection_date?.trim() ?? "";
}

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

export function step10RequiredDocCount(projectType: Step10ProjectType): number {
  return projectType === "construction" ? 3 : 2;
}
