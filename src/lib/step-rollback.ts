import {
  EMPTY_STEP1_CHECKLIST,
  EMPTY_STEP2_CHECKLIST,
  EMPTY_STEP3_CHECKLIST,
  buildProjectStep4Fields,
  buildProjectStep5Fields,
  buildProjectAppealFields,
  EMPTY_STEP4_BID_RESULT,
  EMPTY_STEP5_ANNOUNCEMENT,
  EMPTY_STEP6_APPEAL,
} from "@/lib/step-form";

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
      return buildProjectAppealFields({ ...EMPTY_STEP6_APPEAL });
    default:
      return {};
  }
}

type ProcurementStepWipe = {
  status: string;
  note: null;
  step_notes: null;
  due_date: null;
  responsible_officer_name: null;
  completed_at: null;
  completed_by: null;
  step1_checklist?: typeof EMPTY_STEP1_CHECKLIST;
  step2_checklist?: typeof EMPTY_STEP2_CHECKLIST;
  step3_checklist?: typeof EMPTY_STEP3_CHECKLIST;
};

/** ค่า default สำหรับล้างแถว procurement_steps ของขั้นที่ถูก rollback */
export function getStepRollbackProcurementStepWipe(stepNumber: number): ProcurementStepWipe {
  const base: ProcurementStepWipe = {
    status: "pending",
    note: null,
    step_notes: null,
    due_date: null,
    responsible_officer_name: null,
    completed_at: null,
    completed_by: null,
  };
  if (stepNumber === 1) return { ...base, step1_checklist: { ...EMPTY_STEP1_CHECKLIST } };
  if (stepNumber === 2) return { ...base, step2_checklist: { ...EMPTY_STEP2_CHECKLIST } };
  if (stepNumber === 3) return { ...base, step3_checklist: { ...EMPTY_STEP3_CHECKLIST } };
  return base;
}

/** เปิดขั้นก่อนหน้าให้แก้ไขได้อีกครั้งหลัง rollback */
export function getPreviousStepReopenPatch() {
  return {
    status: "in_progress",
    completed_at: null,
    completed_by: null,
  };
}
