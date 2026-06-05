import {
  formatBudgetBahtShort,
  getStep3HearingTier,
  getStep3TierAlert,
  STEP3_MANDATORY_GUIDELINES,
  type Step3SkipReason,
} from "@/lib/step3-hearing";

type Props = {
  budget: number;
  onSkip: (reason: Step3SkipReason) => void;
  onProceedHearing?: () => void;
  hearingProceed?: boolean;
  skipping?: boolean;
};

export function Step3GuidelineBox({
  budget,
  onSkip,
  onProceedHearing,
  hearingProceed = false,
  skipping = false,
}: Props) {
  const tier = getStep3HearingTier(budget);
  const alert = getStep3TierAlert(tier);
  const showDetailedGuide = tier === "mandatory" || (tier === "discretionary" && hearingProceed);

  return (
    <div className="rounded-lg p-4 mb-4 space-y-3" style={{ backgroundColor: "#F8FAFC", borderLeft: "4px solid #64748B" }}>
      <div className="font-semibold text-foreground">📋 ขั้นตอนที่ 3: จัดทำร่างประกาศและรับฟังความคิดเห็น</div>
      <p className="text-xs text-muted-foreground">
        วงเงินงบประมาณโครงการ: ฿{formatBudgetBahtShort(budget)} บาท
      </p>

      <div
        className="rounded-md px-3 py-2.5 text-sm font-medium"
        style={{
          backgroundColor: alert.bg,
          border: `1px solid ${alert.border}`,
          color: alert.text,
        }}
      >
        {alert.message}
      </div>

      {tier === "mandatory" && (
        <div
          className="rounded-md px-3 py-2 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}
        >
          บังคับดำเนินการจัดฟังคำวิจารณ์ — ต้องกรอกข้อมูลและแนบหลักฐานครบก่อนปิดขั้นตอน
        </div>
      )}

      {tier === "discretionary" && !hearingProceed && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={skipping}
            onClick={() => onSkip("discretionary")}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            ⏭️ ข้ามขั้นตอนการฟังคำวิจารณ์ร่างประกาศ
          </button>
          <button
            type="button"
            onClick={onProceedHearing}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            ดำเนินการจัดฟังคำวิจารณ์ร่างประกาศ
          </button>
        </div>
      )}

      {tier === "exempt" && (
        <button
          type="button"
          disabled={skipping}
          onClick={() => onSkip("exempt")}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          ⏭️ ข้ามขั้นตอนนี้อัตโนมัติ
        </button>
      )}

      {showDetailedGuide && (
        <div
          className="rounded-md p-3 space-y-2 text-sm"
          style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <p className="font-semibold text-foreground">💡 ไกด์ไลน์การบันทึกข้อมูลขั้นตอนที่ 3:</p>
          <ol className="list-decimal list-inside space-y-1 text-foreground/90">
            {STEP3_MANDATORY_GUIDELINES.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <p className="text-sm pt-1" style={{ color: "#EA580C" }}>
            <span className="font-medium">⚠️ ข้อควรระวัง:</span> วันที่เริ่มเผยแพร่ ต้องไม่น้อยกว่า (ไม่ย้อนหลัง)
            วันที่หัวหน้าหน่วยงานลงนามในหนังสือเห็นชอบ
          </p>
        </div>
      )}
    </div>
  );
}
