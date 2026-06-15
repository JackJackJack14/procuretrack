import {
  countFilledCommitteeMembers,
  EMPTY_STEP1_CHECKLIST,
  EMPTY_STEP2_CHECKLIST,
  EMPTY_STEP3_CHECKLIST,
  EMPTY_STEP4_CHECKLIST,
  parseBudgetInput,
  STEP1_CHECKLIST_ITEMS,
  STEP2_CHECKLIST_ITEMS,
  STEP3_CHECKLIST_ITEMS,
  STEP4_CHECKLIST_ITEMS,
  type Step1Checklist,
  type Step2Checklist,
  type Step2CommitteeOrder,
  type Step2CommitteesState,
  type Step2MedianPrice,
  type Step3Announcement,
  type Step3Checklist,
  type Step4BidResult,
  type Step4Checklist,
} from "@/lib/step-form";
import type { DocItem } from "@/lib/procurement";
import {
  getInlineEvidenceByKey,
  hasInlineEvidenceDoc,
} from "@/lib/checklist-inline-evidence";
import { STEP9_DOC, isStep9GanttDocType } from "@/lib/step-doc-types";
import {
  hasStep10RowProgressRecorded,
  isStep10RowInspectionPassed,
  step10RowHasAllInstallmentDocs,
} from "@/lib/step10-contract";
import type { Step10InspectionRow } from "@/lib/step-form";
import {
  getChecklistEvidenceIssues,
  type EvidenceValidationContext,
} from "@/lib/form-audit-trail";
import { hasStep1PlanPublicationDoc } from "@/lib/checklist-inline-evidence";

export type StepDocRef = { document_type: string };

export type ChecklistMode = "auto" | "manual";

export type SmartChecklistItem<K extends string = string> = {
  key: K;
  label: string;
  hint?: string;
  mode: ChecklistMode;
};

/** โหมด Auto/Manual ต่อ key — ขั้น 1–4 อ้างอิง key เดิมใน step-form */
const STEP_CHECKLIST_MODES: Record<number, Record<string, ChecklistMode>> = {
  1: {
    budget_allocated_confirmed: "auto",
    annual_plan_published: "auto",
    egp_plan_code_verified: "auto",
    project_name_and_type_verified: "auto",
    responsible_officer_confirmed: "auto",
  },
  2: {
    tor_median_committee_appointed: "auto",
    integrity_letter_signed: "auto",
    median_price_calculated_signed: "auto",
    median_price_director_approved: "auto",
    bg06_table_verified: "auto",
  },
  3: {
    draft_announcement_standard_compliant: "manual",
    spec_no_lock_in_verified: "manual",
    internal_memo_director_approval: "manual",
    median_price_step2_verified: "auto",
    hearing_files_prepared: "auto",
    egp_published_for_comment: "auto",
    comment_channel_prepared: "auto",
  },
  4: {
    egp_summary_downloaded: "auto",
    blacklist_checked: "auto",
    conflict_of_interest_checked: "auto",
    technical_price_reviewed: "auto",
    evaluation_report_submitted: "auto",
  },
  6: {
    appeal_status_recorded: "auto",
    appeal_period_passed_no_objection: "manual",
    appeal_agency_report_done: "manual",
    appeal_sent_to_cgd: "manual",
  },
};

export const STEP5_CHECKLIST_ITEMS: SmartChecklistItem[] = [
  {
    key: "winner_announcement_recorded",
    label: "บันทึกข้อมูลเลขที่และวันที่ประกาศผู้ชนะ",
    mode: "auto",
  },
  {
    key: "egp_winner_announced",
    label: "ประกาศผลผู้ชนะในระบบ e-GP เรียบร้อยแล้ว",
    mode: "manual",
  },
  {
    key: "physical_board_posted",
    label: "ปิดประกาศผลผู้ชนะ ณ ที่ทำการหน่วยงานรัฐเรียบร้อยแล้ว",
    mode: "manual",
  },
];

const STEP6_AUTO_ITEM: SmartChecklistItem = {
  key: "appeal_status_recorded",
  label: "บันทึกเลือกสถานะการอุทธรณ์ในฟอร์มเรียบร้อยแล้ว",
  mode: "auto",
};

const STEP6_NO_APPEAL_MANUAL: SmartChecklistItem = {
  key: "appeal_period_passed_no_objection",
  label: "ล่วงพ้นระยะเวลาอุทธรณ์ 7 วันทำการโดยไม่มีผู้คัดค้าน",
  mode: "manual",
};

const STEP6_PENDING_MANUAL: SmartChecklistItem[] = [
  {
    key: "appeal_agency_report_done",
    label: "จัดทำหนังสือรายงานผลการพิจารณาอุทธรณ์ของหน่วยงานเสร็จสิ้น",
    mode: "manual",
  },
  {
    key: "appeal_sent_to_cgd",
    label: "ส่งรายงานผลอุทธรณ์ให้กรมบัญชีกลางเรียบร้อย",
    mode: "manual",
  },
];

/** รายการ Checklist ขั้น 6 ตามสถานะอุทธรณ์ที่เลือก */
export function getStep6ChecklistItems(
  appealStatus: "" | "none" | "pending",
): SmartChecklistItem[] {
  if (appealStatus === "none") {
    return [STEP6_AUTO_ITEM, STEP6_NO_APPEAL_MANUAL];
  }
  if (appealStatus === "pending") {
    return [STEP6_AUTO_ITEM, ...STEP6_PENDING_MANUAL];
  }
  return [STEP6_AUTO_ITEM];
}

/** @deprecated ใช้ getStep6ChecklistItems */
export const STEP6_CHECKLIST_ITEMS: SmartChecklistItem[] = getStep6ChecklistItems("none");

export type Step7ChecklistKey =
  | "contract_notice_recorded"
  | "contract_notice_letter_uploaded"
  | "contract_notice_delivery_proof";

export const STEP7_CHECKLIST_ITEMS: SmartChecklistItem<Step7ChecklistKey>[] = [
  {
    key: "contract_notice_recorded",
    label: "บันทึกข้อมูลเลขที่และวันที่ออกหนังสือแจ้งเรียบร้อยแล้ว",
    mode: "auto",
  },
  {
    key: "contract_notice_letter_uploaded",
    label: "แนบไฟล์หนังสือแจ้งให้มาลงนามในสัญญาอย่างเป็นทางการ",
    hint: "หลักฐาน: บันทึกข้อความหรือหนังสือแจ้งที่หัวหน้าหน่วยงานลงนามแล้ว",
    mode: "manual",
  },
  {
    key: "contract_notice_delivery_proof",
    label: "แนบหลักฐานการนำส่งหรือการตอบรับหนังสือแจ้ง",
    hint: "หลักฐาน: ใบตอบรับไปรษณีย์ EMS หรือสำเนาหนังสือที่มีตัวแทนบริษัทเซ็นชื่อรับจริง",
    mode: "manual",
  },
];

export type Step8ChecklistKey =
  | "contract_guarantee_recorded"
  | "contract_guarantee_verified"
  | "contract_signed_stamped";

export const STEP8_CHECKLIST_ITEMS: SmartChecklistItem<Step8ChecklistKey>[] = [
  {
    key: "contract_guarantee_recorded",
    label: "บันทึกเลขที่สัญญา วันที่ลงนาม และมูลค่าสัญญาจัดซื้อจัดจ้างจริงครบถ้วน",
    mode: "auto",
  },
  {
    key: "contract_guarantee_verified",
    label: "ตรวจสอบและยืนยันความถูกต้องของหลักประกันสัญญาเรียบร้อยแล้ว",
    hint: "หลักฐาน: ใบเสร็จรับเงินค้ำประกัน หรือหนังสือตอบกลับยืนยันจากธนาคารเจ้าของ BG",
    mode: "manual",
  },
  {
    key: "contract_signed_stamped",
    label: "ลงนามในสัญญาและติดอากรแสตมป์/ชำระอากรถูกต้องตามกฎหมาย",
    hint: "หลักฐาน: ไฟล์สแกนเล่มสัญญาฉบับที่ลงนามครบทุกฝ่ายและมีดวงตราอากรแสตมป์หรือใบเสร็จ e-Stamp",
    mode: "manual",
  },
];

export type Step9ChecklistKey =
  | "egp_and_schedule_form_recorded"
  | "gantt_plan_saved"
  | "egp_essential_publication_attached"
  | "notice_to_proceed_attached";

export const STEP9_CHECKLIST_ITEMS: SmartChecklistItem<Step9ChecklistKey>[] = [
  {
    key: "egp_and_schedule_form_recorded",
    label: "บันทึกข้อมูลกลุ่ม 1–2 ครบ (e-GP, ระยะเวลา/งวดงาน, วันเริ่มงาน)",
    mode: "auto",
  },
  {
    key: "gantt_plan_saved",
    label: "บันทึกแผนปฏิบัติการก่อสร้าง (Gantt) เรียบร้อย",
    hint: "อัปโหลดไฟล์ Gantt ในกลุ่มที่ 2 ของฟอร์ม",
    mode: "auto",
  },
  {
    key: "egp_essential_publication_attached",
    label: "แนบใบประกาศสาระสำคัญจาก e-GP",
    hint: "รองรับ .pdf, .png, .jpg",
    mode: "manual",
  },
  {
    key: "notice_to_proceed_attached",
    label: "แนบหนังสือแจ้งเริ่มงาน",
    hint: "รองรับ .pdf เท่านั้น",
    mode: "manual",
  },
];

export type Step10ChecklistKey =
  | "daily_progress_logs_recorded"
  | "all_installments_closed";

/** Checklist ขั้นตอนที่ 10 — 2 ข้อ (0/2) พร้อม label งวดที่ปิดแล้ว */
export function getStep10ChecklistItems(
  passedCount = 0,
  totalCount = 0,
): SmartChecklistItem<Step10ChecklistKey>[] {
  return [
    {
      key: "daily_progress_logs_recorded",
      label: "มีการบันทึกรายงานประจำวันของผู้ควบคุมงานอย่างต่อเนื่อง",
      mode: "auto",
    },
    {
      key: "all_installments_closed",
      label: `ตรวจรับและปิดงวดงานครบถ้วนทุกงวด (${passedCount} / ${totalCount} งวด)`,
      mode: "auto",
    },
  ];
}

/** @deprecated ใช้ getStep10ChecklistItems() สำหรับ label แบบ dynamic */
export const STEP10_CHECKLIST_ITEMS: SmartChecklistItem<Step10ChecklistKey>[] =
  getStep10ChecklistItems(0, 0);

const GENERIC_STEP_ITEMS: Record<number, SmartChecklistItem[]> = {
  7: STEP7_CHECKLIST_ITEMS,
  8: STEP8_CHECKLIST_ITEMS,
  9: STEP9_CHECKLIST_ITEMS,
  10: STEP10_CHECKLIST_ITEMS,
};

function withModes<K extends string>(
  stepNumber: number,
  items: Array<{ key: K; label: string; hint?: string }>,
): SmartChecklistItem<K>[] {
  const modes = STEP_CHECKLIST_MODES[stepNumber] ?? {};
  return items.map((item) => ({
    ...item,
    mode: modes[item.key] ?? "manual",
  }));
}

export function getSmartChecklistItems(stepNumber: number): SmartChecklistItem[] {
  switch (stepNumber) {
    case 1:
      return withModes(1, STEP1_CHECKLIST_ITEMS);
    case 2:
      return withModes(2, STEP2_CHECKLIST_ITEMS);
    case 3:
      return withModes(3, STEP3_CHECKLIST_ITEMS);
    case 4:
      return withModes(4, STEP4_CHECKLIST_ITEMS);
    case 5:
      return STEP5_CHECKLIST_ITEMS;
    case 6:
      return getStep6ChecklistItems("none");
    default:
      return GENERIC_STEP_ITEMS[stepNumber] ?? [];
  }
}

export function createEmptyManualChecklist(stepNumber: number): Record<string, boolean> {
  const items =
    stepNumber === 6
      ? [
          ...getStep6ChecklistItems("none"),
          ...getStep6ChecklistItems("pending"),
        ].filter((item, index, arr) => arr.findIndex((i) => i.key === item.key) === index)
      : getSmartChecklistItems(stepNumber);
  const empty: Record<string, boolean> = {};
  items.forEach((item) => {
    if (item.mode === "manual") empty[item.key] = false;
  });
  return empty;
}

export function normalizeManualChecklist(
  stepNumber: number,
  raw: Record<string, boolean> | null | undefined,
): Record<string, boolean> {
  const base = createEmptyManualChecklist(stepNumber);
  if (!raw) return base;
  Object.keys(base).forEach((key) => {
    base[key] = !!raw[key];
  });
  return base;
}

function requiredDocsComplete(requiredDocs: DocItem[], uploadedTypes: string[]): boolean {
  if (requiredDocs.length === 0) return true;
  return requiredDocs.every((d) => uploadedTypes.includes(d.name));
}

export type SmartChecklistAutoContext = {
  stepNumber: number;
  responsibleName?: string;
  egpCode?: string;
  budget?: string;
  projectName?: string;
  method?: string;
  committees?: Step2CommitteesState;
  committeeOrder?: Step2CommitteeOrder;
  medianPrice?: Step2MedianPrice;
  announcement?: Step3Announcement;
  bidResult?: Step4BidResult;
  approvedMedianPrice?: number | null;
  medianPriceApprovalDate?: string | null;
  hasAppointmentOrderDoc?: boolean;
  hasBg06Doc?: boolean;
  hasIntegrityLetterDoc?: boolean;
  hasMemoDoc?: boolean;
  hasDraftTorDoc?: boolean;
  hasDraftAnnouncementDoc?: boolean;
  hasEgpAnnouncementDoc?: boolean;
  hasEgpScreenshotDoc?: boolean;
  hasEgpBidSummaryDoc?: boolean;
  hasBlacklistEvidenceDoc?: boolean;
  hasConflictEvidenceDoc?: boolean;
  hasCommitteeEvaluationDoc?: boolean;
  /** @deprecated ใช้ hasCommitteeEvaluationDoc */
  hasEvaluationReportDoc?: boolean;
  appealStatus?: string | null;
  step6Appeal?: {
    appeal_report_letter_no?: string;
    appeal_report_approval_date?: string;
  };
  step5Announcement?: { winner_announcement_no?: string; winner_announcement_date?: string };
  step7ContractNotice?: {
    contract_notice_letter_no?: string;
    contract_notice_letter_date?: string;
  };
  step8ContractExecution?: {
    contract_no?: string;
    contract_signed_date?: string;
    contract_amount?: number | null;
    guarantee_type?: string;
    guarantee_amount?: number | null;
    guarantee_document_no?: string;
  };
  step9ContractSchedule?: {
    contract_duration_days?: number | null;
    total_installment_count?: number | null;
    work_start_date?: string;
    notice_to_proceed_date?: string;
    egp_essential_publication_date?: string;
    egp_contract_control_no?: string;
    notice_to_proceed_letter_no?: string;
  };
  step10InspectionRows?: Step10InspectionRow[];
  evaluationApprovalDate?: string | null;
  requiredDocs?: DocItem[];
  uploadedDocTypes?: string[];
};

export function computeAutoChecklistState(ctx: SmartChecklistAutoContext): Record<string, boolean> {
  const { stepNumber } = ctx;
  const auto: Record<string, boolean> = {};
  const responsible = ctx.responsibleName?.trim() ?? "";
  const uploaded = ctx.uploadedDocTypes ?? [];
  const required = ctx.requiredDocs ?? [];

  if (stepNumber === 1) {
    const budgetVal = parseBudgetInput(ctx.budget ?? "");
    auto.budget_allocated_confirmed = !!budgetVal && budgetVal > 0;
    auto.annual_plan_published = hasStep1PlanPublicationDoc(
      (ctx.uploadedDocTypes ?? []).map((t) => ({ document_type: t })),
    );
    auto.egp_plan_code_verified = !!ctx.egpCode?.trim();
    auto.project_name_and_type_verified =
      !!ctx.projectName?.trim() &&
      !!ctx.method?.trim() &&
      !!ctx.egpCode?.trim();
    auto.responsible_officer_confirmed = !!responsible;
    return auto;
  }

  if (stepNumber === 2) {
    const committees = ctx.committees;
    const order = ctx.committeeOrder;
    const median = ctx.medianPrice;
    const torMedianMembersOk = committees
      ? committees.appointment_mode === "combined"
        ? countFilledCommitteeMembers(committees.combined_members) >= 3
        : countFilledCommitteeMembers(committees.tor_members) >= 3 &&
          countFilledCommitteeMembers(committees.median_price_members) >= 3
      : false;
    auto.tor_median_committee_appointed =
      torMedianMembersOk &&
      !!order?.appointment_order_no?.trim() &&
      !!order?.appointment_order_date?.trim() &&
      !!ctx.hasAppointmentOrderDoc;
    auto.integrity_letter_signed = !!ctx.hasIntegrityLetterDoc;
    const price = median?.approved_median_price;
    auto.median_price_calculated_signed =
      price != null && Number.isFinite(price) && price > 0;
    auto.median_price_director_approved = !!median?.median_approval_letter_no?.trim();
    auto.bg06_table_verified = !!ctx.hasBg06Doc;
    return auto;
  }

  if (stepNumber === 3) {
    const median =
      ctx.approvedMedianPrice != null &&
      Number.isFinite(ctx.approvedMedianPrice) &&
      ctx.approvedMedianPrice > 0;
    auto.median_price_step2_verified =
      median && !!ctx.medianPriceApprovalDate?.trim();
    auto.hearing_files_prepared =
      !!ctx.hasDraftTorDoc && !!ctx.hasDraftAnnouncementDoc && !!ctx.hasBg06Doc;
    const ann = ctx.announcement;
    auto.egp_published_for_comment =
      !!(ann?.egp_project_code?.trim() || ann?.egp_announcement_no?.trim()) &&
      (!!ctx.hasEgpAnnouncementDoc || !!ctx.hasEgpScreenshotDoc);
    auto.comment_channel_prepared = !!ann?.comment_channel_email?.trim();
    return auto;
  }

  if (stepNumber === 4) {
    const bid = ctx.bidResult;
    const hasCommittee =
      !!ctx.hasCommitteeEvaluationDoc || !!ctx.hasEvaluationReportDoc;
    const winningAmount =
      bid?.winning_bid_amount != null &&
      Number.isFinite(bid.winning_bid_amount) &&
      bid.winning_bid_amount > 0;
    auto.egp_summary_downloaded = !!ctx.hasEgpBidSummaryDoc;
    auto.blacklist_checked = !!ctx.hasBlacklistEvidenceDoc;
    auto.conflict_of_interest_checked =
      !!ctx.hasConflictEvidenceDoc && !!bid?.winning_bidder_name?.trim();
    auto.technical_price_reviewed = hasCommittee && winningAmount;
    auto.evaluation_report_submitted =
      hasCommittee &&
      !!bid?.evaluation_report_letter_no?.trim() &&
      !!bid?.evaluation_report_approval_date?.trim();
    return auto;
  }

  if (stepNumber === 5) {
    const ann = ctx.step5Announcement;
    const annDate = ann?.winner_announcement_date?.trim() ?? "";
    const evalApproval = ctx.evaluationApprovalDate?.trim() ?? "";
    const dateNotBeforeEvaluation =
      !annDate ||
      !evalApproval ||
      annDate >= evalApproval;
    auto.winner_announcement_recorded =
      !!ann?.winner_announcement_no?.trim() && !!annDate && dateNotBeforeEvaluation;
    return auto;
  }

  if (stepNumber === 6) {
    const status = ctx.appealStatus;
    const appeal = ctx.step6Appeal;
    if (status === "none") {
      auto.appeal_status_recorded = true;
    } else if (status === "pending") {
      auto.appeal_status_recorded =
        !!appeal?.appeal_report_letter_no?.trim() &&
        !!appeal?.appeal_report_approval_date?.trim();
    } else {
      auto.appeal_status_recorded = false;
    }
    return auto;
  }

  if (stepNumber === 7) {
    const notice = ctx.step7ContractNotice;
    auto.contract_notice_recorded =
      !!notice?.contract_notice_letter_no?.trim() &&
      !!notice?.contract_notice_letter_date?.trim();
    return auto;
  }

  if (stepNumber === 8) {
    const exec = ctx.step8ContractExecution;
    const contractAmount = exec?.contract_amount;
    auto.contract_guarantee_recorded =
      !!exec?.contract_no?.trim() &&
      !!exec?.contract_signed_date?.trim() &&
      contractAmount != null &&
      Number.isFinite(contractAmount) &&
      contractAmount > 0;
    return auto;
  }

  if (stepNumber === 9) {
    const schedule = ctx.step9ContractSchedule;
    const uploaded = ctx.uploadedDocTypes ?? [];
    const group1Complete =
      !!schedule?.egp_essential_publication_date?.trim() &&
      !!schedule?.egp_contract_control_no?.trim();
    const workStart =
      schedule?.work_start_date?.trim() || schedule?.notice_to_proceed_date?.trim() || "";
    const group2Complete =
      schedule?.contract_duration_days != null &&
      Number.isFinite(schedule.contract_duration_days) &&
      schedule.contract_duration_days > 0 &&
      schedule?.total_installment_count != null &&
      Number.isFinite(schedule.total_installment_count) &&
      schedule.total_installment_count > 0 &&
      !!workStart;
    auto.egp_and_schedule_form_recorded = group1Complete && group2Complete;
    auto.gantt_plan_saved =
      auto.egp_and_schedule_form_recorded &&
      uploaded.some((t) => isStep9GanttDocType(t));
    return auto;
  }

  if (stepNumber === 10) {
    const rows = ctx.step10InspectionRows ?? [];
    const uploaded = ctx.uploadedDocTypes ?? [];
    auto.daily_progress_logs_recorded = rows.some(hasStep10RowProgressRecorded);
    auto.all_installments_closed =
      rows.length > 0 &&
      rows.every(isStep10RowInspectionPassed) &&
      rows.every((row) => step10RowHasAllInstallmentDocs(row.installment_no, uploaded));
    return auto;
  }

  return auto;
}

export function buildEffectiveChecklist(
  stepNumber: number,
  manualChecklist: Record<string, boolean> | null | undefined,
  autoStates: Record<string, boolean> | null | undefined,
  docs?: StepDocRef[],
  itemsOverride?: SmartChecklistItem[],
): Record<string, boolean> {
  const manual = manualChecklist ?? {};
  const auto = autoStates ?? {};
  const items = itemsOverride ?? getSmartChecklistItems(stepNumber);
  const evidenceByKey = docs ? getInlineEvidenceByKey(stepNumber) : null;
  const effective: Record<string, boolean> = {};
  items.forEach((item) => {
    const evidence = evidenceByKey?.get(item.key);
    if (evidence?.uploadDriven && docs) {
      const hasDoc = hasInlineEvidenceDoc(
        docs,
        evidence.documentType,
        evidence.legacyDocumentTypes,
      );
      effective[item.key] =
        item.mode === "auto" ? hasDoc && !!auto[item.key] : hasDoc;
    } else if (item.mode === "auto") {
      effective[item.key] = !!auto[item.key];
    } else if (evidence && docs && !evidence.uploadDriven) {
      effective[item.key] =
        hasInlineEvidenceDoc(
          docs,
          evidence.documentType,
          evidence.legacyDocumentTypes,
        ) && !!manual[item.key];
    } else {
      effective[item.key] = !!manual[item.key];
    }
  });
  return effective;
}

/** คำนวณความครบของ Checklist แบบ reactive (รวม inline upload) */
export function computeReactiveChecklistEffective(
  stepNumber: number,
  items: SmartChecklistItem[],
  manualChecklist: Record<string, boolean> | null | undefined,
  autoStates: Record<string, boolean> | null | undefined,
  docs: StepDocRef[],
): { effective: Record<string, boolean>; done: number; total: number; allDone: boolean } {
  const effective = buildEffectiveChecklist(
    stepNumber,
    manualChecklist,
    autoStates,
    docs,
    items,
  );
  return { effective, ...countSmartChecklistProgressFromItems(items, effective) };
}

export function countSmartChecklistProgress(
  stepNumber: number,
  effective: Record<string, boolean>,
): { done: number; total: number; allDone: boolean } {
  return countSmartChecklistProgressFromItems(getSmartChecklistItems(stepNumber), effective);
}

export function countSmartChecklistProgressFromItems(
  items: SmartChecklistItem[],
  effective: Record<string, boolean>,
): { done: number; total: number; allDone: boolean } {
  const total = items.length;
  const done = items.filter((item) => effective[item.key]).length;
  return { done, total, allDone: done >= total && total > 0 };
}

export function isSmartChecklistComplete(
  stepNumber: number,
  effective: Record<string, boolean>,
): boolean {
  const items = getSmartChecklistItems(stepNumber);
  if (items.length === 0) return true;
  return items.every((item) => effective[item.key]);
}

export type GenericStepComplianceIssue = { id: string; message: string };

export function getGenericStepComplianceIssues(
  stepNumber: number,
  manualChecklist: Record<string, boolean> | null | undefined,
  autoStates: Record<string, boolean> | null | undefined,
  opts: {
    responsibleName: string;
    requiredDocs?: DocItem[];
    uploadedDocTypes?: string[];
  },
): GenericStepComplianceIssue[] {
  const requiredDocs = opts.requiredDocs ?? [];
  const uploadedDocTypes = opts.uploadedDocTypes ?? [];
  const stepDocs = uploadedDocTypes.map((document_type) => ({ document_type }));
  const effective = buildEffectiveChecklist(
    stepNumber,
    manualChecklist,
    autoStates,
    stepDocs,
  );
  const issues: GenericStepComplianceIssue[] = [];
  const items = getSmartChecklistItems(stepNumber);

  items.forEach((item, index) => {
    if (!effective[item.key]) {
      const prefix = item.mode === "auto" ? "ระบบตรวจพบยังไม่ครบ (Auto)" : "ยังไม่ได้ติ๊กยืนยัน";
      issues.push({
        id: `checklist-${item.key}`,
        message: `${prefix} ข้อที่ ${index + 1}: ${item.label}`,
      });
    }
  });

  if (!opts.responsibleName.trim()) {
    issues.push({
      id: "responsible_officer",
      message: "กรุณาระบุเจ้าหน้าที่ผู้รับผิดชอบโครงการ",
    });
  }

  const missingDocs = requiredDocs
    .filter((d) => d.required && !uploadedDocTypes.includes(d.name))
    .map((d) => d.name);
  if (missingDocs.length > 0) {
    issues.push({
      id: "required_docs",
      message: `กรุณาอัปโหลดเอกสารบังคับ: ${missingDocs.join(", ")}`,
    });
  }

  const evidenceCtx: EvidenceValidationContext = {
    uploadedDocTypes,
  };
  getChecklistEvidenceIssues(stepNumber, manualChecklist ?? {}, evidenceCtx).forEach((issue) => {
    issues.push(issue);
  });

  return issues;
}

export function isGenericStepReadyForNext(
  stepNumber: number,
  manualChecklist: Record<string, boolean> | null | undefined,
  autoStates: Record<string, boolean> | null | undefined,
  opts: Parameters<typeof getGenericStepComplianceIssues>[3],
): boolean {
  return getGenericStepComplianceIssues(stepNumber, manualChecklist, autoStates, opts).length === 0;
}

/** โหลด manual checklist จาก note JSON (ขั้น 6–10) */
export function loadManualChecklistFromNote(
  stepNumber: number,
  note: string | null,
): Record<string, boolean> {
  if (!note) return createEmptyManualChecklist(stepNumber);
  for (const marker of ["__STEP_FORM__:", "__PROCURE_FORM__"]) {
    const idx = note.indexOf(marker);
    if (idx < 0) continue;
    try {
      const raw = JSON.parse(note.slice(idx + marker.length)) as {
        checklist?: Record<string, boolean>;
      };
      return normalizeManualChecklist(stepNumber, raw?.checklist);
    } catch {
      break;
    }
  }
  return createEmptyManualChecklist(stepNumber);
}

export {
  EMPTY_STEP1_CHECKLIST,
  EMPTY_STEP2_CHECKLIST,
  EMPTY_STEP3_CHECKLIST,
  EMPTY_STEP4_CHECKLIST,
};
