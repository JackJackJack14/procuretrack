/**
 * Timeline Conflict Validation — เปรียบเทียบวันที่จากฐานข้อมูล (Dynamic) ห้าม hard-code วันที่
 */
import type { Step10InspectionRow } from "@/lib/step-form";
import type {
  Step2CommitteeOrder,
  Step2MedianPrice,
  Step3Announcement,
  Step4BidResult,
  Step5Announcement,
  Step6AppealState,
  Step7ContractNotice,
  Step8ContractExecution,
  Step9ContractSchedule,
} from "@/lib/step-form";
import {
  resolvePreviousStepMilestoneEndISO,
  resolveStep1PlanPublicationDateISO,
  type StepMilestoneProject,
  type StepMilestoneStep,
} from "@/lib/step-milestone-dates";
import { formatThaiDateSlash } from "@/lib/utils";

export const STEP3_TOR_APPROVAL_BEFORE_STEP1_PLAN_MSG =
  "❌ วันที่หัวหน้าลงนามร่าง TOR ไม่สามารถเกิดขึ้นก่อนวันประกาศแผนจัดซื้อจัดจ้างประจำปีได้";

export type TimelineValidationContext = {
  project: StepMilestoneProject;
  steps: StepMilestoneStep[];
  step3Note?: string | null;
};

export type TimelineValidationIssue = { id: string; message: string };

export type StepDateField = {
  id: string;
  iso: string;
  label: string;
};

export function buildTimelineValidationContext(input: {
  project: StepMilestoneProject;
  steps: Array<{ step_number: number; completed_at: string | null; due_date?: string | null }>;
  step3Note?: string | null;
}): TimelineValidationContext {
  return {
    project: input.project,
    steps: input.steps.map((s) => ({
      step_number: s.step_number,
      completed_at: s.completed_at,
      due_date: s.due_date ?? null,
    })),
    step3Note: input.step3Note ?? null,
  };
}

export function isStepDateBeforeReference(
  currentISO: string,
  referenceISO: string,
): boolean {
  const current = currentISO?.trim() ?? "";
  const reference = referenceISO?.trim() ?? "";
  if (!current || !reference) return false;
  return current < reference;
}

function crossStepConflictMessage(
  label: string,
  previousStepNumber: number,
  previousEndISO: string,
): string {
  return `❌ ${label} ต้องไม่ก่อนวันสิ้นสุดของขั้นตอนที่ ${previousStepNumber} (วันที่ ${formatThaiDateSlash(previousEndISO)})`;
}

export function getCrossStepTimelineConflictIssues(
  stepNumber: number,
  dateFields: StepDateField[],
  ctx: TimelineValidationContext,
): TimelineValidationIssue[] {
  if (stepNumber <= 1) return [];
  const previousEndISO = resolvePreviousStepMilestoneEndISO(
    stepNumber,
    ctx.project,
    ctx.steps,
    ctx.step3Note,
  );
  if (!previousEndISO) return [];

  const previousStepNumber = stepNumber - 1;
  const issues: TimelineValidationIssue[] = [];

  for (const field of dateFields) {
    const iso = field.iso?.trim() ?? "";
    if (!iso) continue;
    if (isStepDateBeforeReference(iso, previousEndISO)) {
      issues.push({
        id: `timeline_${field.id}_before_step_${previousStepNumber}`,
        message: crossStepConflictMessage(field.label, previousStepNumber, previousEndISO),
      });
    }
  }

  return issues;
}

export function getStep3TorApprovalBeforeStep1PlanIssue(
  approvalLetterDateISO: string,
  ctx: TimelineValidationContext,
): TimelineValidationIssue | null {
  const approval = approvalLetterDateISO?.trim() ?? "";
  if (!approval) return null;
  const step1PlanDate = resolveStep1PlanPublicationDateISO(ctx.steps, ctx.project);
  if (!step1PlanDate) return null;
  if (isStepDateBeforeReference(approval, step1PlanDate)) {
    return {
      id: "approval_letter_date_before_step1_plan",
      message: STEP3_TOR_APPROVAL_BEFORE_STEP1_PLAN_MSG,
    };
  }
  return null;
}

export function getStep3TimelineValidationIssues(
  announcement: Step3Announcement,
  ctx: TimelineValidationContext,
): TimelineValidationIssue[] {
  const issues: TimelineValidationIssue[] = [];
  const torIssue = getStep3TorApprovalBeforeStep1PlanIssue(
    announcement.approval_letter_date ?? "",
    ctx,
  );
  if (torIssue) issues.push(torIssue);

  issues.push(
    ...getCrossStepTimelineConflictIssues(
      3,
      [
        {
          id: "approval_letter_date",
          iso: announcement.approval_letter_date ?? "",
          label: "วันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนามร่าง TOR",
        },
        {
          id: "publication_start",
          iso: announcement.publication_start ?? "",
          label: "วันที่เริ่มเผยแพร่ร่างประกาศ",
        },
        {
          id: "publication_end",
          iso: announcement.publication_end ?? "",
          label: "วันที่สิ้นสุดเผยแพร่ร่างประกาศ",
        },
        {
          id: "procurement_request_approval_date",
          iso: announcement.procurement_request_approval_date ?? "",
          label: "วันที่หัวหน้าหน่วยงานอนุมัติรายงานขอซื้อขอจ้าง",
        },
      ],
      ctx,
    ),
  );

  return issues;
}

export function getStep2TimelineDateFields(
  committeeOrder: Step2CommitteeOrder,
  medianPrice: Step2MedianPrice,
): StepDateField[] {
  return [
    {
      id: "appointment_order_date",
      iso: committeeOrder.appointment_order_date ?? "",
      label: "วันที่ลงนามในคำสั่งแต่งตั้งคณะกรรมการ",
    },
    {
      id: "median_price_approval_date",
      iso: medianPrice.median_price_approval_date ?? "",
      label: "วันที่หัวหน้าหน่วยงานอนุมัติราคากลาง",
    },
  ];
}

export function getStep4TimelineDateFields(bidResult: Step4BidResult): StepDateField[] {
  return [
    {
      id: "procurement_request_approval_date",
      iso: bidResult.procurement_request_approval_date ?? "",
      label: "วันที่หัวหน้าหน่วยงานลงนามในรายงานขอซื้อขอจ้าง",
    },
    {
      id: "evaluation_report_approval_date",
      iso: bidResult.evaluation_report_approval_date ?? "",
      label: "วันที่หัวหน้าหน่วยงานลงนามอนุมัติผลการพิจารณา",
    },
    {
      id: "review_extension_approval_date",
      iso: bidResult.review_extension_approval_date ?? "",
      label: "วันที่หัวหน้าหน่วยงานอนุมัติขยายเวลาพิจารณาผล",
    },
  ];
}

export function getStep5TimelineDateFields(announcement: Step5Announcement): StepDateField[] {
  return [
    {
      id: "winner_announcement_date",
      iso: announcement.winner_announcement_date ?? "",
      label: "วันที่ลงนามในประกาศผู้ชนะการเสนอราคา",
    },
  ];
}

export function getStep6TimelineDateFields(appeal: Step6AppealState): StepDateField[] {
  return [
    {
      id: "appeal_report_approval_date",
      iso: appeal.appeal_report_approval_date ?? "",
      label: "วันที่หัวหน้าหน่วยงานอนุมัติรายงานผลการพิจารณาอุทธรณ์",
    },
  ];
}

export function getStep7TimelineDateFields(contractNotice: Step7ContractNotice): StepDateField[] {
  return [
    {
      id: "contract_notice_letter_date",
      iso: contractNotice.contract_notice_letter_date ?? "",
      label: "วันที่ออกหนังสือแจ้งให้ผู้ชนะมาลงนามในสัญญา",
    },
  ];
}

export function getStep8TimelineDateFields(
  contractExecution: Step8ContractExecution,
): StepDateField[] {
  return [
    {
      id: "contract_signed_date",
      iso: contractExecution.contract_signed_date ?? "",
      label: "วันที่ลงนามในสัญญา",
    },
  ];
}

export function getStep9TimelineDateFields(schedule: Step9ContractSchedule): StepDateField[] {
  return [
    {
      id: "work_start_date",
      iso: schedule.work_start_date ?? "",
      label: "วันที่เริ่มปฏิบัติงานหน้างาน",
    },
    {
      id: "notice_to_proceed_date",
      iso: schedule.notice_to_proceed_date ?? "",
      label: "วันที่แจ้งให้เริ่มปฏิบัติงาน",
    },
    {
      id: "egp_essential_publication_date",
      iso: schedule.egp_essential_publication_date ?? "",
      label: "วันที่ประกาศสาระสำคัญสัญญาใน e-GP",
    },
  ];
}

export function getStep10TimelineDateFields(rows: Step10InspectionRow[]): StepDateField[] {
  const fields: StepDateField[] = [];
  for (const row of rows) {
    if (row.planned_completion_date?.trim()) {
      fields.push({
        id: `installment_${row.installment_no}_planned_completion`,
        iso: row.planned_completion_date,
        label: `วันที่แล้วเสร็จตามแผน (งวดที่ ${row.installment_no})`,
      });
    }
    if (row.delivery_date?.trim()) {
      fields.push({
        id: `installment_${row.installment_no}_delivery_date`,
        iso: row.delivery_date,
        label: `วันที่ผู้รับจ้างส่งมอบงานจริง (งวดที่ ${row.installment_no})`,
      });
    }
    if (row.inspection_date?.trim()) {
      fields.push({
        id: `installment_${row.installment_no}_inspection_date`,
        iso: row.inspection_date,
        label: `วันที่ตรวจรับงาน (งวดที่ ${row.installment_no})`,
      });
    }
  }
  return fields;
}

/** คืนข้อผิดพลาดแรกสำหรับบล็อกบันทึก/ไปขั้นถัดไป — หรือ null ถ้าผ่าน */
export function getFirstTimelineValidationIssue(
  stepNumber: number,
  ctx: TimelineValidationContext,
  dateFields: StepDateField[],
  extraIssues: TimelineValidationIssue[] = [],
): TimelineValidationIssue | null {
  const issues = [
    ...extraIssues,
    ...getCrossStepTimelineConflictIssues(stepNumber, dateFields, ctx),
  ];
  return issues[0] ?? null;
}

/** บล็อกการบันทึกร่าง — คืนข้อความ error แรกหรือ null */
export function getTimelineSaveBlockMessage(
  stepNumber: number,
  ctx: TimelineValidationContext,
  input: {
    committeeOrder?: Step2CommitteeOrder;
    medianPrice?: Step2MedianPrice;
    announcement?: Step3Announcement;
    bidResult?: Step4BidResult;
    step5Announcement?: Step5Announcement;
    appeal?: Step6AppealState;
    contractNotice?: Step7ContractNotice;
    contractExecution?: Step8ContractExecution;
    contractSchedule?: Step9ContractSchedule;
    inspectionRows?: Step10InspectionRow[];
  },
): string | null {
  switch (stepNumber) {
    case 2:
      if (!input.committeeOrder || !input.medianPrice) return null;
      return (
        getFirstTimelineValidationIssue(
          2,
          ctx,
          getStep2TimelineDateFields(input.committeeOrder, input.medianPrice),
        )?.message ?? null
      );
    case 3:
      if (!input.announcement) return null;
      return getStep3TimelineValidationIssues(input.announcement, ctx)[0]?.message ?? null;
    case 4:
      if (!input.bidResult) return null;
      return (
        getFirstTimelineValidationIssue(
          4,
          ctx,
          getStep4TimelineDateFields(input.bidResult),
        )?.message ?? null
      );
    case 5:
      if (!input.step5Announcement) return null;
      return (
        getFirstTimelineValidationIssue(
          5,
          ctx,
          getStep5TimelineDateFields(input.step5Announcement),
        )?.message ?? null
      );
    case 6:
      if (!input.appeal) return null;
      return (
        getFirstTimelineValidationIssue(
          6,
          ctx,
          getStep6TimelineDateFields(input.appeal),
        )?.message ?? null
      );
    case 7:
      if (!input.contractNotice) return null;
      return (
        getFirstTimelineValidationIssue(
          7,
          ctx,
          getStep7TimelineDateFields(input.contractNotice),
        )?.message ?? null
      );
    case 8:
      if (!input.contractExecution) return null;
      return (
        getFirstTimelineValidationIssue(
          8,
          ctx,
          getStep8TimelineDateFields(input.contractExecution),
        )?.message ?? null
      );
    case 9:
      if (!input.contractSchedule) return null;
      return (
        getFirstTimelineValidationIssue(
          9,
          ctx,
          getStep9TimelineDateFields(input.contractSchedule),
        )?.message ?? null
      );
    case 10:
      return (
        getFirstTimelineValidationIssue(
          10,
          ctx,
          getStep10TimelineDateFields(input.inspectionRows ?? []),
        )?.message ?? null
      );
    default:
      return null;
  }
}
