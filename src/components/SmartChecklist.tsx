import { Check, Lock } from "lucide-react";
import { InlineDocUpload } from "@/components/steps/InlineDocUpload";
import {
  getInlineEvidenceByKey,
  hasInlineEvidenceDoc,
} from "@/lib/checklist-inline-evidence";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import {
  buildEffectiveChecklist,
  countSmartChecklistProgressFromItems,
  type SmartChecklistItem,
} from "@/lib/smart-checklist";

export type SmartChecklistDocBinder = {
  project: ProjectDocRef;
  stepNumber: number;
  docs: StepDocRecord[];
  onDocsChange: () => void;
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
};

export function SmartChecklist({
  stepNumber,
  stepLabel,
  items,
  manualChecklist,
  autoStates,
  onManualChange,
  readOnly = false,
  docBinder,
}: Props) {
  const evidenceByKey = getInlineEvidenceByKey(stepNumber);
  const stepDocs = docBinder?.docs ?? [];

  const isRowComplete = (item: SmartChecklistItem): boolean => {
    const evidence = evidenceByKey.get(item.key);
    if (evidence?.uploadDriven && docBinder) {
      const hasDoc = hasInlineEvidenceDoc(stepDocs, evidence.documentType);
      if (item.mode === "auto") return hasDoc && !!autoStates[item.key];
      return hasDoc;
    }
    if (item.mode === "auto") return !!autoStates[item.key];
    if (evidence && docBinder && !evidence.uploadDriven) {
      const hasDoc = hasInlineEvidenceDoc(stepDocs, evidence.documentType);
      return hasDoc && !!manualChecklist[item.key];
    }
    return !!manualChecklist[item.key];
  };

  const effective: Record<string, boolean> = {};
  items.forEach((item) => {
    effective[item.key] = isRowComplete(item);
  });

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
          title="กลุ่มที่ 1: Auto-Check (ระบบ + หลักฐานอัปโหลด)"
          subtitle="ติ๊กอัตโนมัติเมื่อข้อมูลฟอร์ม/ไฟล์หลักฐานครบ"
          items={autoItems}
          effective={effective}
          evidenceByKey={evidenceByKey}
          docBinder={docBinder}
          readOnly={readOnly}
          onManualChange={onManualChange}
        />
      )}

      {manualItems.length > 0 && (
        <ChecklistGroup
          title="กลุ่มที่ 2: Manual-Check (หลักฐานยันหน้างาน)"
          subtitle="แนบไฟล์ในแถว — ระบบติ๊กให้อัตโนมัติเมื่อมีหลักฐาน"
          items={manualItems}
          effective={effective}
          evidenceByKey={evidenceByKey}
          docBinder={docBinder}
          readOnly={readOnly}
          onManualChange={onManualChange}
        />
      )}
    </div>
  );
}

function ChecklistGroup({
  title,
  subtitle,
  items,
  effective,
  evidenceByKey,
  docBinder,
  readOnly,
  onManualChange,
}: {
  title: string;
  subtitle: string;
  items: SmartChecklistItem[];
  effective: Record<string, boolean>;
  evidenceByKey: Map<string, import("@/lib/checklist-inline-evidence").ChecklistInlineEvidence>;
  docBinder?: SmartChecklistDocBinder;
  readOnly?: boolean;
  onManualChange?: (key: string, checked: boolean) => void;
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
          const showManualCheckbox =
            item.mode === "manual" && evidence && !isUploadDriven && !docBinder;

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
                  </span>
                </div>

                {evidence && docBinder && (
                  <div className="shrink-0 sm:max-w-[240px] w-full sm:w-auto pl-6 sm:pl-0">
                    <InlineDocUpload
                      project={docBinder.project}
                      stepNumber={docBinder.stepNumber}
                      documentType={evidence.documentType}
                      label={evidence.uploadLabel}
                      existing={docBinder.docs}
                      onChange={docBinder.onDocsChange}
                      compact
                      filePolicyId={evidence.filePolicyId}
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

/** คำนวณความครบของ Checklist แบบ reactive (รวม inline upload) */
export function computeReactiveChecklistEffective(
  stepNumber: number,
  items: SmartChecklistItem[],
  manualChecklist: Record<string, boolean>,
  autoStates: Record<string, boolean>,
  docs: StepDocRecord[],
): { effective: Record<string, boolean>; done: number; total: number; allDone: boolean } {
  const evidenceByKey = getInlineEvidenceByKey(stepNumber);
  const effective: Record<string, boolean> = {};
  items.forEach((item) => {
    const evidence = evidenceByKey.get(item.key);
    if (evidence?.uploadDriven) {
      const hasDoc = hasInlineEvidenceDoc(docs, evidence.documentType);
      effective[item.key] =
        item.mode === "auto" ? hasDoc && !!autoStates[item.key] : hasDoc;
    } else if (item.mode === "auto") {
      effective[item.key] = !!autoStates[item.key];
    } else if (evidence) {
      effective[item.key] =
        hasInlineEvidenceDoc(docs, evidence.documentType) && !!manualChecklist[item.key];
    } else {
      effective[item.key] = !!manualChecklist[item.key];
    }
  });
  const { done, total, allDone } = countSmartChecklistProgressFromItems(items, effective);
  return { effective, done, total, allDone };
}
