import { Check, Lock } from "lucide-react";
import { InlineDocUpload } from "@/components/steps/InlineDocUpload";
import {
  getInlineEvidenceByKey,
} from "@/lib/checklist-inline-evidence";
import { STEP2_DOC, STEP3_DOC } from "@/lib/step-doc-types";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import { mergeDocsForChecklistDisplay, type InheritedDocSource } from "@/lib/step-doc-display";
import {
  buildEffectiveChecklist,
  countSmartChecklistProgressFromItems,
  type SmartChecklistItem,
} from "@/lib/smart-checklist";

export type { StepDocRef } from "@/lib/smart-checklist";
export { computeReactiveChecklistEffective } from "@/lib/smart-checklist";

export type SmartChecklistDocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
  /** เอกสารจากขั้นตอนก่อนหน้า — แสดงสถานะ inherited บน UI */
  inheritedDocs?: InheritedDocSource[];
};

type Props = {
  stepNumber: number;
  stepLabel: string;
  items: SmartChecklistItem[];
  manualChecklist: Record<string, boolean>;
  autoStates: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  readOnly?: boolean;
  docBinder?: SmartChecklistDocBinder;
  projectType?: string | null;
};

export function SmartChecklist({
  stepNumber,
  stepLabel,
  items,
  manualChecklist = {},
  autoStates = {},
  onManualChange,
  readOnly = false,
  docBinder,
  projectType,
}: Props) {
  const evidenceByKey = getInlineEvidenceByKey(stepNumber, projectType);
  const stepDocs = docBinder?.docs ?? [];
  const mergedDocs = docBinder
    ? mergeDocsForChecklistDisplay(stepDocs, docBinder.inheritedDocs)
    : stepDocs;

  const effective = buildEffectiveChecklist(
    stepNumber,
    manualChecklist,
    autoStates,
    docBinder ? mergedDocs : undefined,
    undefined,
    projectType,
  );

  const { done, total, allDone } = countSmartChecklistProgressFromItems(items, effective);
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const autoItems = items.filter((i) => i.mode === "auto");
  const manualItems = items.filter((i) => i.mode === "manual");

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Smart Checklist — {stepLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            แนบหลักฐานในแถวเดียวกัน · อัปโหลดสำเร็จติ๊กอัตโนมัติ · ครบ 100% ก่อนไปขั้นถัดไป
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            allDone
              ? "bg-success/15 text-success border border-success/30"
              : "bg-background text-muted-foreground border border-border"
          }`}
        >
          {done}/{total} ({progressPct}%)
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            allDone ? "bg-success" : "bg-primary"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {autoItems.length > 0 && (
        <ChecklistGroup
          stepNumber={stepNumber}
          title="กลุ่มที่ 1: Auto-Check (ระบบ + หลักฐานอัปโหลด)"
          subtitle="ติ๊กอัตโนมัติเมื่อข้อมูลฟอร์ม/ไฟล์หลักฐานครบ"
          items={autoItems}
          effective={effective}
          evidenceByKey={evidenceByKey}
          docBinder={docBinder}
          readOnly={readOnly}
          onManualChange={onManualChange}
          inheritedDocs={docBinder?.inheritedDocs}
        />
      )}

      {manualItems.length > 0 && (
        <ChecklistGroup
          stepNumber={stepNumber}
          title="กลุ่มที่ 2: Manual-Check (ยืนยันความถูกต้อง)"
          subtitle="ติ๊กยืนยันในแต่ละข้อหลังตรวจสอบเอกสาร — แนบหลักฐานเพิ่มเติมในแถวได้ (ถ้ามี)"
          items={manualItems}
          effective={effective}
          evidenceByKey={evidenceByKey}
          docBinder={docBinder}
          readOnly={readOnly}
          onManualChange={onManualChange}
          inheritedDocs={docBinder?.inheritedDocs}
        />
      )}
    </div>
  );
}

function ChecklistGroup({
  stepNumber,
  title,
  subtitle,
  items,
  effective,
  evidenceByKey,
  docBinder,
  readOnly,
  onManualChange,
  inheritedDocs,
}: {
  stepNumber: number;
  title: string;
  subtitle: string;
  items: SmartChecklistItem[];
  effective: Record<string, boolean>;
  evidenceByKey: Map<string, import("@/lib/checklist-inline-evidence").ChecklistInlineEvidence>;
  docBinder?: SmartChecklistDocBinder;
  readOnly?: boolean;
  onManualChange?: (key: string, checked: boolean) => void;
  inheritedDocs?: InheritedDocSource[];
}) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const checked = !!effective[item.key];
          const evidence = evidenceByKey.get(item.key);
          const isUploadDriven = !!evidence?.uploadDriven;
          const showManualCheckbox = item.mode === "manual";

          return (
            <div
              key={item.key}
              className={`rounded-md border px-3 py-2.5 transition-colors ${
                checked
                  ? "border-success/30 bg-success/5"
                  : "border-border bg-muted/10"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="flex items-start gap-2.5 text-sm min-w-0 flex-1">
                  {showManualCheckbox ? (
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      checked={checked}
                      disabled={readOnly}
                      onChange={(e) => onManualChange?.(item.key, e.target.checked)}
                    />
                  ) : (
                    <span
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                        checked
                          ? "bg-success border-success text-success-foreground"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                      title={isUploadDriven ? "ติ๊กอัตโนมัติเมื่อแนบหลักฐาน" : "Auto-Check"}
                    >
                      {checked ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Lock className="h-2.5 w-2.5" />
                      )}
                    </span>
                  )}
                  <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                    <span className="font-medium text-muted-foreground mr-1">{index + 1}.</span>
                    {item.label}
                    {item.hint && (
                      <span className="block text-xs text-muted-foreground mt-0.5 font-normal leading-relaxed">
                        ({item.hint})
                      </span>
                    )}
                    {item.complianceHelperText && (
                      <span className="block text-xs text-muted-foreground mt-1.5 font-normal leading-relaxed">
                        {item.complianceHelperText}
                      </span>
                    )}
                  </span>
                </div>

                {evidence && docBinder && item.key === "hearing_files_prepared" && stepNumber === 3 && (
                  <div className="shrink-0 sm:max-w-[300px] w-full sm:w-auto pl-6 sm:pl-0 space-y-2">
                    <InlineDocUpload
                      project={docBinder.project}
                      stepNumber={docBinder.stepNumber}
                      documentType={STEP3_DOC.DRAFT_TOR_SPEC}
                      label="ร่าง TOR / คุณลักษณะเฉพาะ"
                      existing={docBinder.docs}
                      onChange={docBinder.onDocsChange}
                      compact
                      filePolicyId="tor_spec"
                      readOnly={readOnly}
                    />
                    <InlineDocUpload
                      project={docBinder.project}
                      stepNumber={docBinder.stepNumber}
                      documentType={STEP3_DOC.DRAFT_ANNOUNCEMENT_BID}
                      label="ร่างประกาศและเอกสารประกวดราคา"
                      existing={docBinder.docs}
                      onChange={docBinder.onDocsChange}
                      compact
                      filePolicyId="tor_spec"
                      readOnly={readOnly}
                    />
                    <p className="text-xs text-muted-foreground px-1">
                      ตารางราคากลาง — อ้างอิงจากขั้นตอนที่ 2
                    </p>
                  </div>
                )}

                {evidence && docBinder && !(item.key === "hearing_files_prepared" && stepNumber === 3) && (
                  <div className="shrink-0 sm:max-w-[280px] w-full sm:w-auto pl-6 sm:pl-0">
                    <InlineDocUpload
                      project={docBinder.project}
                      stepNumber={docBinder.stepNumber}
                      documentType={evidence.documentType}
                      label={evidence.uploadLabel}
                      existing={docBinder.docs}
                      onChange={docBinder.onDocsChange}
                      compact
                      filePolicyId={evidence.filePolicyId}
                      inheritedDocs={inheritedDocs}
                      alternateDocumentTypes={evidence.legacyDocumentTypes}
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
