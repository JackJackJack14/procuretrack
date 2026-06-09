import { Check } from "lucide-react";
import type { DocItem } from "@/lib/procurement";
import type { StepDocRecord } from "@/lib/doc-upload";
import { StepDocumentHub } from "@/components/steps/StepDocumentHub";

type Props = {
  stepNumber: number;
  stepLabel: string;
  docList: DocItem[];
  docs: StepDocRecord[];
  projectName?: string;
};

/** มุมมองมาตรฐานเมื่อขั้นตอนเสร็จสิ้นแล้ว — ป้ายสถานะ + ตาราง Audit เท่านั้น */
export function CompletedStepView({
  stepNumber,
  stepLabel,
  docList,
  docs,
  projectName,
}: Props) {
  return (
    <div className="space-y-4 max-w-2xl min-w-0">
      <h3 className="text-lg font-semibold">
        ขั้นตอนที่ {stepNumber}: {stepLabel}
      </h3>
      <p className="text-sm text-success flex items-center gap-1.5 font-medium rounded-md border border-success/30 bg-success/10 px-3 py-2.5">
        <Check className="h-4 w-4 shrink-0" />
        ขั้นตอนนี้เสร็จสิ้นแล้ว
      </p>
      <StepDocumentHub
        stepNumber={stepNumber}
        docList={docList}
        docs={docs}
        projectName={projectName}
      />
    </div>
  );
}
