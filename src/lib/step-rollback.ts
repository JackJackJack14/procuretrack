import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_STEP1_CHECKLIST,
  EMPTY_STEP2_CHECKLIST,
  EMPTY_STEP3_CHECKLIST,
  buildProjectStep4Fields,
  buildProjectStep5Fields,
  buildProjectAppealStatusSync,
  EMPTY_STEP4_BID_RESULT,
  EMPTY_STEP5_ANNOUNCEMENT,
  EMPTY_STEP6_APPEAL,
} from "@/lib/step-form";

/** คอลัมน์เสริมบน procurement_steps — อาจยังไม่มีบน Supabase Cloud จนกว่าจะรัน migration */
export const OPTIONAL_PROCUREMENT_STEP_COLUMNS = [
  "step1_checklist",
  "step2_checklist",
  "step3_checklist",
  "responsible_officer_name",
  "step_notes",
] as const;

export type ProcurementStepColumnAvailability = Record<
  (typeof OPTIONAL_PROCUREMENT_STEP_COLUMNS)[number],
  boolean
>;

let columnAvailabilityCache: ProcurementStepColumnAvailability | null = null;
let columnAvailabilityProbe: Promise<ProcurementStepColumnAvailability> | null =
  null;

function isColumnMissingError(errorMessage: string, column: string): boolean {
  const msg = errorMessage.toLowerCase();
  const col = column.toLowerCase();
  return (
    msg.includes(col) &&
    (msg.includes("schema cache") ||
      msg.includes("could not find") ||
      msg.includes("does not exist") ||
      msg.includes("column"))
  );
}

/** ดึงชื่อคอลัมน์ที่ไม่มีจากข้อความ error ของ PostgREST */
export function extractMissingColumnFromSchemaError(
  errorMessage: string,
): string | null {
  const quoted = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];
  const pgQuoted = errorMessage.match(/column "([^"]+)" of relation/i);
  if (pgQuoted?.[1]) return pgQuoted[1];
  return null;
}

/** ตัดคอลัมน์ใดๆ ที่ error บอกว่าไม่มีออกจาก payload */
export function stripMissingColumnFromPayload(
  errorMessage: string,
  payload: Record<string, unknown>,
): boolean {
  const missing = extractMissingColumnFromSchemaError(errorMessage);
  if (missing && missing in payload) {
    delete payload[missing];
    return true;
  }
  return false;
}

async function probeProcurementStepColumn(
  supabase: SupabaseClient,
  column: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("procurement_steps")
    .select(column)
    .limit(0);

  if (!error) return true;
  if (isColumnMissingError(error.message, column)) return false;

  console.warn(`[SchemaProbe] ไม่แน่ใจว่ามีคอลัมน์ ${column}:`, error.message);
  return false;
}

/** ตรวจสอบคอลัมน์ที่มีอยู่จริงบน procurement_steps (cache ต่อ session) */
export async function getProcurementStepColumnAvailability(
  supabase: SupabaseClient,
): Promise<ProcurementStepColumnAvailability> {
  if (columnAvailabilityCache) return columnAvailabilityCache;

  if (!columnAvailabilityProbe) {
    columnAvailabilityProbe = (async () => {
      const availability = {} as ProcurementStepColumnAvailability;
      for (const column of OPTIONAL_PROCUREMENT_STEP_COLUMNS) {
        availability[column] = await probeProcurementStepColumn(supabase, column);
      }
      columnAvailabilityCache = availability;
      console.info("[SchemaProbe] procurement_steps optional columns:", availability);
      return availability;
    })();
  }

  return columnAvailabilityProbe;
}

/** ล้าง cache — ใช้หลังรัน migration สำเร็จ */
export function resetProcurementStepColumnAvailabilityCache(): void {
  columnAvailabilityCache = null;
  columnAvailabilityProbe = null;
}

/** ตัดคอลัมน์ที่ไม่มีใน DB ออกจาก payload ก่อน update */
export function filterProcurementStepPayloadByAvailability(
  payload: Record<string, unknown>,
  availability: ProcurementStepColumnAvailability,
): Record<string, unknown> {
  const filtered = { ...payload };
  for (const column of OPTIONAL_PROCUREMENT_STEP_COLUMNS) {
    if (!availability[column] && column in filtered) {
      delete filtered[column];
    }
  }
  return filtered;
}

/** ข้อความยืนยันก่อน Hard Rollback */
export function getRollbackConfirmMessage(stepNumber: number): string {
  return (
    `ยืนยันการย้อนกลับจากขั้นตอนที่ ${stepNumber}?\n\n` +
    `ระบบจะล้างข้อมูลและเอกสารที่กรอกในขั้นตอนนี้ทั้งหมด ` +
    `แล้วย้อนกลับไปขั้นตอนที่ ${stepNumber - 1} เพื่อแก้ไขใหม่`
  );
}

/** ค่า null/default สำหรับล้างคอลัมน์ projects ตามขั้นที่ถูก rollback */
export function getStepRollbackProjectWipe(
  stepNumber: number,
): Record<string, string | number | null> {
  switch (stepNumber) {
    case 2:
      return {
        committee_appointment_mode: null,
        committee_appointment_order_no: null,
        committee_appointment_order_date: null,
        approved_median_price: null,
        estimated_price: null,
        median_price_approval_date: null,
        median_approval_letter_no: null,
      };
    case 3:
      return {
        procurement_request_letter_no: null,
        procurement_request_approval_date: null,
        committee_review_workdays: null,
      };
    case 4:
      return buildProjectStep4Fields({ ...EMPTY_STEP4_BID_RESULT });
    case 5:
      return buildProjectStep5Fields({ ...EMPTY_STEP5_ANNOUNCEMENT });
    case 6:
      return buildProjectAppealStatusSync({ ...EMPTY_STEP6_APPEAL });
    default:
      return {};
  }
}

/** คอลัมน์หลักที่มีอยู่เสมอบน procurement_steps */
function buildCoreProcurementStepWipe(): Record<string, unknown> {
  return {
    status: "pending",
    note: null,
    due_date: null,
    completed_at: null,
    completed_by: null,
  };
}

/**
 * ค่า default สำหรับล้างแถว procurement_steps
 * — ใส่เฉพาะคอลัมน์ที่ probe ยืนยันแล้วว่ามีจริง
 */
export function getStepRollbackProcurementStepWipe(
  stepNumber: number,
  availability?: ProcurementStepColumnAvailability,
): Record<string, unknown> {
  const payload = buildCoreProcurementStepWipe();

  const setIfAvailable = (column: string, value: unknown) => {
    if (availability && !availability[column as keyof ProcurementStepColumnAvailability]) {
      return;
    }
    if (!availability) return;
    payload[column] = value;
  };

  setIfAvailable("step_notes", null);
  setIfAvailable("responsible_officer_name", null);

  if (stepNumber === 1) {
    setIfAvailable("step1_checklist", { ...EMPTY_STEP1_CHECKLIST });
  }
  if (stepNumber === 2) {
    setIfAvailable("step2_checklist", { ...EMPTY_STEP2_CHECKLIST });
  }
  if (stepNumber === 3) {
    setIfAvailable("step3_checklist", { ...EMPTY_STEP3_CHECKLIST });
  }

  return payload;
}

/** เปิดขั้นก่อนหน้าให้แก้ไขได้อีกครั้งหลัง rollback */
export function getPreviousStepReopenPatch() {
  return {
    status: "in_progress",
    completed_at: null,
    completed_by: null,
  };
}

/** ตัดคอลัมน์ที่ schema cache ยังไม่มีออกจาก payload ตามข้อความ error */
export function stripMissingProcurementStepColumns(
  errorMessage: string,
  payload: Record<string, unknown>,
): boolean {
  let changed = false;

  for (const key of OPTIONAL_PROCUREMENT_STEP_COLUMNS) {
    if (isColumnMissingError(errorMessage, key) && key in payload) {
      delete payload[key];
      changed = true;
    }
  }

  return changed;
}

/**
 * อัปเดต procurement_steps — probe คอลัมน์ก่อน + retry ตัดคอลัมน์ที่ไม่มี
 */
export async function updateProcurementStepWithSchemaFallback(
  supabase: SupabaseClient,
  stepId: string,
  payload: Record<string, unknown>,
): Promise<{ error?: string }> {
  const availability = await getProcurementStepColumnAvailability(supabase);
  const working = filterProcurementStepPayloadByAvailability(payload, availability);

  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase
      .from("procurement_steps")
      .update(working)
      .eq("id", stepId);

    if (!error) return {};

    if (!stripMissingProcurementStepColumns(error.message, working)) {
      if (!stripMissingColumnFromPayload(error.message, working)) {
        return { error: error.message };
      }
    }

    for (const column of OPTIONAL_PROCUREMENT_STEP_COLUMNS) {
      if (!(column in working)) {
        availability[column] = false;
      }
    }
  }

  return { error: "อัปเดตขั้นตอนไม่สำเร็จ — schema ไม่ตรงกับระบบ" };
}

/**
 * อัปเดต projects — ตัดคอลัมน์ที่ DB ยังไม่มีออกทีละตัวจนสำเร็จ
 * (rollback รวม wipe หลายขั้น → อาจมีคอลัมน์ที่ migration ยังไม่รัน)
 */
export async function updateProjectWithSchemaFallback(
  supabase: SupabaseClient,
  projectId: string,
  payload: Record<string, unknown>,
): Promise<{ error?: string }> {
  const working = { ...payload };

  for (let attempt = 0; attempt < 40; attempt++) {
    const { error } = await supabase
      .from("projects")
      .update(working)
      .eq("id", projectId);

    if (!error) return {};

    if (!stripMissingColumnFromPayload(error.message, working)) {
      return { error: error.message };
    }
  }

  return { error: "อัปเดตโครงการไม่สำเร็จ — schema ไม่ตรงกับระบบ" };
}
