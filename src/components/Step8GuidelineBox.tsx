import {
  STEP8_GUIDELINE_ACTION_ITEMS,
  STEP8_GUIDELINE_WARNING_GUARANTEE,
  STEP8_GUIDELINE_WARNING_STAMP_DUTY,
  STEP8_SCHEDULE_INCOMPLETE_MSG,
  formatStep8GuidelineOverdueWarning,
  formatStep8TimelineNode1Line,
  formatStep8TimelineNode2Line,
  formatStep8TimelineNode3Line,
} from "@/lib/step8-guideline";

type Step8TimelineTrackProps = {
  earliestSigningISO: string;
  contractSignedDateISO: string;
  step7SigningDeadlineISO: string;
  step7ContractorReceivedISO: string;
};

function Step8TimelineTrack({
  earliestSigningISO,
  contractSignedDateISO,
  step7SigningDeadlineISO,
  step7ContractorReceivedISO,
}: Step8TimelineTrackProps) {
  const hasSignedDate = !!contractSignedDateISO?.trim();

  return (
    <div className="mt-4 space-y-0">
      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-emerald-400 to-amber-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🟢 จุดเริ่มต้น
          </p>
          <p className="text-sm text-slate-700 leading-relaxed mt-1">
            {formatStep8TimelineNode1Line(earliestSigningISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className={`h-3.5 w-3.5 rounded-full ring-4 ${
              hasSignedDate
                ? "bg-amber-500 ring-amber-100"
                : "bg-slate-300 ring-slate-100"
            }`}
            aria-hidden
          />
          <span className="flex-1 w-0.5 min-h-[2.5rem] bg-gradient-to-b from-amber-400 to-red-400 my-1" />
        </div>
        <div className="pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🟡 วันเซ็นจริง
          </p>
          <p
            className={`text-sm leading-relaxed mt-1 ${
              hasSignedDate
                ? "font-semibold text-blue-700 tabular-nums"
                : "text-slate-500 italic"
            }`}
          >
            {formatStep8TimelineNode2Line(contractSignedDateISO)}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center shrink-0 w-5">
          <span
            className="h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-100"
            aria-hidden
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            🔴 เดดไลน์เส้นตาย
          </p>
          <p className="text-sm text-slate-700 leading-relaxed mt-1">
            <span className="font-bold text-orange-700 tabular-nums">
              {formatStep8TimelineNode3Line(
                step7SigningDeadlineISO,
                step7ContractorReceivedISO,
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  /** วันที่เริ่มลงนามในสัญญาได้ — จากขั้นตอนที่ 6/7 (yyyy-mm-dd) */
  earliestSigningISO?: string | null;
  /** วันที่ลงนามสัญญาจริงจากฟอร์ม (yyyy-mm-dd) */
  contractSignedDate?: string | null;
  /** วันเส้นตายการลงนามจากขั้นตอนที่ 7 (yyyy-mm-dd) */
  step7SigningDeadlineISO?: string | null;
  /** วันที่ผู้ประกอบการได้รับหนังสือเชิญจากขั้นตอนที่ 7 */
  step7ContractorReceivedISO?: string | null;
};

export function Step8GuidelineBox({
  earliestSigningISO,
  contractSignedDate,
  step7SigningDeadlineISO,
  step7ContractorReceivedISO,
}: Props) {
  const earliestISO = earliestSigningISO?.trim() ?? "";
  const signedISO = contractSignedDate?.trim() ?? "";
  const deadlineISO = step7SigningDeadlineISO?.trim() ?? "";
  const receivedISO = step7ContractorReceivedISO?.trim() ?? "";
  const hasScheduleDates = !!earliestISO && !!deadlineISO;

  return (
    <div className="mb-4 space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-blue-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">📘 คุณต้องทำในขั้นตอนนี้</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
          {STEP8_GUIDELINE_ACTION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 border-l-4 border-l-green-500 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm">⏱️ การตรวจสอบกรอบเวลา</h3>
        {hasScheduleDates ? (
          <Step8TimelineTrack
            earliestSigningISO={earliestISO}
            contractSignedDateISO={signedISO}
            step7SigningDeadlineISO={deadlineISO}
            step7ContractorReceivedISO={receivedISO}
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {STEP8_SCHEDULE_INCOMPLETE_MSG}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-red-700">⚠️ ข้อควรระวังสูงสุด</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-red-700">
          <li>{STEP8_GUIDELINE_WARNING_GUARANTEE}</li>
          <li>{STEP8_GUIDELINE_WARNING_STAMP_DUTY}</li>
          <li>• หากเกินกำหนด: {formatStep8GuidelineOverdueWarning(deadlineISO)}</li>
        </ul>
      </section>
    </div>
  );
}
