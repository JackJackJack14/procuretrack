import { Check, Lock } from "lucide-react";
import {
  buildEffectiveChecklist,
  countSmartChecklistProgressFromItems,
  type SmartChecklistItem,
} from "@/lib/smart-checklist";

type Props = {
  stepNumber: number;
  stepLabel: string;
  items: SmartChecklistItem[];
  manualChecklist: Record<string, boolean>;
  autoStates: Record<string, boolean>;
  onManualChange: (key: string, checked: boolean) => void;
  readOnly?: boolean;
};

export function SmartChecklist({
  stepNumber,
  stepLabel,
  items,
  manualChecklist,
  autoStates,
  onManualChange,
  readOnly = false,
}: Props) {
  const effective = buildEffectiveChecklist(stepNumber, manualChecklist, autoStates);
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
            Auto-Check จากข้อมูลฟอร์ม · Manual-Check ยืนยันหน้างาน · ครบ 100% ก่อนไปขั้นถัดไป
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            allDone
              ? "bg-success/15 text-success border border-success/30"
              : "bg-background text-muted-foreground border border-border"
          }`}
        >
          {done}/{total} ข้อ
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
          title="กลุ่มที่ 1: Auto-Check (ระบบตรวจอัตโนมัติ)"
          subtitle="ล็อกไม่ให้กดเอง — ติ๊กเมื่อข้อมูลในฟอร์ม/เอกสารครบ"
          items={autoItems}
          effective={effective}
        />
      )}

      {manualItems.length > 0 && (
        <ChecklistGroup
          title="กลุ่มที่ 2: Manual-Check (ตรวจเอกสารหน้างาน)"
          subtitle="เจ้าหน้าที่พัสดุต้องติ๊กยืนยันด้วยตนเอง 100%"
          items={manualItems}
          effective={effective}
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
  readOnly,
  onManualChange,
}: {
  title: string;
  subtitle: string;
  items: SmartChecklistItem[];
  effective: Record<string, boolean>;
  readOnly?: boolean;
  onManualChange?: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-2">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const checked = !!effective[item.key];
          const isAuto = item.mode === "manual" ? false : true;
          const isManual = item.mode === "manual";
          return (
            <div
              key={item.key}
              className={`flex items-start gap-2.5 text-sm rounded-md px-2 py-1.5 -mx-2 ${
                checked ? "text-foreground bg-success/5" : "text-muted-foreground"
              }`}
            >
              {isManual ? (
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
                  title="Auto-Check — ระบบตรวจอัตโนมัติ"
                >
                  {checked ? <Check className="h-3 w-3" /> : <Lock className="h-2.5 w-2.5" />}
                </span>
              )}
              <span>
                <span className="font-medium text-muted-foreground mr-1">{index + 1}.</span>
                {item.label}
                {item.hint && (
                  <span className="block text-xs text-muted-foreground mt-0.5 font-normal leading-relaxed">
                    ({item.hint})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
