import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Download, ChevronDown, FileText, Loader2, FolderOpen, CheckCircle2 } from "lucide-react";
import { ChronologicalDatePicker } from "@/components/ChronologicalDatePicker";
import { formatThaiDate, formatThaiDateSlash } from "@/lib/utils";
import {
  countWorkdaysAfterStartISO,
  defaultPublicationEndISO,
  MIN_DRAFT_PUBLICATION_WORKDAYS,
  STEP3_PUBLICATION_END_GUIDELINE,
  STEP3_PUBLICATION_END_TOO_SHORT_MSG,
  STEP3_PUBLICATION_NON_WORKDAY_MSG,
  STEP3_PUBLICATION_BEFORE_APPROVAL_MSG,
  STEP3_PUBLICATION_EXTENSION_REASON_MSG,
  isPublicationEndExtendedBeyondMinimum,
  isWorkdayISO,
} from "@/lib/workdays";
import {
  isStepDateBeforeReference,
  STEP3_TOR_APPROVAL_BEFORE_STEP1_PLAN_MSG,
  type TimelineValidationContext,
} from "@/lib/timeline-validation";
import { InlineDocUpload, MissingDocHighlightContext } from "@/components/steps/InlineDocUpload";
import { CurrencyInput } from "@/components/CurrencyInput";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import { downloadStepDocument, openStepDocument } from "@/lib/doc-upload";
import {
  STEP3_DOC,
  STEP3_DRAFT_TOR_UPLOAD_LABEL,
  STEP3_DRAFT_ANNOUNCEMENT_UPLOAD_LABEL,
  STEP3_MEDIAN_BG06_UPLOAD_LABEL,
  STEP3_EGP_SCREENSHOT_UPLOAD_LABEL,
  STEP3_FEEDBACK_HELPER_HAS_COMMENTS,
  STEP3_FEEDBACK_HELPER_NONE,
  STEP3_FEEDBACK_UPLOAD_LABEL,
  STEP3_MEMO_APPROVAL_UPLOAD_LABEL,
} from "@/lib/step-doc-types";
import {
  STEP2_DOC,
  STEP2_APPOINTMENT_ORDER_UPLOAD_LABEL,
  STEP2_BOQ_UPLOAD_LABEL,
  STEP2_BG06_UPLOAD_LABEL,
  STEP2_INTEGRITY_LETTER_UPLOAD_LABEL,
  STEP2_EVALUATION_INSPECTION_ORDER_UPLOAD_LABEL,
  STEP2_SITE_SUPERVISOR_ORDER_UPLOAD_LABEL,
  step2MarketQuoteDocType,
  step2MarketQuoteUploadLabel,
  countStep2MarketQuoteDocsUploaded,
  STEP5_DOC,
  STEP5_ALL_BIDDERS_RESULT_UPLOAD_LABEL,
  STEP4_DOC,
  STEP4_SIGNED_PROCUREMENT_REQUEST_UPLOAD_LABEL,
  STEP4_PRICE_COMPARISON_UPLOAD_LABEL,
  STEP4_EGP_SUMMARY_UPLOAD_LABEL,
  STEP4_COMMITTEE_REPORT_UPLOAD_LABEL,
  STEP6_DOC,
  STEP7_DOC,
  STEP7_CONTRACT_NOTICE_LETTER_UPLOAD_LABEL,
  STEP7_CONTRACT_NOTICE_DELIVERY_PROOF_UPLOAD_LABEL,
  STEP8_DOC,
  STEP9_DOC,
} from "@/lib/step-doc-types";
import {
  STEP10_DAILY_REPORT_HINT,
  STEP10_GUARANTEE_RETURN_DOC,
  STEP10_INSTALLMENT_DOC,
  STEP10_INSPECTION_RESULT_OPTIONS,
  STEP10_PROJECT_TYPE_OPTIONS,
  computeStep10InstallmentPenalty,
  computeWarrantyEndDateISO,
  formatStep10PenaltyBaseLabel,
  getStep10PenaltyBaseAmount,
  groupStep10DocsByInstallment,  isStep10DeliveryBeforeContractStart,
  isStep10InspectionBeforeDelivery,
  isStep10InspectionBeforeSupervisorReport,
  PROJECT_STATUS_WARRANTY,
  PROJECT_WARRANTY_STATUS_LABEL,
  resolveLastInstallmentInspectionDate,
  step10RequiredDocCount,
  step10RowHasRequiredDocs,
} from "@/lib/step10-contract";
import {
  STEP10_PENALTY_RATE_CONSTRUCTION_MAX,
  STEP10_PENALTY_RATE_CONSTRUCTION_MIN,
  STEP10_PENALTY_RATE_GENERAL_DEFAULT,
} from "@/lib/step10-guideline";
import {
  FORM_AUDIT_TRAIL_STANDARD,
  hasStep4BlacklistEvidenceDoc,
  hasStep4CommitteeReportDoc,
  hasStep4ConflictEvidenceDoc,
  hasStep4EgpBidSummaryDoc,
  logStep4OptionalAuditTrailDebug,
} from "@/lib/form-audit-trail";
import {
  STEP1_METHOD_OPTIONS,
  formatBudgetInput,
  parseBudgetInput,
  type Step3Announcement,
  type Step3FeedbackResult,
  type Step3Checklist,
  type Step3ChecklistKey,
  STEP3_CHECKLIST_ITEMS,
  resolveProjectMedianPrice,
  type Step4BidResult,
  type Step4Checklist,
  type Step4ChecklistKey,
  EMPTY_STEP4_BIDDER,
  STEP4_BIDDER_QUALIFICATION_OPTIONS,
  normalizeStep4Bidders,
  resolveLowestValidStep4Bidder,
  resolveLowestValidStep4BidderIndices,
  type Step4Bidder,
  type Step4BidderQualification,
  STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG,
  getStep4ProcurementSignDateIssues,
  resolveStep4ProcurementSignMinDate,
  STEP4_MIN_COMMITTEE_MEMBERS,
  STEP4_COMMITTEE_ROLE_OPTIONS,
  EMPTY_STEP4_COMMITTEE_MEMBER,
  normalizeStep4CommitteeMember,
  normalizeStep4CommitteeMembers,
  formatStep4CommitteeMembersForDisplay,
  applyStep4CommitteeRoleConstraints,
  type Step4CommitteeMember,
  type Step1Checklist,
  type Step1ChecklistKey,
  STEP1_CHECKLIST_ITEMS,
  isStep1EgpCodeUnlocked,
  isStep1SpecificMethodBudgetExceeded,
  STEP1_SPECIFIC_METHOD_BUDGET_EXCEEDED_MSG,
  STEP1_SPECIFIC_METHOD_BUDGET_COMPLIANCE_WARNING_MSG,
  STEP1_SPECIFIC_METHOD_REASON_REQUIRED_MSG,
  shouldShowStep1SpecificMethodBudgetComplianceWarning,
  type Step2Checklist,
  type Step2ChecklistKey,
  STEP2_CHECKLIST_ITEMS,
  type Step2CommitteeOrder,
  type Step2MedianPrice,
  isStep2MedianPriceOverBudget,
  STEP2_MEDIAN_OVER_BUDGET_MSG,
  STEP2_EVEN_COMMITTEE_MSG,
  isStep2MedianApprovalBeforeAppointment,
  countStep2MedianProcessWorkdays,
  isStep2MedianProcessSlow,
  STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG,
  STEP2_MEDIAN_WORKDAYS_SLOW_MSG,
  isStep2MedianFastApproval,
  STEP2_MEDIAN_FAST_APPROVAL_MSG,
  STEP2_MEDIAN_FAST_APPROVAL_HELPER,
  type Step2ComplianceLog,
  type Step2CommitteesState,
  type Step2CommitteeAppointmentMode,
  type Step2CommitteeListKey,
  type Step2CommitteeMember,
  normalizeStep2CommitteeMember,
  isStep2CommitteeChairDuplicateAtIndex,
  STEP2_DUPLICATE_CHAIR_MSG,
  getStep2ReadyDebugInfo,
  type Step2MarketQuote,
  shouldWarnEvenCommitteeCount,
  computeStep2MarketSurveyAverage,
  isStep2MedianPriceDeviationHigh,
  STEP2_MEDIAN_PRICE_DEVIATION_WARNING_MSG,
  detectCommitteeEvaluationInspectionOverlap,
  STEP3_COMMITTEE_OVERLAP_WARNING_MSG,
  STEP3_TOR_UPLOAD_COMPLIANCE_HELPER,
  STEP3_ANNOUNCEMENT_UPLOAD_COMPLIANCE_HELPER,
  STEP3_MEMO_UPLOAD_COMPLIANCE_HELPER,
  type Step3ComplianceLog,
  getStep3ComplianceWarnings,
  STEP3_DISCRETIONARY_HEARING_WARNING_MSG,
  defaultStep4EvaluationApprovalDateISO,
  isStep4EvaluationApprovalBeforeBidEnd,
  isStep4EvaluationApprovalOverdue,
  getStep4TimelineDisplayLines,
  type Step4Timeline,
  type Step6AppealState,
  type Step6Checklist,
  type Step6ChecklistKey,
  APPEAL_HEAD_OPINION_OPTIONS,
  APPEAL_COMMITTEE_DECISION_OPTIONS,
  isAppealReceivedBeforeStep5Notification,
  STEP6_APPEAL_RECEIVED_BEFORE_STEP5_MSG,
  type Step5Announcement,
  type Step5Checklist,
  type Step5ChecklistKey,
  type Step7ContractNotice,
  type Step8ContractExecution,
  type Step8GuaranteeType,
  STEP8_GUARANTEE_TYPE_UI_OPTIONS,
  computeRecommendedGuaranteeAmount,
  isStep8GuaranteeBelowMinimum,
  isStep8SignedOutsideAllowedRange,
  hasStep8SignedContractDoc,
  hasStep8GuaranteeVerificationDoc,
  computeStep9ContractEndDateISO,
  syncStep9WorkStartDate,
  sanitizeStep9WorkStartAgainstSignedDate,
  isISODateBefore,
  EMPTY_STEP9_CONTRACT_SCHEDULE,
  type Step9ContractSchedule,
  buildStep10InspectionRows,
  type Step10InspectionRow,
  type Step10ProjectType,
  isStep5WinnerAnnouncementBeforeEvaluation,
  getStep5WinnerAnnouncementBeforeEvaluationMsg,
  STEP5_CONTRACT_AFTER_APPEAL_MSG,
  STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG,
  STEP4_WINNER_DATA_LOCKED_MSG,
  STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
  STEP4_EVALUATION_APPROVAL_OVERDUE_MSG,
  STEP4_EVALUATION_APPROVAL_GATE_MSG,
  STEP7_NOTIFICATION_DEADLINE_EXCEEDED_MSG,
  STEP7_RECEIVED_BEFORE_LETTER_MSG,
  isStep7ContractorReceivedDateChronoValid,
} from "@/lib/step-form";
import {
  computeStep9EgpDeadlineISO,
  getStep9EgpPublicationTooLateMsg,
  isStep9EgpPublicationTooLate,
  STEP9_EGP_DEADLINE_CALENDAR_DAYS,
} from "@/lib/step9-guideline";
import { toast } from "sonner";
import { formatBaht } from "@/lib/procurement";
import {
  formatCurrencyDisplay,
  logCurrencyRawInput,
  parseCurrencyForDatabase,
} from "@/lib/currency-format";
import { SmartChecklist, type SmartChecklistDocBinder } from "@/components/SmartChecklist";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSmartChecklistItems } from "@/lib/smart-checklist";
import {
  BUDGET_CATEGORY_OPTIONS,
  EGP_PROJECT_TYPE_CONSTRUCTION,
  EGP_PROJECT_TYPE_OPTIONS,
  isCapitalBudgetCategory,
  suggestEgpProjectTypeFromBudgetCategory,
} from "@/lib/egp-project-type";
import {
  formatProgressWithUnit,
  type Step1ProjectProfile,
} from "@/lib/project-profile";
import { ResultUnitSelect } from "@/components/ResultUnitSelect";
import {
  type ProcurementPath,
  isExternalProcurement,
} from "@/lib/procurement-path";
import { ProvinceSearchSelect } from "@/components/ProvinceSearchSelect";
import { hasStep1PlanPublicationDoc, STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE } from "@/lib/checklist-inline-evidence";
import {
  STEP8_FORM_HEADER,
  STEP9_FORM_HEADER,
  STEP10_FORM_HEADER,
  getSmartChecklistStepLabel,
} from "@/lib/egp-milestones";
import { downloadExecutiveReportPdf, type ExecutiveReportProject } from "@/lib/executive-report-pdf";
import { supabase } from "@/integrations/supabase/client";
import {
  computeAppealDeadlineISO,
  computeCgdSubmissionDeadlineISO,
  computeContractEarliestISO,
  computeContractEarliestFromAppealDeadlineISO,
  computeContractNotificationDeadlineISO,
  computeStep7ContractSigningDeadlineISO,
  CONTRACT_NOTIFICATION_WORKDAYS,
  STEP7_CONTRACT_SIGNING_DEADLINE_WORKDAYS,
  isCgdSubmissionBeyondSevenWorkdays,
} from "@/lib/workdays";
import type { DocItem } from "@/lib/procurement";
import { StepInlineDocList } from "@/components/steps/StepInlineDocList";
import { StepDocumentHub } from "@/components/steps/StepDocumentHub";
import { FieldLabelTooltip } from "@/components/FieldLabelTooltip";
import { getFieldTooltip, type FieldTooltipKey } from "@/constants/tooltips";
import { STEP6_APPEAL_ACTIVE_BANNER_MSG } from "@/lib/step6-guideline";
import {
  STEP8_GUARANTEE_BELOW_MINIMUM_MSG,
  STEP8_SIGNED_OUTSIDE_RANGE_MSG,
} from "@/lib/step8-guideline";

/**
 * มาตรฐานลำดับ Layout ทุกขั้นตอน (Step 1–10):
 * 1. Guideline Box — แสดงใน projects_.$projectId.tsx ด้านบนการ์ด
 * 2. Smart Checklist (inline upload ท้ายแถว)
 * 3. โซนฟอร์มคีย์ข้อมูล / เงื่อนไข
 * 4. ปุ่มบันทึก — แสดงใน projects_.$projectId.tsx ด้านล่าง
 */

const inputCls =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

/** บริบทล็อกวันที่ข้ามขั้นตอน — ส่งจากหน้าโครงการ */
export type ChronologicalFormProps = {
  chronologicalCtx?: TimelineValidationContext | null;
};

export function FieldRow({
  label,
  children,
  tooltipKey,
  complianceTarget,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  tooltipKey?: FieldTooltipKey;
  /** ใช้จับคู่กับ issue.id สำหรับ Auto-Scroll เมื่อ validation ไม่ผ่าน */
  complianceTarget?: string;
}) {
  const tooltipText = getFieldTooltip(tooltipKey);
  return (
    <div data-compliance-target={complianceTarget}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        <FieldLabelTooltip text={tooltipText} />
      </div>
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  tooltipKey,
}: {
  children: React.ReactNode;
  tooltipKey?: FieldTooltipKey;
}) {
  const tooltipText = getFieldTooltip(tooltipKey);
  return (
    <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5 flex-wrap">
      {children}
      <FieldLabelTooltip text={tooltipText} />
    </p>
  );
}

/** เจ้าหน้าที่ผู้รับผิดชอบ — มาตรฐานเดียวกันทุกขั้นตอน (default จากขั้นที่ 1, แก้ไขได้) */
export function ResponsibleOfficerField({
  value,
  onChange,
  stepNumber,
  step1Default = "",
}: {
  value: string;
  onChange: (v: string) => void;
  stepNumber: number;
  step1Default?: string;
}) {
  const displayValue =
    value.trim() || (stepNumber > 1 ? step1Default : "") || "";
  const fromStep1 =
    stepNumber > 1 && !!step1Default && displayValue === step1Default;

  return (
    <FieldRow label="เจ้าหน้าที่ผู้รับผิดชอบ" complianceTarget="responsible_officer">
      <input
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          stepNumber === 1
            ? "ระบุชื่อเจ้าหน้าที่ผิดชอบโครงการ"
            : step1Default
              ? "ดึงจากขั้นตอนที่ 1 อัตโนมัติ — แก้ไขได้"
              : "ระบุชื่อเจ้าหน้าที่ผิดชอบโครงการ"
        }
        className={inputCls}
      />
      {stepNumber === 1 && (
        <p className="text-xs text-muted-foreground mt-1">
          ชื่อนี้จะถูกใช้เป็นค่าเริ่มต้นในทุกขั้นตอนถัดไป (แก้ไขได้ในแต่ละขั้น)
        </p>
      )}
      {fromStep1 && (
        <p className="text-xs text-muted-foreground mt-1">
          ดึงจากขั้นตอนที่ 1 อัตโนมัติ — แก้ไขได้หากเปลี่ยนตัวเจ้าหน้าที่
        </p>
      )}
    </FieldRow>
  );
}

type Step1FormProps = {
  checklist: Step1Checklist;
  onChecklistChange: (key: Step1ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  projectName: string;
  onProjectNameChange: (v: string) => void;
  egpCode: string;
  onEgpCodeChange: (v: string) => void;
  budget: string;
  onBudgetChange: (v: string) => void;
  method: string;
  onMethodChange: (v: string) => void;
  specificMethodReason: string;
  onSpecificMethodReasonChange: (v: string) => void;
  responsibleName: string;
  onResponsibleNameChange: (v: string) => void;
  projectProfile: Step1ProjectProfile;
  onProjectProfileChange: (patch: Partial<Step1ProjectProfile>) => void;
  readOnly?: boolean;
};

const STEP1_FORM_TITLE = "ขั้นตอนที่ 1: จัดทำและประกาศแผนการจัดซื้อจัดจ้างประจำปี";

/** เจ้าหน้าที่ผู้รับผิดชอบ — ขั้น 1 ดึงจาก profiles ของผู้ใช้ที่ล็อกอิน (read-only) */
function Step1ResponsibleOfficerField({
  value,
  profilePosition,
}: {
  value: string;
  profilePosition?: string | null;
}) {
  return (
    <FieldRow label="เจ้าหน้าที่ผู้รับผิดชอบ">
      <input
        value={value}
        readOnly
        disabled
        placeholder="กำลังโหลดจากบัญชีผู้ใช้..."
        className={`${inputCls} bg-muted cursor-not-allowed opacity-90`}
      />
      <p className="text-xs text-muted-foreground mt-1">
        ดึงจากบัญชีผู้ใช้ที่ล็อกอิน (profiles)
        {profilePosition?.trim() ? ` — ${profilePosition.trim()}` : ""}
        {" · ใช้เป็นค่าเริ่มต้นในทุกขั้นตอนถัดไป"}
      </p>
    </FieldRow>
  );
}

/** ขั้นตอนที่ 1 — จัดทำและประกาศแผนการจัดซื้อจัดจ้างประจำปี */
export function Step1DetailForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  projectName,
  onProjectNameChange,
  egpCode,
  onEgpCodeChange,
  budget,
  onBudgetChange,
  method,
  onMethodChange,
  specificMethodReason,
  onSpecificMethodReasonChange,
  responsibleName,
  onResponsibleNameChange,
  projectProfile,
  onProjectProfileChange,
  readOnly,
  docBinder,
}: Step1FormProps & { docBinder?: SmartChecklistDocBinder }) {
  const hasPlanPublicationDoc = hasStep1PlanPublicationDoc(docBinder?.docs);
  const egpUnlocked = isStep1EgpCodeUnlocked(_checklist, {
    hasAnnualPlanDoc: hasPlanPublicationDoc,
    stepDocs: docBinder?.docs,
  });
  const specificMethodBudgetInvalid = isStep1SpecificMethodBudgetExceeded(budget, method);
  const showSpecificMethodBudgetWarning =
    shouldShowStep1SpecificMethodBudgetComplianceWarning(budget, method);
  const isSpecificMethod = method === "specific";
  const specificReasonMissing = isSpecificMethod && !specificMethodReason.trim();
  const [profilePosition, setProfilePosition] = useState<string | null>(null);
  const [egpProjectTypeTouched, setEgpProjectTypeTouched] = useState(
    () => !!projectProfile.project_type?.trim(),
  );

  useEffect(() => {
    if (projectProfile.project_type?.trim()) {
      setEgpProjectTypeTouched(true);
    }
  }, [projectProfile.project_type]);

  useEffect(() => {
    if (readOnly || egpProjectTypeTouched) return;
    const suggested = suggestEgpProjectTypeFromBudgetCategory(
      projectProfile.budget_category,
    );
    if (suggested && !projectProfile.project_type?.trim()) {
      onProjectProfileChange({ project_type: suggested });
    }
  }, [
    readOnly,
    egpProjectTypeTouched,
    projectProfile.budget_category,
    projectProfile.project_type,
    onProjectProfileChange,
  ]);

  const step1AutoStates = useMemo(
    () => ({
      ..._autoCheckStates,
      egp_plan_code_verified: !!egpCode.trim(),
    }),
    [_autoCheckStates, egpCode],
  );
  void step1AutoStates;

  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user || cancelled) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, position")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfilePosition(prof?.position ?? null);
      const name = prof?.full_name?.trim();
      if (name) onResponsibleNameChange(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [readOnly, onResponsibleNameChange]);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">{STEP1_FORM_TITLE}</p>
        {docBinder && (
          <FieldRow label="เอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP">
            <p className="text-xs text-muted-foreground mb-2">
              แนบหลักฐานการเผยแพร่แผนจัดซื้อจัดจ้างประจำปีก่อนกรอกรหัส e-GP
            </p>
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP1_EGP_PLAN_PUBLICATION_DOCUMENT_TYPE}
              label="📎 แนบเอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP"
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
            />
          </FieldRow>
        )}
        <FieldRow label="ชื่อโครงการ" tooltipKey="step1.project_name">
          <input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="เช่น ซ่อมแซมแหล่งน้ำ..."
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="เลขที่โครงการ e-GP / รหัสโครงการภายใน *" tooltipKey="step1.egp_plan_code">
          <input
            value={egpCode}
            onChange={(e) => onEgpCodeChange(e.target.value)}
            placeholder="เช่น P6805001234"
            disabled={!egpUnlocked}
            className={`${inputCls}${!egpUnlocked ? " opacity-60 cursor-not-allowed bg-muted" : ""}`}
          />
          {!egpUnlocked && (
            <p className="text-xs text-muted-foreground mt-1">
              ปลดล็อกเมื่อแนบเอกสารประกาศแผนจัดซื้อจัดจ้างจากระบบ e-GP ด้านบนแล้ว
            </p>
          )}
        </FieldRow>
      <FieldRow label="วงเงินงบประมาณ (บาท)" tooltipKey="step1.budget">
        <input
          value={budget}
          onChange={(e) => {
            logCurrencyRawInput(e.target.value);
            onBudgetChange(formatBudgetInput(e.target.value));
          }}
          placeholder="0"
          inputMode="numeric"
          className={inputCls}
        />
        <p className="text-xs text-muted-foreground mt-1">
          ใช้คำนวณระยะเวลาขั้นตอนที่มีกำหนดวันขั้นต่ำ (เช่น ประกาศ e-bidding)
        </p>
      </FieldRow>
      <FieldRow label="หมวดงบประมาณ *">
        <select
          value={projectProfile.budget_category}
          onChange={(e) => {
            const budget_category = e.target.value;
            const patch: Partial<Step1ProjectProfile> = { budget_category };
            if (!egpProjectTypeTouched) {
              const suggested = suggestEgpProjectTypeFromBudgetCategory(budget_category);
              if (suggested) {
                patch.project_type = suggested;
              }
            }
            onProjectProfileChange(patch);
          }}
          disabled={readOnly}
          className={inputCls}
        >
          <option value="">— เลือกหมวดงบประมาณ —</option>
          {BUDGET_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isCapitalBudgetCategory(projectProfile.budget_category) && (
          <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-md px-2 py-1.5 mt-1.5">
            งบลงทุน — ระบบแนะนำประเภทโครงการ «{EGP_PROJECT_TYPE_CONSTRUCTION}» อัตโนมัติ (เปลี่ยนได้ตลอด)
          </p>
        )}
      </FieldRow>
      <FieldRow label="ประเภทโครงการ (e-GP) *">
        <select
          value={projectProfile.project_type}
          onChange={(e) => {
            setEgpProjectTypeTouched(true);
            onProjectProfileChange({ project_type: e.target.value });
          }}
          disabled={readOnly}
          className={inputCls}
        >
          <option value="">— เลือกประเภทโครงการ —</option>
          {EGP_PROJECT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          บันทึกลงข้อมูลโครงการหลัก — ใช้กำหนดโหมดขั้นตอนที่ 10 และเมนูติดตามงานก่อสร้าง
        </p>
      </FieldRow>
      <FieldRow label="ประเภทโครงการ (วิธีจัดซื้อจัดจ้าง)">
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value)}
          disabled={readOnly}
          className={inputCls}
        >
          {STEP1_METHOD_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          ใช้ร่วมกับวงเงินงบประมาณในการคำนวณวันทำการขั้นต่ำของระบบ
        </p>
        {showSpecificMethodBudgetWarning && (
          <div className="rounded-md bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-4 py-3 text-sm">
            {STEP1_SPECIFIC_METHOD_BUDGET_COMPLIANCE_WARNING_MSG}
          </div>
        )}
        {specificMethodBudgetInvalid && (
          <p className="text-sm text-destructive mt-2 font-medium">
            {STEP1_SPECIFIC_METHOD_BUDGET_EXCEEDED_MSG}
          </p>
        )}
      </FieldRow>
      {isSpecificMethod && (
        <FieldRow label="เหตุผลความจำเป็นในการใช้วิธีเฉพาะเจาะจง">
          <textarea
            value={specificMethodReason}
            onChange={(e) => onSpecificMethodReasonChange(e.target.value)}
            disabled={readOnly}
            rows={4}
            placeholder="ระบุเหตุผลตามระเบียบพัสดุฯ ข้อ 79 เช่น มีลักษณะเฉพาะเจาะจง..."
            className={`${inputCls} min-h-[96px] resize-y${specificReasonMissing ? " border-destructive" : ""}`}
          />
          {specificReasonMissing && (
            <p className="text-sm text-destructive mt-2 font-medium">
              {STEP1_SPECIFIC_METHOD_REASON_REQUIRED_MSG}
            </p>
          )}
        </FieldRow>
      )}
      <Step1ResponsibleOfficerField
        value={responsibleName}
        profilePosition={profilePosition}
      />
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">กลุ่มข้อมูลหน่วยงาน</p>
        <FieldRow label="หน่วยงานส่วนภูมิภาค / เขตที่รับผิดชอบ">
          <input
            value={projectProfile.district_office}
            onChange={(e) => onProjectProfileChange({ district_office: e.target.value })}
            placeholder="เช่น สพข.6 เชียงใหม่"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="หน่วยงานที่อนุมัติเบิกจ่าย">
          <input
            value={projectProfile.approving_agency}
            onChange={(e) => onProjectProfileChange({ approving_agency: e.target.value })}
            placeholder="เช่น สพข.6 เชียงใหม่"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="หน่วยงานที่ดำเนินการจัดซื้อจัดจ้าง">
          <input
            value={projectProfile.procurement_agency}
            onChange={(e) => onProjectProfileChange({ procurement_agency: e.target.value })}
            placeholder="เช่น สำนักงานพัฒนาที่ดินจังหวัดเชียงใหม่"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">กลุ่มข้อมูลประเภทงานและหน่วยวัด</p>
        <FieldRow label="ประเภทกิจกรรม/งาน">
          <input
            value={projectProfile.activity_type}
            onChange={(e) => onProjectProfileChange({ activity_type: e.target.value })}
            placeholder="เช่น การป้องกันและลดการชะล้างพังทลายของดิน..."
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="หน่วยวัดผลสัมฤทธิ์ของงาน *">
          <ResultUnitSelect
            value={projectProfile.result_unit}
            onChange={(result_unit) => onProjectProfileChange({ result_unit })}
            disabled={readOnly}
            inputClassName={inputCls}
            hint="ใช้แสดงต่อท้ายผลสะสมหน้างานจริงในขั้นตอนที่ 10 และรายงานสรุปผู้บริหาร"
          />
        </FieldRow>
        <FieldRow label="จำนวนผลสัมฤทธิ์ของงาน *" complianceTarget="target_quantity">
          <input
            type="number"
            min={1}
            step={1}
            value={projectProfile.target_quantity ?? ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              onProjectProfileChange({
                target_quantity: raw ? Number(raw) : null,
              });
            }}
            disabled={readOnly}
            className={inputCls}
            placeholder="เช่น 1"
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">ที่อยู่/พิกัดสถานที่ดำเนินการ</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="ชื่อบ้าน/หมู่บ้าน *">
            <input
              value={projectProfile.site_village}
              onChange={(e) => onProjectProfileChange({ site_village: e.target.value })}
              placeholder="เช่น บ้านหนองปลามัน"
              disabled={readOnly}
              required
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="หมู่ที่ *">
            <input
              type="number"
              min={1}
              value={projectProfile.site_moo ?? ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                onProjectProfileChange({
                  site_moo: raw ? Number(raw) : null,
                });
              }}
              disabled={readOnly}
              required
              className={inputCls}
              placeholder="เช่น 5"
            />
          </FieldRow>
          <FieldRow label="ตำบล *">
            <input
              value={projectProfile.site_subdistrict}
              onChange={(e) => onProjectProfileChange({ site_subdistrict: e.target.value })}
              disabled={readOnly}
              required
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="อำเภอ *">
            <input
              value={projectProfile.site_district}
              onChange={(e) => onProjectProfileChange({ site_district: e.target.value })}
              disabled={readOnly}
              required
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="จังหวัด (ลำพูน) *">
            <ProvinceSearchSelect
              value={projectProfile.site_province}
              onChange={(v) => onProjectProfileChange({ site_province: v })}
              disabled={readOnly}
            />
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

type Step2DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
};

type Step2FormProps = {
  checklist: Step2Checklist;
  onChecklistChange: (key: Step2ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  committees: Step2CommitteesState;
  onCommitteeModeChange: (mode: Step2CommitteeAppointmentMode) => void;
  onCommitteeChange: (
    listKey: Step2CommitteeListKey,
    index: number,
    patch: Partial<Step2CommitteeMember>,
  ) => void;
  onAddCommittee: (listKey: Step2CommitteeListKey) => void;
  onRemoveCommittee: (listKey: Step2CommitteeListKey, index: number) => void;
  onMarketQuoteChange: (index: number, patch: Partial<Step2MarketQuote>) => void;
  onMarketSurveySummaryChange: (value: string) => void;
  committeeOrder: Step2CommitteeOrder;
  onCommitteeOrderChange: (patch: Partial<Step2CommitteeOrder>) => void;
  medianPrice: Step2MedianPrice;
  onMedianPriceChange: (patch: Partial<Step2MedianPrice>) => void;
  step1Budget: number;
  responsibleName: string;
  onResponsibleNameChange: (v: string) => void;
  step1ResponsibleDefault?: string;
  docBinder: Step2DocBinder;
  complianceLog?: Step2ComplianceLog;
  /** บันทึกร่างขั้นตอนที่ 2 — ใช้จาก Modal ใบเสนอราคาตลาด */
  onSaveMarketQuotes?: () => Promise<boolean>;
  /** สถานะความพร้อมไปขั้นถัดไป — สำหรับ debug ใน console */
  step2GateDebug?: Parameters<typeof getStep2ReadyDebugInfo>[1] & {
    autoCheckStates?: Record<string, boolean>;
  };
} & ChronologicalFormProps;

function CommitteeMemberList({
  title,
  members,
  listKey,
  onCommitteeChange,
  onAddCommittee,
  onRemoveCommittee,
  readOnly,
}: {
  title: string;
  members: Step2CommitteeMember[];
  listKey: Step2CommitteeListKey;
  onCommitteeChange: (
    listKey: Step2CommitteeListKey,
    index: number,
    patch: Partial<Step2CommitteeMember>,
  ) => void;
  onAddCommittee: (listKey: Step2CommitteeListKey) => void;
  onRemoveCommittee: (listKey: Step2CommitteeListKey, index: number) => void;
  readOnly?: boolean;
}) {
  const safeMembers = members?.length
    ? members.map(normalizeStep2CommitteeMember)
    : [
        { name: "", position_endorsement: "", role: "" as const },
        { name: "", position_endorsement: "", role: "" as const },
        { name: "", position_endorsement: "", role: "" as const },
      ];
  const showEvenWarning = shouldWarnEvenCommitteeCount(safeMembers);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button
          type="button"
          onClick={() => onAddCommittee(listKey)}
          disabled={readOnly}
          className="h-8 px-2.5 rounded-md border border-input text-xs hover:bg-accent inline-flex items-center gap-1 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มกรรมการ
        </button>
      </div>
      <div className="space-y-3">
        {safeMembers.map((member, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={member.name}
                  onChange={(e) => onCommitteeChange(listKey, idx, { name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                  disabled={readOnly}
                  className={`${inputCls} sm:flex-1`}
                />
                <select
                  value={member.role === "chair" || member.role === "member" ? member.role : ""}
                  onChange={(e) =>
                    onCommitteeChange(listKey, idx, {
                      role: e.target.value as Step2CommitteeMember["role"],
                    })
                  }
                  disabled={readOnly}
                  className={`${inputCls} sm:w-40`}
                >
                  <option value="">บทบาท</option>
                  <option value="chair">ประธานกรรมการ</option>
                  <option value="member">กรรมการ</option>
                </select>
                {isStep2CommitteeChairDuplicateAtIndex(safeMembers, idx) && (
                  <p className="text-xs text-destructive sm:col-span-2">
                    {STEP2_DUPLICATE_CHAIR_MSG}
                  </p>
                )}
              </div>
              <input
                value={member.position_endorsement ?? ""}
                onChange={(e) =>
                  onCommitteeChange(listKey, idx, { position_endorsement: e.target.value })
                }
                placeholder="ตำแหน่ง/ความเห็นชอบ (เช่น หัวหน้ากลุ่มงาน, เห็นชอบ)"
                disabled={readOnly}
                className={inputCls}
              />
            </div>
            {safeMembers.length > 3 && !readOnly && (
              <button
                type="button"
                onClick={() => onRemoveCommittee(listKey, idx)}
                className="h-10 w-10 rounded-md border border-input text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0"
                title="ลบแถวนี้"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {showEvenWarning && (
        <p className="text-xs text-warning mt-2">{STEP2_EVEN_COMMITTEE_MSG}</p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        ต้องมีกรรมการอย่างน้อย 3 คน (ไม่สามารถลบจนเหลือน้อยกว่า 3 คน)
      </p>
    </div>
  );
}

/** Modal ใบเสนอราคาท้องตลาด — กรอกข้อมูล + แนบไฟล์แยกรายซัพพลายเออร์ */
function Step2MarketQuotesModal({
  committees,
  onMarketQuoteChange,
  onMarketSurveySummaryChange,
  docBinder,
  readOnly,
  onSave,
}: {
  committees: Step2CommitteesState;
  onMarketQuoteChange: (index: number, patch: Partial<Step2MarketQuote>) => void;
  onMarketSurveySummaryChange: (value: string) => void;
  docBinder: Step2DocBinder;
  readOnly?: boolean;
  onSave?: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const quoteCount = committees.market_quotes.length;
  const uploadedCount = countStep2MarketQuoteDocsUploaded(docBinder.docs, quoteCount);
  const quotesFilledCount = committees.market_quotes.filter(
    (q) => !!q.supplier_name.trim() && q.quoted_price != null && q.quoted_price > 0,
  ).length;

  const handleSave = async () => {
    if (!onSave || readOnly) return;
    setSaving(true);
    try {
      const ok = await onSave();
      if (ok) setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={readOnly}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent disabled:opacity-60"
        >
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          จัดการราคาตลาด
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              uploadedCount >= quoteCount
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {uploadedCount}/{quoteCount} ไฟล์
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ใบเสนอราคาท้องตลาด (อย่างน้อย 3 ราย)</DialogTitle>
          <DialogDescription>
            กรอกชื่อซัพพลายเออร์ ราคาเสนอ และแนบไฟล์หลักฐานแยกราย — รายละ 1 ไฟล์ต่อซัพพลายเออร์
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {committees.market_quotes.map((quote, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-muted/20 p-3 space-y-3"
            >
              <p className="text-sm font-medium text-foreground">
                ซัพพลายเออร์รายที่ {index + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-2 items-end">
                <FieldRow label="ชื่อบริษัท/ร้านค้า">
                  <input
                    value={quote.supplier_name}
                    onChange={(e) =>
                      onMarketQuoteChange(index, { supplier_name: e.target.value })
                    }
                    placeholder="ชื่อบริษัท/ร้านค้า"
                    disabled={readOnly}
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="ราคาเสนอ (บาท)">
                  <CurrencyInput
                    value={quote.quoted_price}
                    onChange={(quoted_price) => onMarketQuoteChange(index, { quoted_price })}
                    readOnly={readOnly}
                    className={inputCls}
                    showFormattedHint
                  />
                </FieldRow>
              </div>
              <FieldRow label="ไฟล์ใบเสนอราคา">
                <InlineDocUpload
                  project={docBinder.project}
                  stepNumber={docBinder.stepNumber}
                  documentType={step2MarketQuoteDocType(index)}
                  label={step2MarketQuoteUploadLabel(index, quote.supplier_name)}
                  existing={docBinder.docs}
                  onChange={docBinder.onDocsChange}
                />
              </FieldRow>
            </div>
          ))}
          <FieldRow label="เหตุผลสรุปการสืบราคา">
            <textarea
              value={committees.market_survey_summary_reason ?? ""}
              onChange={(e) => onMarketSurveySummaryChange(e.target.value)}
              placeholder="สรุปวิธีการสืบราคา แหล่งข้อมูล และเหตุผลประกอบราคากลาง"
              disabled={readOnly}
              rows={3}
              className={`${inputCls} resize-y min-h-[4.5rem]`}
            />
          </FieldRow>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:items-center pt-2">
          <p className="text-xs text-muted-foreground text-left">
            กรอกข้อมูลแล้ว {quotesFilledCount}/{quoteCount} ราย · แนบไฟล์แล้ว {uploadedCount}/{quoteCount} ราย
          </p>
          <button
            type="button"
            disabled={readOnly || saving || !onSave}
            onClick={() => void handleSave()}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            บันทึกข้อมูลราคาตลาด
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** ขั้นตอนที่ 2 — แต่งตั้งคณะกรรมการและกำหนดราคากลาง */
export function Step2DetailForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  readOnly,
  committees,
  onCommitteeModeChange,
  onCommitteeChange,
  onAddCommittee,
  onRemoveCommittee,
  onMarketQuoteChange,
  onMarketSurveySummaryChange,
  committeeOrder,
  onCommitteeOrderChange,
  medianPrice,
  onMedianPriceChange,
  step1Budget,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  docBinder,
  complianceLog,
  onSaveMarketQuotes,
  step2GateDebug,
  chronologicalCtx,
}: Step2FormProps) {
  const medianOverBudget = isStep2MedianPriceOverBudget(
    medianPrice.approved_median_price,
    step1Budget,
  );

  const appointmentDate = committeeOrder.appointment_order_date?.trim() ?? "";
  const medianApprovalDate = medianPrice.median_price_approval_date?.trim() ?? "";
  const medianApprovalBeforeAppointment = isStep2MedianApprovalBeforeAppointment(
    medianApprovalDate,
    appointmentDate,
  );
  const medianProcessWorkdays =
    appointmentDate && medianApprovalDate && !medianApprovalBeforeAppointment
      ? countStep2MedianProcessWorkdays(appointmentDate, medianApprovalDate)
      : 0;
  const medianProcessSlow = isStep2MedianProcessSlow(appointmentDate, medianApprovalDate);
  const medianFastApproval = isStep2MedianFastApproval(appointmentDate, medianApprovalDate);
  const marketSurveyAverage = computeStep2MarketSurveyAverage(committees.market_quotes);
  const marketPriceDeviationHigh = isStep2MedianPriceDeviationHigh(
    medianPrice.approved_median_price,
    committees.market_quotes,
  );
  const marketQuoteUploadedCount = countStep2MarketQuoteDocsUploaded(
    docBinder.docs,
    committees.market_quotes.length,
  );
  const marketQuoteRequiredCount = committees.market_quotes.length;
  const marketQuotesFilledCount = committees.market_quotes.filter(
    (q) => !!q.supplier_name.trim() && q.quoted_price != null && q.quoted_price > 0,
  ).length;

  useEffect(() => {
    if (!step2GateDebug) return;
    const { autoCheckStates, ...opts } = step2GateDebug;
    const debug = getStep2ReadyDebugInfo(_checklist, opts, autoCheckStates);
    console.log("[Step2] ปุ่มบันทึกและไปขั้นถัดไป — debug", {
      ready: debug.ready,
      effectiveChecklist: debug.effectiveChecklist,
      mergedAuto: debug.mergedAuto,
      blockingIssues: debug.issues.map((i) => ({ id: i.id, message: i.message })),
    });
  }, [_checklist, step2GateDebug]);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">รูปแบบการแต่งตั้งคณะกรรมการ</p>
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="step2-committee-mode"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={committees.appointment_mode === "combined"}
                onChange={() => onCommitteeModeChange("combined")}
              />
              <span>ใช้คณะกรรมการชุดเดียวกัน (ทำทั้งร่าง TOR และราคากลาง)</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="step2-committee-mode"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={committees.appointment_mode === "separate"}
                onChange={() => onCommitteeModeChange("separate")}
              />
              <span>แยกคณะกรรมการ (ชุดร่าง TOR และ ชุดกำหนดราคากลาง)</span>
            </label>
          </div>
        </div>

        {committees.appointment_mode === "combined" ? (
          <CommitteeMemberList
            title="คณะกรรมการจัดทำร่าง TOR และกำหนดราคากลาง"
            members={committees.combined_members}
            listKey="combined_members"
            onCommitteeChange={onCommitteeChange}
            onAddCommittee={onAddCommittee}
            onRemoveCommittee={onRemoveCommittee}
            readOnly={readOnly}
          />
        ) : (
          <div className="space-y-5">
            <CommitteeMemberList
              title="คณะกรรมการจัดทำร่างขอบเขตของงาน (TOR)"
              members={committees.tor_members}
              listKey="tor_members"
              onCommitteeChange={onCommitteeChange}
              onAddCommittee={onAddCommittee}
              onRemoveCommittee={onRemoveCommittee}
              readOnly={readOnly}
            />
            <div className="border-t border-border pt-4">
              <CommitteeMemberList
                title="คณะกรรมการกำหนดราคากลาง"
                members={committees.median_price_members}
                listKey="median_price_members"
                onCommitteeChange={onCommitteeChange}
                onAddCommittee={onAddCommittee}
                onRemoveCommittee={onRemoveCommittee}
                readOnly={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 1: ข้อมูลคำสั่งแต่งตั้งคณะกรรมการ</SectionTitle>
        <FieldRow label="เลขที่คำสั่งแต่งตั้ง">
          <input
            value={committeeOrder.appointment_order_no ?? ""}
            onChange={(e) => onCommitteeOrderChange({ appointment_order_no: e.target.value })}
            placeholder="เช่น ที่ กษ ๐๖๐๒ / ๑๒๓"
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="วันที่ลงนามในคำสั่ง">
          <ChronologicalDatePicker
            stepNumber={2}
            chronologicalCtx={chronologicalCtx}
            value={committeeOrder.appointment_order_date ?? ""}
            onChange={(v) => onCommitteeOrderChange({ appointment_order_date: v })}
            showChronologicalHint
          />
          {committeeOrder.appointment_order_date && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(committeeOrder.appointment_order_date)}
            </p>
          )}
        </FieldRow>
        <FieldRow label="ไฟล์เอกสารคำสั่งแต่งตั้ง">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP2_DOC.APPOINTMENT_ORDER}
            label={STEP2_APPOINTMENT_ORDER_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="แบบรูปรายการงานก่อสร้าง (BOQ)">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP2_DOC.BOQ}
            label={STEP2_BOQ_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="หนังสือแสดงความบริสุทธิ์ใจของกรรมการ">
          <p className="text-xs text-muted-foreground mb-2">
            ต้องมีหนังสือแสดงความบริสุทธิ์ใจของกรรมการทุกคนก่อนดำเนินการต่อ
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP2_DOC.INTEGRITY_LETTER}
            label={STEP2_INTEGRITY_LETTER_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 2: ข้อมูลราคากลาง</SectionTitle>
        <FieldRow label="วงเงินงบประมาณที่ได้รับจัดสรร (บาท)">
          <CurrencyInput
            value={medianPrice.allocated_budget}
            onChange={(allocated_budget) => onMedianPriceChange({ allocated_budget })}
            className={inputCls}
            showFormattedHint
          />
          {step1Budget > 0 && !medianPrice.allocated_budget && (
            <p className="text-xs text-muted-foreground mt-1">
              ค่าเริ่มต้นดึงจากงบประมาณขั้นตอนที่ 1 — แก้ไขได้หากจัดสรรจริงต่างจากแผน
            </p>
          )}
        </FieldRow>
        <FieldRow
          label="เลขที่หนังสืออนุมัติราคากลาง"
          tooltipKey="step2.median_approval_letter_no"
        >
          <input
            value={medianPrice.median_approval_letter_no ?? ""}
            onChange={(e) => onMedianPriceChange({ median_approval_letter_no: e.target.value })}
            placeholder="เช่น กษ ๐๖๐๑ / ๑๒๓"
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="มูลค่าราคากลางที่คณะกรรมการคำนวณ (บาท)">
          <CurrencyInput
            value={medianPrice.approved_median_price}
            onChange={(approved_median_price) =>
              onMedianPriceChange({ approved_median_price })
            }
            className={inputCls}
            showFormattedHint
          />
          {step1Budget > 0 && (
            <div className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-xs space-y-0.5">
              <p className="text-muted-foreground">
                ค่าเปรียบเทียบ — วงเงินงบประมาณ (ขั้นตอนที่ 1):{" "}
                <span className="font-medium text-foreground">{formatBaht(step1Budget)} บาท</span>
              </p>
              <p className="text-muted-foreground">
                กรอกราคากลางที่คณะกรรมการคำนวณและได้รับอนุมัติแล้ว
              </p>
            </div>
          )}
          {medianOverBudget && (
            <p className="text-sm text-destructive mt-2 font-medium">{STEP2_MEDIAN_OVER_BUDGET_MSG}</p>
          )}
          {marketPriceDeviationHigh && (
            <p className="text-sm text-warning mt-2 font-medium">
              {STEP2_MEDIAN_PRICE_DEVIATION_WARNING_MSG}
            </p>
          )}
          {marketSurveyAverage != null && medianPrice.approved_median_price != null && (
            <p className="text-xs text-muted-foreground mt-1">
              ราคาเฉลี่ยจากการสืบราคา: {formatBaht(marketSurveyAverage)} บาท
            </p>
          )}
        </FieldRow>
        <FieldRow
          label="วันที่หัวหน้าหน่วยงานอนุมัติราคากลาง"
          tooltipKey="step2.median_price_approval_date"
        >
          <ChronologicalDatePicker
            stepNumber={2}
            chronologicalCtx={chronologicalCtx}
            intraStepMinDate={appointmentDate}
            value={medianPrice.median_price_approval_date ?? ""}
            onChange={(v) => onMedianPriceChange({ median_price_approval_date: v })}
            showChronologicalHint={false}
          />
          {medianApprovalDate && !medianApprovalBeforeAppointment && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(medianApprovalDate)}
            </p>
          )}
          {medianApprovalBeforeAppointment && (
            <p className="text-xs text-destructive mt-1 font-medium">
              {STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG}
            </p>
          )}
          {medianProcessWorkdays > 0 && !medianApprovalBeforeAppointment && (
            <p className="text-xs text-muted-foreground mt-1">
              ระยะเวลาที่ใช้ในการปฏิบัติงาน: {medianProcessWorkdays} วันทำการ
              (นับจากวันคำสั่งแต่งตั้งถึงวันอนุมัติราคากลาง)
            </p>
          )}
          {medianProcessSlow && !medianApprovalBeforeAppointment && (
            <p className="text-xs text-warning mt-1 font-medium">{STEP2_MEDIAN_WORKDAYS_SLOW_MSG}</p>
          )}
          {medianFastApproval && !medianApprovalBeforeAppointment && (
            <>
              <p className="text-xs text-warning mt-1 font-medium">{STEP2_MEDIAN_FAST_APPROVAL_MSG}</p>
              <p className="text-xs text-muted-foreground mt-1">{STEP2_MEDIAN_FAST_APPROVAL_HELPER}</p>
            </>
          )}
          {complianceLog?.fast_median_approval_warning && medianFastApproval && (
            <p className="text-xs text-muted-foreground mt-1">
              📋 บันทึกระบบ: มีการแจ้งเตือนความเร็วในการอนุมัติ
              {complianceLog.fast_median_approval_warning_at && (
                <>
                  {" "}
                  (บันทึกเมื่อ{" "}
                  {formatThaiDate(complianceLog.fast_median_approval_warning_at.slice(0, 10))})
                </>
              )}
            </p>
          )}
        </FieldRow>
        <FieldRow label="ไฟล์ตารางแสดงวงเงินราคากลาง (แบบ บก.06)">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP2_DOC.MEDIAN_PRICE_BG06}
            label={STEP2_BG06_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <SectionTitle>กลุ่มที่ 3: ใบเสนอราคาท้องตลาด (อย่างน้อย 3 ราย)</SectionTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Step2MarketQuotesModal
            committees={committees}
            onMarketQuoteChange={onMarketQuoteChange}
            onMarketSurveySummaryChange={onMarketSurveySummaryChange}
            docBinder={docBinder}
            readOnly={readOnly}
            onSave={onSaveMarketQuotes}
          />
          <p
            className={`text-sm ${
              marketQuotesFilledCount >= marketQuoteRequiredCount
                ? "text-success font-medium"
                : "text-muted-foreground"
            }`}
          >
            กรอกข้อมูลแล้ว: {marketQuotesFilledCount}/{marketQuoteRequiredCount} ราย
          </p>
          <p
            className={`text-sm ${
              marketQuoteUploadedCount >= marketQuoteRequiredCount
                ? "text-success font-medium"
                : "text-muted-foreground"
            }`}
          >
            แนบใบเสนอราคาแล้ว: {marketQuoteUploadedCount}/{marketQuoteRequiredCount} ราย
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          กดปุ่ม &quot;จัดการราคาตลาด&quot; เพื่อกรอกข้อมูลซัพพลายเออร์และแนบไฟล์หลักฐานแยกราย
        </p>
      </div>

      <ResponsibleOfficerField
        stepNumber={2}
        value={responsibleName}
        onChange={onResponsibleNameChange}
        step1Default={step1ResponsibleDefault}
      />
    </div>
  );
}

type Step3DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
  inheritedDocs?: Array<{ fromStep: number; docs: StepDocRecord[] }>;
  /** ประเภทเอกสารที่ต้องเน้นแดงหลัง validation ไม่ผ่าน */
  highlightedMissingDocs?: string[];
};

type Step3FormProps = {
  checklist: Step3Checklist;
  onChecklistChange: (key: Step3ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  announcement: Step3Announcement;
  onAnnouncementChange: (patch: Partial<Step3Announcement>) => void;
  approvedMedianPrice: number | null;
  medianPriceApprovalDate: string | null;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  step1PlanPublicationDate?: string | null;
  docBinder: Step3DocBinder;
  budget: number;
  step2Committees: Step2CommitteesState;
  complianceLog?: Step3ComplianceLog;
  onComplianceLogChange: (patch: Partial<Step3ComplianceLog>) => void;
} & ChronologicalFormProps;

/** ขั้นตอนที่ 3 — จัดทำร่างประกาศและเอกสารประกวดราคา */
export function Step3DetailForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  readOnly,
  announcement,
  onAnnouncementChange,
  approvedMedianPrice,
  medianPriceApprovalDate,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  step1PlanPublicationDate = "",
  docBinder,
  budget,
  step2Committees,
  complianceLog,
  onComplianceLogChange,
  chronologicalCtx,
}: Step3FormProps) {
  const [endDateRejected, setEndDateRejected] = useState(false);
  const [startDateRejected, setStartDateRejected] = useState(false);
  const [startBeforeApprovalRejected, setStartBeforeApprovalRejected] = useState(false);
  const [procApprovalDateRejected, setProcApprovalDateRejected] = useState(false);

  const medianDisplay = resolveProjectMedianPrice({
    approved_median_price: approvedMedianPrice,
    estimated_price: null,
  });

  const approvalDate = announcement.approval_letter_date ?? "";

  const torApprovalBeforeStep1Plan =
    !!approvalDate &&
    !!step1PlanPublicationDate?.trim() &&
    isStepDateBeforeReference(approvalDate, step1PlanPublicationDate);

  const publicationWorkdays = useMemo(
    () =>
      countWorkdaysAfterStartISO(
        announcement.publication_start ?? "",
        announcement.publication_end ?? "",
      ),
    [announcement.publication_start, announcement.publication_end],
  );

  const publicationStartNonWorkday =
    !!announcement.publication_start && !isWorkdayISO(announcement.publication_start);
  const publicationEndNonWorkday =
    !!announcement.publication_end && !isWorkdayISO(announcement.publication_end);

  const showPublicationStats =
    !!announcement.publication_start && !!announcement.publication_end;

  const minPublicationEnd = useMemo(
    () =>
      announcement.publication_start
        ? defaultPublicationEndISO(announcement.publication_start)
        : "",
    [announcement.publication_start],
  );

  const publicationStartBeforeApproval =
    !!approvalDate &&
    !!announcement.publication_start &&
    announcement.publication_start < approvalDate;

  const handleApprovalDateChange = (nextApproval: string) => {
    const patch: Partial<Step3Announcement> = { approval_letter_date: nextApproval };
    const start = announcement.publication_start ?? "";
    if (start && nextApproval && start < nextApproval) {
      patch.publication_start = "";
      patch.publication_end = "";
    }
    if (!nextApproval) {
      patch.publication_start = "";
      patch.publication_end = "";
    }
    onAnnouncementChange(patch);
  };

  const handlePublicationStartChange = (startISO: string) => {
    setEndDateRejected(false);
    setStartDateRejected(false);
    setStartBeforeApprovalRejected(false);
    if (!startISO) {
      onAnnouncementChange({
        publication_start: "",
        publication_end: "",
        publication_end_extended: false,
        publication_end_extension_reason: "",
      });
      return;
    }
    if (approvalDate && startISO < approvalDate) {
      setStartBeforeApprovalRejected(true);
      return;
    }
    if (!isWorkdayISO(startISO)) {
      setStartDateRejected(true);
      return;
    }
    const autoEnd = defaultPublicationEndISO(startISO);
    onAnnouncementChange({
      publication_start: startISO,
      publication_end: autoEnd,
      publication_end_extended: false,
      publication_end_extension_reason: "",
    });
  };

  const publicationExtended =
    !!announcement.publication_end_extended ||
    isPublicationEndExtendedBeyondMinimum(
      announcement.publication_start ?? "",
      announcement.publication_end ?? "",
    );

  const handlePublicationExtendToggle = (checked: boolean) => {
    if (!announcement.publication_start || !minPublicationEnd) return;
    if (!checked) {
      onAnnouncementChange({
        publication_end_extended: false,
        publication_end: minPublicationEnd,
        publication_end_extension_reason: "",
      });
      setEndDateRejected(false);
      return;
    }
    onAnnouncementChange({ publication_end_extended: true });
  };

  const handlePublicationEndChange = (endISO: string) => {
    if (!announcement.publication_start) return;
    if (!endISO) {
      setEndDateRejected(false);
      onAnnouncementChange({ publication_end: "" });
      return;
    }
    if (!isWorkdayISO(endISO)) {
      setEndDateRejected(true);
      return;
    }
    if (minPublicationEnd && endISO < minPublicationEnd) {
      setEndDateRejected(true);
      return;
    }
    setEndDateRejected(false);
    onAnnouncementChange({ publication_end: endISO });
  };

  const publicationEndBelowMinimum =
    !!minPublicationEnd &&
    !!announcement.publication_end &&
    announcement.publication_end < minPublicationEnd;

  const publicationEndBeforeStart =
    !!announcement.publication_start &&
    !!announcement.publication_end &&
    announcement.publication_end < announcement.publication_start;

  const setFeedback = (value: Step3FeedbackResult) =>
    onAnnouncementChange({
      feedback_result: value,
      feedback_clarification_letter_no:
        value === "has_comments" ? (announcement.feedback_clarification_letter_no ?? "") : "",
    });

  const feedbackUploadHelper =
    announcement.feedback_result === "none"
      ? STEP3_FEEDBACK_HELPER_NONE
      : announcement.feedback_result === "has_comments"
        ? STEP3_FEEDBACK_HELPER_HAS_COMMENTS
        : null;

  const feedbackReportUploaded = docBinder.docs.some(
    (d) => d.document_type === STEP3_DOC.FEEDBACK_REPORT,
  );

  const publicationEnd = announcement.publication_end ?? "";
  const prevPublicationEndRef = useRef(publicationEnd);
  /** true เมื่อผู้ใช้เลือกวันอนุมัติเอง (ไม่ใช่ค่า auto-sync จากวันสิ้นสุดเผยแพร่) */
  const procApprovalManuallySetRef = useRef(false);

  /** ปักค่าเริ่มต้นวันอนุมัติรายงานขอซื้อขอจ้าง = วันสิ้นสุดการเผยแพร่ (ตามระเบียบพัสดุ) */
  useEffect(() => {
    if (!publicationEnd) {
      prevPublicationEndRef.current = publicationEnd;
      return;
    }
    const current = announcement.procurement_request_approval_date ?? "";
    const prevEnd = prevPublicationEndRef.current;

    const wasAutoSyncedToPrevEnd = !!prevEnd && current === prevEnd;
    const shouldSync =
      !procApprovalManuallySetRef.current ||
      !current ||
      current < publicationEnd ||
      wasAutoSyncedToPrevEnd;

    if (shouldSync && current !== publicationEnd) {
      onAnnouncementChange({ procurement_request_approval_date: publicationEnd });
      procApprovalManuallySetRef.current = false;
      setProcApprovalDateRejected(false);
    }

    prevPublicationEndRef.current = publicationEnd;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync เมื่อ publication_end เปลี่ยน
  }, [publicationEnd]);

  const handleProcApprovalDateChange = (v: string) => {
    if (!v) {
      procApprovalManuallySetRef.current = false;
      setProcApprovalDateRejected(false);
      onAnnouncementChange({ procurement_request_approval_date: "" });
      return;
    }
    if (publicationEnd && v < publicationEnd) {
      setProcApprovalDateRejected(true);
      return;
    }
    procApprovalManuallySetRef.current = !!publicationEnd && v !== publicationEnd;
    setProcApprovalDateRejected(false);
    onAnnouncementChange({ procurement_request_approval_date: v });
  };

  const procApprovalBeforePublicationEnd =
    !!publicationEnd &&
    !!announcement.procurement_request_approval_date &&
    announcement.procurement_request_approval_date < publicationEnd;

  const showProcApprovalDateError =
    procApprovalDateRejected || procApprovalBeforePublicationEnd;

  const overlapNames = useMemo(
    () => detectCommitteeEvaluationInspectionOverlap(step2Committees),
    [step2Committees],
  );

  const step3SoftWarnings = useMemo(
    () =>
      getStep3ComplianceWarnings(announcement, {
        budget,
        hasFeedbackReportDoc: feedbackReportUploaded,
        hearingFormActive: true,
      }),
    [announcement, budget, feedbackReportUploaded],
  );

  return (
    <MissingDocHighlightContext.Provider value={docBinder.highlightedMissingDocs ?? []}>
    <div className="space-y-4 max-w-2xl">
      {step3SoftWarnings.map((w) => (
        <p key={w.id} className="text-sm text-warning font-medium rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
          {w.message}
        </p>
      ))}

      {overlapNames.length > 0 && (
        <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-3 space-y-2">
          <p className="text-sm text-warning font-medium">{STEP3_COMMITTEE_OVERLAP_WARNING_MSG}</p>
          <p className="text-xs text-muted-foreground">
            ชื่อที่ซ้ำ: {overlapNames.join(", ")}
          </p>
          <FieldRow label="เหตุผลประกอบ (บันทึกใน Log โครงการ)">
            <textarea
              value={complianceLog?.committee_overlap_reason ?? ""}
              onChange={(e) => onComplianceLogChange({ committee_overlap_reason: e.target.value })}
              placeholder="ระบุเหตุผลที่ยอมรับการซ้ำชื่อกรรมการข้ามชุด (ไม่บล็อกการดำเนินการ)"
              disabled={readOnly}
              rows={2}
              className={`${inputCls} resize-y min-h-[3rem]`}
            />
          </FieldRow>
          {complianceLog?.committee_overlap_warning_at && (
            <p className="text-xs text-muted-foreground">
              บันทึก Log เมื่อ{" "}
              {formatThaiDate(complianceLog.committee_overlap_warning_at.slice(0, 10))}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 1: ร่างเอกสารและ Spec (Anti-Lock-in)</SectionTitle>
        <FieldRow label="ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ" complianceTarget="draft_tor_doc">
          <p className="text-xs text-muted-foreground mb-2">{STEP3_TOR_UPLOAD_COMPLIANCE_HELPER}</p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.DRAFT_TOR_SPEC}
            label={STEP3_DRAFT_TOR_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="ร่างประกาศและร่างเอกสารประกวดราคา" complianceTarget="draft_announcement_doc">
          <p className="text-xs text-muted-foreground mb-2">
            {STEP3_ANNOUNCEMENT_UPLOAD_COMPLIANCE_HELPER}
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.DRAFT_ANNOUNCEMENT_BID}
            label={STEP3_DRAFT_ANNOUNCEMENT_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="ตารางราคากลาง (บก.06)" complianceTarget="bg06_doc">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.MEDIAN_BG06}
            label={STEP3_MEDIAN_BG06_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
            inheritedDocs={docBinder.inheritedDocs}
            alternateDocumentTypes={[STEP2_DOC.MEDIAN_PRICE_BG06]}
            readOnly={readOnly}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <SectionTitle>สถานะราคากลาง (อ้างอิงขั้นตอนที่ 2)</SectionTitle>
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm space-y-1">
          <p>
            ราคากลางที่อนุมัติ:{" "}
            <span className="font-medium">
              {medianDisplay != null && medianDisplay > 0
                ? `${formatBaht(medianDisplay)} บาท`
                : "— ยังไม่มีข้อมูล (กรุณาบันทึกขั้นตอนที่ 2)"}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            วันที่อนุมัติราคากลาง:{" "}
            {medianPriceApprovalDate
              ? formatThaiDate(medianPriceApprovalDate)
              : "— ยังไม่มีข้อมูล"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>ข้อมูลบันทึกข้อความเสนอลงนาม</SectionTitle>
        <FieldRow
          label="เลขที่บันทึกข้อความเสนอขอเห็นชอบ (ภายในหน่วยงาน)"
          tooltipKey="step3.approval_letter_no"
        >
          <input
            value={announcement.approval_letter_no ?? ""}
            onChange={(e) => onAnnouncementChange({ approval_letter_no: e.target.value })}
            placeholder="(เช่น บันทึกข้อความ ที่ กษ ๐๖๐๒ / ๑๒๓)"
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground mt-2">{STEP3_MEMO_UPLOAD_COMPLIANCE_HELPER}</p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.MEMO_APPROVAL}
            label={STEP3_MEMO_APPROVAL_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนาม">
          <ChronologicalDatePicker
            stepNumber={3}
            chronologicalCtx={chronologicalCtx}
            minProfile="step3_tor_approval"
            value={announcement.approval_letter_date ?? ""}
            onChange={handleApprovalDateChange}
            showChronologicalHint={false}
          />
          {torApprovalBeforeStep1Plan && (
            <p className="text-sm text-destructive mt-2 font-medium">
              {STEP3_TOR_APPROVAL_BEFORE_STEP1_PLAN_MSG}
            </p>
          )}
          {announcement.approval_letter_date && !torApprovalBeforeStep1Plan && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(announcement.approval_letter_date)}
            </p>
          )}
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>ข้อมูลการเผยแพร่ระบบ e-GP</SectionTitle>
        <FieldRow label="เลขที่โครงการในระบบ e-GP" tooltipKey="step3.egp_project_code">
          <input
            value={announcement.egp_project_code ?? ""}
            onChange={(e) => onAnnouncementChange({ egp_project_code: e.target.value })}
            placeholder="เช่น เลขที่โครงการ e-GP หรือรหัสแผนจัดซื้อจัดจ้าง"
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="เลขที่ประกาศในระบบ e-GP">
          <input
            value={announcement.egp_announcement_no ?? ""}
            onChange={(e) => onAnnouncementChange({ egp_announcement_no: e.target.value })}
            placeholder="เช่น เลขที่ ๑/๒๕๖๙ หรือ บ.๐๖๐๒/๒๕๖๙"
            className={inputCls}
          />
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.EGP_ANNOUNCEMENT}
            label="📎 PDF ประกาศจากระบบ e-GP"
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.EGP_SCREENSHOT}
            label={STEP3_EGP_SCREENSHOT_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="ช่องทางรับคำวิจารณ์จากผู้ประกอบการ">
          <input
            value={announcement.comment_channel_email ?? ""}
            onChange={(e) => onAnnouncementChange({ comment_channel_email: e.target.value })}
            placeholder="เช่น procurement@agency.go.th หรือช่องทางอื่นที่ระบุในประกาศ"
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground mt-1">
            ระบุอีเมลหน่วยงานหรือช่องทางที่ผู้ประกอบการส่งคำวิจารณ์ได้ตามที่ประกาศไว้
          </p>
        </FieldRow>
        <div className="grid sm:grid-cols-2 gap-4" data-compliance-target="publication_dates">
          <FieldRow label="วันที่เริ่มเผยแพร่ร่างประกาศ" tooltipKey="step3.publication_start" complianceTarget="publication_start">
            <ChronologicalDatePicker
              stepNumber={3}
              chronologicalCtx={chronologicalCtx}
              intraStepMinDate={approvalDate}
              value={announcement.publication_start ?? ""}
              onChange={handlePublicationStartChange}
              workdaysOnly
              disabled={!approvalDate}
              onInvalidDate={() => setStartDateRejected(true)}
              showChronologicalHint={false}
            />
            {!approvalDate && (
              <p className="text-xs text-muted-foreground mt-1">
                กรุณาระบุวันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนามก่อน
              </p>
            )}
            {approvalDate && (
              <p className="text-xs text-muted-foreground mt-1">
                (ต้องเป็นวันเดียวกันหรือหลังจากวันที่หัวหน้าลงนาม)
              </p>
            )}
          </FieldRow>
          <FieldRow label="วันที่สิ้นสุดการเผยแพร่ร่างประกาศ" complianceTarget="publication_end">
            <ChronologicalDatePicker
              stepNumber={3}
              chronologicalCtx={chronologicalCtx}
              additionalMinDates={[minPublicationEnd]}
              value={announcement.publication_end ?? ""}
              onChange={handlePublicationEndChange}
              workdaysOnly
              disabled={
                !announcement.publication_start || !publicationExtended || readOnly
              }
              onInvalidDate={() => setEndDateRejected(true)}
              showChronologicalHint={false}
            />
            {minPublicationEnd && (
              <p className="text-xs text-muted-foreground mt-1">
                ค่าเริ่มต้น {formatThaiDate(minPublicationEnd)} (+ {MIN_DRAFT_PUBLICATION_WORKDAYS}{" "}
                วันทำการถัดจากวันเริ่ม ไม่นับวันเริ่มเผยแพร่) — ล็อกตามเกณฑ์ขั้นต่ำ
              </p>
            )}
            <label className="flex items-start gap-2 text-sm mt-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={publicationExtended}
                onChange={(e) => handlePublicationExtendToggle(e.target.checked)}
                disabled={!announcement.publication_start || readOnly}
              />
              <span>ขยายระยะเวลาเผยแพร่เกินเกณฑ์ขั้นต่ำ 3 วันทำการ</span>
            </label>
            {publicationExtended && (
              <div className="mt-2 space-y-1" data-compliance-target="publication_end_extension_reason">
                <p className="text-sm font-medium text-foreground">เหตุผลประกอบการขยายระยะเวลา *</p>
                <textarea
                  value={announcement.publication_end_extension_reason ?? ""}
                  onChange={(e) =>
                    onAnnouncementChange({ publication_end_extension_reason: e.target.value })
                  }
                  placeholder="ระบุเหตุผลที่ขยายระยะเวลาเผยแพร่เกินเกณฑ์ขั้นต่ำ"
                  disabled={readOnly}
                  rows={2}
                  className={`${inputCls} resize-y min-h-[3rem]`}
                />
              </div>
            )}
          </FieldRow>
        </div>
        {announcement.publication_start && (
          <div
            className="rounded-md px-3 py-2 text-sm"
            style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E3A8A" }}
          >
            💡 {STEP3_PUBLICATION_END_GUIDELINE}
          </div>
        )}
        {(publicationEndBelowMinimum || endDateRejected) && (
          <p className="text-xs text-destructive font-medium">
            {endDateRejected && !publicationEndBelowMinimum
              ? STEP3_PUBLICATION_NON_WORKDAY_MSG
              : STEP3_PUBLICATION_END_TOO_SHORT_MSG}
            {minPublicationEnd && publicationEndBelowMinimum && (
              <span className="font-normal text-destructive/90">
                {" "}
                (วันสิ้นสุดขั้นต่ำ: {formatThaiDate(minPublicationEnd)})
              </span>
            )}
          </p>
        )}
        {publicationExtended &&
          isPublicationEndExtendedBeyondMinimum(
            announcement.publication_start ?? "",
            announcement.publication_end ?? "",
          ) &&
          !announcement.publication_end_extension_reason?.trim() && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_EXTENSION_REASON_MSG}
          </p>
        )}
        {startDateRejected && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_NON_WORKDAY_MSG} (วันเริ่มเผยแพร่)
          </p>
        )}
        {(startBeforeApprovalRejected || publicationStartBeforeApproval) && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_BEFORE_APPROVAL_MSG}
          </p>
        )}
        {(publicationStartNonWorkday || publicationEndNonWorkday) &&
          !startDateRejected &&
          !endDateRejected && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_NON_WORKDAY_MSG}
          </p>
        )}
        {publicationEndBeforeStart && (
          <p className="text-xs text-destructive">
            วันสิ้นสุดต้องไม่ก่อนวันเริ่มเผยแพร่
          </p>
        )}
        {showPublicationStats &&
          !publicationEndBeforeStart &&
          !publicationEndBelowMinimum &&
          !endDateRejected && (
          <div className="rounded-md border bg-background px-3 py-2 text-sm">
            <p className="text-foreground">
              📊 เผยแพร่ {publicationWorkdays} วันทำการ (ถัดจากวันเริ่ม)
              <span className="text-muted-foreground text-xs ml-1">
                (ไม่นับวันเริ่มเผยแพร่ เสาร์-อาทิตย์ และวันหยุดราชการ)
              </span>
              {publicationWorkdays > MIN_DRAFT_PUBLICATION_WORKDAYS && (
                <span className="text-xs ml-1" style={{ color: "#059669" }}>
                  — ขยายระยะเวลาเกินขั้นต่ำตามดุลยพินิจ
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>สรุปผลการรับฟังความคิดเห็น</SectionTitle>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">สรุปผลการรับฟังความคิดเห็น</p>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="step3_feedback"
                checked={announcement.feedback_result === "none"}
                onChange={() => setFeedback("none")}
                className="mt-0.5 h-4 w-4"
              />
              ไม่มีผู้จำหน่ายวิจารณ์ (ผ่าน)
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="step3_feedback"
                checked={announcement.feedback_result === "has_comments"}
                onChange={() => setFeedback("has_comments")}
                className="mt-0.5 h-4 w-4"
              />
              มีผู้เสนอแนะหรือวิจารณ์ (ต้องแก้ไข/ชี้แจง)
            </label>
          </div>
        </div>
        {announcement.feedback_result === "has_comments" && (
          <FieldRow label="เลขที่หนังสือชี้แจง/แก้ไข">
            <input
              value={announcement.feedback_clarification_letter_no ?? ""}
              onChange={(e) =>
                onAnnouncementChange({ feedback_clarification_letter_no: e.target.value })
              }
              placeholder="ระบุเลขที่หนังสือชี้แจงหรือแก้ไขร่าง TOR"
              disabled={readOnly}
              className={inputCls}
            />
          </FieldRow>
        )}
        <FieldRow label="เลขที่หนังสือรายงานผลการรับฟังความคิดเห็น">
          <input
            value={announcement.feedback_report_no ?? ""}
            onChange={(e) => onAnnouncementChange({ feedback_report_no: e.target.value })}
            placeholder="ระบุเลขที่บันทึกข้อความสรุปรายงานผลเสนอ ผอ."
            className={inputCls}
          />
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.FEEDBACK_REPORT}
            label={STEP3_FEEDBACK_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
          {feedbackUploadHelper && (
            <p className="text-xs font-semibold mt-2 leading-relaxed" style={{ color: "#2563EB" }}>
              *({feedbackUploadHelper})*
            </p>
          )}
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>จัดทำรายงานขอซื้อหรือขอจ้าง (ส่งต่อขั้นตอนที่ 4)</SectionTitle>
        <p className="text-xs text-muted-foreground">
          ข้อมูลนี้บันทึกลงฐานข้อมูลโครงการและใช้คำนวณไทม์ไลน์รับซองราคาในขั้นตอนที่ 4 โดยอัตโนมัติ
        </p>
        <FieldRow label="เลขที่หนังสือบันทึกข้อความเสนอขอเห็นชอบ *" complianceTarget="procurement_request_letter_no">
          <input
            value={announcement.procurement_request_letter_no ?? ""}
            onChange={(e) =>
              onAnnouncementChange({ procurement_request_letter_no: e.target.value })
            }
            placeholder="กษ ๐๖๐๒ / ๔๕๖"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานลงนาม *" complianceTarget="procurement_request_approval_date">
          <ChronologicalDatePicker
            stepNumber={3}
            chronologicalCtx={chronologicalCtx}
            intraStepMinDate={publicationEnd}
            value={announcement.procurement_request_approval_date ?? ""}
            onChange={handleProcApprovalDateChange}
            disabled={!publicationEnd || readOnly}
            onInvalidDate={() => setProcApprovalDateRejected(true)}
            showChronologicalHint={false}
          />
          {!publicationEnd && (
            <p className="text-xs text-muted-foreground mt-1">
              กรุณาระบุวันสิ้นสุดการเผยแพร่ร่างประกาศก่อน
            </p>
          )}
          {announcement.procurement_request_approval_date && !showProcApprovalDateError && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(announcement.procurement_request_approval_date)}
            </p>
          )}
          {showProcApprovalDateError && publicationEnd && (
            <p className="text-xs text-destructive font-medium mt-1">
              ❌ วันที่อนุมัติรายงานผล ต้องไม่น้อยกว่าวันสิ้นสุดการเผยแพร่ร่างประกาศ (วันที่{" "}
              {formatThaiDateSlash(publicationEnd)})
            </p>
          )}
        </FieldRow>
        <FieldRow label="ระยะเวลารับซองราคา / พิจารณาผล (วันทำการ) *" complianceTarget="committee_review_workdays">
          <input
            type="number"
            min={1}
            step={1}
            value={
              announcement.committee_review_workdays != null
                ? String(announcement.committee_review_workdays)
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (!raw) {
                onAnnouncementChange({ committee_review_workdays: null });
                return;
              }
              const n = parseInt(raw, 10);
              onAnnouncementChange({
                committee_review_workdays: Number.isFinite(n) && n > 0 ? n : null,
              });
            }}
            placeholder="เช่น 15 วันทำการ — นับจากวันอนุมัติขอซื้อขอจ้างไปจนถึงวันปิดรับซอง"
            disabled={readOnly}
            className={inputCls}
          />
          <p className="text-xs text-muted-foreground mt-1">
            ใช้คำนวณวันปิดรับซองและเดดไลน์คณะกรรมการพิจารณาผลในขั้นตอนที่ 4 (ข้อ 55)
          </p>
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>หมายเหตุการรับฟังความคิดเห็น</SectionTitle>
        <FieldRow label="หมายเหตุ / ประเด็นวิจารณ์เพิ่มเติม">
          <textarea
            value={announcement.feedback_notes ?? ""}
            onChange={(e) => onAnnouncementChange({ feedback_notes: e.target.value })}
            rows={3}
            placeholder="บันทึกประเด็นที่ผู้ประกอบการเสนอ (ถ้ามี)"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <ResponsibleOfficerField
          stepNumber={3}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
      </div>
    </div>
    </MissingDocHighlightContext.Provider>
  );
}

type Step4DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
  /** ประเภทเอกสารที่ต้องเน้นแดงหลัง validation ไม่ผ่าน */
  highlightedMissingDocs?: string[];
};

type Step4FormProps = {
  checklist: Step4Checklist;
  onChecklistChange: (key: Step4ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  bidResult: Step4BidResult;
  onBidResultChange: (patch: Partial<Step4BidResult>) => void;
  responsibleName: string;
  onResponsibleNameChange: (v: string) => void;
  step1ResponsibleDefault?: string;
  step4Timeline?: Step4Timeline;
  step3PublicationEnd?: string;
  step2MedianApprovalDate?: string;
  budget: number;
  approvedMedianPrice?: number | null;
  specificMethodReason?: string;
  docBinder: Step4DocBinder;
  supervisorOrderDocs?: StepDocRecord[];
  /** issue.id ที่ต้องเน้นแดงหลัง validation ไม่ผ่าน */
  highlightedComplianceIssues?: string[];
  /** ล็อกตารางผู้ยื่นข้อเสนอหลังผ่านขั้นตอนที่ 5 */
  winnerDataLocked?: boolean;
} & ChronologicalFormProps;

function Step4CommitteeMembersPanel({
  title,
  panelTarget,
  members,
  onMembersChange,
  highlightedComplianceIssues = [],
  readOnly,
}: {
  title: string;
  panelTarget: "evaluation_committee_members" | "inspection_committee_members";
  members: Step4CommitteeMember[];
  onMembersChange: (next: Step4CommitteeMember[]) => void;
  highlightedComplianceIssues?: string[];
  readOnly?: boolean;
}) {
  const safeMembers = normalizeStep4CommitteeMembers(members);
  const showPanelError = highlightedComplianceIssues.some(
    (id) => id === panelTarget || id.startsWith(`${panelTarget}_row_`),
  );

  const emitMembers = (next: Step4CommitteeMember[]) => {
    onMembersChange(applyStep4CommitteeRoleConstraints(next));
  };

  const patchRow = (index: number, patch: Partial<Step4CommitteeMember>) => {
    emitMembers(
      safeMembers.map((row, i) =>
        i === index ? normalizeStep4CommitteeMember({ ...row, ...patch }) : row,
      ),
    );
  };

  const addRow = () => {
    emitMembers([...safeMembers, { ...EMPTY_STEP4_COMMITTEE_MEMBER }]);
  };

  const removeRow = (index: number) => {
    if (safeMembers.length <= STEP4_MIN_COMMITTEE_MEMBERS) return;
    emitMembers(safeMembers.filter((_, i) => i !== index));
  };

  const rowHasError = (index: number, member: Step4CommitteeMember) => {
    if (!showPanelError) return false;
    const rowId = `${panelTarget}_row_${index}`;
    if (
      !highlightedComplianceIssues.includes(rowId) &&
      !highlightedComplianceIssues.includes(panelTarget)
    ) {
      return false;
    }
    return !member.full_name.trim() || !member.position.trim() || !member.role;
  };

  return (
    <div
      data-compliance-target={panelTarget}
      className={`rounded-lg border p-4 space-y-3 transition-colors ${
        showPanelError
          ? "border-2 border-red-500 bg-red-50/40"
          : "border-border bg-background"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-medium ${showPanelError ? "text-red-600" : "text-foreground"}`}>
          {title} *
        </p>
        <button
          type="button"
          onClick={addRow}
          disabled={readOnly}
          className="h-8 px-2.5 rounded-md border border-input text-xs font-medium hover:bg-accent inline-flex items-center gap-1 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มรายชื่อกรรมการ
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        บังคับอย่างน้อย {STEP4_MIN_COMMITTEE_MEMBERS} คน — แถวแรกเป็นประธานกรรมการโดยอัตโนมัติ
        แถวถัดไปเลือกได้เฉพาะกรรมการหรือกรรมการและเลขานุการ
      </p>
      {showPanelError && (
        <p className="text-xs font-medium text-red-600" role="alert">
          ⚠️ กรุณาระบุรายชื่อคณะกรรมการอย่างน้อย {STEP4_MIN_COMMITTEE_MEMBERS} คน และกรอกข้อมูลให้ครบทุกแถว
        </p>
      )}
      <div className="space-y-3">
        {safeMembers.map((member, index) => {
          const hasRowError = rowHasError(index, member);
          return (
            <div
              key={index}
              data-compliance-target={`${panelTarget}_row_${index}`}
              className={`rounded-md border p-3 space-y-2 ${
                hasRowError ? "border-red-500 bg-red-50/60" : "border-border bg-muted/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-medium ${hasRowError ? "text-red-600" : "text-muted-foreground"}`}
                >
                  กรรมการคนที่ {index + 1}
                </span>
                {safeMembers.length > STEP4_MIN_COMMITTEE_MEMBERS && !readOnly && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="h-8 w-8 rounded-md border border-input text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0"
                    title="ลบแถวนี้"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">ชื่อ-นามสกุล *</label>
                  <input
                    value={member.full_name}
                    onChange={(e) => patchRow(index, { full_name: e.target.value })}
                    placeholder="เช่น นายสมชาย ใจดี"
                    disabled={readOnly}
                    className={`${inputCls} ${hasRowError && !member.full_name.trim() ? "border-red-500 focus:ring-red-500" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">ตำแหน่ง/สังกัด *</label>
                  <input
                    value={member.position}
                    onChange={(e) => patchRow(index, { position: e.target.value })}
                    placeholder="เช่น หัวหน้าแผนกพัสดุ"
                    disabled={readOnly}
                    className={`${inputCls} ${hasRowError && !member.position.trim() ? "border-red-500 focus:ring-red-500" : ""}`}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">บทบาท/ตำแหน่งในคณะกรรมการ *</label>
                {index === 0 ? (
                  <select
                    value="chair"
                    disabled
                    className={`${inputCls} bg-muted/40 text-foreground cursor-not-allowed opacity-90`}
                    aria-readonly
                  >
                    <option value="chair">ประธานกรรมการ</option>
                  </select>
                ) : (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      patchRow(index, {
                        role: e.target.value as Step4CommitteeMember["role"],
                      })
                    }
                    disabled={readOnly}
                    className={`${inputCls} ${hasRowError && !member.role ? "border-red-500 focus:ring-red-500" : ""}`}
                  >
                    <option value="">เลือกบทบาท</option>
                    {STEP4_COMMITTEE_ROLE_OPTIONS.filter((opt) => opt.value !== "chair").map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseOptionalCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Step4BiddersTable({
  bidders,
  readOnly,
  onBiddersChange,
}: {
  bidders: Step4Bidder[];
  readOnly?: boolean;
  onBiddersChange: (next: Step4Bidder[]) => void;
}) {
  const safeBidders = normalizeStep4Bidders(bidders);
  const lowestIndices = resolveLowestValidStep4BidderIndices(safeBidders);

  const emitBidders = (next: Step4Bidder[]) => {
    const normalized = normalizeStep4Bidders(next);
    console.log("📊 [BIDDERS DEBUG] Current Bidders List State:", normalized);
    const lowestBidder = resolveLowestValidStep4Bidder(normalized);
    console.log("🏆 [BIDDERS DEBUG] Calculated Lowest Valid Bidder:", lowestBidder);
    onBiddersChange(normalized);
  };

  const patchRow = (index: number, patch: Partial<Step4Bidder>) => {
    const next = safeBidders.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    emitBidders(next);
  };

  const addRow = () => {
    emitBidders([...safeBidders, { ...EMPTY_STEP4_BIDDER }]);
  };

  const removeRow = (index: number) => {
    emitBidders(safeBidders.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3" data-compliance-target="step4_bidders_table">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-2 py-2 font-medium w-8">#</th>
              <th className="px-2 py-2 font-medium min-w-[160px]">
                ชื่อบริษัท/ห้างหุ้นส่วนจำกัด *
              </th>
              <th className="px-2 py-2 font-medium min-w-[120px]">ราคาที่เสนอ (บาท) *</th>
              <th className="px-2 py-2 font-medium min-w-[120px]">สถานะคุณสมบัติ</th>
              <th className="px-2 py-2 font-medium min-w-[140px]">ราคาหลังต่อรอง/หมายเหตุ</th>
              <th className="px-2 py-2 w-10" aria-label="ลบแถว" />
            </tr>
          </thead>
          <tbody>
            {safeBidders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-xs">
                  ยังไม่มีรายชื่อ — กดปุ่มด้านล่างเพื่อเพิ่มผู้ยื่นข้อเสนอ
                </td>
              </tr>
            ) : (
              safeBidders.map((row, index) => {
                const isLowest = lowestIndices.includes(index);
                return (
                  <tr
                    key={index}
                    className={`border-b border-border last:border-b-0 ${
                      isLowest ? "bg-success/10" : "bg-background"
                    }`}
                  >
                    <td className="px-2 py-2 align-top text-muted-foreground">{index + 1}</td>
                    <td
                      className="px-2 py-2 align-top"
                      data-compliance-target={`bidder_${index}_company_name`}
                    >
                      <input
                        value={row.company_name}
                        onChange={(e) => patchRow(index, { company_name: e.target.value })}
                        placeholder="ชื่อนิติบุคคล"
                        disabled={readOnly}
                        className={inputCls}
                      />
                      {isLowest && (
                        <p className="text-[11px] text-success font-medium mt-1">
                          🟢 เสนอราคาต่ำสุดและผ่านคุณสมบัติ
                          {row.offered_price != null && row.offered_price > 0 && (
                            <span className="block tabular-nums">
                              {formatCurrencyDisplay(row.offered_price)} บาท
                            </span>
                          )}
                        </p>
                      )}
                    </td>
                    <td
                      className="px-2 py-2 align-top"
                      data-compliance-target={`bidder_${index}_offered_price`}
                    >
                      {readOnly ? (
                        <span className="text-sm font-medium tabular-nums">
                          {row.offered_price != null && row.offered_price > 0
                            ? formatCurrencyDisplay(row.offered_price)
                            : "—"}
                        </span>
                      ) : (
                        <CurrencyInput
                          value={row.offered_price}
                          onChange={(offered_price) => patchRow(index, { offered_price })}
                          className={inputCls}
                        />
                      )}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <select
                        value={row.qualification_status}
                        onChange={(e) =>
                          patchRow(index, {
                            qualification_status: e.target.value as Step4BidderQualification,
                          })
                        }
                        disabled={readOnly}
                        className={inputCls}
                      >
                        {STEP4_BIDDER_QUALIFICATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <input
                        value={row.negotiation_notes ?? ""}
                        onChange={(e) =>
                          patchRow(index, { negotiation_notes: e.target.value })
                        }
                        placeholder="ไม่บังคับ"
                        disabled={readOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="h-9 w-9 rounded-md border border-input text-destructive hover:bg-destructive/10 flex items-center justify-center"
                          title="ลบแถวนี้"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายชื่อผู้ยื่นข้อเสนอ
        </button>
      )}
    </div>
  );
}

/** ขั้นตอนที่ 4 — รายงานขอซื้อขอจ้าง (ข้อ 22) */
export function Step4DetailForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  readOnly,
  bidResult,
  onBidResultChange,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  step4Timeline,
  step3PublicationEnd = "",
  step2MedianApprovalDate = "",
  budget,
  approvedMedianPrice = null,
  specificMethodReason = "",
  docBinder,
  supervisorOrderDocs = [],
  highlightedComplianceIssues = [],
  winnerDataLocked = false,
  chronologicalCtx,
}: Step4FormProps) {
  const timeline = step4Timeline ?? {
    bidPeriodStartISO: "",
    bidPeriodWorkdays: null,
    bidSubmissionEndISO: "",
    committeeReviewDeadlineISO: "",
  };
  const bidSubmissionEndDate = timeline.bidSubmissionEndISO;
  const committeeReviewDeadlineISO = timeline.committeeReviewDeadlineISO;
  const timelineLines = getStep4TimelineDisplayLines(timeline);
  const publicationEnd = step3PublicationEnd.trim();
  const medianApprovalDate = step2MedianApprovalDate.trim();
  const procurementSignMinDate = resolveStep4ProcurementSignMinDate({
    step2MedianApprovalDate: medianApprovalDate,
    step3PublicationEnd: publicationEnd,
  });
  const procurementSignDateOpts = {
    step2MedianApprovalDate: medianApprovalDate,
    step3PublicationEnd: publicationEnd,
  };

  const medianDisplay = resolveProjectMedianPrice({
    approved_median_price: approvedMedianPrice,
    estimated_price: null,
  });

  const step4UploadedDocs = useMemo(
    () => docBinder.docs.filter((d) => d.step_number === docBinder.stepNumber),
    [docBinder.docs, docBinder.stepNumber],
  );
  const step4UploadedTypes = useMemo(
    () => step4UploadedDocs.map((d) => d.document_type),
    [step4UploadedDocs],
  );
  const hasCommitteeReportDoc = hasStep4CommitteeReportDoc(step4UploadedTypes);
  const hasEgpSummaryDoc = hasStep4EgpBidSummaryDoc(step4UploadedTypes);
  const hasBlacklistDoc = hasStep4BlacklistEvidenceDoc(step4UploadedTypes);
  const hasConflictDoc = hasStep4ConflictEvidenceDoc(step4UploadedTypes);

  const logOptionalAuditUpload = (info: {
    documentType: string;
    fileName: string;
    storagePath: string;
  }) => {
    logStep4OptionalAuditTrailDebug(docBinder.docs, docBinder.stepNumber, {
      documentType: info.documentType,
      fileName: info.fileName,
      storagePath: info.storagePath,
    });
  };

  const step4DocLabel = (title: string, ready: boolean) => (
    <span className="inline-flex items-center gap-1.5">
      {ready && (
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-label="อัปโหลดแล้ว" />
      )}
      <span>{title}</span>
    </span>
  );

  const [procApprovalDateRejected, setProcApprovalDateRejected] = useState(false);
  const [approvalDateRejected, setApprovalDateRejected] = useState(false);
  const approvalManuallySetRef = useRef(false);

  const handleProcurementApprovalDateChange = (v: string) => {
    if (!v) {
      setProcApprovalDateRejected(false);
      onBidResultChange({ procurement_request_approval_date: "" });
      return;
    }
    const issues = getStep4ProcurementSignDateIssues(v, procurementSignDateOpts).filter(
      (i) => i.id !== "step3_publication_end_missing",
    );
    if (issues.length > 0) {
      setProcApprovalDateRejected(true);
      toast.error(STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG);
      return;
    }
    setProcApprovalDateRejected(false);
    onBidResultChange({ procurement_request_approval_date: v });
  };

  const procSignChronologyIssues = bidResult.procurement_request_approval_date?.trim()
    ? getStep4ProcurementSignDateIssues(
        bidResult.procurement_request_approval_date,
        procurementSignDateOpts,
      ).filter((i) => i.id !== "step3_publication_end_missing")
    : [];

  const showProcApprovalDateError =
    procApprovalDateRejected || procSignChronologyIssues.length > 0;

  const handleMockPrintProcurementRequest = () => {
    toast.message(
      [
        "เตรียมพิมพ์บันทึกขอซื้อขอจ้าง (Mock)",
        `เหตุผลความจำเป็น: ${specificMethodReason.trim() || "—"}`,
        `ราคากลาง: ${medianDisplay != null && medianDisplay > 0 ? formatBaht(medianDisplay) : "—"}`,
        `วงเงินโครงการ: ${budget > 0 ? formatBaht(budget) : "—"}`,
      ].join(" · "),
      { duration: 7000 },
    );
  };

  /** ค่าเริ่มต้น = วันนี้ (ไม่ต่ำกว่าวันปิดรับซอง) */
  useEffect(() => {
    const current = bidResult.evaluation_report_approval_date ?? "";
    if (current) {
      approvalManuallySetRef.current = true;
      return;
    }
    onBidResultChange({
      evaluation_report_approval_date: defaultStep4EvaluationApprovalDateISO(
        committeeReviewDeadlineISO,
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- default เมื่อยังไม่มีค่า
  }, [committeeReviewDeadlineISO]);

  /** ปรับค่า auto ให้ไม่ต่ำกว่าเดดไลน์คณะกรรมการ และวันสิ้นสุดรับฟังความคิดเห็น (ขั้น 3) */
  useEffect(() => {
    if (!committeeReviewDeadlineISO || approvalManuallySetRef.current) return;
    const current = bidResult.evaluation_report_approval_date ?? "";
    const minDate = [committeeReviewDeadlineISO, publicationEnd].filter(Boolean).sort().pop() ?? "";
    if (current && minDate && current < minDate) {
      onBidResultChange({ evaluation_report_approval_date: minDate });
      setApprovalDateRejected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync กับเดดไลน์คณะกรรมการและขั้น 3
  }, [committeeReviewDeadlineISO, publicationEnd, bidResult.evaluation_report_approval_date]);

  const handleEvaluationApprovalDateChange = (v: string) => {
    if (!v) {
      approvalManuallySetRef.current = false;
      setApprovalDateRejected(false);
      onBidResultChange({
        evaluation_report_approval_date: "",
        review_extension_memo_no: "",
        review_extension_approval_date: "",
      });
      return;
    }
    if (publicationEnd && v < publicationEnd) {
      setApprovalDateRejected(true);
      return;
    }
    if (bidSubmissionEndDate && v < bidSubmissionEndDate) {
      setApprovalDateRejected(true);
      return;
    }
    approvalManuallySetRef.current = true;
    setApprovalDateRejected(false);
    const overdue = isStep4EvaluationApprovalOverdue(v, committeeReviewDeadlineISO);
    onBidResultChange({
      evaluation_report_approval_date: v,
      ...(overdue
        ? {}
        : {
            review_extension_memo_no: "",
            review_extension_approval_date: "",
          }),
    });
  };

  const approvalDate = bidResult.evaluation_report_approval_date ?? "";
  const approvalBeforeBidEnd = isStep4EvaluationApprovalBeforeBidEnd(
    approvalDate,
    bidSubmissionEndDate,
  );
  const approvalBeforeStep3 =
    !!publicationEnd && !!approvalDate && approvalDate < publicationEnd;
  const showEvaluationApprovalGateHighlight = highlightedComplianceIssues.some(
    (id) =>
      id === "evaluation_report_letter_no" || id === "evaluation_report_approval_date",
  );
  const letterHasGateError =
    highlightedComplianceIssues.includes("evaluation_report_letter_no") ||
    (showEvaluationApprovalGateHighlight &&
      !(bidResult.evaluation_report_letter_no?.trim() ?? ""));
  const dateHasGateError =
    highlightedComplianceIssues.includes("evaluation_report_approval_date") ||
    approvalDateRejected ||
    approvalBeforeStep3 ||
    (showEvaluationApprovalGateHighlight && !approvalDate);
  const showApprovalDateError =
    approvalDateRejected || approvalBeforeBidEnd || approvalBeforeStep3;
  const approvalOverdue = isStep4EvaluationApprovalOverdue(
    approvalDate,
    committeeReviewDeadlineISO,
  );
  const step2SupervisorOrderDocs = supervisorOrderDocs.filter((d) => d.step_number === 2);
  const hasStep2SupervisorOrder = step2SupervisorOrderDocs.length > 0;
  const showBidWinnerReason = bidResult.egp_bid_submission_count != null;

  const handleEvaluationMembersChange = (evaluationArray: Step4CommitteeMember[]) => {
    const constrained = applyStep4CommitteeRoleConstraints(evaluationArray);
    console.log(
      "👑 [ROLE CONSTRAINT DEBUG] Evaluated Row Index Roles:",
      constrained.map((m, i) => `Row ${i + 1}: ${m.role}`),
    );
    console.log(
      "👥 [STEP 4 STRUCTURED COMMITTEES] Evaluation Committee Array:",
      constrained,
    );
    onBidResultChange({
      evaluation_committee_members: constrained,
      evaluation_committee_text: formatStep4CommitteeMembersForDisplay(constrained),
    });
  };

  const handleInspectionMembersChange = (inspectionArray: Step4CommitteeMember[]) => {
    const constrained = applyStep4CommitteeRoleConstraints(inspectionArray);
    console.log(
      "👑 [ROLE CONSTRAINT DEBUG] Inspected Row Index Roles:",
      constrained.map((m, i) => `Row ${i + 1}: ${m.role}`),
    );
    console.log(
      "👥 [STEP 4 STRUCTURED COMMITTEES] Inspection Committee Array:",
      constrained,
    );
    onBidResultChange({
      inspection_committee_members: constrained,
      inspection_committee_text: formatStep4CommitteeMembersForDisplay(constrained),
    });
  };

  return (
    <MissingDocHighlightContext.Provider value={docBinder.highlightedMissingDocs ?? []}>
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>รายงานขอซื้อขอจ้าง (ข้อ 22)</SectionTitle>
        <FieldRow label="เลขที่หนังสือบันทึกข้อความเสนอขอเห็นชอบ *" complianceTarget="procurement_request_letter_no">
          <input
            value={bidResult.procurement_request_letter_no ?? ""}
            onChange={(e) =>
              onBidResultChange({ procurement_request_letter_no: e.target.value })
            }
            placeholder="กษ ๐๖๐๒ / ๔๕๖"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานลงนามในรายงานขอซื้อขอจ้าง *" complianceTarget="procurement_request_approval_date">
          <ChronologicalDatePicker
            stepNumber={4}
            chronologicalCtx={chronologicalCtx}
            intraStepMinDate={procurementSignMinDate}
            additionalMinDates={[medianApprovalDate, publicationEnd].filter(Boolean)}
            value={bidResult.procurement_request_approval_date ?? ""}
            onChange={handleProcurementApprovalDateChange}
            disabled={!publicationEnd || readOnly}
            onInvalidDate={() => setProcApprovalDateRejected(true)}
            showChronologicalHint={false}
          />
          {!publicationEnd && (
            <p className="text-xs text-muted-foreground mt-1">
              กรุณาบันทึกวันสิ้นสุดการรับฟังความคิดเห็นในขั้นตอนที่ 3 ก่อน
            </p>
          )}
          {publicationEnd && !medianApprovalDate && (
            <p className="text-xs text-muted-foreground mt-1">
              ยังไม่พบวันอนุมัติราคากลางจากขั้นตอนที่ 2 — ระบบจะตรวจสอบเมื่อมีการบันทึกวันที่ลงนาม
            </p>
          )}
          {bidResult.procurement_request_approval_date && !showProcApprovalDateError && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(bidResult.procurement_request_approval_date)}
            </p>
          )}
          {showProcApprovalDateError && (
            <p className="text-xs text-destructive font-medium mt-1" role="alert">
              {STEP4_PROCUREMENT_SIGN_DATE_INVALID_MSG}
              {medianApprovalDate && (
                <>
                  {" "}
                  (อนุมัติราคากลางขั้นตอนที่ 2: {formatThaiDateSlash(medianApprovalDate)})
                </>
              )}
              {publicationEnd && (
                <>
                  {" "}
                  (สิ้นสุดรับฟังความคิดเห็นขั้นตอนที่ 3: {formatThaiDateSlash(publicationEnd)})
                </>
              )}
            </p>
          )}
        </FieldRow>
        <FieldRow label="ระยะเวลารับซองราคา / พิจารณาผล (วันทำการ) *" complianceTarget="committee_review_workdays">
          <input
            type="number"
            min={1}
            step={1}
            value={
              bidResult.committee_review_workdays != null
                ? String(bidResult.committee_review_workdays)
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (!raw) {
                onBidResultChange({ committee_review_workdays: null });
                return;
              }
              const n = parseInt(raw, 10);
              onBidResultChange({
                committee_review_workdays: Number.isFinite(n) && n > 0 ? n : null,
              });
            }}
            placeholder="เช่น 15 วันทำการ"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={handleMockPrintProcurementRequest}
            disabled={readOnly}
            className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50 inline-flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            พิมพ์/Download บันทึกขอซื้อขอจ้าง
          </button>
        </div>
        <FieldRow label="รายงานขอซื้อขอจ้างที่เซ็นลงนามแล้ว *" complianceTarget="signed_procurement_request_doc">
          <p className="text-xs text-muted-foreground mb-2">
            แนบไฟล์ PDF รายงานขอซื้อขอจ้างที่หัวหน้าหน่วยงานลงนามแล้ว — เอกสารบังคับเพื่อไปขั้นถัดไป
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP4_DOC.SIGNED_PROCUREMENT_REQUEST}
            label={STEP4_SIGNED_PROCUREMENT_REQUEST_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>คณะกรรมการพิจารณาผลและตรวจรับ</SectionTitle>
        <p className="text-xs text-muted-foreground -mt-2">
          กรอกรายชื่อและตำแหน่งด้วยตนเองตามคำสั่งแต่งตั้งฉบับจริง (ข้อ 22)
        </p>
        <Step4CommitteeMembersPanel
          title="คณะกรรมการพิจารณาผล"
          panelTarget="evaluation_committee_members"
          members={bidResult.evaluation_committee_members ?? []}
          onMembersChange={handleEvaluationMembersChange}
          highlightedComplianceIssues={highlightedComplianceIssues}
          readOnly={readOnly}
        />
        <Step4CommitteeMembersPanel
          title="คณะกรรมการตรวจรับ"
          panelTarget="inspection_committee_members"
          members={bidResult.inspection_committee_members ?? []}
          onMembersChange={handleInspectionMembersChange}
          highlightedComplianceIssues={highlightedComplianceIssues}
          readOnly={readOnly}
        />
      </div>

      <div
        className="rounded-lg border border-dashed border-border bg-muted/10 p-4 space-y-3"
        data-compliance-target="committee_order_doc"
      >
        <p className="text-sm font-medium text-foreground">
          คำสั่งแต่งตั้งคณะกรรมการ (ข้อ 22) *
        </p>
        <p className="text-xs text-muted-foreground">
          แนบไฟล์ PDF คำสั่งแต่งตั้งคณะกรรมการพิจารณาผลและตรวจรับพัสดุฉบับจริงในขั้นตอนนี้ — เอกสารบังคับเพื่อผ่านขั้นตอนนี้
        </p>
        <InlineDocUpload
          project={docBinder.project}
          stepNumber={docBinder.stepNumber}
          documentType={STEP2_DOC.EVALUATION_INSPECTION_ORDER}
          label={STEP2_EVALUATION_INSPECTION_ORDER_UPLOAD_LABEL}
          existing={docBinder.docs}
          onChange={docBinder.onDocsChange}
          readOnly={readOnly}
        />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 space-y-4">
        <SectionTitle>ข้อมูลการแข่งขัน (ไม่บังคับ)</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="จำนวนผู้ขอรับ/ซื้อเอกสาร">
            <input
              type="number"
              min={0}
              step={1}
              value={
                bidResult.egp_doc_request_count != null
                  ? String(bidResult.egp_doc_request_count)
                  : ""
              }
              onChange={(e) =>
                onBidResultChange({ egp_doc_request_count: parseOptionalCount(e.target.value) })
              }
              placeholder="0"
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="จำนวนผู้ยื่นข้อเสนอและราคา">
            <input
              type="number"
              min={0}
              step={1}
              value={
                bidResult.egp_bid_submission_count != null
                  ? String(bidResult.egp_bid_submission_count)
                  : ""
              }
              onChange={(e) =>
                onBidResultChange({
                  egp_bid_submission_count: parseOptionalCount(e.target.value),
                })
              }
              placeholder="0"
              className={inputCls}
            />
          </FieldRow>
        </div>
        {showBidWinnerReason && (
          <FieldRow label="สรุปเหตุผลความจำเป็นในการคัดเลือกผู้ชนะ">
            <textarea
              value={bidResult.winner_selection_reason_summary ?? ""}
              onChange={(e) =>
                onBidResultChange({ winner_selection_reason_summary: e.target.value })
              }
              rows={3}
              placeholder="บันทึกที่มาของการได้ผู้ชนะรายนี้สำหรับรายงานผลพิจารณาในขั้นตอนถัดไป"
              disabled={readOnly}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </FieldRow>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 space-y-4">
        <SectionTitle>ข้อมูลการเสนอราคาของผู้เข้าร่วมแข่งขัน</SectionTitle>
        {winnerDataLocked && (
          <p
            className="text-xs font-medium rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 leading-relaxed"
            role="status"
          >
            {STEP4_WINNER_DATA_LOCKED_MSG}
          </p>
        )}
        <p className="text-xs text-muted-foreground -mt-2">
          บันทึกรายชื่อผู้ยื่นข้อเสนอและเปรียบเทียบราคา — ข้อมูลจะถูกเก็บไว้สำหรับอ้างอิง สตง.
          และส่งต่อขั้นตอนที่ 8 อัตโนมัติ
        </p>
        <Step4BiddersTable
          bidders={bidResult.bidders ?? []}
          readOnly={readOnly || winnerDataLocked}
          onBiddersChange={(next) => onBidResultChange({ bidders: next })}
        />
        <FieldRow label="แนบตารางเปรียบเทียบราคาฉบับสมบูรณ์ (PDF) *" complianceTarget="price_comparison_doc">
          <p className="text-xs text-muted-foreground mb-2">
            เอกสารบังคับ — แนบไฟล์สรุปตารางเปรียบเทียบราคาฉบับสมบูรณ์ (ไฟล์เดียว)
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP4_DOC.PRICE_COMPARISON_TABLE}
            label={STEP4_PRICE_COMPARISON_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
            readOnly={readOnly}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
        <div className="space-y-1">
          <SectionTitle>เอกสารแนบและ Audit Trail</SectionTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            เอกสารหลักบังคับต้องครบก่อนไปขั้นถัดไป — หลักฐานเสริมช่วยรองรับการตรวจของ สตง.
          </p>
        </div>

        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span aria-hidden>📌</span>
            เอกสารหลักบังคับ (Mandatory)
          </p>
          <FieldRow
            label={step4DocLabel(
              "รายงานผลการพิจารณาของคณะกรรมการ (PDF) *",
              hasCommitteeReportDoc,
            )}
            complianceTarget="committee_evaluation_report_doc"
          >
            <p className="text-xs text-muted-foreground mb-2">
              แนบรายงานผลการพิจารณาที่คณะกรรมการลงนามครบถ้วน
            </p>
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP4_DOC.COMMITTEE_EVALUATION_REPORT}
              label={STEP4_COMMITTEE_REPORT_UPLOAD_LABEL}
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
              readOnly={readOnly}
            />
          </FieldRow>
          <FieldRow
            label={step4DocLabel(
              "ตารางสรุปผลการเสนอราคาจาก e-GP (PDF) *",
              hasEgpSummaryDoc,
            )}
            complianceTarget="egp_bid_summary_doc"
          >
            <p className="text-xs text-muted-foreground mb-2">
              ดาวน์โหลดตารางสรุปผลจากระบบ e-GP แล้วแนบเป็น PDF
            </p>
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP4_DOC.EGP_BID_SUMMARY}
              label={STEP4_EGP_SUMMARY_UPLOAD_LABEL}
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
              readOnly={readOnly}
            />
          </FieldRow>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/10 px-4 py-3 text-left text-sm font-medium hover:bg-muted/20 transition-colors [&[data-state=open]>svg]:rotate-180">
            <span>🔍 คลิกเพื่อแนบหลักฐานการตรวจสอบเสริม (Audit Trail - ไม่บังคับ)</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4 rounded-lg border border-dashed border-border bg-muted/10 p-4">
            <FieldRow
              label={step4DocLabel(
                "หลักฐานตรวจ Blacklist (PDF, PNG, JPG)",
                hasBlacklistDoc,
              )}
            >
              <p className="text-xs text-muted-foreground mb-2">
                แนบภาพหน้าจอหรือเอกสารยืนยันการตรวจสอบ Blacklist ในระบบ e-GP
              </p>
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP4_DOC.BLACKLIST_EVIDENCE}
                label="📎 แนบหลักฐานตรวจ Blacklist"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
                readOnly={readOnly}
                onUploadSuccess={logOptionalAuditUpload}
              />
            </FieldRow>
            <FieldRow
              label={step4DocLabel(
                "หลักฐานตรวจผลประโยชน์ร่วมกัน (PDF, PNG, JPG)",
                hasConflictDoc,
              )}
            >
              <p className="text-xs text-muted-foreground mb-2">
                แนบหลักฐานการตรวจสอบผลประโยชน์ทับซ้อนก่อนประกาศผล
              </p>
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP4_DOC.CONFLICT_EVIDENCE}
                label="📎 แนบหลักฐานตรวจผลประโยชน์ร่วมกัน"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
                readOnly={readOnly}
                onUploadSuccess={logOptionalAuditUpload}
              />
            </FieldRow>
          </CollapsibleContent>
        </Collapsible>

        {timelineLines ? (
          <div
            className="rounded-md border border-blue-200/80 bg-blue-50/50 px-3 py-3 space-y-1.5 text-sm text-foreground/90 leading-relaxed"
            aria-live="polite"
          >
            <p>{timelineLines.bidSubmissionEndLine}</p>
            <p>{timelineLines.committeeDeadlineLine}</p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground leading-relaxed">
            กรุณาระบุวันที่อนุมัติขอซื้อขอจ้างและระยะเวลารับซองราคา (วันทำการ) ในรายงานขอซื้อขอจ้าง
            ขั้นตอนที่ 3 เพื่อคำนวณกำหนดการอัตโนมัติ
          </div>
        )}
        <FieldRow
          label="เลขที่หนังสือรายงานผลการพิจารณา *"
          tooltipKey="step4.evaluation_report_letter_no"
          complianceTarget="evaluation_report_letter_no"
        >
          <input
            value={bidResult.evaluation_report_letter_no ?? ""}
            onChange={(e) =>
              onBidResultChange({ evaluation_report_letter_no: e.target.value })
            }
            placeholder="เช่น กษ ๐๖๐๒ / ๔๕๖"
            disabled={readOnly}
            className={`${inputCls}${letterHasGateError ? " border-destructive focus:ring-destructive" : ""}`}
          />
          {letterHasGateError && (
            <p className="text-xs text-destructive font-semibold mt-1" role="alert">
              {STEP4_EVALUATION_APPROVAL_GATE_MSG}
            </p>
          )}
        </FieldRow>
        <FieldRow
          label="วันที่หัวหน้าหน่วยงานลงนามอนุมัติผล *"
          tooltipKey="step4.evaluation_report_approval_date"
          complianceTarget="evaluation_report_approval_date"
        >
          <ChronologicalDatePicker
            stepNumber={4}
            chronologicalCtx={chronologicalCtx}
            intraStepMinDate={
              [publicationEnd, committeeReviewDeadlineISO].filter(Boolean).sort().pop() || ""
            }
            additionalMinDates={[
              publicationEnd,
              committeeReviewDeadlineISO,
              bidSubmissionEndDate,
            ].filter(Boolean)}
            value={approvalDate}
            onChange={handleEvaluationApprovalDateChange}
            onInvalidDate={() => setApprovalDateRejected(true)}
            disabled={readOnly}
            showChronologicalHint={false}
            className={
              dateHasGateError ? `${inputCls} border-destructive focus:ring-destructive` : inputCls
            }
          />
          {approvalDate && !showApprovalDateError && !dateHasGateError && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(approvalDate)}
            </p>
          )}
          {dateHasGateError && !approvalBeforeBidEnd && (
            <p className="text-xs text-destructive font-semibold mt-1" role="alert">
              {STEP4_EVALUATION_APPROVAL_GATE_MSG}
              {publicationEnd && approvalBeforeStep3 && (
                <>
                  {" "}
                  (วันสิ้นสุดรับฟังความคิดเห็นขั้นตอนที่ 3:{" "}
                  {formatThaiDateSlash(publicationEnd)})
                </>
              )}
            </p>
          )}
          {showApprovalDateError && bidSubmissionEndDate && approvalBeforeBidEnd && (
            <p className="text-xs text-destructive font-medium mt-1">
              {STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG}
              {" "}(วันที่ {formatThaiDateSlash(bidSubmissionEndDate)})
            </p>
          )}
          {approvalOverdue && !showApprovalDateError && (
            <p
              className="text-xs font-medium mt-2 rounded-md border px-3 py-2 leading-relaxed"
              style={{ color: "#C2410C", backgroundColor: "#FFF7ED", borderColor: "#FDBA74" }}
            >
              {STEP4_EVALUATION_APPROVAL_OVERDUE_MSG}
            </p>
          )}
          {approvalOverdue && !showApprovalDateError && (
            <div className="mt-3 space-y-4 rounded-md border border-orange-200 bg-orange-50/80 p-4">
              <FieldRow label="เลขที่บันทึกข้อความขอขยายเวลาพิจารณาผล">
                <input
                  value={bidResult.review_extension_memo_no ?? ""}
                  onChange={(e) =>
                    onBidResultChange({ review_extension_memo_no: e.target.value })
                  }
                  placeholder="เช่น บันทึกข้อความ กษ ๐๖๐๒ / ๑๒๓"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="วันที่หัวหน้าหน่วยงานอนุมัติขยายเวลา">
                <ChronologicalDatePicker
                  stepNumber={4}
                  chronologicalCtx={chronologicalCtx}
                  intraStepMinDate={approvalDate}
                  additionalMinDates={[bidSubmissionEndDate]}
                  value={bidResult.review_extension_approval_date ?? ""}
                  onChange={(v) =>
                    onBidResultChange({ review_extension_approval_date: v })
                  }
                  showChronologicalHint={false}
                />
                {bidResult.review_extension_approval_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatThaiDate(bidResult.review_extension_approval_date)}
                  </p>
                )}
              </FieldRow>
            </div>
          )}
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>รายชื่อผู้ควบคุมงานหน้างาน (คำสั่งแต่งตั้งช่าง)</SectionTitle>
        <div
          className="rounded-lg border border-dashed border-border bg-muted/10 p-4 space-y-3"
          data-compliance-target="supervisor_order_doc"
        >
          <p className="text-sm font-medium text-foreground">
            คำสั่งแต่งตั้งผู้ควบคุมงาน *
          </p>
          <p className="text-xs text-muted-foreground">
            เอกสารบังคับเพื่อผ่านขั้นตอน — หากมีไฟล์จากขั้นตอนที่ 2 ระบบดึงมาแสดงอัตโนมัติ
            {hasStep2SupervisorOrder
              ? " (พบไฟล์แล้ว — ลบด้วยไอคอนถังขยะได้หากต้องการอัปโหลดฉบับใหม่ในขั้นตอนที่ 4)"
              : " — กรุณาแนบไฟล์ PDF"}
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP2_DOC.SITE_SUPERVISOR_ORDER}
            label={STEP2_SITE_SUPERVISOR_ORDER_UPLOAD_LABEL}
            existing={docBinder.docs}
            inheritedDocs={
              hasStep2SupervisorOrder
                ? [{ fromStep: 2, docs: step2SupervisorOrderDocs }]
                : undefined
            }
            allowInheritedDelete={!readOnly}
            onChange={docBinder.onDocsChange}
            readOnly={readOnly}
          />
        </div>
        <FieldRow label="ชื่อ-นามสกุล ผู้ควบคุมงาน">
          <input
            value={bidResult.site_supervisor_name ?? ""}
            onChange={(e) => onBidResultChange({ site_supervisor_name: e.target.value })}
            placeholder="เช่น นายสมชาย ใจดี"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="ตำแหน่ง/สังกัด">
          <input
            value={bidResult.site_supervisor_affiliation ?? ""}
            onChange={(e) =>
              onBidResultChange({ site_supervisor_affiliation: e.target.value })
            }
            placeholder="เช่น ช่างโยธา สังกัด สพข.6"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="ชื่อ-นามสกุล วิศวกรผู้คำนวณ/คุมแบบ (ถ้ามี)">
          <input
            value={bidResult.site_engineer_name ?? ""}
            onChange={(e) => onBidResultChange({ site_engineer_name: e.target.value })}
            placeholder="เช่น นายวิศวกร ตัวอย่าง"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <ResponsibleOfficerField
          stepNumber={4}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
      </div>
    </div>
    </MissingDocHighlightContext.Provider>
  );
}

type Step6DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
};

type Step6AppealFormProps = {
  checklist: Step6Checklist;
  onChecklistChange: (key: Step6ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  appeal: Step6AppealState;
  onAppealChange: (patch: Partial<Step6AppealState>) => void;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault: string;
  note: string;
  onNoteChange: (value: string) => void;
  winnerAnnouncementDate: string;
  step5NotificationDate: string;
  step4Bidders: Step4Bidder[];
  readOnly?: boolean;
  docBinder: Step6DocBinder;
} & ChronologicalFormProps;

const CLEAR_PENDING_APPEAL_FIELDS: Partial<Step6AppealState> = {
  appeal_bidder_name: "",
  appeal_received_date: "",
  appeal_report_letter_no: "",
  appeal_head_opinion: "",
  cgd_submission_letter_no: "",
  cgd_submission_date: "",
  appeal_committee_decision: "",
  appeal_report_approval_date: "",
  appeal_consideration_status: "",
};

/** ขั้นตอนที่ 6 — อุทธรณ์ (มาตรา 117) */
export function Step6AppealForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  appeal,
  onAppealChange,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault,
  note,
  onNoteChange,
  winnerAnnouncementDate,
  step5NotificationDate,
  step4Bidders,
  readOnly = false,
  docBinder,
  chronologicalCtx,
}: Step6AppealFormProps) {
  console.log(
    "🔧 [RUNTIME ERROR FIXED] Removed undefined getFieldTooltip reference. Component rendered successfully.",
  );
  const appealStatus = appeal.appeal_status ?? "";
  const appealDeadlineISO = winnerAnnouncementDate
    ? computeAppealDeadlineISO(winnerAnnouncementDate)
    : "";
  const receivedDate =
    appeal.appeal_received_date?.trim() ||
    appeal.appeal_report_approval_date?.trim() ||
    "";
  const cgdSubmissionDate = appeal.cgd_submission_date ?? "";
  const bidderOptions = normalizeStep4Bidders(step4Bidders).filter(
    (b) => b.company_name.trim().length > 0,
  );
  const receivedBeforeStep5 =
    !!receivedDate &&
    !!step5NotificationDate &&
    isAppealReceivedBeforeStep5Notification(receivedDate, step5NotificationDate);
  const cgdSubmissionLate =
    !!receivedDate &&
    !!cgdSubmissionDate &&
    isCgdSubmissionBeyondSevenWorkdays(receivedDate, cgdSubmissionDate);
  const cgdSubmissionDeadlineISO = receivedDate
    ? computeCgdSubmissionDeadlineISO(receivedDate)
    : "";

  return (
    <div className="space-y-4 max-w-2xl">
      {appealStatus === "pending" &&
        (() => {
          console.log(
            "🚨 [APPEAL WARNING BANNER]: Displayed red block banner because appeal status is active.",
          );
          return (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 leading-relaxed"
            >
              {STEP6_APPEAL_ACTIVE_BANNER_MSG}
            </div>
          );
        })()}

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">กลุ่มที่ 1: ข้อมูลงานขั้นตอนอุทธรณ์</p>
        <ResponsibleOfficerField
          stepNumber={6}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
        <FieldRow label="หมายเหตุ">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
            placeholder="บันทึกหมายเหตุเพิ่มเติม (ถ้ามี)"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            disabled={readOnly}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle tooltipKey="step6.appeal_status">
          กลุ่มที่ 2: สถานะการอุทธรณ์ผลการจัดซื้อจัดจ้าง
        </SectionTitle>
        <fieldset disabled={readOnly} className="space-y-2 disabled:opacity-60">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="step6_appeal"
              checked={appeal.appeal_status === "none"}
              onChange={() =>
                onAppealChange({
                  appeal_status: "none",
                  ...CLEAR_PENDING_APPEAL_FIELDS,
                })
              }
              className="mt-0.5 h-4 w-4"
            />
            ไม่มีผู้ยื่นอุทธรณ์ผลการจัดซื้อจัดจ้าง
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="step6_appeal"
              checked={appeal.appeal_status === "pending"}
              onChange={() => onAppealChange({ appeal_status: "pending" })}
              className="mt-0.5 h-4 w-4"
            />
            มีผู้ยื่นอุทธรณ์ผลการจัดซื้อจัดจ้าง
          </label>
        </fieldset>

        {appeal.appeal_status === "none" && (
          <div className="space-y-4 rounded-md border border-emerald-300/40 bg-emerald-50/40 p-4">
            <FieldRow label="วันสิ้นสุดระยะอุทธรณ์">
              <div className="space-y-1">
                <input
                  type="text"
                  readOnly
                  value={
                    appealDeadlineISO
                      ? formatThaiDateSlash(appealDeadlineISO)
                      : "— กรุณาบันทึกวันที่แจ้งผลให้ผู้เสนอราคาทราบในขั้นตอนที่ 5 ก่อน —"
                  }
                  className={`${inputCls} bg-muted/50 cursor-not-allowed`}
                  aria-readonly
                />
                {appealDeadlineISO && (
                  <p className="text-xs text-muted-foreground">
                    คำนวณจากวันที่แจ้งผลให้ผู้เสนอราคาทราบ (
                    {formatThaiDateSlash(winnerAnnouncementDate)}) + 7 วันทำการ
                    ไม่นับวันหยุดราชการ
                  </p>
                )}
              </div>
            </FieldRow>
            <FieldRow label="ภาพหน้าจอตรวจสอบสถานะอุทธรณ์จากระบบ e-GP (ไม่บังคับ)">
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP6_DOC.NO_APPEAL_EGP_SCREENSHOT}
                label="📎 แนบหลักฐาน (.pdf, .png, .jpg)"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
              />
            </FieldRow>
          </div>
        )}

        {appeal.appeal_status === "pending" && (
          <div className="space-y-4 rounded-md border border-amber-300/50 bg-amber-50/50 p-4">
            <p className="text-sm font-medium text-amber-900">
              มีผู้ยื่นอุทธรณ์ — กรุณากรอกข้อมูลและแนบหลักฐานให้ครบ
            </p>

            <FieldRow
              label={
                <>
                  ชื่อผู้ประกอบการที่ยื่นอุทธรณ์ <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="appeal_bidder_name"
            >
              <select
                value={appeal.appeal_bidder_name ?? ""}
                onChange={(e) => onAppealChange({ appeal_bidder_name: e.target.value })}
                disabled={readOnly || bidderOptions.length === 0}
                className={inputCls}
              >
                <option value="">
                  {bidderOptions.length === 0
                    ? "— ไม่พบรายชื่อผู้ยื่นซองในขั้นตอนที่ 4 —"
                    : "— เลือกผู้ประกอบการ —"}
                </option>
                {bidderOptions.map((b) => (
                  <option key={b.company_name} value={b.company_name}>
                    {b.company_name}
                  </option>
                ))}
              </select>
            </FieldRow>

            <FieldRow
              label={
                <>
                  วันที่หน่วยงานได้รับหนังสืออุทธรณ์ <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="appeal_received_date"
            >
              <div className="space-y-1">
                <ChronologicalDatePicker
                  stepNumber={6}
                  chronologicalCtx={chronologicalCtx}
                  value={receivedDate}
                  onChange={(v) =>
                    onAppealChange({
                      appeal_received_date: v,
                      appeal_report_approval_date: v,
                    })
                  }
                  disabled={readOnly}
                  showChronologicalHint={false}
                  minDate={step5NotificationDate?.trim() || undefined}
                />
                {receivedDate && (
                  <p className="text-xs text-muted-foreground">
                    📅 {formatThaiDate(receivedDate)}
                  </p>
                )}
                {receivedBeforeStep5 && (
                  <p className="text-sm text-destructive font-medium">
                    {STEP6_APPEAL_RECEIVED_BEFORE_STEP5_MSG}
                  </p>
                )}
              </div>
            </FieldRow>

            <FieldRow
              label={
                <>
                  เลขที่หนังสือรายงานความเห็นเสนอหัวหน้าหน่วยงาน{" "}
                  <span className="text-destructive">*</span>
                </>
              }
              tooltipKey="step6.appeal_report_letter_no"
              complianceTarget="appeal_report_letter_no"
            >
              <input
                value={appeal.appeal_report_letter_no ?? ""}
                onChange={(e) => onAppealChange({ appeal_report_letter_no: e.target.value })}
                placeholder="เช่น กษ ๐๖๐๒ / ๔๕๖"
                className={inputCls}
                disabled={readOnly}
              />
            </FieldRow>

            <FieldRow
              label={
                <>
                  ผลการพิจารณาของหัวหน้าหน่วยงาน <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="appeal_head_opinion"
            >
              <select
                value={appeal.appeal_head_opinion ?? ""}
                onChange={(e) =>
                  onAppealChange({
                    appeal_head_opinion: e.target.value as Step6AppealState["appeal_head_opinion"],
                  })
                }
                disabled={readOnly}
                className={inputCls}
              >
                <option value="">— เลือกผลการพิจารณา —</option>
                {APPEAL_HEAD_OPINION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            <FieldRow
              label={
                <>
                  เลขที่หนังสือส่งเรื่องให้กรมบัญชีกลาง <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="cgd_submission_letter_no"
            >
              <input
                value={appeal.cgd_submission_letter_no ?? ""}
                onChange={(e) => onAppealChange({ cgd_submission_letter_no: e.target.value })}
                placeholder="เช่น กษ ๐๖๐๓ / ๑๒๓"
                className={inputCls}
                disabled={readOnly}
              />
            </FieldRow>

            <FieldRow
              label={
                <>
                  วันที่ส่งเรื่องให้กรมบัญชีกลาง <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="cgd_submission_date"
            >
              <div className="space-y-1">
                <ChronologicalDatePicker
                  stepNumber={6}
                  chronologicalCtx={chronologicalCtx}
                  value={cgdSubmissionDate}
                  onChange={(v) => onAppealChange({ cgd_submission_date: v })}
                  disabled={readOnly}
                  showChronologicalHint={false}
                  minDate={receivedDate || undefined}
                />
                {cgdSubmissionDate && (
                  <p className="text-xs text-muted-foreground">
                    📅 {formatThaiDate(cgdSubmissionDate)}
                  </p>
                )}
                {cgdSubmissionLate && cgdSubmissionDeadlineISO && (
                  <p className="text-sm text-orange-600 font-medium rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5">
                    ⚠️ วันที่ส่งเรื่องให้กรมบัญชีกลางเกิน 7 วันทำการนับจากวันรับหนังสืออุทธรณ์
                    (กำหนดสูงสุด {formatThaiDateSlash(cgdSubmissionDeadlineISO)}) —
                    แจ้งเตือนเท่านั้น ไม่บล็อกการบันทึก
                  </p>
                )}
              </div>
            </FieldRow>

            <FieldRow
              label={
                <>
                  ผลการวินิจฉัยจากคณะกรรมการพิจารณาอุทธรณ์{" "}
                  <span className="text-destructive">*</span>
                </>
              }
              complianceTarget="appeal_committee_decision"
            >
              <select
                value={appeal.appeal_committee_decision ?? ""}
                onChange={(e) =>
                  onAppealChange({
                    appeal_committee_decision:
                      e.target.value as Step6AppealState["appeal_committee_decision"],
                  })
                }
                disabled={readOnly}
                className={inputCls}
              >
                <option value="">— เลือกผลการวินิจฉัย —</option>
                {APPEAL_COMMITTEE_DECISION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {appeal.appeal_committee_decision === "upheld" && (
                <p className="text-sm text-amber-800 mt-2 font-medium">
                  อุทธรณ์ฟังขึ้น — ระบบล็อกการไปขั้นตอนถัดไปจนกว่าจะดำเนินการตามผลวินิจฉัย
                </p>
              )}
            </FieldRow>

            <FieldRow
              label={
                <>
                  หนังสืออุทธรณ์จากผู้ประกอบการ (PDF){" "}
                  <span className="text-destructive">*</span>
                </>
              }
            >
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP6_DOC.BIDDER_APPEAL_LETTER}
                label="📎 แนบหนังสืออุทธรณ์ (.pdf)"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
              />
            </FieldRow>

            <FieldRow
              label={
                <>
                  รายงานความเห็นของหน่วยงาน + หนังสือส่งกรมบัญชีกลาง (PDF){" "}
                  <span className="text-destructive">*</span>
                </>
              }
            >
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP6_DOC.AGENCY_OPINION_CGD_LETTER}
                label="📎 แนบรายงานและหนังสือส่ง กบง. (.pdf)"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
              />
            </FieldRow>

            <FieldRow label="หนังสือแจ้งผลการวินิจฉัยจากคณะกรรมการพิจารณาอุทธรณ์ (PDF)">
              <p className="text-xs text-muted-foreground mb-2">
                ไม่บังคับแนบในช่วงแรก — แนบเมื่อได้รับหนังสือจากคณะกรรมการแล้ว
              </p>
              <InlineDocUpload
                project={docBinder.project}
                stepNumber={docBinder.stepNumber}
                documentType={STEP6_DOC.COMMITTEE_DECISION_LETTER}
                label="📎 แนบหนังสือผลวินิจฉัย (.pdf)"
                existing={docBinder.docs}
                onChange={docBinder.onDocsChange}
              />
            </FieldRow>
          </div>
        )}
      </div>
    </div>
  );
}

type Step5DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
};

type Step5FormProps = {
  checklist: Step5Checklist;
  onChecklistChange: (key: Step5ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  announcement: Step5Announcement;
  onAnnouncementChange: (patch: Partial<Step5Announcement>) => void;
  /** วันที่หัวหน้าหน่วยงานลงนามอนุมัติผล — จากขั้นตอนที่ 4 (ใช้เป็น minDate) */
  evaluationApprovalDate: string;
  winningBidderName?: string;
  finalAgreedAmount?: number | null;
  winnerDataLocked?: boolean;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  docBinder: Step5DocBinder;
} & ChronologicalFormProps;

/** ขั้นตอนที่ 5 — จัดทำและประกาศผู้ชนะการเสนอราคา (มาตรา 66) */
export function Step5DetailForm({
  checklist: _checklist,
  onChecklistChange: _onChecklistChange,
  autoCheckStates: _autoCheckStates,
  readOnly,
  announcement,
  onAnnouncementChange,
  evaluationApprovalDate,
  winningBidderName = "",
  finalAgreedAmount = null,
  winnerDataLocked = false,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  docBinder,
  chronologicalCtx,
}: Step5FormProps) {
  const [announcementDateRejected, setAnnouncementDateRejected] = useState(false);
  const [notificationDateRejected, setNotificationDateRejected] = useState(false);
  const minAnnouncementDate = evaluationApprovalDate?.trim() || undefined;

  useEffect(() => {
    console.log(
      "⚖️ [LAW COMPLIANCE] Min Allowed Announcement Date Reset To:",
      minAnnouncementDate ?? "",
    );
  }, [minAnnouncementDate]);

  const winnerDate = announcement.winner_announcement_date ?? "";
  const notificationDate = announcement.winner_result_notification_date ?? "";
  const showAnnouncementDateError =
    announcementDateRejected ||
    (!!winnerDate &&
      !!minAnnouncementDate &&
      isStep5WinnerAnnouncementBeforeEvaluation(winnerDate, minAnnouncementDate));
  const notificationBeforeAnnouncement =
    !!winnerDate && !!notificationDate && notificationDate < winnerDate;
  const showNotificationDateError =
    notificationDateRejected || notificationBeforeAnnouncement;
  const announcementDateErrorMsg = minAnnouncementDate
    ? getStep5WinnerAnnouncementBeforeEvaluationMsg(minAnnouncementDate)
    : "";
  const appealDeadlineISO = notificationDate
    ? computeAppealDeadlineISO(notificationDate)
    : "";
  const contractEarliestISO = notificationDate
    ? computeContractEarliestISO(notificationDate)
    : "";
  const displayFinalAmount =
    finalAgreedAmount != null && finalAgreedAmount > 0 ? finalAgreedAmount : null;

  const handleWinnerAnnouncementDateChange = (v: string) => {
    if (!v) {
      setAnnouncementDateRejected(false);
      onAnnouncementChange({ winner_announcement_date: "" });
      return;
    }
    if (
      minAnnouncementDate &&
      isStep5WinnerAnnouncementBeforeEvaluation(v, minAnnouncementDate)
    ) {
      setAnnouncementDateRejected(true);
      toast.error(announcementDateErrorMsg);
      return;
    }
    setAnnouncementDateRejected(false);
    onAnnouncementChange({ winner_announcement_date: v });
  };

  const handleResultNotificationDateChange = (v: string) => {
    if (!v) {
      setNotificationDateRejected(false);
      onAnnouncementChange({ winner_result_notification_date: "" });
      return;
    }
    const currentAnnouncement = announcement.winner_announcement_date?.trim() ?? "";
    if (currentAnnouncement && v < currentAnnouncement) {
      setNotificationDateRejected(true);
      toast.error(STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG);
      return;
    }
    setNotificationDateRejected(false);
    onAnnouncementChange({ winner_result_notification_date: v });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          สรุปผู้ชนะจากขั้นตอนที่ 4 (ยืนยันก่อนประกาศ)
        </p>
        {winnerDataLocked && (
          <p
            className="text-xs font-medium rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 leading-relaxed"
            role="status"
          >
            {STEP4_WINNER_DATA_LOCKED_MSG}
          </p>
        )}
        <FieldRow label="ชื่อผู้ชนะการเสนอราคา">
          <input
            type="text"
            readOnly
            value={winningBidderName?.trim() || "— ยังไม่พบข้อมูลจากขั้นตอนที่ 4 —"}
            className={`${inputCls} bg-muted/50 cursor-not-allowed`}
            aria-readonly
          />
        </FieldRow>
        <FieldRow label="ราคาที่ตกลงจ้างจริง (บาท)">
          <input
            type="text"
            readOnly
            value={
              displayFinalAmount != null
                ? `${formatCurrencyDisplay(displayFinalAmount)} บาท`
                : "— ยังไม่พบข้อมูลจากขั้นตอนที่ 4 —"
            }
            className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            aria-readonly
          />
        </FieldRow>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ข้อมูลดึงจากรายงานผลการพิจารณา (ขั้นตอนที่ 4) โดยอัตโนมัติ — หากต้องการแก้ไขชื่อหรือราคา
          ให้ย้อนกลับไปแก้ที่ขั้นตอนที่ 4 เท่านั้น
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          กลุ่มที่ 1: ข้อมูลประกาศผู้ชนะในระบบ e-GP
        </p>
        <FieldRow
          label="เลขที่หนังสือ/ประกาศผลการคัดเลือก *"
          tooltipKey="step5.winner_announcement_no"
          complianceTarget="winner_announcement_no"
        >
          <input
            type="text"
            value={announcement.winner_announcement_no ?? ""}
            onChange={(e) => onAnnouncementChange({ winner_announcement_no: e.target.value })}
            placeholder="เช่น เลขที่ประกาศจากระบบ e-GP"
            className={inputCls}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow
          label="วันที่ประกาศผล *"
          tooltipKey="step5.winner_announcement_date"
          complianceTarget="winner_announcement_date"
        >
          <div className="space-y-1">
            <ChronologicalDatePicker
              stepNumber={5}
              skipChronologicalLock
              minDate={minAnnouncementDate}
              value={winnerDate}
              onChange={handleWinnerAnnouncementDateChange}
              disabled={readOnly || !minAnnouncementDate}
              onInvalidDate={() => {
                setAnnouncementDateRejected(true);
                if (announcementDateErrorMsg) toast.error(announcementDateErrorMsg);
              }}
              showChronologicalHint={false}
            />
            {winnerDate && !showAnnouncementDateError && (
              <p className="text-xs text-muted-foreground">
                📅 {formatThaiDate(winnerDate)}
              </p>
            )}
            {minAnnouncementDate ? (
              <p className="text-xs text-muted-foreground">
                เลือกได้ตั้งแต่ {formatThaiDateSlash(minAnnouncementDate)} เป็นต้นไป
                (วันที่หัวหน้าหน่วยงานอนุมัติผลการพิจารณา)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                เลือกได้ตั้งแต่วันที่หัวหน้าหน่วยงานอนุมัติผลการพิจารณาในขั้นตอนที่ 4 เป็นต้นไป
              </p>
            )}
            {showAnnouncementDateError && announcementDateErrorMsg && (
              <p className="text-xs text-destructive font-medium mt-1" role="alert">
                {announcementDateErrorMsg}
              </p>
            )}
          </div>
        </FieldRow>
        <FieldRow
          label="วันที่แจ้งผลให้ผู้เสนอราคาทราบ *"
          tooltipKey="step5.winner_result_notification_date"
          complianceTarget="winner_result_notification_date"
        >
          <div className="space-y-1">
            <ChronologicalDatePicker
              stepNumber={5}
              skipChronologicalLock
              minDate={winnerDate || undefined}
              value={notificationDate}
              onChange={handleResultNotificationDateChange}
              disabled={readOnly || !winnerDate}
              onInvalidDate={() => {
                setNotificationDateRejected(true);
                toast.error(STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG);
              }}
              showChronologicalHint={false}
            />
            {!winnerDate && (
              <p className="text-xs text-muted-foreground">กรุณาระบุวันที่ประกาศผลก่อน</p>
            )}
            {winnerDate && (
              <p className="text-xs text-muted-foreground">
                เลือกได้ตั้งแต่ {formatThaiDateSlash(winnerDate)} เป็นต้นไป (วันที่ประกาศผล)
              </p>
            )}
            {notificationDate && !showNotificationDateError && (
              <p className="text-xs text-muted-foreground">
                📅 {formatThaiDate(notificationDate)}
              </p>
            )}
            {showNotificationDateError && (
              <p className="text-xs text-destructive font-medium mt-1" role="alert">
                {notificationBeforeAnnouncement
                  ? STEP5_RESULT_NOTIFICATION_BEFORE_ANNOUNCEMENT_MSG
                  : announcementDateErrorMsg}
              </p>
            )}
          </div>
        </FieldRow>

        {appealDeadlineISO && contractEarliestISO && (
          <div
            className="rounded-md border border-orange-200/80 bg-orange-50/60 px-3 py-3 space-y-2 text-sm leading-relaxed"
            aria-live="polite"
          >
            <p className="font-medium text-foreground">
              ⏱ วันสิ้นสุดระยะอุทธรณ์: {formatThaiDateSlash(appealDeadlineISO)}
            </p>
            <p className="text-xs text-muted-foreground">
              คำนวณจากวันที่แจ้งผลให้ผู้เสนอราคาทราบ ({formatThaiDateSlash(notificationDate)})
              + 7 วันทำการ ไม่นับวันหยุดราชการ
            </p>
            <p className="text-xs font-semibold text-orange-900">
              {STEP5_CONTRACT_AFTER_APPEAL_MSG(contractEarliestISO)}
            </p>
          </div>
        )}

        <FieldRow label="ประกาศผลผู้ชนะการเสนอราคา (PDF) *" complianceTarget="egp_winner_doc">
          <p className="text-xs text-muted-foreground mb-2">
            แนบใบประกาศจากระบบ e-GP หรือฉบับที่หน่วยงานจัดทำตามแบบ สกมช.
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP5_DOC.EGP_WINNER_ANNOUNCEMENT}
            label="📎 แนบประกาศผลผู้ชนะการเสนอราคา (PDF)"
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
            readOnly={readOnly}
          />
        </FieldRow>
        <FieldRow label="ภาพถ่ายบอร์ดประชาสัมพันธ์ปิดประกาศผล *" complianceTarget="physical_board_doc">
          <p className="text-xs text-muted-foreground mb-2">
            แนบภาพถ่ายบอร์ดประชาสัมพันธ์ที่ปิดประกาศผลผู้ชนะ ณ ที่ทำการหน่วยงาน
          </p>
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP5_DOC.PHYSICAL_BOARD_ANNOUNCEMENT}
            label="📎 แนบภาพถ่ายบอร์ดประชาสัมพันธ์หน่วยงาน"
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
            readOnly={readOnly}
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          กลุ่มที่ 2: หลักฐานแจ้งผลผู้เสนอราคา (ไม่บังคับ)
        </p>
        <FieldRow label="หลักฐานการแจ้งผลให้ผู้เสนอราคาทราบ (ไม่บังคับ)">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP5_DOC.ALL_BIDDERS_RESULT_NOTICE}
            label={STEP5_ALL_BIDDERS_RESULT_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
            readOnly={readOnly}
          />
          <p className="text-xs text-muted-foreground mt-1">
            แนบสำเนาหนังสือแจ้งผลการคัดเลือก หรือหลักฐานการส่งหนังสือ/อีเมลจาก e-GP
          </p>
        </FieldRow>
        <ResponsibleOfficerField
          stepNumber={5}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
      </div>
    </div>
  );
}

/** Smart Checklist มาตรฐาน — ขั้นตอนที่ 7–10 (ใช้ภายใน GenericStepDetailForm) */
function GenericStepChecklistPanel({
  stepNumber,
  manualChecklist = {},
  onManualChange,
  autoCheckStates = {},
  readOnly,
  docBinder,
}: {
  stepNumber: number;
  manualChecklist?: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  autoCheckStates?: Record<string, boolean>;
  readOnly?: boolean;
  docBinder?: SmartChecklistDocBinder;
}) {
  const items = getSmartChecklistItems(stepNumber);
  if (items.length === 0) return null;
  return (
    <SmartChecklist
      stepNumber={stepNumber}
      stepLabel={getSmartChecklistStepLabel(stepNumber)}
      items={items}
      manualChecklist={manualChecklist}
      autoStates={autoCheckStates}
      onManualChange={onManualChange}
      readOnly={readOnly}
      docBinder={docBinder}
    />
  );
}

/** Smart Checklist ขั้นตอนที่ 10 — ถูกแทนที่ด้วยฟอร์มรายงวด (ไม่ใช้แล้ว) */type GenericStepDetailFormProps = {
  stepNumber: number;
  manualChecklist: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  docBinder: SmartChecklistDocBinder;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  dueTooEarly?: boolean;
  dueTooLateContract?: boolean;
  minDeadline?: string;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  note: string;
  onNoteChange: (value: string) => void;
  project: ProjectDocRef;
  docList: DocItem[];
  docsForStep: StepDocRecord[];
  onDocsChange: () => void;
  projectName: string;
} & ChronologicalFormProps;

type Step7ContractNoticeFormProps = {
  contractNotice: Step7ContractNotice;
  onContractNoticeChange: (patch: Partial<Step7ContractNotice>) => void;
  winningBidderName: string;
  winningProjectAmount: number | null;
  appealDeadlineISO: string;
  notificationDeadlineISO: string;
  letterDateTooLate?: boolean;
  readOnly?: boolean;
  docBinder: SmartChecklistDocBinder;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  note: string;
  onNoteChange: (value: string) => void;
} & ChronologicalFormProps;

/** ขั้นตอนที่ 7 — แจ้งให้ผู้ชนะมาลงนามในสัญญา (ข้อ 161) */
export function Step7ContractNoticeForm({
  contractNotice,
  onContractNoticeChange,
  winningBidderName,
  winningProjectAmount,
  appealDeadlineISO,
  notificationDeadlineISO,
  letterDateTooLate,
  readOnly,
  docBinder,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  note,
  onNoteChange,
  chronologicalCtx,
}: Step7ContractNoticeFormProps) {
  console.log(
    "🛠️ [STEP 7 MASTER SEED]: Checklist removed. Infographic UI rendered. Chrono Validation Active.",
  );

  const [receivedDateRejected, setReceivedDateRejected] = useState(false);

  const contractNoticeLetterDate = contractNotice?.contract_notice_letter_date ?? "";
  const contractorReceivedDate = contractNotice?.contractor_received_date ?? "";
  const signingDeadline = contractNotice?.contract_signing_deadline ?? "";
  const minLetterDateISO = appealDeadlineISO
    ? computeContractEarliestFromAppealDeadlineISO(appealDeadlineISO)
    : "";

  const isChronoValid = isStep7ContractorReceivedDateChronoValid(
    contractNoticeLetterDate,
    contractorReceivedDate,
  );
  const showReceivedChronoError =
    receivedDateRejected ||
    (!!contractNoticeLetterDate &&
      !!contractorReceivedDate &&
      contractorReceivedDate < contractNoticeLetterDate);

  console.log("⏳ [STEP 7 CHRONO VALIDATION]:", {
    letterDate: contractNoticeLetterDate,
    receivedDate: contractorReceivedDate,
    isValid: isChronoValid,
  });

  const handleLetterDateChange = (v: string) => {
    onContractNoticeChange({ contract_notice_letter_date: v });
    if (v && contractorReceivedDate && contractorReceivedDate < v) {
      setReceivedDateRejected(true);
      toast.error(STEP7_RECEIVED_BEFORE_LETTER_MSG);
    } else {
      setReceivedDateRejected(false);
    }
  };

  const handleContractorReceivedDateChange = (v: string) => {
    if (!v) {
      setReceivedDateRejected(false);
      onContractNoticeChange({ contractor_received_date: "" });
      return;
    }
    const chronoValid = isStep7ContractorReceivedDateChronoValid(contractNoticeLetterDate, v);
    console.log("⏳ [STEP 7 CHRONO VALIDATION]:", {
      letterDate: contractNoticeLetterDate,
      receivedDate: v,
      isValid: chronoValid,
    });
    if (contractNoticeLetterDate && v < contractNoticeLetterDate) {
      setReceivedDateRejected(true);
      toast.error(STEP7_RECEIVED_BEFORE_LETTER_MSG);
      return;
    }
    setReceivedDateRejected(false);
    const autoDeadline = computeStep7ContractSigningDeadlineISO(v);
    onContractNoticeChange({
      contractor_received_date: v,
      contract_signing_deadline: autoDeadline,
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          สรุปผู้ชนะจากขั้นตอนก่อนหน้า (อ่านอย่างเดียว)
        </p>
        <FieldRow label="ชื่อผู้ชนะการเสนอราคา">
          <input
            type="text"
            readOnly
            value={winningBidderName?.trim() || "— ยังไม่พบข้อมูลจากขั้นตอนก่อนหน้า —"}
            className={`${inputCls} bg-muted/50 cursor-not-allowed`}
            aria-readonly
          />
        </FieldRow>
        <FieldRow label="มูลค่าโครงการที่ชนะ (บาท)">
          <input
            type="text"
            readOnly
            value={
              winningProjectAmount != null
                ? `${formatCurrencyDisplay(winningProjectAmount)} บาท`
                : "— ยังไม่พบข้อมูลจากขั้นตอนก่อนหน้า —"
            }
            className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            aria-readonly
          />
        </FieldRow>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ข้อมูลดึงจากขั้นตอนที่ 4–5 โดยอัตโนมัติ — หากต้องการแก้ไข ให้ย้อนกลับไปแก้ที่ขั้นตอนก่อนหน้า
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
        <p className="text-sm font-medium text-foreground">
          ข้อมูลหนังสือเชิญลงนามในสัญญา — ขั้นตอนที่ 7
        </p>

        <div className="space-y-4">
          <FieldRow
            label="เลขที่หนังสือเชิญลงนามในสัญญา *"
            tooltipKey="step7.contract_notice_letter_no"
            complianceTarget="contract_notice_letter_no"
          >
            <input
              type="text"
              value={contractNotice?.contract_notice_letter_no ?? ""}
              onChange={(e) =>
                onContractNoticeChange({ contract_notice_letter_no: e.target.value })
              }
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น อว 1234.5/ว 1234"
            />
          </FieldRow>
          <FieldRow
            label="วันที่ในหนังสือเชิญลงนาม *"
            tooltipKey="step7.contract_notice_letter_date"
            complianceTarget="contract_notice_letter_date"
          >
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={7}
                chronologicalCtx={chronologicalCtx}
                minDate={minLetterDateISO}
                value={contractNoticeLetterDate}
                onChange={handleLetterDateChange}
                disabled={readOnly}
                onInvalidDate={() =>
                  toast.error(
                    minLetterDateISO
                      ? `วันที่ในหนังสือเชิญลงนามต้องไม่ก่อนวันพ้นกำหนดอุทธรณ์ (${formatThaiDateSlash(minLetterDateISO)})`
                      : "วันที่ในหนังสือเชิญลงนามไม่ถูกต้อง",
                  )
                }
                showChronologicalHint={false}
              />
              {contractNoticeLetterDate && (
                <p className="text-xs text-muted-foreground">
                  📅 {formatThaiDate(contractNoticeLetterDate)}
                </p>
              )}
              {minLetterDateISO && (
                <p className="text-xs text-muted-foreground">
                  เลือกได้ตั้งแต่ {formatThaiDateSlash(minLetterDateISO)} (หลังพ้นกำหนดอุทธรณ์)
                </p>
              )}
              {letterDateTooLate && notificationDeadlineISO && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {STEP7_NOTIFICATION_DEADLINE_EXCEEDED_MSG(notificationDeadlineISO)}
                </p>
              )}
            </div>
          </FieldRow>
          <FieldRow
            label="วันที่ผู้ประกอบการได้รับหนังสือเชิญ *"
            complianceTarget="contractor_received_date"
          >
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={7}
                chronologicalCtx={chronologicalCtx}
                minDate={contractNoticeLetterDate || undefined}
                additionalMinDates={[contractNoticeLetterDate]}
                value={contractorReceivedDate}
                onChange={handleContractorReceivedDateChange}
                onInvalidDate={() => {
                  setReceivedDateRejected(true);
                  toast.error(STEP7_RECEIVED_BEFORE_LETTER_MSG);
                }}
                disabled={readOnly || !contractNoticeLetterDate}
                showChronologicalHint={false}
                className={
                  showReceivedChronoError
                    ? `${inputCls} border-destructive focus:ring-destructive`
                    : inputCls
                }
              />
              {!contractNoticeLetterDate && (
                <p className="text-xs text-muted-foreground">
                  กรุณาระบุวันที่ในหนังสือเชิญลงนามก่อน
                </p>
              )}
              {contractNoticeLetterDate && (
                <p className="text-xs text-muted-foreground">
                  เลือกได้ตั้งแต่ {formatThaiDateSlash(contractNoticeLetterDate)} (วันที่ออกหนังสือเชิญชวน)
                </p>
              )}
              {contractorReceivedDate && !showReceivedChronoError && (
                <p className="text-xs text-muted-foreground">
                  📅 {formatThaiDate(contractorReceivedDate)}
                </p>
              )}
              {showReceivedChronoError && (
                <p className="text-xs text-destructive font-semibold mt-1" role="alert">
                  {STEP7_RECEIVED_BEFORE_LETTER_MSG}
                </p>
              )}
            </div>
          </FieldRow>
          <FieldRow
            label="กำหนดวันสุดท้ายที่ต้องมาลงนาม *"
            complianceTarget="contract_signing_deadline"
          >
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={7}
                chronologicalCtx={chronologicalCtx}
                value={signingDeadline}
                onChange={(v) => onContractNoticeChange({ contract_signing_deadline: v })}
                disabled={readOnly}
                showChronologicalHint={false}
              />
              {signingDeadline && (
                <p className="text-xs text-muted-foreground">
                  📅 {formatThaiDate(signingDeadline)}
                </p>
              )}
              {contractorReceivedDate && (
                <p className="text-xs text-muted-foreground">
                  ระบบคำนวณอัตโนมัติ +{STEP7_CONTRACT_SIGNING_DEADLINE_WORKDAYS} วันทำการจากวันที่ได้รับหนังสือเชิญ
                  — แก้ไขได้ด้วยตนเองในกรณีโครงการเร่งด่วน
                </p>
              )}
            </div>
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            เอกสารหลักฐาน
          </p>
          <FieldRow label="หนังสือแจ้งให้มาลงนามในสัญญา *">
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP7_DOC.CONTRACT_NOTICE_LETTER}
              label={STEP7_CONTRACT_NOTICE_LETTER_UPLOAD_LABEL}
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
            />
          </FieldRow>
          <FieldRow label="หลักฐานการส่ง/ใบตอบรับไปรษณีย์">
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP7_DOC.CONTRACT_NOTICE_DELIVERY_PROOF}
              label={STEP7_CONTRACT_NOTICE_DELIVERY_PROOF_UPLOAD_LABEL}
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
            />
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <ResponsibleOfficerField
            stepNumber={7}
            value={responsibleName}
            onChange={onResponsibleNameChange}
            step1Default={step1ResponsibleDefault}
          />
          <FieldRow label="หมายเหตุ">
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={4}
              disabled={readOnly}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

type Step8ContractGuaranteeFormProps = {
  contractExecution: Step8ContractExecution;
  /** ราคาที่ตกลงซื้อหรือจ้างจริงจากขั้นตอนที่ 4 — ใช้เป็นค่าเริ่มต้นเมื่อยังไม่มีมูลค่าสัญญา */
  defaultContractAmountFromStep4?: number | null;
  onContractExecutionChange: (patch: Partial<Step8ContractExecution>) => void;
  winningBidderName: string;
  winningContractAmount: number | null;
  step7SigningDeadlineISO: string;
  earliestSigningISO: string;
  appealDeadlineISO: string;
  readOnly?: boolean;
  docBinder: SmartChecklistDocBinder;
} & ChronologicalFormProps;

/** ขั้นตอนที่ 8 — ตรวจสอบหลักประกันและลงนามในสัญญา */
export function Step8ContractGuaranteeForm({
  contractExecution,
  defaultContractAmountFromStep4 = null,
  onContractExecutionChange,
  winningBidderName,
  winningContractAmount,
  step7SigningDeadlineISO,
  earliestSigningISO,
  appealDeadlineISO,
  readOnly,
  docBinder,
  chronologicalCtx,
}: Step8ContractGuaranteeFormProps) {
  console.log(
    "🛡️ [ขั้นตอนที่ 8 สตง. COMPLIANT]: Terminologies, Stamp Duty Warnings, Security Calc, and Date Validation Locks deployed successfully.",
  );

  const signedDate = contractExecution?.contract_signed_date ?? "";
  const storedContractAmount = contractExecution?.contract_amount;
  const effectiveContractAmount =
    storedContractAmount != null && storedContractAmount > 0
      ? storedContractAmount
      : winningContractAmount != null && winningContractAmount > 0
        ? winningContractAmount
        : defaultContractAmountFromStep4 != null && defaultContractAmountFromStep4 > 0
          ? defaultContractAmountFromStep4
          : null;
  const recommendedGuarantee = computeRecommendedGuaranteeAmount(effectiveContractAmount);
  const guaranteeAmount = contractExecution?.guarantee_amount ?? null;
  const showGuaranteeWarning = isStep8GuaranteeBelowMinimum(
    guaranteeAmount,
    effectiveContractAmount,
  );
  const showDeadlineHardBlock = isStep8SignedOutsideAllowedRange(
    signedDate,
    earliestSigningISO,
    step7SigningDeadlineISO,
  );
  const uploadedDocTypes = docBinder.docs.map((d) => d.document_type);
  const hasSignedContractDoc = hasStep8SignedContractDoc(uploadedDocTypes);
  const hasGuaranteeDoc = hasStep8GuaranteeVerificationDoc(uploadedDocTypes);

  useEffect(() => {
    if (readOnly) return;
    if (storedContractAmount != null && storedContractAmount > 0) return;
    const seed =
      winningContractAmount != null && winningContractAmount > 0
        ? winningContractAmount
        : defaultContractAmountFromStep4;
    if (seed == null || seed <= 0) return;
    onContractExecutionChange({ contract_amount: seed });
  }, [
    readOnly,
    storedContractAmount,
    winningContractAmount,
    defaultContractAmountFromStep4,
    onContractExecutionChange,
  ]);

  return (
    <div className="space-y-4 max-w-2xl">
      {showDeadlineHardBlock && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 leading-relaxed"
        >
          {STEP8_SIGNED_OUTSIDE_RANGE_MSG}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          ข้อมูลคู่สัญญาจากขั้นตอนก่อนหน้า (อ่านอย่างเดียว)
        </p>
        <FieldRow label="ชื่อผู้เสนอราคาที่ชนะการเสนอราคา">
          <input
            type="text"
            readOnly
            value={winningBidderName?.trim() || "— ยังไม่พบข้อมูลจากขั้นตอนก่อนหน้า —"}
            className={`${inputCls} bg-muted/50 cursor-not-allowed`}
            aria-readonly
          />
        </FieldRow>
        <FieldRow label="วงเงินราคาที่ตกลงซื้อจ้าง (บาท)">
          <input
            type="text"
            readOnly
            value={
              effectiveContractAmount != null
                ? `${formatCurrencyDisplay(effectiveContractAmount)} บาท`
                : "— ยังไม่พบข้อมูลจากขั้นตอนก่อนหน้า —"
            }
            className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            aria-readonly
          />
        </FieldRow>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ข้อมูลดึงจากขั้นตอนที่ 4–5 โดยอัตโนมัติ — กรอบเวลาลงนามดูได้จากไทม์ไลน์ด้านบน
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
        <p className="text-sm font-medium text-foreground">{STEP8_FORM_HEADER}</p>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            ระบบคำนวณหลักประกันสัญญา
          </p>
          <FieldRow label="ประเภทหลักประกัน *">
            <select
              value={contractExecution?.guarantee_type ?? ""}
              onChange={(e) =>
                onContractExecutionChange({
                  guarantee_type: e.target.value as Step8GuaranteeType,
                })
              }
              disabled={readOnly}
              className={inputCls}
            >
              <option value="">— เลือกประเภทหลักประกัน —</option>
              {STEP8_GUARANTEE_TYPE_UI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="มูลค่าหลักประกันสัญญา (บาท) *">
            <div className="space-y-2">
              <CurrencyInput
                value={guaranteeAmount}
                onChange={(amount) =>
                  onContractExecutionChange({
                    guarantee_amount:
                      amount != null && amount > 0 ? amount : null,
                  })
                }
                readOnly={readOnly}
                className={inputCls}
                showFormattedHint
              />
              {recommendedGuarantee != null && (
                <p className="text-xs text-muted-foreground">
                  ยอดขั้นต่ำตามระเบียบ (5%): {formatBaht(recommendedGuarantee)} บาท
                </p>
              )}
              {showGuaranteeWarning && (
                <div
                  role="alert"
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 leading-relaxed"
                >
                  {STEP8_GUARANTEE_BELOW_MINIMUM_MSG}
                </div>
              )}
            </div>
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            ตรวจจับวันลงนามสัญญา
          </p>
          <FieldRow label="วันที่ลงนามสัญญาจริง *" tooltipKey="step8.contract_signed_date">
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={8}
                chronologicalCtx={chronologicalCtx}
                skipChronologicalLock
                minDate={earliestSigningISO || undefined}
                maxDate={step7SigningDeadlineISO || undefined}
                additionalMinDates={[earliestSigningISO]}
                value={signedDate}
                onChange={(v) => onContractExecutionChange({ contract_signed_date: v })}
                disabled={readOnly}
                onInvalidDate={() => {
                  if (
                    earliestSigningISO &&
                    step7SigningDeadlineISO
                  ) {
                    toast.error(
                      `วันที่ลงนามสัญญาจริงต้องอยู่ระหว่าง ${formatThaiDateSlash(earliestSigningISO)} ถึง ${formatThaiDateSlash(step7SigningDeadlineISO)}`,
                    );
                  } else {
                    toast.error("วันที่ลงนามในสัญญาไม่ถูกต้อง");
                  }
                }}
                showChronologicalHint={false}
              />
              {signedDate && (
                <p className="text-xs text-muted-foreground">📅 {formatThaiDate(signedDate)}</p>
              )}
              {earliestSigningISO && step7SigningDeadlineISO && (
                <p className="text-xs text-muted-foreground">
                  ล็อกช่วงวันที่: {formatThaiDateSlash(earliestSigningISO)} ถึง{" "}
                  {formatThaiDateSlash(step7SigningDeadlineISO)}
                </p>
              )}
              {earliestSigningISO && !step7SigningDeadlineISO && (
                <p className="text-xs text-muted-foreground">
                  เลือกได้ตั้งแต่ {formatThaiDateSlash(earliestSigningISO)} เป็นต้นไป
                  {appealDeadlineISO && (
                    <span>
                      {" "}
                      (หลังวันสิ้นสุดอุทธรณ์ {formatThaiDateSlash(appealDeadlineISO)})
                    </span>
                  )}
                </p>
              )}
            </div>
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            หลักฐานการลงนามและหลักประกัน (บังคับ)
          </p>
          <FieldRow label="ร่างสัญญาฉบับลงนามแล้ว (PDF) *">
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP8_DOC.SIGNED_CONTRACT}
              label="📎 อัปโหลดร่างสัญญาฉบับลงนามแล้ว (PDF)"
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
            />
            {hasSignedContractDoc && (
              <p className="text-xs text-emerald-700 mt-1">✓ อัปโหลดร่างสัญญาฉบับลงนามแล้ว</p>
            )}
          </FieldRow>
          <FieldRow label="ไฟล์หลักประกันสัญญา (PDF) *">
            <InlineDocUpload
              project={docBinder.project}
              stepNumber={docBinder.stepNumber}
              documentType={STEP8_DOC.GUARANTEE_VERIFICATION}
              label="📎 อัปโหลดไฟล์หลักประกันสัญญา (PDF)"
              existing={docBinder.docs}
              onChange={docBinder.onDocsChange}
            />
            {hasGuaranteeDoc && (
              <p className="text-xs text-emerald-700 mt-1">✓ อัปโหลดไฟล์หลักประกันสัญญาแล้ว</p>
            )}
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

type Step9DetailFormProps = {
  manualChecklist: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  contractSchedule: Step9ContractSchedule;
  onContractScheduleChange: (patch: Partial<Step9ContractSchedule>) => void;
  readOnly?: boolean;
  docBinder: SmartChecklistDocBinder;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  note: string;
  onNoteChange: (value: string) => void;
  project: ProjectDocRef;
  docList: DocItem[];
  docsForStep: StepDocRecord[];
  onDocsChange: () => void;
  projectName: string;
  /** วันที่ลงนามในสัญญา (ขั้น 8) — ใช้เป็น minDate ของวันเริ่มปฏิบัติงาน */
  contractSignedDate?: string;
  /** รูปแบบจัดซื้อจาก Step 1 — ใช้แสดงกล่องพิเศษเมื่อ external */
  procurementPath?: ProcurementPath | string | null;
  projectProfile: Step1ProjectProfile;
  onProjectProfileChange: (patch: Partial<Step1ProjectProfile>) => void;
  medianPrice: Step2MedianPrice;
  onMedianPriceChange: (patch: Partial<Step2MedianPrice>) => void;
  bidResult: Step4BidResult;
  onBidResultChange: (patch: Partial<Step4BidResult>) => void;
  step1Budget?: number;
} & ChronologicalFormProps;

export function Step9ExternalContractCapturePanel({
  readOnly,
  projectProfile,
  onProjectProfileChange,
  medianPrice,
  onMedianPriceChange,
  bidResult,
  onBidResultChange,
  step1Budget = 0,
}: {
  readOnly?: boolean;
  projectProfile: Step1ProjectProfile;
  onProjectProfileChange: (patch: Partial<Step1ProjectProfile>) => void;
  medianPrice: Step2MedianPrice;
  onMedianPriceChange: (patch: Partial<Step2MedianPrice>) => void;
  bidResult: Step4BidResult;
  onBidResultChange: (patch: Partial<Step4BidResult>) => void;
  step1Budget?: number;
}) {
  return (
    <div className="rounded-xl border-4 border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 shadow-xl ring-4 ring-amber-300/50 dark:ring-amber-700/40 p-6 space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-amber-500 px-4 py-3.5 text-white shadow-md">
        <span className="text-2xl leading-none shrink-0" aria-hidden>
          📝
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-snug">
            บันทึกข้อมูลสัญญาจัดจ้างจากส่วนกลาง/สพข.
          </p>
          <p className="text-sm font-medium text-amber-50 mt-1">
            สำหรับกรณีหน่วยงานอื่นจัดซื้อจ้างให้ — กรอกครบทุกช่องด้านล่างก่อนไป Step 10
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border-2 border-amber-400/70 bg-white/90 dark:bg-background/80 p-4">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            1
          </span>
          กลุ่มพิกัดและที่อยู่
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="ชื่อบ้าน/หมู่บ้าน">
            <input
              value={projectProfile.site_village}
              onChange={(e) => onProjectProfileChange({ site_village: e.target.value })}
              placeholder="เช่น บ้านหนองปลามัน"
              disabled={readOnly}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="หมู่ที่">
            <input
              type="number"
              min={1}
              value={projectProfile.site_moo ?? ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                onProjectProfileChange({ site_moo: raw ? Number(raw) : null });
              }}
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น 5"
            />
          </FieldRow>
          <FieldRow label="ตำบล">
            <input
              value={projectProfile.site_subdistrict}
              onChange={(e) => onProjectProfileChange({ site_subdistrict: e.target.value })}
              disabled={readOnly}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="อำเภอ">
            <input
              value={projectProfile.site_district}
              onChange={(e) => onProjectProfileChange({ site_district: e.target.value })}
              disabled={readOnly}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="จังหวัด">
            <ProvinceSearchSelect
              value={projectProfile.site_province}
              onChange={(v) => onProjectProfileChange({ site_province: v })}
              disabled={readOnly}
            />
          </FieldRow>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border-2 border-amber-400/70 bg-white/90 dark:bg-background/80 p-4">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            2
          </span>
          กลุ่มประเภทงานและหน่วยวัด
        </p>
        <FieldRow label="ประเภทกิจกรรม/งาน">
          <input
            value={projectProfile.activity_type}
            onChange={(e) => onProjectProfileChange({ activity_type: e.target.value })}
            placeholder="เช่น การป้องกันและลดการชะล้างพังทลายของดิน..."
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="หน่วยวัดผลสัมฤทธิ์ของงาน">
          <ResultUnitSelect
            value={projectProfile.result_unit}
            onChange={(result_unit) => onProjectProfileChange({ result_unit })}
            disabled={readOnly}
            inputClassName={inputCls}
          />
        </FieldRow>
      </div>

      <div className="space-y-4 rounded-lg border-2 border-amber-400/70 bg-white/90 dark:bg-background/80 p-4">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            3
          </span>
          กลุ่มข้อมูลการเงิน
        </p>
        <FieldRow label="วงเงินงบประมาณที่ได้รับจัดสรร (บาท)">
          <CurrencyInput
            value={
              medianPrice.allocated_budget ??
              (step1Budget > 0 ? step1Budget : null)
            }
            onChange={(allocated_budget) => onMedianPriceChange({ allocated_budget })}
            readOnly={readOnly}
            className={inputCls}
            showFormattedHint
          />
        </FieldRow>
        <FieldRow label="มูลค่าราคากลาง (บาท)">
          <CurrencyInput
            value={medianPrice.approved_median_price}
            onChange={(approved_median_price) =>
              onMedianPriceChange({ approved_median_price })
            }
            readOnly={readOnly}
            className={inputCls}
            showFormattedHint
          />
        </FieldRow>
        <FieldRow label="ราคาประมูลตามสัญญาจ้างจริง (บาท)">
          <CurrencyInput
            value={bidResult.final_agreed_amount ?? null}
            onChange={(final_agreed_amount) => onBidResultChange({ final_agreed_amount })}
            readOnly={readOnly}
            className={inputCls}
            showFormattedHint
          />
        </FieldRow>
      </div>

      <div className="space-y-4 rounded-lg border-2 border-amber-400/70 bg-white/90 dark:bg-background/80 p-4">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            4
          </span>
          กลุ่มข้อมูลคำสั่งแต่งตั้ง
        </p>
        <FieldRow label="ชื่อ-นามสกุล ผู้ควบคุมงาน">
          <input
            value={bidResult.site_supervisor_name ?? ""}
            onChange={(e) => onBidResultChange({ site_supervisor_name: e.target.value })}
            placeholder="เช่น นายสมชาย ใจดี"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="ตำแหน่ง/สังกัด">
          <input
            value={bidResult.site_supervisor_affiliation ?? ""}
            onChange={(e) =>
              onBidResultChange({ site_supervisor_affiliation: e.target.value })
            }
            placeholder="เช่น ช่างโยธา สังกัด สพข.6"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="ชื่อวิศวกรผู้รับผิดชอบ">
          <input
            value={bidResult.site_engineer_name ?? ""}
            onChange={(e) => onBidResultChange({ site_engineer_name: e.target.value })}
            placeholder="เช่น นายวิศวกร รับผิดชอบ"
            disabled={readOnly}
            className={inputCls}
          />
        </FieldRow>
      </div>
    </div>
  );
}

/** ขั้นตอนที่ 9 — บันทึกสาระสำคัญสัญญา (Smart ระยะเวลา/งวดงาน) */
export function Step9DetailForm({
  manualChecklist,
  onManualChange,
  autoCheckStates,
  contractSchedule,
  onContractScheduleChange,
  readOnly,
  docBinder,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  note,
  onNoteChange,
  project,
  docList,
  docsForStep,
  onDocsChange,
  projectName,
  contractSignedDate = "",
  procurementPath,
  projectProfile,
  onProjectProfileChange,
  medianPrice,
  onMedianPriceChange,
  bidResult,
  onBidResultChange,
  step1Budget = 0,
  chronologicalCtx,
}: Step9DetailFormProps) {
  const schedule = contractSchedule ?? { ...EMPTY_STEP9_CONTRACT_SCHEDULE };
  const signedISO = contractSignedDate?.trim() || "";
  const workStart = schedule.work_start_date?.trim() || schedule.notice_to_proceed_date?.trim() || "";
  const workStartInvalid =
    !!signedISO && !!workStart && isISODateBefore(workStart, signedISO);
  const contractEndISO = computeStep9ContractEndDateISO(
    workStartInvalid ? "" : workStart,
    schedule.contract_duration_days,
  );
  const durationDisplay =
    schedule.contract_duration_days != null && schedule.contract_duration_days > 0
      ? String(schedule.contract_duration_days)
      : "";
  const installmentDisplay =
    schedule.total_installment_count != null && schedule.total_installment_count > 0
      ? String(schedule.total_installment_count)
      : "";
  const egpPublication = schedule.egp_essential_publication_date?.trim() || "";
  const egpDeadlineISO = signedISO ? computeStep9EgpDeadlineISO(signedISO) : null;
  const egpPublicationTooLate =
    !!signedISO &&
    !!egpPublication &&
    isStep9EgpPublicationTooLate(egpPublication, signedISO);
  const [egpPublicationRejected, setEgpPublicationRejected] = useState(false);

  useEffect(() => {
    if (!signedISO || readOnly) return;
    const current =
      schedule.work_start_date?.trim() || schedule.notice_to_proceed_date?.trim() || "";
    if (!current || !isISODateBefore(current, signedISO)) return;
    onContractScheduleChange(
      sanitizeStep9WorkStartAgainstSignedDate(schedule, signedISO),
    );
  }, [
    signedISO,
    readOnly,
    schedule.work_start_date,
    schedule.notice_to_proceed_date,
    onContractScheduleChange,
    schedule,
  ]);

  const patchWorkStart = (iso: string) => {
    if (signedISO && iso && isISODateBefore(iso, signedISO)) return;
    onContractScheduleChange(syncStep9WorkStartDate(schedule, iso));
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <GenericStepChecklistPanel
        stepNumber={9}
        manualChecklist={manualChecklist}
        onManualChange={onManualChange}
        autoCheckStates={autoCheckStates}
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-5">
        <p className="text-sm font-medium text-foreground">{STEP9_FORM_HEADER}</p>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            กลุ่มที่ 1: ข้อมูลเชื่อมโยงระบบ e-GP
          </p>
          <FieldRow
            label="วันที่ประกาศสาระสำคัญสัญญาใน e-GP"
            tooltipKey="step9.egp_essential_publication_date"
          >
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={9}
                chronologicalCtx={chronologicalCtx}
                additionalMinDates={[signedISO]}
                value={egpPublication}
                onChange={(v) => {
                  if (
                    signedISO &&
                    v &&
                    isStep9EgpPublicationTooLate(v, signedISO)
                  ) {
                    setEgpPublicationRejected(true);
                    if (egpDeadlineISO) {
                      toast.error(getStep9EgpPublicationTooLateMsg(egpDeadlineISO));
                    }
                    return;
                  }
                  setEgpPublicationRejected(false);
                  onContractScheduleChange({ egp_essential_publication_date: v });
                }}
                maxDate={egpDeadlineISO || undefined}
                disabled={readOnly || !signedISO}
                onInvalidDate={() => {
                  setEgpPublicationRejected(true);
                  if (egpDeadlineISO) {
                    toast.error(getStep9EgpPublicationTooLateMsg(egpDeadlineISO));
                  }
                }}
                showChronologicalHint={false}
              />
              {!signedISO && (
                <p className="text-xs text-destructive">
                  กรุณาบันทึกวันที่ลงนามในสัญญาในขั้นตอนที่ 8 ก่อน
                </p>
              )}
              {signedISO && egpDeadlineISO && (
                <p className="text-xs text-muted-foreground">
                  เลือกได้ตั้งแต่ {formatThaiDateSlash(signedISO)} ถึง{" "}
                  {formatThaiDateSlash(egpDeadlineISO)} ({STEP9_EGP_DEADLINE_CALENDAR_DAYS}{" "}
                  วันปฏิทินนับจากวันลงนาม)
                </p>
              )}
              {egpPublication && !egpPublicationTooLate && !egpPublicationRejected && (
                <p className="text-xs text-muted-foreground">
                  📅 {formatThaiDate(egpPublication)}
                </p>
              )}
              {(egpPublicationTooLate || egpPublicationRejected) && egpDeadlineISO && (
                <p className="text-xs text-destructive font-medium">
                  {getStep9EgpPublicationTooLateMsg(egpDeadlineISO)}
                </p>
              )}
            </div>
          </FieldRow>
          <FieldRow
            label="เลขคุมสัญญาจากระบบ e-GP"
            tooltipKey="step9.egp_contract_control_no"
          >
            <input
              type="text"
              value={schedule.egp_contract_control_no ?? ""}
              onChange={(e) =>
                onContractScheduleChange({ egp_contract_control_no: e.target.value })
              }
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น C6805001234"
            />
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            กลุ่มที่ 2: ข้อมูลระยะเวลาและงวดงาน
          </p>
          <FieldRow
            label="ระยะเวลาทำงานตามสัญญา (วัน)"
            tooltipKey="step9.contract_duration_days"
          >
            <input
              type="number"
              min={1}
              step={1}
              value={durationDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                onContractScheduleChange({
                  contract_duration_days: raw ? Number(raw) : null,
                });
              }}
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น 120"
            />
          </FieldRow>
          <FieldRow
            label="จำนวนงวดงานทั้งหมด"
            tooltipKey="step9.total_installment_count"
          >
            <input
              type="number"
              min={1}
              step={1}
              value={installmentDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                onContractScheduleChange({
                  total_installment_count: raw ? Number(raw) : null,
                });
              }}
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น 3, 5, 10"
            />
          </FieldRow>
          <FieldRow label="วันที่เริ่มปฏิบัติงานหน้างาน">
            <div className="space-y-1">
              <ChronologicalDatePicker
                stepNumber={9}
                chronologicalCtx={chronologicalCtx}
                additionalMinDates={[signedISO]}
                value={workStartInvalid ? "" : workStart}
                onChange={patchWorkStart}
                disabled={readOnly || !signedISO}
                onInvalidDate={() =>
                  toast.error(
                    signedISO
                      ? `ห้ามเริ่มปฏิบัติงานก่อนวันลงนามสัญญา — เลือกได้ตั้งแต่ ${formatThaiDateSlash(signedISO)} เป็นต้นไป`
                      : "กรุณาบันทึกวันที่ลงนามในสัญญา (ขั้นตอนที่ 8) ก่อน",
                  )
                }
                showChronologicalHint={false}
              />
              {!signedISO && (
                <p className="text-xs text-destructive">
                  กรุณาบันทึกวันที่ลงนามในสัญญาในขั้นตอนที่ 8 ก่อนระบุวันเริ่มปฏิบัติงาน
                </p>
              )}
              {signedISO && (
                <p className="text-xs text-muted-foreground">
                  เลือกได้ตั้งแต่ {formatThaiDateSlash(signedISO)} (วันที่ลงนามในสัญญา) เป็นต้นไป
                </p>
              )}
              {workStart && !workStartInvalid && (
                <p className="text-xs text-muted-foreground">📅 {formatThaiDate(workStart)}</p>
              )}
            </div>
          </FieldRow>
          <FieldRow label="แผนปฏิบัติการก่อสร้าง (Gantt)">
            <div className="space-y-1">
              <InlineDocUpload
                project={project}
                stepNumber={9}
                documentType={STEP9_DOC.GANTT_CHART}
                label="📎 แนบแผน Gantt (.pdf/.xls/.xlsx)"
                existing={docsForStep}
                onChange={onDocsChange}
                filePolicyId="bg06"
              />
              <p className="text-xs text-muted-foreground">
                บันทึก Gantt แล้วระบบจะติ๊ก Checklist ข้อที่ 2 อัตโนมัติ
              </p>
            </div>
          </FieldRow>
          <FieldRow label="วันครบกำหนดสิ้นสุดสัญญา (กำหนดเสร็จ)">
            <div className="space-y-1">
              <input
                type="text"
                readOnly
                aria-readonly
                value={
                  contractEndISO ? formatThaiDateSlash(contractEndISO) : "— กรอกระยะเวลาและวันเริ่มงานก่อน —"
                }
                className={`${inputCls} bg-muted/50 cursor-not-allowed text-foreground`}
                tabIndex={-1}
              />
              {contractEndISO && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {formatThaiDate(contractEndISO)} — คำนวณอัตโนมัติ (วันปฏิทิน)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    สูตร: วันเริ่มปฏิบัติงาน + {schedule.contract_duration_days ?? "—"} วัน
                    (นับรวมวันหยุดราชการ)
                  </p>
                </>
              )}
            </div>
          </FieldRow>
        </div>

        <div className="space-y-4 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            กลุ่มที่ 3: การสั่งเริ่มงานหน้างาน
          </p>
          <FieldRow
            label="เลขที่หนังสือแจ้งให้เริ่มปฏิบัติงาน"
            tooltipKey="step9.notice_to_proceed_letter_no"
          >
            <input
              type="text"
              value={schedule.notice_to_proceed_letter_no ?? ""}
              onChange={(e) =>
                onContractScheduleChange({ notice_to_proceed_letter_no: e.target.value })
              }
              disabled={readOnly}
              className={inputCls}
              placeholder="เช่น ที่ กษ ๐๖๐๒ / ๔๕๖"
            />
          </FieldRow>
          <FieldRow label="วันที่เริ่มปฏิบัติงานตามหนังสือแจ้ง">
            <div className="space-y-1">
              <input
                type="text"
                readOnly
                aria-readonly
                value={
                  workStartInvalid || !workStart
                    ? "— ระบุวันเริ่มปฏิบัติงานหน้างาน (กลุ่มที่ 2) ก่อน —"
                    : formatThaiDateSlash(workStart)
                }
                className={`${inputCls} bg-muted/50 cursor-not-allowed text-foreground`}
                tabIndex={-1}
              />
              <p className="text-xs text-muted-foreground">
                Sync อัตโนมัติจากวันที่เริ่มปฏิบัติงานหน้างาน (กลุ่มที่ 2) — แก้ไขได้ที่ช่องนั้นเท่านั้น
              </p>
              {workStart && !workStartInvalid && (
                <p className="text-xs text-muted-foreground">📅 {formatThaiDate(workStart)}</p>
              )}
            </div>
          </FieldRow>
          <ResponsibleOfficerField
            stepNumber={9}
            value={responsibleName}
            onChange={onResponsibleNameChange}
            step1Default={step1ResponsibleDefault}
          />
          <FieldRow label="หมายเหตุ">
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={4}
              disabled={readOnly}
              placeholder="บันทึกหมายเหตุเพิ่มเติม (ถ้ามี)"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

function step10InspectionResultBadgeClass(result: string): string {
  switch (result) {
    case "passed":
      return "bg-success/15 text-success border-success/30";
    case "defects":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
}

function step10InspectionResultLabel(result: string): string {
  return (
    STEP10_INSPECTION_RESULT_OPTIONS.find((o) => o.value === result)?.label ?? "ยังไม่ระบุ"
  );
}

function step10DocsCountBadgeClass(count: number, required: number): string {
  if (count >= required) return "bg-success/10 text-success border-success/25";
  if (count > 0) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200";
  return "bg-muted/50 text-muted-foreground border-border";
}

type Step10DetailFormProps = Omit<
  GenericStepDetailFormProps,
  "dueDate" | "onDueDateChange" | "dueTooEarly" | "dueTooLateContract" | "minDeadline" | "docList"
> & {
  totalInstallmentCount: number;
  inspectionRows: Step10InspectionRow[];
  onInspectionRowsChange: (rows: Step10InspectionRow[]) => void;
  projectType: Step10ProjectType;
  onProjectTypeChange: (type: Step10ProjectType) => void;
  contractAmount: number | null;
  contractStartDate: string;
  contractEndDate: string;
  inspectionCommitteeDisplay: string;
  projectStatus: string;
  resultUnit?: string | null;
  executiveReportSource: ExecutiveReportProject;
  warrantyEndDate?: string | null;
  warrantyStartedAt?: string | null;
};

/** ขั้นตอนที่ 10 — บริหารสัญญาและตรวจรับพัสดุ (ข้อ 176–179) */
export function Step10DetailForm({
  totalInstallmentCount,
  inspectionRows,
  onInspectionRowsChange,
  projectType,
  onProjectTypeChange,
  contractAmount,
  contractStartDate,
  contractEndDate,
  inspectionCommitteeDisplay,
  projectStatus,
  resultUnit = null,
  executiveReportSource,
  warrantyEndDate = null,
  warrantyStartedAt = null,
  ...genericProps
}: Step10DetailFormProps) {
  console.log(
    "🛡️ [ขั้นตอนที่ 10 GRAND FINALE - CONSTRUCTION READY]: Terminology refactored. Dynamic Installment Loop, Calendar-Day Fine Calculator, and Conditional Construction Fields (Reg. 176) are fully functional.",
  );

  const contractStart = contractStartDate?.trim() ?? "";
  const contractEnd = contractEndDate?.trim() ?? "";
  const requiredDocsPerInstallment = step10RequiredDocCount(projectType);
  const uploadedDocTypes = genericProps.docsForStep.map((d) => d.document_type);

  const patchRow = (installmentNo: number, patch: Partial<Step10InspectionRow>) => {
    onInspectionRowsChange(
      inspectionRows.map((row) =>
        row.installment_no === installmentNo ? { ...row, ...patch } : row,
      ),
    );
  };

  const patchDeliveryDate = (installmentNo: number, iso: string) => {
    if (contractStart && iso && isStep10DeliveryBeforeContractStart(contractStart, iso)) {
      toast.error("วันที่ส่งมอบงานจริงต้องไม่ก่อนวันเริ่มต้นสัญญา");
      return;
    }
    const row = inspectionRows.find((r) => r.installment_no === installmentNo);
    const next: Partial<Step10InspectionRow> = { delivery_date: iso };
    if (row && iso && row.inspection_date && isStep10InspectionBeforeDelivery(iso, row.inspection_date)) {
      next.inspection_date = "";
    }
    patchRow(installmentNo, next);
  };

  const handleProjectTypeChange = (nextType: Step10ProjectType) => {
    onProjectTypeChange(nextType);
  };

  const installmentDocMap = useMemo(
    () =>
      groupStep10DocsByInstallment(
        genericProps.docsForStep.filter((d) => d.document_type !== STEP10_GUARANTEE_RETURN_DOC),
      ),
    [genericProps.docsForStep],
  );

  const isWarrantyPhase = projectStatus === PROJECT_STATUS_WARRANTY;
  const previewWarrantyEnd =
    warrantyEndDate?.trim() ||
    computeWarrantyEndDateISO(resolveLastInstallmentInspectionDate(inspectionRows)) ||
    "";
  const previewWarrantyStart =
    warrantyStartedAt?.trim() || resolveLastInstallmentInspectionDate(inspectionRows) || "";

  const [expandedInstallment, setExpandedInstallment] = useState<number | null>(null);
  const [reportGenerating, setReportGenerating] = useState(false);

  const toggleInstallmentAccordion = (installmentNo: number) => {
    setExpandedInstallment((prev) => (prev === installmentNo ? null : installmentNo));
  };

  const handlePrintExecutiveReport = async () => {
    setReportGenerating(true);
    try {
      await downloadExecutiveReportPdf({
        project: executiveReportSource,
        inspectionRows,
        contractAmount,
      });
      toast.success("สร้างรายงานสรุป PDF เรียบร้อย");
    } catch (err) {
      console.error(err);
      toast.error("สร้างรายงาน PDF ไม่สำเร็จ — กรุณาลองใหม่");
    } finally {
      setReportGenerating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          ข้อมูลสืบทอดจากขั้นตอนก่อนหน้า (อ่านอย่างเดียว)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="วงเงินสัญญาจริง (บาท)">
            <input
              type="text"
              readOnly
              value={
                contractAmount != null
                  ? `${formatCurrencyDisplay(contractAmount)} บาท`
                  : "— ยังไม่พบข้อมูลจากขั้นตอนที่ 8/9 —"
              }
              className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            />
          </FieldRow>
          <FieldRow label="จำนวนงวดงานทั้งหมด (จากขั้นตอนที่ 9)">
            <input
              type="text"
              readOnly
              value={totalInstallmentCount > 0 ? `${totalInstallmentCount} งวด` : "— ยังไม่ระบุ —"}
              className={`${inputCls} bg-muted/50 cursor-not-allowed`}
            />
          </FieldRow>
          <FieldRow label="วันเริ่มต้นสัญญา">
            <input
              type="text"
              readOnly
              value={
                contractStart
                  ? formatThaiDateSlash(contractStart)
                  : "— กรุณาบันทึกในขั้นตอนที่ 9 —"
              }
              className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            />
          </FieldRow>
          <FieldRow label="วันสิ้นสุดสัญญา">
            <input
              type="text"
              readOnly
              value={
                contractEnd
                  ? formatThaiDateSlash(contractEnd)
                  : "— กรุณาบันทึกในขั้นตอนที่ 9 —"
              }
              className={`${inputCls} bg-muted/50 cursor-not-allowed tabular-nums`}
            />
          </FieldRow>
        </div>
        <FieldRow label="คณะกรรมการตรวจรับพัสดุ (จากขั้นตอนที่ 4)">
          <textarea
            readOnly
            rows={2}
            value={inspectionCommitteeDisplay || "— ยังไม่พบรายชื่อจากขั้นตอนที่ 4 —"}
            className="w-full px-3 py-2 rounded-md border border-input bg-muted/50 text-sm cursor-not-allowed resize-none"
          />
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">ประเภทโครงการ *</p>
        <div className="flex flex-wrap gap-4">
          {STEP10_PROJECT_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                projectType === opt.value
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="step10_project_type"
                value={opt.value}
                checked={projectType === opt.value}
                onChange={() => handleProjectTypeChange(opt.value)}
                disabled={genericProps.readOnly}
                className="accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {projectType === "construction" && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            โหมดงานก่อสร้าง — ต้องกรอกข้อมูลผู้ควบคุมงานและแนบรายงานผู้ควบคุมงานทุกงวด
            (ระเบียบฯ ข้อ 176) · ค่าปรับคำนวณจากวงเงินรวมทั้งสัญญา ขั้นต่ำ 100 บาท/วัน
          </p>
        )}
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            พิมพ์รายงานสรุปเสนอผู้บริหาร (PDF)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ดึงข้อมูลอัตโนมัติจากขั้นตอนที่ 1, 2, 4, 8 และตารางตรวจรับงวด
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePrintExecutiveReport()}
          disabled={reportGenerating}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 shrink-0"
        >
          {reportGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {reportGenerating ? "กำลังสร้าง PDF..." : "พิมพ์รายงานสรุป PDF"}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">จัดการงวดงานและตรวจรับพัสดุ</p>
          <p className="text-xs text-muted-foreground mt-1">
            ระบบสร้าง {totalInstallmentCount > 0 ? totalInstallmentCount : "—"} งวดจากขั้นตอนที่ 9
            · คลิกแถบงวดงานเพื่อกางฟอร์มกรอกข้อมูล (เปิดได้ทีละ 1 งวด)
          </p>
        </div>
        {totalInstallmentCount <= 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            กรุณาบันทึกจำนวนงวดงานทั้งหมดในขั้นตอนที่ 9 ก่อน
          </p>
        ) : (
          <div className="space-y-2">
            {inspectionRows.map((row) => {
              const n = row.installment_no;
              const isOpen = expandedInstallment === n;
              const installmentDocs = installmentDocMap.get(n) ?? [];
              const docCount = installmentDocs.length;
              const hasRequiredDocs = step10RowHasRequiredDocs(
                n,
                uploadedDocTypes,
                projectType,
              );
              const penaltyResult = computeStep10InstallmentPenalty({
                projectType,
                contractAmount,
                totalInstallments: totalInstallmentCount,
                penaltyRatePct: row.penalty_rate_pct,
                plannedISO: row.planned_completion_date,
                actualDeliveryISO: row.delivery_date,
              });
              const penaltyBaseAmount = getStep10PenaltyBaseAmount({
                projectType,
                contractAmount,
                totalInstallments: totalInstallmentCount,
              });
              const penaltyBaseLabel = formatStep10PenaltyBaseLabel(
                projectType,
                penaltyBaseAmount,
              );
              const hasConstructionFeed =
                row.construction_synced === true ||
                Boolean(row.site_diary?.trim()) ||
                Boolean(row.site_obstacles?.trim());
              const resultLabel = step10InspectionResultLabel(row.inspection_result);
              const fieldsDisabled = genericProps.readOnly || isWarrantyPhase;
              const procurementPolicyDisabled = genericProps.readOnly;
              const inspectionMinDate =
                projectType === "construction" && row.supervisor_report_date?.trim()
                  ? row.supervisor_report_date
                  : row.delivery_date;

              return (
                <div
                  key={n}
                  className={`rounded-lg border bg-background overflow-hidden transition-shadow ${
                    isOpen
                      ? "border-primary/40 shadow-sm ring-1 ring-primary/10"
                      : "border-border hover:border-primary/25"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleInstallmentAccordion(n)}
                    aria-expanded={isOpen}
                    className="w-full flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    <span className="font-semibold text-sm text-foreground shrink-0">
                      งวดที่ {n}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ครบกำหนด{" "}
                      {row.planned_completion_date
                        ? formatThaiDateSlash(row.planned_completion_date)
                        : "—"}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${step10InspectionResultBadgeClass(row.inspection_result)}`}
                    >
                      {resultLabel}
                    </span>
                    {penaltyResult.penaltyBaht > 0 && (
                      <span className="text-xs font-semibold text-red-600 shrink-0">
                        ค่าปรับ {formatBaht(penaltyResult.penaltyBaht)} บาท ({penaltyResult.daysLate} วัน)
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ml-auto ${step10DocsCountBadgeClass(docCount, requiredDocsPerInstallment)}`}
                    >
                      เอกสาร {hasRequiredDocs ? "ครบ" : `${docCount}/${requiredDocsPerInstallment}`}
                    </span>
                  </button>

                  <div
                    className={isOpen ? "block border-t border-border" : "hidden"}
                    aria-hidden={!isOpen}
                  >
                    <div className="p-4 space-y-4 bg-muted/5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FieldRow
                          label="วันครบกำหนดส่งมอบประจำงวดตามสัญญา *"
                          complianceTarget={`installment-${n}-planned_date`}
                        >
                          <ChronologicalDatePicker
                            stepNumber={10}
                            chronologicalCtx={genericProps.chronologicalCtx}
                            value={row.planned_completion_date}
                            onChange={(iso) => patchRow(n, { planned_completion_date: iso })}
                            disabled={fieldsDisabled}
                            showChronologicalHint={false}
                          />
                        </FieldRow>
                        <FieldRow
                          label="เลขที่หนังสือส่งมอบงาน *"
                          complianceTarget={`installment-${n}-delivery_letter_no`}
                        >
                          <input
                            type="text"
                            value={row.delivery_letter_no}
                            onChange={(e) => patchRow(n, { delivery_letter_no: e.target.value })}
                            disabled={fieldsDisabled}
                            className={inputCls}
                            placeholder="เช่น กค 1234/2568"
                          />
                        </FieldRow>
                        <FieldRow
                          label="วันที่คู่สัญญาส่งมอบงานจริง *"
                          complianceTarget={`installment-${n}-delivery_date`}
                        >
                          <ChronologicalDatePicker
                            stepNumber={10}
                            chronologicalCtx={genericProps.chronologicalCtx}
                            additionalMinDates={contractStart ? [contractStart] : []}
                            value={row.delivery_date}
                            onChange={(iso) => patchDeliveryDate(n, iso)}
                            disabled={fieldsDisabled}
                            onInvalidDate={() =>
                              toast.error("วันที่ส่งมอบงานจริงต้องไม่ก่อนวันเริ่มต้นสัญญา")
                            }
                            showChronologicalHint={false}
                          />
                        </FieldRow>
                        <FieldRow
                          label="วันที่คณะกรรมการตรวจรับจริง *"
                          complianceTarget={`installment-${n}-inspection_date`}
                        >
                          <ChronologicalDatePicker
                            stepNumber={10}
                            chronologicalCtx={genericProps.chronologicalCtx}
                            intraStepMinDate={inspectionMinDate}
                            value={row.inspection_date}
                            onChange={(iso) => patchRow(n, { inspection_date: iso })}
                            disabled={fieldsDisabled || !row.delivery_date?.trim()}
                            onInvalidDate={() =>
                              toast.error(
                                projectType === "construction"
                                  ? "วันตรวจรับต้องไม่ก่อนวันส่งมอบงานและวันรายงานผู้ควบคุมงาน"
                                  : "วันตรวจรับต้องไม่ก่อนวันที่คู่สัญญาส่งมอบงานจริง",
                              )
                            }
                            showChronologicalHint={false}
                          />
                        </FieldRow>
                        <FieldRow
                          label="ผลการตรวจรับ *"
                          complianceTarget={`installment-${n}-inspection_result`}
                        >
                          <select
                            value={row.inspection_result}
                            onChange={(e) =>
                              patchRow(n, {
                                inspection_result: e.target.value,
                                installment_status:
                                  e.target.value === "passed" ? "inspection_passed" : "",
                              })
                            }
                            disabled={fieldsDisabled}
                            className={inputCls}
                          >
                            <option value="">— เลือกผลการตรวจรับ —</option>
                            {STEP10_INSPECTION_RESULT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </FieldRow>
                        <FieldRow
                          label="อัตราค่าปรับต่อวัน (ร้อยละ) *"
                          complianceTarget={`installment-${n}-penalty_rate`}
                        >
                          <input
                            type="number"
                            min={
                              projectType === "construction"
                                ? STEP10_PENALTY_RATE_CONSTRUCTION_MIN
                                : 0
                            }
                            max={
                              projectType === "construction"
                                ? STEP10_PENALTY_RATE_CONSTRUCTION_MAX
                                : undefined
                            }
                            step={0.001}
                            value={row.penalty_rate_pct ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              patchRow(n, {
                                penalty_rate_pct: raw ? Number(raw) : null,
                              });
                            }}
                            disabled={procurementPolicyDisabled}
                            className={inputCls}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {projectType === "construction"
                              ? `งานก่อสร้าง: อัตรา ${STEP10_PENALTY_RATE_CONSTRUCTION_MIN}%–${STEP10_PENALTY_RATE_CONSTRUCTION_MAX}% ต่อวัน · ฐานคำนวณ: ${penaltyBaseLabel}`
                              : `ซื้อ/จ้างทั่วไป: ค่าเริ่มต้น ${STEP10_PENALTY_RATE_GENERAL_DEFAULT}% ต่อวัน · ฐานคำนวณ: ${penaltyBaseLabel}`}
                          </p>
                        </FieldRow>
                      </div>

                      {penaltyResult.daysLate > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          <span className="font-semibold">⚠️ เกินกำหนด {penaltyResult.daysLate} วันปฏิทิน</span>
                          {" · "}
                          ค่าปรับงวดนี้{" "}
                          <span className="font-bold tabular-nums">
                            {formatBaht(penaltyResult.penaltyBaht)} บาท
                          </span>
                          {projectType === "construction" ? (
                            <span className="text-xs block mt-1">
                              (สูตรล็อก: {penaltyBaseLabel} × อัตราค่าปรับ × วันเลท — ขั้นต่ำ 100 บาท/วัน)
                            </span>
                          ) : (
                            <span className="text-xs block mt-1">
                              (สูตรล็อก: {penaltyBaseLabel} × อัตราค่าปรับ × วันเลท)
                            </span>
                          )}
                        </div>
                      )}

                      {hasConstructionFeed && (
                        <div className="rounded-md border border-sky-200 bg-sky-50/80 dark:bg-sky-950/20 dark:border-sky-800 px-3 py-3 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                              ข้อมูลจากฝ่ายแผนงานก่อสร้าง (ระเบียบฯ ข้อ 182)
                            </p>
                            {row.construction_synced && (
                              <span className="text-xs px-2 py-0.5 rounded-full border border-sky-300 bg-sky-100 text-sky-800 font-medium">
                                ซิงก์จากเมนูติดตามงานก่อสร้าง
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-sky-800 dark:text-sky-200">
                            ใช้ประกอบการพิจารณางด/ลดค่าปรับ — อ่านอย่างเดียว (แก้ไขได้ที่เมนูติดตามงานก่อสร้าง)
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-foreground">
                                หมายเหตุความคืบหน้า (Site Diary)
                              </p>
                              <div className="min-h-[3rem] rounded-md border border-sky-200 bg-white/70 dark:bg-background px-3 py-2 text-sm whitespace-pre-wrap">
                                {row.site_diary?.trim() || "— ยังไม่มีข้อมูล —"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-foreground">
                                อุปสรรคหน้างาน
                              </p>
                              <div
                                className={`min-h-[3rem] rounded-md border px-3 py-2 text-sm whitespace-pre-wrap ${
                                  row.site_obstacles?.trim()
                                    ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                                    : "border-sky-200 bg-white/70 dark:bg-background"
                                }`}
                              >
                                {row.site_obstacles?.trim() || "— ไม่มีอุปสรรค —"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {projectType === "construction" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2 border-t border-border/60">
                          <FieldRow
                            label="ชื่อ-นามสกุล ผู้ควบคุมงานก่อสร้าง *"
                            complianceTarget={`installment-${n}-supervisor_name`}
                          >
                            <input
                              type="text"
                              value={row.supervisor_name}
                              onChange={(e) => patchRow(n, { supervisor_name: e.target.value })}
                              disabled={fieldsDisabled}
                              className={inputCls}
                            />
                          </FieldRow>
                          <FieldRow
                            label="วันที่ผู้ควบคุมงานรายงานผลสำเร็จ *"
                            complianceTarget={`installment-${n}-supervisor_report_date`}
                          >
                            <ChronologicalDatePicker
                              stepNumber={10}
                              chronologicalCtx={genericProps.chronologicalCtx}
                              value={row.supervisor_report_date}
                              onChange={(iso) => {
                                patchRow(n, { supervisor_report_date: iso });
                                if (
                                  row.inspection_date?.trim() &&
                                  isStep10InspectionBeforeSupervisorReport(iso, row.inspection_date)
                                ) {
                                  patchRow(n, { supervisor_report_date: iso, inspection_date: "" });
                                }
                              }}
                              disabled={fieldsDisabled}
                              showChronologicalHint={false}
                            />
                          </FieldRow>
                        </div>
                      )}

                      <FieldRow label="หมายเหตุผู้ตรวจ">
                        <input
                          type="text"
                          value={row.inspector_note}
                          onChange={(e) => patchRow(n, { inspector_note: e.target.value })}
                          disabled={fieldsDisabled}
                          className={inputCls}
                          placeholder="บันทึกผลตรวจรับเพิ่มเติม"
                        />
                      </FieldRow>

                      <div className="pt-2 border-t border-border/60 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          หลักฐานงวดที่ {n}
                        </p>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <InlineDocUpload
                            project={genericProps.project}
                            stepNumber={10}
                            documentType={STEP10_INSTALLMENT_DOC.deliveryLetter(n)}
                            label="1. หนังสือส่งมอบงาน/ส่งมอบพัสดุจากคู่สัญญา (.pdf) *"
                            existing={genericProps.docsForStep}
                            onChange={genericProps.onDocsChange}
                            filePolicyId="pdf_only"
                            compact
                          />
                          <InlineDocUpload
                            project={genericProps.project}
                            stepNumber={10}
                            documentType={STEP10_INSTALLMENT_DOC.inspectionReport(n)}
                            label="2. ใบตรวจรับพัสดุ / รายงานผลการตรวจรับ (.pdf) *"
                            existing={genericProps.docsForStep}
                            onChange={genericProps.onDocsChange}
                            filePolicyId="pdf_only"
                            compact
                          />
                          {projectType === "construction" && (
                            <div className="space-y-1">
                              <InlineDocUpload
                                project={genericProps.project}
                                stepNumber={10}
                                documentType={STEP10_INSTALLMENT_DOC.supervisorReport(n)}
                                label="3. รายงานผลการปฏิบัติงานของผู้ควบคุมงานประจำงวด (.pdf) *"
                                existing={genericProps.docsForStep}
                                onChange={genericProps.onDocsChange}
                                filePolicyId="pdf_only"
                                compact
                              />
                              <p className="text-xs text-muted-foreground">{STEP10_DAILY_REPORT_HINT}</p>
                            </div>
                          )}
                          <InlineDocUpload
                            project={genericProps.project}
                            stepNumber={10}
                            documentType={STEP10_INSTALLMENT_DOC.sitePhotoEvidence(n)}
                            label="ภาพถ่ายหลักฐานการตรวจรับพัสดุหน้างานจริง (ไม่บังคับ)"
                            existing={genericProps.docsForStep}
                            onChange={genericProps.onDocsChange}
                            filePolicyId="screenshot_evidence"
                            compact
                          />
                          <InlineDocUpload
                            project={genericProps.project}
                            stepNumber={10}
                            documentType={STEP10_INSTALLMENT_DOC.invoice(n)}
                            label="ใบแจ้งหนี้ / ใบกำกับภาษี (ไม่บังคับ)"
                            existing={genericProps.docsForStep}
                            onChange={genericProps.onDocsChange}
                            filePolicyId="pdf_only"
                            compact
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(isWarrantyPhase || previewWarrantyEnd) && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              ระยะค้ำประกันความชำรุดบกพร่อง 2 ปี
            </p>
            {isWarrantyPhase && (
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 font-medium">
                สถานะโครงการ: {PROJECT_WARRANTY_STATUS_LABEL}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              ระบบคำนวณจากวันที่คณะกรรมการตรวจรับจริงของงวดสุดท้าย + 2 ปีปฏิทิน
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
            <FieldRow label="วันเริ่มนับค้ำประกัน (งวดสุดท้าย)">
              <input
                type="text"
                readOnly
                value={
                  previewWarrantyStart
                    ? formatThaiDateSlash(previewWarrantyStart)
                    : "— บันทึกวันตรวจรับงวดสุดท้ายก่อน —"
                }
                className={`${inputCls} bg-muted/50 cursor-not-allowed`}
                tabIndex={-1}
              />
            </FieldRow>
            <FieldRow label="วันสิ้นสุดค้ำประกันผลงาน (Read-only)">
              <input
                type="text"
                readOnly
                value={
                  previewWarrantyEnd
                    ? formatThaiDateSlash(previewWarrantyEnd)
                    : "— คำนวณอัตโนมัติเมื่อมีวันตรวจรับงวดสุดท้าย —"
                }
                className={`${inputCls} bg-muted/50 cursor-not-allowed`}
                tabIndex={-1}
              />
            </FieldRow>
          </div>
          <FieldRow label="บันทึกคืนหลักประกันสัญญา (อัปโหลดเมื่อครบ 2 ปี)">
            <div className="space-y-1">
              <InlineDocUpload
                project={genericProps.project}
                stepNumber={10}
                documentType={STEP10_GUARANTEE_RETURN_DOC}
                label="📎 แนบบันทึกคืนหลักประกันสัญญา (.pdf/.png/.jpg)"
                existing={genericProps.docsForStep}
                onChange={genericProps.onDocsChange}
                filePolicyId="egp_screenshot"
              />
              <p className="text-xs text-muted-foreground">
                ช่องนี้เปิดให้อัปโหลดเก็บประวัติหลังครบระยะค้ำประกัน — ไม่บังคับก่อนกดปิดโครงการ
              </p>
            </div>
          </FieldRow>
        </div>
      )}

      {!isWarrantyPhase && !previewWarrantyEnd && (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            หลังปิดโครงการ — ระบบจะเปิดส่วนค้ำประกัน 2 ปี และช่องอัปโหลดคืนหลักประกันสัญญา
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 max-w-2xl">
        <p className="text-sm font-medium text-foreground">ข้อมูลงานขั้นตอนนี้</p>
        <ResponsibleOfficerField
          stepNumber={10}
          value={genericProps.responsibleName}
          onChange={genericProps.onResponsibleNameChange}
          step1Default={genericProps.step1ResponsibleDefault ?? ""}
        />
        <FieldRow label="หมายเหตุ">
          <textarea
            value={genericProps.note}
            onChange={(e) => genericProps.onNoteChange(e.target.value)}
            rows={4}
            disabled={genericProps.readOnly}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        </FieldRow>
      </div>
    </div>
  );
}
/** ขั้นตอนที่ 10 — Checklist ด้านบน ฟอร์มด้านล่าง */
export function GenericStepDetailForm({
  stepNumber,
  manualChecklist,
  onManualChange,
  autoCheckStates,
  readOnly,
  docBinder,
  dueDate,
  onDueDateChange,
  dueTooEarly,
  dueTooLateContract,
  minDeadline,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  note,
  onNoteChange,
  project,
  docList,
  docsForStep,
  onDocsChange,
  projectName,
  chronologicalCtx,
}: GenericStepDetailFormProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      <GenericStepChecklistPanel
        stepNumber={stepNumber}
        manualChecklist={manualChecklist}
        onManualChange={onManualChange}
        autoCheckStates={autoCheckStates}
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">ข้อมูลงานขั้นตอนนี้</p>
        <FieldRow label="กำหนดเสร็จ">
          <div className="space-y-1">
            <ChronologicalDatePicker
              stepNumber={stepNumber}
              chronologicalCtx={chronologicalCtx}
              additionalMinDates={[minDeadline]}
              value={dueDate}
              onChange={onDueDateChange}
              disabled={readOnly}
              showChronologicalHint={false}
            />
            {dueDate && (
              <p className="text-xs text-muted-foreground">📅 {formatThaiDate(dueDate)}</p>
            )}
            {dueTooEarly && minDeadline && (
              <p className="text-xs" style={{ color: "#EA580C" }}>
                ⚠️ วันที่เลือกสั้นกว่ากำหนดตาม พ.ร.บ. กรุณาเลือกวันที่{" "}
                {formatThaiDate(minDeadline)} หรือหลังจากนั้น มิฉะนั้น สตง. อาจทักท้วงได้
              </p>
            )}
            {dueTooLateContract && (
              <p className="text-xs" style={{ color: "#EA580C" }}>
                ⚠️ ควรลงนามสัญญาภายใน 7 วันทำการ หลังพ้นอุทธรณ์
              </p>
            )}
          </div>
        </FieldRow>
        <ResponsibleOfficerField
          stepNumber={stepNumber}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
        <FieldRow label="หมายเหตุ">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={4}
            disabled={readOnly}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
        </FieldRow>
      </div>

      <StepInlineDocList
        project={project}
        stepNumber={stepNumber}
        docList={docList}
        existing={docsForStep}
        onChange={onDocsChange}
      />
      <StepDocumentHub
        stepNumber={stepNumber}
        docList={docList}
        docs={docsForStep}
        projectName={projectName}
      />
    </div>
  );
}
