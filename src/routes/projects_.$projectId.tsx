import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Check, Upload, Eye, Trash2, FileText, Loader2, AlertTriangle, Undo2,
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
import { checkStorageQuota, incrementStorageUsage, decrementStorageUsage } from "@/lib/storage";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { GuidelineBox } from "@/components/GuidelineBox";
import { Step1DetailForm, Step2DetailForm, Step3DetailForm, Step4DetailForm, ResponsibleOfficerField } from "@/components/steps/ProjectStepForms";
import { StepDocumentHub } from "@/components/steps/StepDocumentHub";
import { StepInlineDocList } from "@/components/steps/StepInlineDocList";
import {
  addWorkdays,
  getStepMinDays,
  getMinDays,
  validateStep3PublicationDates,
} from "@/lib/workdays";
import {
  formatBudgetInput,
  parseBudgetInput,
  parseStepNote,
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
  resolveCommitteeReviewWorkdays,
  loadStep4FormFromNote,
  mergeStep4BidResultFromProject,
  EMPTY_STEP4_BID_RESULT,
  EMPTY_STEP4_CHECKLIST,
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
  STEP2_COMMITTEE_INSERT_PROFILES,
  isStep2CommitteeTypeCheckError,
  type Step2CommitteeListKey,
  type Step2CommitteeAppointmentMode,
  type Step2CommitteesState,
  buildStep2ComplianceLog,
  logStep2ComplianceWarnings,
  type Step2ComplianceLog,
  isStep4AppealBlocking,
  isStep4ReadyForNext,
  getStep4ComplianceIssues,
  resolveBidSubmissionEndDate,
  getStep1ResponsibleOfficer,
  resolveResponsibleOfficer,
  type Step3Announcement,
  type Step4BidResult,
  type Step4Checklist,
  type Step4ChecklistKey,
} from "@/lib/step-form";
import { STEP2_DOC, STEP3_DOC, STEP4_DOC } from "@/lib/step-doc-types";
import {
  getStep3HearingTier,
  shouldShowStep3HearingForm,
  type Step3SkipReason,
} from "@/lib/step3-hearing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  evaluation_report_letter_no?: string | null;
  evaluation_report_approval_date?: string | null;
  appeal_status?: string | null;
  appeal_report_letter_no?: string | null;
  appeal_consideration_status?: string | null;
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
  const [step4BidResult, setStep4BidResult] = useState<Step4BidResult>({
    ...EMPTY_STEP4_BID_RESULT,
  });
  const [step4Checklist, setStep4Checklist] = useState<Step4Checklist>({
    ...EMPTY_STEP4_CHECKLIST,
  });

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return null; }
      const [{ data: p }, { data: s }, { data: d }, { data: c }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("procurement_steps").select("*").eq("project_id", projectId).order("step_number"),
        supabase.from("documents").select("*").eq("project_id", projectId),
        supabase.from("committees").select("*").eq("project_id", projectId).in("committee_type", [...STEP2_COMMITTEE_DB_TYPES]).order("created_at"),
      ]);
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

  // Sync activeStep to project's current_step on first load
  useEffect(() => {
    if (project) setActiveStep((s) => (s === 1 ? project.current_step : s));
  }, [project?.id]); // eslint-disable-line

  const current = useMemo(() => steps.find((s) => s.step_number === activeStep), [steps, activeStep]);
  const step3Record = useMemo(() => steps.find((s) => s.step_number === 3), [steps]);
  const step1Record = useMemo(() => steps.find((s) => s.step_number === 1), [steps]);
  const step1ResponsibleDefault = useMemo(
    () => getStep1ResponsibleOfficer(steps),
    [steps, step1Record?.responsible_officer_name, step1Record?.id],
  );
  const committeeReviewWorkdays = useMemo(
    () => resolveCommitteeReviewWorkdays(project, step3Record?.note ?? null),
    [project, step3Record?.note],
  );
  const bidSubmissionEndDate = useMemo(
    () => resolveBidSubmissionEndDate(step3Record?.note ?? null),
    [step3Record?.note],
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
      const { userNote } = parseStepNote(current.note);
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
      const draft2 = loadStepDraftFields({ ...current, note: userNote });
      setNote(draft2.userNote);
      setDueDate("");
      return;
    }
    if (current.step_number === 3) {
      const { userNote } = parseStepNote(current.note);
      const step3Form = loadStep3FormFromStep(current as Step);
      const draft3 = loadStepDraftFields({ ...current, note: userNote });
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
      const { userNote } = parseStepNote(current.note);
      const step4Form = loadStep4FormFromNote(current.note);
      setStep4Checklist(step4Form.checklist ?? { ...EMPTY_STEP4_CHECKLIST });
      setStep4BidResult(
        mergeStep4BidResultFromProject(
          step4Form.bidResult ?? { ...EMPTY_STEP4_BID_RESULT },
          project,
        ),
      );
      setNote("");
      setDueDate("");
      return;
    }
    const draft = loadStepDraftFields(current);
    setNote(draft.userNote);
    setDueDate(draft.dueDate);
  }, [current?.id, project?.id, committees.length]); // eslint-disable-line

  const effectiveResponsibleName =
    responsibleName.trim() || step1ResponsibleDefault.trim();

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
    setStep2Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const patchStep2CommitteeOrder = (patch: Partial<Step2CommitteeOrder>) => {
    setStep2CommitteeOrder((prev) => ({ ...prev, ...patch }));
  };

  const patchStep2MedianPrice = (patch: Partial<Step2MedianPrice>) => {
    setStep2MedianPrice((prev) => ({ ...prev, ...patch }));
  };

  const setStep3Check = (key: Step3ChecklistKey, checked: boolean) => {
    setStep3Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const patchStep3Announcement = (patch: Partial<Step3Announcement>) => {
    setStep3Announcement((prev) => ({ ...prev, ...patch }));
  };

  const patchStep4BidResult = (patch: Partial<Step4BidResult>) => {
    setStep4BidResult((prev) => ({ ...prev, ...patch }));
  };

  const setStep4Check = (key: Step4ChecklistKey, checked: boolean) => {
    setStep4Checklist((prev) => ({ ...prev, [key]: checked }));
  };

  const setStep1Check = (key: Step1ChecklistKey, checked: boolean) => {
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
      toast.success("บันทึกร่างขั้นตอนที่ 1 เรียบร้อย");
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

            for (const profile of STEP2_COMMITTEE_INSERT_PROFILES) {
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
        toast.success("บันทึกร่างขั้นตอนที่ 2 เรียบร้อย");
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
        buildStepDraftFields(effectiveResponsibleName, "", ""),
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
      toast.success("บันทึกร่างขั้นตอนที่ 3 เรียบร้อย");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    if (current.step_number === 4) {
      const formNote = serializeStepNote("", {
        checklist: step4Checklist,
        bidResult: step4BidResult,
      });
      const { error: e } = await patchStepDraft(
        current.id,
        buildStepDraftFields(effectiveResponsibleName, "", ""),
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
      toast.success("บันทึกร่างขั้นตอนที่ 4 เรียบร้อย");
      await propagateResponsibleToStep1(effectiveResponsibleName);
      await invalidateAll();
      return;
    }

    const { error: e } = await patchStepDraft(
      current.id,
      buildStepDraftFields(effectiveResponsibleName, note, dueDate),
    );
    if (e?.error) {
      setError(e.error.message);
      return;
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
    if (current.step_number === 4) {
      const hasEvalDoc = docs
        .filter((d) => d.step_number === 4)
        .some((d) => d.document_type === STEP4_DOC.EVALUATION_REPORT);
      const complianceIssues = getStep4ComplianceIssues(
        step4Checklist,
        step4BidResult,
        {
          responsibleName: effectiveResponsibleName,
          hasEvaluationReportDoc: hasEvalDoc,
          bidSubmissionEndDate,
          committeeReviewWorkdays,
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
      const missing = requiredDocs.filter((name) => !uploaded.includes(name));
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
    patchStep3Announcement({ hearing_proceed: true, hearing_skipped: false, skip_reason: undefined });
    toast.message("ดำเนินการจัดฟังคำวิจารณ์ร่างประกาศ — กรุณากรอกข้อมูลและแนบเอกสารให้ครบ");
  };

  const skipStep3 = async (reason: Step3SkipReason) => {
    if (!current || !project || current.step_number !== 3) return;
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

  const revertStep = async () => {
    if (!current || !project) return;
    if (current.step_number <= 1) return;
    const prevStep = current.step_number - 1;
    const updates: any = { current_step: prevStep };
    if (project.status === "completed") updates.status = "active";
    await supabase.from("projects").update(updates).eq("id", project.id);
    await supabase.from("procurement_steps").update({
      status: "pending",
      completed_at: null,
      completed_by: null,
    }).eq("id", current.id);
    await supabase.from("procurement_steps").update({
      status: "in_progress",
      completed_at: null,
      completed_by: null,
    }).eq("project_id", project.id).eq("step_number", prevStep);
    setActiveStep(prevStep);
    await invalidateAll();
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
          <h3 className="font-semibold mb-4">ความคืบหน้า 10 ขั้นตอน</h3>
          <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
            {steps.map((s) => {
              const isActive = s.step_number === activeStep;
              const isDone = s.status === "completed";
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.step_number)}
                  className={`relative p-3 rounded-md text-xs text-center transition border-2 ${
                    isDone
                      ? "bg-success/15 border-success/30 text-success-foreground"
                      : isActive
                      ? "bg-primary/5 border-primary text-primary font-medium"
                      : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {isDone && <Check className="absolute top-1 right-1 h-3 w-3 text-success" />}
                  <div className="font-medium">{EGP_MILESTONE_SHORT[s.step_number - 1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline summary */}
        <ProjectTimeline project={project} steps={steps} />

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
          const minDeadline = minDays > 0 ? addWorkdays(new Date(stepStartDate), minDays) : null;
          const dueDateObj = dueDate ? new Date(dueDate) : null;
          const dueValid = !!dueDateObj && !isNaN(dueDateObj.getTime());
          const isContractStep = current.step_number === 8;
          const contractMaxDeadline = isContractStep
            ? addWorkdays(new Date(stepStartDate), 7)
            : null;
          const dueTooEarly =
            !!minDeadline && dueValid && dueDateObj! < minDeadline;
          const dueTooLateContract =
            isContractStep &&
            !!contractMaxDeadline &&
            dueValid &&
            dueDateObj! > contractMaxDeadline;
          return (
          <>
            <GuidelineBox
              stepNumber={current.step_number}
              method={calcMethod}
              budget={calcBudget}
              stepStartDate={stepStartDate}
              committeeReviewWorkdays={
                current.step_number === 4 ? committeeReviewWorkdays : undefined
              }
              onSkipStep3={current.step_number === 3 ? skipStep3 : undefined}
              onProceedStep3Hearing={
                current.step_number === 3 ? proceedStep3Hearing : undefined
              }
              step3HearingProceed={!!step3Announcement.hearing_proceed}
              step3Skipping={step3Skipping}
            />
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
                <div className="space-y-4 max-w-2xl">
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
                  {current.step_number === 1 && (
                    <Step1DetailForm
                      checklist={step1Checklist}
                      onChecklistChange={setStep1Check}
                      egpCode={egpCode}
                      onEgpCodeChange={setEgpCode}
                      budget={step1Budget}
                      onBudgetChange={setStep1Budget}
                      method={step1Method}
                      onMethodChange={setStep1Method}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                    />
                  )}
                  {current.step_number === 2 && (
                    <Step2DetailForm
                      checklist={step2Checklist}
                      onChecklistChange={setStep2Check}
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
                      bidResult={step4BidResult}
                      onBidResultChange={patchStep4BidResult}
                      responsibleName={responsibleName}
                      onResponsibleNameChange={setResponsibleName}
                      step1ResponsibleDefault={step1ResponsibleDefault}
                      bidSubmissionEndDate={bidSubmissionEndDate}
                      committeeReviewWorkdays={committeeReviewWorkdays}
                      docBinder={{
                        project,
                        stepNumber: 4,
                        docs: docsForStep,
                        onDocsChange: invalidateAll,
                      }}
                    />
                  )}
                  {current.step_number !== 1 &&
                    current.step_number !== 2 &&
                    current.step_number !== 3 &&
                    current.step_number !== 4 && (
                    <FieldRow label="กำหนดเสร็จ">
                      <div className="space-y-1">
                        <ThaiDatePicker value={dueDate} onChange={setDueDate} />
                        {dueDate && (
                          <p className="text-xs text-muted-foreground">📅 {formatThaiDate(dueDate)}</p>
                        )}
                        {dueTooEarly && minDeadline && (
                          <p className="text-xs" style={{ color: "#EA580C" }}>
                            ⚠️ วันที่เลือกสั้นกว่ากำหนดตาม พ.ร.บ. กรุณาเลือกวันที่ {formatThaiDate(minDeadline)} หรือหลังจากนั้น มิฉะนั้น สตง. อาจทักท้วงได้
                          </p>
                        )}
                        {dueTooLateContract && (
                          <p className="text-xs" style={{ color: "#EA580C" }}>
                            ⚠️ ควรลงนามสัญญาภายใน 7 วันทำการ หลังพ้นอุทธรณ์
                          </p>
                        )}
                      </div>
                    </FieldRow>
                  )}
                  {current.step_number !== 1 &&
                    current.step_number !== 2 &&
                    current.step_number !== 3 &&
                    current.step_number !== 4 && (
                    <ResponsibleOfficerField
                      stepNumber={current.step_number}
                      value={responsibleName}
                      onChange={setResponsibleName}
                      step1Default={step1ResponsibleDefault}
                    />
                  )}
                  {current.step_number !== 3 &&
                    current.step_number !== 4 && (
                    <FieldRow label="หมายเหตุ">
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </FieldRow>
                  )}
                  {current.status === "completed" && (
                    <p className="text-sm text-success flex items-center gap-1.5">
                      <Check className="h-4 w-4" /> ขั้นตอนนี้เสร็จสิ้นแล้ว
                    </p>
                  )}
                  {current.step_number !== 3 &&
                    current.step_number !== 4 && (
                    <StepInlineDocList
                      project={project}
                      stepNumber={current.step_number}
                      docList={STEP_DOCS_DETAILED[current.step_number - 1] ?? []}
                      existing={docsForStep}
                      onChange={invalidateAll}
                    />
                  )}
                  {!(current.step_number === 3 && !showStep3HearingForm) &&
                    current.step_number !== 4 && (
                    <StepDocumentHub
                      stepNumber={current.step_number}
                      docList={STEP_DOCS_DETAILED[current.step_number - 1] ?? []}
                      docs={docsForStep}
                      projectName={project.name}
                    />
                  )}
                </div>
              )}

              {error && <p className="text-sm text-destructive mt-3">{error}</p>}

              {(() => {
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
                    ? getStep2ComplianceIssues(step2Checklist, {
                        committees: step2Committees,
                        committeeOrder: step2CommitteeOrder,
                        medianPrice: step2MedianPrice,
                        responsibleName: effectiveResponsibleName,
                        hasAppointmentOrderDoc: step2HasAppointmentDoc,
                        hasBg06Doc: step2HasBg06Doc,
                      })
                    : [];
                const step2Ready =
                  current.step_number !== 2 ||
                  isStep2ReadyForNext(step2Checklist, {
                    committees: step2Committees,
                    committeeOrder: step2CommitteeOrder,
                    medianPrice: step2MedianPrice,
                    responsibleName: effectiveResponsibleName,
                    hasAppointmentOrderDoc: step2HasAppointmentDoc,
                    hasBg06Doc: step2HasBg06Doc,
                  });
                const step4HasEvalDoc =
                  current.step_number === 4 &&
                  docsForStep.some((d) => d.document_type === STEP4_DOC.EVALUATION_REPORT);
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
                    ? getStep3ComplianceIssues(step3Checklist, step3ComplianceOpts)
                    : [];
                const step3Ready =
                  current.step_number !== 3 ||
                  !showStep3HearingForm ||
                  (step3ComplianceOpts != null &&
                    isStep3ReadyForNext(step3Checklist, step3ComplianceOpts));
                const step1ComplianceIssues =
                  current.step_number === 1
                    ? getStep1ComplianceIssues(step1Checklist, {
                        egpCode,
                        budget: step1Budget,
                        responsibleName: effectiveResponsibleName,
                      })
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
                    ? getStep4ComplianceIssues(step4Checklist, step4BidResult, {
                        responsibleName: effectiveResponsibleName,
                        hasEvaluationReportDoc: step4HasEvalDoc,
                        bidSubmissionEndDate,
                        committeeReviewWorkdays,
                      })
                    : [];
                const step4Ready =
                  current.step_number !== 4 ||
                  isStep4ReadyForNext(step4Checklist, step4BidResult, {
                    responsibleName: effectiveResponsibleName,
                    hasEvaluationReportDoc: step4HasEvalDoc,
                    bidSubmissionEndDate,
                    committeeReviewWorkdays,
                  });
                const appealBlocking =
                  current.step_number === 4 && isStep4AppealBlocking(step4BidResult);
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
                        : !allUploaded);
                const showCompleteBtn =
                  isCompleted ||
                  current.step_number !== 3 ||
                  showStep3HearingForm;
                const showSaveDraft =
                  current.step_number !== 3 || showStep3HearingForm;
                const completeBtnLabel =
                  current.step_number === 4
                    ? "ขั้นตอนถัดไป (ทำสัญญา)"
                    : "ยืนยันเสร็จสิ้น → ขั้นตอนถัดไป";
                return (
                  <div className="mt-6 pt-5 border-t">
                    <div className="flex gap-3 flex-wrap">
                      {showSaveDraft && (
                      <button onClick={saveDraft}
                        className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent">
                        บันทึกร่าง
                      </button>
                      )}
                      {current.step_number > 1 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="h-10 px-4 rounded-md border border-input bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/70 flex items-center gap-2"
                            >
                              <Undo2 className="h-4 w-4" /> ย้อนกลับขั้นตอน
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ย้อนกลับขั้นตอน?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ต้องการย้อนกลับไปขั้นตอนที่ {current.step_number - 1} เพื่อแก้ไขเอกสารใช่หรือไม่?
                                <br />
                                ขั้นตอนปัจจุบันจะถูกรีเซ็ตกลับเป็น pending
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={revertStep}>ยืนยัน</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {showCompleteBtn && !isCompleted && (
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
                      <p className="text-sm text-destructive mt-3 font-medium">
                        ⚠️ แจ้งเตือน: โครงการนี้ติดสถานะอุทธรณ์ ไม่สามารถไปขั้นตอนทำสัญญาได้
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
                    {current.step_number !== 4 &&
                      current.step_number !== 1 &&
                      current.step_number !== 2 &&
                      !allUploaded &&
                      !isCompleted && (
                      <p className="text-sm text-warning mt-3 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        กรุณาอัปโหลดเอกสารบังคับให้ครบ {completedCount}/{total} รายการก่อนดำเนินการต่อ
                      </p>
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
  const [dragOver, setDragOver] = useState(false);
  const [archiveTick, setArchiveTick] = useState(0);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshArchive = () => {
    setArchiveTick((t) => t + 1);
    onChange();
  };

  const uploadFile = async (docType: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("ขนาดไฟล์เกิน 50MB");
      return;
    }
    console.log("[DocUpload] start", {
      docType,
      fileName: file.name,
      fileSize: file.size,
      projectId: project.id,
      stepNumber,
      orgId: project.organization_id,
    });
    const quota = await checkStorageQuota(project.organization_id, file.size);
    console.log("[DocUpload] quota", quota);
    if (!quota.ok) return;
    setUploading(docType);
    try {
      const { data: u, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error("[DocUpload] auth:error", authErr);
        toast.error(`ไม่สามารถตรวจสอบผู้ใช้ได้: ${authErr.message}`);
        return;
      }
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${project.organization_id}/${project.id}/step-${stepNumber}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      console.log("[DocUpload] storage:upload:start", { path });
      const { error: upErr } = await supabase.storage.from("procurement-docs").upload(path, file);
      if (upErr) {
        console.error("[DocUpload] storage:upload:error", upErr);
        toast.error(`อัปโหลดไฟล์ไป Storage ไม่สำเร็จ: ${upErr.message}`);
        return;
      }
      console.log("[DocUpload] storage:upload:done", { path });
      console.log("[DocUpload] db:insert:start");
      const { error: dbErr } = await supabase.from("documents").insert({
        organization_id: project.organization_id,
        project_id: project.id,
        step_number: stepNumber,
        document_type: docType,
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: u.user?.id ?? null,
      });
      if (dbErr) {
        console.error("[DocUpload] db:insert:error", dbErr);
        toast.error(`บันทึกข้อมูลเอกสารไม่สำเร็จ: ${dbErr.message}`);
        return;
      }
      console.log("[DocUpload] db:insert:done");
      await incrementStorageUsage(project.organization_id, file.size);
      refreshArchive();
      toast.success("อัปโหลดไฟล์เรียบร้อย");
      console.log("[DocUpload] done");
    } catch (e: any) {
      console.error("[DocUpload] exception", e);
      toast.error("อัปโหลดไม่สำเร็จ: " + (e.message ?? "unknown"));
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

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadFile("เอกสารทั่วไป", file);
        }}
        className={`mb-4 border-2 border-dashed rounded-md p-4 text-center text-xs transition ${
          dragOver ? "border-primary bg-primary/5" : "border-input text-muted-foreground"
        }`}
      >
        ลากไฟล์มาวางที่นี่ได้ (PDF, Word, Excel, รูปภาพ — สูงสุด 50MB)
      </div>

      <ul className="space-y-2">
        {docList.map((item) => {
          const docType = item.name;
          const file = existing.find((d) => d.document_type === docType);
          return (
            <li key={docType} className="flex items-center gap-3 p-3 rounded-md border bg-background">
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
                {file && <p className="text-xs text-muted-foreground truncate">{file.file_name}</p>}
              </div>
              <input
                ref={(el) => { fileInputs.current[docType] = el; }}
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(docType, f);
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
      } else if (project.winning_bid_amount || project.winning_bidder_name) {
        setForm((f) => ({
          ...f,
          contractor_name: project.winning_bidder_name ?? "",
          contract_amount: project.winning_bid_amount?.toString() ?? "",
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

function ProjectTimeline({ project, steps }: { project: Project; steps: Step[] }) {
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  const mins = getMinDays(project.method, Number(project.budget));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // build cursor for estimating future steps
  const lastCompleted = [...sorted].reverse().find((s) => s.completed_at);
  let cursor = lastCompleted?.completed_at
    ? new Date(lastCompleted.completed_at)
    : new Date(project.created_at);
  if (cursor < today) {
    // estimates start from today for in-progress / future
  }

  const items = sorted.map((s) => {
    const isDone = !!s.completed_at;
    const isCurrent = s.step_number === project.current_step && !isDone;
    let date: Date | null = null;
    let estimated = false;
    if (isDone) {
      date = new Date(s.completed_at as string);
    } else {
      const minDays = (mins as any)[`step${s.step_number}`] ?? 3;
      const start = cursor < today ? today : cursor;
      date = addWorkdays(start, Math.max(minDays, 1));
      cursor = date;
      estimated = true;
    }
    return { step: s, date, estimated, isCurrent, isDone };
  });

  const color = (it: typeof items[0]) =>
    it.isDone ? "#16A34A" : it.isCurrent ? "#2563EB" : "#9CA3AF";

  return (
    <div className="bg-card border rounded-[10px] p-5">
      <h3 className="font-semibold mb-4">ไทม์ไลน์โครงการ</h3>
      <div className="overflow-x-auto">
        <div className="flex items-start gap-2 min-w-max pb-2">
          {items.map((it, i) => (
            <div key={it.step.id} className="flex items-start gap-2">
              <div className="flex flex-col items-center w-28">
                <div
                  className="h-4 w-4 rounded-full border-2 border-background shadow"
                  style={{ backgroundColor: color(it) }}
                />
                <p className="text-[11px] font-medium mt-2 text-center leading-tight">
                  {it.step.step_number}. {getMilestoneLabel(it.step.step_number)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {it.estimated && "~ "}
                  {formatThaiDate(it.date)}
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
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#9CA3AF" }} />ประมาณการ</span>
      </div>
    </div>
  );
}

