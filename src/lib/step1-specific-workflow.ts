import { STEP2_DOC } from "@/lib/step-doc-types";
import { hasStep1PlanPublicationDoc } from "@/lib/checklist-inline-evidence";
import { isSpecificMethodShortWorkflow } from "@/lib/dynamic-stepper";

/** คำแนะนำขั้นตอนที่ 1 — วิธีเฉพาะเจาะจง (< 500,000 บาท) */
export const STEP1_SPECIFIC_GUIDELINE_ACTION =
  "เจ้าหน้าที่พัสดุจัดทำ 'รายงานขอซื้อขอจ้าง' ตามระเบียบฯ ข้อ 22 โดยระบุเหตุผลความจำเป็น คุณลักษณะเฉพาะ และราคากลาง พร้อมเสนอแต่งตั้งผู้ตรวจรับพัสดุ (รายเดียวหรือคณะกรรมการ) เสนอหัวหน้าหน่วยงานอนุมัติชอบ";

export const STEP1_SPECIFIC_GUIDELINE_DURATION =
  "ดำเนินการได้ทันที (Day 0) ได้รับยกเว้นไม่ต้องจัดทำและประกาศแผนจัดซื้อจัดจ้างประจำปีตาม ม.11";

export const STEP1_SPECIFIC_GUIDELINE_WARNING =
  "ห้ามแบ่งซื้อแบ่งจ้างเพื่อหลบเลี่ยงวิธีจัดซื้อ และตรวจสอบราคากลางให้ถูกต้องตาม ม.4";

/** ข้อความใต้หัวข้อขั้นตอน — วิธีเฉพาะเจาะจง ขั้นตอนที่ 1 */
export const STEP1_SPECIFIC_STEP_HEADER_HINT =
  "⏱️ ระยะเวลา: ดำเนินการได้ทันที (Day 0) ได้รับยกเว้นไม่ต้องจัดทำแผนจัดซื้อจัดจ้างประจำปี\n⚠️ ข้อควรระวัง: ห้ามแบ่งซื้อแบ่งจ้างเพื่อหลบเลี่ยงระเบียบวงเงิน และตรวจสอบฐานราคากลางตาม ม.4 ให้ถูกต้อง";

/** จุดวิกฤตไทม์ไลน์ — วิธีเฉพาะเจาะจง (5 ขั้นตอน) */
export const SPECIFIC_METHOD_TIMELINE_MILESTONES = [
  { uiStep: 1, backendStep: 1, label: "รายงานขอซื้อขอจ้าง & แต่งตั้งผู้ตรวจรับ" },
  { uiStep: 2, backendStep: 2, label: "เจรจาตกลงราคา & บันทึกใบเสนอราคา" },
  { uiStep: 3, backendStep: 4, label: "รายงานผลการพิจารณาอนุมัติสั่งซื้อสั่งจ้าง (ข้อ 25)" },
  { uiStep: 4, backendStep: 5, label: "ประกาศผู้ชนะ & ออกใบสั่งซื้อ/สั่งจ้าง (PO)" },
  { uiStep: 5, backendStep: 10, label: "บริหารสัญญาและการตรวจรับพัสดุ" },
] as const;

/** เอกสารแนบขั้นตอนที่ 1 — วิธีเฉพาะเจาะจง */
export const STEP1_SPECIFIC_DOC = {
  PURCHASE_REQUEST_REPORT: "ไฟล์รายงานขอซื้อขอจ้าง (ระเบียบข้อ 22)",
  MEDIAN_BG06: "เอกสารราคากลาง บก.06",
  MARKET_SURVEY_SPEC: "ใบสืบราคาจากท้องตลาด / เอกสารข้อมูลสเปก (Spec)",
} as const;

export type Step1SpecificInspectorType = "single" | "committee";

export type Step1SpecificInspector = {
  name: string;
  position: string;
};

/** @deprecated ใช้ Step1SpecificInspector */
export type Step1SpecificInspectorMember = Step1SpecificInspector;

/** Pipeline object — บันทึกใน note.specificWorkflow */
export type Step1SpecificWorkflowFields = {
  /** จำนวนวันที่ต้องการให้งานแล้วเสร็จ / ส่งมอบพัสดุ */
  delivery_days: number | null;
  /** เหตุผลและความจำเป็นที่ต้องซื้อ/จ้าง */
  reason: string;
  /** รายละเอียดคุณลักษณะเฉพาะพัสดุย่อ (Spec) */
  spec: string;
  inspector_type: Step1SpecificInspectorType | "";
  /** รายชื่อผู้รับผิดชอบการตรวจรับ — รายเดียว 1 คน / คณะกรรมการ ≥ 3 คน */
  inspectors: Step1SpecificInspector[];
};

export const EMPTY_STEP1_SPECIFIC_WORKFLOW: Step1SpecificWorkflowFields = {
  delivery_days: null,
  reason: "",
  spec: "",
  inspector_type: "",
  inspectors: [{ name: "", position: "" }],
};

export const STEP1_SPECIFIC_MIN_COMMITTEE_INSPECTORS = 3;

type LegacySpecificWorkflowRaw = Partial<Step1SpecificWorkflowFields> & {
  purchase_necessity_reason?: string;
  spec_summary?: string;
  median_price_basis?: string;
  inspector_single_name?: string;
  inspector_single_position?: string;
  inspector_committee_members?: Step1SpecificInspector[];
};

function emptyInspector(): Step1SpecificInspector {
  return { name: "", position: "" };
}

function padInspectors(
  members: Step1SpecificInspector[],
  minCount: number,
): Step1SpecificInspector[] {
  const next = members.map((m) => ({
    name: m?.name?.trim() ?? "",
    position: m?.position?.trim() ?? "",
  }));
  while (next.length < minCount) {
    next.push(emptyInspector());
  }
  return next;
}

function parseDeliveryDays(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function migrateInspectorsFromLegacy(raw: LegacySpecificWorkflowRaw): Step1SpecificInspector[] {
  if (Array.isArray(raw.inspectors) && raw.inspectors.length > 0) {
    return raw.inspectors.map((m) => ({
      name: m?.name?.trim() ?? "",
      position: m?.position?.trim() ?? "",
    }));
  }
  if (Array.isArray(raw.inspector_committee_members) && raw.inspector_committee_members.length > 0) {
    return raw.inspector_committee_members.map((m) => ({
      name: m?.name?.trim() ?? "",
      position: m?.position?.trim() ?? "",
    }));
  }
  const singleName = raw.inspector_single_name?.trim() ?? "";
  const singlePosition = raw.inspector_single_position?.trim() ?? "";
  if (singleName || singlePosition) {
    return [{ name: singleName, position: singlePosition }];
  }
  return [emptyInspector()];
}

export function minInspectorsForType(
  inspectorType: Step1SpecificInspectorType | "",
): number {
  if (inspectorType === "committee") return STEP1_SPECIFIC_MIN_COMMITTEE_INSPECTORS;
  if (inspectorType === "single") return 1;
  return 1;
}

export function normalizeStep1SpecificWorkflow(
  raw: LegacySpecificWorkflowRaw | null | undefined,
): Step1SpecificWorkflowFields {
  if (!raw) return { ...EMPTY_STEP1_SPECIFIC_WORKFLOW, inspectors: [emptyInspector()] };

  const inspector_type =
    raw.inspector_type === "committee"
      ? "committee"
      : raw.inspector_type === "single"
        ? "single"
        : "";

  const reason =
    raw.reason?.trim() ??
    raw.purchase_necessity_reason?.trim() ??
    "";
  const spec = raw.spec?.trim() ?? raw.spec_summary?.trim() ?? "";
  const delivery_days = parseDeliveryDays(raw.delivery_days);
  const migrated = migrateInspectorsFromLegacy(raw);
  const minCount = minInspectorsForType(inspector_type);
  const inspectors =
    inspector_type === "single"
      ? padInspectors(migrated.slice(0, 1), 1)
      : inspector_type === "committee"
        ? padInspectors(migrated, STEP1_SPECIFIC_MIN_COMMITTEE_INSPECTORS)
        : padInspectors(migrated.slice(0, 1), 1);

  return {
    delivery_days,
    reason,
    spec,
    inspector_type,
    inspectors: inspector_type ? inspectors : padInspectors(migrated.slice(0, 1), 1),
  };
}

export function inspectorsForTypeChange(
  prev: Step1SpecificWorkflowFields,
  nextType: Step1SpecificInspectorType,
): Step1SpecificInspector[] {
  const existing = prev.inspectors.length > 0 ? prev.inspectors : [emptyInspector()];
  if (nextType === "single") {
    return padInspectors(existing, 1);
  }
  return padInspectors(existing, STEP1_SPECIFIC_MIN_COMMITTEE_INSPECTORS);
}

export function hasStep1SpecificPurchaseReportDoc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return (
    stepDocs?.some((d) => d.document_type === STEP1_SPECIFIC_DOC.PURCHASE_REQUEST_REPORT) ??
    false
  );
}

export function hasStep1SpecificMedianBg06Doc(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  const types = new Set([
    STEP1_SPECIFIC_DOC.MEDIAN_BG06,
    STEP2_DOC.MEDIAN_PRICE_BG06,
  ]);
  return stepDocs?.some((d) => types.has(d.document_type)) ?? false;
}

export function isStep1SpecificCoreDocumentsReady(
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return hasStep1SpecificPurchaseReportDoc(stepDocs);
}

export function countFilledSpecificInspectors(
  members: Step1SpecificInspector[],
): number {
  return members.filter((m) => m.name.trim() && m.position.trim()).length;
}

export function isStep1SpecificInspectorsComplete(
  fields: Step1SpecificWorkflowFields,
): boolean {
  if (!fields.inspector_type) return false;
  const filled = countFilledSpecificInspectors(fields.inspectors);
  const required = minInspectorsForType(fields.inspector_type);
  return filled >= required;
}

export function getStep1SpecificWorkflowComplianceIssues(
  fields: Step1SpecificWorkflowFields,
  stepDocs?: Array<{ document_type: string }>,
): Array<{ id: string; message: string }> {
  const issues: Array<{ id: string; message: string }> = [];

  if (
    fields.delivery_days == null ||
    !Number.isFinite(fields.delivery_days) ||
    fields.delivery_days < 1
  ) {
    issues.push({
      id: "delivery_days",
      message:
        "กรุณาระบุกำหนดเวลาที่ต้องการให้งานแล้วเสร็จ / ส่งมอบพัสดุ (อย่างน้อย 1 วัน)",
    });
  }
  if (!fields.reason.trim()) {
    issues.push({
      id: "reason",
      message: "กรุณาระบุเหตุผลและความจำเป็นที่ต้องซื้อ/จ้าง",
    });
  }
  if (!fields.spec.trim()) {
    issues.push({
      id: "spec",
      message: "กรุณาระบุรายละเอียดคุณลักษณะเฉพาะพัสดุย่อ (Spec)",
    });
  }
  if (!fields.inspector_type) {
    issues.push({
      id: "inspector_type",
      message: "กรุณาเลือกประเภทผู้ตรวจรับพัสดุ",
    });
  } else {
    const required = minInspectorsForType(fields.inspector_type);
    const filled = countFilledSpecificInspectors(fields.inspectors);
    if (filled < required) {
      issues.push({
        id: "inspectors",
        message:
          fields.inspector_type === "single"
            ? "กรุณาระบุชื่อ-นามสกุลและตำแหน่งผู้ตรวจรับพัสดุรายเดียว"
            : `กรุณาระบุคณะกรรมการตรวจรับพัสดุอย่างน้อย ${STEP1_SPECIFIC_MIN_COMMITTEE_INSPECTORS} คน (ชื่อและตำแหน่ง)`,
      });
    }
  }
  if (!hasStep1SpecificPurchaseReportDoc(stepDocs)) {
    issues.push({
      id: "specific_purchase_report_doc",
      message: `กรุณาแนบ${STEP1_SPECIFIC_DOC.PURCHASE_REQUEST_REPORT} (PDF)`,
    });
  }
  return issues;
}

export function isStep1SpecificWorkflowReady(
  fields: Step1SpecificWorkflowFields,
  stepDocs?: Array<{ document_type: string }>,
): boolean {
  return getStep1SpecificWorkflowComplianceIssues(fields, stepDocs).length === 0;
}

export function isStep1EgpCodeUnlockedForMethod(
  method: string,
  opts?: {
    hasAnnualPlanDoc?: boolean;
    stepDocs?: Array<{ document_type: string }>;
  },
): boolean {
  if (isSpecificMethodShortWorkflow(method)) return true;
  return !!(opts?.hasAnnualPlanDoc || hasStep1PlanPublicationDoc(opts?.stepDocs));
}

export type PrunedTimelineMilestone = {
  uiStep: number;
  backendStep: number;
  label: string;
  date?: string;
  estimated?: boolean;
};

/** ยุบไทม์ไลน์ 10 ขั้น → 5 จุดวิกฤต สำหรับวิธีเฉพาะเจาะจง */
export function pruneTimelineForSpecificMethod(
  allItems: Array<{ stepNumber: number; date?: string; estimated?: boolean }>,
): PrunedTimelineMilestone[] {
  return SPECIFIC_METHOD_TIMELINE_MILESTONES.map((m) => {
    const base = allItems.find((it) => it.stepNumber === m.backendStep);
    return {
      uiStep: m.uiStep,
      backendStep: m.backendStep,
      label: m.label,
      date: base?.date,
      estimated: base?.estimated,
    };
  });
}
