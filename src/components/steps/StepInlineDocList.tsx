import type { DocItem } from "@/lib/procurement";
import type { ProjectDocRef, StepDocRecord } from "@/lib/doc-upload";
import { InlineDocUpload } from "@/components/steps/InlineDocUpload";

type Props = {
  project: ProjectDocRef;
  stepNumber: number;
  docList: DocItem[];
  existing: StepDocRecord[];
  onChange: () => void;
  title?: string;
};

/** รายการอัปโหลดแบบกะทัดรัดสำหรับขั้นตอนที่ไม่มีฟิลด์ผูกเอกสารเฉพาะ (1, 2, 4, 5, 6+) */
export function StepInlineDocList({
  project,
  stepNumber,
  docList,
  existing,
  onChange,
  title = "เอกสารหลักฐานประจำขั้นตอน",
}: Props) {
  if (!docList.length) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="space-y-3">
        {docList.map((item) => (
          <div key={item.name}>
            <p className="text-sm text-foreground">
              {item.name}
              {item.required && (
                <span className="ml-1.5 text-xs text-destructive">*</span>
              )}
            </p>
            <InlineDocUpload
              project={project}
              stepNumber={stepNumber}
              documentType={item.name}
              label={`📎 อัปโหลด ${item.name}`}
              existing={existing}
              onChange={onChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
