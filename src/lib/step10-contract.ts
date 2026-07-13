import { addCalendarDaysISO } from "@/lib/step-form";
import type { Step10InspectionRow, Step10ProjectType } from "@/lib/step-form";
import type { StepDocRecord } from "@/lib/doc-upload";
import {
  STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT,
  STEP10_PENALTY_RATE_CONSTRUCTION_DEFAULT,
  STEP10_PENALTY_RATE_CONSTRUCTION_MAX,
  STEP10_PENALTY_RATE_CONSTRUCTION_MIN,
  STEP10_PENALTY_RATE_GENERAL_DEFAULT,
  todayLocalISO,
} from "@/lib/step10-guideline";

/** สถานะโครงการ — หลังปิดงานจ้าง อยู่ระหว่างค้ำประกัน 2 ปี */
export const PROJECT_STATUS_WARRANTY = "warranty";

/** สถานะโครงการ — ผู้ชนะไม่มาลงนามสัญญา (มาตรา 109) */
export const PROJECT_STATUS_CONTRACT_BREACH_CANCELLED = "contract_breach_cancelled";

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

export const STEP10_AMENDMENT_APPROVAL_DOC_PREFIX =
  "เอกสารอนุมัติแก้ไขสัญญา / บันทึกข้อความขยายเวลา";

export const STEP10_AMENDMENT_APPROVAL_UPLOAD_LABEL =
  "เอกสารอนุมัติแก้ไขสัญญา / บันทึกข้อความขยายเวลา (PDF) *";

export const STEP10_AMENDMENT_DOC_MISSING_MSG =
  "❌ กรุณาแนบไฟล์เอกสารอนุมัติแก้ไขสัญญา (PDF)";

/** ประเภทเอกสารอนุมัติแก้ไขสัญญา — ผูกกับ amendment.id เพื่อ audit trail */
export function step10AmendmentApprovalDocType(
  amendmentId: string,
  sequenceNo: number,
): string {
  const id = amendmentId?.trim() || `amendment-${sequenceNo}`;
  return `${STEP10_AMENDMENT_APPROVAL_DOC_PREFIX} (ครั้งที่ ${sequenceNo}) [${id}]`;
}

export function isStep10AmendmentApprovalDocType(documentType: string): boolean {
  return documentType.startsWith(STEP10_AMENDMENT_APPROVAL_DOC_PREFIX);
}

export function resolveStep10AmendmentApprovalDocType(
  amendment: { id: string; approval_document_type?: string | null },
  sequenceNo: number,
): string {
  return (
    amendment.approval_document_type?.trim() ||
    step10AmendmentApprovalDocType(amendment.id, sequenceNo)
  );
}

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

/**
 * วันครบกำหนดส่งมอบต่องวด — งวดสุดท้ายผูกกับวันสิ้นสุดสัญญา:
 * - มีประวัติขยายเวลา → ใช้วันสิ้นสุดสัญญาใหม่ล่าสุด
 * - ไม่มี → fallback วันสิ้นสุดสัญญาเดิม
 */
export function computeStep10InstallmentDueDates(opts: {
  workStartISO: string;
  contractDurationDays: number | null | undefined;
  totalInstallments: number;
  originalContractEndISO: string;
  amendments?: Step10ContractAmendment[];
}): string[] {
  const n = Math.max(0, Math.floor(opts.totalInstallments));
  if (n <= 0) return [];

  const base = computeStep10InstallmentPlannedDates(
    opts.workStartISO,
    opts.contractDurationDays,
    n,
  );

  const originalEnd = opts.originalContractEndISO?.trim() ?? "";
  const amendments = opts.amendments ?? [];
  const hasExtendedAmendment = amendments.some((a) => a.extended_contract_end_date?.trim());
  const effectiveEnd = resolveEffectiveContractEndDate(originalEnd, amendments);
  const lastDueDate = hasExtendedAmendment
    ? effectiveEnd
    : originalEnd || base[n - 1]?.trim() || "";

  if (!lastDueDate) return base;

  if (base.length === n) {
    return base.map((d, i) => (i === n - 1 ? lastDueDate : d?.trim() || ""));
  }

  return applyContractAmendmentToPlannedDates(
    opts.workStartISO,
    lastDueDate,
    n,
    base,
  );
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

/** จำนวนวันปฏิทินที่เหลือจนครบกำหนดค้ำประกัน (0 = วันสุดท้าย, ค่าลบ = เลยกำหนดแล้ว) */
export function computeWarrantyDaysRemaining(
  warrantyEndISO: string,
  asOfISO: string = todayLocalISO(),
): number | null {
  const end = warrantyEndISO?.trim() ?? "";
  const asOf = asOfISO?.trim() ?? "";
  if (!end || !asOf) return null;
  const endDate = parseLocalISODate(end);
  const asOfDate = parseLocalISODate(asOf);
  if (!endDate || !asOfDate) return null;
  const ms = endDate.getTime() - asOfDate.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function formatWarrantyCountdownLabel(daysRemaining: number | null): string {
  if (daysRemaining == null) return "— ยังไม่มีวันสิ้นสุดค้ำประกัน —";
  if (daysRemaining < 0) {
    return `เลยกำหนดคืนหลักประกันแล้ว ${Math.abs(daysRemaining)} วัน`;
  }
  if (daysRemaining === 0) return "วันนี้ครบกำหนดคืนหลักประกันสัญญา";
  return `เหลืออีก ${daysRemaining} วันปฏิทิน จนครบกำหนดคืนหลักประกันสัญญา`;
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

/** สถานะเบิกจ่ายงวดงาน — ขั้นตอนที่ 10 */
export type Step10PaymentStatus =
  | "awaiting_inspection"
  | "inspection_completed"
  | "payment_submitted"
  | "payment_completed";

export const STEP10_PAYMENT_STATUS_OPTIONS: {
  value: Step10PaymentStatus;
  label: string;
}[] = [
  { value: "awaiting_inspection", label: "รอตรวจรับ" },
  { value: "inspection_completed", label: "ตรวจรับแล้ว" },
  { value: "payment_submitted", label: "ส่งเรื่องเบิก" },
  { value: "payment_completed", label: "จ่ายเงินแล้ว" },
];

export const STEP10_DELIVERY_WARNING_DAYS = 7;

export const STEP10_SUPERVISOR_REPORT_VERIFIED_LABEL =
  "ตรวจสอบรายงานผู้ควบคุมงานก่อสร้างแล้ว (ตามระเบียบฯ ข้อ 176)";

export function normalizeStep10PaymentStatus(
  raw: string | null | undefined,
): Step10PaymentStatus {
  const found = STEP10_PAYMENT_STATUS_OPTIONS.find((o) => o.value === raw);
  return found?.value ?? "awaiting_inspection";
}

export function inferStep10PaymentStatusFromRow(row: {
  inspection_result?: string | null;
  installment_status?: string | null;
  payment_status?: string | null;
}): Step10PaymentStatus {
  const explicit = row.payment_status?.trim();
  if (explicit) return normalizeStep10PaymentStatus(explicit);
  if (normalizeStep10InspectionResult(row.inspection_result) === "passed") {
    return "inspection_completed";
  }
  if (row.installment_status === "inspection_passed") {
    return "inspection_completed";
  }
  return "awaiting_inspection";
}

export type Step10DeliveryAlert = {
  level: "yellow" | "red";
  message: string;
  daysRemaining: number | null;
  daysOverdue: number | null;
};

/** แจ้งเตือนกำหนดส่งมอบ — เฉพาะสถานะรอตรวจรับ */
export function computeStep10InstallmentDeliveryAlert(
  plannedISO: string,
  paymentStatus: Step10PaymentStatus,
  asOfISO: string = todayLocalISO(),
): Step10DeliveryAlert | null {
  if (paymentStatus !== "awaiting_inspection") return null;
  const planned = plannedISO?.trim() ?? "";
  const asOf = asOfISO?.trim() ?? "";
  if (!planned || !asOf) return null;

  if (asOf > planned) {
    const daysOverdue = countCalendarDaysBetweenISO(planned, asOf);
    if (daysOverdue <= 0) return null;
    return {
      level: "red",
      message: `เกินกำหนดส่งมอบ ${daysOverdue} วันปฏิทิน — ระบบคำนวณค่าปรับสะสมอัตโนมัติ`,
      daysRemaining: null,
      daysOverdue,
    };
  }

  const daysRemaining = countCalendarDaysBetweenISO(asOf, planned);
  if (daysRemaining > 0 && daysRemaining <= STEP10_DELIVERY_WARNING_DAYS) {
    return {
      level: "yellow",
      message: `ใกล้ครบกำหนดส่งมอบงาน — เหลืออีก ${daysRemaining} วันปฏิทิน`,
      daysRemaining,
      daysOverdue: null,
    };
  }

  return null;
}

export type Step10PenaltyLiveResult = Step10PenaltyResult & {
  /** ประมาณการจากวันนี้ (ยังไม่มีวันส่งมอบจริง หรืองานยังไม่เสร็จสมบูรณ์) */
  isLiveEstimate: boolean;
  /** ค่าปรับสะสมต่อเนื่อง — ผลตรวจรับ = ข้อบกพร่อง */
  isOngoingAccumulation?: boolean;
};

/**
 * ค่าปรับรายงวด — ผูกผลการตรวจรับ:
 * - ผ่าน: หยุดนับในวันส่งมอบจริง (delivery − planned)
 * - ข้อบกพร่อง: สะสมต่อเนื่องจนถึงวันนี้ (planned → today)
 */
export function computeStep10InstallmentPenaltyLive(opts: {
  projectType: Step10ProjectType;
  contractAmount: number | null | undefined;
  totalInstallments: number;
  penaltyRatePct: number | null | undefined;
  plannedISO: string;
  actualDeliveryISO?: string | null;
  inspectionResult?: string | null;
  asOfISO?: string;
}): Step10PenaltyLiveResult {
  const planned = opts.plannedISO?.trim() ?? "";
  const actual = opts.actualDeliveryISO?.trim() ?? "";
  const asOf = opts.asOfISO?.trim() || todayLocalISO();
  const inspection = normalizeStep10InspectionResult(opts.inspectionResult);

  if (!planned) {
    return { daysLate: 0, penaltyBaht: 0, isLiveEstimate: false };
  }

  if (inspection === "defects") {
    if (asOf > planned) {
      return {
        ...computeStep10InstallmentPenalty({ ...opts, actualDeliveryISO: asOf }),
        isLiveEstimate: true,
        isOngoingAccumulation: true,
      };
    }
    return { daysLate: 0, penaltyBaht: 0, isLiveEstimate: false };
  }

  if (inspection === "passed") {
    if (actual && actual > planned) {
      return {
        ...computeStep10InstallmentPenalty({ ...opts, actualDeliveryISO: actual }),
        isLiveEstimate: false,
        isOngoingAccumulation: false,
      };
    }
    return { daysLate: 0, penaltyBaht: 0, isLiveEstimate: false };
  }

  if (!actual && planned && asOf > planned) {
    return {
      ...computeStep10InstallmentPenalty({ ...opts, actualDeliveryISO: asOf }),
      isLiveEstimate: true,
      isOngoingAccumulation: false,
    };
  }

  if (actual && actual > planned) {
    return {
      ...computeStep10InstallmentPenalty({ ...opts, actualDeliveryISO: actual }),
      isLiveEstimate: false,
      isOngoingAccumulation: false,
    };
  }

  return { daysLate: 0, penaltyBaht: 0, isLiveEstimate: false };
}

export function computeStep10TotalAccumulatedPenalty(opts: {
  projectType: Step10ProjectType;
  contractAmount: number | null | undefined;
  totalInstallments: number;
  rows: Array<{
    planned_completion_date?: string | null;
    delivery_date?: string | null;
    penalty_rate_pct?: number | null;
    inspection_result?: string | null;
  }>;
  asOfISO?: string;
}): { totalPenaltyBaht: number; rowsWithPenalty: number } {
  let totalPenaltyBaht = 0;
  let rowsWithPenalty = 0;
  for (const row of opts.rows) {
    const result = computeStep10InstallmentPenaltyLive({
      projectType: opts.projectType,
      contractAmount: opts.contractAmount,
      totalInstallments: opts.totalInstallments,
      penaltyRatePct:
        row.penalty_rate_pct ?? step10DefaultPenaltyRatePct(opts.projectType),
      plannedISO: row.planned_completion_date ?? "",
      actualDeliveryISO: row.delivery_date,
      inspectionResult: row.inspection_result,
      asOfISO: opts.asOfISO,
    });
    if (result.penaltyBaht > 0) {
      totalPenaltyBaht += result.penaltyBaht;
      rowsWithPenalty += 1;
    }
  }
  return {
    totalPenaltyBaht: Math.round(totalPenaltyBaht * 100) / 100,
    rowsWithPenalty,
  };
}

export type Step10ContractAmendment = {
  id: string;
  amendment_date: string;
  description: string;
  /** วันสิ้นสุดสัญญาใหม่ (กรณีขยายเวลา) */
  extended_contract_end_date?: string;
  /** ประเภทเอกสารในระบบ — เอกสารอนุมัติแก้ไขสัญญา (PDF) */
  approval_document_type?: string;
};

export function normalizeStep10ContractAmendment(
  raw: Partial<Step10ContractAmendment>,
  index: number,
): Step10ContractAmendment {
  const id = raw.id?.trim() || `amendment-${index + 1}`;
  const sequenceNo = index + 1;
  return {
    id,
    amendment_date: raw.amendment_date?.trim() ?? "",
    description: raw.description?.trim() ?? "",
    extended_contract_end_date: raw.extended_contract_end_date?.trim() ?? "",
    approval_document_type:
      raw.approval_document_type?.trim() ||
      step10AmendmentApprovalDocType(id, sequenceNo),
  };
}

/** วันสิ้นสุดสัญญาหลังรวมการแก้ไขล่าสุด */
export function resolveEffectiveContractEndDate(
  baseEndISO: string,
  amendments: Step10ContractAmendment[] = [],
): string {
  const base = baseEndISO?.trim() ?? "";
  const sorted = [...amendments]
    .filter((a) => a.extended_contract_end_date?.trim())
    .sort((a, b) => (a.amendment_date || "").localeCompare(b.amendment_date || ""));
  const latest = sorted[sorted.length - 1]?.extended_contract_end_date?.trim();
  return latest || base;
}

/**
 * วันต่ำสุดของ「วันที่ลงนามสัญญาแก้ไข」— ต้องไม่ก่อนวันเริ่มต้นสัญญา
 */
export function step10AmendmentMinSigningDate(contractStartISO: string): string {
  return contractStartISO?.trim() ?? "";
}

/**
 * วันสูงสุดของ「วันที่ลงนามสัญญาแก้ไข」— ต้องไม่เกินวันสิ้นสุดสัญญาเดิม (ระเบียบฯ ข้อ 182)
 */
export function step10AmendmentMaxSigningDate(baseContractEndISO: string): string {
  return baseContractEndISO?.trim() ?? "";
}

export const STEP10_AMENDMENT_SIGNING_DATE_OUT_OF_BOUNDS_MSG =
  "❌ วันที่แก้ไขสัญญาต้องอยู่ระหว่างวันเริ่มต้นสัญญาและก่อนวันสิ้นสุดสัญญาเดิม";

/** วันที่ลงนามสัญญาแก้ไขอยู่นอกช่วง [วันเริ่มต้นสัญญา, วันสิ้นสุดสัญญาเดิม] */
export function isStep10AmendmentSigningDateOutOfBounds(
  contractStartISO: string,
  baseContractEndISO: string,
  signingISO: string,
): boolean {
  const signing = signingISO?.trim() ?? "";
  if (!signing) return false;
  const start = contractStartISO?.trim() ?? "";
  const end = baseContractEndISO?.trim() ?? "";
  if (start && signing < start) return true;
  if (end && signing > end) return true;
  return false;
}

/**
 * วันขั้นต่ำของ "วันสิ้นสุดสัญญาใหม่" — ต้องมากกว่าวันสิ้นสุดสัญญาปัจจุบัน 1 วันปฏิทิน
 */
export function step10AmendmentMinExtendedEndDate(currentEndISO: string): string {
  const current = currentEndISO?.trim() ?? "";
  if (!current) return "";
  return addCalendarDaysISO(current, 1) ?? "";
}

/**
 * ปรับวันครบกำหนดงวดหลังขยายสัญญา
 * — คงวันครบกำหนดงวดก่อนหน้าไว้ และบังคับให้งวดสุดท้าย = วันสิ้นสุดสัญญาใหม่
 */
export function applyContractAmendmentToPlannedDates(
  workStartISO: string,
  newContractEndISO: string,
  totalInstallments: number,
  existingPlannedDates: string[] = [],
): string[] {
  const start = workStartISO?.trim() ?? "";
  const end = newContractEndISO?.trim() ?? "";
  const n = Math.max(0, Math.floor(totalInstallments));
  if (!end || n <= 0) return [];

  if (existingPlannedDates.length === n) {
    return existingPlannedDates.map((d, i) => (i === n - 1 ? end : (d?.trim() || "")));
  }

  if (!start || end <= start) {
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? end : ""));
  }
  const durationDays = countCalendarDaysBetweenISO(start, end);
  if (durationDays <= 0) {
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? end : ""));
  }
  const redistributed = computeStep10InstallmentPlannedDates(start, durationDays, n);
  if (redistributed.length === n) {
    redistributed[n - 1] = end;
  }
  return redistributed;
}

/** ปิดโครงการได้เมื่อทุกงวดเป็น «จ่ายเงินแล้ว» และเอกสารบังคับครบ */
export function canArchiveStep10Project(
  rows: Array<{
    installment_no: number;
    payment_status?: string | null;
    inspection_result?: string | null;
    installment_status?: string | null;
  }>,
  uploadedTypes: string[],
  projectType: Step10ProjectType,
  totalInstallmentCount: number,
): boolean {
  const expected = Math.max(0, Math.floor(totalInstallmentCount));
  if (expected <= 0 || rows.length !== expected) return false;
  return rows.every((row) => {
    const status = inferStep10PaymentStatusFromRow(row);
    return (
      status === "payment_completed" &&
      step10RowHasRequiredDocs(row.installment_no, uploadedTypes, projectType)
    );
  });
}

export type Step10DocChecklistItem = {
  key: "delivery" | "supervisor" | "inspection";
  label: string;
  documentType: string;
  uploaded: boolean;
  required: boolean;
};

/** Checklist เอกสารบังคับตามระเบียบฯ ข้อ 176 — แยกช่องชัดเจน */
export function getStep10InstallmentDocChecklist(
  installmentNo: number,
  uploadedTypes: string[],
  projectType: Step10ProjectType,
): Step10DocChecklistItem[] {
  const items: Step10DocChecklistItem[] = [
    {
      key: "delivery",
      label: "หนังสือส่งมอบงานประจำงวดของผู้รับจ้าง (PDF)",
      documentType: STEP10_INSTALLMENT_DOC.deliveryLetter(installmentNo),
      uploaded: uploadedHasAnyType(
        uploadedTypes,
        step10InstallmentDeliveryLetterDocTypes(installmentNo),
      ),
      required: true,
    },
  ];
  if (projectType === "construction") {
    items.push({
      key: "supervisor",
      label: "รายงานผลการปฏิบัติงานประจำงวดของผู้ควบคุมงานก่อสร้าง (PDF)",
      documentType: STEP10_INSTALLMENT_DOC.supervisorReport(installmentNo),
      uploaded: uploadedHasAnyType(
        uploadedTypes,
        step10InstallmentSupervisorReportDocTypes(installmentNo),
      ),
      required: true,
    });
  }
  items.push({
    key: "inspection",
    label: "ใบรายงานผลการตรวจรับพัสดุของคณะกรรมการ (PDF)",
    documentType: STEP10_INSTALLMENT_DOC.inspectionReport(installmentNo),
    uploaded: uploadedHasAnyType(
      uploadedTypes,
      step10InstallmentInspectionReportDocTypes(installmentNo),
    ),
    required: true,
  });
  return items;
}

export function canAdvanceStep10PaymentStatus(
  target: Step10PaymentStatus,
  row: {
    inspection_result?: string | null;
    supervisor_report_verified?: boolean;
  },
  projectType: Step10ProjectType,
  hasRequiredDocs: boolean,
  installmentNo: number,
  uploadedTypes: string[] = [],
): { ok: true } | { ok: false; message: string; issueId: string } {
  if (target === "awaiting_inspection") return { ok: true };

  if (target === "inspection_completed") {
    return { ok: true };
  }

  if (target === "payment_submitted" || target === "payment_completed") {
    if (!hasRequiredDocs) {
      const checklist = getStep10InstallmentDocChecklist(installmentNo, uploadedTypes, projectType);
      const missing = checklist.filter((d) => d.required && !d.uploaded);
      const firstMissing = missing[0];
      const issueId = firstMissing
        ? firstMissing.key === "delivery"
          ? `installment-${installmentNo}-delivery_letter_doc`
          : firstMissing.key === "supervisor"
            ? `installment-${installmentNo}-supervisor_report_doc`
            : `installment-${installmentNo}-inspection_report_doc`
        : `installment-${installmentNo}-docs`;
      const names = missing.map((d) => d.label).join(", ");
      return {
        ok: false,
        message: `งวดที่ ${installmentNo}: ต้องแนบเอกสารบังคับครบก่อนส่งเรื่องเบิกจ่าย — ขาด: ${names || "เอกสารบังคับ"}`,
        issueId,
      };
    }

    const inspectionPassed = normalizeStep10InspectionResult(row.inspection_result) === "passed";
    if (!inspectionPassed) {
      return {
        ok: false,
        message: `งวดที่ ${installmentNo}: ต้องผ่านการตรวจรับก่อนเปลี่ยนสถานะเบิกจ่าย`,
        issueId: `installment-${installmentNo}-inspection_result`,
      };
    }

    if (projectType === "construction" && !row.supervisor_report_verified) {
      return {
        ok: false,
        message: `งวดที่ ${installmentNo}: ต้องติ๊กยืนยัน "${STEP10_SUPERVISOR_REPORT_VERIFIED_LABEL}" ก่อนส่งเรื่องเบิกจ่าย`,
        issueId: `installment-${installmentNo}-supervisor_verified`,
      };
    }

    return { ok: true };
  }

  return { ok: true };
}
