import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ThaiDatePicker } from "@/components/ThaiDatePicker";
import { formatThaiDate, formatThaiDateSlash } from "@/lib/utils";
import {
  countWorkdaysAfterStartISO,
  defaultPublicationEndISO,
  MIN_DRAFT_PUBLICATION_WORKDAYS,
  STEP3_PUBLICATION_END_GUIDELINE,
  STEP3_PUBLICATION_END_TOO_SHORT_MSG,
  STEP3_PUBLICATION_NON_WORKDAY_MSG,
  isWorkdayISO,
} from "@/lib/workdays";
import { InlineDocUpload } from "@/components/steps/InlineDocUpload";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import {
  STEP3_DOC,
  STEP3_DRAFT_TOR_UPLOAD_LABEL,
  STEP3_DRAFT_ANNOUNCEMENT_UPLOAD_LABEL,
  STEP3_MEDIAN_BG06_UPLOAD_LABEL,
  STEP3_EGP_SCREENSHOT_UPLOAD_LABEL,
  STEP3_FEEDBACK_HELPER_HAS_COMMENTS,
  STEP3_FEEDBACK_HELPER_NONE,
  STEP3_FEEDBACK_UPLOAD_LABEL,
} from "@/lib/step-doc-types";
import {
  STEP2_DOC,
  STEP2_APPOINTMENT_ORDER_UPLOAD_LABEL,
  STEP2_BG06_UPLOAD_LABEL,
} from "@/lib/step-doc-types";
import { FORM_AUDIT_TRAIL_STANDARD } from "@/lib/form-audit-trail";
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
  STEP4_CHECKLIST_ITEMS,
  type Step1Checklist,
  type Step1ChecklistKey,
  STEP1_CHECKLIST_ITEMS,
  isStep1EgpCodeUnlocked,
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
  shouldWarnEvenCommitteeCount,
  defaultStep4EvaluationApprovalDateISO,
  isStep4EvaluationApprovalBeforeBidEnd,
  isStep4EvaluationApprovalOverdue,
  getStep4TimelineDisplayLines,
  type Step4Timeline,
  type Step6AppealState,
  type Step6Checklist,
  type Step6ChecklistKey,
  type Step5Announcement,
  type Step5Checklist,
  type Step5ChecklistKey,
  isStep5WinnerAnnouncementBeforeEvaluation,
  getStep5WinnerAnnouncementBeforeEvaluationMsg,
  STEP4_EVALUATION_APPROVAL_BEFORE_BID_END_MSG,
  STEP4_EVALUATION_APPROVAL_OVERDUE_MSG,
} from "@/lib/step-form";
import { toast } from "sonner";
import { formatBaht } from "@/lib/procurement";
import { SmartChecklist, type SmartChecklistDocBinder } from "@/components/SmartChecklist";
import { getSmartChecklistItems, getStep6ChecklistItems } from "@/lib/smart-checklist";
import { computeAppealDeadlineISO } from "@/lib/workdays";
import type { DocItem } from "@/lib/procurement";
import { StepInlineDocList } from "@/components/steps/StepInlineDocList";
import { StepDocumentHub } from "@/components/steps/StepDocumentHub";

/**
 * มาตรฐานลำดับ Layout ทุกขั้นตอน (Step 1–10):
 * 1. Guideline Box — แสดงใน projects_.$projectId.tsx ด้านบนการ์ด
 * 2. Smart Checklist (inline upload ท้ายแถว)
 * 3. โซนฟอร์มคีย์ข้อมูล / เงื่อนไข
 * 4. ปุ่มบันทึก — แสดงใน projects_.$projectId.tsx ด้านล่าง
 */

const inputCls =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
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
    <FieldRow label="เจ้าหน้าที่ผู้รับผิดชอบ">
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
  egpCode: string;
  onEgpCodeChange: (v: string) => void;
  budget: string;
  onBudgetChange: (v: string) => void;
  method: string;
  onMethodChange: (v: string) => void;
  responsibleName: string;
  onResponsibleNameChange: (v: string) => void;
  readOnly?: boolean;
};

/** ขั้นตอนที่ 1 — จัดทำแผนการจัดซื้อจัดจ้าง */
export function Step1DetailForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  egpCode,
  onEgpCodeChange,
  budget,
  onBudgetChange,
  method,
  onMethodChange,
  responsibleName,
  onResponsibleNameChange,
  readOnly,
  docBinder,
}: Step1FormProps & { docBinder?: SmartChecklistDocBinder }) {
  const egpUnlocked = isStep1EgpCodeUnlocked(checklist, { egpCode });

  return (
    <div className="space-y-4 max-w-2xl">
      <SmartChecklist
        stepNumber={1}
        stepLabel="ขั้นตอนที่ 1"
        items={getSmartChecklistItems(1)}
        manualChecklist={checklist as Record<string, boolean>}
        autoStates={autoCheckStates}
        onManualChange={(key, checked) =>
          onChecklistChange(key as Step1ChecklistKey, checked)
        }
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">ข้อมูลขั้นตอนที่ 1 — จัดทำแผนการจัดซื้อจัดจ้าง</p>
        <FieldRow label="รหัสแผนจัดซื้อจัดจ้าง e-GP">
          <input
            value={egpCode}
            onChange={(e) => onEgpCodeChange(e.target.value)}
            placeholder="เช่น P6805001234"
            disabled={!egpUnlocked}
            className={`${inputCls}${!egpUnlocked ? " opacity-60 cursor-not-allowed bg-muted" : ""}`}
          />
          {!egpUnlocked && (
            <p className="text-xs text-warning mt-1">
              ปลดล็อกเมื่อติ๊ก Manual-Check «เผยแพร่แผนจัดซื้อจัดจ้าง» และกรอกรหัส e-GP แล้ว
            </p>
          )}
        </FieldRow>
      <FieldRow label="วงเงินงบประมาณ (บาท)">
        <input
          value={budget}
          onChange={(e) => onBudgetChange(formatBudgetInput(e.target.value))}
          placeholder="0"
          inputMode="numeric"
          className={inputCls}
        />
        <p className="text-xs text-muted-foreground mt-1">
          ใช้คำนวณระยะเวลาขั้นตอนที่มีกำหนดวันขั้นต่ำ (เช่น ประกาศ e-bidding)
        </p>
      </FieldRow>
      <FieldRow label="วิธีการจัดซื้อจัดจ้าง">
        <select value={method} onChange={(e) => onMethodChange(e.target.value)} className={inputCls}>
          {STEP1_METHOD_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          ใช้ร่วมกับวงเงินงบประมาณในการคำนวณวันทำการขั้นต่ำของระบบ
        </p>
      </FieldRow>
      <ResponsibleOfficerField
        stepNumber={1}
        value={responsibleName}
        onChange={onResponsibleNameChange}
      />
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
  onCommitteeChange: (listKey: Step2CommitteeListKey, index: number, value: string) => void;
  onAddCommittee: (listKey: Step2CommitteeListKey) => void;
  onRemoveCommittee: (listKey: Step2CommitteeListKey, index: number) => void;
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
};

function CommitteeMemberList({
  title,
  members,
  listKey,
  onCommitteeChange,
  onAddCommittee,
  onRemoveCommittee,
}: {
  title: string;
  members: string[];
  listKey: Step2CommitteeListKey;
  onCommitteeChange: (listKey: Step2CommitteeListKey, index: number, value: string) => void;
  onAddCommittee: (listKey: Step2CommitteeListKey) => void;
  onRemoveCommittee: (listKey: Step2CommitteeListKey, index: number) => void;
}) {
  const safeMembers = members?.length ? members : ["", "", ""];
  const showEvenWarning = shouldWarnEvenCommitteeCount(safeMembers);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button
          type="button"
          onClick={() => onAddCommittee(listKey)}
          className="h-8 px-2.5 rounded-md border border-input text-xs hover:bg-accent inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มกรรมการ
        </button>
      </div>
      <div className="space-y-2">
        {safeMembers.map((name, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => onCommitteeChange(listKey, idx, e.target.value)}
              placeholder={idx === 0 ? "ประธานกรรมการ" : `กรรมการคนที่ ${idx + 1}`}
              className={inputCls}
            />
            {safeMembers.length > 3 && (
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

/** ขั้นตอนที่ 2 — แต่งตั้งคณะกรรมการและกำหนดราคากลาง */
export function Step2DetailForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  readOnly,
  committees,
  onCommitteeModeChange,
  onCommitteeChange,
  onAddCommittee,
  onRemoveCommittee,
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
}: Step2FormProps) {
  const medianPriceDisplay =
    medianPrice.approved_median_price != null && medianPrice.approved_median_price > 0
      ? formatBudgetInput(String(medianPrice.approved_median_price))
      : "";

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

  return (
    <div className="space-y-4 max-w-2xl">
      <SmartChecklist
        stepNumber={2}
        stepLabel="ขั้นตอนที่ 2"
        items={getSmartChecklistItems(2)}
        manualChecklist={checklist as Record<string, boolean>}
        autoStates={autoCheckStates}
        onManualChange={(key, checked) =>
          onChecklistChange(key as Step2ChecklistKey, checked)
        }
        readOnly={readOnly}
        docBinder={docBinder}
      />

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
            />
            <div className="border-t border-border pt-4">
              <CommitteeMemberList
                title="คณะกรรมการกำหนดราคากลาง"
                members={committees.median_price_members}
                listKey="median_price_members"
                onCommitteeChange={onCommitteeChange}
                onAddCommittee={onAddCommittee}
                onRemoveCommittee={onRemoveCommittee}
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
          <ThaiDatePicker
            value={committeeOrder.appointment_order_date ?? ""}
            onChange={(v) => onCommitteeOrderChange({ appointment_order_date: v })}
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
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 2: ข้อมูลราคากลาง</SectionTitle>
        <FieldRow label="ราคากลาง (บาท)">
          <input
            value={medianPriceDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              onMedianPriceChange({
                approved_median_price: raw ? Number(raw) : null,
              });
            }}
            placeholder="0"
            inputMode="numeric"
            className={inputCls}
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
            <p className="text-xs text-warning mt-2 font-medium">{STEP2_MEDIAN_OVER_BUDGET_MSG}</p>
          )}
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานอนุมัติราคากลาง">
          <ThaiDatePicker
            value={medianPrice.median_price_approval_date ?? ""}
            minDate={appointmentDate || undefined}
            onChange={(v) => onMedianPriceChange({ median_price_approval_date: v })}
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
  step2Bg06Uploaded: boolean;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  step1ResponsibleDefault?: string;
  docBinder: Step3DocBinder;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>;
}

/** ขั้นตอนที่ 3 — จัดทำร่างประกาศและเอกสารประกวดราคา */
export function Step3DetailForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  readOnly,
  announcement,
  onAnnouncementChange,
  approvedMedianPrice,
  medianPriceApprovalDate,
  step2Bg06Uploaded,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  docBinder,
}: Step3FormProps) {
  const [endDateRejected, setEndDateRejected] = useState(false);
  const [startDateRejected, setStartDateRejected] = useState(false);
  const [procApprovalDateRejected, setProcApprovalDateRejected] = useState(false);

  const medianDisplay = resolveProjectMedianPrice({
    approved_median_price: approvedMedianPrice,
    estimated_price: null,
  });

  const approvalDate = announcement.approval_letter_date ?? "";

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
    if (!startISO) {
      onAnnouncementChange({ publication_start: "", publication_end: "" });
      return;
    }
    if (approvalDate && startISO < approvalDate) return;
    if (!isWorkdayISO(startISO)) {
      setStartDateRejected(true);
      return;
    }
    const autoEnd = defaultPublicationEndISO(startISO);
    onAnnouncementChange({ publication_start: startISO, publication_end: autoEnd });
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
    onAnnouncementChange({ feedback_result: value });

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
    if (!publicationEnd || !feedbackReportUploaded) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync เมื่อ publication_end หรือเปิดฟอร์มขอซื้อขอจ้าง
  }, [publicationEnd, feedbackReportUploaded]);

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

  return (
    <div className="space-y-4 max-w-2xl">
      <SmartChecklist
        stepNumber={3}
        stepLabel="ขั้นตอนที่ 3"
        items={getSmartChecklistItems(3)}
        manualChecklist={checklist as Record<string, boolean>}
        autoStates={autoCheckStates}
        onManualChange={(key, checked) =>
          onChecklistChange(key as Step3ChecklistKey, checked)
        }
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 1: ร่างเอกสารและ Spec (Anti-Lock-in)</SectionTitle>
        <FieldRow label="ร่าง TOR / รายละเอียดคุณลักษณะเฉพาะ">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.DRAFT_TOR_SPEC}
            label={STEP3_DRAFT_TOR_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="ร่างประกาศและร่างเอกสารประกวดราคา">
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.DRAFT_ANNOUNCEMENT_BID}
            label={STEP3_DRAFT_ANNOUNCEMENT_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="ตารางราคากลาง (บก.06)">
          {step2Bg06Uploaded ? (
            <p className="text-xs text-muted-foreground mb-2">
              ✓ พบไฟล์ บก.06 จากขั้นตอนที่ 2 แล้ว — ไม่จำเป็นต้องอัปโหลดซ้ำ
            </p>
          ) : null}
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.MEDIAN_BG06}
            label={STEP3_MEDIAN_BG06_UPLOAD_LABEL}
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
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
        <FieldRow label="เลขที่บันทึกข้อความเสนอขอเห็นชอบ (ภายในหน่วยงาน)">
          <input
            value={announcement.approval_letter_no ?? ""}
            onChange={(e) => onAnnouncementChange({ approval_letter_no: e.target.value })}
            placeholder="(เช่น บันทึกข้อความ ที่ กษ ๐๖๐๒ / ๑๒๓)"
            className={inputCls}
          />
          <InlineDocUpload
            project={docBinder.project}
            stepNumber={docBinder.stepNumber}
            documentType={STEP3_DOC.MEMO_APPROVAL}
            label="📎 PDF บันทึกข้อความเห็นชอบ"
            existing={docBinder.docs}
            onChange={docBinder.onDocsChange}
          />
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนาม">
          <ThaiDatePicker
            value={announcement.approval_letter_date ?? ""}
            onChange={handleApprovalDateChange}
          />
          {announcement.approval_letter_date && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(announcement.approval_letter_date)}
            </p>
          )}
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>ข้อมูลการเผยแพร่ระบบ e-GP</SectionTitle>
        <FieldRow label="เลขที่โครงการในระบบ e-GP">
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
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="วันที่เริ่มเผยแพร่ร่างประกาศ">
            <ThaiDatePicker
              value={announcement.publication_start ?? ""}
              onChange={handlePublicationStartChange}
              minDate={approvalDate || undefined}
              workdaysOnly
              disabled={!approvalDate}
              onInvalidDate={() => setStartDateRejected(true)}
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
          <FieldRow label="วันที่สิ้นสุดการเผยแพร่ร่างประกาศ">
            <ThaiDatePicker
              value={announcement.publication_end ?? ""}
              onChange={handlePublicationEndChange}
              minDate={minPublicationEnd || undefined}
              workdaysOnly
              disabled={!announcement.publication_start}
              onInvalidDate={() => setEndDateRejected(true)}
            />
            {minPublicationEnd && (
              <p className="text-xs text-muted-foreground mt-1">
                ค่าเริ่มต้น {formatThaiDate(minPublicationEnd)} (+ {MIN_DRAFT_PUBLICATION_WORKDAYS}{" "}
                วันทำการถัดจากวันเริ่ม ไม่นับวันเริ่มเผยแพร่) — เลือกขยายระยะเวลาได้ แต่ห้ามต่ำกว่า{" "}
                {formatThaiDate(minPublicationEnd)}
              </p>
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
        {startDateRejected && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_NON_WORKDAY_MSG} (วันเริ่มเผยแพร่)
          </p>
        )}
        {(publicationStartNonWorkday || publicationEndNonWorkday) &&
          !startDateRejected &&
          !endDateRejected && (
          <p className="text-xs text-destructive font-medium">
            {STEP3_PUBLICATION_NON_WORKDAY_MSG}
          </p>
        )}
        {publicationStartBeforeApproval && (
          <p className="text-xs text-destructive">
            วันเริ่มเผยแพร่ต้องไม่ก่อนวันที่หัวหน้าหน่วยงานเห็นชอบ/ลงนาม — ระบบจะล้างค่าวันเผยแพร่เมื่อบันทึกวันลงนามใหม่
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
              มีผู้จำหน่ายวิจารณ์ (ต้องแก้ไข/ชี้แจง)
            </label>
          </div>
        </div>
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

        {feedbackReportUploaded && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <SectionTitle>จัดทำรายงานขอซื้อหรือขอจ้าง</SectionTitle>
            <FieldRow label="เลขที่หนังสือรายงานขอซื้อขอจ้าง">
              <input
                value={announcement.procurement_request_letter_no ?? ""}
                onChange={(e) =>
                  onAnnouncementChange({ procurement_request_letter_no: e.target.value })
                }
                placeholder="กษ ๐๖๐๒ / ๔๕๖"
                className={inputCls}
              />
            </FieldRow>
            <FieldRow label="วันที่หัวหน้าหน่วยงานอนุมัติเห็นชอบ">
              <ThaiDatePicker
                value={announcement.procurement_request_approval_date ?? ""}
                onChange={handleProcApprovalDateChange}
                minDate={publicationEnd || undefined}
                disabled={!publicationEnd}
                onInvalidDate={() => setProcApprovalDateRejected(true)}
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
            <FieldRow label="ระยะเวลารับซองราคา / พิจารณาผล (วันทำการ)">
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
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ใช้คำนวณวันปิดรับซองและเดดไลน์คณะกรรมการพิจารณาผลในขั้นตอนที่ 4 (ข้อ 55)
              </p>
            </FieldRow>
          </div>
        )}

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
  );
}

type Step4DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
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
  docBinder: Step4DocBinder;
};

function Step4SmartChecklist({
  checklist,
  onChecklistChange,
  autoCheckStates,
  readOnly,
  docBinder,
}: {
  checklist: Step4Checklist;
  onChecklistChange: (key: Step4ChecklistKey, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  docBinder: Step4DocBinder;
}) {
  return (
    <SmartChecklist
      stepNumber={4}
      stepLabel="ขั้นตอนที่ 4"
      items={getSmartChecklistItems(4)}
      manualChecklist={checklist as Record<string, boolean>}
      autoStates={autoCheckStates}
      onManualChange={(key, checked) =>
        onChecklistChange(key as Step4ChecklistKey, checked)
      }
      readOnly={readOnly}
      docBinder={docBinder}
    />
  );
}

function parseOptionalCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** ขั้นตอนที่ 4 — รายชื่อผู้เสนอราคาและผลการเสนอราคา */
export function Step4DetailForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  readOnly,
  bidResult,
  onBidResultChange,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault = "",
  step4Timeline,
  docBinder,
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

  const winningAmountDisplay =
    bidResult.winning_bid_amount != null && bidResult.winning_bid_amount > 0
      ? formatBudgetInput(String(bidResult.winning_bid_amount))
      : "";
  const finalAgreedAmountDisplay =
    bidResult.final_agreed_amount != null && bidResult.final_agreed_amount > 0
      ? formatBudgetInput(String(bidResult.final_agreed_amount))
      : "";

  const [approvalDateRejected, setApprovalDateRejected] = useState(false);
  const approvalManuallySetRef = useRef(false);

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

  /** ปรับค่า auto ให้ไม่ต่ำกว่าเดดไลน์คณะกรรมการ เมื่อดึงข้อมูลขั้น 3 มาทีหลัง */
  useEffect(() => {
    if (!committeeReviewDeadlineISO || approvalManuallySetRef.current) return;
    const current = bidResult.evaluation_report_approval_date ?? "";
    if (current && current < committeeReviewDeadlineISO) {
      onBidResultChange({ evaluation_report_approval_date: committeeReviewDeadlineISO });
      setApprovalDateRejected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync กับเดดไลน์คณะกรรมการ
  }, [committeeReviewDeadlineISO, bidResult.evaluation_report_approval_date]);

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
  const showApprovalDateError = approvalDateRejected || approvalBeforeBidEnd;
  const approvalOverdue = isStep4EvaluationApprovalOverdue(
    approvalDate,
    committeeReviewDeadlineISO,
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <Step4SmartChecklist
        checklist={checklist}
        onChecklistChange={onChecklistChange}
        autoCheckStates={autoCheckStates}
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 1: ข้อมูลการแข่งขัน (ดึงค่ามาจากระบบ e-GP)</SectionTitle>
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
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>กลุ่มที่ 2: ข้อมูลผู้ชนะและการต่อรองราคา</SectionTitle>
        <FieldRow label="ชื่อผู้ชนะการเสนอราคา">
          <input
            value={bidResult.winning_bidder_name ?? ""}
            onChange={(e) => onBidResultChange({ winning_bidder_name: e.target.value })}
            placeholder="ระบุชื่อนิติบุคคล/ผู้เสนอราคาที่ชนะ"
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="ราคาที่เสนอชนะ (บาท)">
          <input
            value={winningAmountDisplay}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onBidResultChange({
                winning_bid_amount: raw ? parseBudgetInput(raw) : null,
              });
            }}
            placeholder="0"
            inputMode="numeric"
            className={inputCls}
          />
          {bidResult.winning_bid_amount != null && bidResult.winning_bid_amount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatBaht(bidResult.winning_bid_amount)} บาท
            </p>
          )}
        </FieldRow>
        <FieldRow label="ราคาที่ตกลงซื้อหรือจ้างจริง (บาท)">
          <input
            value={finalAgreedAmountDisplay}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onBidResultChange({
                final_agreed_amount: raw ? parseBudgetInput(raw) : null,
              });
            }}
            placeholder="กรอกเมื่อมีการต่อรองราคา"
            inputMode="numeric"
            className={inputCls}
          />
          {bidResult.final_agreed_amount != null && bidResult.final_agreed_amount > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              {formatBaht(bidResult.final_agreed_amount)} บาท — ใช้เป็นฐานมูลค่าสัญญาในขั้นตอนที่ 8
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              หากเว้นว่าง ระบบจะใช้ราคาที่เสนอชนะเป็นฐานมูลค่าสัญญาในขั้นตอนที่ 8
            </p>
          )}
        </FieldRow>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <SectionTitle>{FORM_AUDIT_TRAIL_STANDARD.auditTrailGroupTitle}</SectionTitle>
        <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
          แนบหลักฐานไฟล์ที่ Smart Checklist ด้านบน · กลุ่มนี้บันทึกเลขที่หนังสือและวันที่อนุมัติผล
        </p>
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
        <FieldRow label="เลขที่หนังสือรายงานผลการพิจารณา">
          <input
            value={bidResult.evaluation_report_letter_no ?? ""}
            onChange={(e) =>
              onBidResultChange({ evaluation_report_letter_no: e.target.value })
            }
            placeholder="เช่น กษ ๐๖๐๒ / ๔๕๖"
            className={inputCls}
          />
        </FieldRow>
        <FieldRow label="วันที่หัวหน้าหน่วยงานลงนามอนุมัติผล">
          <ThaiDatePicker
            value={approvalDate}
            onChange={handleEvaluationApprovalDateChange}
            minDate={committeeReviewDeadlineISO || bidSubmissionEndDate || undefined}
            onInvalidDate={() => setApprovalDateRejected(true)}
          />
          {approvalDate && !showApprovalDateError && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatThaiDate(approvalDate)}
            </p>
          )}
          {showApprovalDateError && bidSubmissionEndDate && (
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
                <ThaiDatePicker
                  value={bidResult.review_extension_approval_date ?? ""}
                  onChange={(v) =>
                    onBidResultChange({ review_extension_approval_date: v })
                  }
                  minDate={approvalDate || bidSubmissionEndDate || undefined}
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

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <ResponsibleOfficerField
          stepNumber={4}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
      </div>
    </div>
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
  readOnly?: boolean;
  docBinder: Step6DocBinder;
};

/** ขั้นตอนที่ 6 — อุทธรณ์ (มาตรา 117) */
export function Step6AppealForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  appeal,
  onAppealChange,
  responsibleName,
  onResponsibleNameChange,
  step1ResponsibleDefault,
  note,
  onNoteChange,
  winnerAnnouncementDate,
  readOnly = false,
  docBinder,
}: Step6AppealFormProps) {
  const appealStatus = appeal.appeal_status ?? "";
  const checklistItems = getStep6ChecklistItems(appealStatus);
  const appealDeadlineISO = winnerAnnouncementDate
    ? computeAppealDeadlineISO(winnerAnnouncementDate)
    : "";
  const approvalDate = appeal.appeal_report_approval_date ?? "";

  return (
    <div className="space-y-4 max-w-2xl">
      <SmartChecklist
        stepNumber={6}
        stepLabel="ขั้นตอนที่ 6"
        items={checklistItems}
        manualChecklist={checklist as Record<string, boolean>}
        autoStates={autoCheckStates}
        onManualChange={(key, checked) =>
          onChecklistChange(key as Step6ChecklistKey, checked)
        }
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">กลุ่มที่ 1: ข้อมูลงานขั้นตอนอุทธรณ์</p>
        <ResponsibleOfficerField
          stepNumber={6}
          value={responsibleName}
          onChange={onResponsibleNameChange}
          step1Default={step1ResponsibleDefault}
        />
        <FieldRow label="⏱ วันสิ้นสุดระยะอุทธรณ์">
          <div className="space-y-1">
            <input
              type="text"
              readOnly
              value={
                appealDeadlineISO
                  ? formatThaiDateSlash(appealDeadlineISO)
                  : "— กรุณาบันทึกวันประกาศผู้ชนะในขั้นตอนที่ 5 ก่อน —"
              }
              className={`${inputCls} bg-muted/50 cursor-not-allowed`}
              aria-readonly
            />
            {appealDeadlineISO && (
              <p className="text-xs text-muted-foreground">
                คำนวณจากวันประกาศผู้ชนะ ({formatThaiDateSlash(winnerAnnouncementDate)}) + 7
                วันทำการ ไม่นับวันหยุดราชการ
              </p>
            )}
          </div>
        </FieldRow>
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
        <SectionTitle>กลุ่มที่ 2: สถานะการอุทธรณ์โครงการ</SectionTitle>
        <fieldset disabled={readOnly} className="space-y-2 disabled:opacity-60">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="step6_appeal"
              checked={appeal.appeal_status === "none"}
              onChange={() =>
                onAppealChange({
                  appeal_status: "none",
                  appeal_report_letter_no: "",
                  appeal_report_approval_date: "",
                  appeal_consideration_status: "",
                })
              }
              className="mt-0.5 h-4 w-4"
            />
            ไม่มีผู้ยื่นอุทธรณ์ภายในกำหนด (พร้อมเดินหน้าทำสัญญา)
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="step6_appeal"
              checked={appeal.appeal_status === "pending"}
              onChange={() => onAppealChange({ appeal_status: "pending" })}
              className="mt-0.5 h-4 w-4"
            />
            มีผู้ยื่นอุทธรณ์โครงการ (ชะลอการทำสัญญาและต้องพิจารณาอุทธรณ์)
          </label>
        </fieldset>

        {appeal.appeal_status === "pending" && (
          <div className="space-y-4 rounded-md border border-amber-300/50 bg-amber-50/50 p-4">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ มีผู้ยื่นอุทธรณ์ — กรุณาบันทึกหนังสือรายงานผลและแนบหลักฐานตาม Checklist
            </p>
            <FieldRow label="เลขที่หนังสือรายงานผลการพิจารณาอุทธรณ์">
              <input
                value={appeal.appeal_report_letter_no ?? ""}
                onChange={(e) => onAppealChange({ appeal_report_letter_no: e.target.value })}
                placeholder="เช่น กษ ๐๖๐๒ / ๔๕๖"
                className={inputCls}
                disabled={readOnly}
              />
            </FieldRow>
            <FieldRow label="วันที่หัวหน้าหน่วยงานลงนามในหนังสือผลอุทธรณ์">
              <div className="space-y-1">
                <ThaiDatePicker
                  value={approvalDate}
                  onChange={(v) => onAppealChange({ appeal_report_approval_date: v })}
                  disabled={readOnly}
                />
                {approvalDate && (
                  <p className="text-xs text-muted-foreground">
                    📅 {formatThaiDate(approvalDate)}
                  </p>
                )}
              </div>
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
  docBinder: Step5DocBinder;
};

/** ขั้นตอนที่ 5 — จัดทำและประกาศผู้ชนะการเสนอราคา (มาตรา 66) */
export function Step5DetailForm({
  checklist,
  onChecklistChange,
  autoCheckStates,
  readOnly,
  announcement,
  onAnnouncementChange,
  evaluationApprovalDate,
  docBinder,
}: Step5FormProps) {
  const [announcementDateRejected, setAnnouncementDateRejected] = useState(false);
  const minAnnouncementDate = evaluationApprovalDate?.trim() || undefined;
  const winnerDate = announcement.winner_announcement_date ?? "";
  const showAnnouncementDateError =
    announcementDateRejected ||
    (!!winnerDate &&
      !!minAnnouncementDate &&
      isStep5WinnerAnnouncementBeforeEvaluation(winnerDate, minAnnouncementDate));
  const announcementDateErrorMsg = minAnnouncementDate
    ? getStep5WinnerAnnouncementBeforeEvaluationMsg(minAnnouncementDate)
    : "";

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

  return (
    <div className="space-y-4 max-w-2xl">
      <SmartChecklist
        stepNumber={5}
        stepLabel="ขั้นตอนที่ 5"
        items={getSmartChecklistItems(5)}
        manualChecklist={checklist as Record<string, boolean>}
        autoStates={autoCheckStates}
        onManualChange={(key, checked) =>
          onChecklistChange(key as Step5ChecklistKey, checked)
        }
        readOnly={readOnly}
        docBinder={docBinder}
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">
          กลุ่มที่ 1: ข้อมูลประกาศผู้ชนะในระบบ e-GP
        </p>
        <FieldRow label="เลขที่ประกาศผลผู้ชนะในระบบ e-GP">
          <input
            type="text"
            value={announcement.winner_announcement_no ?? ""}
            onChange={(e) => onAnnouncementChange({ winner_announcement_no: e.target.value })}
            placeholder="เช่น เลขที่ประกาศจากระบบ e-GP"
            className={inputCls}
            disabled={readOnly}
          />
        </FieldRow>
        <FieldRow label="วันที่ลงนามในประกาศผู้ชนะ">
          <div className="space-y-1">
            <ThaiDatePicker
              value={winnerDate}
              onChange={handleWinnerAnnouncementDateChange}
              minDate={minAnnouncementDate}
              disabled={readOnly}
              onInvalidDate={() => {
                setAnnouncementDateRejected(true);
                if (announcementDateErrorMsg) toast.error(announcementDateErrorMsg);
              }}
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
                (วันที่หัวหน้าหน่วยงานอนุมัติผลการพิจารณา)
              </p>
            )}
            {showAnnouncementDateError && announcementDateErrorMsg && (
              <p className="text-xs text-destructive font-medium mt-1">
                {announcementDateErrorMsg}
              </p>
            )}
          </div>
        </FieldRow>
      </div>
    </div>
  );
}

/** Smart Checklist มาตรฐาน — ขั้นตอนที่ 7–10 (ใช้ภายใน GenericStepDetailForm) */
function GenericStepChecklistPanel({
  stepNumber,
  manualChecklist,
  onManualChange,
  autoCheckStates,
  readOnly,
  docBinder,
}: {
  stepNumber: number;
  manualChecklist: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  autoCheckStates: Record<string, boolean>;
  readOnly?: boolean;
  docBinder?: SmartChecklistDocBinder;
}) {
  const items = getSmartChecklistItems(stepNumber);
  if (items.length === 0) return null;
  return (
    <SmartChecklist
      stepNumber={stepNumber}
      stepLabel={`ขั้นตอนที่ ${stepNumber}`}
      items={items}
      manualChecklist={manualChecklist}
      autoStates={autoCheckStates}
      onManualChange={onManualChange}
      readOnly={readOnly}
      docBinder={docBinder}
    />
  );
}

type GenericStepDetailFormProps = {
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
};

/** ขั้นตอนที่ 7–10 — Checklist ด้านบน ฟอร์มทั่วไปด้านล่าง (มาตรฐานเดียวกับ Step 1–6) */
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
            <ThaiDatePicker value={dueDate} onChange={onDueDateChange} disabled={readOnly} />
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
