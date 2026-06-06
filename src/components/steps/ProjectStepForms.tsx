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
} from "@/lib/workdays";
import { InlineDocUpload } from "@/components/steps/InlineDocUpload";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import {
  STEP3_DOC,
  STEP3_FEEDBACK_HELPER_HAS_COMMENTS,
  STEP3_FEEDBACK_HELPER_NONE,
  STEP3_FEEDBACK_UPLOAD_LABEL,
} from "@/lib/step-doc-types";
import {
  STEP1_METHOD_OPTIONS,
  formatBudgetInput,
  type Step3Announcement,
  type Step3FeedbackResult,
} from "@/lib/step-form";

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

type Step1FormProps = {
  egpCode: string;
  onEgpCodeChange: (v: string) => void;
  budget: string;
  onBudgetChange: (v: string) => void;
  estimatedPrice: string;
  onEstimatedPriceChange: (v: string) => void;
  method: string;
  onMethodChange: (v: string) => void;
};

/** ขั้นตอนที่ 1 — จัดทำแผนการจัดซื้อจัดจ้าง */
export function Step1DetailForm({
  egpCode,
  onEgpCodeChange,
  budget,
  onBudgetChange,
  estimatedPrice,
  onEstimatedPriceChange,
  method,
  onMethodChange,
}: Step1FormProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground">ข้อมูลขั้นตอนที่ 1 — จัดทำแผนการจัดซื้อจัดจ้าง</p>
      <FieldRow label="เลขที่โครงการ (e-GP)">
        <input
          value={egpCode}
          onChange={(e) => onEgpCodeChange(e.target.value)}
          placeholder="เช่น P6805001234"
          className={inputCls}
        />
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
      <FieldRow label="ราคากลาง (บาท)">
        <input
          value={estimatedPrice}
          onChange={(e) => onEstimatedPriceChange(formatBudgetInput(e.target.value))}
          placeholder="0"
          inputMode="numeric"
          className={inputCls}
        />
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
    </div>
  );
}

type Step2FormProps = {
  checklist: {
    draft_order_done: boolean;
    director_signed_order: boolean;
    committee_ack_no_conflict: boolean;
    median_price_report_done: boolean;
    director_signed_median_price: boolean;
  };
  onChecklistChange: (
    key:
      | "draft_order_done"
      | "director_signed_order"
      | "committee_ack_no_conflict"
      | "median_price_report_done"
      | "director_signed_median_price",
    checked: boolean,
  ) => void;
  committeeMembers: string[];
  onCommitteeChange: (index: number, value: string) => void;
  onAddCommittee: () => void;
  onRemoveCommittee: (index: number) => void;
};

/** ขั้นตอนที่ 2 — แต่งตั้งคณะกรรมการและกำหนดราคากลาง */
export function Step2DetailForm({
  checklist,
  onChecklistChange,
  committeeMembers,
  onCommitteeChange,
  onAddCommittee,
  onRemoveCommittee,
}: Step2FormProps) {
  const safeChecklist = {
    draft_order_done: checklist?.draft_order_done ?? false,
    director_signed_order: checklist?.director_signed_order ?? false,
    committee_ack_no_conflict: checklist?.committee_ack_no_conflict ?? false,
    median_price_report_done: checklist?.median_price_report_done ?? false,
    director_signed_median_price: checklist?.director_signed_median_price ?? false,
  };
  const safeMembers = committeeMembers?.length ? committeeMembers : ["", "", ""];

  const items: Array<{
    key: keyof Step2FormProps["checklist"];
    label: string;
  }> = [
    { key: "draft_order_done", label: "ร่างคำสั่งแต่งตั้งคณะกรรมการจัดทำ TOR และราคากลางเสร็จเรียบร้อย" },
    { key: "director_signed_order", label: "หัวหน้าหน่วยงาน (ผอ.) ลงนามอนุมัติคำสั่ง" },
    { key: "committee_ack_no_conflict", label: "คณะกรรมการรับทราบคำสั่ง (ตรวจสอบแล้วไม่มีผลประโยชน์ทับซ้อน)" },
    { key: "median_price_report_done", label: "จัดทำรายงานผลการกำหนดราคากลางเสร็จสมบูรณ์" },
    { key: "director_signed_median_price", label: "หัวหน้าหน่วยงาน (ผอ.) ลงนามอนุมัติราคากลาง" },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-medium text-foreground">Smart Checklist — ขั้นตอนที่ 2</p>
      <div className="rounded-md border bg-background p-3 space-y-2">
        {items.map((item) => (
          <label key={item.key} className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={safeChecklist[item.key]}
              onChange={(e) => onChecklistChange(item.key, e.target.checked)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">รายชื่อคณะกรรมการจัดทำ TOR และราคากลาง</p>
          <button
            type="button"
            onClick={onAddCommittee}
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
                onChange={(e) => onCommitteeChange(idx, e.target.value)}
                placeholder={idx === 0 ? "ประธานกรรมการ" : `กรรมการคนที่ ${idx + 1}`}
                className={inputCls}
              />
              {idx >= 3 && (
                <button
                  type="button"
                  onClick={() => onRemoveCommittee(idx)}
                  className="h-10 w-10 rounded-md border border-input text-destructive hover:bg-destructive/10 flex items-center justify-center"
                  title="ลบแถวนี้"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Step3ChecklistState = {
  committee_tor_bid_docs_done: boolean;
  director_report_submitted: boolean;
  draft_published_for_comment: boolean;
};

type Step3DocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
};

type Step3FormProps = {
  checklist: Step3ChecklistState;
  onChecklistChange: (
    key: keyof Step3ChecklistState,
    checked: boolean,
  ) => void;
  announcement: Step3Announcement;
  onAnnouncementChange: (patch: Partial<Step3Announcement>) => void;
  responsibleName: string;
  onResponsibleNameChange: (value: string) => void;
  docBinder: Step3DocBinder;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground">{children}</p>;
}

/** ขั้นตอนที่ 3 — จัดทำร่างประกาศและเอกสารประกวดราคา */
export function Step3DetailForm({
  checklist,
  onChecklistChange,
  announcement,
  onAnnouncementChange,
  responsibleName,
  onResponsibleNameChange,
  docBinder,
}: Step3FormProps) {
  const [endDateRejected, setEndDateRejected] = useState(false);
  const [procApprovalDateRejected, setProcApprovalDateRejected] = useState(false);
  const safeChecklist = {
    committee_tor_bid_docs_done: checklist?.committee_tor_bid_docs_done ?? false,
    director_report_submitted: checklist?.director_report_submitted ?? false,
    draft_published_for_comment: checklist?.draft_published_for_comment ?? false,
  };

  const checklistItems: Array<{ key: keyof Step3ChecklistState; label: string }> = [
    {
      key: "committee_tor_bid_docs_done",
      label: "คณะกรรมการดำเนินการจัดทำร่าง TOR และร่างเอกสารประกวดราคาเสร็จเรียบร้อย",
    },
    {
      key: "director_report_submitted",
      label: "จัดทำรายงานเสนอหัวหน้าหน่วยงานเพื่อขอความเห็นชอบร่างประกาศและร่างเอกสาร",
    },
    {
      key: "draft_published_for_comment",
      label:
        "นำร่างประกาศและร่างเอกสารประกวดราคาไปเผยแพร่รับฟังความคิดเห็นในระบบ e-GP และเว็บไซต์หน่วยงาน (ถ้ามี)",
    },
  ];

  const approvalDate = announcement.approval_letter_date ?? "";

  const publicationWorkdays = useMemo(
    () =>
      countWorkdaysAfterStartISO(
        announcement.publication_start ?? "",
        announcement.publication_end ?? "",
      ),
    [announcement.publication_start, announcement.publication_end],
  );

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
    if (!startISO) {
      onAnnouncementChange({ publication_start: "", publication_end: "" });
      return;
    }
    if (approvalDate && startISO < approvalDate) return;
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
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <SectionTitle>Smart Checklist</SectionTitle>
        <div className="rounded-md border bg-background p-3 space-y-2">
          {checklistItems.map((item) => (
            <label key={item.key} className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={safeChecklist[item.key]}
                onChange={(e) => onChecklistChange(item.key, e.target.checked)}
              />
              <span>{item.label}</span>
            </label>
          ))}
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
        </FieldRow>
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow label="วันที่เริ่มเผยแพร่ร่างประกาศ">
            <ThaiDatePicker
              value={announcement.publication_start ?? ""}
              onChange={handlePublicationStartChange}
              minDate={approvalDate || undefined}
              disabled={!approvalDate}
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
            {STEP3_PUBLICATION_END_TOO_SHORT_MSG}
            {minPublicationEnd && (
              <span className="font-normal text-destructive/90">
                {" "}
                (วันสิ้นสุดขั้นต่ำ: {formatThaiDate(minPublicationEnd)})
              </span>
            )}
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
            <FieldRow label="ระยะเวลาพิจารณาผลของคณะกรรมการ (วันทำการ)">
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
                placeholder="ระบุกรอบเวลาที่คณะกรรมการฯ ต้องตรวจซองให้เสร็จตามที่ขออนุมัติไว้"
                className={inputCls}
              />
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
        <FieldRow label="เจ้าหน้าที่ผู้รับผิดชอบ">
          <input
            value={responsibleName}
            onChange={(e) => onResponsibleNameChange(e.target.value)}
            placeholder="ระบุชื่อเจ้าหน้าที่ผิดชอบโครงการ"
            className={inputCls}
          />
        </FieldRow>
      </div>
    </div>
  );
}
