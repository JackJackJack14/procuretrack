import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { HELPER_BUTTON_MD } from "@/lib/helper-button-styles";
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
      className={`${HELPER_BUTTON_MD} text-xs shrink-0`}
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
