import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { downloadStepAuditZip, type StepDocRecord } from "@/lib/doc-upload";

type Props = {
  stepNumber: number;
  stepLabel: string;
  docs: StepDocRecord[];
};

export function StepAuditZipButton({ stepNumber, stepLabel, docs }: Props) {
  const [loading, setLoading] = useState(false);
  const count = docs.filter((d) => d.step_number === stepNumber).length;

  return (
    <button
      type="button"
      disabled={loading || count === 0}
      title={count === 0 ? "ยังไม่มีไฟล์หลักฐานในขั้นตอนนี้" : `รวม ${count} ไฟล์เป็น ZIP`}
      onClick={async () => {
        setLoading(true);
        try {
          await downloadStepAuditZip(stepNumber, stepLabel, docs);
        } finally {
          setLoading(false);
        }
      }}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
      ดาวน์โหลดเอกสาร Audit (.zip)
    </button>
  );
}
