import { STEP2_DOC } from "@/lib/step-doc-types";
import type { Step1SpecificWorkflowFields } from "@/lib/step1-specific-workflow";

export type Step2QuotationSource =
  | "market_survey"
  | "e_catalog"
  | "budget_standard"
  | "other"
  | "";

export const STEP2_QUOTATION_SOURCE_OPTIONS: Array<{
  value: Exclude<Step2QuotationSource, "">;
  label: string;
}> = [
  { value: "market_survey", label: "สืบราคาจากท้องตลาด" },
  { value: "e_catalog", label: "สืบราคาจาก e-Catalog" },
  { value: "budget_standard", label: "ราคามาตรฐานสำนักงบประมาณ/บัญชีกลาง" },
  { value: "other", label: "อื่น ๆ" },
];

/** ใบเสนอราคารายเดียว — วิธีเฉพาะเจาะจง (ขั้นตอนที่ 2) */
export type Step2SpecificQuotation = {
  vendor_name: string;
  quotation_no: string;
  quotation_date: string;
  /** @deprecated ใช้ final_price */
  amount: number | null;
  original_price: number | null;
  final_price: number | null;
  quotation_source: Step2QuotationSource;
  selection_reason: string;
};

export const EMPTY_STEP2_SPECIFIC_QUOTATION: Step2SpecificQuotation = {
  vendor_name: "",
  quotation_no: "",
  quotation_date: "",
  amount: null,
  original_price: null,
  final_price: null,
  quotation_source: "",
  selection_reason: "",
};

export const STEP2_SPECIFIC_QUOTATION_OVER_BUDGET_MSG =
  "⚠️ ยอดเงินเกินวงเงินงบประมาณที่ได้รับอนุมัติ!";

export const STEP2_SPECIFIC_FINAL_OVER_ORIGINAL_MSG =
  "⚠️ ราคาที่ตกลงหลังเจรจาต่อรองต้องไม่เกินราคาที่เสนอครั้งแรก!";

export const STEP2_SPECIFIC_QUOTATION_DATE_HINT =
  "โปรดระบุวันที่ตามที่ปรากฏในใบเสนอราคาจริงของร้านค้า (สามารถลงวันที่ย้อนหลังก่อนเริ่มโครงการได้)";

export const STEP2_SPECIFIC_QUOTATION_DATE_INVALID_MSG =
  "วันที่ในใบเสนอราคาต้องอยู่ในปีงบประมาณของโครงการ และต้องไม่เป็นวันที่ในอนาคต";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ช่วงปีงบประมาณไทย (ต.ค. – ก.ย.) */
export function resolveThaiFiscalYearISORange(fiscalYearBE: number): {
  startISO: string;
  endISO: string;
} {
  const startYear = fiscalYearBE - 544;
  const endYear = fiscalYearBE - 543;
  return {
    startISO: `${startYear}-10-01`,
    endISO: `${endYear}-09-30`,
  };
}

/** ขอบเขตวันที่เลือกได้ — ภายในปีงบประมาณ และไม่เกินวันนี้ */
export function resolveStep2SpecificQuotationDateBounds(fiscalYearBE: number): {
  minDate: string;
  maxDate: string;
} {
  const { startISO, endISO } = resolveThaiFiscalYearISORange(fiscalYearBE);
  const today = todayISO();
  return {
    minDate: startISO,
    maxDate: endISO < today ? endISO : today,
  };
}

export function isStep2SpecificQuotationDateValid(
  dateISO: string,
  fiscalYearBE: number,
): boolean {
  const trimmed = dateISO.trim();
  if (!trimmed || fiscalYearBE <= 0) return false;
  const { minDate, maxDate } = resolveStep2SpecificQuotationDateBounds(fiscalYearBE);
  return trimmed >= minDate && trimmed <= maxDate;
}

function parsePositivePrice(raw: unknown): number | null {
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseQuotationSource(raw: unknown): Step2QuotationSource {
  if (
    raw === "market_survey" ||
    raw === "e_catalog" ||
    raw === "budget_standard" ||
    raw === "other"
  ) {
    return raw;
  }
  return "";
}

export function normalizeStep2SpecificQuotation(
  raw: Partial<Step2SpecificQuotation> | null | undefined,
): Step2SpecificQuotation {
  if (!raw) return { ...EMPTY_STEP2_SPECIFIC_QUOTATION };

  const legacyAmount = parsePositivePrice(raw.amount);
  const original_price = parsePositivePrice(raw.original_price);
  const final_price = parsePositivePrice(raw.final_price) ?? legacyAmount;

  return {
    vendor_name: raw.vendor_name?.trim() ?? "",
    quotation_no: raw.quotation_no?.trim() ?? "",
    quotation_date: raw.quotation_date?.trim() ?? "",
    amount: final_price,
    original_price,
    final_price,
    quotation_source: parseQuotationSource(raw.quotation_source),
    selection_reason: raw.selection_reason?.trim() ?? "",
  };
}

export function isStep2SpecificQuotationComplete(
  quotation: Step2SpecificQuotation,
): boolean {
  const q = normalizeStep2SpecificQuotation(quotation);
  return (
    !!q.vendor_name &&
    !!q.quotation_no &&
    !!q.quotation_date &&
    q.original_price != null &&
    q.original_price > 0 &&
    q.final_price != null &&
    q.final_price > 0 &&
    !!q.quotation_source &&
    !!q.selection_reason
  );
}

export function isStep2SpecificQuotationOverBudget(
  amount: number | null | undefined,
  approvedBudget: number,
): boolean {
  if (!approvedBudget || approvedBudget <= 0) return false;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return false;
  return amount > approvedBudget;
}

export function isStep2SpecificFinalOverOriginal(
  finalPrice: number | null | undefined,
  originalPrice: number | null | undefined,
): boolean {
  if (originalPrice == null || originalPrice <= 0) return false;
  if (finalPrice == null || finalPrice <= 0) return false;
  return finalPrice > originalPrice;
}

export function hasStep2SpecificQuotationDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return (
    stepDocs?.some((d) => d.document_type === STEP2_DOC.SPECIFIC_QUOTATION) ?? false
  );
}

export function getStep2SpecificQuotationComplianceIssues(opts: {
  quotation: Step2SpecificQuotation;
  approvedBudget: number;
  fiscalYear?: number;
  stepDocs?: Array<{ document_type: string }>;
}): Array<{ id: string; message: string }> {
  const issues: Array<{ id: string; message: string }> = [];
  const q = normalizeStep2SpecificQuotation(opts.quotation);

  if (!q.vendor_name) {
    issues.push({
      id: "specific_quotation_vendor",
      message: "กรุณาระบุชื่อร้านค้า/ผู้เสนอราคา",
    });
  }
  if (!q.quotation_no) {
    issues.push({
      id: "specific_quotation_no",
      message: "กรุณาระบุเลขที่ใบเสนอราคา",
    });
  }
  if (!q.quotation_date) {
    issues.push({
      id: "specific_quotation_date",
      message: "กรุณาระบุวันที่ในใบเสนอราคา",
    });
  } else if (
    opts.fiscalYear != null &&
    opts.fiscalYear > 0 &&
    !isStep2SpecificQuotationDateValid(q.quotation_date, opts.fiscalYear)
  ) {
    issues.push({
      id: "specific_quotation_date_invalid",
      message: STEP2_SPECIFIC_QUOTATION_DATE_INVALID_MSG,
    });
  }
  if (q.original_price == null || q.original_price <= 0) {
    issues.push({
      id: "specific_quotation_original_price",
      message: "กรุณาระบุราคาที่เสนอครั้งแรก",
    });
  }
  if (q.final_price == null || q.final_price <= 0) {
    issues.push({
      id: "specific_quotation_final_price",
      message: "กรุณาระบุราคาที่ตกลงหลังเจรจาต่อรอง",
    });
  }
  if (!q.quotation_source) {
    issues.push({
      id: "specific_quotation_source",
      message: "กรุณาเลือกวิธีการสืบราคา",
    });
  }
  if (!q.selection_reason) {
    issues.push({
      id: "specific_quotation_selection_reason",
      message: "กรุณาระบุเหตุผลที่เลือกผู้ประกอบการรายนี้",
    });
  }
  if (!hasStep2SpecificQuotationDoc(opts.stepDocs)) {
    issues.push({
      id: "specific_quotation_doc",
      message: "กรุณาแนบไฟล์ PDF ใบเสนอราคา",
    });
  }
  if (isStep2SpecificQuotationOverBudget(q.final_price, opts.approvedBudget)) {
    issues.push({
      id: "specific_quotation_over_budget",
      message: STEP2_SPECIFIC_QUOTATION_OVER_BUDGET_MSG,
    });
  }
  if (isStep2SpecificFinalOverOriginal(q.final_price, q.original_price)) {
    issues.push({
      id: "specific_quotation_final_over_original",
      message: STEP2_SPECIFIC_FINAL_OVER_ORIGINAL_MSG,
    });
  }

  return issues;
}

export function countStep2SpecificQuotationProgress(opts: {
  quotation: Step2SpecificQuotation;
  approvedBudget: number;
  fiscalYear?: number;
  stepDocs?: Array<{ document_type: string }>;
}): { done: number; total: number } {
  const requiredIds = [
    "specific_quotation_vendor",
    "specific_quotation_no",
    "specific_quotation_date",
    "specific_quotation_date_invalid",
    "specific_quotation_original_price",
    "specific_quotation_final_price",
    "specific_quotation_source",
    "specific_quotation_selection_reason",
    "specific_quotation_doc",
  ];
  const issues = getStep2SpecificQuotationComplianceIssues(opts);
  const blocking = new Set(issues.map((i) => i.id));
  const done = requiredIds.filter((id) => !blocking.has(id)).length;
  return { done, total: requiredIds.length };
}

/** สรุปยอดเงินเพื่อส่งต่อขั้นตอนที่ 3 — รายงานผลการพิจารณาอนุมัติสั่งซื้อสั่งจ้าง */
export type Step2SpecificQuotationSummary = {
  quotationAmount: number | null;
  originalPrice: number | null;
  approvedBudget: number;
  budgetSavings: number | null;
  negotiationSavings: number | null;
  specReference: string;
  quotationSource: Step2QuotationSource;
  selectionReason: string;
};

export function buildStep2SpecificQuotationSummary(opts: {
  quotation: Step2SpecificQuotation;
  approvedBudget: number;
  specificWorkflow?: Step1SpecificWorkflowFields | null;
}): Step2SpecificQuotationSummary {
  const q = normalizeStep2SpecificQuotation(opts.quotation);
  const quotationAmount = q.final_price;
  const approvedBudget = opts.approvedBudget > 0 ? opts.approvedBudget : 0;
  const budgetSavings =
    quotationAmount != null && quotationAmount > 0 && approvedBudget > 0
      ? approvedBudget - quotationAmount
      : null;
  const negotiationSavings =
    q.original_price != null &&
    q.original_price > 0 &&
    quotationAmount != null &&
    quotationAmount > 0
      ? q.original_price - quotationAmount
      : null;

  return {
    quotationAmount,
    originalPrice: q.original_price,
    approvedBudget,
    budgetSavings,
    negotiationSavings,
    specReference: opts.specificWorkflow?.spec?.trim() ?? "",
    quotationSource: q.quotation_source,
    selectionReason: q.selection_reason,
  };
}
