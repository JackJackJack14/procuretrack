import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Check, Upload, Eye, Trash2, FileText, Loader2, AlertTriangle,
  FolderOpen, Download, FileImage, FileSpreadsheet, File as FileLucide, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { STEP_DOCS_DETAILED, METHOD_LABEL, STATUS_LABEL, formatBaht } from "@/lib/procurement";
import {
  EGP_MILESTONE_SHORT,
  EGP_STEP_LEGAL_HINTS,
  getMilestoneLabel,
} from "@/lib/egp-milestones";
import { formatThaiDate } from "@/lib/utils";
import { buildProjectTimelineItems } from "@/lib/project-timeline";
import { resolveDocFilePolicy, validateDocFile } from "@/lib/doc-file-types";
import { uploadStepDocument } from "@/lib/doc-upload";
import { checkStorageQuota, incrementStorageUsage, decrementStorageUsage } from "@/lib/storage";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { GuidelineBox } from "@/components/GuidelineBox";
import { StepWorkflowBanner } from "@/components/StepWorkflowBanner";
import { GuideModeToggle } from "@/components/GuideModeToggle";
import { GuideModeProvider } from "@/contexts/GuideModeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Step1DetailForm,
  Step2DetailForm,
  Step3DetailForm,
  Step4DetailForm,
  Step5DetailForm,
  Step6AppealForm,
  Step7ContractNoticeForm,
  Step8ContractGuaranteeForm,
  GenericStepDetailForm,
} from "@/components/steps/ProjectStepForms";
import {
  computeAutoChecklistState,
  createEmptyManualChecklist,
  getGenericStepComplianceIssues,
  getSmartChecklistItems,
  getStep6ChecklistItems,
  isGenericStepReadyForNext,
  loadManualChecklistFromNote,
  normalizeManualChecklist,
} from "@/lib/smart-checklist";
import { CompletedStepView } from "@/components/steps/CompletedStepView";
import {
  addWorkdays,
  computeAppealDeadlineISO,
  computeContractEarliestISO,
  computeContractNotificationDeadlineISO,
  parseISODateLocal,
  getStepMinDays,
  getMinDays,
  validateStep3PublicationDates,
} from "@/lib/workdays";
import {
  formatBudgetInput,
  parseBudgetInput,
  serializeStepNote,
  buildStepDraftFields,
  loadStepDraftFields,
  loadStep3FormFromStep,
  EMPTY_STEP3_CHECKLIST,
  EMPTY_STEP3_ANNOUNCEMENT,
  getStep3ComplianceIssues,
  isStep3ReadyForNext,
  type Step3ChecklistKey,
  buildProjectProcurementRequestFields,
  buildProjectStep4Fields,
  buildProjectStep5Fields,
  loadStep4FormFromNote,
  loadStep5FormFromNote,
  mergeStep4BidResultFromProject,
  mergeStep5FromProject,
  EMPTY_STEP4_BID_RESULT,
  EMPTY_STEP4_CHECKLIST,
  EMPTY_STEP5_ANNOUNCEMENT,
  EMPTY_STEP5_CHECKLIST,
  getStep5ComplianceIssues,
  isStep5ReadyForNext,
  isStep5WinnerAnnouncementBeforeEvaluation,
  getStep5WinnerAnnouncementBeforeEvaluationMsg,
  EMPTY_STEP1_CHECKLIST,
  loadStep1FormFromStep,
  isStep1ReadyForNext,
  getStep1ComplianceIssues,
  type Step1ChecklistKey,
  EMPTY_STEP2_CHECKLIST,
  EMPTY_STEP2_COMMITTEE_ORDER,
  EMPTY_STEP2_MEDIAN_PRICE,
  loadStep2FormFromStep,
  mergeStep2FormFromProject,
  buildProjectStep2Fields,
  getStep2ComplianceIssues,
  isStep2ReadyForNext,
  resolveProjectMedianPrice,
  isStep2MedianApprovalBeforeAppointment,
  STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG,
  type Step2ChecklistKey,
  type Step2CommitteeOrder,
  type Step2MedianPrice,
  EMPTY_STEP2_COMMITTEES,
  loadStep2CommitteesFromDb,
  buildStep2CommitteeRows,
  STEP2_COMMITTEE_DB_TYPES,
  getStep2CommitteeInsertProfiles,
  isStep2CommitteeTypeCheckError,
  type Step2CommitteeListKey,
  type Step2CommitteeAppointmentMode,
  type Step2CommitteesState,
  buildStep2ComplianceLog,
  logStep2ComplianceWarnings,
  type Step2ComplianceLog,
  isAppealBlocking,
  isStep4ReadyForNext,
  getStep4ComplianceIssues,
  getStep6ComplianceIssues,
  isStep6ReadyForNext,
  EMPTY_STEP7_CONTRACT_NOTICE,
  loadStep7FormFromNote,
  getStep7ComplianceIssues,
  isStep7ReadyForNext,
  type Step7ContractNotice,
  EMPTY_STEP8_CONTRACT_EXECUTION,
  loadStep8FormFromNote,
  mergeStep8FromProject,
  resolveDefaultStep8ContractAmount,
  buildProjectStep8Fields,
  getStep8ComplianceIssues,
  isStep8ReadyForNext,
  type Step8ContractExecution,
  resolveWinnerAnnouncementDate,
  computeStep4Timeline,
  resolveStep4ContractAmount,
  buildProjectAppealFields,
  mergeAppealFromProject,
  EMPTY_STEP6_APPEAL,
  getStep1ResponsibleOfficer,
  resolveResponsibleOfficer,
  type Step3Announcement,
  type Step4BidResult,
  type Step4Checklist,
  type Step4ChecklistKey,
  type Step5Announcement,
  type Step5Checklist,
  type Step5ChecklistKey,
  type Step6AppealState,
  type Step6Checklist,
} from "@/lib/step-form";
import {
  hasStep4BlacklistEvidenceDoc,
  hasStep4CommitteeReportDoc,
  hasStep4ConflictEvidenceDoc,
  hasStep4EgpBidSummaryDoc,
  hasStep5EgpWinnerDoc,
  hasStep5PhysicalBoardDoc,
  hasStep6AgencyReportDoc,
  hasStep6CgdReportDoc,
  hasStep6NoAppealEgpDoc,
  isStep4RequiredDocSatisfied,
  isStep5RequiredDocSatisfied,
} from "@/lib/form-audit-trail";
import { ComplianceGateBanner } from "@/components/ComplianceGateBanner";
import { StepAuditZipButton } from "@/components/StepAuditZipButton";
import {
  computeReactiveChecklistEffective,
} from "@/components/SmartChecklist";
import { STEP2_DOC, STEP3_DOC } from "@/lib/step-doc-types";
import {
  getStep3HearingTier,
  shouldShowStep3HearingForm,
  type Step3SkipReason,
} from "@/lib/step3-hearing";
import {
  getRollbackConfirmMessage,
  getPreviousStepReopenPatch,
  getStepRollbackProcurementStepWipe,
  getStepRollbackProjectWipe,
} from "@/lib/step-rollback";
import {
  canCompleteWorkflowStep,
  canNavigateToStep,
  canRollbackWorkflowStep,
  canSaveHistoricalEdit,
  getStepWorkflowMode,
  isStepForwardLocked,
  isWorkflowReadOnly,
} from "@/lib/step-workflow";

export const Route = createFileRoute("/projects_/$projectId")({
  head: () => ({ meta: [{ title: "รายละเอียดโครงการ — ProcureTrack" }] }),
  component: ProjectDetailPage,
});

type Project = {
  id: string;
  organization_id: string;
  name: string;
  project_code: string;
  description: string | null;
  budget: number;
  estimated_price?: number | null;
  status: string;
  method: string;
  fiscal_year: number;
  current_step: number;
  created_at: string;
  district_office: string | null;
  design_code: string | null;
  approving_agency: string | null;
  procurement_agency: string | null;
  result_unit: string | null;
  procurement_request_letter_no?: string | null;
  procurement_request_approval_date?: string | null;
  committee_review_workdays?: number | null;
  egp_doc_request_count?: number | null;
  egp_bid_submission_count?: number | null;
  winning_bidder_name?: string | null;
  winning_bid_amount?: number | null;
  final_agreed_amount?: number | null;
  evaluation_report_letter_no?: string | null;
  evaluation_report_approval_date?: string | null;
  winner_announcement_no?: string | null;
  winner_announcement_date?: string | null;
  appeal_status?: string | null;
  appeal_report_letter_no?: string | null;
  appeal_consideration_status?: string | null;
  appeal_report_approval_date?: string | null;
  committee_appointment_order_no?: string | null;
  committee_appointment_order_date?: string | null;
  committee_appointment_mode?: string | null;
  approved_median_price?: number | null;
  median_price_approval_date?: string | null;
};

type Step = {
  id: string;
  step_number: number;
  step_name: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  note: string | null;
  responsible_officer_name?: string | null;
  step_notes?: string | null;
  step1_checklist?: unknown;
  step2_checklist?: unknown;
  step3_checklist?: unknown;
  completed_by: string | null;
};

type Doc = {
  id: string;
  step_number: number | null;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
};

// ประเภทคณะกรรมการขั้นตอนที่ 2 — ดู STEP2_COMMITTEE_DB_TYPES ใน step-form.ts

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [tab, setTab] = useState<"detail" | "contract">("detail");
  const [error, setError] = useState<string | null>(null);

  // Step edit state
  const [responsibleName, setResponsibleName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  // ขั้นตอนที่ 1
  const [egpCode, setEgpCode] = useState("");
  const [step1Budget, setStep1Budget] = useState("");
  const [step1Method, setStep1Method] = useState("e_bidding");
  const [step1Checklist, setStep1Checklist] = useState({ ...EMPTY_STEP1_CHECKLIST });
  // ขั้นตอนที่ 2
  const [step2Checklist, setStep2Checklist] = useState({ ...EMPTY_STEP2_CHECKLIST });
  const [step2CommitteeOrder, setStep2CommitteeOrder] = useState<Step2CommitteeOrder>({
    ...EMPTY_STEP2_COMMITTEE_ORDER,
  });
  const [step2MedianPrice, setStep2MedianPrice] = useState<Step2MedianPrice>({
    ...EMPTY_STEP2_MEDIAN_PRICE,
  });
  const [step2Committees, setStep2Committees] = useState<Step2CommitteesState>({
    ...EMPTY_STEP2_COMMITTEES,
  });
  const [step2ComplianceLog, setStep2ComplianceLog] = useState<Step2ComplianceLog>({});
  // ขั้นตอนที่ 3
  const [step3Checklist, setStep3Checklist] = useState({ ...EMPTY_STEP3_CHECKLIST });
  const [step3Announcement, setStep3Announcement] = useState<Step3Announcement>({
    ...EMPTY_STEP3_ANNOUNCEMENT,
  });
  const [step3Skipping, setStep3Skipping] = useState(false);
  const [historicalEditUnlocked, setHistoricalEditUnlocked] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [step4BidResult, setStep4BidResult] = useState<Step4BidResult>({
    ...EMPTY_STEP4_BID_RESULT,
  });
  const [step4Checklist, setStep4Checklist] = useState<Step4Checklist>({
    ...EMPTY_STEP4_CHECKLIST,
  });
  const [step5Checklist, setStep5Checklist] = useState<Step5Checklist>({
    ...EMPTY_STEP5_CHECKLIST,
  });
  const [step5Announcement, setStep5Announcement] = useState<Step5Announcement>({
    ...EMPTY_STEP5_ANNOUNCEMENT,
  });
  /** Manual checklist — ขั้นตอนที่ 6–10 */
  const [genericManualChecklist, setGenericManualChecklist] = useState<Record<string, boolean>>(
    {},
  );
  const [step6Appeal, setStep6Appeal] = useState<Step6AppealState>({ ...EMPTY_STEP6_APPEAL });
  const [step7ContractNotice, setStep7ContractNotice] = useState<Step7ContractNotice>({
    ...EMPTY_STEP7_CONTRACT_NOTICE,
  });
  const [step8ContractExecution, setStep8ContractExecution] = useState<Step8ContractExecution>({
    ...EMPTY_STEP8_CONTRACT_EXECUTION,
  });

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return null; }
      const [
        { data: p, error: pErr },
        { data: s, error: sErr },
        { data: d, error: dErr },
        { data: c, error: cErr },
      ] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("procurement_steps").select("*").eq("project_id", projectId).order("step_number"),
        supabase.from("documents").select("*").eq("project_id", projectId),
        supabase.from("committees").select("*").eq("project_id", projectId).in("committee_type", [...STEP2_COMMITTEE_DB_TYPES]).order("created_at"),
      ]);
      const loadErr = pErr ?? sErr ?? dErr ?? cErr;
      if (loadErr) {
        if (/jwt|session|refresh token/i.test(loadErr.message)) {
          await supabase.auth.signOut();
          navigate({ to: "/login" });
          return null;
        }
        throw new Error(loadErr.message);
      }
      return {
        project: p as Project | null,
        steps: ((s as Step[]) ?? []),
        docs: ((d as Doc[]) ?? []),
        committees: (c ?? []) as any[],
      };
    },
  });
  const project = data?.project ?? null;
  const steps = data?.steps ?? [];
  const docs = data?.docs ?? [];
  const committees = data?.committees ?? [];

  const workflowStep = project?.current_step ?? 1;
  const workflowMode = useMemo(
    () => getStepWorkflowMode(activeStep, workflowStep, historicalEditUnlocked),
    [activeStep, workflowStep, historicalEditUnlocked],
  );
  const workflowReadOnly = isWorkflowReadOnly(workflowMode);

  useEffect(() => {
    setHistoricalEditUnlocked(false);
  }, [activeStep]);

  const handleStepNavigation = (stepNumber: number) => {
    if (!project) return;
    if (!canNavigateToStep(stepNumber, project.current_step)) {
      toast.message(
        "ไม่สามารถข้ามไปขั้นตอนถัดไปได้ — กรุณาดำเนินการตามลำดับและกด «บันทึกและไปขั้นตอนถัดไป»",
      );
      return;
    }
    setActiveStep(stepNumber);
  };

  const rollbackCurrentStep = async () => {
    if (!current || !project) return;
    if (!canRollbackWorkflowStep(activeStep, project.current_step)) {
      toast.error("ปุ่มย้อนกลับใช้ได้เฉพาะขั้นตอนปัจจุบันที่กำลังดำเนินการเท่านั้น");
      return;
    }

    const stepNum = current.step_number;
    const prevStep = stepNum - 1;
    const prevStepRecord = steps.find((s) => s.step_number === prevStep);
    if (!prevStepRecord) return;

    if (!window.confirm(getRollbackConfirmMessage(stepNum))) return;

    setRollingBack(true);
    setError(null);
    try {
      const stepDocs = docs.filter((d) => d.step_number === stepNum);
      if (stepDocs.length > 0) {
        const paths = stepDocs.map((d) => d.storage_path);
        const { error: storageErr } = await supabase.storage
          .from("procurement-docs")
          .remove(paths);
        if (storageErr) {
          console.warn("[Rollback] storage delete partial fail", storageErr);
        }
        const totalBytes = stepDocs.reduce((sum, d) => sum + Number(d.file_size ?? 0), 0);
        if (totalBytes > 0) {
          await decrementStorageUsage(project.organization_id, totalBytes);
        }
        const { error: docErr } = await supabase
          .from("documents")
          .delete()
          .eq("project_id", project.id)
          .eq("step_number", stepNum);
        if (docErr) throw new Error(docErr.message);
      }

      if (stepNum === 2) {
        const { error: committeeErr } = await supabase
          .from("committees")
          .delete()
          .eq("project_id", project.id)
          .in("committee_type", [...STEP2_COMMITTEE_DB_TYPES]);
        if (committeeErr) console.warn("[Rollback] committees delete failed", committeeErr);
      }

      const wipePayload = getStepRollbackProcurementStepWipe(stepNum);
      let { error: wipeErr } = await supabase
        .from("procurement_steps")
        .update(wipePayload)
        .eq("id", current.id);
      if (wipeErr) {
        const msg = wipeErr.message;
        const fallback = { ...wipePayload };
        if (msg.includes("step3_checklist")) delete (fallback as { step3_checklist?: unknown }).step3_checklist;
        if (msg.includes("step2_checklist")) delete (fallback as { step2_checklist?: unknown }).step2_checklist;
        if (msg.includes("step1_checklist")) delete (fallback as { step1_checklist?: unknown }).step1_checklist;
        if (msg.includes("responsible_officer_name") || msg.includes("step_notes")) {
          delete (fallback as { responsible_officer_name?: unknown }).responsible_officer_name;
          delete (fallback as { step_notes?: unknown }).step_notes;
        }
        const retry = await supabase.from("procurement_steps").update(fallback).eq("id", current.id);
        wipeErr = retry.error;
      }
      if (wipeErr) throw new Error(wipeErr.message);

      const { error: reopenErr } = await supabase
        .from("procurement_steps")
        .update(getPreviousStepReopenPatch())
        .eq("id", prevStepRecord.id);
      if (reopenErr) throw new Error(reopenErr.message);

      const projectUpdates: Record<string, unknown> = {
        current_step: prevStep,
        ...getStepRollbackProjectWipe(stepNum),
      };
      if (stepNum === 10 && project.status === "completed") {
        projectUpdates.status = "in_progress";
      }
      const { error: projErr } = await supabase
        .from("projects")
        .update(projectUpdates)
        .eq("id", project.id);
      if (projErr) throw new Error(projErr.message);

      setHistoricalEditUnlocked(false);
      setGenericManualChecklist(createEmptyManualChecklist(stepNum));
      setActiveStep(prevStep);
      await invalidateAll();
      toast.success(
        `ย้อนกลับไปขั้นตอนที่ ${prevStep} แล้ว — ล้างข้อมูลขั้นที่ ${stepNum} และเปิดให้แก้ไขขั้นก่อนหน้าได้`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ย้อนกลับไม่สำเร็จ";
      setError(message);
      toast.error(message);
    } finally {
      setRollingBack(false);
    }
  };

  // Sync activeStep to project's current_step on first load
  useEffect(() => {
    if (project) setActiveStep((s) => (s === 1 ? project.current_step : s));
  }, [project?.id]); // eslint-disable-line

  const current = useMemo(() => steps.find((s) => s.step_number === activeStep), [steps, activeStep]);
  const step3Record = useMemo(() => steps.find((s) => s.step_number === 3), [steps]);
  const step4Record = useMemo(() => steps.find((s) => s.step_number === 4), [steps]);
  const step5Record = useMemo(() => steps.find((s) => s.step_number === 5), [steps]);
  const step1Record = useMemo(() => steps.find((s) => s.step_number === 1), [steps]);
  const step1ResponsibleDefault = useMemo(
    () => getStep1ResponsibleOfficer(steps),
    [steps, step1Record?.responsible_officer_name, step1Record?.id],
  );
  const step4Timeline = useMemo(
    () => computeStep4Timeline(project, step3Record?.note ?? null),
    [project, step3Record?.note],
  );

  const mergedStep4BidResult = useMemo(() => {
    if (!project) return { ...EMPTY_STEP4_BID_RESULT };
    if (!step4Record) {
      return mergeStep4BidResultFromProject({ ...EMPTY_STEP4_BID_RESULT }, project);
    }
    const step4Form = loadStep4FormFromNote(step4Record.note);
    return mergeStep4BidResultFromProject(
      step4Form.bidResult ?? { ...EMPTY_STEP4_BID_RESULT },
      project,
    );
  }, [step4Record, project]);

  const step4ContractAmountDefault = useMemo(
    () => resolveDefaultStep8ContractAmount(project, mergedStep4BidResult),
    [project, mergedStep4BidResult],
  );

  const step4ApprovalFromNote = useMemo(
    () => mergedStep4BidResult.evaluation_report_approval_date?.trim() || "",
    [mergedStep4BidResult],
  );

  useEffect(() => {
    if (!steps.length) return;
    const active = steps.find((s) => s.step_number === activeStep);
    setResponsibleName(resolveResponsibleOfficer(active, step1ResponsibleDefault));
  }, [activeStep, step1ResponsibleDefault, steps]);

  useEffect(() => {
    if (!current || !project) return;
    if (current.step_number === 1) {
      setEgpCode(project.project_code ?? "");
      setStep1Budget(formatBudgetInput(String(project.budget ?? 0)));
      const m = project.method ?? "e_bidding";
      setStep1Method(m === "e_market" ? "selection" : m);
      const draft1 = loadStepDraftFields(current);
      const step1Form = loadStep1FormFromStep(current as { note: string | null; step1_checklist?: unknown });
      setStep1Checklist(step1Form.checklist ?? { ...EMPTY_STEP1_CHECKLIST });
      setNote(draft1.userNote);
      setDueDate(draft1.dueDate);
      return;
    }
    if (current.step_number === 2) {
      const step2Form = mergeStep2FormFromProject(
        loadStep2FormFromStep(current as Step),
        project,
      );
      setStep2Checklist(step2Form.checklist ?? { ...EMPTY_STEP2_CHECKLIST });
      setStep2CommitteeOrder({
        ...EMPTY_STEP2_COMMITTEE_ORDER,
        ...step2Form.committeeOrder,
      });
      setStep2MedianPrice({
        ...EMPTY_STEP2_MEDIAN_PRICE,
        ...step2Form.medianPrice,
      });
      setStep2Committees(
        loadStep2CommitteesFromDb(
          committees,
          project.committee_appointment_mode,
          step2Form.committees,
        ),
      );
      setStep2ComplianceLog(step2Form.complianceLog ?? {});
      const draft2 = loadStepDraftFields(current);
      setNote(draft2.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 3) {
      const step3Form = loadStep3FormFromStep(current as Step);
      const draft3 = loadStepDraftFields(current);
      setStep3Checklist(step3Form.checklist ?? { ...EMPTY_STEP3_CHECKLIST });
      setStep3Announcement({
        ...EMPTY_STEP3_ANNOUNCEMENT,
        ...step3Form.announcement,
        procurement_request_letter_no:
          step3Form.announcement?.procurement_request_letter_no?.trim() ||
          project.procurement_request_letter_no ||
          "",
        procurement_request_approval_date:
          step3Form.announcement?.procurement_request_approval_date?.trim() ||
          project.procurement_request_approval_date ||
          "",
        committee_review_workdays:
          step3Form.announcement?.committee_review_workdays != null &&
          step3Form.announcement.committee_review_workdays > 0
            ? step3Form.announcement.committee_review_workdays
            : project.committee_review_workdays ?? null,
      });
      setNote(draft3.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 4) {
      const step4Form = loadStep4FormFromNote(current.note);
      setStep4Checklist(step4Form.checklist ?? { ...EMPTY_STEP4_CHECKLIST });
      setStep4BidResult(
        mergeStep4BidResultFromProject(
          step4Form.bidResult ?? { ...EMPTY_STEP4_BID_RESULT },
          project,
        ),
      );
      const draft4 = loadStepDraftFields(current);
      setNote(draft4.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 5) {
      const step5Form = loadStep5FormFromNote(current.note);
      setStep5Checklist(step5Form.checklist ?? { ...EMPTY_STEP5_CHECKLIST });
      setStep5Announcement(
        mergeStep5FromProject(
          step5Form.announcement ?? { ...EMPTY_STEP5_ANNOUNCEMENT },
          project,
        ),
      );
      const draft5 = loadStepDraftFields(current);
      setNote(draft5.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 6) {
      const draft = loadStepDraftFields(current);
      setGenericManualChecklist(
        normalizeManualChecklist(
          6,
          loadManualChecklistFromNote(current.step_number, current.note),
        ),
      );
      setStep6Appeal(mergeAppealFromProject(project));
      setNote(draft.userNote);
      setDueDate(draft.dueDate);
      return;
    }
    if (current.step_number === 7) {
      const step7Form = loadStep7FormFromNote(current.note);
      setGenericManualChecklist(
        normalizeManualChecklist(7, step7Form.checklist),
      );
      setStep7ContractNotice(
        step7Form.contractNotice ?? { ...EMPTY_STEP7_CONTRACT_NOTICE },
      );
      const draft = loadStepDraftFields(current);
      setNote(draft.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 8) {
      const step8Form = loadStep8FormFromNote(current.note);
      setGenericManualChecklist(
        normalizeManualChecklist(8, step8Form.checklist),
      );
      setStep8ContractExecution(
        mergeStep8FromProject(
          step8Form.contractExecution ?? { ...EMPTY_STEP8_CONTRACT_EXECUTION },
          project,
          mergedStep4BidResult,
        ),
      );
      const draft = loadStepDraftFields(current);
      setNote(draft.userNote);
      setDueDate("");
      return;
    }
    const draft = loadStepDraftFields(current);
    setGenericManualChecklist(loadManualChecklistFromNote(current.step_number, current.note));
    setNote(draft.userNote);
    setDueDate(draft.dueDate);
  }, [current?.id, project?.id, project?.committee_appointment_mode, committees.length, mergedStep4BidResult]); // eslint-disable-line

  const effectiveResponsibleName =
    responsibleName.trim() || step1ResponsibleDefault.trim();

  const step5EvaluationApprovalDate =
    project?.evaluation_report_approval_date?.trim() ||
    step4BidResult.evaluation_report_approval_date?.trim() ||
    step4ApprovalFromNote ||
    "";

  /** วันประกาศผู้ชนะ — ใช้คำนวณระยะอุทธรณ์ขั้น 6 */
  const winnerAnnouncementDate = resolveWinnerAnnouncementDate(
    project,
    step5Record?.note ?? null,
  );

  /** ซิงก์ชื่อเจ้าหน้าที่กลับขั้นตอนที่ 1 (ค่ามาตรฐาน) เมื่อบันทึกจากขั้นอื่น */
  const propagateResponsibleToStep1 = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !step1Record || current?.step_number === 1) return;
    await supabase
      .from("procurement_steps")
      .update(buildStepDraftFields(trimmed, "", ""))
      .eq("id", step1Record.id);
  };

  /** งบ/วิธีจัดซื้อที่ใช้คำนวณ — อ่านจากฟอร์มขั้น 1 ถ้ากำลังอยู่ขั้นนั้น */
  const calcBudget = project
    ? activeStep === 1
      ? parseBudgetInput(step1Budget) || Number(project.budget)
      : Number(project.budget)
    : 0;
  const calcMethod = project
    ? activeStep === 1
      ? step1Method
      : project.method
    : "e_bidding";

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
    ]);
  };

  const setStep2Check = (key: Step2ChecklistKey, checked: boolean) => {
    if (!isManualChecklistKey(2, key)) return;
    setStep2Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const patchStep2CommitteeOrder = (patch: Partial<Step2CommitteeOrder>) => {
    setStep2CommitteeOrder((prev) => ({ ...prev, ...patch }));
  };

  const patchStep2MedianPrice = (patch: Partial<Step2MedianPrice>) => {
    setStep2MedianPrice((prev) => ({ ...prev, ...patch }));
  };

  const setStep3Check = (key: Step3ChecklistKey, checked: boolean) => {
    if (!isManualChecklistKey(3, key)) return;
    setStep3Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const patchStep3Announcement = (patch: Partial<Step3Announcement>) => {
    setStep3Announcement((prev) => ({ ...prev, ...patch }));
  };

  const patchStep4BidResult = (patch: Partial<Step4BidResult>) => {
    setStep4BidResult((prev) => ({ ...prev, ...patch }));
  };

  const patchStep6Appeal = (patch: Partial<Step6AppealState>) => {
    setStep6Appeal((prev) => ({ ...prev, ...patch }));
  };

  const setStep4Check = (key: Step4ChecklistKey, checked: boolean) => {
    if (!isManualChecklistKey(4, key)) return;
    setStep4Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const patchStep5Announcement = (patch: Partial<Step5Announcement>) => {
    setStep5Announcement((prev) => ({ ...prev, ...patch }));
  };

  const setStep5Check = (key: Step5ChecklistKey, checked: boolean) => {
    setStep5Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const setGenericManualCheck = (key: string, checked: boolean) => {
    if (!current || !isManualChecklistKey(current.step_number, key)) return;
    setGenericManualChecklist((prev) => ({ ...prev, [key]: checked }));
  };

  const isManualChecklistKey = (stepNumber: number, key: string) =>
    getSmartChecklistItems(stepNumber).find((i) => i.key === key)?.mode === "manual";

  const setStep1Check = (key: Step1ChecklistKey, checked: boolean) => {
    if (!isManualChecklistKey(1, key)) return;
    setStep1Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const setStep2CommitteeMode = (mode: Step2CommitteeAppointmentMode) => {
    setStep2Committees((prev) => ({ ...prev, appointment_mode: mode }));
  };

  const changeCommitteeMember = (
    listKey: Step2CommitteeListKey,
    index: number,
    value: string,
  ) => {
    setStep2Committees((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((v, i) => (i === index ? value : v)),
    }));
  };

  const addCommitteeMember = (listKey: Step2CommitteeListKey) => {
    setStep2Committees((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], ""],
    }));
  };

  const removeCommitteeMember = (listKey: Step2CommitteeListKey, index: number) => {
    setStep2Committees((prev) =>
      prev[listKey].length <= 3
        ? prev
        : { ...prev, [listKey]: prev[listKey].filter((_, i) => i !== index) },
    );
  };

  /** บันทึกร่างขั้นตอน — ชื่อเจ้าหน้าที่เป็นข้อความใน responsible_officer_name (ไม่ใส่ใน note) */
  const patchStepDraft = async (
    stepId: string,
    fields: ReturnType<typeof buildStepDraftFields>,
    extra?: {
      note?: string | null;
      step1_checklist?: Record<string, boolean> | null;
      step2_checklist?: Record<string, boolean> | null;
      step3_checklist?: Record<string, boolean> | null;
    },
  ) => {
    const payload: Record<string, unknown> = { ...fields };
    if (extra?.note !== undefined) payload.note = extra.note;
    if (extra?.step1_checklist !== undefined) payload.step1_checklist = extra.step1_checklist;
    if (extra?.step2_checklist !== undefined) payload.step2_checklist = extra.step2_checklist;
    if (extra?.step3_checklist !== undefined) payload.step3_checklist = extra.step3_checklist;

    const { error } = await supabase.from("procurement_steps").update(payload).eq("id", stepId);
    if (
      error &&
      error.message.includes("step3_checklist") &&
      extra?.step3_checklist !== undefined
    ) {
      const { step3_checklist: _omit, ...rest } = payload;
      return supabase.from("procurement_steps").update(rest).eq("id", stepId);
    }
    if (
      error &&
      error.message.includes("step2_checklist") &&
      extra?.step2_checklist !== undefined
    ) {
      const { step2_checklist: _omit, ...rest } = payload;
      return supabase.from("procurement_steps").update(rest).eq("id", stepId);
    }
    if (
      error &&
      error.message.includes("step1_checklist") &&
      extra?.step1_checklist !== undefined
    ) {
      const { step1_checklist: _omit, ...rest } = payload;
      return supabase.from("procurement_steps").update(rest).eq("id", stepId);
    }
    if (
      error &&
      (error.message.includes("responsible_officer_name") ||
        error.message.includes("step_notes"))
    ) {
      const legacyNote = [
        fields.step_notes,
        fields.responsible_officer_name
          ? `เจ้าหน้าที่ผู้รับผิดชอบ: ${fields.responsible_officer_name}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      return supabase
        .from("procurement_steps")
        .update({
          due_date: fields.due_date,
          note: extra?.note ?? (legacyNote || null),
        })
        .eq("id", stepId);
    }
    return { error };
  };

  const saveDraft = async () => {
    if (!current || !project) return;
    setError(null);
    if (workflowReadOnly) {
      toast.error("อยู่ในโหมดดูอย่างเดียว — กด «แก้ไขข้อมูลในขั้นตอนนี้» ก่อนบันทึก");
      return;
    }

    const draftSavedToast = (stepLabel: string) => {
      if (canSaveHistoricalEdit(workflowMode)) {
        toast.success(`บันทึกการแก้ไข${stepLabel}เรียบร้อย — ระบบอัปเดต Data Flow แล้ว`);
      } else {
        toast.success(`บันทึกร่าง${stepLabel}เรียบร้อย`);
      }
    };

    if (current.step_number === 1) {
      const budgetVal = parseBudgetInput(step1Budget);
      const formNote = serializeStepNote(note, { checklist: step1Checklist });
      const { error: pe } = await supabase
        .from("projects")
        .update({
          project_code: egpCode.trim() || project.project_code,
          budget: budgetVal,
          method: step1Method,
        })
        .eq("id", project.id);
      if (pe) {
        setError(pe.message);
        return;
      }
      const { error: se } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, dueDate),
        { note: formNote || null, step1_checklist: step1Checklist },
      );
      if (se?.error) {
        setError(se.error.message);
        return;
      }
      draftSavedToast("ขั้นตอนที่ 1 ");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 2) {
      if (
        isStep2MedianApprovalBeforeAppointment(
          step2MedianPrice.median_price_approval_date ?? "",
          step2CommitteeOrder.appointment_order_date ?? "",
        )
      ) {
        toast.error(STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG);
        setError(STEP2_MEDIAN_APPROVAL_BEFORE_APPOINTMENT_MSG);
        return;
      }
      const complianceLog = buildStep2ComplianceLog(
        step2CommitteeOrder,
        step2MedianPrice,
        step2ComplianceLog,
      );
      const formNote = serializeStepNote(note, {
        checklist: step2Checklist,
        committeeOrder: step2CommitteeOrder,
        medianPrice: step2MedianPrice,
        committees: step2Committees,
        complianceLog,
      });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, ""),
        { note: formNote || null, step2_checklist: step2Checklist },
      );
      if (e?.error) {
        setError(e.error.message);
        return;
      }

      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectStep2Fields(step2CommitteeOrder, step2MedianPrice, step2Committees))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step2] project fields sync failed", projErr);
        toast.warning(
          `บันทึกรูปแบบคณะกรรมการลงตาราง projects ไม่สำเร็จ: ${projErr.message} — รัน migration 20260607060000 ใน Supabase SQL Editor`,
        );
      }

      // IMPORTANT: Step2 checklist must persist even if committees table permissions are missing.
      // Therefore, committee sync is best-effort and should not block draft save.
      let committeeSyncOk = true;
      try {
        const { error: delErr } = await supabase
          .from("committees")
          .delete()
          .eq("project_id", project.id)
          .in("committee_type", [...STEP2_COMMITTEE_DB_TYPES]);
        if (delErr) {
          console.error("[Step2] committees delete failed", delErr);
          committeeSyncOk = false;
          toast.error(`บันทึกรายชื่อคณะกรรมการไม่สำเร็จ: ${delErr.message}`);
        } else {
          const candidateRows = buildStep2CommitteeRows(project, step2Committees);
          if (candidateRows.length > 0) {
            let inserted = false;
            let lastInsertError: string | null = null;

            const insertProfiles = getStep2CommitteeInsertProfiles(
              step2Committees.appointment_mode,
            );
            for (const profile of insertProfiles) {
              const rows = buildStep2CommitteeRows(project, step2Committees, profile);
              const { error: insErr } = await supabase.from("committees").insert(rows);
              if (!insErr) {
                inserted = true;
                break;
              }
              lastInsertError = insErr.message;
              if (!isStep2CommitteeTypeCheckError(insErr.message)) {
                break;
              }
            }

            if (!inserted) {
              committeeSyncOk = false;
              console.error("[Step2] committees insert failed", lastInsertError);
              toast.error(
                `บันทึกรายชื่อคณะกรรมการไม่สำเร็จ: ${lastInsertError ?? "unknown error"}`,
              );
            }
          }
        }
      } catch (committeeErr: any) {
        committeeSyncOk = false;
        console.error("[Step2] committees sync exception", committeeErr);
        toast.error(`บันทึกรายชื่อคณะกรรมการไม่สำเร็จ: ${committeeErr?.message ?? "unknown error"}`);
      }

      setStep2ComplianceLog(complianceLog);
      logStep2ComplianceWarnings(project.id, complianceLog, {
        appointmentDate: step2CommitteeOrder.appointment_order_date ?? "",
        medianApprovalDate: step2MedianPrice.median_price_approval_date ?? "",
      });

      if (committeeSyncOk) {
        draftSavedToast("ขั้นตอนที่ 2 ");
      } else {
        toast.warning(
          "บันทึกข้อมูลหลักขั้นตอนที่ 2 แล้ว แต่รายชื่อคณะกรรมการลงตาราง committees ไม่สำเร็จ — รัน migration 20260607080000 ใน Supabase SQL Editor",
        );
      }
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 3) {
      const formNote = serializeStepNote(note, {
        checklist: step3Checklist,
        announcement: step3Announcement,
      });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, ""),
        { note: formNote || null, step3_checklist: step3Checklist },
      );
      if (e?.error) {
        setError(e.error.message);
        return;
      }
      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectProcurementRequestFields(step3Announcement))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step3] project procurement fields sync failed", projErr);
      }
      draftSavedToast("ขั้นตอนที่ 3 ");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 4) {
      const formNote = serializeStepNote(note, {
        checklist: step4Checklist,
        bidResult: step4BidResult,
      });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, ""),
        { note: formNote || null },
      );
      if (e?.error) {
        setError(e.error.message);
        return;
      }
      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectStep4Fields(step4BidResult))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step4] project bid result sync failed", projErr);
      }
      draftSavedToast("ขั้นตอนที่ 4 ");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 5) {
      if (
        step5Announcement.winner_announcement_date?.trim() &&
        step5EvaluationApprovalDate &&
        isStep5WinnerAnnouncementBeforeEvaluation(
          step5Announcement.winner_announcement_date,
          step5EvaluationApprovalDate,
        )
      ) {
        const msg = getStep5WinnerAnnouncementBeforeEvaluationMsg(step5EvaluationApprovalDate);
        toast.error(msg);
        setError(msg);
        return;
      }
      const formNote = serializeStepNote(note, {
        checklist: step5Checklist,
        announcement: step5Announcement,
      });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, ""),
        { note: formNote || null },
      );
      if (e?.error) {
        setError(e.error.message);
        return;
      }
      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectStep5Fields(step5Announcement))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step5] winner announcement sync failed", projErr);
      }
      draftSavedToast("ขั้นตอนที่ 5 ");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 6) {
      const formNote = serializeStepNote(note, { checklist: genericManualChecklist });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, note, ""),
        { note: formNote || null },
      );
      if (e?.error) {
        setError(e.error.message);
        return;
      }
      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectAppealFields(step6Appeal))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step6] appeal fields sync failed", projErr);
      }
      draftSavedToast("ขั้นตอนที่ 6 ");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    const formNote =
      current.step_number === 7
        ? serializeStepNote(note, {
            checklist: genericManualChecklist,
            contractNotice: step7ContractNotice,
          })
        : current.step_number === 8
          ? serializeStepNote(note, {
              checklist: genericManualChecklist,
              contractExecution: step8ContractExecution,
            })
          : current.step_number >= 9
            ? serializeStepNote(note, { checklist: genericManualChecklist })
            : null;
    const { error: e } = await patchStepDraft(
      current.id,
      buildStepDraftFields(effectiveResponsibleName, note, dueDate),
      formNote ? { note: formNote || null } : undefined,
    );
    if (e?.error) {
      setError(e.error.message);
      return;
    }
    if (current.step_number === 8) {
      const { error: projErr } = await supabase
        .from("projects")
        .update(buildProjectStep8Fields(step8ContractExecution))
        .eq("id", project.id);
      if (projErr) {
        console.warn("[Step8] contract fields sync failed", projErr);
      }
    }
    await propagateResponsibleToStep1(effectiveResponsibleName);
    await invalidateAll();
  };

  const advanceToNextStep = async () => {
    if (!current || !project) return;
    const { data: u } = await supabase.auth.getUser();
    const draftFields =
      current.step_number === 3 || current.step_number === 4
        ? buildStepDraftFields(effectiveResponsibleName, note, "")
        : buildStepDraftFields(effectiveResponsibleName, note, dueDate);
    const { error: e1 } = await supabase.from("procurement_steps").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: u.user?.id ?? null,
      ...draftFields,
    }).eq("id", current.id);
    if (e1) {
      setError(e1.message);
      return false;
    }
    await propagateResponsibleToStep1(effectiveResponsibleName);

    const nextStep = Math.min(10, current.step_number + 1);
    const updates: Record<string, unknown> = { current_step: nextStep };
    if (current.step_number === 10) updates.status = "completed";
    await supabase.from("projects").update(updates).eq("id", project.id);

    if (nextStep !== current.step_number) {
      await supabase
        .from("procurement_steps")
        .update({ status: "in_progress" })
        .eq("project_id", project.id)
        .eq("step_number", nextStep)
        .eq("status", "pending");
    }
    setActiveStep(nextStep);
    await invalidateAll();
    return true;
  };

  const completeStep = async (opts?: { skipDocValidation?: boolean }) => {
    if (!current || !project) return;
    if (!canCompleteWorkflowStep(activeStep, project.current_step, current.status)) {
      toast.error("ดำเนินการไปขั้นถัดไปได้เฉพาะขั้นตอนปัจจุบันเท่านั้น");
      return;
    }
    if (current.step_number === 3) {
      const tier = getStep3HearingTier(Number(project.budget));
      const hearingFormActive = shouldShowStep3HearingForm(
        tier,
        !!step3Announcement.hearing_proceed,
        !!step3Announcement.hearing_skipped,
      );
      if (hearingFormActive) {
        const pubErr = validateStep3PublicationDates(
          step3Announcement.publication_start,
          step3Announcement.publication_end,
        );
        if (pubErr) {
          toast.error(pubErr);
          setError(pubErr);
          return;
        }
        const step3Docs = docs.filter((d) => d.step_number === 3);
        const step3ComplianceIssues = getStep3ComplianceIssues(step3Checklist, {
          announcement: step3Announcement,
          responsibleName: effectiveResponsibleName,
          approvedMedianPrice: project.approved_median_price ?? null,
          medianPriceApprovalDate: project.median_price_approval_date ?? null,
          hasMemoDoc: step3Docs.some((d) => d.document_type === STEP3_DOC.MEMO_APPROVAL),
          hasDraftTorDoc: step3Docs.some((d) => d.document_type === STEP3_DOC.DRAFT_TOR_SPEC),
          hasDraftAnnouncementDoc: step3Docs.some(
            (d) => d.document_type === STEP3_DOC.DRAFT_ANNOUNCEMENT_BID,
          ),
          hasBg06Doc:
            docs.some(
              (d) =>
                d.step_number === 2 && d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06,
            ) || step3Docs.some((d) => d.document_type === STEP3_DOC.MEDIAN_BG06),
          hasEgpAnnouncementDoc: step3Docs.some(
            (d) => d.document_type === STEP3_DOC.EGP_ANNOUNCEMENT,
          ),
          hasEgpScreenshotDoc: step3Docs.some(
            (d) => d.document_type === STEP3_DOC.EGP_SCREENSHOT,
          ),
          hearingFormActive: true,
        });
        if (step3ComplianceIssues.length > 0) {
          toast.error(step3ComplianceIssues[0].message);
          setError(step3ComplianceIssues[0].message);
          return;
        }
      }
    }
    if (current.step_number === 2) {
      const hasAppointmentDoc = docs
        .filter((d) => d.step_number === 2)
        .some((d) => d.document_type === STEP2_DOC.APPOINTMENT_ORDER);
      const hasBg06Doc = docs
        .filter((d) => d.step_number === 2)
        .some((d) => d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06);
      const complianceIssues = getStep2ComplianceIssues(step2Checklist, {
        committees: step2Committees,
        committeeOrder: step2CommitteeOrder,
        medianPrice: step2MedianPrice,
        responsibleName: effectiveResponsibleName,
        hasAppointmentOrderDoc: hasAppointmentDoc,
        hasBg06Doc,
      });
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 1) {
      const complianceIssues = getStep1ComplianceIssues(step1Checklist, {
        egpCode,
        budget: step1Budget,
        responsibleName: effectiveResponsibleName,
      });
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 5) {
      const step5Docs = docs.filter((d) => d.step_number === 5);
      const step5Uploaded = step5Docs.map((d) => d.document_type);
      const complianceIssues = getStep5ComplianceIssues(
        step5Checklist,
        step5Announcement,
        {
          hasEgpWinnerDoc: hasStep5EgpWinnerDoc(step5Uploaded),
          hasPhysicalBoardDoc: hasStep5PhysicalBoardDoc(step5Uploaded),
          evaluationApprovalDate: step5EvaluationApprovalDate,
          stepDocs: step5Docs,
        },
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 6) {
      const step6Docs = docs.filter((d) => d.step_number === 6);
      const step6Uploaded = step6Docs.map((d) => d.document_type);
      const step6Checklist = normalizeManualChecklist(
        6,
        genericManualChecklist,
      ) as Step6Checklist;
      const complianceIssues = getStep6ComplianceIssues(
        step6Appeal,
        step6Checklist,
        {
          hasNoAppealEgpDoc: hasStep6NoAppealEgpDoc(step6Uploaded),
          hasAgencyReportDoc: hasStep6AgencyReportDoc(step6Uploaded),
          hasCgdReportDoc: hasStep6CgdReportDoc(step6Uploaded),
          responsibleName: effectiveResponsibleName,
          stepDocs: step6Docs,
        },
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 7) {
      const step7Docs = docs.filter((d) => d.step_number === 7);
      const appealDeadlineISO = winnerAnnouncementDate
        ? computeAppealDeadlineISO(winnerAnnouncementDate)
        : "";
      const complianceIssues = getStep7ComplianceIssues(
        step7ContractNotice,
        genericManualChecklist,
        {
          responsibleName: effectiveResponsibleName,
          appealDeadlineISO,
          stepDocs: step7Docs,
        },
        computeAutoChecklistState({
          stepNumber: 7,
          step7ContractNotice,
        }),
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 8) {
      const step8Docs = docs.filter((d) => d.step_number === 8);
      const appealDeadlineISO = winnerAnnouncementDate
        ? computeAppealDeadlineISO(winnerAnnouncementDate)
        : "";
      const earliestSigningISO = winnerAnnouncementDate
        ? computeContractEarliestISO(winnerAnnouncementDate)
        : "";
      const complianceIssues = getStep8ComplianceIssues(
        step8ContractExecution,
        genericManualChecklist,
        {
          responsibleName: effectiveResponsibleName,
          earliestSigningISO,
          appealDeadlineISO,
          stepDocs: step8Docs,
        },
        computeAutoChecklistState({
          stepNumber: 8,
          step8ContractExecution,
        }),
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number >= 9 && current.step_number <= 10) {
      const stepDocs = docs.filter((d) => d.step_number === current.step_number);
      const requiredDocs = (STEP_DOCS_DETAILED[current.step_number - 1] ?? []).filter(
        (d) => d.required,
      );
      const complianceIssues = getGenericStepComplianceIssues(
        current.step_number,
        genericManualChecklist,
        computeAutoChecklistState({
          stepNumber: current.step_number,
          responsibleName: effectiveResponsibleName,
          requiredDocs,
          uploadedDocTypes: stepDocs.map((d) => d.document_type),
        }),
        {
          responsibleName: effectiveResponsibleName,
          requiredDocs,
          uploadedDocTypes: stepDocs.map((d) => d.document_type),
        },
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    if (current.step_number === 4) {
      const step4Uploaded = docs
        .filter((d) => d.step_number === 4)
        .map((d) => d.document_type);
      const complianceIssues = getStep4ComplianceIssues(
        step4Checklist,
        step4BidResult,
        {
          responsibleName: effectiveResponsibleName,
          hasEgpBidSummaryDoc: hasStep4EgpBidSummaryDoc(step4Uploaded),
          hasBlacklistEvidenceDoc: hasStep4BlacklistEvidenceDoc(step4Uploaded),
          hasConflictEvidenceDoc: hasStep4ConflictEvidenceDoc(step4Uploaded),
          hasCommitteeEvaluationDoc: hasStep4CommitteeReportDoc(step4Uploaded),
          timeline: step4Timeline,
        },
      );
      if (complianceIssues.length > 0) {
        toast.error(complianceIssues[0].message);
        setError(complianceIssues[0].message);
        return;
      }
    }
    await saveDraft();
    if (!opts?.skipDocValidation) {
      const stepDocs = STEP_DOCS_DETAILED[current.step_number - 1] ?? [];
      const requiredDocs = stepDocs.filter((d) => d.required).map((d) => d.name);
      const uploaded = docs
        .filter((d) => d.step_number === current.step_number)
        .map((d) => d.document_type);
      const missing = requiredDocs.filter((name) => {
        if (current.step_number === 4) {
          return !isStep4RequiredDocSatisfied(name, uploaded);
        }
        if (current.step_number === 5) {
          return !isStep5RequiredDocSatisfied(name, uploaded);
        }
        return !uploaded.includes(name);
      });
      if (missing.length > 0) {
        alert(
          `บันทึกข้อมูลเรียบร้อย ✓\n\nแต่เอกสารที่จำเป็นยังไม่ครบ (${missing.length} รายการ):\n- ${missing.join("\n- ")}\n\nกรุณาอัปโหลดเอกสารบังคับให้ครบก่อนยืนยันขั้นตอนถัดไป`,
        );
        return;
      }
    }
    const ok = await advanceToNextStep();
    if (ok) toast.success("ยืนยันเสร็จสิ้นขั้นตอนแล้ว");
  };

  const proceedStep3Hearing = () => {
    if (!project || activeStep !== project.current_step || workflowReadOnly) return;
    patchStep3Announcement({ hearing_proceed: true, hearing_skipped: false, skip_reason: undefined });
    toast.message("ดำเนินการจัดฟังคำวิจารณ์ร่างประกาศ — กรุณากรอกข้อมูลและแนบเอกสารให้ครบ");
  };

  const skipStep3 = async (reason: Step3SkipReason) => {
    if (!current || !project || current.step_number !== 3) return;
    if (activeStep !== project.current_step || workflowReadOnly) return;
    const label =
      reason === "exempt"
        ? "ข้ามขั้นตอนรับฟังความคิดเห็น (ยกเว้นตามวงเงิน)"
        : "ข้ามการฟังคำวิจารณ์ร่างประกาศ (ดุลยพินิจหัวหน้าหน่วยงาน)";
    if (!window.confirm(`ยืนยัน${label} และไปขั้นตอนที่ 4 (รายงานขอซื้อขอจ้าง) ทันที?`)) return;

    setStep3Skipping(true);
    setError(null);
    try {
      const updatedAnnouncement: Step3Announcement = {
        ...step3Announcement,
        hearing_skipped: true,
        skip_reason: reason,
        hearing_proceed: false,
      };
      setStep3Announcement(updatedAnnouncement);
      const formNote = serializeStepNote(note, {
        checklist: step3Checklist,
        announcement: updatedAnnouncement,
      });
      const { error: saveErr } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, "", ""),
        { note: formNote || null, step3_checklist: step3Checklist },
      );
      if (saveErr?.error) {
        setError(saveErr.error.message);
        return;
      }
      const ok = await advanceToNextStep();
      if (ok) toast.success(`${label} — ไปขั้นตอนที่ 4 แล้ว`);
    } finally {
      setStep3Skipping(false);
    }
  };

  if (loading) {
    return <AppShell breadcrumb="โครงการ"><p className="text-sm text-muted-foreground">กำลังโหลด...</p></AppShell>;
  }
  if (!project) {
    return <AppShell breadcrumb="โครงการ"><p className="text-sm text-destructive">ไม่พบโครงการ</p></AppShell>;
  }

  const docsForStep = docs.filter((d) => d.step_number === activeStep);

  return (
    <AppShell breadcrumb={`โครงการ / ${project.name}`}>
      <GuideModeProvider>
      <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> กลับไปยังรายการโครงการ
        </Link>

        {/* Header */}
        <div className="bg-card border rounded-[10px] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{project.project_code}</p>
              {project.description && (
                <p className="text-sm mt-3 max-w-2xl">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <Info label="งบประมาณ" value={`฿ ${formatBaht(Number(project.budget))}`} />
                {(() => {
                  const median = resolveProjectMedianPrice(project);
                  return median != null && median > 0 ? (
                    <Info label="ราคากลาง" value={`฿ ${formatBaht(median)}`} />
                  ) : null;
                })()}
                <Info label="วิธีจัดซื้อ" value={METHOD_LABEL[project.method] ?? project.method} />
                <Info label="ปีงบประมาณ" value={String(project.fiscal_year)} />
                {project.district_office && <Info label="สพข./เขต" value={project.district_office} />}
                {project.design_code && <Info label="รหัสแบบ/รหัสโครงการ" value={project.design_code} />}
                {project.approving_agency && <Info label="หน่วยงานที่อนุมัติเบิกจ่าย" value={project.approving_agency} />}
                {project.procurement_agency && <Info label="หน่วยงานที่ดำเนินการจัดซื้อจัดจ้าง" value={project.procurement_agency} />}
                {project.result_unit && <Info label="ผลสะสม (หน่วย)" value={project.result_unit} />}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">
                  ขั้นตอน {project.current_step}/10
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/projects/$projectId/construction"
                  params={{ projectId: project.id }}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" /> ติดตามก่อสร้าง
                </Link>
                <button onClick={() => window.print()} className="h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div className="bg-card border rounded-[10px] p-5">
          <h3 className="font-semibold mb-1">ความคืบหน้า 10 ขั้นตอน</h3>
          <p className="text-xs text-muted-foreground mb-4">
            คลิกขั้นตอนที่เคยทำแล้วเพื่อย้อนกลับดู/แก้ไขได้ — ขั้นตอนในอนาคตล็อกจนกว่าจะกด «บันทึกและไปขั้นตอนถัดไป»
          </p>
          <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
            {steps.map((s) => {
              const isActive = s.step_number === activeStep;
              const isDone = s.status === "completed";
              const isPast = s.step_number < workflowStep;
              const isLocked = isStepForwardLocked(s.step_number, workflowStep);
              const canNav = canNavigateToStep(s.step_number, workflowStep);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canNav}
                  onClick={() => handleStepNavigation(s.step_number)}
                  title={
                    isLocked
                      ? "ล็อก — ดำเนินการตามลำดับและกด «บันทึกและไปขั้นตอนถัดไป»"
                      : isPast || isDone
                        ? "คลิกเพื่อย้อนกลับดูข้อมูลขั้นตอนนี้"
                        : isActive
                          ? "ขั้นตอนที่กำลังดูอยู่"
                          : "ขั้นตอนปัจจุบัน"
                  }
                  className={`relative p-3 rounded-md text-xs text-center transition border-2 ${
                    !canNav
                      ? "bg-muted/30 border-transparent text-muted-foreground/50 cursor-not-allowed opacity-60"
                      : isActive
                        ? "bg-primary/5 border-primary text-primary font-medium cursor-pointer"
                        : isPast || isDone
                          ? "bg-success/15 border-success/30 text-success-foreground hover:bg-success/20 cursor-pointer"
                          : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted cursor-pointer"
                  }`}
                >
                  {(isDone || isPast) && (
                    <Check className="absolute top-1 right-1 h-3 w-3 text-success" />
                  )}
                  <div className="font-medium">{EGP_MILESTONE_SHORT[s.step_number - 1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline summary */}
        <ProjectTimeline
          project={project}
          steps={steps}
          step3Note={step3Record?.note ?? null}
        />

        {/* Detail panel */}
        {current && (() => {
          const prevStep = steps.find((s) => s.step_number === current.step_number - 1);
          const stepStartDate =
            current.step_number === 1
              ? project.created_at
              : prevStep?.completed_at ?? new Date().toISOString();
          const step3Tier =
            current.step_number === 3 ? getStep3HearingTier(calcBudget) : null;
          const showStep3HearingForm =
            current.step_number === 3 &&
            step3Tier != null &&
            shouldShowStep3HearingForm(
              step3Tier,
              !!step3Announcement.hearing_proceed,
              !!step3Announcement.hearing_skipped,
            );
          const minDays =
            current.step_number === 3
              ? 0
              : getStepMinDays(current.step_number, calcMethod, calcBudget);
          const appealDeadlineDate =
            winnerAnnouncementDate
              ? parseISODateLocal(computeAppealDeadlineISO(winnerAnnouncementDate))
              : null;
          const step7AppealDeadlineISO =
            current.step_number === 7 && winnerAnnouncementDate
              ? computeAppealDeadlineISO(winnerAnnouncementDate)
              : "";
          const step7NotificationDeadlineISO =
            current.step_number === 7 && winnerAnnouncementDate
              ? computeContractNotificationDeadlineISO(winnerAnnouncementDate)
              : "";
          const step7LetterDateTooLate =
            current.step_number === 7 &&
            !!step7ContractNotice?.contract_notice_letter_date?.trim() &&
            !!step7NotificationDeadlineISO &&
            step7ContractNotice.contract_notice_letter_date > step7NotificationDeadlineISO;
          const step8AppealDeadlineISO =
            (current.step_number === 7 || current.step_number === 8) && winnerAnnouncementDate
              ? computeAppealDeadlineISO(winnerAnnouncementDate)
              : "";
          const step8EarliestSigningISO =
            current.step_number === 8 && winnerAnnouncementDate
              ? computeContractEarliestISO(winnerAnnouncementDate)
              : "";
          const minDeadline =
            (current.step_number === 6 ? appealDeadlineDate : null) ??
            (minDays > 0 ? addWorkdays(new Date(stepStartDate), minDays) : null);
          const dueDateObj = dueDate ? new Date(dueDate) : null;
          const dueValid = !!dueDateObj && !isNaN(dueDateObj.getTime());
          const isContractStep = current.step_number === 8;
          const contractMaxDeadline = isContractStep
            ? addWorkdays(new Date(stepStartDate), 7)
            : null;
          const dueTooEarly =
            !!minDeadline &&
            dueValid &&
            dueDateObj! < minDeadline;
          const dueTooLateContract =
            isContractStep &&
            !!contractMaxDeadline &&
            dueValid &&
            dueDateObj! > contractMaxDeadline;
          const stepDocsForAuto = docs.filter((d) => d.step_number === current.step_number);
          const uploadedDocTypesForAuto = stepDocsForAuto.map((d) => d.document_type);
          const requiredDocsForStep = STEP_DOCS_DETAILED[current.step_number - 1] ?? [];
          const step3DocsForAuto = docs.filter((d) => d.step_number === 3);
          const autoCheckStates = computeAutoChecklistState({
            stepNumber: current.step_number,
            responsibleName: effectiveResponsibleName,
            egpCode,
            budget: step1Budget,
            committees: step2Committees,
            committeeOrder: step2CommitteeOrder,
            medianPrice: step2MedianPrice,
            announcement: step3Announcement,
            bidResult: step4BidResult,
            approvedMedianPrice: project.approved_median_price ?? null,
            medianPriceApprovalDate: project.median_price_approval_date ?? null,
            hasAppointmentOrderDoc: stepDocsForAuto.some(
              (d) => d.document_type === STEP2_DOC.APPOINTMENT_ORDER,
            ),
            hasBg06Doc:
              docs.some(
                (d) =>
                  d.step_number === 2 && d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06,
              ) ||
              step3DocsForAuto.some((d) => d.document_type === STEP3_DOC.MEDIAN_BG06) ||
              stepDocsForAuto.some((d) => d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06),
            hasDraftTorDoc: step3DocsForAuto.some(
              (d) => d.document_type === STEP3_DOC.DRAFT_TOR_SPEC,
            ),
            hasDraftAnnouncementDoc: step3DocsForAuto.some(
              (d) => d.document_type === STEP3_DOC.DRAFT_ANNOUNCEMENT_BID,
            ),
            hasEgpAnnouncementDoc: step3DocsForAuto.some(
              (d) => d.document_type === STEP3_DOC.EGP_ANNOUNCEMENT,
            ),
            hasEgpScreenshotDoc: step3DocsForAuto.some(
              (d) => d.document_type === STEP3_DOC.EGP_SCREENSHOT,
            ),
            hasEgpBidSummaryDoc: hasStep4EgpBidSummaryDoc(
              stepDocsForAuto.map((d) => d.document_type),
            ),
            hasBlacklistEvidenceDoc: hasStep4BlacklistEvidenceDoc(
              stepDocsForAuto.map((d) => d.document_type),
            ),
            hasConflictEvidenceDoc: hasStep4ConflictEvidenceDoc(
              stepDocsForAuto.map((d) => d.document_type),
            ),
            hasCommitteeEvaluationDoc: hasStep4CommitteeReportDoc(
              stepDocsForAuto.map((d) => d.document_type),
            ),
            appealStatus:
              current.step_number === 6
                ? step6Appeal.appeal_status
                : project.appeal_status ?? undefined,
            step6Appeal:
              current.step_number === 6
                ? {
                    appeal_report_letter_no: step6Appeal.appeal_report_letter_no,
                    appeal_report_approval_date: step6Appeal.appeal_report_approval_date,
                  }
                : undefined,
            step5Announcement,
            step7ContractNotice:
              current.step_number === 7 ? step7ContractNotice : undefined,
            step8ContractExecution:
              current.step_number === 8 ? step8ContractExecution : undefined,
            evaluationApprovalDate: step5EvaluationApprovalDate,
            requiredDocs: requiredDocsForStep,
            uploadedDocTypes: uploadedDocTypesForAuto,
          });
          const isStepCompletedView =
            current.status === "completed" && workflowMode !== "historical_edit";
          return (
          <>
            <StepWorkflowBanner
              mode={workflowMode}
              stepNumber={current.step_number}
              currentWorkflowStep={workflowStep}
              onUnlockEdit={() => setHistoricalEditUnlocked(true)}
            />
            {!isStepCompletedView && current.step_number <= 8 && (
              <div className="flex justify-end">
                <GuideModeToggle />
              </div>
            )}
            {!isStepCompletedView && (
            <GuidelineBox
              stepNumber={current.step_number}
              method={calcMethod}
              budget={calcBudget}
              stepStartDate={stepStartDate}
              step4Timeline={
                current.step_number === 4 ? step4Timeline : undefined
              }
              winnerAnnouncementDate={
                current.step_number === 6 ||
                current.step_number === 7 ||
                current.step_number === 8
                  ? winnerAnnouncementDate
                  : undefined
              }
              readOnly={workflowReadOnly}
              onSkipStep3={
                current.step_number === 3 && !workflowReadOnly ? skipStep3 : undefined
              }
              onProceedStep3Hearing={
                current.step_number === 3 && !workflowReadOnly
                  ? proceedStep3Hearing
                  : undefined
              }
              step3HearingProceed={!!step3Announcement.hearing_proceed}
              step3Skipping={step3Skipping}
            />
            )}
          <div className="bg-card border rounded-[10px]">
            <div className="border-b px-5 flex gap-1">
              <TabBtn active={tab === "detail"} onClick={() => setTab("detail")}>
                {current.step_number <= 5 ? "ขั้นตอนนี้ (Workflow)" : "รายละเอียด"}
              </TabBtn>
              {current.step_number === 8 && (
                <TabBtn active={tab === "contract"} onClick={() => setTab("contract")}>ข้อมูลสัญญา</TabBtn>
              )}
            </div>

            <div className="p-5">
              {tab === "contract" && current.step_number === 8 ? (
                <ContractForm project={project} onSaved={invalidateAll} />
              ) : (
                <fieldset
                  disabled={workflowReadOnly}
                  className={`space-y-4 max-w-2xl min-w-0 border-0 p-0 m-0 ${
                    workflowReadOnly ? "opacity-90" : ""
                  }`}
                >
                  {isStepCompletedView ? (
                    <CompletedStepView
                      stepNumber={current.step_number}
                      stepLabel={getMilestoneLabel(current.step_number)}
                      docList={STEP_DOCS_DETAILED[current.step_number - 1] ?? []}
                      docs={docsForStep}
                      projectName={project.name}
                    />
                  ) : (
                  <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                    <h3 className="text-lg font-semibold">
                      ขั้นตอนที่ {current.step_number}: {getMilestoneLabel(current.step_number)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      ระยะเวลา/ข้อควรระวัง:{" "}
                      {current.step_number === 3
                        ? "รับฟังความคิดเห็นร่างประกาศ/TOR ตามวงเงินงบประมาณ (ดูกล่องไกด์ไลน์ด้านบน)"
                        : EGP_STEP_LEGAL_HINTS[current.step_number - 1]}
                    </p>
                    </div>
                    <StepAuditZipButton
                      stepNumber={current.step_number}
                      stepLabel={getMilestoneLabel(current.step_number)}
                      docs={docs}
                    />
                  </div>
                  {current.step_number === 1 && (
                    <Step1DetailForm
                      checklist={step1Checklist}
                      onChecklistChange={setStep1Check}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      egpCode={egpCode}
                      onEgpCodeChange={setEgpCode}
                      budget={step1Budget}
                      onBudgetChange={setStep1Budget}
                      method={step1Method}
                      onMethodChange={setStep1Method}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      docBinder={{
                        project,
                        stepNumber: 1,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number === 2 && (
                    <Step2DetailForm
                      checklist={step2Checklist}
                      onChecklistChange={setStep2Check}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      committees={step2Committees}
                      onCommitteeModeChange={setStep2CommitteeMode}
                      onCommitteeChange={changeCommitteeMember}
                      onAddCommittee={addCommitteeMember}
                      onRemoveCommittee={removeCommitteeMember}
                      committeeOrder={step2CommitteeOrder}
                      onCommitteeOrderChange={patchStep2CommitteeOrder}
                      medianPrice={step2MedianPrice}
                      onMedianPriceChange={patchStep2MedianPrice}
                      step1Budget={calcBudget}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      docBinder={{
                        project,
                        stepNumber: 2,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                      complianceLog={step2ComplianceLog}
                    />
                  )}
                  {current.step_number === 3 && showStep3HearingForm && (
                    <Step3DetailForm
                      checklist={step3Checklist}
                      onChecklistChange={setStep3Check}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      announcement={step3Announcement}
                      onAnnouncementChange={patchStep3Announcement}
                      approvedMedianPrice={project.approved_median_price ?? null}
                      medianPriceApprovalDate={project.median_price_approval_date ?? null}
                      step2Bg06Uploaded={docs.some(
                        (d) =>
                          d.step_number === 2 &&
                          d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06,
                      )}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      docBinder={{
                        project,
                        stepNumber: 3,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number === 3 && !showStep3HearingForm && current.status !== "completed" && (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
                      {step3Tier === "exempt"
                        ? "โครงการวงเงินไม่เกิน 5 ล้านบาท — กดปุ่ม «ข้ามขั้นตอนนี้อัตโนมัติ» ในกล่องไกด์ไลน์ด้านบนเพื่อไปขั้นตอนที่ 4"
                        : "หากหัวหน้าหน่วยงานไม่จัดฟังคำวิจารณ์ กดปุ่มข้ามในกล่องไกด์ไลน์ — หรือกด «ดำเนินการจัดฟังคำวิจารณ์» เพื่อเปิดฟอร์มบันทึกข้อมูล"}
                    </p>
                  )}
                  {current.step_number === 4 && (
                    <Step4DetailForm
                      checklist={step4Checklist}
                      onChecklistChange={setStep4Check}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      bidResult={step4BidResult}
                      onBidResultChange={patchStep4BidResult}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      step4Timeline={step4Timeline}
                      docBinder={{
                        project,
                        stepNumber: 4,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number === 5 && (
                    <Step5DetailForm
                      checklist={step5Checklist}
                      onChecklistChange={setStep5Check}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      announcement={step5Announcement}
                      onAnnouncementChange={patchStep5Announcement}
                      evaluationApprovalDate={step5EvaluationApprovalDate}
                      docBinder={{
                        project,
                        stepNumber: 5,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number === 6 && (
                    <Step6AppealForm
                      checklist={
                        normalizeManualChecklist(
                          6,
                          genericManualChecklist,
                        ) as Step6Checklist
                      }
                      onChecklistChange={setGenericManualCheck}
                      autoCheckStates={autoCheckStates}
                      appeal={step6Appeal}
                      onAppealChange={patchStep6Appeal}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      note={note}
                      onNoteChange={setNote}
                      winnerAnnouncementDate={winnerAnnouncementDate}
                      readOnly={workflowReadOnly}
                      docBinder={{
                        project,
                        stepNumber: 6,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number === 7 && (
                    <Step7ContractNoticeForm
                      manualChecklist={genericManualChecklist}
                      onManualChange={setGenericManualCheck}
                      autoCheckStates={autoCheckStates}
                      contractNotice={step7ContractNotice}
                      onContractNoticeChange={(patch) =>
                        setStep7ContractNotice((prev) => ({ ...prev, ...patch }))
                      }
                      appealDeadlineISO={step7AppealDeadlineISO}
                      notificationDeadlineISO={step7NotificationDeadlineISO}
                      letterDateTooLate={step7LetterDateTooLate}
                      readOnly={workflowReadOnly}
                      docBinder={{
                        project,
                        stepNumber: 7,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      note={note}
                      onNoteChange={setNote}
                    />
                  )}
                  {current.step_number === 8 && (
                    <Step8ContractGuaranteeForm
                      manualChecklist={genericManualChecklist}
                      onManualChange={setGenericManualCheck}
                      autoCheckStates={autoCheckStates}
                      contractExecution={step8ContractExecution}
                      defaultContractAmountFromStep4={step4ContractAmountDefault}
                      onContractExecutionChange={(patch) =>
                        setStep8ContractExecution((prev) => ({ ...prev, ...patch }))
                      }
                      earliestSigningISO={step8EarliestSigningISO}
                      appealDeadlineISO={step8AppealDeadlineISO}
                      readOnly={workflowReadOnly}
                      docBinder={{
                        project,
                        stepNumber: 8,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      note={note}
                      onNoteChange={setNote}
                    />
                  )}
                  {current.step_number >= 9 && current.step_number <= 10 && (
                    <GenericStepDetailForm
                      stepNumber={current.step_number}
                      manualChecklist={genericManualChecklist}
                      onManualChange={setGenericManualCheck}
                      autoCheckStates={autoCheckStates}
                      readOnly={workflowReadOnly}
                      docBinder={{
                        project,
                        stepNumber: current.step_number,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                      dueDate={dueDate}
                      onDueDateChange={setDueDate}
                      dueTooEarly={dueTooEarly}
                      dueTooLateContract={dueTooLateContract}
                      minDeadline={minDeadline}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      note={note}
                      onNoteChange={setNote}
                      project={project}
                      docList={STEP_DOCS_DETAILED[current.step_number - 1] ?? []}
                      docsForStep={docsForStep}
                      onDocsChange={invalidateAll}
                      projectName={project.name}
                    />
                  )}
                  </>
                  )}
                </fieldset>
              )}

              {error && !isStepCompletedView && (
                <p className="text-sm text-destructive mt-3">{error}</p>
              )}

              {!isStepCompletedView && (() => {
                const stepDocs = STEP_DOCS_DETAILED[current.step_number - 1] ?? [];
                const requiredDocs =
                  current.step_number === 3 && !showStep3HearingForm
                    ? []
                    : stepDocs.filter((d) => d.required);
                const uploadedTypes = docsForStep.map((d) => d.document_type);
                const completedCount = requiredDocs.filter((d) => uploadedTypes.includes(d.name)).length;
                const total = requiredDocs.length;
                const allUploaded = total === 0 || completedCount >= total;
                const isCompleted = current.status === "completed";
                const step2HasAppointmentDoc =
                  current.step_number === 2 &&
                  docsForStep.some((d) => d.document_type === STEP2_DOC.APPOINTMENT_ORDER);
                const step2HasBg06Doc =
                  current.step_number === 2 &&
                  docsForStep.some((d) => d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06);
                const step2ComplianceIssues =
                  current.step_number === 2
                    ? getStep2ComplianceIssues(
                        step2Checklist,
                        {
                          committees: step2Committees,
                          committeeOrder: step2CommitteeOrder,
                          medianPrice: step2MedianPrice,
                          responsibleName: effectiveResponsibleName,
                          hasAppointmentOrderDoc: step2HasAppointmentDoc,
                          hasBg06Doc: step2HasBg06Doc,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step2Ready =
                  current.step_number !== 2 ||
                  isStep2ReadyForNext(
                    step2Checklist,
                    {
                      committees: step2Committees,
                      committeeOrder: step2CommitteeOrder,
                      medianPrice: step2MedianPrice,
                      responsibleName: effectiveResponsibleName,
                      hasAppointmentOrderDoc: step2HasAppointmentDoc,
                      hasBg06Doc: step2HasBg06Doc,
                    },
                  );
                const step4UploadedTypes =
                  current.step_number === 4
                    ? docsForStep.map((d) => d.document_type)
                    : [];
                const step4HasEgpSummary =
                  current.step_number === 4 &&
                  hasStep4EgpBidSummaryDoc(step4UploadedTypes);
                const step4HasBlacklist =
                  current.step_number === 4 &&
                  hasStep4BlacklistEvidenceDoc(step4UploadedTypes);
                const step4HasConflict =
                  current.step_number === 4 &&
                  hasStep4ConflictEvidenceDoc(step4UploadedTypes);
                const step4HasCommitteeReport =
                  current.step_number === 4 &&
                  hasStep4CommitteeReportDoc(step4UploadedTypes);
                const step5UploadedTypes =
                  current.step_number === 5
                    ? docsForStep.map((d) => d.document_type)
                    : [];
                const step5HasEgpWinner =
                  current.step_number === 5 && hasStep5EgpWinnerDoc(step5UploadedTypes);
                const step5HasPhysicalBoard =
                  current.step_number === 5 && hasStep5PhysicalBoardDoc(step5UploadedTypes);
                const step3DocsForCompliance = docs.filter((d) => d.step_number === 3);
                const step3ComplianceOpts =
                  current.step_number === 3 && showStep3HearingForm
                    ? {
                        announcement: step3Announcement,
                        responsibleName: effectiveResponsibleName,
                        approvedMedianPrice: project.approved_median_price ?? null,
                        medianPriceApprovalDate: project.median_price_approval_date ?? null,
                        hasMemoDoc: step3DocsForCompliance.some(
                          (d) => d.document_type === STEP3_DOC.MEMO_APPROVAL,
                        ),
                        hasDraftTorDoc: step3DocsForCompliance.some(
                          (d) => d.document_type === STEP3_DOC.DRAFT_TOR_SPEC,
                        ),
                        hasDraftAnnouncementDoc: step3DocsForCompliance.some(
                          (d) => d.document_type === STEP3_DOC.DRAFT_ANNOUNCEMENT_BID,
                        ),
                        hasBg06Doc:
                          docs.some(
                            (d) =>
                              d.step_number === 2 &&
                              d.document_type === STEP2_DOC.MEDIAN_PRICE_BG06,
                          ) ||
                          step3DocsForCompliance.some(
                            (d) => d.document_type === STEP3_DOC.MEDIAN_BG06,
                          ),
                        hasEgpAnnouncementDoc: step3DocsForCompliance.some(
                          (d) => d.document_type === STEP3_DOC.EGP_ANNOUNCEMENT,
                        ),
                        hasEgpScreenshotDoc: step3DocsForCompliance.some(
                          (d) => d.document_type === STEP3_DOC.EGP_SCREENSHOT,
                        ),
                        hearingFormActive: true,
                      }
                    : null;
                const step3ComplianceIssues =
                  step3ComplianceOpts != null
                    ? getStep3ComplianceIssues(
                        step3Checklist,
                        step3ComplianceOpts,
                        autoCheckStates,
                      )
                    : [];
                const step3Ready =
                  current.step_number !== 3 ||
                  !showStep3HearingForm ||
                  (step3ComplianceOpts != null &&
                    isStep3ReadyForNext(step3Checklist, step3ComplianceOpts));
                const step1ComplianceIssues =
                  current.step_number === 1
                    ? getStep1ComplianceIssues(
                        step1Checklist,
                        {
                          egpCode,
                          budget: step1Budget,
                          responsibleName: effectiveResponsibleName,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step1Ready =
                  current.step_number !== 1 ||
                  isStep1ReadyForNext(step1Checklist, {
                    egpCode,
                    budget: step1Budget,
                    responsibleName: effectiveResponsibleName,
                  });
                const step4ComplianceIssues =
                  current.step_number === 4
                    ? getStep4ComplianceIssues(
                        step4Checklist,
                        step4BidResult,
                        {
                          responsibleName: effectiveResponsibleName,
                          hasEgpBidSummaryDoc: step4HasEgpSummary,
                          hasBlacklistEvidenceDoc: step4HasBlacklist,
                          hasConflictEvidenceDoc: step4HasConflict,
                          hasCommitteeEvaluationDoc: step4HasCommitteeReport,
                          timeline: step4Timeline,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step5DateInvalid =
                  current.step_number === 5 &&
                  !!step5Announcement.winner_announcement_date?.trim() &&
                  !!step5EvaluationApprovalDate &&
                  isStep5WinnerAnnouncementBeforeEvaluation(
                    step5Announcement.winner_announcement_date,
                    step5EvaluationApprovalDate,
                  );
                const step5ComplianceIssues =
                  current.step_number === 5
                    ? getStep5ComplianceIssues(
                        step5Checklist,
                        step5Announcement,
                        {
                          hasEgpWinnerDoc: step5HasEgpWinner,
                          hasPhysicalBoardDoc: step5HasPhysicalBoard,
                          evaluationApprovalDate: step5EvaluationApprovalDate,
                          stepDocs: docsForStep,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step5Ready =
                  current.step_number !== 5 ||
                  (!step5DateInvalid &&
                    isStep5ReadyForNext(step5Checklist, step5Announcement, {
                      hasEgpWinnerDoc: step5HasEgpWinner,
                      hasPhysicalBoardDoc: step5HasPhysicalBoard,
                      evaluationApprovalDate: step5EvaluationApprovalDate,
                      stepDocs: docsForStep,
                    }));
                const step6ChecklistNormalized = normalizeManualChecklist(
                  6,
                  genericManualChecklist,
                ) as Step6Checklist;
                const step6HasNoAppealEgp =
                  current.step_number === 6 && hasStep6NoAppealEgpDoc(uploadedTypes);
                const step6HasAgencyReport =
                  current.step_number === 6 && hasStep6AgencyReportDoc(uploadedTypes);
                const step6HasCgdReport =
                  current.step_number === 6 && hasStep6CgdReportDoc(uploadedTypes);
                const step6ComplianceIssues =
                  current.step_number === 6
                    ? getStep6ComplianceIssues(
                        step6Appeal,
                        step6ChecklistNormalized,
                        {
                          hasNoAppealEgpDoc: step6HasNoAppealEgp,
                          hasAgencyReportDoc: step6HasAgencyReport,
                          hasCgdReportDoc: step6HasCgdReport,
                          responsibleName: effectiveResponsibleName,
                          stepDocs: docsForStep,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step6Ready =
                  current.step_number !== 6 ||
                  isStep6ReadyForNext(
                    step6Appeal,
                    step6ChecklistNormalized,
                    {
                      hasNoAppealEgpDoc: step6HasNoAppealEgp,
                      hasAgencyReportDoc: step6HasAgencyReport,
                      hasCgdReportDoc: step6HasCgdReport,
                      responsibleName: effectiveResponsibleName,
                      stepDocs: docsForStep,
                    },
                    autoCheckStates,
                  );
                const step7ComplianceIssues =
                  current.step_number === 7
                    ? getStep7ComplianceIssues(
                        step7ContractNotice,
                        genericManualChecklist,
                        {
                          responsibleName: effectiveResponsibleName,
                          appealDeadlineISO: step7AppealDeadlineISO,
                          stepDocs: docsForStep,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step7Ready =
                  current.step_number !== 7 ||
                  isStep7ReadyForNext(
                    step7ContractNotice,
                    genericManualChecklist,
                    {
                      responsibleName: effectiveResponsibleName,
                      appealDeadlineISO: step7AppealDeadlineISO,
                      stepDocs: docsForStep,
                    },
                    autoCheckStates,
                  );
                const step8ComplianceIssues =
                  current.step_number === 8
                    ? getStep8ComplianceIssues(
                        step8ContractExecution,
                        genericManualChecklist,
                        {
                          responsibleName: effectiveResponsibleName,
                          earliestSigningISO: step8EarliestSigningISO,
                          appealDeadlineISO: step8AppealDeadlineISO,
                          stepDocs: docsForStep,
                        },
                        autoCheckStates,
                      )
                    : [];
                const step8Ready =
                  current.step_number !== 8 ||
                  isStep8ReadyForNext(
                    step8ContractExecution,
                    genericManualChecklist,
                    {
                      responsibleName: effectiveResponsibleName,
                      earliestSigningISO: step8EarliestSigningISO,
                      appealDeadlineISO: step8AppealDeadlineISO,
                      stepDocs: docsForStep,
                    },
                    autoCheckStates,
                  );
                const genericComplianceIssues =
                  current.step_number >= 9 && current.step_number <= 10
                    ? getGenericStepComplianceIssues(
                        current.step_number,
                        genericManualChecklist,
                        autoCheckStates,
                        {
                          responsibleName: effectiveResponsibleName,
                          requiredDocs,
                          uploadedDocTypes: uploadedTypes,
                        },
                      )
                    : [];
                const genericReady =
                  current.step_number < 9 ||
                  current.step_number > 10 ||
                  isGenericStepReadyForNext(
                    current.step_number,
                    genericManualChecklist,
                    autoCheckStates,
                    {
                      responsibleName: effectiveResponsibleName,
                      requiredDocs,
                      uploadedDocTypes: uploadedTypes,
                    },
                  );
                const step4Ready =
                  current.step_number !== 4 ||
                  isStep4ReadyForNext(step4Checklist, step4BidResult, {
                    responsibleName: effectiveResponsibleName,
                    hasEgpBidSummaryDoc: step4HasEgpSummary,
                    hasBlacklistEvidenceDoc: step4HasBlacklist,
                    hasConflictEvidenceDoc: step4HasConflict,
                    hasCommitteeEvaluationDoc: step4HasCommitteeReport,
                    timeline: step4Timeline,
                  });
                const checklistItemsForStep =
                  current.step_number === 6
                    ? getStep6ChecklistItems(step6Appeal.appeal_status ?? "")
                    : getSmartChecklistItems(current.step_number);
                const manualForReactive =
                  current.step_number === 1
                    ? (step1Checklist as Record<string, boolean>)
                    : current.step_number === 2
                      ? (step2Checklist as Record<string, boolean>)
                      : current.step_number === 3
                        ? (step3Checklist as Record<string, boolean>)
                        : current.step_number === 4
                          ? (step4Checklist as Record<string, boolean>)
                          : current.step_number === 5
                            ? (step5Checklist as Record<string, boolean>)
                            : current.step_number >= 6 && current.step_number <= 10
                              ? genericManualChecklist
                              : {};
                const reactiveChecklist =
                  checklistItemsForStep.length > 0
                    ? computeReactiveChecklistEffective(
                        current.step_number,
                        checklistItemsForStep,
                        manualForReactive,
                        autoCheckStates,
                        docsForStep,
                      )
                    : { allDone: true, done: 0, total: 0, effective: {} };
                const complianceGateIssues: string[] =
                  current.step_number === 1
                    ? step1ComplianceIssues.map((i) => i.message)
                    : current.step_number === 2
                      ? step2ComplianceIssues.map((i) => i.message)
                      : current.step_number === 3
                        ? step3ComplianceIssues.map((i) => i.message)
                        : current.step_number === 4
                          ? step4ComplianceIssues.map((i) => i.message)
                          : current.step_number === 5
                            ? step5ComplianceIssues.map((i) => i.message)
                            : current.step_number === 6
                              ? step6ComplianceIssues.map((i) => i.message)
                              : current.step_number === 7
                                ? step7ComplianceIssues.map((i) => i.message)
                                : current.step_number === 8
                                  ? step8ComplianceIssues.map((i) => i.message)
                                  : current.step_number >= 9 && current.step_number <= 10
                                    ? genericComplianceIssues.map((i) => i.message)
                                    : [];
                const appealBlocking =
                  current.step_number === 6 && isAppealBlocking(step6Appeal);
                const disabled =
                  isCompleted ||
                  (current.step_number === 1
                    ? !step1Ready
                    : current.step_number === 2
                      ? !step2Ready
                      : current.step_number === 3
                        ? !step3Ready
                        : current.step_number === 4
                          ? !step4Ready
                          : current.step_number === 5
                            ? !step5Ready
                            : current.step_number === 6
                              ? !step6Ready
                              : current.step_number === 7
                                ? !step7Ready
                                : current.step_number === 8
                                  ? !step8Ready
                                  : current.step_number >= 9
                                    ? !genericReady
                                    : !allUploaded);
                const showCompleteBtn =
                  workflowMode === "current" &&
                  !isCompleted &&
                  (current.step_number !== 3 || showStep3HearingForm);
                const showSaveDraft =
                  !workflowReadOnly &&
                  (workflowMode === "historical_edit" ||
                    (workflowMode === "current" &&
                      (current.step_number !== 3 || showStep3HearingForm)));
                const saveDraftLabel =
                  workflowMode === "historical_edit" ? "บันทึกการแก้ไข" : "บันทึกร่าง";
                const completeBtnLabel = "บันทึกและไปขั้นตอนถัดไป";
                const showBackButton = canRollbackWorkflowStep(
                  current.step_number,
                  workflowStep,
                );
                const checklistProgressPct =
                  reactiveChecklist.total > 0
                    ? Math.round((reactiveChecklist.done / reactiveChecklist.total) * 100)
                    : 100;

                return (
                  <div className="mt-6 pt-5 border-t space-y-4">
                    <ComplianceGateBanner
                      show={!isCompleted && showCompleteBtn && !reactiveChecklist.allDone}
                      progressPct={checklistProgressPct}
                      issues={complianceGateIssues}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-3">
                        {showBackButton && (
                          <button
                            type="button"
                            onClick={() => rollbackCurrentStep()}
                            disabled={rollingBack}
                            title="ล้างข้อมูลขั้นตอนนี้แล้วย้อนกลับไปขั้นก่อนหน้า"
                            className="h-10 px-4 rounded-md border border-destructive/40 bg-background text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50 flex items-center gap-2"
                          >
                            {rollingBack ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowLeft className="h-4 w-4" />
                            )}
                            ย้อนกลับ
                          </button>
                        )}
                        {showSaveDraft && (
                          <button
                            onClick={saveDraft}
                            disabled={current.step_number === 5 && step5DateInvalid}
                            className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saveDraftLabel}
                          </button>
                        )}
                      </div>
                      {showCompleteBtn && (
                        <button
                          onClick={() => completeStep()}
                          disabled={disabled}
                          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:bg-muted flex items-center gap-2"
                        >
                          <Check className="h-4 w-4" /> {completeBtnLabel}
                        </button>
                      )}
                    </div>
                    {appealBlocking && !isCompleted && (
                      <p className="text-sm text-amber-800 mt-3 font-medium rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                        ⚠️ มีผู้ยื่นอุทธรณ์ — ชะลอการลงนามสัญญาจนกว่าจะพิจารณาผลอุทธรณ์เสร็จสิ้น
                        (สามารถบันทึกขั้นตอนนี้และไปแจ้งผู้ชนะลงนามสัญญาได้เมื่อ Checklist ครบ)
                      </p>
                    )}
                    {current.step_number === 3 &&
                      !isCompleted &&
                      showStep3HearingForm &&
                      !step3Ready &&
                      step3ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step3ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step3ComplianceIssues.length > 4 && (
                            <li>และอีก {step3ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 2 && !isCompleted && !step2Ready && step2ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step2ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step2ComplianceIssues.length > 4 && (
                            <li>และอีก {step2ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 1 && !isCompleted && !step1Ready && step1ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step1ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step1ComplianceIssues.length > 4 && (
                            <li>และอีก {step1ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 4 && !isCompleted && !step4Ready && step4ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step4ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step4ComplianceIssues.length > 4 && (
                            <li>และอีก {step4ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 5 && !isCompleted && !step5Ready && step5ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step5ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step5ComplianceIssues.length > 4 && (
                            <li>และอีก {step5ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 6 &&
                      !isCompleted &&
                      !step6Ready &&
                      step6ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step6ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step6ComplianceIssues.length > 4 && (
                            <li>และอีก {step6ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 7 &&
                      !isCompleted &&
                      !step7Ready &&
                      step7ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step7ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step7ComplianceIssues.length > 4 && (
                            <li>และอีก {step7ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number === 8 &&
                      !isCompleted &&
                      !step8Ready &&
                      step8ComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {step8ComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {step8ComplianceIssues.length > 4 && (
                            <li>และอีก {step8ComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {current.step_number >= 9 &&
                      current.step_number <= 10 &&
                      !isCompleted &&
                      !genericReady &&
                      genericComplianceIssues.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-3 space-y-1 rounded-md border border-dashed border-border bg-muted/30 p-3">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                          กรุณาดำเนินการให้ครบก่อนไปขั้นถัดไป:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          {genericComplianceIssues.slice(0, 4).map((issue) => (
                            <li key={issue.id}>{issue.message}</li>
                          ))}
                          {genericComplianceIssues.length > 4 && (
                            <li>และอีก {genericComplianceIssues.length - 4} รายการ...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          </>
          );
        })()}
      </div>
      </TooltipProvider>
      </GuideModeProvider>
    </AppShell>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/** ไอคอนตามประเภทไฟล์ */
function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return <FileImage className="h-4 w-4 text-blue-500" />;
  if (["xls", "xlsx", "csv"].includes(ext))
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (["pdf"].includes(ext))
    return <FileText className="h-4 w-4 text-red-500" />;
  return <FileLucide className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Section แฟ้มหลักฐาน — fetch ไฟล์ที่อัปโหลดไว้ทั้งหมดของขั้นนี้จาก DB แสดงพร้อม View/Delete */
function DocArchive({
  project,
  stepNumber,
  refreshTick,
  onRefresh,
}: {
  project: Project;
  stepNumber: number;
  refreshTick: number;
  onRefresh: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      console.log("[DocArchive] fetch:start", { projectId: project.id, stepNumber, refreshTick });
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("project_id", project.id)
          .eq("step_number", stepNumber)
        .order("uploaded_at", { ascending: false });
        if (error) {
          console.error("[DocArchive] fetch:error", error);
          toast.error(`โหลดรายการเอกสารไม่สำเร็จ: ${error.message}`);
        }
        if (!cancelled) {
          setDocs((data ?? []) as Doc[]);
          setLoading(false);
          console.log("[DocArchive] fetch:done", { count: data?.length ?? 0 });
        }
      } catch (e: any) {
        console.error("[DocArchive] fetch:exception", e);
        if (!cancelled) {
          setLoading(false);
          toast.error(`โหลดรายการเอกสารไม่สำเร็จ: ${e?.message ?? "unknown error"}`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [project.id, stepNumber, refreshTick]);

  const viewDoc = async (doc: Doc) => {
    setOpeningId(doc.id);
    console.log("[DocArchive] view:start", { docId: doc.id, storagePath: doc.storage_path });
    try {
      const { data, error } = await supabase.storage
        .from("procurement-docs")
        .createSignedUrl(doc.storage_path, 300);
      if (error) {
        console.error("[DocArchive] view:error", error);
        toast.error(`เปิดไฟล์ไม่สำเร็จ: ${error.message}`);
        return;
      }
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        console.log("[DocArchive] view:done", { docId: doc.id });
      } else {
        toast.error("ไม่สามารถเปิดไฟล์ได้ (signed URL ว่าง)");
      }
    } catch (e: any) {
      console.error("[DocArchive] view:exception", e);
      toast.error(`เปิดไฟล์ไม่สำเร็จ: ${e?.message ?? "unknown error"}`);
    } finally {
      setOpeningId(null);
    }
  };

  const deleteDoc = async (doc: Doc) => {
    if (!confirm(`ลบเอกสาร "${doc.file_name}" ออกจากแฟ้มหลักฐาน?`)) return;
    setDeletingId(doc.id);
    console.log("[DocArchive] delete:start", { docId: doc.id, storagePath: doc.storage_path });
    try {
      const { error: storageErr } = await supabase.storage.from("procurement-docs").remove([doc.storage_path]);
      if (storageErr) {
        console.error("[DocArchive] delete:storage_error", storageErr);
        toast.error(`ลบไฟล์จาก Storage ไม่สำเร็จ: ${storageErr.message}`);
        return;
      }
      const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
      if (dbErr) {
        console.error("[DocArchive] delete:db_error", dbErr);
        toast.error(`ลบข้อมูลเอกสารไม่สำเร็จ: ${dbErr.message}`);
        return;
      }
      await decrementStorageUsage(project.organization_id, Number(doc.file_size ?? 0));
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      onRefresh();
      toast.success("ลบไฟล์เรียบร้อยแล้ว");
      console.log("[DocArchive] delete:done", { docId: doc.id });
    } catch (e: any) {
      console.error("[DocArchive] delete:exception", e);
      toast.error(`ลบไฟล์ไม่สำเร็จ: ${e?.message ?? "unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 pt-5 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">แฟ้มหลักฐาน (เอกสารที่อัปโหลดแล้ว)</h4>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {docs.length} ไฟล์
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground"
          title="โหลดใหม่"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลดรายชื่อเอกสาร...
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 rounded-md border border-dashed text-muted-foreground">
          <FolderOpen className="h-8 w-8 opacity-40" />
          <p className="text-sm">ยังไม่มีเอกสารแนบ</p>
          <p className="text-xs opacity-70">อัปโหลดเอกสารจาก Checklist ด้านบนเพื่อเริ่มสร้างแฟ้มหลักฐาน</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-accent/30 transition group"
            >
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FileIcon fileName={doc.file_name} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {doc.document_type}
                  </span>
                  {doc.file_size && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => viewDoc(doc)}
                  disabled={openingId === doc.id}
                  className="h-8 px-2.5 rounded-md border border-input bg-background text-xs hover:bg-accent flex items-center gap-1.5 disabled:opacity-60"
                  title="ดู / ดาวน์โหลดไฟล์"
                >
                  {openingId === doc.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Download className="h-3 w-3" />}
                  ดูไฟล์
                </button>
                <button
                  onClick={() => deleteDoc(doc)}
                  disabled={deletingId === doc.id}
                  className="h-8 w-8 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center disabled:opacity-60"
                  title="ลบไฟล์"
                >
                  {deletingId === doc.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocChecklist({
  project, stepNumber, existing, onChange,
}: {
  project: Project;
  stepNumber: number;
  existing: Doc[];
  onChange: () => void;
}) {
  const docList = STEP_DOCS_DETAILED[stepNumber - 1] ?? [];
  const requiredList = docList.filter((d) => d.required);
  const requiredUploaded = requiredList.filter((d) => existing.some((e) => e.document_type === d.name)).length;
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOverDoc, setDragOverDoc] = useState<string | null>(null);
  const [archiveTick, setArchiveTick] = useState(0);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshArchive = () => {
    setArchiveTick((t) => t + 1);
    onChange();
  };

  const uploadFile = async (docType: string, file: File) => {
    const check = validateDocFile(file, docType);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    setUploading(docType);
    try {
      const ok = await uploadStepDocument(project, stepNumber, docType, file);
      if (ok) refreshArchive();
    } finally {
      setUploading(null);
    }
  };

  const viewDoc = async (path: string) => {
    console.log("[DocChecklist] view:start", { path });
    try {
      const { data, error } = await supabase.storage.from("procurement-docs").createSignedUrl(path, 300);
      if (error) {
        console.error("[DocChecklist] view:error", error);
        toast.error(`เปิดไฟล์ไม่สำเร็จ: ${error.message}`);
        return;
      }
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
      else toast.error("ไม่สามารถเปิดไฟล์ได้ (signed URL ว่าง)");
    } catch (e: any) {
      console.error("[DocChecklist] view:exception", e);
      toast.error(`เปิดไฟล์ไม่สำเร็จ: ${e?.message ?? "unknown error"}`);
    }
  };

  const deleteDoc = async (doc: Doc) => {
    if (!confirm(`ลบเอกสาร "${doc.file_name}" ?`)) return;
    console.log("[DocChecklist] delete:start", { docId: doc.id, path: doc.storage_path });
    try {
      const { error: storageErr } = await supabase.storage.from("procurement-docs").remove([doc.storage_path]);
      if (storageErr) {
        console.error("[DocChecklist] delete:storage_error", storageErr);
        toast.error(`ลบไฟล์จาก Storage ไม่สำเร็จ: ${storageErr.message}`);
        return;
      }
      const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
      if (dbErr) {
        console.error("[DocChecklist] delete:db_error", dbErr);
        toast.error(`ลบข้อมูลเอกสารไม่สำเร็จ: ${dbErr.message}`);
        return;
      }
      await decrementStorageUsage(project.organization_id, Number(doc.file_size ?? 0));
      refreshArchive();
      toast.success("ลบไฟล์เรียบร้อยแล้ว");
      console.log("[DocChecklist] delete:done", { docId: doc.id });
    } catch (e: any) {
      console.error("[DocChecklist] delete:exception", e);
      toast.error(`ลบไฟล์ไม่สำเร็จ: ${e?.message ?? "unknown error"}`);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Checklist เอกสาร (เอกสารบังคับ {requiredUploaded}/{requiredList.length} รายการ)
      </p>

      <ul className="space-y-2">
        {docList.map((item) => {
          const docType = item.name;
          const policy = resolveDocFilePolicy(docType);
          const file = existing.find((d) => d.document_type === docType);
          const isDragOver = dragOverDoc === docType;
          return (
            <li
              key={docType}
              className={`flex items-center gap-3 p-3 rounded-md border bg-background transition ${
                isDragOver ? "border-primary bg-primary/5" : ""
              }`}
              onDragOver={(e) => {
                if (file) return;
                e.preventDefault();
                setDragOverDoc(docType);
              }}
              onDragLeave={() => setDragOverDoc((prev) => (prev === docType ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDoc(null);
                if (file) return;
                const f = e.dataTransfer.files[0];
                if (f) void uploadFile(docType, f);
              }}
            >
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                file ? "bg-success border-success" : "border-input"
              }`}>
                {file && <Check className="h-3 w-3 text-success-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {docType}
                  {!item.required && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(ไม่บังคับ)</span>
                  )}
                </p>
                {file ? (
                  <p className="text-xs text-muted-foreground truncate">{file.file_name}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">{policy.helperText}</p>
                )}
              </div>
              <input
                ref={(el) => { fileInputs.current[docType] = el; }}
                type="file"
                hidden
                accept={policy.accept}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(docType, f);
                  e.target.value = "";
                }}
              />
              {file ? (
                <>
                  <button onClick={() => viewDoc(file.storage_path)} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center" title="ดู">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteDoc(file)} className="h-8 w-8 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center" title="ลบ">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileInputs.current[docType]?.click()}
                  disabled={uploading === docType}
                  className="h-8 px-3 rounded-md border border-input text-xs hover:bg-accent flex items-center gap-1.5"
                >
                  {uploading === docType ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  อัปโหลด
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* แฟ้มหลักฐาน */}
      <DocArchive
        project={project}
        stepNumber={stepNumber}
        refreshTick={archiveTick}
        onRefresh={refreshArchive}
      />
    </div>
  );
}

function ContractForm({ project, onSaved }: { project: Project; onSaved: () => Promise<void> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contract_number: "",
    contractor_name: "",
    contractor_tax_id: "",
    contract_amount: "",
    start_date: "",
    end_date: "",
    guarantee_amount: "",
    guarantee_type: "เงินสด",
    signed_at: "",
    announcement_date: "",
    winner_date: "",
    duration_days: "",
    result_accumulated: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setContractId(data.id);
        setForm({
          contract_number: data.contract_number ?? "",
          contractor_name: data.contractor_name ?? "",
          contractor_tax_id: data.contractor_tax_id ?? "",
          contract_amount: data.contract_amount?.toString() ?? "",
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
          guarantee_amount: data.guarantee_amount?.toString() ?? "",
          guarantee_type: data.guarantee_type ?? "เงินสด",
          signed_at: data.signed_at ?? "",
          announcement_date: data.announcement_date ?? "",
          winner_date: data.winner_date ?? "",
          duration_days: data.duration_days?.toString() ?? "",
          result_accumulated: data.result_accumulated ?? "",
        });
      } else if (
        project.winning_bid_amount ||
        project.final_agreed_amount ||
        project.winning_bidder_name
      ) {
        const contractBase = resolveStep4ContractAmount({
          final_agreed_amount: project.final_agreed_amount ?? null,
          winning_bid_amount: project.winning_bid_amount ?? null,
        });
        setForm((f) => ({
          ...f,
          contractor_name: project.winning_bidder_name ?? "",
          contract_amount: contractBase?.toString() ?? "",
        }));
      }
      setLoading(false);
    })();
  }, [project.id]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setMsg(null);
    const required: Array<[keyof typeof form, string]> = [
      ["contract_number", "เลขที่สัญญา"],
      ["contractor_name", "ชื่อผู้รับจ้าง"],
      ["contract_amount", "มูลค่าสัญญา"],
      ["start_date", "วันเริ่มสัญญา"],
      ["end_date", "วันสิ้นสุดสัญญา"],
      ["guarantee_amount", "หลักประกันสัญญา"],
      ["signed_at", "วันที่ลงนาม"],
    ];
    const missing = required.filter(([k]) => !form[k]).map(([, l]) => l);
    if (missing.length) { setMsg({ type: "err", text: `กรุณากรอก: ${missing.join(", ")}` }); return; }

    setSaving(true);
    const payload = {
      organization_id: project.organization_id,
      project_id: project.id,
      contract_number: form.contract_number,
      contractor_name: form.contractor_name,
      contractor_tax_id: form.contractor_tax_id || null,
      contract_amount: Number(form.contract_amount),
      start_date: form.start_date,
      end_date: form.end_date,
      guarantee_amount: Number(form.guarantee_amount),
      guarantee_type: form.guarantee_type,
      signed_at: form.signed_at,
      announcement_date: form.announcement_date || null,
      winner_date: form.winner_date || null,
      duration_days: form.duration_days ? Number(form.duration_days) : null,
      result_accumulated: form.result_accumulated || null,
      status: "active",
    };
    const { data, error } = contractId
      ? await supabase.from("contracts").update(payload).eq("id", contractId).select().single()
      : await supabase.from("contracts").insert(payload).select().single();
    setSaving(false);
    if (error) { setMsg({ type: "err", text: error.message }); return; }
    if (data) setContractId(data.id);
    setMsg({ type: "ok", text: "บันทึกสัญญาเรียบร้อย ✓" });
    await onSaved();
  };

  if (loading) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-semibold">ข้อมูลสัญญา</h3>
      <FieldRow label="เลขที่สัญญา *">
        <input value={form.contract_number} onChange={(e) => set("contract_number", e.target.value)} className={inputCls} />
      </FieldRow>
      <FieldRow label="ชื่อผู้รับจ้าง *">
        <input value={form.contractor_name} onChange={(e) => set("contractor_name", e.target.value)} className={inputCls} />
      </FieldRow>
      <FieldRow label="เลขประจำตัวผู้เสียภาษี">
        <input value={form.contractor_tax_id} onChange={(e) => set("contractor_tax_id", e.target.value)} className={inputCls} />
      </FieldRow>
      <FieldRow label="มูลค่าสัญญา (฿) *">
        <input type="number" value={form.contract_amount} onChange={(e) => set("contract_amount", e.target.value)} className={inputCls} />
        {form.contract_amount && <p className="text-xs text-muted-foreground mt-1">{formatBaht(Number(form.contract_amount))}</p>}
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="วันเริ่มสัญญา *">
          <ThaiDatePicker value={form.start_date} onChange={(v) => set("start_date", v)} />
        </FieldRow>
        <FieldRow label="วันสิ้นสุดสัญญา *">
          <ThaiDatePicker value={form.end_date} onChange={(v) => set("end_date", v)} />
        </FieldRow>
      </div>
      <FieldRow label="หลักประกันสัญญา (฿) *">
        <input type="number" value={form.guarantee_amount} onChange={(e) => set("guarantee_amount", e.target.value)} className={inputCls} />
        {form.guarantee_amount && <p className="text-xs text-muted-foreground mt-1">{formatBaht(Number(form.guarantee_amount))}</p>}
      </FieldRow>
      <FieldRow label="ประเภทหลักประกัน">
        <select value={form.guarantee_type} onChange={(e) => set("guarantee_type", e.target.value)} className={inputCls}>
          <option value="เงินสด">เงินสด</option>
          <option value="หนังสือค้ำประกันธนาคาร">หนังสือค้ำประกันธนาคาร</option>
          <option value="พันธบัตร">พันธบัตร</option>
        </select>
      </FieldRow>
      <FieldRow label="วันที่ลงนาม *">
        <ThaiDatePicker value={form.signed_at} onChange={(v) => set("signed_at", v)} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="วันที่ประกาศจัดซื้อจัดจ้าง">
          <ThaiDatePicker value={form.announcement_date} onChange={(v) => set("announcement_date", v)} />
        </FieldRow>
        <FieldRow label="วันที่ประกาศผู้ชนะ">
          <ThaiDatePicker value={form.winner_date} onChange={(v) => set("winner_date", v)} />
        </FieldRow>
      </div>
      <FieldRow label="ระยะเวลาสัญญา (วัน)">
        <input type="number" value={form.duration_days} onChange={(e) => set("duration_days", e.target.value)} placeholder="เช่น 330" className={inputCls} />
      </FieldRow>
      <FieldRow label="ผลสะสม (ไร่/บ่อ/กม.)">
        <input value={form.result_accumulated} onChange={(e) => set("result_accumulated", e.target.value)} placeholder="เช่น 120 ไร่" className={inputCls} />
      </FieldRow>
      {msg && <p className={`text-sm ${msg.type === "ok" ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
      <div className="pt-2">
        <button onClick={submit} disabled={saving}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          บันทึกสัญญา
        </button>
      </div>
    </div>
  );
}

function ProjectTimeline({
  project,
  steps,
  step3Note,
}: {
  project: Project;
  steps: Step[];
  step3Note?: string | null;
}) {
  const items = useMemo(
    () => buildProjectTimelineItems(steps, project, step3Note),
    [steps, project, step3Note],
  );

  const color = (it: (typeof items)[0]) =>
    it.isDone ? "#16A34A" : it.isCurrent ? "#2563EB" : "#9CA3AF";

  return (
    <div className="bg-card border rounded-[10px] p-5">
      <h3 className="font-semibold mb-4">ไทม์ไลน์โครงการ</h3>
      <p className="text-xs text-muted-foreground mb-3">
        แสดงวันที่มีผลทางระเบียบจากฟอร์มแต่ละขั้น (ไม่ใช่วันที่ระบบสร้างข้อมูล)
      </p>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-2 min-w-max pb-2">
          {items.map((it, i) => (
            <div key={it.stepNumber} className="flex items-start gap-2">
              <div className="flex flex-col items-center w-28">
                <div
                  className="h-4 w-4 rounded-full border-2 border-background shadow"
                  style={{ backgroundColor: color(it) }}
                />
                <p className="text-[11px] font-medium mt-2 text-center leading-tight">
                  {it.stepNumber}. {getMilestoneLabel(it.stepNumber)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {it.date ? (
                    <>
                      {it.estimated && "~ "}
                      {formatThaiDate(it.date)}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                {it.isCurrent && (
                  <p className="text-[10px] mt-0.5" style={{ color: "#2563EB" }}>
                    กำลังดำเนินการ
                  </p>
                )}
              </div>
              {i < items.length - 1 && (
                <div className="h-0.5 w-6 bg-border mt-[7px]" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#16A34A" }} />เสร็จแล้ว</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#2563EB" }} />กำลังดำเนินการ</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#9CA3AF" }} />~ ประมาณการ</span>
      </div>
    </div>
  );
}

